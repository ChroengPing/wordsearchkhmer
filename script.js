/* =======================================================================
 *  KHMER WORD SEARCH — game engine
 *  Modular, dependency-free (besides Bootstrap for layout/modals).
 *  Sections:
 *    1. KhmerText  — cluster segmentation + filler alphabet
 *    2. LEVELS      — curated bilingual word data
 *    3. Sound       — Web-Audio generated effects (no asset files)
 *    4. Puzzle      — grid generation & word placement
 *    5. Game         — state, rendering, input, hints, timer, scoring
 *    6. UI wiring    — buttons, theme, modals, init
 * ===================================================================== */
"use strict";

/* ---------------------------------------------------------------------
 * 1. KhmerText — turn a Khmer string into orthographic-syllable clusters
 *    so that one grid cell holds one readable "letter" (base + coeng
 *    subscripts + vowels + signs stay together).
 * ------------------------------------------------------------------- */
const KhmerText = (() => {
  const COENG = 0x17D2;                       // ្  — binds the next consonant as a subscript
  const isBase = c => c >= 0x1780 && c <= 0x17B3;            // consonants + independent vowels
  const isCombining = c =>
    (c >= 0x17B4 && c <= 0x17D1) ||           // dependent vowels + most signs
    c === 0x17DD ||                           // atthacan
    c === 0x200C || c === 0x200D;             // ZWNJ / ZWJ

  /** Segment a string into an array of cluster strings. */
  function segment(text) {
    const chars = Array.from(text);
    const out = [];
    let i = 0;
    while (i < chars.length) {
      const cp = chars[i].codePointAt(0);
      if (isBase(cp)) {
        let cl = chars[i++];
        while (i < chars.length) {
          const n = chars[i].codePointAt(0);
          if (n === COENG) {                  // coeng + following consonant join the cluster
            cl += chars[i++];
            if (i < chars.length) cl += chars[i++];
          } else if (isCombining(n)) {
            cl += chars[i++];
          } else break;
        }
        out.push(cl);
      } else {
        // skip spaces; keep other single chars (latin/digits) as their own cell
        if (chars[i].trim() !== "") out.push(chars[i]);
        i++;
      }
    }
    return out;
  }

  // Single-consonant pool used to fill empty cells with plausible Khmer letters.
  const FILLER = Array.from("កខគឃងចឆជឈញដឋឌឍណតថទធនបផពភមយរលវសហឡអ");
  const randomFiller = () => FILLER[(Math.random() * FILLER.length) | 0];

  return { segment, randomFiller };
})();

/* ---------------------------------------------------------------------
 * 2. LEVELS — curated, bilingual word sets. Each entry: {kh, en}.
 *    These are common, everyday Khmer words. The English gloss is shown
 *    as a learning aid; edit freely via the Custom-words panel.
 * ------------------------------------------------------------------- */
const LEVELS = [
  { id: 1, name: "សត្វ", en: "Animals", size: 8, dirs: "easy", words: [
    {kh:"ដំរី",en:"elephant"},{kh:"ទន្សាយ",en:"rabbit"},{kh:"ក្រពើ",en:"crocodile"},
    {kh:"កណ្ដុរ",en:"rat"},{kh:"ពពែ",en:"goat"},{kh:"ក្របី",en:"buffalo"},
  ]},
  { id: 2, name: "ធម្មជាតិ", en: "Nature", size: 9, dirs: "diag", words: [
    {kh:"ទន្លេ",en:"river"},{kh:"សមុទ្រ",en:"sea"},{kh:"ដើមឈើ",en:"tree"},
    {kh:"ស្លឹក",en:"leaf"},{kh:"ផ្កាយ",en:"star"},{kh:"ខ្យល់",en:"wind"},
    {kh:"ព្រះអាទិត្យ",en:"sun"},
  ]},
  { id: 3, name: "ពណ៌", en: "Colors", size: 10, dirs: "diag", words: [
    {kh:"ក្រហម",en:"red"},{kh:"លឿង",en:"yellow"},{kh:"បៃតង",en:"green"},
    {kh:"ខៀវ",en:"blue"},{kh:"ត្នោត",en:"brown"},{kh:"ប្រផេះ",en:"grey"},
    {kh:"ពណ៌",en:"color"},
  ]},
  { id: 4, name: "អាហារ", en: "Food", size: 11, dirs: "hard", words: [
    {kh:"បាយ",en:"rice"},{kh:"នំបុ័ង",en:"bread"},{kh:"សាច់",en:"meat"},
    {kh:"បន្លែ",en:"vegetable"},{kh:"ផ្លែឈើ",en:"fruit"},{kh:"ទឹក",en:"water"},
    {kh:"អំបិល",en:"salt"},{kh:"ស្វាយ",en:"mango"},
  ]},
  { id: 5, name: "សាលារៀន", en: "School", size: 12, dirs: "hard", words: [
    {kh:"សៀវភៅ",en:"book"},{kh:"ប៊ិច",en:"pen"},{kh:"សាលា",en:"school"},
    {kh:"សិស្ស",en:"student"},{kh:"ខ្មៅដៃ",en:"pencil"},{kh:"បន្ទប់",en:"room"},
    {kh:"មេរៀន",en:"lesson"},{kh:"ក្រដាស",en:"paper"},{kh:"កៅអី",en:"chair"},
  ]},
];

