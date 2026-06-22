import { Star, RotateCcw, Play, Coins } from 'lucide-react'

const fmt = s => `${(s/60|0)}:${String(s%60).padStart(2,'0')}`

export default function WinModal({ winData, GameLang, CATEGORIES, catIdx, lvlIdx, onNext, onReplay, onDismiss }) {
  if (!winData) return null
  const { stars, score, time, coins, coinReward, bestStreak, xp, wordCount,
          hasNextLvl, allDone, nextLvlNum, reward } = winData
  const xpBarPct = Math.min(100, Math.round((xp / 3000) * 100))

  return (
    <>
      <div className="modal show d-block" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content text-center" style={{ borderRadius: 18 }}>
            <div className="modal-body p-4">
              <div className="win-stars mb-1">
                {[0,1,2].map(i => (
                  <span key={i} className={`win-star ${i < stars ? 'on' : 'off'}`}
                        style={{ animationDelay: i * 0.12 + 's' }}>
                    <Star size={30} fill={i < stars ? '#ffd24d' : 'none'}
                          stroke={i < stars ? '#ffd24d' : 'currentColor'} />
                  </span>
                ))}
              </div>
              <h3 className="mb-0">
                {GameLang.id === 'km' ? 'សម្រេច! Level complete' : 'Level Complete!'}
              </h3>
              <p className="text-secondary small mb-0">{GameLang.ui.winSub(wordCount)}</p>
              <div className="win-tiles">
                <div className="win-tile"><span>Score</span><b>{score}</b></div>
                <div className="win-tile"><span>Time</span><b>{fmt(time)}</b></div>
                <div className="win-tile"><span>Best streak</span><b>×{1 + bestStreak}</b></div>
              </div>
              <div className="win-xp mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-secondary">XP earned</small>
                  <small className="fw-bold" style={{ color: 'var(--kh-found)' }}>+{xp} XP</small>
                </div>
                <div className="win-xp-track">
                  <div id="winXPBar" style={{ width: xpBarPct + '%', transition: 'width .8s .3s' }} />
                </div>
              </div>
              <div className="win-reward">
                <span className="ri">{reward.icon}</span>
                <div>
                  <small>Reward unlocked</small>
                  <b>{reward.label}</b>
                </div>
                <span className="win-reward-coins"><Coins size={14} style={{verticalAlign:'middle'}} /> +{coinReward}</span>
              </div>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <button className="btn btn-outline-secondary d-flex align-items-center gap-2"
                        onClick={() => { onDismiss(); onReplay() }}>
                  <RotateCcw size={15} />
                  {GameLang.id === 'km' ? 'លេងម្ដងទៀត' : 'Play Again'}
                </button>
                {!allDone && (
                  <button className="btn btn-accent d-flex align-items-center gap-2"
                          onClick={() => { onDismiss(); onNext() }}>
                    <Play size={15} fill="currentColor" />
                    {hasNextLvl ? GameLang.ui.nextLevel(nextLvlNum) : GameLang.ui.nextCategory}
                  </button>
                )}
                {allDone && (
                  <button className="btn btn-accent" onClick={onDismiss}>
                    {GameLang.id === 'km' ? '🎊 បានឈ្នះទាំងអស់!' : '🎊 All Cleared!'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" style={{ zIndex: 1054 }} />
    </>
  )
}
