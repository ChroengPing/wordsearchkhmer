"use strict";

/* -----------------------------------------------------------------------
 * Shared game engine — language agnostic.
 * Requires data-km.js OR data-en.js to be loaded first, which exposes:
 *   window.GameLang   — segmenter, filler, speak, ui strings
 *   window.CATEGORIES — word bank array
 * --------------------------------------------------------------------- */

/* ---------------------------------------------------------------------
 * 1. Level scaling helpers
 * ------------------------------------------------------------------- */
function sizeForLevel(lvl)  { return 8 + lvl; }
function dirsForLevel(lvl)  { return lvl < 2 ? "easy" : lvl < 4 ? "diag" : "hard"; }
function wordCountForLevel(lvl, bankLen) { return Math.min(bankLen, 5 + lvl); }

/* ---------------------------------------------------------------------
 * 2. Sound
 * ------------------------------------------------------------------- */
const Sound = (() => {
  let ctx = null, enabled = true;
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur = 0.12, type = "sine", vol = 0.18, when = 0) {
    if (!enabled || !ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  return {
    setEnabled(v) { enabled = v; },
    isEnabled()   { return enabled; },
    resume: ensure,
    click()  { tone(420, 0.05, "triangle", 0.06); },
    found()  { tone(660, 0.10, "sine", 0.2); tone(880, 0.14, "sine", 0.2, 0.08); },
    wrong()  { tone(180, 0.16, "sawtooth", 0.12); },
    hint()   { tone(520, 0.09, "triangle", 0.14); tone(700, 0.09, "triangle", 0.14, 0.09); },
    win()    { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "sine", 0.2, i * 0.11)); },
  };
})();

/* ---------------------------------------------------------------------
 * 3. Puzzle generator
 * ------------------------------------------------------------------- */
const Puzzle = (() => {
  const DIRS = {
    easy: [[0,1],[1,0]],
    diag: [[0,1],[1,0],[1,1],[1,-1]],
    hard: [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]],
  };
  const shuffle = a => { for (let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];} return a; };

  function generate(words, size, dirsMode) {
    const dirs    = DIRS[dirsMode] || DIRS.hard;
    const longest = words.reduce((m, w) => Math.max(m, w.cells.length), 0);
    size = Math.max(size, longest + 1, 6);
    const ordered = [...words].sort((a, b) => b.cells.length - a.cells.length);

    for (let attempt = 0; attempt < 60; attempt++) {
      const grid = Array.from({ length: size }, () => Array(size).fill(null));
      const placements = []; let ok = true;
      for (const w of ordered) {
        if (!placeOne(grid, size, w, dirs, placements)) { ok = false; break; }
      }
      if (!ok) continue;
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
          if (grid[r][c] === null) grid[r][c] = GameLang.randomFiller();
      return { grid, size, placements };
    }
    return generate(words, size + 1, dirsMode);
  }

  function placeOne(grid, size, w, dirs, placements) {
    const cells = w.cells, L = cells.length;
    const dirList = shuffle([...dirs]);
    for (let t = 0; t < 200; t++) {
      const [dr, dc] = dirList[t % dirList.length];
      const r0 = (Math.random() * size) | 0, c0 = (Math.random() * size) | 0;
      const rEnd = r0 + dr * (L-1), cEnd = c0 + dc * (L-1);
      if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;
      let fits = true; const path = [];
      for (let k = 0; k < L; k++) {
        const r = r0+dr*k, c = c0+dc*k, ex = grid[r][c];
        if (ex !== null && ex !== cells[k]) { fits = false; break; }
        path.push([r, c]);
      }
      if (!fits) continue;
      path.forEach(([r,c], k) => { grid[r][c] = cells[k]; });
      placements.push({ kh: w.kh, en: w.en || "", cells, path });
      return true;
    }
    return false;
  }

  return { generate };
})();

/* ---------------------------------------------------------------------
 * 4. Game
 * ------------------------------------------------------------------- */
