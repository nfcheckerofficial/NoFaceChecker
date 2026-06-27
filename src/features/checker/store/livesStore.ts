import { create } from 'zustand'

const STORAGE_KEY = 'chk_lives_vault'

export interface LiveCard {
  raw: string
  number: string
  gateId: string
  gateName: string
  message: string
  capturedAt: number
  bank?: string | null
  cardType?: string | null
  brand?: string | null
  country?: string | null
  countryEmoji?: string | null
  enriched?: boolean
}

function loadLives(): LiveCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveLives(lives: LiveCard[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lives)) } catch {}
}

interface LivesState {
  lives: LiveCard[]
  capture: (card: LiveCard) => void
  enrich: (raw: string, info: Partial<LiveCard>) => void
  remove: (raw: string) => void
  clear: () => void
}

const MAX_LIVES = 500

export const useLivesStore = create<LivesState>((set) => ({
  lives: loadLives(),

  capture: (card) =>
    set((s) => {
      if (s.lives.some((l) => l.raw === card.raw)) return s
      const lives = [card, ...s.lives].slice(0, MAX_LIVES)
      saveLives(lives)
      return { lives }
    }),

  enrich: (raw, info) =>
    set((s) => {
      const lives = s.lives.map((l) =>
        l.raw === raw ? { ...l, ...info, enriched: true } : l
      )
      saveLives(lives)
      return { lives }
    }),

  remove: (raw) =>
    set((s) => {
      const lives = s.lives.filter((l) => l.raw !== raw)
      saveLives(lives)
      return { lives }
    }),

  clear: () => {
    saveLives([])
    set({ lives: [] })
  },
}))
