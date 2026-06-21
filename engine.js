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
  let coins = 0, streak = 0, bestStreak = 0;
  let isAdmin = false;

  const CLEARED_KEY = 'ws_cleared_' + GameLang.id;
  const STARS_KEY   = 'ws_stars_'   + GameLang.id;
  let starsMap = {};
  try {
    const _sc = localStorage.getItem(CLEARED_KEY);
    if (_sc) clearedSet = new Set(JSON.parse(_sc));
    const _sm = localStorage.getItem(STARS_KEY);
    if (_sm) starsMap = JSON.parse(_sm);
  } catch(e) {}

  const SCORE_PER_WORD = 100, HINT_PENALTY = 20;
  const REWARDS = [
    { icon: "🥉", label: "Bronze badge" },
    { icon: "🎨", label: "Category unlocked" },
    { icon: "🥈", label: "Silver badge" },
    { icon: "⚡", label: "Speed solver" },
    { icon: "🥇", label: "Gold badge" },
    { icon: "👑", label: "Word master" },
  ];

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
    if (catIdx >= 0) try { localStorage.setItem('ws_lastCat_' + GameLang.id, CATEGORIES[catIdx].id); } catch(e) {}
    const cat   = CATEGORIES[catIdx];
    const size  = sizeForLevel(lvl);
    const dirs  = dirsForLevel(lvl);
    const count = wordCountForLevel(lvl, cat.words.length);
    const diff  = GameLang.ui.diffLabel(lvl);

    const bank = toWordObjs(cat.words);
    const words = shuffle(bank).slice(0, count);
    puzzle = Puzzle.generate(words, size, dirs);

    foundSet = new Set(); hintsLeft = 3; score = 0; seconds = 0; finished = false;
    coins = 0; streak = 0; bestStreak = 0;
    stopTimer(); startTimer();

    renderBoard(); renderWordList(); updateStats();

    $("levelPill").textContent = GameLang.ui.levelLabel(lvl + 1);
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
    const frag = () => {
      const f = document.createDocumentFragment();
      puzzle.placements.forEach(p => {
        const chip = document.createElement("span");
        chip.className = "word-chip" + (foundSet.has(p.kh) ? " done" : "");
        chip.dataset.kh = p.kh;
        chip.innerHTML = `<span class="kh">${p.kh}</span>` + (p.en ? `<span class="en">${p.en}</span>` : "");
        f.appendChild(chip);
      });
      return f;
    };
    const wrap = $("wordlist");  if (wrap) { wrap.innerHTML = ""; wrap.appendChild(frag()); }
    const mwrap = $("mobileWordlist"); if (mwrap) { mwrap.innerHTML = ""; mwrap.appendChild(frag()); }
  }

  function updateStats() {
    const total = puzzle.placements.length;
    $("statScore").textContent = score;
    $("statFound").textContent = `${foundSet.size}/${total}`;
    $("statTime").textContent  = fmt(seconds);
    const pb = $("progBar");
    if (pb) pb.style.width = (total ? foundSet.size / total * 100 : 0) + "%";
    const sc = $("statCoins");  if (sc) sc.textContent = coins;
    const ss = $("statStreak"); if (ss) ss.textContent = "×" + (1 + streak);
    const sp = $("streakPeb");  if (sp) sp.classList.toggle("dim", streak === 0);
  }

  function pushFloat(text) {
    const el = $("floats"); if (!el) return;
    const s = document.createElement("span");
    s.className = "float-txt"; s.textContent = text;
    el.appendChild(s);
    setTimeout(() => s.remove(), 1000);
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
    streak = 0; updateStats();
    Sound.wrong();
    GameLang.speak(GameLang.ui.wrongMsg);
    boardEl.classList.add("shake");
    setTimeout(() => boardEl.classList.remove("shake"), 320);
  }

  function markFound(p) {
    const mult = 1 + streak;
    const pts  = SCORE_PER_WORD * mult;
    streak++; bestStreak = Math.max(bestStreak, streak);
    coins += p.cells.length;
    foundSet.add(p.kh); score += pts;

    pushFloat("+" + pts + (mult > 1 ? "  ×" + mult : ""));

    p.path.forEach(([r,c]) => {
      const el = cellEls[r][c];
      el.classList.remove("selecting");
      el.classList.toggle("multi", el.classList.contains("found"));
      el.classList.add("found", "pop");
      setTimeout(() => el.classList.remove("pop"), 320);
    });
    [$("wordlist"), $("mobileWordlist")].forEach(w => {
      if (!w) return;
      const chip = w.querySelector(`[data-kh="${CSS.escape(p.kh)}"]`);
      if (chip) chip.classList.add("done");
    });
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
    streak = 0;
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

    const fast    = seconds < 25 + levelIndex * 10;
    const noHints = hintsLeft === 3;
    let stars = 1;
    if (fast || noHints) stars = 2;
    if (fast && noHints) stars = 3;

    const bonus      = Math.max(0, 300 - seconds * 2) + hintsLeft * 30;
    const coinReward = 8 + levelIndex * 2 + stars * 3;
    score += bonus; coins += coinReward;
    updateStats();
    Sound.win(); confetti();
    const _lvlKey = CATEGORIES[categoryIndex].id + "-" + levelIndex;
    clearedSet.add(_lvlKey);
    if ((starsMap[_lvlKey] || 0) < stars) starsMap[_lvlKey] = stars;
    try {
      localStorage.setItem(CLEARED_KEY, JSON.stringify([...clearedSet]));
      localStorage.setItem(STARS_KEY, JSON.stringify(starsMap));
    } catch(e) {}

    // Stars
    const starsEl = $("winStars");
    if (starsEl) starsEl.innerHTML = [0,1,2].map(i =>
      `<span class="win-star ${i < stars ? "on" : "off"}" style="animation-delay:${i*.12}s">⭐</span>`
    ).join("");

    // Tiles
    $("winTime").textContent   = fmt(seconds);
    $("winScore").textContent  = score;
    const strkEl = $("winStreak"); if (strkEl) strkEl.textContent = "×" + (1 + bestStreak);

    // Reward badge
    const reward = REWARDS[Math.min(levelIndex, REWARDS.length - 1)];
    const ri = $("winRewardIcon");    if (ri) ri.textContent = reward.icon;
    const rl = $("winRewardLabel");   if (rl) rl.textContent = reward.label;
    const rc = $("winCoins");         if (rc) rc.textContent = "+" + coinReward + " 🪙";

    // XP bar
    const xp = score + stars * 25;
    const xpEl = $("winXP"); if (xpEl) xpEl.textContent = "+" + xp + " XP";
    setTimeout(() => { const b = $("winXPBar"); if (b) b.style.width = "78%"; }, 300);

    $("winSub").textContent = GameLang.ui.winSub(puzzle.placements.length);

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
  function buildCategoryOptions(select, onChangeFn) {
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
    select.onchange = onChangeFn;
  }

  function buildLevelButtonsInto(container, catIdx, onLoadFn) {
    const cat = CATEGORIES[catIdx];
    container.innerHTML = "";
    for (let lvl = 0; lvl < 5; lvl++) {
      const size     = sizeForLevel(lvl);
      const diff     = GameLang.ui.diffLabel(lvl);
      const cleared  = clearedSet.has(cat.id + "-" + lvl);
      const unlocked = isAdmin || lvl === 0 || clearedSet.has(cat.id + "-" + (lvl-1));
      const active   = catIdx === categoryIndex && lvl === levelIndex;

      const btn = document.createElement("button");
      btn.className = "lvl-btn" + (active ? " active" : "") + (cleared ? " cleared" : "") + (!unlocked ? " locked" : "");
      btn.disabled = !unlocked;
      btn.innerHTML = !unlocked
        ? `<span class="lvl-num">🔒</span><span class="lvl-label">${GameLang.ui.levelLabel(lvl+1)}</span><span class="lvl-sub">${size}×${size} · ${diff}</span>`
        : `<span class="lvl-num">${lvl+1}</span><span class="lvl-label">${GameLang.ui.levelLabel(lvl+1)}</span><span class="lvl-sub">${size}×${size} · ${diff}</span>${cleared ? '<span class="lvl-check">✓</span>' : ""}`;
      btn.onclick = () => { if (unlocked) onLoadFn(catIdx, lvl); };
      container.appendChild(btn);
    }
  }

  function renderCategoryMap() {
    buildLevelButtonsInto($("levelButtons"), categoryIndex, load);

    // Mobile inline category select
    const mSel = $("mCatSelect");
    if (mSel) {
      buildCategoryOptions(mSel, () => {
        if (mSel.value === "custom") {
          new bootstrap.Modal($("customModal")).show();
          mSel.value = categoryIndex; return;
        }
        load(parseInt(mSel.value), 0);
      });
    }

    // Mobile inline level select
    buildMobileLvlSelect(categoryIndex);
  }

  function buildMobileLvlSelect(catIdx) {
    const sel = $("mLvlSelect"); if (!sel) return;
    const cat = CATEGORIES[catIdx];
    sel.innerHTML = "";
    for (let lvl = 0; lvl < 5; lvl++) {
      const unlocked = isAdmin || lvl === 0 || clearedSet.has(cat.id + "-" + (lvl - 1));
      const cleared  = clearedSet.has(cat.id + "-" + lvl);
      const opt = document.createElement("option");
      opt.value = lvl;
      opt.textContent = GameLang.ui.levelLabel(lvl + 1) + (cleared ? " ✓" : !unlocked ? " 🔒" : "");
      opt.disabled = !unlocked;
      sel.appendChild(opt);
    }
    sel.value = levelIndex;
    sel.onchange = () => load(catIdx, parseInt(sel.value));
  }

  function renderLevelButtons(catIdx) {
    buildLevelButtonsInto($("levelButtons"), catIdx, load);
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
      coins = 0; streak = 0; bestStreak = 0;
      stopTimer(); startTimer();
      renderBoard(); renderWordList(); updateStats();
      $("levelPill").textContent = "★";
      $("levelName").textContent = "Custom";
      $("levelMeta").textContent = puzzle.size + "×" + puzzle.size;
      $("hintCount").textContent = hintsLeft;
      renderCategoryMap();
    },
    setAdmin: (v) => { isAdmin = v; renderCategoryMap(); },
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

  // Unified pointer events (covers mouse + touch + stylus)
  boardEl.addEventListener("pointerdown", e => {
    const el = e.target.closest(".cell");
    if (el) { e.preventDefault(); boardEl.setPointerCapture(e.pointerId); beginDrag(el); }
  });
  boardEl.addEventListener("pointermove", e => {
    if (!e.buttons) return;
    const el = cellFromPoint(e.clientX, e.clientY);
    if (el) moveDrag(el);
  });
  boardEl.addEventListener("pointerup",     endDrag);
  boardEl.addEventListener("pointercancel", endDrag);

  document.getElementById("btnHint").onclick     = () => Game.useHint();
  document.getElementById("btnReset").onclick    = () => Game.restart();
  document.getElementById("btnShuffle").onclick  = () => Game.regenerate();
  document.getElementById("winNext").onclick     = () => Game.next();
  document.getElementById("winReplay").onclick   = () => Game.restart();
  document.getElementById("btnDownload").onclick = downloadPuzzleImage;
  document.getElementById("btnPrint").onclick    = () => window.print();

  const btnHelp = document.getElementById("btnHelp");
  if (btnHelp) btnHelp.onclick = () => new bootstrap.Modal(document.getElementById("helpModal")).show();

  const btnSound = document.getElementById("btnSound");
  // Restore saved sound preference (set from home page or previous session)
  if (localStorage.getItem('ws_sound') === '0') {
    Sound.setEnabled(false);
    btnSound.textContent = '🔇';
    btnSound.classList.add('muted-on');
  }
  btnSound.onclick = () => {
    const on = !Sound.isEnabled();
    Sound.setEnabled(on); Sound.resume();
    btnSound.textContent = on ? "🔊" : "🔇";
    btnSound.classList.toggle("muted-on", !on);
    if (on) Sound.click();
    try { localStorage.setItem('ws_sound', on ? '1' : '0'); } catch(e) {}
  };

  const btnTheme = document.getElementById("btnTheme");
  const _savedTheme = localStorage.getItem('ws_theme');
  if (_savedTheme) {
    document.documentElement.setAttribute('data-bs-theme', _savedTheme);
    btnTheme.textContent = _savedTheme === 'dark' ? '☀️' : '🌙';
  }
  btnTheme.onclick = () => {
    const html = document.documentElement;
    const dark = html.getAttribute("data-bs-theme") === "dark";
    const next = dark ? "light" : "dark";
    html.setAttribute("data-bs-theme", next);
    btnTheme.textContent = dark ? "🌙" : "☀️";
    try { localStorage.setItem('ws_theme', next); } catch(e) {}
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

  // Admin login
  const btnAdmin = document.getElementById("btnAdmin");
  if (btnAdmin) {
    let adminOn = false;

    // Auto-apply admin mode if logged in from home page
    if (sessionStorage.getItem('ws_admin') === '1') {
      adminOn = true;
      Game.setAdmin(true);
      btnAdmin.textContent = "👑";
      btnAdmin.title = "Admin mode — click to logout";
      btnAdmin.classList.remove("btn-outline-secondary");
      btnAdmin.classList.add("btn-warning", "text-dark");
    }

    function doAdminLogin() {
      const user = document.getElementById("adminUser").value.trim();
      const pass = document.getElementById("adminPass").value;
      const errEl = document.getElementById("adminError");
      errEl.classList.add("d-none");
      fetch("admin.json")
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(creds => {
          if (user.toLowerCase() === creds.username.toLowerCase() && pass === creds.password) {
            adminOn = true;
            Game.setAdmin(true);
            bootstrap.Modal.getInstance(document.getElementById("adminModal"))?.hide();
            btnAdmin.textContent = "👑";
            btnAdmin.title = "Admin mode — click to logout";
            btnAdmin.classList.remove("btn-outline-secondary");
            btnAdmin.classList.add("btn-warning", "text-dark");
          } else {
            errEl.textContent = "Wrong username or password.";
            errEl.classList.remove("d-none");
          }
        })
        .catch(() => {
          errEl.textContent = "Could not read admin.json.";
          errEl.classList.remove("d-none");
        });
    }

    btnAdmin.addEventListener("click", () => {
      if (adminOn) {
        adminOn = false;
        Game.setAdmin(false);
        btnAdmin.textContent = "🔐";
        btnAdmin.title = "Admin login";
        btnAdmin.classList.add("btn-outline-secondary");
        btnAdmin.classList.remove("btn-warning", "text-dark");
      } else {
        document.getElementById("adminUser").value = "";
        document.getElementById("adminPass").value = "";
        document.getElementById("adminError").classList.add("d-none");
        new bootstrap.Modal(document.getElementById("adminModal")).show();
      }
    });

    document.getElementById("btnAdminLogin").addEventListener("click", doAdminLogin);
    document.getElementById("adminPass").addEventListener("keydown", e => {
      if (e.key === "Enter") doAdminLogin();
    });
  }

  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt=setTimeout(() => Game.fitFont(), 120); });

  // Start at category passed from home.html, or default 0
  const _sc = sessionStorage.getItem('ws_startCat');
  if (_sc) {
    const _idx = CATEGORIES.findIndex(c => c.id === _sc);
    sessionStorage.removeItem('ws_startCat');
    Game.load(_idx >= 0 ? _idx : 0, 0);
  } else {
    Game.load(0);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => Game.fitFont()));

  // Show help only on first ever visit
  const helpEl = document.getElementById("helpModal");
  if (helpEl && !localStorage.getItem('ws_help_seen')) {
    setTimeout(() => {
      new bootstrap.Modal(helpEl).show();
      try { localStorage.setItem('ws_help_seen', '1'); } catch(e) {}
    }, 400);
  }
})();