/* ---------------------------------------------------------------------
 * 3. Sound — tiny Web-Audio synth. No external files; effects are tones.
 *    Context is created lazily on the first user gesture (autoplay policy).
 * ------------------------------------------------------------------- */
const Sound = (() => {
  let ctx = null, enabled = true;
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  /** Play a single note. */
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
    isEnabled() { return enabled; },
    resume: ensure,
    click()  { tone(420, 0.05, "triangle", 0.06); },
    found()  { tone(660, 0.10, "sine", 0.2); tone(880, 0.14, "sine", 0.2, 0.08); },
    wrong()  { tone(180, 0.16, "sawtooth", 0.12); },
    hint()   { tone(520, 0.09, "triangle", 0.14); tone(700, 0.09, "triangle", 0.14, 0.09); },
    win()    { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "sine", 0.2, i * 0.11)); },
    speak(text) {
      if (!enabled || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "km-KH"; u.rate = 0.88; u.pitch = 1.05;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    },
  };
})();

/* ---------------------------------------------------------------------
 * 4. Puzzle — generate a square grid and place words.
 *    A "word" is an array of clusters. Placement supports 8 directions;
 *    `dirsMode` controls which subset is allowed.
 * ------------------------------------------------------------------- */
const Puzzle = (() => {
  const DIRS = {
    easy: [[0,1],[1,0]],                                  // → ↓
    diag: [[0,1],[1,0],[1,1],[1,-1]],                     // + diagonals
    hard: [[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]], // + reverses
  };
  const shuffle = a => { for (let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];} return a; };

  /**
   * @param {{kh,en,cells:string[]}[]} words  pre-segmented words
   * @param {number} size  grid dimension (auto-grown if too small)
   * @param {string} dirsMode  easy|diag|hard
   * @returns {{grid, size, placements}}
   */
  function generate(words, size, dirsMode) {
    const dirs = DIRS[dirsMode] || DIRS.hard;
    const longest = words.reduce((m, w) => Math.max(m, w.cells.length), 0);
    size = Math.max(size, longest + 1, 6);                // never smaller than the longest word

    // Order longest-first → easier to place big words before the grid fills.
    const ordered = [...words].sort((a, b) => b.cells.length - a.cells.length);

    for (let attempt = 0; attempt < 60; attempt++) {
      const grid = Array.from({ length: size }, () => Array(size).fill(null));
      const placements = [];
      let ok = true;

      for (const w of ordered) {
        if (!placeOne(grid, size, w, dirs, placements)) { ok = false; break; }
      }
      if (!ok) continue;                                  // retry whole grid

      // Fill the gaps with random single Khmer consonants.
      for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
          if (grid[r][c] === null) grid[r][c] = KhmerText.randomFiller();

      return { grid, size, placements };
    }
    // Extremely unlikely fallback: grow and recurse.
    return generate(words, size + 1, dirsMode);
  }

  function placeOne(grid, size, w, dirs, placements) {
    const cells = w.cells, L = cells.length;
    const tries = 200;
    const dirList = shuffle([...dirs]);
    for (let t = 0; t < tries; t++) {
      const [dr, dc] = dirList[t % dirList.length];
      const r0 = (Math.random() * size) | 0;
      const c0 = (Math.random() * size) | 0;
      const rEnd = r0 + dr * (L - 1), cEnd = c0 + dc * (L - 1);
      if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;

      // check overlap compatibility
      let fits = true; const path = [];
      for (let k = 0; k < L; k++) {
        const r = r0 + dr * k, c = c0 + dc * k, ex = grid[r][c];
        if (ex !== null && ex !== cells[k]) { fits = false; break; }
        path.push([r, c]);
      }
      if (!fits) continue;

      path.forEach(([r, c], k) => { grid[r][c] = cells[k]; });
      placements.push({ kh: w.kh, en: w.en, cells, path });
      return true;
    }
    return false;
  }

  return { generate };
})();

