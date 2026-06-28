import { useState, useCallback, useEffect } from 'react'
import { Mail, RefreshCw, Copy, Check, Trash2, Inbox, Loader2, MessageSquare, ChevronLeft, User, Clock } from 'lucide-react'

const BASE = 'https://www.1secmail.com/api/v1'

interface EmailMessage {
  id: number
  from: string
  subject: string
  date: string
}

interface EmailDetail {
  id: number
  from: string
  subject: string
  date: string
  textBody: string
  htmlBody: string
}

function randomAddr(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let r = ''
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)]
  return r
}

export function InstaddrPage() {
  const [login, setLogin] = useState(randomAddr)
  const [domain, setDomain] = useState('1secmail.com')
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [selected, setSelected] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [reading, setReading] = useState(false)
  const [copied, setCopied] = useState(false)
  const email = `${login}@${domain}`

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}?action=getMessages&login=${login}&domain=${domain}`)
      if (!res.ok) return
      const data: EmailMessage[] = await res.json()
      setMessages(data)
    } catch {}
    setLoading(false)
  }, [login, domain])

  const readMessage = async (id: number) => {
    setReading(true)
    try {
      const res = await fetch(`${BASE}?action=readMessage&login=${login}&domain=${domain}&id=${id}`)
      if (!res.ok) return
      const data: EmailDetail = await res.json()
      setSelected(data)
    } catch {}
    setReading(false)
  }

  const deleteMessage = async (id: number) => {
    try {
      await fetch(`${BASE}?action=deleteMessage&login=${login}&domain=${domain}&id=${id}`, { method: 'GET' })
      setMessages(p => p.filter(m => m.id !== id))
    } catch {}
  }

  useEffect(() => { fetchMessages() }, [])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const newAddress = () => {
    setLogin(randomAddr())
    setMessages([])
    setSelected(null)
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-md bg-cyber-yellow/15 border border-cyber-yellow/40 flex items-center justify-center">
          <Mail size={20} className="text-cyber-yellow" />
        </span>
        <div>
          <h1 className="text-xl font-orbitron font-bold text-cyber-text tracking-wide">Instaddr</h1>
          <p className="text-xs text-cyber-text-muted">Temporary email inbox</p>
        </div>
      </header>

      <div className="grid gap-6">
        {/* Email address card */}
        <div className="rounded-xl border border-cyber-border/60 bg-gradient-to-br from-cyber-panel/80 to-cyber-dark/80 backdrop-blur-sm p-5">
          <label className="block text-[11px] text-cyber-text-muted/80 uppercase tracking-widest font-semibold mb-3">
            Your temporary email
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-cyber-dark/90 border border-cyber-border rounded-lg">
              <span className="text-sm text-cyber-text-muted/60">{login}</span>
              <span className="text-cyber-yellow/60">@</span>
              <select
                value={domain}
                onChange={e => { setDomain(e.target.value); setMessages([]); setSelected(null) }}
                className="bg-transparent text-sm text-cyber-yellow focus:outline-none"
              >
                <option value="1secmail.com">1secmail.com</option>
                <option value="1secmail.org">1secmail.org</option>
                <option value="1secmail.net">1secmail.net</option>
              </select>
            </div>
            <button onClick={copyEmail} className="w-11 h-11 flex items-center justify-center rounded-lg border border-cyber-border bg-cyber-dark/80 hover:bg-cyber-panel transition-colors text-cyber-text-muted hover:text-cyber-text">
              {copied ? <Check size={16} className="text-cyber-green" /> : <Copy size={16} />}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={newAddress}
              className="px-3 py-1.5 rounded-lg border border-cyber-border/60 bg-cyber-dark/50 hover:bg-cyber-panel transition-colors text-xs text-cyber-text-muted hover:text-cyber-text flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              New address
            </button>
            <span className="text-[11px] text-cyber-text-muted/40 select-all">{email}</span>
          </div>
        </div>

        {/* Inbox */}
        <div className="rounded-xl border border-cyber-border/60 bg-gradient-to-br from-cyber-panel/80 to-cyber-dark/80 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-cyber-border/40">
            <div className="flex items-center gap-2">
              <Inbox size={15} className="text-cyber-yellow" />
              <span className="text-sm font-semibold text-cyber-text tracking-wide">Inbox</span>
              {messages.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyber-yellow/10 text-cyber-yellow border border-cyber-yellow/20">
                  {messages.length}
                </span>
              )}
            </div>
            <button
              onClick={fetchMessages}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-dark/60 border border-cyber-border/40 text-xs text-cyber-text-muted hover:text-cyber-text hover:border-cyber-text-muted/40 transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {selected ? (
            <div className="p-5">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-xs text-cyber-text-muted hover:text-cyber-text mb-4 transition-colors"
              >
                <ChevronLeft size={14} />
                Back to inbox
              </button>
              <div className="space-y-3 mb-4 pb-4 border-b border-cyber-border/30">
                <div className="flex items-center gap-2 text-xs text-cyber-text-muted">
                  <User size={12} />
                  <span className="text-cyber-text">{selected.from}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-cyber-text-muted">
                  <MessageSquare size={12} />
                  <span className="text-cyber-text font-semibold">{selected.subject || '(no subject)'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-cyber-text-muted">
                  <Clock size={12} />
                  {selected.date}
                </div>
              </div>
              <div className="text-sm text-cyber-text/80 leading-relaxed whitespace-pre-wrap font-mono">
                {selected.textBody || <span className="text-cyber-text-muted italic">(empty message)</span>}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-cyber-border/20">
              {loading && messages.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={20} className="animate-spin text-cyber-text-muted" />
                </div>
              )}
              {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Mail size={28} className="text-cyber-text-muted/30 mb-3" />
                  <p className="text-sm text-cyber-text-muted/60">No messages yet</p>
                  <p className="text-xs text-cyber-text-muted/40 mt-1">Send an email to this address to see it here</p>
                </div>
              )}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => readMessage(msg.id)}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-cyber-panel/50 transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-cyber-yellow/10 border border-cyber-yellow/20 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-cyber-yellow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-cyber-text truncate">{msg.from}</span>
                    </div>
                    <p className="text-xs text-cyber-text-muted truncate mt-0.5">{msg.subject || '(no subject)'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-cyber-text-muted/50 whitespace-nowrap">{msg.date}</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteMessage(msg.id) }}
                      className="p-1.5 rounded-lg text-cyber-text-muted/40 hover:text-cyber-red hover:bg-cyber-red/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {selected && reading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={20} className="animate-spin text-cyber-text-muted" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
