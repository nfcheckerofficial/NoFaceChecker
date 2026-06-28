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
  broadcastEnabled: boolean
  notifyGateName: string | null
  lastSentAt: number | null
  subscribers: Subscriber[]
  subscriberCount: number
  personalChatId: string
  notifyPersonal: boolean

  setBotToken: (t: string) => void
  setChatId: (id: string) => void
  setEnabled: (v: boolean) => void
  setBroadcastEnabled: (v: boolean) => void
  setPersonalChatId: (id: string) => void
  setNotifyPersonal: (v: boolean) => void
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
const LS_BROADCAST_ENABLED = 'tg_broadcast_enabled'
const LS_PERSONAL_CHAT = 'tg_personal_chat_id'
const LS_NOTIFY_PERSONAL = 'tg_notify_personal'

export const useTelegramStore = create<TelegramState>((set) => ({
  botToken: loadVal(LS_BOT),
  chatId: loadVal(LS_CHAT),
  enabled: loadBool(LS_ENABLED),
  broadcastEnabled: loadBool(LS_BROADCAST_ENABLED),
  personalChatId: loadVal(LS_PERSONAL_CHAT),
  notifyPersonal: loadBool(LS_NOTIFY_PERSONAL),
  notifyGateName: null,
  lastSentAt: null,
  subscribers: [],
  subscriberCount: 0,

  setBotToken: (t) => { saveVal(LS_BOT, t); set({ botToken: t }) },
  setChatId: (id) => { saveVal(LS_CHAT, id); set({ chatId: id }) },
  setEnabled: (v) => { saveBool(LS_ENABLED, v); set({ enabled: v }) },
  setBroadcastEnabled: (v) => { saveBool(LS_BROADCAST_ENABLED, v); set({ broadcastEnabled: v }) },
  setPersonalChatId: (id) => { saveVal(LS_PERSONAL_CHAT, id); set({ personalChatId: id }) },
  setNotifyPersonal: (v) => { saveBool(LS_NOTIFY_PERSONAL, v); set({ notifyPersonal: v }) },
  setNotifyGateName: (name) => set({ notifyGateName: name }),
  markSent: () => set({ lastSentAt: Date.now() }),
  setSubscribers: (list) => set({ subscribers: list, subscriberCount: list.length }),
}))
