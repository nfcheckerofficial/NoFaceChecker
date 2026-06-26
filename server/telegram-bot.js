import TelegramBot from 'node-telegram-bot-api'
import { addSubscriber, removeSubscriber, listSubscribers, ensureTelegramUser } from './db.js'

let bot = null

export function startBot(token) {
  if (bot) return bot

  bot = new TelegramBot(token, { polling: false })

  bot.on('polling_error', (err) => {
    const msg = err?.message || String(err)
    if (msg.includes('409')) {
      console.warn(`[Telegram Bot] 409 conflict - another instance detected, waiting 30s...`)
      bot.stopPolling()
      setTimeout(() => {
        bot.deleteWebHook().catch(() => {})
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

  await bot.deleteWebHook()
  await bot.setMyCommands([
    { command: 'start', description: 'Register & get your Telegram ID' },
    { command: 'id', description: 'Get your Telegram ID' },
    { command: 'status', description: 'Check your registration status' },
    { command: 'stop', description: 'Unsubscribe from notifications' },
  ])

  bot.startPolling({ interval: 2000, params: { timeout: 10 } })
  console.log('[Telegram Bot] Started polling')

  bot.onText(/\/start/, (msg) => {
    const chatId = String(msg.chat.id)
    const tgUsername = msg.from?.username || null
    const firstName = msg.from?.first_name || null

    addSubscriber(chatId, tgUsername, firstName)

    const user = ensureTelegramUser(chatId, tgUsername, firstName)

    bot.sendMessage(
      chatId,
      `*No Face Checker Bot* 🚀\n\nYour Telegram ID:\n\`${chatId}\`\n\nUse this ID to register/login at nofacechk\\.com\n\nYou will receive all live cards as they are detected\\.\n\nSend /id to get your ID\\nSend /stop to unsubscribe`,
      { parse_mode: 'MarkdownV2' }
    )
    console.log(`[Telegram Bot] New subscriber: ${chatId} (${tgUsername || firstName || 'unknown'})`)
  })

  bot.onText(/\/stop/, (msg) => {
    const chatId = String(msg.chat.id)
    removeSubscriber(chatId)
    bot.sendMessage(chatId, 'You have been unsubscribed\\. Send /start to register again\\.', { parse_mode: 'MarkdownV2' })
    console.log(`[Telegram Bot] Unsubscribed: ${chatId}`)
  })

  bot.onText(/\/id/, (msg) => {
    const chatId = String(msg.chat.id)
    bot.sendMessage(
      chatId,
      `Your Telegram ID:\n\`${chatId}\``,
      { parse_mode: 'MarkdownV2' }
    )
  })

  bot.onText(/\/status/, (msg) => {
    const chatId = String(msg.chat.id)
    const subs = listSubscribers()
    const isRegistered = subs.some((s) => s.chat_id === chatId)
    if (isRegistered) {
      bot.sendMessage(chatId, '✅ You are registered and will receive all live cards\\.', { parse_mode: 'MarkdownV2' })
    } else {
      bot.sendMessage(chatId, '❌ You are not registered\\. Send /start to register\\.', { parse_mode: 'MarkdownV2' })
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