const Game = (() => {
  const $ = id => document.getElementById(id);
  const boardEl = $("board");

  let categoryIndex = 0, levelIndex = 0;
  let puzzle = null, foundSet = new Set(), clearedSet = new Set();
  let cellEls = [], dragging = false, startRC = null, currentPath = [];
  let hintsLeft = 3, score = 0, timerId = null, seconds = 0, finished = false;

  const SCORE_PER_WORD = 100, HINT_PENALTY = 20;

  function shuffle(a) {
    const b = [...a];
    for (let i = b.length-1; i > 0; i--) { const j=(Math.random()*(i+1))|0; [b[i],b[j]]=[b[j],b[i]]; }
    return b;
  }

  function toWordObjs(rawWords) {
    return rawWords
      .map(w => ({ kh: w.kh, en: w.en || "", cells: GameLang.segment(w.kh) }))
      .filter(w => w.cells.length >= 2);
  }

  function load(catIdx, lvl = 0) {
    categoryIndex = catIdx; levelIndex = lvl;
    const cat   = CATEGORIES[catIdx];
    const size  = sizeForLevel(lvl);
    const dirs  = dirsForLevel(lvl);
    const count = wordCountForLevel(lvl, cat.words.length);
    const diff  = GameLang.ui.diffLabel(lvl);

    const bank = toWordObjs(cat.words);
    const words = shuffle(bank).slice(0, count);
    puzzle = Puzzle.generate(words, size, dirs);

    foundSet = new Set(); hintsLeft = 3; score = 0; seconds = 0; finished = false;
    stopTimer(); startTimer();

    renderBoard(); renderWordList(); updateStats();

    $("levelPill").textContent = GameLang.ui.levelPrefix + (lvl + 1);
    $("levelName").textContent = cat.icon + " " + cat.name + (cat.en ? " · " + cat.en : "");
    $("levelMeta").textContent = size + "×" + size + " · " + diff;
    $("hintCount").textContent = hintsLeft;
    renderCategoryMap();
  }

  function renderBoard() {
    const N = puzzle.size;
    boardEl.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    boardEl.style.gridTemplateRows    = `repeat(${N}, 1fr)`;
    boardEl.innerHTML = "";
    cellEls = Array.from({ length: N }, () => Array(N));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const d = document.createElement("div");
        d.className = "cell"; d.textContent = puzzle.grid[r][c];
        d.dataset.r = r; d.dataset.c = c; d.setAttribute("role", "gridcell");
        boardEl.appendChild(d); cellEls[r][c] = d;
      }
    }
    fitFont();
  }

  function fitFont() {
    const N = puzzle.size;
    const w = boardEl.clientWidth || boardEl.getBoundingClientRect().width;
    const cell = w / N;
    const scale = GameLang.fontScale * (N >= 14 ? 0.82 : N >= 12 ? 0.91 : 1);
    boardEl.style.fontSize = Math.max(9, cell * scale) + "px";
  }

  function renderWordList() {
    const wrap = $("wordlist"); wrap.innerHTML = "";
    puzzle.placements.forEach(p => {
      const chip = document.createElement("span");
      chip.className = "word-chip" + (foundSet.has(p.kh) ? " done" : "");
      chip.dataset.kh = p.kh;
      chip.innerHTML = `<span class="kh">${p.kh}</span>` + (p.en ? `<span class="en">${p.en}</span>` : "");
      wrap.appendChild(chip);
    });
  }

  function updateStats() {
    $("statScore").textContent = score;
    $("statFound").textContent = `${foundSet.size}/${puzzle.placements.length}`;
    $("statTime").textContent  = fmt(seconds);
  }
  const fmt = s => `${(s/60|0)}:${String(s%60).padStart(2,"0")}`;

  function startTimer() {
    timerId = setInterval(() => { if (!finished) { seconds++; $("statTime").textContent = fmt(seconds); } }, 1000);
  }
  function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

  /* ====================== INPUT ====================== */
  function cellFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && el.classList.contains("cell") ? el : null;
  }
  function rcOf(el) { return [+el.dataset.r, +el.dataset.c]; }

  function linePath(sr, sc, r, c) {
    const dr = r-sr, dc = c-sc; let stepR, stepC, len;
    if (dr===0 && dc===0) return [[sr,sc]];
    if (dr===0) { stepR=0; stepC=Math.sign(dc); len=Math.abs(dc); }
    else if (dc===0) { stepR=Math.sign(dr); stepC=0; len=Math.abs(dr); }
    else if (Math.abs(dr)===Math.abs(dc)) { stepR=Math.sign(dr); stepC=Math.sign(dc); len=Math.abs(dr); }
    else return null;
    const path = [];
    for (let k=0; k<=len; k++) path.push([sr+stepR*k, sc+stepC*k]);
    return path;
  }

  function clearSelecting() {
    currentPath.forEach(([r,c]) => cellEls[r][c].classList.remove("selecting"));
    currentPath = [];
  }
  function paintSelecting(path) {
    clearSelecting(); currentPath = path;
    path.forEach(([r,c]) => cellEls[r][c].classList.add("selecting"));
  }

  function beginDrag(el) {
    if (finished) return;
    Sound.resume(); dragging = true; startRC = rcOf(el);
    paintSelecting([startRC]); Sound.click();
  }
  function moveDrag(el) {
    if (!dragging || !el) return;
    const [r,c] = rcOf(el);
    const path = linePath(startRC[0], startRC[1], r, c);
    if (path) paintSelecting(path);
  }
  function endDrag() {
    if (!dragging) return;
    dragging = false; evaluate(currentPath); clearSelecting(); startRC = null;
  }

  function evaluate(path) {
    if (!path || path.length < 2) return;
    const seq = path.map(([r,c]) => puzzle.grid[r][c]).join("|");
    for (const p of puzzle.placements) {
      if (foundSet.has(p.kh)) continue;
      const fwd = p.cells.join("|"), rev = [...p.cells].reverse().join("|");
      if (seq === fwd || seq === rev) { markFound(p); return; }
    }
    Sound.wrong();
    GameLang.speak(GameLang.ui.wrongMsg);
    boardEl.classList.add("shake");
    setTimeout(() => boardEl.classList.remove("shake"), 320);
  }

  function markFound(p) {
    foundSet.add(p.kh); score += SCORE_PER_WORD;
    p.path.forEach(([r,c]) => {
      const el = cellEls[r][c];
      el.classList.remove("selecting");
      el.classList.toggle("multi", el.classList.contains("found"));
      el.classList.add("found", "pop");
      setTimeout(() => el.classList.remove("pop"), 320);
    });
    const chip = $("wordlist").querySelector(`[data-kh="${CSS.escape(p.kh)}"]`);
    if (chip) chip.classList.add("done");
    Sound.found();
    GameLang.speak(GameLang.ui.rightMsg);
    updateStats();
    if (foundSet.size === puzzle.placements.length) winLevel();
  }

  function useHint() {
    if (finished || hintsLeft <= 0) return;
    const remaining = puzzle.placements.filter(p => !foundSet.has(p.kh));
    if (!remaining.length) return;
    const p = remaining[(Math.random() * remaining.length) | 0];
    hintsLeft--; score = Math.max(0, score - HINT_PENALTY);
    $("hintCount").textContent = hintsLeft;
    updateStats(); Sound.hint();
    p.path.slice(0,2).forEach(([r,c]) => {
      const el = cellEls[r][c];
      el.classList.add("hint");
      setTimeout(() => el.classList.remove("hint"), 3400);
    });
  }

  function winLevel() {
    finished = true; stopTimer();
    const bonus = Math.max(0, 300 - seconds*2) + hintsLeft*30;
    score += bonus; updateStats();
    Sound.win(); confetti();
    clearedSet.add(CATEGORIES[categoryIndex].id + "-" + levelIndex);

    $("winTime").textContent  = fmt(seconds);
    $("winScore").textContent = score;
    $("winBonus").textContent = "+" + bonus;
    $("winSub").textContent   = GameLang.ui.winSub(puzzle.placements.length);

    const hasNextLvl = levelIndex < 4;
    const hasNextCat = !hasNextLvl && categoryIndex < CATEGORIES.length - 1;
    const allDone    = !hasNextLvl && !hasNextCat;

    const winNextBtn = $("winNext");
    winNextBtn.classList.toggle("hidden", allDone);
    winNextBtn.textContent = hasNextLvl
      ? GameLang.ui.nextLevel(levelIndex + 2)
      : GameLang.ui.nextCategory;
    $("winAllCleared").classList.toggle("hidden", !allDone);
    new bootstrap.Modal($("winModal")).show();
  }

  function confetti() {
    const root = $("confetti");
    const colors = ["#c1121f","#1f8a70","#ffd24d","#6aa9ff","#34c38f","#ff7ab6"];
    for (let i = 0; i < 90; i++) {
      const b = document.createElement("div");
      b.className = "confetti-bit";
      b.style.cssText = `left:${Math.random()*100}vw;top:-20px;background:${colors[(Math.random()*colors.length)|0]};animation-duration:${1.6+Math.random()*1.6}s;animation-delay:${Math.random()*0.3}s;transform:rotate(${Math.random()*360}deg)`;
      root.appendChild(b);
      setTimeout(() => b.remove(), 3600);
    }
  }

  /* ---- Category dropdown + level list ---- */
  function renderCategoryMap() {
    const select = $("categorySelect");
    select.innerHTML = "";
    CATEGORIES.forEach((cat, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = cat.icon + " " + cat.name + (cat.en ? " · " + cat.en : "");
      select.appendChild(opt);
    });
    const customOpt = document.createElement("option");
    customOpt.value = "custom";
    customOpt.textContent = "✏️ Custom";
    select.appendChild(customOpt);

    select.value = categoryIndex;
    select.onchange = () => {
      if (select.value === "custom") {
        new bootstrap.Modal($("customModal")).show();
        select.value = categoryIndex; return;
      }
      renderLevelButtons(parseInt(select.value));
    };
    renderLevelButtons(categoryIndex);
  }

  function renderLevelButtons(catIdx) {
    const btnRow = $("levelButtons");
    const cat    = CATEGORIES[catIdx];
    btnRow.innerHTML = "";
    for (let lvl = 0; lvl < 5; lvl++) {
      const size     = sizeForLevel(lvl);
      const diff     = GameLang.ui.diffLabel(lvl);
      const cleared  = clearedSet.has(cat.id + "-" + lvl);
      const unlocked = lvl === 0 || clearedSet.has(cat.id + "-" + (lvl-1));
      const active   = catIdx === categoryIndex && lvl === levelIndex;

      const btn = document.createElement("button");
      btn.className = "lvl-btn" + (active ? " active" : "") + (cleared ? " cleared" : "") + (!unlocked ? " locked" : "");
      btn.disabled = !unlocked;
      btn.innerHTML = !unlocked
        ? `<span class="lvl-num">🔒</span><span class="lvl-label">${GameLang.ui.levelLabel(lvl+1)}</span><span class="lvl-sub">${size}×${size} · ${diff}</span>`
        : `<span class="lvl-num">${lvl+1}</span><span class="lvl-label">${GameLang.ui.levelLabel(lvl+1)}</span><span class="lvl-sub">${size}×${size} · ${diff}</span>${cleared ? '<span class="lvl-check">✓</span>' : ""}`;
      btn.onclick = () => { if (unlocked) load(catIdx, lvl); };
      btnRow.appendChild(btn);
    }
  }

  return {
    load, fitFont, useHint,
    getState: () => ({ puzzle, foundSet, level: CATEGORIES[categoryIndex] }),
    restart:    () => load(categoryIndex, levelIndex),
    regenerate: () => load(categoryIndex, levelIndex),
    next: () => {
      if (levelIndex < 4) load(categoryIndex, levelIndex + 1);
      else if (categoryIndex < CATEGORIES.length - 1) load(categoryIndex + 1, 0);
    },
    playCustom: (words, size, dirs) => {
      categoryIndex = -1; levelIndex = 0;
      const segs = words.map(w => ({ ...w, cells: GameLang.segment(w.kh) })).filter(w => w.cells.length >= 2);
      puzzle = Puzzle.generate(segs, size, dirs);
      foundSet = new Set(); hintsLeft = 3; score = 0; seconds = 0; finished = false;
      stopTimer(); startTimer();
      renderBoard(); renderWordList(); updateStats();
      $("levelPill").textContent = "★";
      $("levelName").textContent = "Custom";
      $("levelMeta").textContent = puzzle.size + "×" + puzzle.size;
      $("hintCount").textContent = hintsLeft;
      renderCategoryMap();
    },
    _input: { boardEl, beginDrag, moveDrag, endDrag, cellFromPoint },
  };
})();

