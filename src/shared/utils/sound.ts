const SOUND_URL = '/sounds/maybach-music-sound-effect.mp3'

let audioEl: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement | null {
  if (audioEl) return audioEl
  try {
    audioEl = new Audio(SOUND_URL)
    audioEl.preload = 'auto'
    return audioEl
  } catch {
    return null
  }
}

export function initAudio() {
  const a = getAudio()
  if (a) {
    a.load()
  }
}

export function playLiveSound() {
  const a = getAudio()
  if (a) {
    a.currentTime = 0
    a.play().catch(() => {})
  }
}
