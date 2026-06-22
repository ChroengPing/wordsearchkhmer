import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Settings, House, Volume2, VolumeX, Sun, Moon,
  Lock, Crown, CircleHelp, Pencil, RotateCcw,
} from 'lucide-react'

export default function SettingsMenu({
  soundOn,         onToggleSound,
  theme,           onToggleTheme,
  adminOn,         onAdminClick,
  onShowHelp,      // optional — game only
  onShowCustom,    // optional — game only
  onResetProgress, // optional — home only
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const { pathname } = useLocation()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  function close() { setOpen(false) }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`btn icon-btn${open ? ' btn-accent' : ' btn-outline-secondary'}`}
        title="Menu"
        onClick={() => setOpen(o => !o)}>
        <Settings size={18} />
      </button>

      {open && (
        <div className="settings-dropdown">

          {/* Navigate */}
          <div className="sd-section-label">Navigate</div>
          <Link to="/" className={`sd-row${pathname === '/' ? ' sd-active' : ''}`} onClick={close}>
            <House size={16} /> Home
          </Link>
          <Link to="/play/km" className={`sd-row${pathname === '/play/km' ? ' sd-active' : ''}`} onClick={close}>
            <span style={{ fontWeight:700, fontSize:'.75rem', minWidth:20 }}>KH</span>
            Khmer Game
          </Link>
          <Link to="/play/en" className={`sd-row${pathname === '/play/en' ? ' sd-active' : ''}`} onClick={close}>
            <span style={{ fontWeight:700, fontSize:'.75rem', minWidth:20 }}>EN</span>
            English Game
          </Link>

          <div className="sd-divider" />

          {/* Settings */}
          <div className="sd-section-label">Settings</div>
          <button className="sd-row" onClick={onToggleSound}>
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            Sound
            <span className={`sd-badge${soundOn ? ' on' : ''}`}>{soundOn ? 'On' : 'Off'}</span>
          </button>
          <button className="sd-row" onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="sd-row" onClick={() => { onAdminClick(); close() }}>
            {adminOn ? <Crown size={16} /> : <Lock size={16} />}
            {adminOn ? 'Admin — logout' : 'Admin login'}
            {adminOn && <span className="sd-badge on">On</span>}
          </button>

          {/* Tools — game only */}
          {(onShowHelp || onShowCustom) && (
            <>
              <div className="sd-divider" />
              <div className="sd-section-label">Tools</div>
              {onShowHelp && (
                <button className="sd-row" onClick={() => { onShowHelp(); close() }}>
                  <CircleHelp size={16} /> How to play
                </button>
              )}
              {onShowCustom && (
                <button className="sd-row" onClick={() => { onShowCustom(); close() }}>
                  <Pencil size={16} /> Custom words
                </button>
              )}
            </>
          )}

          {/* Danger — home only */}
          {onResetProgress && (
            <>
              <div className="sd-divider" />
              <button className="sd-row sd-danger" onClick={() => { onResetProgress(); close() }}>
                <RotateCcw size={16} /> Reset all progress
              </button>
            </>
          )}

        </div>
      )}
    </div>
  )
}