/* ---------------------------------------------------------------------
 * 5. Download as PNG
 * ------------------------------------------------------------------- */
function drawRoundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") { ctx.beginPath(); ctx.roundRect(x,y,w,h,r); return; }
  const R = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+R,y); ctx.lineTo(x+w-R,y); ctx.arcTo(x+w,y,x+w,y+R,R);
  ctx.lineTo(x+w,y+h-R); ctx.arcTo(x+w,y+h,x+w-R,y+h,R);
  ctx.lineTo(x+R,y+h); ctx.arcTo(x,y+h,x,y+h-R,R);
  ctx.lineTo(x,y+R); ctx.arcTo(x,y,x+R,y,R); ctx.closePath();
}

function downloadPuzzleImage() {
  const { puzzle, foundSet, level } = Game.getState();
  const N = puzzle.size;
  const CELL=48, GAP=3, PAD=24, TITLE_H=72;
  const boardPx = N*CELL + (N-1)*GAP;
  const W = Math.max(boardPx + PAD*2, 360);

  const scratch = document.createElement("canvas").getContext("2d");
  scratch.font = `14px system-ui,sans-serif`;
  let wlRows=1, wlCurX=PAD;
  puzzle.placements.forEach(p => {
    const tw = scratch.measureText(p.kh).width + 20;
    if (wlCurX+tw > W-PAD) { wlRows++; wlCurX=PAD; } wlCurX+=tw+8;
  });
  const H = TITLE_H + boardPx + PAD + wlRows*36 + 52;

  const canvas = document.createElement("canvas");
  const DPR=2; canvas.width=W*DPR; canvas.height=H*DPR;
  const ctx = canvas.getContext("2d"); ctx.scale(DPR,DPR);

  ctx.fillStyle="#f8fafc"; ctx.fillRect(0,0,W,H);
  drawRoundRect(ctx,PAD-10,TITLE_H-8,boardPx+20,boardPx+20,18);
  ctx.fillStyle="#ffffff"; ctx.fill(); ctx.strokeStyle="#e0e4ee"; ctx.lineWidth=1; ctx.stroke();

  ctx.textAlign="center"; ctx.textBaseline="alphabetic";
  ctx.fillStyle="#c1121f"; ctx.font=`bold 18px system-ui,sans-serif`;
  ctx.fillText(level.icon + " " + level.name, W/2, 28);
  ctx.fillStyle="#666"; ctx.font=`13px system-ui,sans-serif`;
  ctx.fillText("Word Search", W/2, 52);

  const foundCells = new Set();
  puzzle.placements.forEach(p => { if (foundSet.has(p.kh)) p.path.forEach(([r,c]) => foundCells.add(r+","+c)); });

  const fs = Math.max(10, CELL*0.44);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  for (let r=0; r<N; r++) for (let c=0; c<N; c++) {
    const x=PAD+c*(CELL+GAP), y=TITLE_H+r*(CELL+GAP), hit=foundCells.has(r+","+c);
    drawRoundRect(ctx,x,y,CELL,CELL,8);
    ctx.fillStyle=hit?"#34c38f":"#f4f6fb"; ctx.fill();
    ctx.strokeStyle="#dfe4ee"; ctx.lineWidth=0.5; ctx.stroke();
    ctx.fillStyle=hit?"#06301f":"#243049";
    ctx.font=`600 ${fs}px system-ui,sans-serif`;
    ctx.fillText(puzzle.grid[r][c], x+CELL/2, y+CELL/2);
  }

  const WY0=TITLE_H+boardPx+PAD;
  ctx.fillStyle="#888"; ctx.font=`11px system-ui,sans-serif`;
  ctx.textAlign="left"; ctx.textBaseline="alphabetic";
  ctx.fillText("Words to find", PAD, WY0+14);
  let wx=PAD, wy=WY0+26;
  puzzle.placements.forEach(p => {
    ctx.font=`14px system-ui,sans-serif`;
    const tw=ctx.measureText(p.kh).width+20;
    if (wx+tw>W-PAD) { wx=PAD; wy+=36; }
    drawRoundRect(ctx,wx,wy,tw,28,999);
    ctx.fillStyle="#eef0f8"; ctx.fill(); ctx.strokeStyle="#d8dce8"; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle="#243049"; ctx.textAlign="left"; ctx.textBaseline="middle";
    ctx.fillText(p.kh, wx+10, wy+14);
    wx+=tw+8;
  });

  const link = document.createElement("a");
  link.download="word-search.png";
  link.href=canvas.toDataURL("image/png"); link.click();
}

