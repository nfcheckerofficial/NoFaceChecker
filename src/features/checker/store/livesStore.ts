import { create } from 'zustand'

export interface LiveCard {
  /** Línea cruda: number|MM|YYYY|CVV */
  raw: string
  number: string
  /** Id del gate donde salió live. */
  gateId: string
  /** Nombre legible del gate. */
  gateName: string
  message: string
  capturedAt: number
  /** Datos del emisor (rellenados de forma asíncrona vía BIN lookup). */
  bank?: string | null
  /** 'debit' | 'credit' | null */
  cardType?: string | null
  brand?: string | null
  country?: string | null
  countryEmoji?: string | null
  /** Indica si el BIN lookup ya terminó. */
  enriched?: boolean
}

interface LivesState {
  lives: LiveCard[]
  /** Guarda una tarjeta live en la bóveda (evita duplicados exactos). */
  capture: (card: LiveCard) => void
  /** Completa los datos de emisor de una tarjeta ya guardada. */
  enrich: (raw: string, info: Partial<LiveCard>) => void
  /** Elimina una tarjeta por su línea cruda. */
  remove: (raw: string) => void
  clear: () => void
}

const MAX_LIVES = 500

export const useLivesStore = create<LivesState>((set) => ({
  lives: [],

  capture: (card) =>
    set((s) => {
      if (s.lives.some((l) => l.raw === card.raw)) return s
      return { lives: [card, ...s.lives].slice(0, MAX_LIVES) }
    }),

  enrich: (raw, info) =>
    set((s) => ({
      lives: s.lives.map((l) =>
        l.raw === raw ? { ...l, ...info, enriched: true } : l
      ),
    })),

  remove: (raw) =>
    set((s) => ({ lives: s.lives.filter((l) => l.raw !== raw) })),

  clear: () => set({ lives: [] }),
}))
