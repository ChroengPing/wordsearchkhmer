import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useGame } from '../hooks/useGame'
import { Sound } from '../engine/sound'
import GameBoard from './GameBoard'
import WinModal from './WinModal'
import HelpModal from './HelpModal'
import AdminModal from './AdminModal'
import CustomModal from './CustomModal'
import SettingsMenu from './SettingsMenu'
import { Lightbulb, Shuffle, RotateCcw, Download, Printer, Flame, Coins, Play } from 'lucide-react'

const fmt = s => `${(s/60|0)}:${String(s%60).padStart(2,'0')}`

function drawRoundRect(ctx, x, y, w, h, r) {
  const R = Math.min(r, w/2, h/2)
  ctx.beginPath()
  ctx.moveTo(x+R,y); ctx.lineTo(x+w-R,y); ctx.arcTo(x+w,y,x+w,y+R,R)
  ctx.lineTo(x+w,y+h-R); ctx.arcTo(x+w,y+h,x+w-R,y+h,R)
  ctx.lineTo(x+R,y+h); ctx.arcTo(x,y+h,x,y+h-R,R)
  ctx.lineTo(x,y+R); ctx.arcTo(x,y,x+R,y,R); ctx.closePath()
}

function downloadPuzzleImage(puzzle, foundSet, cat) {
  if (!puzzle) return
  const N = puzzle.size
  const CELL=48, GAP=3, PAD=24, TITLE_H=72
  const boardPx = N*CELL + (N-1)*GAP
  const W = Math.max(boardPx + PAD*2, 360)
  const scratch = document.createElement('canvas').getContext('2d')
  scratch.font = '14px system-ui,sans-serif'
  let wlRows=1, wlCurX=PAD
  puzzle.placements.forEach(p => {
    const tw = scratch.measureText(p.kh).width + 20
    if (wlCurX+tw > W-PAD) { wlRows++; wlCurX=PAD }; wlCurX+=tw+8
  })
  const H = TITLE_H + boardPx + PAD + wlRows*36 + 52
  const canvas = document.createElement('canvas')
  const DPR=2; canvas.width=W*DPR; canvas.height=H*DPR
  const ctx = canvas.getContext('2d'); ctx.scale(DPR,DPR)
  ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,W,H)
  drawRoundRect(ctx,PAD-10,TITLE_H-8,boardPx+20,boardPx+20,18)
  ctx.fillStyle='#ffffff'; ctx.fill(); ctx.strokeStyle='#e0e4ee'; ctx.lineWidth=1; ctx.stroke()
  ctx.textAlign='center'; ctx.textBaseline='alphabetic'
  ctx.fillStyle='#c1121f'; ctx.font='bold 18px system-ui,sans-serif'
  ctx.fillText((cat?.icon||'') + ' ' + (cat?.name||'Custom'), W/2, 28)
  ctx.fillStyle='#666'; ctx.font='13px system-ui,sans-serif'
  ctx.fillText('Word Search', W/2, 52)
  const foundCells = new Set()
  puzzle.placements.forEach(p => { if (foundSet.has(p.kh)) p.path.forEach(([r,c]) => foundCells.add(r+','+c)) })
  const fs = Math.max(10, CELL*0.44)
  ctx.textAlign='center'; ctx.textBaseline='middle'
  for (let r=0;r<N;r++) for (let c=0;c<N;c++) {
    const x=PAD+c*(CELL+GAP), y=TITLE_H+r*(CELL+GAP), hit=foundCells.has(r+','+c)
    drawRoundRect(ctx,x,y,CELL,CELL,8); ctx.fillStyle=hit?'#34c38f':'#f4f6fb'; ctx.fill()
    ctx.strokeStyle='#dfe4ee'; ctx.lineWidth=0.5; ctx.stroke()
    ctx.fillStyle=hit?'#06301f':'#243049'; ctx.font=`600 ${fs}px system-ui,sans-serif`
    ctx.fillText(puzzle.grid[r][c], x+CELL/2, y+CELL/2)
  }
  const WY0=TITLE_H+boardPx+PAD
  ctx.fillStyle='#888'; ctx.font='11px system-ui,sans-serif'
  ctx.textAlign='left'; ctx.textBaseline='alphabetic'
  ctx.fillText('Words to find', PAD, WY0+14)
  let wx=PAD, wy=WY0+26
  puzzle.placements.forEach(p => {
    ctx.font='14px system-ui,sans-serif'; const tw=ctx.measureText(p.kh).width+20
    if (wx+tw>W-PAD) { wx=PAD; wy+=36 }
    drawRoundRect(ctx,wx,wy,tw,28,999); ctx.fillStyle='#eef0f8'; ctx.fill()
    ctx.strokeStyle='#d8dce8'; ctx.lineWidth=1; ctx.stroke()
    ctx.fillStyle='#243049'; ctx.textAlign='left'; ctx.textBaseline='middle'
    ctx.fillText(p.kh, wx+10, wy+14); wx+=tw+8
  })
  const link = document.createElement('a')
  link.download='word-search.png'; link.href=canvas.toDataURL('image/png'); link.click()
}

