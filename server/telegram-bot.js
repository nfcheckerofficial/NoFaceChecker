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
      { command: 'gen', description: 'Generate 12 cards from a BIN' },
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

  // Guarda el último BIN que el usuario pasó en /gen o .gen
  // (en memoria, no persistente). Sirve para que /gen sin args pueda tomarlo.
  const lastBinByChat = new Map()

  function pad2(n) { return String(n).padStart(2, '0') }

  // Detecta la marca a partir del BIN para usar la longitud y CVV correctos.
  // Visa/Mastercard/Discover/Maestro: 16 digitos + CVV 3.
  // Amex: 15 digitos + CVV 4.
  function detectBrand(bin6) {
    if (/^4/.test(bin6)) return { name: 'VISA', length: 16, cvvLen: 3 }
    if (/^3[47]/.test(bin6)) return { name: 'AMEX', length: 15, cvvLen: 4 }
    if (/^(5[1-5]|2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720))/.test(bin6)) return { name: 'MASTERCARD', length: 16, cvvLen: 3 }
    if (/^(6011|65|64[4-9])/.test(bin6)) return { name: 'DISCOVER', length: 16, cvvLen: 3 }
    if (/^(36|30[0-5]|38|39)/.test(bin6)) return { name: 'DINERS', length: 14, cvvLen: 3 }
    if (/^(35)/.test(bin6)) return { name: 'JCB', length: 16, cvvLen: 3 }
    return { name: 'CARD', length: 16, cvvLen: 3 }
  }

  // Genera un número de tarjeta válido (Luhn) para un BIN de 6 dígitos.
  // length: longitud total del número (incluyendo BIN y check digit).
  function luhnComplete(bin6, length) {
    const targetBodyLen = length - 1 // sin check digit
    let body = bin6
    while (body.length < targetBodyLen) body += Math.floor(Math.random() * 10)
    body = body.slice(0, targetBodyLen)
    let sum = 0
    for (let i = 0; i < body.length; i++) {
      let d = parseInt(body[body.length - 1 - i], 10)
      if (i % 2 === 0) {
        d *= 2
        if (d > 9) d -= 9
      }
      sum += d
    }
    const check = (10 - (sum % 10)) % 10
    return body + check
  }

  // Elige un año futuro con sesgo hacia el más cercano.
  // Pesos: +0=0, +1=5, +2=4, +3=2, +4=1 → mayor probabilidad 0-2 años.
  function pickFutureYear() {
    const weights = [0, 5, 4, 2, 1] // +0, +1, +2, +3, +4
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i]
      if (r <= 0) return new Date().getFullYear() + i
    }
    return new Date().getFullYear() + 4
  }

  // Elige un mes. Si el año es el actual, el mes debe ser >= mes actual.
  function pickMonth(year) {
    const now = new Date()
    if (year === now.getFullYear()) {
      return now.getMonth() + 1 + Math.floor(Math.random() * (12 - now.getMonth()))
    }
    return 1 + Math.floor(Math.random() * 12)
  }

  function generateCard(bin6) {
    const brand = detectBrand(bin6)
    const number = luhnComplete(bin6, brand.length)
    const year = pickFutureYear()
    const month = pickMonth(year)
    const cvvMax = brand.cvvLen === 4 ? 10000 : 1000
    const cvvMin = brand.cvvLen === 4 ? 1000 : 100
    const cvv = String(cvvMin + Math.floor(Math.random() * (cvvMax - cvvMin)))
    return { number, month, year, cvv, brand: brand.name }
  }

  // /gen [bin]  o  .gen [bin]  → info del BIN + 12 cards generadas
  const handleGen = async (msg) => {
    const chatId = String(msg.chat.id)
    const text = msg.text || ''
    // Acepta: /gen 512060  ·  .gen 512060  ·  /gen  ·  .gen  ·  /gen@bot 512060
    const match = text.match(/^[\/.]gen(?:@\w+)?(?:\s+(\d{4,8}))?/)
    let bin = match && match[1] ? match[1] : null

    if (!bin) {
      // Si no pasaron BIN en este mensaje, usar el último que mandó el usuario
      bin = lastBinByChat.get(chatId) || null
    }

    if (!bin || !/^\d{4,8}$/.test(bin)) {
      return bot.sendMessage(
        chatId,
        '<b>Uso:</b>\n<code>/gen 512060</code>  o  <code>.gen 512060</code>\n\nTambién puedes escribir <code>/gen</code> solo y usará el último BIN que mandaste.',
        { parse_mode: 'HTML' }
      ).catch(() => {})
    }

    // Recordar BIN para próximos /gen sin args
    lastBinByChat.set(chatId, bin)

    bot.sendChatAction(chatId, 'typing').catch(() => {})
    try {
      const result = await lookupBin(bin)
      if (result.error) {
        return bot.sendMessage(chatId, `❌ ${result.error}`, { parse_mode: 'HTML' }).catch(() => {})
      }

      // Si el usuario mandó 4-5 dígitos, intentar completar a 6 con ceros a la izquierda
      // para generar tarjetas. Si mandó 6+ dígitos, usar los primeros 6.
      let bin6 = bin.length >= 6 ? bin.slice(0, 6) : bin.padStart(6, '0')
      // Validar que sea numérico
      if (!/^\d{6}$/.test(bin6)) bin6 = bin6.replace(/\D/g, '').padStart(6, '0').slice(0, 6)

      // ----- Generar 12 tarjetas con Luhn válido -----
      const cards = []
      for (let i = 0; i < 12; i++) {
        const c = generateCard(bin6)
        cards.push(`${c.number}|${pad2(c.month)}|${c.year}|${c.cvv}`)
      }

      const SEP = '━━━━━━━━━━━━━━'
      const parts = []

      // ----- Bloque 1: header -----
      parts.push(
        `<b>⌥ NoFace Gen | Extrap Database</b>`,
        SEP,
        `-${bin}|xx|xx|info-`,
        SEP
      )

      // ----- Bloque 2: 12 cards generadas -----
      parts.push(`<b>💳 Cards generadas (12):</b>`)
      for (const c of cards) parts.push(`<code>${c}</code>`)
      parts.push(SEP)

      // ----- Bloque 3: info del BIN exacto -----
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

      // ----- Bloque 4: BINs cercanos con datos -----
      if (result.nearby && result.nearby.length > 0) {
        parts.push(`<b>📡 BINs cercanos (${result.nearby.length}):</b>`)
        for (const n of result.nearby.slice(0, 15)) {
          const nb = n.bankName || '—'
          const nm = (n.brand || '—').toUpperCase()
          const nt = (n.type || '—').toUpperCase()
          const nc = `${n.countryEmoji || ''} ${(n.countryName || '—').toUpperCase()}`.trim()
          parts.push(
            `<code>${n.bin}</code>  ${nb} | ${nm} | ${nt} | ${nc}`
          )
        }
        if (result.nearby.length > 15) {
          parts.push(`<i>... y ${result.nearby.length - 15} más</i>`)
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
  // Acepta: /gen  ·  /gen 512060  ·  /gen@bot 512060  ·  .gen  ·  .gen 512060
  bot.onText(/^[\/.]gen(?:@\w+)?(?:\s+(\d{4,8}))?$/, handleGen)

  bot.on('message', (msg) => {
    const t = (msg.text || '').trim()
    // No responder a comandos (ya tienen su handler)
    if (!t) return
    if (t.startsWith('/')) return
    if (t.startsWith('.')) return
    bot.sendMessage(msg.chat.id, `<b>Your Telegram ID:</b> <code>${String(msg.chat.id)}</code>\n\nUse /start to register or go to nofacechk.com/register${GROUP_MESSAGE}`, { parse_mode: 'HTML', disable_web_page_preview: true }).catch(() => {})
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
