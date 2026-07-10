import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Mail, RefreshCw, Copy, Check, Trash2, Inbox, Loader2, MessageSquare, ChevronLeft, User, Clock, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { Section, Card, Grid, Divider } from '@/shared/ui/Section'

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

const DOMAINS = ['1secmail.com', '1secmail.org', '1secmail.net']

function randomAddr(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function InstaddrPage() {
  const [login, setLogin] = useState(randomAddr)
  const [domain, setDomain] = useState('1secmail.com')
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [selected, setSelected] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [reading, setReading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const email = `${login}@${domain}`

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`${BASE}?action=getMessages&login=${login}&domain=${domain}`)
      if (res.ok) {
        const data: EmailMessage[] = await res.json()
        setMessages(data)
      }
    } catch {}
    if (!silent) setLoading(false)
  }, [login, domain])

  const readMessage = async (id: number) => {
    setReading(true)
    try {
      const res = await fetch(`${BASE}?action=readMessage&login=${login}&domain=${domain}&id=${id}`)
      if (res.ok) {
        const data: EmailDetail = await res.json()
        setSelected(data)
      }
    } catch {}
    setReading(false)
  }

  const deleteMessage = async (id: number) => {
    try {
      await fetch(`${BASE}?action=deleteMessage&login=${login}&domain=${domain}&id=${id}`, { method: 'GET' })
      setMessages(p => p.filter(m => m.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch {}
  }

  useEffect(() => {
    fetchMessages()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      return
    }
    intervalRef.current = setInterval(() => fetchMessages(true), 10000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchMessages])

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
    <div className="max-w-[960px] mx-auto space-y-5">

      {/* Email address */}
      <Section title="Temporary Email" icon={<Mail size={14} />} accent="yellow">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <span className="text-sm font-mono text-cyber-text-muted/70">{login}</span>
              <span className="text-cyber-yellow/50">@</span>
              <select
                value={domain}
                onChange={e => { setDomain(e.target.value); setMessages([]); setSelected(null) }}
                className="bg-transparent text-sm text-cyber-yellow/80 focus:outline-none font-mono"
              >
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button onClick={copyEmail}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-cyber-text-muted hover:text-cyber-text shrink-0">
              {copied ? <Check size={15} className="text-cyber-green" /> : <Copy size={15} />}
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-cyber-text-muted/50 font-mono">
            <span className="select-all">{email}</span>
            <span className="text-cyber-text-muted/30">•</span>
            <button onClick={newAddress} className="flex items-center gap-1.5 text-cyber-yellow/60 hover:text-cyber-yellow transition-colors">
              <RefreshCw size={11} /> Generate new
            </button>
          </div>
        </div>
      </Section>

      {/* Inbox */}
      <Section
        title="Inbox"
        icon={<Inbox size={14} />}
        accent="yellow"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyber-yellow/10 text-cyber-yellow border border-cyber-yellow/20 font-mono">
                {messages.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[10px] text-cyber-text-muted/50 cursor-pointer">
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
                className="w-3 h-3 rounded border-white/20 bg-white/[0.05] text-cyber-yellow focus:ring-0" />
              Auto
            </label>
            <button onClick={() => fetchMessages()} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-[11px] text-cyber-text-muted/70 hover:text-cyber-text hover:bg-white/[0.03] disabled:opacity-40 transition-colors font-mono">
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {selected ? (
          <div className="p-5">
            <button onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 text-xs text-cyber-text-muted/60 hover:text-cyber-text transition-colors mb-5 font-mono">
              <ChevronLeft size={14} /> Back
            </button>
            <div className="space-y-4 mb-5 pb-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-8 h-8 rounded-lg bg-cyber-yellow/10 border border-cyber-yellow/20 flex items-center justify-center shrink-0">
                  <User size={14} className="text-cyber-yellow" />
                </span>
                <div>
                  <p className="text-sm text-cyber-text/90 font-mono">{selected.from}</p>
                  <p className="text-[11px] text-cyber-text-muted/50 font-mono">{selected.subject || '(no subject)'}</p>
                </div>
              </div>
              <p className="text-[11px] text-cyber-text-muted/40 font-mono flex items-center gap-1.5">
                <Clock size={10} /> {selected.date}
              </p>
            </div>
            <div className="text-sm text-cyber-text/70 leading-relaxed whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
              {selected.textBody || <span className="text-cyber-text-muted/50 italic">(empty message)</span>}
            </div>
          </div>
        ) : loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={18} className="animate-spin text-cyber-text-muted/40" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Mail size={22} className="text-cyber-text-muted/30" />
            </div>
            <p className="text-sm text-cyber-text-muted/60 font-mono">No messages yet</p>
            <p className="text-xs text-cyber-text-muted/40 mt-1.5 font-mono">Send an email to this address to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {messages.map(msg => (
              <div key={msg.id} onClick={() => readMessage(msg.id)}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <div className="w-9 h-9 rounded-xl bg-cyber-yellow/8 border border-cyber-yellow/15 flex items-center justify-center shrink-0">
                  <Mail size={14} className="text-cyber-yellow/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cyber-text/80 truncate font-mono">{msg.from}</p>
                  <p className="text-xs text-cyber-text-muted/50 truncate mt-0.5">{msg.subject || '(no subject)'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-cyber-text-muted/40 whitespace-nowrap font-mono">{timeAgo(msg.date)}</span>
                  <button onClick={e => { e.stopPropagation(); deleteMessage(msg.id) }}
                    className="p-1.5 rounded-lg text-cyber-text-muted/30 hover:text-cyber-red hover:bg-cyber-red/10 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
