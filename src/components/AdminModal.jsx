import { useState } from 'react'

export default function AdminModal({ show, onClose, onLogin }) {
  const [user, setUser]  = useState('')
  const [pass, setPass]  = useState('')
  const [err,  setErr]   = useState('')
  const [busy, setBusy]  = useState(false)

  function handleLogin(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    fetch('./admin.json')
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json() })
      .then(creds => {
        if (user.trim().toLowerCase() === creds.username.toLowerCase() && pass === creds.password) {
          setUser(''); setPass('')
          onLogin()
          onClose()
        } else {
          setErr('Wrong username or password.')
        }
      })
      .catch(() => setErr('Could not reach admin.json — run via a server.'))
      .finally(() => setBusy(false))
  }

  if (!show) return null
  return (
    <>
      <div className="modal show d-block" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content" style={{ borderRadius: 18 }}>
            <div className="modal-header border-0 pb-1">
              <h6 className="modal-title">🔐 Admin Login</h6>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body pt-1">
              <form onSubmit={handleLogin}>
                <input type="text"     className="form-control mb-2" placeholder="Username"
                       value={user} onChange={e => setUser(e.target.value)} autoComplete="off" />
                <input type="password" className="form-control mb-3" placeholder="Password"
                       value={pass} onChange={e => setPass(e.target.value)} />
                {err && <div className="text-danger small mb-2">{err}</div>}
                <button type="submit" className="btn btn-accent w-100" disabled={busy}>
                  {busy ? 'Checking…' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" style={{ zIndex: 1054 }} onClick={onClose} />
    </>
  )
}