/* ---------------------------------------------------------------------
 * 5. Game — ties everything together: render, input, hints, timer, score.
 * ------------------------------------------------------------------- */
const Game = (() => {
  const $ = id => document.getElementById(id);
  const boardEl = $("board");

  // --- mutable state ------------------------------------------------
  let level = null;          // current LEVELS entry (or custom descriptor)
  let levelIndex = 0;        // index into LEVELS, or -1 for custom
  let puzzle = null;         // {grid,size,placements}
  let foundSet = new Set();  // kh words already found
  let cellEls = [];          // 2D array of DOM cells
  let dragging = false, startRC = null, currentPath = [];
  let hintsLeft = 3, score = 0, timerId = null, seconds = 0, finished = false;

  const SCORE_PER_WORD = 100, HINT_PENALTY = 20;

  /* -------- build a play descriptor from raw word objects --------- */
  function toWordObjs(rawWords) {
    return rawWords
      .map(w => ({ kh: w.kh, en: w.en || "", cells: KhmerText.segment(w.kh) }))
      .filter(w => w.cells.length >= 2);   // need ≥2 cells to be findable
  }

  /* ------------------------- load a level ------------------------- */
  function load(desc, idx) {
    level = desc; levelIndex = idx;
    const words = toWordObjs(desc.words);
    puzzle = Puzzle.generate(words, desc.size || 0, desc.dirs || "hard");

    foundSet = new Set();
    hintsLeft = 3; score = 0; seconds = 0; finished = false;
    stopTimer(); startTimer();

    renderBoard();
    renderWordList();
    updateStats();

    $("levelPill").textContent = "កម្រិត " + (desc.id ?? "★");
    $("levelName").textContent = desc.name + (desc.en ? " · " + desc.en : "");
    $("hintCount").textContent = hintsLeft;
    refreshLevelButtons();
  }

  /* ----------------------- render the grid ------------------------ */
  function renderBoard() {
    const N = puzzle.size;
    boardEl.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${N}, 1fr)`;
    boardEl.innerHTML = "";
    cellEls = Array.from({ length: N }, () => Array(N));

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const d = document.createElement("div");
        d.className = "cell";
        d.textContent = puzzle.grid[r][c];
        d.dataset.r = r; d.dataset.c = c;
        d.setAttribute("role", "gridcell");
        boardEl.appendChild(d);
        cellEls[r][c] = d;
      }
    }
    fitFont();
  }

  /** Scale cell font to the grid size so wide/tall Khmer clusters fit. */
  function fitFont() {
    const N = puzzle.size;
    const w = boardEl.clientWidth || boardEl.getBoundingClientRect().width;
    const cell = w / N;
    boardEl.style.fontSize = Math.max(11, cell * 0.46) + "px";
  }

  /* --------------------- render the checklist --------------------- */
  function renderWordList() {
    const wrap = $("wordlist");
    wrap.innerHTML = "";
    puzzle.placements.forEach(p => {
      const chip = document.createElement("span");
      chip.className = "word-chip" + (foundSet.has(p.kh) ? " done" : "");
      chip.dataset.kh = p.kh;
      chip.innerHTML = `<span class="kh">${p.kh}</span>` + (p.en ? `<span class="en">${p.en}</span>` : "");
      wrap.appendChild(chip);
    });
  }

  /* ---------------------------- stats ----------------------------- */
  function updateStats() {
    $("statScore").textContent = score;
    $("statFound").textContent = `${foundSet.size}/${puzzle.placements.length}`;
    $("statTime").textContent = fmt(seconds);
  }
  const fmt = s => `${(s/60|0)}:${String(s%60).padStart(2,"0")}`;

  function startTimer() {
    timerId = setInterval(() => { if (!finished) { seconds++; $("statTime").textContent = fmt(seconds); } }, 1000);
  }
  function stopTimer() { if (timerId) clearInterval(timerId); timerId = null; }

  /* ====================== SELECTION / INPUT ====================== */
  function cellFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    if (el && el.classList.contains("cell")) return el;
    return null;
  }
  function rcOf(el) { return [ +el.dataset.r, +el.dataset.c ]; }

  /** Compute the straight path from start to (r,c); null if not a line. */
  function linePath(sr, sc, r, c) {
    const dr = r - sr, dc = c - sc;
    let stepR, stepC, len;
    if (dr === 0 && dc === 0) { return [[sr, sc]]; }
    if (dr === 0) { stepR = 0; stepC = Math.sign(dc); len = Math.abs(dc); }
    else if (dc === 0) { stepR = Math.sign(dr); stepC = 0; len = Math.abs(dr); }
    else if (Math.abs(dr) === Math.abs(dc)) { stepR = Math.sign(dr); stepC = Math.sign(dc); len = Math.abs(dr); }
    else return null;                       // not horizontal/vertical/diagonal
    const path = [];
    for (let k = 0; k <= len; k++) path.push([sr + stepR * k, sc + stepC * k]);
    return path;
  }

  function clearSelecting() {
    currentPath.forEach(([r, c]) => cellEls[r][c].classList.remove("selecting"));
    currentPath = [];
  }
  function paintSelecting(path) {
    clearSelecting();
    currentPath = path;
    path.forEach(([r, c]) => cellEls[r][c].classList.add("selecting"));
  }

  function beginDrag(el) {
    if (finished) return;
    Sound.resume();
    dragging = true;
    startRC = rcOf(el);
    paintSelecting([startRC]);
    Sound.click();
  }
  function moveDrag(el) {
    if (!dragging || !el) return;
    const [r, c] = rcOf(el);
    const path = linePath(startRC[0], startRC[1], r, c);
    if (path) paintSelecting(path);
  }
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    evaluate(currentPath);
    clearSelecting();
    startRC = null;
  }

  /* ----------- check a selected path against the words ------------ */
  function evaluate(path) {
    if (!path || path.length < 2) return;
    const seq = path.map(([r, c]) => puzzle.grid[r][c]).join("|");
    for (const p of puzzle.placements) {
      if (foundSet.has(p.kh)) continue;
      const fwd = p.cells.join("|");
      const rev = [...p.cells].reverse().join("|");
      if (seq === fwd || seq === rev) { markFound(p); return; }
    }
    // miss
    Sound.wrong();
    Sound.speak("មិនទាន់ត្រឹមត្រូវទេ");
    boardEl.classList.add("shake");
    setTimeout(() => boardEl.classList.remove("shake"), 320);
  }

  function markFound(p) {
    foundSet.add(p.kh);
    score += SCORE_PER_WORD;
    p.path.forEach(([r, c]) => {
      const el = cellEls[r][c];
      el.classList.remove("selecting");
      el.classList.toggle("multi", el.classList.contains("found")); // overlap colour
      el.classList.add("found", "pop");
      setTimeout(() => el.classList.remove("pop"), 320);
    });
    // strike the chip
    const chip = $("wordlist").querySelector(`[data-kh="${CSS.escape(p.kh)}"]`);
    if (chip) chip.classList.add("done");
    Sound.found();
    Sound.speak("ត្រឹមត្រូវ");
    updateStats();

    if (foundSet.size === puzzle.placements.length) winLevel();
  }

  /* ----------------------------- hint ----------------------------- */
  function useHint() {
    if (finished || hintsLeft <= 0) return;
    const remaining = puzzle.placements.filter(p => !foundSet.has(p.kh));
    if (!remaining.length) return;
    const p = remaining[(Math.random() * remaining.length) | 0];
    hintsLeft--; score = Math.max(0, score - HINT_PENALTY);
    $("hintCount").textContent = hintsLeft;
    updateStats();
    Sound.hint();

    // pulse the first two cells of the chosen word
    p.path.slice(0, 2).forEach(([r, c]) => {
      const el = cellEls[r][c];
      el.classList.add("hint");
      setTimeout(() => el.classList.remove("hint"), 3400);
    });
  }

  /* ---------------------------- win ------------------------------- */
  function winLevel() {
    finished = true; stopTimer();
    const timeBonus = Math.max(0, 300 - seconds * 2);
    const hintBonus = hintsLeft * 30;
    const bonus = timeBonus + hintBonus;
    score += bonus;
    updateStats();
    Sound.win(); confetti();

    $("winTime").textContent = fmt(seconds);
    $("winScore").textContent = score;
    $("winBonus").textContent = "+" + bonus;
    $("winSub").textContent = `រកឃើញ ${puzzle.placements.length} ពាក្យ · found all ${puzzle.placements.length} words`;

    const hasNext = levelIndex >= 0 && levelIndex < LEVELS.length - 1;
    $("winNext").classList.toggle("hidden", !hasNext);
    new bootstrap.Modal($("winModal")).show();
  }

  /* ----------------------- confetti burst ------------------------- */
  function confetti() {
    const root = $("confetti");
    const colors = ["#c1121f", "#1f8a70", "#ffd24d", "#6aa9ff", "#34c38f", "#ff7ab6"];
    for (let i = 0; i < 90; i++) {
      const b = document.createElement("div");
      b.className = "confetti-bit";
      b.style.left = Math.random() * 100 + "vw";
      b.style.top = "-20px";
      b.style.background = colors[(Math.random() * colors.length) | 0];
      b.style.animationDuration = (1.6 + Math.random() * 1.6) + "s";
      b.style.animationDelay = (Math.random() * 0.3) + "s";
      b.style.transform = `rotate(${Math.random() * 360}deg)`;
      root.appendChild(b);
      setTimeout(() => b.remove(), 3600);
    }
  }

  /* -------------------- level selector buttons -------------------- */
  function refreshLevelButtons() {
    const wrap = $("levelButtons");
    wrap.innerHTML = "";
    LEVELS.forEach((lv, i) => {
      const b = document.createElement("button");
      b.className = "btn btn-sm " + (i === levelIndex ? "btn-accent" : "btn-outline-secondary");
      b.innerHTML = `${lv.id}. <span class="kh">${lv.name}</span>`;
      b.onclick = () => load(LEVELS[i], i);
      wrap.appendChild(b);
    });
  }

  /* --------------------------- public ----------------------------- */
  return {
    load, fitFont, useHint,
    getState: () => ({ puzzle, foundSet, level }),
    restart: () => load(level, levelIndex),
    regenerate: () => {                       // new layout, same words/level
      const words = toWordObjs(level.words);
      puzzle = Puzzle.generate(words, level.size || 0, level.dirs || "hard");
      foundSet = new Set(); hintsLeft = 3; score = 0; seconds = 0; finished = false;
      stopTimer(); startTimer();
      renderBoard(); renderWordList(); updateStats();
      $("hintCount").textContent = hintsLeft;
    },
    next: () => { if (levelIndex >= 0 && levelIndex < LEVELS.length - 1) load(LEVELS[levelIndex + 1], levelIndex + 1); },
    playCustom: (words, size, dirs) => load(
      { id: "★", name: "ផ្ទាល់ខ្លួន", en: "Custom", size, dirs, words }, -1
    ),
    _input: { boardEl, beginDrag, moveDrag, endDrag, cellFromPoint },
  };
})();

/* ---------------------------------------------------------------------
 * 6a. Download helper — draws puzzle to a Canvas and saves as PNG.
 * ------------------------------------------------------------------- */
function drawRoundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  } else {
    const R = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + R, y); ctx.lineTo(x + w - R, y);
    ctx.arcTo(x + w, y, x + w, y + R, R);
    ctx.lineTo(x + w, y + h - R);
    ctx.arcTo(x + w, y + h, x + w - R, y + h, R);
    ctx.lineTo(x + R, y + h);
    ctx.arcTo(x, y + h, x, y + h - R, R);
    ctx.lineTo(x, y + R);
    ctx.arcTo(x, y, x + R, y, R);
    ctx.closePath();
  }
}

function downloadPuzzleImage() {
  const { puzzle, foundSet, level } = Game.getState();
  const N = puzzle.size;
  const CELL = 48, GAP = 3, PAD = 24, TITLE_H = 72;
  const boardPx = N * CELL + (N - 1) * GAP;
  const W = Math.max(boardPx + PAD * 2, 360);

  // Pre-measure word chips on a scratch canvas to calculate total height needed
  const scratch = document.createElement("canvas").getContext("2d");
  scratch.font = `14px "Noto Sans Khmer","Khmer OS",sans-serif`;
  let wlRows = 1, wlCurX = PAD;
  puzzle.placements.forEach(p => {
    const tw = scratch.measureText(p.kh + (p.en ? "  " + p.en : "")).width + 20;
    if (wlCurX + tw > W - PAD) { wlRows++; wlCurX = PAD; }
    wlCurX += tw + 8;
  });
  const H = TITLE_H + boardPx + PAD + wlRows * 36 + 52;

  const canvas = document.createElement("canvas");
  const DPR = 2;
  canvas.width = W * DPR; canvas.height = H * DPR;
  const ctx = canvas.getContext("2d");
  ctx.scale(DPR, DPR);

  // Background
  ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, W, H);

  // Board card shadow area
  drawRoundRect(ctx, PAD - 10, TITLE_H - 8, boardPx + 20, boardPx + 20, 18);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.strokeStyle = "#e0e4ee"; ctx.lineWidth = 1; ctx.stroke();

  // Title
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#c1121f";
  ctx.font = `bold 18px "Noto Sans Khmer","Khmer OS",sans-serif`;
  ctx.fillText("ល្បែងរកពាក្យខ្មែរ", W / 2, 28);
  ctx.fillStyle = "#666";
  ctx.font = `13px "Noto Sans Khmer",system-ui,sans-serif`;
  ctx.fillText(level.name + (level.en ? " · " + level.en : "") + "  ·  Khmer Word Search", W / 2, 52);

  // Build set of found cell coordinates
  const foundCells = new Set();
  puzzle.placements.forEach(p => {
    if (foundSet.has(p.kh)) p.path.forEach(([r, c]) => foundCells.add(r + "," + c));
  });

  // Draw grid cells
  const fs = Math.max(10, CELL * 0.44);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const x = PAD + c * (CELL + GAP), y = TITLE_H + r * (CELL + GAP);
      const hit = foundCells.has(r + "," + c);
      drawRoundRect(ctx, x, y, CELL, CELL, 8);
      ctx.fillStyle = hit ? "#34c38f" : "#f4f6fb"; ctx.fill();
      ctx.strokeStyle = "#dfe4ee"; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.fillStyle = hit ? "#06301f" : "#243049";
      ctx.font = `600 ${fs}px "Noto Sans Khmer","Khmer OS",sans-serif`;
      ctx.fillText(puzzle.grid[r][c], x + CELL / 2, y + CELL / 2);
    }
  }

  // Word list
  const WY0 = TITLE_H + boardPx + PAD;
  ctx.fillStyle = "#888"; ctx.font = `11px system-ui,sans-serif`;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText("ពាក្យត្រូវរក · Words to find", PAD, WY0 + 14);

  let wx = PAD, wy = WY0 + 26;
  puzzle.placements.forEach(p => {
    const found = foundSet.has(p.kh);
    const label = p.kh + (p.en ? "  " + p.en : "");
    ctx.font = `14px "Noto Sans Khmer","Khmer OS",sans-serif`;
    const tw = ctx.measureText(label).width + 20;
    if (wx + tw > W - PAD) { wx = PAD; wy += 36; }
    drawRoundRect(ctx, wx, wy, tw, 28, 999);
    ctx.fillStyle = found ? "rgba(52,195,143,.2)" : "#eef0f8"; ctx.fill();
    ctx.strokeStyle = found ? "#34c38f" : "#d8dce8"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#243049"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(label, wx + 10, wy + 14);
    if (found) {
      ctx.strokeStyle = "#555"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(wx + 6, wy + 14); ctx.lineTo(wx + tw - 6, wy + 14); ctx.stroke();
    }
    wx += tw + 8;
  });

  const link = document.createElement("a");
  link.download = "khmer-word-search.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/* ---------------------------------------------------------------------
 * 6. UI WIRING — input listeners, buttons, theme, custom modal, init.
 * ------------------------------------------------------------------- */
(function wire() {
  const { boardEl, beginDrag, moveDrag, endDrag, cellFromPoint } = Game._input;

  /* ---- Pointer (mouse) ---- */
  boardEl.addEventListener("mousedown", e => {
    const el = e.target.closest(".cell"); if (el) { e.preventDefault(); beginDrag(el); }
  });
  document.addEventListener("mousemove", e => {
    if (e.buttons) { const el = cellFromPoint(e.clientX, e.clientY); if (el) moveDrag(el); }
  });
  document.addEventListener("mouseup", endDrag);

  /* ---- Touch ---- */
  boardEl.addEventListener("touchstart", e => {
    const t = e.touches[0]; const el = cellFromPoint(t.clientX, t.clientY);
    if (el) { e.preventDefault(); beginDrag(el); }
  }, { passive: false });
  boardEl.addEventListener("touchmove", e => {
    const t = e.touches[0]; const el = cellFromPoint(t.clientX, t.clientY);
    if (el) { e.preventDefault(); moveDrag(el); }
  }, { passive: false });
  document.addEventListener("touchend", endDrag);
  document.addEventListener("touchcancel", endDrag);

  /* ---- Action buttons ---- */
  document.getElementById("btnHint").onclick     = () => Game.useHint();
  document.getElementById("btnReset").onclick    = () => Game.restart();
  document.getElementById("btnShuffle").onclick  = () => Game.regenerate();
  document.getElementById("winNext").onclick     = () => Game.next();
  document.getElementById("winReplay").onclick   = () => Game.restart();
  document.getElementById("btnDownload").onclick = downloadPuzzleImage;
  document.getElementById("btnPrint").onclick    = () => window.print();

  /* ---- Sound toggle ---- */
  const btnSound = document.getElementById("btnSound");
  btnSound.onclick = () => {
    const on = !Sound.isEnabled();
    Sound.setEnabled(on); Sound.resume();
    btnSound.textContent = on ? "🔊" : "🔇";
    btnSound.classList.toggle("muted-on", !on);
    if (on) Sound.click();
  };

  /* ---- Theme toggle ---- */
  const btnTheme = document.getElementById("btnTheme");
  btnTheme.onclick = () => {
    const html = document.documentElement;
    const dark = html.getAttribute("data-bs-theme") === "dark";
    html.setAttribute("data-bs-theme", dark ? "light" : "dark");
    btnTheme.textContent = dark ? "🌙" : "☀️";
  };

  /* ---- Custom word list ---- */
  document.getElementById("btnPlayCustom").onclick = () => {
    const raw = document.getElementById("customInput").value;
    const errEl = document.getElementById("customError");
    errEl.textContent = "";

    const words = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
      .map(kh => ({ kh, en: "" }))
      .filter(w => KhmerText.segment(w.kh).length >= 2);

    if (words.length < 2) {
      errEl.textContent = "សូមបញ្ចូលយ៉ាងតិច ២ ពាក្យ (ដែលមាន ≥២ ព្យាង្គ) · need at least 2 multi-cluster words.";
      // re-open the modal since data-bs-dismiss already fired
      new bootstrap.Modal(document.getElementById("customModal")).show();
      return;
    }
    const size = parseInt(document.getElementById("customSize").value, 10) || 0;
    const dirs = document.getElementById("customDirs").value;
    Game.playCustom(words, size, dirs);
  };

  /* ---- Resize: keep cell font proportional ---- */
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => Game.fitFont(), 120); });

  /* ---- Boot ---- */
  Game.load(LEVELS[0], 0);
})();
