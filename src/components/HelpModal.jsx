export default function HelpModal({ show, onClose, isKhmer }) {
  if (!show) return null
  return (
    <>
      <div className="modal show d-block" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ borderRadius: 18 }}>
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title">
                {isKhmer ? 'ℹ️ របៀបលេង · How to play' : 'ℹ️ How to play'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="help-steps">
                <div className="help-step">
                  <div className="hi">👆</div>
                  <div>
                    <b>{isKhmer ? 'អូសលើអក្សរ · Drag across letters' : 'Drag across letters'}</b>
                    <p>Hold and drag in a straight line — horizontal, vertical, or diagonal.</p>
                  </div>
                </div>
                <div className="help-step">
                  <div className="hi">🔤</div>
                  <div>
                    <b>{isKhmer ? 'ប្រអប់មួយ = ព្យាង្គ · One cell = one cluster' : 'One cell = one letter'}</b>
                    <p>{isKhmer
                      ? 'Each cell is a full Khmer syllable cluster, not a single character.'
                      : 'Each cell in the English version is one letter. Spell the whole word.'}</p>
                  </div>
                </div>
                <div className="help-step">
                  <div className="hi">🔥</div>
                  <div>
                    <b>{isKhmer ? 'ស្ទ្រីក · Build a streak' : 'Build a streak'}</b>
                    <p>Find words in a row to multiply your score — ×2, ×3, and beyond.</p>
                  </div>
                </div>
                <div className="help-step">
                  <div className="hi">⭐</div>
                  <div>
                    <b>{isKhmer ? 'ផ្កាយ · Earn stars' : 'Earn stars'}</b>
                    <p>Finish fast and without hints to earn 3 stars and unlock the reward badge.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button className="btn btn-accent w-100" onClick={onClose}>
                {isKhmer ? '▶ ចាប់ផ្ដើម · Start playing' : '▶ Start playing'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" style={{ zIndex: 1054 }} onClick={onClose} />
    </>
  )
}
