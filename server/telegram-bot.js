import TelegramBot from 'node-telegram-bot-api'
import { addSubscriber, removeSubscriber, listSubscribers, ensureTelegramUser } from './db.js'
import { lookupBin } from './extrap.js'

let bot = null

const GROUP_INVITE_URL = 'https://t.me/+zv9wBHrfV15iMjc5'
const GROUP_MESSAGE = `\n\n<b>🔗 Únete a nuestro grupo oficial:</b>\n${GROUP_INVITE_URL}\n`

export async function startBot(token) {
  if (bot) return bot

  bot = new TelegramBot(token, { polling: false })

  bot.on('polling_error', (err) => {
    const msg = err?.message || String(err)
    if (msg.includes('409')) {
      console.warn(`[Telegram Bot] 409 conflict - another instance detected, waiting 30s...`)
      bot.stopPolling()
      setTimeout(() => {
        bot.deleteWebhook().catch(() => {})
        setTimeout(() => { try { bot.startPolling({ interval: 2000, params: { timeout: 10 } }) } catch {} }, 2000)
      }, 30000)
    } else if (msg.includes('fetch failed') || msg.includes('EFATAL')) {
      console.warn(`[Telegram Bot] Network error - restarting polling in 15s: ${msg}`)
      bot.stopPolling()
      setTimeout(() => {
        try { bot.startPolling({ interval: 2000, params: { timeout: 10 } }) } catch {}
      }, 15000)
    } else {
      console.error('[Telegram Bot] Polling error:', msg)
    }
  })

  try {
    await bot.deleteWebhook()
    await bot.setMyCommands([
      { command: 'start', description: 'Register & get your Telegram ID' },
      { command: 'id', description: 'Get your Telegram ID' },
      { command: 'gen', description: 'Generate BIN info: /gen 512060' },
      { command: 'group', description: 'Unete A Nuestra Comunidad 🚀' },
      { command: 'status', description: 'Check your registration status' },
      { command: 'stop', description: 'Unsubscribe from notifications' },
    ])
  } catch (e) {
    console.warn('[Telegram Bot] Setup warning:', e.message)
  }

  bot.startPolling({ interval: 2000, params: { timeout: 10 } })
  console.log('[Telegram Bot] Started polling')

  bot.onText(/\/start/, (msg) => {
    const chatId = String(msg.chat.id)
    const tgUsername = msg.from?.username || null
    const firstName = msg.from?.first_name || null

    addSubscriber(chatId, tgUsername, firstName).catch(() => {})
    ensureTelegramUser(chatId, tgUsername, firstName).catch(() => {})

    bot.sendMessage(
      chatId,
      `<b>No Face Checker Bot</b> 🚀\n\n<b>Your Telegram ID:</b>\n<code>${chatId}</code>\n\nUse this ID to register at nofacechk.com/register\n\nYou will receive all live cards as they are detected.\n\n/id - get your ID\n/group - join our official group\n/stop - unsubscribe${GROUP_MESSAGE}`,
      { parse_mode: 'HTML', disable_web_page_preview: true }
    ).catch(() => {})
    console.log(`[Telegram Bot] New subscriber: ${chatId} (${tgUsername || firstName || 'unknown'})`)
  })

  bot.onText(/\/stop/, (msg) => {
    const chatId = String(msg.chat.id)
    removeSubscriber(chatId).catch(() => {})
    bot.sendMessage(chatId, 'You have been unsubscribed. Send /start to register again.').catch(() => {})
    console.log(`[Telegram Bot] Unsubscribed: ${chatId}`)
  })

  bot.onText(/\/id/, (msg) => {
    const chatId = String(msg.chat.id)
    bot.sendMessage(chatId, `<b>Your Telegram ID:</b>\n<code>${chatId}</code>`, { parse_mode: 'HTML' }).catch(() => {})
  })

  bot.onText(/\/group/, (msg) => {
    const chatId = String(msg.chat.id)
    bot.sendMessage(
      chatId,
      `<b>🔗 Únete a nuestro grupo oficial:</b>\n${GROUP_INVITE_URL}`,
      { parse_mode: 'HTML', disable_web_page_preview: true }
    ).catch(() => {})
  })

  // /gen <bin>  o  .gen <bin>  → info del BIN + BINs cercanos
  const handleGen = async (msg) => {
    const chatId = String(msg.chat.id)
    const text = msg.text || ''
    const match = text.match(/^[\/.]gen\s+(\d{4,8})/)
    if (!match) {
      return bot.sendMessage(
        chatId,
        '<b>Uso:</b> <code>/gen 512060</code> o <code>.gen 512060</code>',
        { parse_mode: 'HTML' }
      ).catch(() => {})
    }
    const bin = match[1]
    bot.sendChatAction(chatId, 'typing').catch(() => {})
    try {
      const result = await lookupBin(bin)
      if (result.error) {
        return bot.sendMessage(chatId, `❌ ${result.error}`, { parse_mode: 'HTML' }).catch(() => {})
      }

      const SEP = '━━━━━━━━━━━━━━'
      const parts = []

      // ----- Bloque 1: header con el BIN pedido -----
      parts.push(
        `<b>⌥ NoFace Gen | Extrap Database</b>`,
        SEP,
        `-${bin}|xx|xx|info-`,
        SEP
      )

      // ----- Bloque 2: info del BIN exacto -----
      if (result.exact) {
        const e = result.exact
        const bank = e.bankName || 'UNKNOWN'
        const brand = (e.brand || '—').toUpperCase()
        const type = (e.type || '—').toUpperCase()
        const category = (e.category || '').toUpperCase()
        const country = `${e.countryEmoji || ''} ${(e.countryName || '—').toUpperCase()}`.trim()
        const code = e.countryCode || '—'
        parts.push(
          `<b>🔎 Bin: <code>${e.bin}</code>  |  Info:</b>`,
          `${bank} | ${brand} | ${type}${category ? ' | ' + category : ''} | ${country} (${code})`,
          SEP
        )
      } else {
        parts.push(`<i>Sin datos para el BIN exacto ${bin}.</i>`, SEP)
      }

      // ----- Bloque 3: BINs cercanos con datos -----
      if (result.nearby && result.nearby.length > 0) {
        parts.push(`<b>📡 BINs cercanos (${result.nearby.length}):</b>`)
        for (const n of result.nearby.slice(0, 25)) {
          const nb = n.bankName || '—'
          const nm = (n.brand || '—').toUpperCase()
          const nt = (n.type || '—').toUpperCase()
          const nc = `${n.countryEmoji || ''} ${(n.countryName || '—').toUpperCase()}`.trim()
          parts.push(
            `<code>${n.bin}</code>  ${nb} | ${nm} | ${nt} | ${nc}`
          )
        }
        if (result.nearby.length > 25) {
          parts.push(`<i>... y ${result.nearby.length - 25} más</i>`)
        }
        parts.push(SEP)
      }

      parts.push(`<i>bot by : @NoFaceChecker 🌐</i>`)

      const out = parts.join('\n')
      // Telegram limita a 4096 chars; dividimos si hace falta
      if (out.length <= 4000) {
        await bot.sendMessage(chatId, out, { parse_mode: 'HTML', disable_web_page_preview: true })
      } else {
        await bot.sendMessage(chatId, out.slice(0, 4000), { parse_mode: 'HTML', disable_web_page_preview: true })
        await bot.sendMessage(chatId, out.slice(4000), { parse_mode: 'HTML', disable_web_page_preview: true })
      }
    } catch (err) {
      console.error('[Telegram Bot] /gen error:', err.message)
      await bot.sendMessage(chatId, '❌ Lookup failed. Try again.').catch(() => {})
    }
  }
  bot.onText(/\/gen(?:\s+(\d+))?/, handleGen)
  bot.onText(/^\.gen\s+(\d{4,8})/, handleGen)

  bot.on('message', (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
      bot.sendMessage(msg.chat.id, `<b>Your Telegram ID:</b> <code>${String(msg.chat.id)}</code>\n\nUse /start to register or go to nofacechk.com/register${GROUP_MESSAGE}`, { parse_mode: 'HTML', disable_web_page_preview: true }).catch(() => {})
    }
  })

  bot.onText(/\/status/, (msg) => {
    const chatId = String(msg.chat.id)
    const subs = listSubscribers()
    const isRegistered = subs.some((s) => s.chat_id === chatId)
    if (isRegistered) {
      bot.sendMessage(chatId, '✅ You are registered and will receive all live cards.').catch(() => {})
    } else {
      bot.sendMessage(chatId, '❌ You are not registered. Send /start to register.').catch(() => {})
    }
  })

  return bot
}

export function stopBot() {
  if (bot) {
    bot.stopPolling()
    bot = null
    console.log('[Telegram Bot] Stopped')
  }
}

export function getBot() {
  return bot
}
