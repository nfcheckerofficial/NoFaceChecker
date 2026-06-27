import { create } from 'zustand'
import { useAuthStore } from '@/features/auth/authStore'

const STORAGE_KEY = 'chk_lives_vault'
const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''
const SERVER_URL = API_BASE

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
  serverReady: boolean
  capture: (card: LiveCard) => void
  enrich: (raw: string, info: Partial<LiveCard>) => void
  remove: (raw: string) => void
  clear: () => void
  loadFromServer: () => Promise<void>
}

const MAX_LIVES = 500

function authToken(): string | null {
  return useAuthStore.getState().token
}

export const useLivesStore = create<LivesState>((set, get) => ({
  lives: loadLives(),
  serverReady: false,

  capture: (card) => {
    const s = get()
    if (s.lives.some((l) => l.raw === card.raw)) return
    const lives = [card, ...s.lives].slice(0, MAX_LIVES)
    saveLives(lives)
    set({ lives })
    const token = authToken()
    if (token) {
      fetch(`${SERVER_URL}/api/lives/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ live: card }),
      }).catch(() => {})
    }
  },

  enrich: (raw, info) => {
    const lives = get().lives.map((l) =>
      l.raw === raw ? { ...l, ...info, enriched: true } : l
    )
    saveLives(lives)
    set({ lives })
    const token = authToken()
    if (token) {
      const card = lives.find((l) => l.raw === raw)
      if (card) {
        fetch(`${SERVER_URL}/api/lives/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ live: card }),
        }).catch(() => {})
      }
    }
  },

  remove: (raw) => {
    const lives = get().lives.filter((l) => l.raw !== raw)
    saveLives(lives)
    set({ lives })
    const token = authToken()
    if (token) {
      fetch(`${SERVER_URL}/api/lives/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ raw }),
      }).catch(() => {})
    }
  },

  clear: () => {
    saveLives([])
    set({ lives: [] })
    const token = authToken()
    if (token) {
      fetch(`${SERVER_URL}/api/lives/clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }
  },

  loadFromServer: async () => {
    const token = authToken()
    if (!token) return
    try {
      const res = await fetch(`${SERVER_URL}/api/lives`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.lives && data.lives.length > 0) {
        const local = get().lives
        const merged = [...data.lives]
        for (const l of local) {
          if (!merged.some((m) => m.raw === l.raw)) merged.push(l)
        }
        merged.sort((a, b) => b.capturedAt - a.capturedAt)
        const final = merged.slice(0, MAX_LIVES)
        saveLives(final)
        set({ lives: final, serverReady: true })
      } else {
        set({ serverReady: true })
      }
    } catch {}
  },
}))
