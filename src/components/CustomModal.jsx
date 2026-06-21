import { useState } from 'react'

export default function CustomModal({ show, onClose, onPlay, isKhmer }) {
  const [text, settext] = useState('')
  const [size, setSize] = useState('0')
  const [dirs, setDirs] = useState('hard')
  const [err,  setErr]  = useState('')

  function handlePlay() {
    setErr('')
    const words = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).map(kh => ({ kh, en: '' }))
    if (words.length < 2) { setErr('Enter at least 2 words.'); return }
    const ok = onPlay(words, parseInt(size, 10) || 0, dirs)
    if (ok) { onClose(); settext('') }
    else setErr('Words too short — need at least 2 letters each.')
  }

  if (!show) return null
  return (
    <>
      <div className="modal show d-block" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 18 }}>
            <div className="modal-header">
              <h5 className="modal-title">
                {isKhmer ? '✏️ បញ្ជីពាក្យផ្ទាល់ខ្លួន · Custom words' : '✏️ Custom Word List'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <p className="text-secondary small mb-2">
                {isKhmer
                  ? 'វាយពាក្យខ្មែរ មួយពាក្យក្នុងមួយជួរ (ឬបំបែកដោយ comma)។'
                  : 'Enter one word per line (or comma-separated). Words shorter than 2 letters are skipped.'}
              </p>
              <textarea
                className={`form-control${isKhmer ? ' kh' : ''}`} rows={6}
                placeholder={isKhmer ? 'ឆ្មា\nខ្លា\nតោ' : 'elephant\nbutterfly\ncomputer'}
                value={text} onChange={e => settext(e.target.value)}
              />
              <div className="row g-2 mt-2">
                <div className="col-6">
                  <label className="form-label small mb-1">
                    {isKhmer ? 'ទំហំក្ដារ Grid size' : 'Grid Size'}
                  </label>
                  <select className="form-select form-select-sm" value={size} onChange={e => setSize(e.target.value)}>
                    <option value="0">{isKhmer ? 'ស្វ័យប្រវត្តិ Auto' : 'Auto'}</option>
                    <option value="8">8 × 8</option>
                    <option value="10">10 × 10</option>
                    <option value="12">12 × 12</option>
                    <option value="14">14 × 14</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label small mb-1">
                    {isKhmer ? 'ទិសដៅ Directions' : 'Directions'}
                  </label>
                  <select className="form-select form-select-sm" value={dirs} onChange={e => setDirs(e.target.value)}>
                    <option value="easy">{isKhmer ? 'ផ្ដេក + បញ្ឈរ' : 'Horizontal + Vertical'}</option>
                    <option value="diag">{isKhmer ? '+ ទ្រេត (+ diagonal)' : '+ Diagonal'}</option>
                    <option value="hard">{isKhmer ? 'គ្រប់ទិស + បញ្ច្រាស' : 'All + Reverse'}</option>
                  </select>
                </div>
              </div>
              {err && <div className="text-danger small mt-2">{err}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                {isKhmer ? 'បោះបង់ Cancel' : 'Cancel'}
              </button>
              <button className="btn btn-accent" onClick={handlePlay}>
                {isKhmer ? '▶ លេង Play' : '▶ Play'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" style={{ zIndex: 1054 }} onClick={onClose} />
    </>
  )
}
