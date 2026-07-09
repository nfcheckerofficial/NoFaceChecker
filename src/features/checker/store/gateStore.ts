import { create } from 'zustand'
import { useUserStore } from './userStore'
import { useLivesStore } from './livesStore'
import { useCheckerStore } from './checkerStore'
import { lookupBin } from '../services/binLookup'
import { DEFAULT_GATE, type GateConfig } from '../config/gateCatalog'
import { useAuthStore } from '@/features/auth/authStore'
import { useTelegramStore } from '@/features/telegram/telegramStore'
import { notifyLiveCard } from '@/features/telegram/telegramService'
import { playLiveSound } from '@/shared/utils/sound'

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''

async function checkGateAccess(gateId: string): Promise<boolean> {
  const token = useAuthStore.getState().token
  const user = useAuthStore.getState().user
  if (!token) return false
  // Admin siempre tiene acceso a todos los gates
  if (user?.role === 'admin') return true
  try {
    // Si el gate_access est+� vac+�o para este usuario, permitir acceso (no bloquear por defecto)
    const myRes = await fetch(`${API_BASE}/api/gate-access/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (myRes.ok) {
      const myAccess = await myRes.json()
      // Si no hay registros de acceso para el usuario, permitir
      if (!Array.isArray(myAccess) || myAccess.length === 0) return true
      // Si hay registros pero ninguno para este gate, permitir
      const gateRecord = myAccess.find((r: { gate_id: string }) => r.gate_id === gateId)
      if (!gateRecord) return true
      // Si hay registro para este gate, verificar si hoy est+� en los d+�as
      const checkRes = await fetch(`${API_BASE}/api/gate-access/check/${gateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!checkRes.ok) return false
      const data = await checkRes.json()
      return data.hasAccess
    }
    return false
  } catch {
    return false
  }
}

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

/** ID del setTimeout pendiente (delay corto antes de ejecutar el check). */
let tickDelayId: ReturnType<typeof setTimeout> | null = null
/** ID del setTimeout pendiente (espera entre checks). */
let tickNextId: ReturnType<typeof setTimeout> | null = null

function clearTickTimers() {
  if (tickDelayId !== null) { clearTimeout(tickDelayId); tickDelayId = null }
  if (tickNextId !== null) { clearTimeout(tickNextId); tickNextId = null }
}

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

  start: async () => {
    const { isRunning, queue, gateId } = get()
    if (isRunning || queue.length === 0) return
    set({ isPaused: false, notice: null })

    // Verificar acceso al gate para hoy
    const hasAccess = await checkGateAccess(gateId)
    if (!hasAccess) {
      set({
        isRunning: false,
        notice: 'No tienes acceso a este gate hoy. Contacta al administrador para rentar dias.',
      })
      return
    }

    set({ isRunning: true })
    get()._tick()
  },

  pause: () => {
    if (!get().isRunning) return
    set({ isPaused: true })
    clearTickTimers()
  },

  resume: () => {
    const { isRunning, isPaused, queue } = get()
    if (!isRunning || !isPaused || queue.length === 0) return
    set({ isPaused: false })
    get()._tick()
  },

  reset: () => {
    clearTickTimers()
    saveGateResults(get().gateId, [])
    set({ ...EMPTY_STATE })
  },

  stop: () => {
    clearTickTimers()
    set({ isRunning: false, isPaused: false, currentCard: null, notice: null })
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

    tickDelayId = setTimeout(async () => {
      tickDelayId = null
      const s = get()
      if (s.isPaused) {
        // Devuelve la tarjeta al frente de la cola si se pausó a mitad.
        set({ queue: [raw, ...s.queue], currentCard: null })
        return
      }
      if (!s.isRunning) return

      const { status, message } = simulateCheck(number, activeConfig)
      const card: GateCard = { raw, number, status, message, checkedAt: Date.now() }

      // Cobro de créditos: live cuesta liveCost, dead cuesta deadCost.
      const cost = status === 'live' ? activeConfig.liveCost
        : status === 'dead' ? activeConfig.deadCost
          : 0
      if (cost > 0) {
        // spendCredits hace optimistic update local y luego persiste en server.
        // Devuelve Promise<boolean>; si rechaza (sin créditos), revierte.
        let ok = false
        try { ok = await useUserStore.getState().spendCredits(cost) } catch { ok = false }
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
      useCheckerStore.getState().addResult(status, number, get().gateName)

      // Guarda las lives en la bóveda central y resuelve su BIN (banco / debit-credit).
      if (status === 'live') {
        playLiveSound()
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

            // Telegram: el server se encarga de TODO (enviar al user + broadcast a subscribers)
            const authToken = useAuthStore.getState().token
            if (!authToken) return
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
            notifyLiveCard(payload, authToken).then((r) => {
              if (r.ok) useTelegramStore.getState().markSent()
            })
          })
          .catch(() => {
            useLivesStore.getState().enrich(raw, {})
            const authToken = useAuthStore.getState().token
            if (!authToken) return
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
            notifyLiveCard(payload, authToken).then((r) => {
              if (r.ok) useTelegramStore.getState().markSent()
            })
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

      tickNextId = setTimeout(() => {
        tickNextId = null
        if (get().isRunning && !get().isPaused) get()._tick()
      }, activeConfig.speedMs)
    }, activeConfig.speedMs * 0.4)
  },
}))

// Cancelar timers si la tab se cierra o se oculta.
if (typeof window !== 'undefined') {
  const cleanup = () => {
    clearTickTimers()
    if (useGateStore.getState().isRunning) {
      useGateStore.setState({ isRunning: false, isPaused: false, currentCard: null })
    }
  }
  window.addEventListener('pagehide', cleanup)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') cleanup()
  })
}
