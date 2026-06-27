import { create } from 'zustand'
import { CheckResult, CardData, checkCard } from '../services/cardValidator'

const HIST_KEY = 'chk_checker_history'
const STATS_KEY = 'chk_checker_stats'

function loadHist(): CheckResult[] {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]') } catch { return [] }
}
function saveHist(h: CheckResult[]) {
  try { localStorage.setItem(HIST_KEY, JSON.stringify(h)) } catch {}
}

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
  addResult: (status: 'live' | 'dead' | 'unknown', cardNumber: string, gateName?: string) => void
  reset: () => void
}

function computeStats(history: CheckResult[]) {
  return history.reduce(
    (acc, r) => {
      acc.total++
      if (r.status === 'live') acc.live++
      else acc.dead++
      return acc
    },
    { total: 0, live: 0, dead: 0 }
  )
}

export const useCheckerStore = create<CheckerState>((set, get) => ({
  isChecking: false,
  currentResult: null,
  history: loadHist(),
  stats: computeStats(loadHist()),

  check: async (cardData: CardData) => {
    set({ isChecking: true, currentResult: null })

    try {
      const minDelay = new Promise((resolve) => setTimeout(resolve, 2200))
      const [result] = await Promise.all([checkCard(cardData), minDelay])

      set((state) => {
        const history = [result, ...state.history].slice(0, 50)
        saveHist(history)
        return {
          isChecking: false,
          currentResult: result,
          history,
          stats: {
            total: state.stats.total + 1,
            live: state.stats.live + (result.status === 'live' ? 1 : 0),
            dead: state.stats.dead + (result.status === 'dead' ? 1 : 0),
          },
        }
      })
    } catch {
      set({ isChecking: false })
    }
  },

  addResult: (status, cardNumber, gateName) => {
    set((state) => {
      const result: CheckResult = {
        status: status === 'unknown' ? 'dead' as const : status,
        cardNumber,
        cardType: 'unknown',
        brand: '',
        bank: '',
        country: '',
        countryEmoji: '',
        cardCategory: '',
        bin: cardNumber.slice(0, 6),
        checks: [],
        binSource: 'fallback',
        timestamp: new Date(),
        message: status === 'live' ? 'APPROVED' : status === 'unknown' ? 'UNKNOWN' : 'DECLINED',
        gateName,
      }
      const history = [result, ...state.history].slice(0, 50)
      saveHist(history)
      return {
        history,
        stats: {
          total: state.stats.total + 1,
          live: state.stats.live + (status === 'live' ? 1 : 0),
          dead: state.stats.dead + (status === 'dead' || status === 'unknown' ? 1 : 0),
        },
      }
    })
  },

  reset: () => {
    saveHist([])
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
