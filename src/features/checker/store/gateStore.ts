import { create } from 'zustand'
import { useUserStore } from './userStore'
import { useLivesStore } from './livesStore'
import { useCheckerStore } from './checkerStore'
import { lookupBin } from '../services/binLookup'
import { DEFAULT_GATE, type GateConfig } from '../config/gateCatalog'
import { useTelegramStore } from '@/features/telegram/telegramStore'
import { broadcastLiveCard, sendLiveCard } from '@/features/telegram/telegramService'

export type CardStatus = 'live' | 'dead' | 'unknown'

function gateStorageKey(gateId: string) {
  return `chk_gate_${gateId}`
}

function loadGateResults(gateId: string): GateCard[] {
  try {
    const raw = localStorage.getItem(gateStorageKey(gateId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveGateResults(gateId: string, results: GateCard[]) {
  try { localStorage.setItem(gateStorageKey(gateId), JSON.stringify(results.slice(0, 200))) } catch {}
}

export interface GateCard {
  /** Línea cruda tal cual se ingresó: number|MM|YYYY|CVV */
  raw: string
  number: string
  status: CardStatus
  /** Mensaje corto del gateway simulado. */
  message: string
  checkedAt: number
}

interface GateState {
  gateId: string
  gateName: string
  liveCost: number
  deadCost: number

  queue: string[]
  results: GateCard[]
  currentCard: string | null
  prevCard: string | null

  isRunning: boolean
  isPaused: boolean
  /** Mensaje de aviso (ej. créditos insuficientes). */
  notice: string | null

  stats: {
    total: number
    live: number
    dead: number
    unknown: number
    checked: number
  }

  /** Configura el gate activo. Si cambia de gate, limpia el estado. */
  configure: (config: GateConfig) => void
  /** Reemplaza la cola con la lista de líneas dada. */
  setQueue: (lines: string[]) => void
  /** Añade líneas al final de la cola (usado por el generador). */
  appendQueue: (lines: string[]) => void
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  /** Interno: procesa la siguiente tarjeta de la cola. */
  _tick: () => void
}

/** Config del gate activo (no es estado reactivo: el motor la lee directo). */
let activeConfig: GateConfig = DEFAULT_GATE

const parseLine = (raw: string): string => raw.split('|')[0]?.trim() ?? raw.trim()

/**
 * Gateway simulado: clasifica una tarjeta de forma pseudo-aleatoria
 * pero estable por número, según las tasas del gate. NO realiza operaciones reales.
 */
function simulateCheck(number: string, cfg: GateConfig): { status: CardStatus; message: string } {
  const digits = number.replace(/\D/g, '')
  const seed = digits.split('').reduce((acc, d) => acc + Number(d || 0), 0)
  const roll = (seed * 9301 + 49297) % 233280
  const norm = roll / 233280

  if (norm < cfg.liveRate) {
    return { status: 'live', message: 'Approved · CVV Match' }
  }
  if (norm < cfg.liveRate + cfg.unknownRate) {
    return { status: 'unknown', message: 'Gateway Timeout · Retry' }
  }
  const reasons = [
    'Declined · Insufficient Funds',
    'Declined · Card Restricted',
    'Declined · Do Not Honor',
    'Declined · Expired Card',
    'Declined · Pickup Card',
  ]
  return { status: 'dead', message: reasons[seed % reasons.length] }
}

const EMPTY_STATE = {
  queue: [] as string[],
  results: [] as GateCard[],
  currentCard: null as string | null,
  prevCard: null as string | null,
  isRunning: false,
  isPaused: false,
  notice: null as string | null,
  stats: { total: 0, live: 0, dead: 0, unknown: 0, checked: 0 },
}

export const useGateStore = create<GateState>((set, get) => ({
  gateId: DEFAULT_GATE.id,
  gateName: DEFAULT_GATE.name,
  liveCost: DEFAULT_GATE.liveCost,
  deadCost: DEFAULT_GATE.deadCost,
  ...EMPTY_STATE,

  configure: (config) => {
    activeConfig = config
    if (get().gateId !== config.id) {
      const saved = loadGateResults(config.id)
      const stats = saved.reduce((acc, r) => {
        acc.checked++
        if (r.status === 'live') acc.live++
        else if (r.status === 'dead') acc.dead++
        else acc.unknown++
        return acc
      }, { total: 0, live: 0, dead: 0, unknown: 0, checked: 0 })
      stats.total = stats.checked
      set({
        gateId: config.id,
        gateName: config.name,
        liveCost: config.liveCost,
        deadCost: config.deadCost,
        queue: [],
        results: saved,
        currentCard: null,
        prevCard: null,
        isRunning: false,
        isPaused: false,
        notice: null,
        stats,
      })
    } else {
      set({
        gateName: config.name,
        liveCost: config.liveCost,
        deadCost: config.deadCost,
      })
    }
  },

  setQueue: (lines) => {
    const clean = lines.map(l => l.trim()).filter(Boolean)
    set({ queue: clean, stats: { ...get().stats, total: clean.length + get().stats.checked } })
  },

  appendQueue: (lines) => {
    const clean = lines.map(l => l.trim()).filter(Boolean)
    set((s) => ({
      queue: [...s.queue, ...clean],
      stats: { ...s.stats, total: s.stats.total + clean.length },
    }))
  },

  start: () => {
    const { isRunning, queue } = get()
    if (isRunning || queue.length === 0) return
    set({ isRunning: true, isPaused: false, notice: null })
    get()._tick()
  },

  pause: () => {
    if (!get().isRunning) return
    set({ isPaused: true })
  },

  resume: () => {
    const { isRunning, isPaused, queue } = get()
    if (!isRunning || !isPaused || queue.length === 0) return
    set({ isPaused: false })
    get()._tick()
  },

  reset: () => {
    saveGateResults(get().gateId, [])
    set({ ...EMPTY_STATE })
  },

  _tick: () => {
    const state = get()
    if (state.isPaused) return

    if (state.queue.length === 0) {
      set({ isRunning: false, currentCard: null })
      return
    }

    const [raw, ...rest] = state.queue
    const number = parseLine(raw)
    set({ currentCard: raw, queue: rest })

    setTimeout(() => {
      const s = get()
      if (s.isPaused) {
        // Devuelve la tarjeta al frente de la cola si se pausó a mitad.
        set({ queue: [raw, ...s.queue], currentCard: null })
        return
      }

      const { status, message } = simulateCheck(number, activeConfig)
      const card: GateCard = { raw, number, status, message, checkedAt: Date.now() }

      // Cobro de créditos: live cuesta liveCost, dead cuesta deadCost.
      const cost = status === 'live' ? activeConfig.liveCost
        : status === 'dead' ? activeConfig.deadCost
          : 0
      if (cost > 0) {
        const ok = useUserStore.getState().spendCredits(cost)
        if (!ok) {
          // Sin créditos: devuelve la tarjeta a la cola y detiene el gate.
          set((cur) => ({
            queue: [raw, ...cur.queue],
            currentCard: null,
            isRunning: false,
            isPaused: false,
            notice: 'Insufficient credits — gate stopped.',
          }))
          return
        }
      }

      // Refleja el resultado en las estadísticas del usuario.
      useUserStore.getState().recordResult(status)
      useCheckerStore.getState().addResult(status, number)

      // Guarda las lives en la bóveda central y resuelve su BIN (banco / debit-credit).
      if (status === 'live') {
        useLivesStore.getState().capture({
          raw,
          number,
          gateId: get().gateId,
          gateName: get().gateName,
          message,
          capturedAt: Date.now(),
        })

        // Lookup asíncrono del emisor; enriquece la tarjeta cuando llega.
        lookupBin(number)
          .then((info) => {
            useLivesStore.getState().enrich(raw, {
              bank: info.bankName,
              cardType: info.type,
              brand: info.brand ?? (info.scheme ? info.scheme.toUpperCase() : null),
              country: info.countryName,
              countryEmoji: info.countryEmoji,
            })

            // Telegram: broadcast a todos los suscriptores
            const tg = useTelegramStore.getState()
            const digits = number.replace(/\D/g, '')
            const payload = {
              raw,
              number,
              bin: digits.slice(0, 6),
              brand: info.brand ?? info.scheme?.toUpperCase() ?? 'Unknown',
              bank: info.bankName ?? 'Unknown Issuer',
              country: info.countryName ?? 'Unknown',
              countryEmoji: info.countryEmoji ?? '',
              cardType: info.type ?? 'Unknown',
              cardCategory: [info.type, info.category].filter(Boolean).join(' · ') || 'Unknown',
              gateName: get().gateName,
              message,
              checkedAt: Date.now(),
            }
            if (tg.enabled && tg.botToken) {
              broadcastLiveCard(payload, tg.botToken).then((result) => {
                if (result.sent > 0) useTelegramStore.getState().markSent()
              })
            }
            if (tg.notifyPersonal && tg.botToken && tg.personalChatId) {
              sendLiveCard(payload, tg.botToken, tg.personalChatId)
            }
          })
          .catch(() => {
            useLivesStore.getState().enrich(raw, {})

            // Telegram: broadcast incluso sin BIN info
            const tg = useTelegramStore.getState()
            const digits = number.replace(/\D/g, '')
            const payload = {
              raw,
              number,
              bin: digits.slice(0, 6),
              brand: 'Unknown',
              bank: 'Unknown Issuer',
              country: 'Unknown',
              countryEmoji: '',
              cardType: 'Unknown',
              cardCategory: 'Unknown',
              gateName: get().gateName,
              message,
              checkedAt: Date.now(),
            }
            if (tg.enabled && tg.botToken) {
              broadcastLiveCard(payload, tg.botToken).then((result) => {
                if (result.sent > 0) useTelegramStore.getState().markSent()
              })
            }
            if (tg.notifyPersonal && tg.botToken && tg.personalChatId) {
              sendLiveCard(payload, tg.botToken, tg.personalChatId)
            }
          })
      }

      set((cur) => {
        const newResults = [card, ...cur.results]
        saveGateResults(cur.gateId, newResults)
        return {
          results: newResults,
          prevCard: number,
          currentCard: null,
          stats: {
            ...cur.stats,
            checked: cur.stats.checked + 1,
            live: cur.stats.live + (status === 'live' ? 1 : 0),
            dead: cur.stats.dead + (status === 'dead' ? 1 : 0),
            unknown: cur.stats.unknown + (status === 'unknown' ? 1 : 0),
          },
        }
      })

      setTimeout(() => get()._tick(), activeConfig.speedMs)
    }, activeConfig.speedMs * 0.4)
  },
}))
