import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GameLang as kmLang, CATEGORIES } from '../data/lang-km'
import { Sound } from '../engine/sound'
import AdminModal from './AdminModal'

const LANG_ID = 'km'

function loadProgress() {
  try {
    const cs = new Set(JSON.parse(localStorage.getItem(`ws_cleared_${LANG_ID}`) || '[]'))
    const sm = JSON.parse(localStorage.getItem(`ws_stars_${LANG_ID}`) || '{}')
    return { clearedSet: cs, starsMap: sm }
  } catch(e) { return { clearedSet: new Set(), starsMap: {} } }
}

function StarsDisplay({ stars }) {
  return (
    <span>
      {[0,1,2].map(i => (
        <span key={i} style={{ opacity: i < stars ? 1 : 0.2, fontSize: '0.65rem' }}>⭐</span>
      ))}
    </span>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(loadProgress)
  const [adminOn,  setAdminOn]  = useState(() => sessionStorage.getItem('ws_admin') === '1')
  const [showAdmin, setShowAdmin] = useState(false)
  const [soundOn,   setSoundOn]  = useState(() => localStorage.getItem('ws_sound') !== '0')
  const [theme,     setTheme]    = useState(() => localStorage.getItem('ws_theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    try { localStorage.setItem('ws_theme', theme) } catch(e) {}
  }, [theme])

  useEffect(() => {
    Sound.setEnabled(soundOn)
    try { localStorage.setItem('ws_sound', soundOn ? '1' : '0') } catch(e) {}
  }, [soundOn])

  function playCategory(catId) {
    try { sessionStorage.setItem('ws_startCat', catId) } catch(e) {}
    navigate('/play/km')
  }

  function getLastCat() {
    return localStorage.getItem(`ws_lastCat_${LANG_ID}`) || CATEGORIES[0].id
  }

  function handleAdminLogin() {
    setAdminOn(true)
    try { sessionStorage.setItem('ws_admin','1') } catch(e) {}
  }
  function handleAdminLogout() {
    setAdminOn(false)
    try { sessionStorage.removeItem('ws_admin') } catch(e) {}
  }

  function resetProgress() {
    if (!window.confirm('Reset ALL progress for both Khmer and English? This cannot be undone.')) return
    Object.keys(localStorage).filter(k => k.startsWith('ws_')).forEach(k => localStorage.removeItem(k))
    setProgress(loadProgress())
  }

  const { clearedSet, starsMap } = progress
  const totalLevels   = CATEGORIES.length * 5
  const totalStars    = CATEGORIES.length * 5 * 3
  const clearedCount  = clearedSet.size
  const earnedStars   = Object.values(starsMap).reduce((s, v) => s + v, 0)
  const catsDone      = CATEGORIES.filter(c => [0,1,2,3,4].every(l => clearedSet.has(`${c.id}-${l}`))).length

  return (
    <>
      <div className="container py-3 py-md-4" style={{ maxWidth: 1080 }}>

        {/* Header */}
        <header className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
          <div>
            <h1 className="brand-title h3 mb-0">
              <span className="brand-accent">ល្បែង</span>រកពាក្យខ្មែរ
            </h1>
            <small className="text-secondary">Khmer Word Search</small>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button className="btn btn-outline-secondary icon-btn" title="English version"
                    onClick={() => navigate('/play/en')}>🇬🇧</button>
            <button className={`btn btn-outline-secondary icon-btn${soundOn?'':' muted-on'}`}
                    title="Sound on/off" onClick={() => setSoundOn(v => !v)}>
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button className="btn btn-outline-secondary icon-btn" title="Light/Dark"
                    onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              className={`btn icon-btn${adminOn ? ' btn-warning text-dark' : ' btn-outline-secondary'}`}
              title={adminOn ? 'Admin mode — click to logout' : 'Admin login'}
              onClick={adminOn ? handleAdminLogout : () => setShowAdmin(true)}>
              {adminOn ? '👑' : '🔐'}
            </button>
          </div>
        </header>

        {/* Summary strip */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="stat w-100" style={{ minWidth:0, borderRadius:18 }}>
              <span className="label">⭐ Stars</span>
              <span className="value">{earnedStars}/{totalStars}</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat w-100" style={{ minWidth:0, borderRadius:18 }}>
              <span className="label">✓ Levels</span>
              <span className="value">{clearedCount}/{totalLevels}</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="stat w-100" style={{ minWidth:0, borderRadius:18 }}>
              <span className="label">📁 Categories</span>
              <span className="value">{catsDone}/{CATEGORIES.length}</span>
            </div>
          </div>
          <div className="col-6 col-md-3 d-flex align-items-stretch">
            <button className="btn btn-accent w-100" style={{ borderRadius:18 }}
                    onClick={() => playCategory(getLastCat())}>
              ▶ Continue
            </button>
          </div>
        </div>

        {/* Category grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:'1rem' }}>
          {CATEGORIES.map((cat, ci) => {
            const catStars  = [0,1,2,3,4].reduce((s,l) => s + (starsMap[`${cat.id}-${l}`]||0), 0)
            const catCleared = [0,1,2,3,4].filter(l => clearedSet.has(`${cat.id}-${l}`)).length
            const pct = catCleared / 5 * 100
            return (
              <div key={cat.id} className="card border-0 shadow-sm" style={{ borderRadius:18 }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span style={{ fontSize:'1.6rem' }}>{cat.icon}</span>
                    <div style={{ minWidth:0 }}>
                      <div className="fw-bold" style={{ fontSize:'.9rem', fontFamily:'var(--kh-font)' }}>
                        {cat.name}
                      </div>
                      <div className="text-secondary" style={{ fontSize:'.7rem' }}>{cat.en}</div>
                    </div>
                  </div>
                  {/* Level dots */}
                  <div className="d-flex gap-1 mb-2">
                    {[0,1,2,3,4].map(lvl => {
                      const key     = `${cat.id}-${lvl}`
                      const cleared = clearedSet.has(key)
                      const stars   = starsMap[key] || 0
                      const locked  = !adminOn && lvl > 0 && !clearedSet.has(`${cat.id}-${lvl-1}`)
                      return (
                        <div key={lvl} title={`Level ${lvl+1}${cleared?' ✓':locked?' 🔒':''}`}
                             style={{
                               width:24,height:24,borderRadius:'50%',border:'2px solid',
                               display:'flex',alignItems:'center',justifyContent:'center',
                               fontSize:'0.55rem',
                               borderColor: cleared ? 'var(--kh-found)' : locked ? 'var(--bs-border-color)' : 'var(--kh-accent)',
                               background:  cleared ? 'var(--kh-found)' : 'transparent',
                               color:       cleared ? 'white' : locked ? 'var(--bs-secondary-color)' : 'var(--kh-accent)',
                               opacity:     locked ? 0.4 : 1,
                             }}>
                          {cleared ? (stars >= 3 ? '⭐' : stars >= 2 ? '★' : '✓') : locked ? '🔒' : lvl+1}
                        </div>
                      )
                    })}
                  </div>
                  {/* Progress bar */}
                  <div className="prog-wrap mb-2" style={{ gap:'.4rem' }}>
                    <div className="prog-track" style={{ height:5 }}>
                      <div id="progBar" style={{ width: pct+'%' }} />
                    </div>
                    <span className="prog-label" style={{ fontSize:'.68rem' }}>
                      {catCleared}/5 · ⭐{catStars}
                    </span>
                  </div>
                  <button className="btn btn-accent btn-sm w-100" style={{ borderRadius:12 }}
                          onClick={() => playCategory(cat.id)}>
                    ▶ លេង Play
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <footer className="text-center text-secondary small mt-5">
          <div>Designed &amp; Developed by <strong style={{ color:'var(--bs-body-color)' }}>Chroeng Ping</strong>
            <span className="mx-1" style={{ opacity:.4 }}>&amp;</span>
            <strong style={{ color:'var(--bs-body-color)' }}>Nimith</strong>
          </div>
          <div className="mt-3">
            <button className="btn btn-sm btn-outline-secondary" style={{ opacity:.4, fontSize:'.72rem' }}
                    onClick={resetProgress}>
              Reset all progress
            </button>
          </div>
        </footer>
      </div>

      <AdminModal show={showAdmin} onClose={() => setShowAdmin(false)} onLogin={handleAdminLogin} />
    </>
  )
}
