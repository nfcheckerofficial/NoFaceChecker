import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { MessageCircle, Check, AlertTriangle, Send, Eye, EyeOff, Bot, Users, Link } from 'lucide-react'
import { useTelegramStore } from '@/features/telegram/telegramStore'
import { useAuthStore } from '@/features/auth/authStore'
import { testTelegramConnection, fetchSubscribers } from '@/features/telegram/telegramService'

export function TelegramSettingsPage() {
  const { user, linkTelegram, error } = useAuthStore()
  const {
    botToken, chatId, enabled, lastSentAt, subscribers, subscriberCount,
    personalChatId, notifyPersonal, broadcastEnabled,
    setBotToken, setChatId, setEnabled, setSubscribers,
    setPersonalChatId, setNotifyPersonal, setBroadcastEnabled,
  } = useTelegramStore()

  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [localToken, setLocalToken] = useState(botToken)
  const [localChatId, setLocalChatId] = useState(chatId)
  const [linkTgId, setLinkTgId] = useState('')
  const [linkResult, setLinkResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchSubscribers().then(setSubscribers)
    const interval = setInterval(() => {
      fetchSubscribers().then(setSubscribers)
    }, 5000)
    return () => clearInterval(interval)
  }, [setSubscribers])

  const handleSave = () => {
    setBotToken(localToken.trim())
    setChatId(localChatId.trim())
    setTestResult({ ok: true, message: 'Settings saved successfully' })
    setTimeout(() => setTestResult(null), 3000)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const token = localToken.trim()
    const chat = localChatId.trim()

    if (!token) {
      setTestResult({ ok: false, message: 'Bot token is required' })
      setTesting(false)
      return
    }
    if (!chat) {
      setTestResult({ ok: false, message: 'Chat ID is required' })
      setTesting(false)
      return
    }

    const result = await testTelegramConnection(token, chat)
    setTestResult({
      ok: result.ok,
      message: result.ok ? 'Test message sent! Check your Telegram.' : (result.error ?? 'Connection failed'),
    })
    setTesting(false)
  }

  const handleRefresh = async () => {
    const subs = await fetchSubscribers()
    setSubscribers(subs)
  }

  const formatDate = (ts: number | null) => {
    if (!ts) return 'Never'
    return new Date(ts).toLocaleString()
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Bot size={24} className="text-cyber-blue" />
        <div>
          <h1 className="text-2xl font-bold text-cyber-text">Telegram Bot</h1>
          <p className="text-sm text-cyber-text-muted mt-1">
            Receive live card notifications directly in your Telegram chat
          </p>
        </div>
      </div>

      {testResult && (
        <div className={clsx(
          'px-4 py-3 rounded-lg border text-sm flex items-center gap-2',
          testResult.ok
            ? 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green'
            : 'bg-cyber-red/10 border-cyber-red/40 text-cyber-red'
        )}>
          {testResult.ok ? <Check size={16} /> : <AlertTriangle size={16} />}
          {testResult.message}
        </div>
      )}

      {/* Setup guide */}
      <div className="rounded-lg border border-cyber-blue/30 bg-cyber-blue/5 p-5">
        <h3 className="text-sm font-semibold text-cyber-text mb-3">How to set up your bot</h3>
        <ol className="space-y-2 text-sm text-cyber-text-muted list-decimal list-inside">
          <li>Open Telegram and search for <span className="font-mono text-cyber-blue">@BotFather</span></li>
          <li>Send <span className="font-mono text-cyber-blue">/newbot</span> and follow the prompts to create your bot</li>
          <li>Copy the <strong>bot token</strong> (looks like <span className="font-mono text-cyber-blue">123456:ABC-DEF...</span>)</li>
          <li>Paste the token below</li>
          <li>Search for your bot on Telegram and send <span className="font-mono text-cyber-blue">/start</span> to get your ID</li>
          <li>Register at <span className="font-mono text-cyber-blue">nofacechk.com/register</span> using that ID</li>
          <li>All registered users will receive live cards automatically</li>
          <li>Users can send <span className="font-mono text-cyber-blue">/stop</span> to unsubscribe at any time</li>
        </ol>
      </div>

      {/* Settings form */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-5 space-y-4">
        <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
          <MessageCircle size={16} className="text-cyber-blue" />
          Bot Configuration
        </h3>

        <div>
          <label className="block text-sm text-cyber-text-muted mb-1">Bot Token</label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={localToken}
              onChange={(e) => setLocalToken(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-cyber-black border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue font-mono"
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-text-muted hover:text-cyber-text"
            >
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-cyber-text-muted mb-1">Your Chat ID (for testing)</label>
          <input
            type="text"
            value={localChatId}
            onChange={(e) => setLocalChatId(e.target.value)}
            className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue font-mono"
            placeholder="123456789"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-cyber-dark border border-cyber-border rounded-full peer peer-checked:bg-cyber-green peer-checked:border-cyber-green/50 after:content-[''] after:absolute after:top-0.5 after:start-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-[19px]" />
          </label>
          <span className="text-sm text-cyber-text-muted">
            {enabled ? 'Notifications enabled — live cards broadcast to all subscribers' : 'Notifications disabled'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleSave}
            className="px-4 py-2.5 bg-cyber-blue/20 border border-cyber-blue/50 rounded-lg text-sm text-cyber-blue hover:bg-cyber-blue/30 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={14} /> Save Settings
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !localToken.trim() || !localChatId.trim()}
            className="px-4 py-2.5 bg-cyber-green/20 border border-cyber-green/50 rounded-lg text-sm text-cyber-green hover:bg-cyber-green/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {testing ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full" />
            ) : (
              <Send size={14} />
            )}
            Test Connection
          </button>
        </div>
      </div>

      {/* Personal notification */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
          <Send size={16} className="text-cyber-green" />
          Personal Notification
        </h3>
        <p className="text-xs text-cyber-text-muted">
          Send live cards directly to your personal Telegram chat, without needing subscribers.
        </p>
        <input
          type="text"
          value={personalChatId}
          onChange={(e) => setPersonalChatId(e.target.value)}
          className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-green font-mono"
          placeholder="Enter your Telegram chat ID"
        />
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifyPersonal}
              onChange={(e) => setNotifyPersonal(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-cyber-dark border border-cyber-border rounded-full peer peer-checked:bg-cyber-green peer-checked:border-cyber-green/50 after:content-[''] after:absolute after:top-0.5 after:start-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-[19px]" />
          </label>
          <span className="text-sm text-cyber-text-muted">
            {notifyPersonal ? 'Live cards will be sent to your chat' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Broadcast Toggle */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-5 space-y-3">
        <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
          <Users size={16} className="text-cyber-red" />
          Broadcast to ALL subscribers
        </h3>
        <p className="text-xs text-cyber-text-muted">
          When enabled, every live card found by ANY user gets sent to ALL bot subscribers. Disable to keep lives private (only the user who found it gets notified).
        </p>
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={broadcastEnabled}
              onChange={(e) => setBroadcastEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-cyber-dark border border-cyber-border rounded-full peer peer-checked:bg-cyber-red peer-checked:border-cyber-red/50 after:content-[''] after:absolute after:top-0.5 after:start-[3px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-[19px]" />
          </label>
          <span className="text-sm text-cyber-text-muted">
            {broadcastEnabled ? 'Broadcasting live cards to ALL subscribers' : 'Broadcast disabled — lives are private'}
          </span>
        </div>
      </div>

      {/* Subscribers */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <Users size={16} className="text-cyber-blue" />
            Subscribers ({subscriberCount})
          </h3>
          <button
            onClick={handleRefresh}
            className="text-xs text-cyber-blue hover:underline"
          >
            Refresh
          </button>
        </div>
        {subscribers.length === 0 ? (
          <p className="text-sm text-cyber-text-muted">
            No subscribers yet. Users can send <span className="font-mono text-cyber-blue">/start</span> to your bot to register.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {subscribers.map((sub) => (
              <div key={sub.chat_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyber-black/60 border border-cyber-border/40">
                <div>
                  <span className="text-sm text-cyber-text font-medium">
                    {sub.first_name || sub.username || sub.chat_id}
                  </span>
                  {sub.username && (
                    <span className="text-xs text-cyber-text-muted ml-2">@{sub.username}</span>
                  )}
                </div>
                <span className="text-[10px] text-cyber-text-muted">
                  {new Date(sub.subscribed_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link your Telegram */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-cyber-text flex items-center gap-2 mb-3">
          <Link size={16} className="text-cyber-blue" />
          Link Telegram Account
        </h3>
        {user?.telegram_id ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyber-green/10 border border-cyber-green/40">
            <div>
              <p className="text-sm text-cyber-green">Telegram linked</p>
              <p className="text-xs text-cyber-text-muted mt-0.5">ID: {user.telegram_id}</p>
            </div>
            <Check size={16} className="text-cyber-green" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-cyber-text-muted leading-relaxed">
              Send <span className="text-cyber-green">/start</span> to{' '}
              <span className="text-cyber-blue">@NoFaceCheckerBot</span> on Telegram to get your Telegram ID, then enter it below to link it to your account. You can then login with your Telegram ID.
            </p>
            {linkResult && (
              <div className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs',
                linkResult.ok
                  ? 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green'
                  : 'bg-cyber-red/10 border-cyber-red/40 text-cyber-red'
              )}>
                {linkResult.ok ? <Check size={12} /> : <AlertTriangle size={12} />}
                {linkResult.message}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={linkTgId}
                onChange={(e) => setLinkTgId(e.target.value)}
                className="flex-1 px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue"
                placeholder="Enter your Telegram ID"
              />
              <button
                onClick={async () => {
                  setLinkResult(null)
                  const ok = await linkTelegram(linkTgId.trim())
                  setLinkResult({ ok, message: ok ? 'Telegram linked successfully!' : error || 'Failed to link Telegram' })
                  if (ok) setLinkTgId('')
                }}
                disabled={!linkTgId.trim()}
                className="px-4 py-2 bg-cyber-blue/20 border border-cyber-blue/50 rounded-lg text-sm text-cyber-blue hover:bg-cyber-blue/30 transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                <Link size={14} /> Link
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-cyber-text mb-3">Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-cyber-text-muted">Status</p>
            <p className={clsx(
              'text-sm font-medium mt-0.5 flex items-center gap-1.5',
              enabled && botToken ? 'text-cyber-green' : 'text-cyber-text-muted'
            )}>
              <span className={clsx(
                'w-2 h-2 rounded-full inline-block',
                enabled && botToken ? 'bg-cyber-green' : 'bg-cyber-text-muted'
              )} />
              {enabled && botToken ? 'Broadcasting' : 'Disabled'}
            </p>
          </div>
          <div>
            <p className="text-xs text-cyber-text-muted">Subscribers</p>
            <p className="text-sm text-cyber-text mt-0.5">{subscriberCount}</p>
          </div>
          <div>
            <p className="text-xs text-cyber-text-muted">Last Sent</p>
            <p className="text-sm text-cyber-text mt-0.5">{formatDate(lastSentAt)}</p>
          </div>
          <div>
            <p className="text-xs text-cyber-text-muted">Mode</p>
            <p className="text-sm text-cyber-text mt-0.5">Broadcast · all subscribers</p>
          </div>
        </div>
      </div>
    </div>
  )
}