/* ---------------------------------------------------------------------
 * 6. UI wiring
 * ------------------------------------------------------------------- */
(function wire() {
  const { boardEl, beginDrag, moveDrag, endDrag, cellFromPoint } = Game._input;

  boardEl.addEventListener("mousedown", e => {
    const el = e.target.closest(".cell"); if (el) { e.preventDefault(); beginDrag(el); }
  });
  document.addEventListener("mousemove", e => {
    if (e.buttons) { const el = cellFromPoint(e.clientX, e.clientY); if (el) moveDrag(el); }
  });
  document.addEventListener("mouseup", endDrag);

  boardEl.addEventListener("touchstart", e => {
    const t=e.touches[0], el=cellFromPoint(t.clientX,t.clientY);
    if (el) { e.preventDefault(); beginDrag(el); }
  }, { passive: false });
  boardEl.addEventListener("touchmove", e => {
    const t=e.touches[0], el=cellFromPoint(t.clientX,t.clientY);
    if (el) { e.preventDefault(); moveDrag(el); }
  }, { passive: false });
  document.addEventListener("touchend", endDrag);
  document.addEventListener("touchcancel", endDrag);

  document.getElementById("btnHint").onclick     = () => Game.useHint();
  document.getElementById("btnReset").onclick    = () => Game.restart();
  document.getElementById("btnShuffle").onclick  = () => Game.regenerate();
  document.getElementById("winNext").onclick     = () => Game.next();
  document.getElementById("winReplay").onclick   = () => Game.restart();
  document.getElementById("btnDownload").onclick = downloadPuzzleImage;
  document.getElementById("btnPrint").onclick    = () => window.print();

  const btnSound = document.getElementById("btnSound");
  btnSound.onclick = () => {
    const on = !Sound.isEnabled();
    Sound.setEnabled(on); Sound.resume();
    btnSound.textContent = on ? "🔊" : "🔇";
    btnSound.classList.toggle("muted-on", !on);
    if (on) Sound.click();
  };

  const btnTheme = document.getElementById("btnTheme");
  btnTheme.onclick = () => {
    const html = document.documentElement;
    const dark = html.getAttribute("data-bs-theme") === "dark";
    html.setAttribute("data-bs-theme", dark ? "light" : "dark");
    btnTheme.textContent = dark ? "🌙" : "☀️";
  };

  document.getElementById("btnPlayCustom").onclick = () => {
    const raw = document.getElementById("customInput").value;
    const errEl = document.getElementById("customError");
    errEl.textContent = "";
    const words = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      .map(kh => ({ kh, en: "" }))
      .filter(w => GameLang.segment(w.kh).length >= 2);
    if (words.length < 2) {
      errEl.textContent = "Please enter at least 2 words with 2+ characters each.";
      new bootstrap.Modal(document.getElementById("customModal")).show();
      return;
    }
    const size = parseInt(document.getElementById("customSize").value, 10) || 0;
    const dirs = document.getElementById("customDirs").value;
    Game.playCustom(words, size, dirs);
  };

  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt=setTimeout(() => Game.fitFont(), 120); });

  Game.load(0);
  // Re-run fitFont after layout settles so the board-wrap final size is known
  requestAnimationFrame(() => requestAnimationFrame(() => Game.fitFont()));
})();
