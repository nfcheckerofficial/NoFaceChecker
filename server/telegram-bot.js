import TelegramBot from 'node-telegram-bot-api'
import { addSubscriber, removeSubscriber, listSubscribers } from './db.js'

let bot = null

export function startBot(token) {
  if (bot) return bot

  bot = new TelegramBot(token, { polling: { interval: 2000, params: { timeout: 10 } } })
  bot.on('polling_error', (err) => {
    const msg = err?.message || String(err)
    if (msg.includes('409') || msg.includes('fetch failed') || msg.includes('EFATAL')) {
      console.warn(`[Telegram Bot] Recoverable error - restarting polling in 15s: ${msg}`)
      bot.stopPolling()
      setTimeout(() => {
        try { bot.startPolling() } catch {}
      }, 15000)
    } else {
      console.error('[Telegram Bot] Polling error:', msg)
    }
  })
  console.log('[Telegram Bot] Started polling')

  bot.onText(/\/start/, (msg) => {
    const chatId = String(msg.chat.id)
    const username = msg.from?.username || null
    const firstName = msg.from?.first_name || null

    addSubscriber(chatId, username, firstName)

    bot.sendMessage(
      chatId,
      `*No Face Checker Bot* 🚀\n\nYou are now registered\\! You will receive all live cards as they are detected\\.\n\nSend /stop to unsubscribe\\.\nSend /status to check your registration\\.`,
      { parse_mode: 'MarkdownV2' }
    )
    console.log(`[Telegram Bot] New subscriber: ${chatId} (${username || firstName || 'unknown'})`)
  })

  bot.onText(/\/stop/, (msg) => {
    const chatId = String(msg.chat.id)
    removeSubscriber(chatId)
    bot.sendMessage(chatId, 'You have been unsubscribed\\. Send /start to register again\\.', { parse_mode: 'MarkdownV2' })
    console.log(`[Telegram Bot] Unsubscribed: ${chatId}`)
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

  bot.on('polling_error', (err) => {
    console.error('[Telegram Bot] Polling error:', err.message)
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
