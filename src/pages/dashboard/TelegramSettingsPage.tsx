import { useState } from 'react'
import { clsx } from 'clsx'
import { MessageCircle, Check, X, AlertTriangle, Send, Eye, EyeOff, Bot } from 'lucide-react'
import { useTelegramStore } from '@/features/telegram/telegramStore'
import { testTelegramConnection } from '@/features/telegram/telegramService'

export function TelegramSettingsPage() {
  const {
    botToken, chatId, enabled, lastSentAt,
    setBotToken, setChatId, setEnabled,
  } = useTelegramStore()

  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [localToken, setLocalToken] = useState(botToken)
  const [localChatId, setLocalChatId] = useState(chatId)

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

      {/* Test result notification */}
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
          <li>Search for your bot on Telegram and send <span className="font-mono text-cyber-blue">/start</span></li>
          <li>Search for <span className="font-mono text-cyber-blue">@userinfobot</span> and send <span className="font-mono text-cyber-blue">/start</span> to get your Chat ID</li>
          <li>Paste the Chat ID below and click <strong>Test Connection</strong></li>
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
          <label className="block text-sm text-cyber-text-muted mb-1">Chat ID</label>
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
            {enabled ? 'Notifications enabled — live cards will be sent to Telegram' : 'Notifications disabled'}
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

      {/* Stats */}
      <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-5">
        <h3 className="text-sm font-semibold text-cyber-text mb-3">Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-cyber-text-muted">Connection</p>
            <p className={clsx(
              'text-sm font-medium mt-0.5 flex items-center gap-1.5',
              enabled && botToken && chatId ? 'text-cyber-green' : 'text-cyber-text-muted'
            )}>
              <span className={clsx(
                'w-2 h-2 rounded-full inline-block',
                enabled && botToken && chatId ? 'bg-cyber-green' : 'bg-cyber-text-muted'
              )} />
              {enabled && botToken && chatId ? 'Connected' : 'Not configured'}
            </p>
          </div>
          <div>
            <p className="text-xs text-cyber-text-muted">Last Sent</p>
            <p className="text-sm text-cyber-text mt-0.5">{formatDate(lastSentAt)}</p>
          </div>
          <div>
            <p className="text-xs text-cyber-text-muted">Status</p>
            <p className="text-sm text-cyber-text mt-0.5">
              {enabled ? 'Active · sending live cards' : 'Disabled'}
            </p>
          </div>
          <div>
            <p className="text-xs text-cyber-text-muted">Format</p>
            <p className="text-sm text-cyber-text mt-0.5">Markdown · masked card</p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {enabled && botToken && chatId && (
        <div className="rounded-lg border border-cyber-border bg-cyber-dark/60 p-5">
          <h3 className="text-sm font-semibold text-cyber-text mb-3">Message Preview</h3>
          <div className="bg-cyber-black/70 border border-cyber-border rounded-lg p-4 font-mono text-xs whitespace-pre-wrap">
            <span className="text-cyber-green">🚀 LIVE CARD DETECTED</span>{'\n\n'}
            <span className="text-cyber-text">5276****2801</span>{'\n\n'}
            <span className="text-cyber-text-muted">── GATE ──</span>{'\n'}
            <span className="text-cyber-text">Vice Gate</span>{'\n\n'}
            <span className="text-cyber-text-muted">── BIN INFO ──</span>{'\n'}
            <span className="text-cyber-text">BIN: </span><span className="text-cyber-blue">527601</span>{'\n'}
            <span className="text-cyber-text">Brand: </span>MASTERCARD{'\n'}
            <span className="text-cyber-text">Issuer: </span>Bank of America{'\n'}
            <span className="text-cyber-text">Country: </span>{'\u{1F1FA}\u{1F1F8}'} United States{'\n'}
            <span className="text-cyber-text">Type: </span>credit · classic{'\n\n'}
            <span className="text-cyber-text-muted">Response: </span>Approved · CVV Match
          </div>
        </div>
      )}
    </div>
  )
}
