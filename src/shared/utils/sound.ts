let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function initAudio() {
  try {
    const c = getCtx()
    c.resume().then(() => {
      const now = c.currentTime
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now)
      gain.gain.setValueAtTime(0.2, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
      osc.start(now)
      osc.stop(now + 0.5)
    })
  } catch {}
}

export function playLiveSound() {
  try {
    const c = getCtx()
    const play = () => {
      const now = c.currentTime
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.connect(gain)
      gain.connect(c.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.setValueAtTime(1320, now + 0.08)
      osc.frequency.setValueAtTime(1760, now + 0.16)
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc.start(now)
      osc.stop(now + 0.3)
    }
    if (c.state === 'suspended') {
      c.resume().then(play)
    } else {
      play()
    }
  } catch {}
}
