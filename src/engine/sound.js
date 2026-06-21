let ctx = null, enabled = true

function ensure() {
  if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch(e){}
  if (ctx && ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, dur = 0.12, type = 'sine', vol = 0.18, when = 0) {
  if (!enabled || !ensure()) return
  const t0 = ctx.currentTime + when
  const osc = ctx.createOscillator(), g = ctx.createGain()
  osc.type = type; osc.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(t0); osc.stop(t0 + dur + 0.02)
}

export const Sound = {
  setEnabled: v => { enabled = v },
  isEnabled:  () => enabled,
  resume: ensure,
  click:  () => tone(420, 0.05, 'triangle', 0.06),
  found:  () => { tone(660, 0.10, 'sine', 0.2); tone(880, 0.14, 'sine', 0.2, 0.08) },
  wrong:  () => tone(180, 0.16, 'sawtooth', 0.12),
  hint:   () => { tone(520, 0.09, 'triangle', 0.14); tone(700, 0.09, 'triangle', 0.14, 0.09) },
  win:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.2, i * 0.11)),
}
