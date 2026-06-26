import { create } from 'zustand'

interface Subscriber {
  chat_id: string
  username: string | null
  first_name: string | null
  subscribed_at: string
}

interface TelegramState {
  botToken: string
  chatId: string
  enabled: boolean
  notifyGateName: string | null
  lastSentAt: number | null
  subscribers: Subscriber[]
  subscriberCount: number

  setBotToken: (t: string) => void
  setChatId: (id: string) => void
  setEnabled: (v: boolean) => void
  setNotifyGateName: (name: string | null) => void
  markSent: () => void
  setSubscribers: (list: Subscriber[]) => void
}

function loadVal(key: string): string {
  try { return localStorage.getItem(key) ?? '' } catch { return '' }
}
function loadBool(key: string): boolean {
  try { return localStorage.getItem(key) === 'true' } catch { return false }
}
function saveVal(key: string, val: string) {
  try { localStorage.setItem(key, val) } catch {}
}
function saveBool(key: string, val: boolean) {
  try { localStorage.setItem(key, String(val)) } catch {}
}

const LS_BOT = 'tg_bot_token'
const LS_CHAT = 'tg_chat_id'
const LS_ENABLED = 'tg_enabled'

export const useTelegramStore = create<TelegramState>((set) => ({
  botToken: loadVal(LS_BOT),
  chatId: loadVal(LS_CHAT),
  enabled: loadBool(LS_ENABLED),
  notifyGateName: null,
  lastSentAt: null,
  subscribers: [],
  subscriberCount: 0,

  setBotToken: (t) => { saveVal(LS_BOT, t); set({ botToken: t }) },
  setChatId: (id) => { saveVal(LS_CHAT, id); set({ chatId: id }) },
  setEnabled: (v) => { saveBool(LS_ENABLED, v); set({ enabled: v }) },
  setNotifyGateName: (name) => set({ notifyGateName: name }),
  markSent: () => set({ lastSentAt: Date.now() }),
  setSubscribers: (list) => set({ subscribers: list, subscriberCount: list.length }),
}))
