import { create } from 'zustand'
import { CheckResult, CardData, checkCard } from '../services/cardValidator'

interface CheckerState {
  isChecking: boolean
  currentResult: CheckResult | null
  history: CheckResult[]
  stats: {
    total: number
    live: number
    dead: number
  }
  check: (cardData: CardData) => Promise<void>
  reset: () => void
}

export const useCheckerStore = create<CheckerState>((set, get) => ({
  isChecking: false,
  currentResult: null,
  history: [],
  stats: {
    total: 0,
    live: 0,
    dead: 0,
  },

  check: async (cardData: CardData) => {
    set({ isChecking: true, currentResult: null })

    try {
      // Tiempo mínimo para que la animación de procesamiento se aprecie,
      // sin bloquear: la validación real corre en paralelo.
      const minDelay = new Promise((resolve) => setTimeout(resolve, 2200))
      const [result] = await Promise.all([checkCard(cardData), minDelay])

      set((state) => ({
        isChecking: false,
        currentResult: result,
        history: [result, ...state.history].slice(0, 50),
        stats: {
          total: state.stats.total + 1,
          live: state.stats.live + (result.status === 'live' ? 1 : 0),
          dead: state.stats.dead + (result.status === 'dead' ? 1 : 0),
        },
      }))
    } catch {
      set({ isChecking: false })
    }
  },

  reset: () => {
    set({
      isChecking: false,
      currentResult: null,
      history: [],
      stats: {
        total: 0,
        live: 0,
        dead: 0,
      },
    })
  },
}))