function Confetti({ active }) {
  const [bits, setBits] = useState([])
  useEffect(() => {
    if (!active) return
    const COLORS = ['#c1121f','#1f8a70','#ffd24d','#6aa9ff','#34c38f','#ff7ab6']
    setBits(Array.from({ length: 90 }, (_, i) => ({
      id: i,
      left: Math.random()*100,
      color: COLORS[(Math.random()*COLORS.length)|0],
      dur: 1.6 + Math.random()*1.6,
      delay: Math.random()*0.3,
      rot: Math.random()*360,
    })))
    const t = setTimeout(() => setBits([]), 3600)
    return () => clearTimeout(t)
  }, [active])
  return (
    <div id="confetti">
      {bits.map(b => (
        <div key={b.id} className="confetti-bit" style={{
          left: b.left+'vw', top: '-20px', background: b.color,
          animationDuration: b.dur+'s', animationDelay: b.delay+'s',
          transform: `rotate(${b.rot}deg)`,
        }} />
      ))}
    </div>
  )
}

export default function GamePage({ GameLang, CATEGORIES }) {
  const game   = useGame({ GameLang, CATEGORIES })
  const { state } = game
  const isKhmer = GameLang.id === 'km'

  const [showHelp,   setShowHelp]   = useState(false)
  const [showAdmin,  setShowAdmin]  = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [adminOn,    setAdminOn]    = useState(false)
  const [soundOn,    setSoundOn]    = useState(() => localStorage.getItem('ws_sound') !== '0')
  const [theme,      setTheme]      = useState(() => localStorage.getItem('ws_theme') || 'dark')
  const [shakeKey,   setShakeKey]   = useState(0)
  const [floats,     setFloats]     = useState([])
  const [confetti,   setConfetti]   = useState(false)
  const firstLoad = useRef(true)

  // Start first level on mount, check sessionStorage for starting category
  useEffect(() => {
    let startCat = 0
    const sc = sessionStorage.getItem('ws_startCat')
    if (sc) {
      const idx = CATEGORIES.findIndex(c => c.id === sc)
      sessionStorage.removeItem('ws_startCat')
      if (idx >= 0) startCat = idx
    }
    game.loadLevel(startCat, 0)
  }, [])

  // Admin state from sessionStorage (restored by useGame INIT_PERSIST)
  useEffect(() => {
    if (state.isAdmin && !adminOn) setAdminOn(true)
  }, [state.isAdmin])

  // Help modal on first visit
  useEffect(() => {
    if (!localStorage.getItem('ws_help_seen')) {
      setTimeout(() => { setShowHelp(true); try { localStorage.setItem('ws_help_seen','1') } catch(e){} }, 400)
    }
  }, [])

  // Apply sound preference
  useEffect(() => {
    Sound.setEnabled(soundOn)
    try { localStorage.setItem('ws_sound', soundOn ? '1' : '0') } catch(e) {}
  }, [soundOn])

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    try { localStorage.setItem('ws_theme', theme) } catch(e) {}
  }, [theme])

  // Float popups
  useEffect(() => {
    if (!state.lastFloat) return
    const { text, id } = state.lastFloat
    setFloats(f => [...f, { text, id }])
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1000)
  }, [state.lastFloat])

  // Confetti on win
  useEffect(() => {
    if (state.winData) { setConfetti(true); setTimeout(() => setConfetti(false), 3600) }
  }, [state.winData])

  function handlePathComplete(path) {
    const result = game.evaluatePath(path)
    if (!result) setShakeKey(k => k + 1)
  }

  function toggleSound() { setSoundOn(v => { Sound.resume(); return !v }) }
  function toggleTheme() { setTheme(t => t === 'dark' ? 'light' : 'dark') }

  function handleAdminLogin() {
    setAdminOn(true)
    game.setAdmin(true)
  }
  function handleAdminLogout() {
    setAdminOn(false)
    game.setAdmin(false)
  }

  const cat   = state.catIdx >= 0 ? CATEGORIES[state.catIdx] : { icon: '★', name: 'Custom', en: '' }
  const total = state.puzzle?.placements.length || 0
  const found = state.foundSet.size
  const isLvlUnlocked = (ci, li) =>
    state.isAdmin || li === 0 || state.clearedSet.has(`${CATEGORIES[ci].id}-${li-1}`)

  return (
    <>
      <Confetti active={confetti} />

      <div className="container py-3 py-md-4" style={{ maxWidth: 1080 }}>

        {/* HEADER */}
        <header className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h1 className="brand-title h3 mb-0">
              <span className="brand-accent">{isKhmer ? 'ល្បែង' : 'Word'}</span>
              {isKhmer ? 'រកពាក្យខ្មែរ' : ' Search Game'}
            </h1>
            <small className="text-secondary">
              {isKhmer ? 'Khmer Word Search · drag across the letters to find each word'
                       : 'Drag across the letters to find each word'}
            </small>
          </div>
          <div className="d-flex align-items-center gap-2" id="print-hide-controls">
            <div className="lang-switch">
              <Link to="/play/km" className={`lang-switch-opt${isKhmer ? ' active' : ''}`}>KH</Link>
              <Link to="/play/en" className={`lang-switch-opt${!isKhmer ? ' active' : ''}`}>EN</Link>
            </div>
            <SettingsMenu
              soundOn={soundOn}      onToggleSound={toggleSound}
              theme={theme}          onToggleTheme={toggleTheme}
              adminOn={adminOn}      onAdminClick={adminOn ? handleAdminLogout : () => setShowAdmin(true)}
              onShowHelp={() => setShowHelp(true)}
              onShowCustom={() => setShowCustom(true)}
            />
          </div>
          {/* Print-only score box — top right */}
          <div id="print-score-header">
            <div className="print-score-label">{isKhmer ? 'ពិន្ទុ Score' : 'Score'}</div>
            <div className="print-score-blank" />
          </div>
        </header>

        {/* TWO-COLUMN PLAY AREA */}
        <div className="play-shell">
        <div className="row g-4 align-items-start w-100">

          {/* LEFT: Board */}
          <div className="col-12 col-lg-7 order-2 order-lg-1">
            <div className="board-wrap" style={{ position: 'relative' }}>
              <GameBoard
                puzzle={state.puzzle}
                foundSet={state.foundSet}
                hintCells={state.hintCells}
                onPathComplete={handlePathComplete}
                shakeKey={shakeKey}
                GameLang={GameLang}
              />
              {/* Float popups */}
              <div id="floats" style={{ position:'absolute',left:0,right:0,top:'42%',display:'flex',justifyContent:'center',pointerEvents:'none',zIndex:10 }}>
                {floats.map(f => (
                  <span key={f.id} className="float-txt">{f.text}</span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="d-flex justify-content-center gap-2 mt-3 flex-wrap" id="actionBtns">
              <button className="btn btn-outline-primary d-flex align-items-center gap-1" onClick={game.useHint}
                      disabled={state.hintsLeft <= 0 || state.finished}>
                <Lightbulb size={16} /> {isKhmer ? 'ជំនួយ ' : ''}Hint{' '}
                <span className="badge text-bg-primary">{state.hintsLeft}</span>
              </button>
              <button className="btn btn-outline-secondary d-flex align-items-center gap-1" onClick={game.regenerate}>
                <Shuffle size={16} /> {isKhmer ? 'ច្របល់ ' : ''}Regen
              </button>
              <button className="btn btn-outline-danger d-flex align-items-center gap-1" onClick={game.restart}>
                <RotateCcw size={16} /> {isKhmer ? 'ចាប់ថ្មី ' : ''}Restart
              </button>
              <button className="btn btn-outline-success d-flex align-items-center gap-1"
                      onClick={() => downloadPuzzleImage(state.puzzle, state.foundSet, cat)}>
                <Download size={16} /> Image
              </button>
              <button className="btn btn-outline-secondary d-flex align-items-center gap-1" onClick={() => window.print()}>
                <Printer size={16} /> Print
              </button>
            </div>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="col-12 col-lg-5 order-1 order-lg-2 sidebar-col">

            {/* Mobile word strip */}
            <div className="mobile-wordstrip d-lg-none mb-2">
              {state.puzzle?.placements.map(p => (
                <span key={p.kh} className={`word-chip${state.foundSet.has(p.kh) ? ' done' : ''}`}>
                  <span className="kh">{p.kh}</span>
                  {p.en && <span className="en">{p.en}</span>}
                </span>
              ))}
            </div>

            {/* Level pill + stats */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <span className="level-pill">
                {state.catIdx >= 0 ? GameLang.ui.levelLabel(state.lvlIdx + 1) : '★'}
              </span>
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <div className="stat" id="print-stat-score">
                  <span className="label">{isKhmer ? 'ពិន្ទុ Score' : 'Score'}</span>
                  <span className="value">{state.score}</span>
                </div>
                <div className="stat" id="print-stat-time">
                  <span className="label">{isKhmer ? 'ពេល Time' : 'Time'}</span>
                  <span className="value">{fmt(state.seconds)}</span>
                </div>
                <div className="pebble coin" id="print-stat-coins"><Coins size={15} /> <b>{state.coins}</b></div>
                <div className={`pebble fire${state.streak === 0 ? ' dim' : ''}`} id="print-stat-streak">
                  <Flame size={15} /> <b>×{1 + state.streak}</b>
                </div>
              </div>
            </div>

            {/* Category + level selects */}
            <div className="d-flex gap-2 mb-2">
              <select
                className="stat-select flex-grow-1"
                value={state.catIdx < 0 ? 'custom' : state.catIdx}
                onChange={e => {
                  if (e.target.value === 'custom') { setShowCustom(true); return }
                  game.loadLevel(parseInt(e.target.value), 0)
                }}>
                {CATEGORIES.map((c, i) => (
                  <option key={c.id} value={i}>{c.icon} {c.name}{c.en ? ' · '+c.en : ''}</option>
                ))}
                <option value="custom">✏️ Custom</option>
              </select>
              <select
                className="stat-select stat-select-sm"
                value={state.lvlIdx}
                onChange={e => game.loadLevel(state.catIdx, parseInt(e.target.value))}
                disabled={state.catIdx < 0}>
                {CATEGORIES[state.catIdx >= 0 ? state.catIdx : 0] && [0,1,2,3,4].map(lvl => {
                  const unlocked = isLvlUnlocked(state.catIdx >= 0 ? state.catIdx : 0, lvl)
                  const cleared  = state.clearedSet.has(`${CATEGORIES[state.catIdx >= 0 ? state.catIdx : 0].id}-${lvl}`)
                  return (
                    <option key={lvl} value={lvl} disabled={!unlocked}>
                      {GameLang.ui.levelLabel(lvl+1)}{cleared ? ' ✓' : !unlocked ? ' 🔒' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Progress bar */}
            <div className="prog-wrap mb-3">
              <div className="prog-track">
                <div id="progBar" style={{ width: total ? (found/total*100)+'%' : '0%' }} />
              </div>
              <span className="prog-label">{found}/{total}</span>
            </div>

            {/* Desktop word list */}
            <div className="d-none d-lg-block">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 18 }}>
                <div className="card-body">
                  <h2 className="h6 text-secondary text-uppercase mb-3" style={{ letterSpacing: '.5px' }}>
                    {isKhmer ? 'ពាក្យត្រូវរក · Words to find' : 'Words to Find'}
                  </h2>
                  <div className="wordlist">
                    {state.puzzle?.placements.map(p => (
                      <span key={p.kh} className={`word-chip${state.foundSet.has(p.kh) ? ' done' : ''}`}>
                        <span className="kh">{p.kh}</span>
                        {p.en && <span className="en">{p.en}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>{/* /sidebar */}
        </div>{/* /row */}
        </div>{/* /play-shell */}

        <footer className="text-center text-secondary small mt-4">
          {isKhmer ? 'រាល់ប្រអប់មួយ = ព្យាង្គ · each cell is one Khmer cluster.' : 'Each cell is one letter · drag to select words.'}
          {' '}Built with Vite + React + Bootstrap 5.
          <div className="mt-2" style={{ borderTop:'1px solid var(--bs-border-color)',paddingTop:'.6rem' }}>
            Designed &amp; Developed by <strong style={{ color:'var(--bs-body-color)' }}>Chroeng Ping</strong>
            <span className="mx-1" style={{ opacity:.4 }}>&amp;</span>
            <strong style={{ color:'var(--bs-body-color)' }}>Nimith</strong>
          </div>
        </footer>

        {/* Print-only: category + level info and creator credit */}
        <div className="print-credit">
          <div className="print-credit-cat">
            {cat.icon} {cat.name}{cat.en ? ' · ' + cat.en : ''} — {GameLang.ui.levelLabel(state.lvlIdx + 1)}
          </div>
          <div className="print-credit-by">
            Designed &amp; Developed by <strong>Chroeng Ping</strong> &amp; <strong>Nimith</strong>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WinModal
        winData={state.winData}
        GameLang={GameLang}
        CATEGORIES={CATEGORIES}
        catIdx={state.catIdx}
        lvlIdx={state.lvlIdx}
        onNext={game.next}
        onReplay={game.restart}
        onDismiss={game.dismissWin}
      />
      <HelpModal show={showHelp} onClose={() => setShowHelp(false)} isKhmer={isKhmer} />
      <AdminModal show={showAdmin} onClose={() => setShowAdmin(false)} onLogin={handleAdminLogin} />
      <CustomModal show={showCustom} onClose={() => setShowCustom(false)}
                   onPlay={game.playCustom} isKhmer={isKhmer} />
    </>
  )
}
