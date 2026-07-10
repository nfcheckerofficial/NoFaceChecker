import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Mail, RefreshCw, Copy, Check, Trash2, Inbox, Loader2, MessageSquare, ChevronLeft, User, Clock, Search, Download, Square, CheckSquare } from 'lucide-react'
import { clsx } from 'clsx'
import { Section } from '@/shared/ui/Section'

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''

const FALLBACK_DOMAINS = [
  '1secmail.com',
  '1secmail.net',
  '1secmail.org',
  '1secmail.xyz',
]

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
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function InstaddrPage() {
  const [login, setLogin] = useState(randomAddr)
  const [domain, setDomain] = useState('1secmail.com')
  const [domains, setDomains] = useState(FALLBACK_DOMAINS)
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [selected, setSelected] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [reading, setReading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [readIds, setReadIds] = useState<Set<number>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const email = `${login}@${domain}`

  function apiUrl(action: string, extra?: Record<string, string>): string {
    const params = new URLSearchParams({ action, login, domain, ...extra })
    return `${API_BASE}/api/instaddr/?${params}`
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/instaddr/?action=getDomainList`)
      .then(r => { try { return r.json() } catch { return [] } })
      .then((data: string[]) => { if (data?.length && Array.isArray(data)) setDomains(data) })
      .catch(() => {})
  }, [])

  const [apiError, setApiError] = useState('')

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); setApiError('')
    try {
      const res = await fetch(apiUrl('getMessages'))
      if (res.ok) {
        const data: EmailMessage[] = await res.json()
        setMessages(Array.isArray(data) ? data : [])
      } else {
        if (!silent) setApiError(`API error: ${res.status} ${res.statusText}`)
      }
    } catch {
      if (!silent) setApiError('Connection error — check your network or try again')
    }
    if (!silent) setLoading(false)
  }, [login, domain])

  const readMessage = async (id: number) => {
    setReading(true); setApiError('')
    try {
      const res = await fetch(apiUrl('readMessage', { id: String(id) }))
      if (res.ok) {
        const data: EmailDetail = await res.json()
        setSelected(data)
        setReadIds(prev => new Set(prev).add(id))
      }
    } catch {}
    setReading(false)
  }

  const deleteMessage = async (id: number) => {
    try {
      await fetch(apiUrl('deleteMessage', { id: String(id) }), { method: 'GET' })
      setMessages(p => p.filter(m => m.id !== id))
      setSelectedIds(p => { const n = new Set(p); n.delete(id); return n })
      if (selected?.id === id) setSelected(null)
    } catch {}
  }

  const deleteSelected = async () => {
    for (const id of selectedIds) await deleteMessage(id)
    setSelectedIds(new Set())
  }

  const copyText = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500) } catch {}
  }

  useEffect(() => { fetchMessages() }, [])
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoRefresh) intervalRef.current = setInterval(() => fetchMessages(true), 10000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchMessages])

  const newAddress = () => {
    setLogin(randomAddr())
    setMessages([])
    setSelected(null)
    setSelectedIds(new Set())
  }

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    const q = searchQuery.toLowerCase()
    return messages.filter(m => m.from.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q))
  }, [messages, searchQuery])

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filteredMessages.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredMessages.map(m => m.id)))
  }

  const isAllSelected = filteredMessages.length > 0 && selectedIds.size === filteredMessages.length

  return (
    <div className="max-w-[960px] mx-auto space-y-5">

      {/* Address card */}
      <Section title="Temporary Email" icon={<Mail size={14} />} accent="yellow">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-1.5 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <input type="text" value={login} onChange={e => setLogin(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 30))}
                onKeyDown={e => { if (e.key === 'Enter') { setMessages([]); setSelected(null); fetchMessages() } }}
                className="bg-transparent text-sm font-mono text-cyber-text/90 focus:outline-none min-w-[60px] flex-1 placeholder:text-cyber-text-muted/30"
                placeholder="tu-nombre" spellCheck={false} />
              <span className="text-cyber-text-muted/40 text-sm">@</span>
              <select value={domain} onChange={e => { setDomain(e.target.value); setMessages([]); setSelected(null) }}
                className="bg-transparent text-sm text-cyber-yellow/80 focus:outline-none font-mono cursor-pointer max-w-[130px]">
                {domains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button onClick={() => copyText(email, 'email')}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors shrink-0">
              {copied === 'email' ? <Check size={15} className="text-cyber-green" /> : <Copy size={15} className="text-cyber-text-muted" />}
            </button>
            <button onClick={() => { setMessages([]); setSelected(null); setSelectedIds(new Set()); fetchMessages() }}
              className="h-10 px-3 flex items-center gap-1.5 rounded-xl border border-cyber-green/20 bg-cyber-green/[0.04] hover:bg-cyber-green/[0.08] text-xs text-cyber-green/70 hover:text-cyber-green transition-colors shrink-0 font-mono whitespace-nowrap">
              <Mail size={12} /> Create
            </button>
            <button onClick={newAddress}
              className="h-10 px-3 flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-xs text-cyber-text-muted/70 hover:text-cyber-text transition-colors shrink-0 font-mono">
              <RefreshCw size={12} /> Random
            </button>
          </div>
          <p className="text-xs text-cyber-text-muted/40 font-mono select-all px-1">{email}</p>
        </div>
      </Section>

      {apiError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-cyber-red/20 bg-cyber-red/[0.04] text-xs text-cyber-red/80 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-red shrink-0" />
          {apiError}
        </div>
      )}

      {/* Inbox */}
      <Section title="Inbox" icon={<Inbox size={14} />} accent="yellow">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <button onClick={selectAll}
                  className="p-1.5 rounded-lg text-cyber-text-muted/50 hover:text-cyber-text hover:bg-white/[0.03] transition-colors">
                  {isAllSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                </button>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyber-yellow/10 text-cyber-yellow border border-cyber-yellow/20 font-mono">
                  {messages.length}
                </span>
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-[10px] text-cyber-text-muted/50 font-mono">({selectedIds.size})</span>
                    <button onClick={deleteSelected}
                      className="p-1.5 rounded-lg text-cyber-text-muted/50 hover:text-cyber-red hover:bg-cyber-red/10 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selected ? (
              <button onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-[11px] text-cyber-text-muted/70 hover:text-cyber-text transition-colors font-mono">
                <ChevronLeft size={13} /> Back
              </button>
            ) : (
              <>
                <div className="relative hidden sm:block">
                  <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyber-text-muted/30" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..." 
                    className="w-28 lg:w-36 pl-7 pr-2.5 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-[11px] text-cyber-text/80 placeholder:text-cyber-text-muted/30 focus:outline-none focus:border-white/[0.12] font-mono transition-colors" />
                </div>
                <label className="flex items-center gap-1.5 text-[10px] text-cyber-text-muted/50 cursor-pointer select-none">
                  <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
                    className="w-3 h-3 rounded border-white/20 bg-white/[0.05] text-cyber-yellow focus:ring-0" />
                  Auto
                </label>
                <button onClick={() => fetchMessages()} disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-[11px] text-cyber-text-muted/70 hover:text-cyber-text hover:bg-white/[0.03] disabled:opacity-40 transition-colors font-mono">
                  <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {selected ? (
          <div className="p-5">
            <div className="space-y-4 mb-5 pb-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyber-yellow/8 border border-cyber-yellow/15 flex items-center justify-center shrink-0">
                  <User size={15} className="text-cyber-yellow/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-cyber-text/90 font-mono truncate">{selected.from}</p>
                  <p className="text-[11px] text-cyber-text-muted/50 font-mono truncate mt-0.5">{selected.subject || '(no subject)'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => copyText(selected.textBody || selected.htmlBody || '', 'body')}
                    className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text hover:bg-white/[0.03] transition-colors"
                    title="Copy body">
                    {copied === 'body' ? <Check size={13} className="text-cyber-green" /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => {
                    const blob = new Blob([selected.textBody || selected.htmlBody || ''], { type: 'text/plain' })
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `email-${selected.id}.txt`; a.click()
                    URL.revokeObjectURL(blob as any)
                  }}
                    className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text hover:bg-white/[0.03] transition-colors"
                    title="Download">
                    <Download size={13} />
                  </button>
                  <button onClick={() => deleteMessage(selected.id)} 
                    className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-red hover:bg-cyber-red/10 transition-colors"
                    title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-cyber-text-muted/40 font-mono flex items-center gap-1.5">
                <Clock size={10} /> {selected.date}
              </p>
            </div>
            <div className="text-sm text-cyber-text/70 leading-relaxed whitespace-pre-wrap font-mono max-h-[420px] overflow-y-auto">
              {selected.textBody || <span className="text-cyber-text-muted/50 italic">(empty message)</span>}
            </div>
          </div>
        ) : loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={18} className="animate-spin text-cyber-text-muted/30" />
              <p className="text-xs text-cyber-text-muted/30 font-mono">Loading inbox...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-5">
              <Mail size={24} className="text-cyber-text-muted/20" />
            </div>
            <p className="text-sm text-cyber-text-muted/50 font-mono">No messages yet</p>
            <p className="text-xs text-cyber-text-muted/30 mt-2 font-mono max-w-xs">
              Send an email to <span className="text-cyber-yellow/60 select-all">{email}</span> and it will appear here
            </p>
            <div className="flex items-center gap-3 mt-5 text-[10px] text-cyber-text-muted/30 font-mono">
              <span className="flex items-center gap-1"><RefreshCw size={10} /> Auto-refresh active</span>
              <span>•</span>
              <button onClick={newAddress} className="text-cyber-yellow/50 hover:text-cyber-yellow transition-colors">Generate new address</button>
            </div>
          </div>
        ) : (
          <>
            {searchQuery && filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search size={20} className="text-cyber-text-muted/20 mb-3" />
                <p className="text-sm text-cyber-text-muted/50 font-mono">No results for &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {filteredMessages.map(msg => {
                  const isRead = readIds.has(msg.id)
                  const isSelected = selectedIds.has(msg.id)
                  return (
                    <div key={msg.id}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer group',
                        isSelected ? 'bg-cyber-yellow/[0.03]' : 'hover:bg-white/[0.015]'
                      )}>
                      <button onClick={e => { e.stopPropagation(); toggleSelect(msg.id) }}
                        className="p-1 rounded text-cyber-text-muted/30 hover:text-cyber-text transition-colors shrink-0">
                        {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                      </button>
                      <div onClick={() => readMessage(msg.id)} className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={clsx(
                          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                          isRead
                            ? 'bg-white/[0.03] border border-white/[0.04]'
                            : 'bg-cyber-yellow/10 border border-cyber-yellow/20'
                        )}>
                          <Mail size={14} className={isRead ? 'text-cyber-text-muted/30' : 'text-cyber-yellow/80'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-cyber-yellow shrink-0" />}
                            <p className={clsx('text-sm truncate', isRead ? 'text-cyber-text-muted/70' : 'text-cyber-text/90', 'font-mono')}>{msg.from}</p>
                          </div>
                          <p className={clsx('text-xs truncate mt-0.5', isRead ? 'text-cyber-text-muted/40' : 'text-cyber-text-muted/60')}>{msg.subject || '(no subject)'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-cyber-text-muted/30 whitespace-nowrap font-mono">{timeAgo(msg.date)}</span>
                          <button onClick={e => { e.stopPropagation(); deleteMessage(msg.id) }}
                            className="p-1.5 rounded-lg text-cyber-text-muted/20 hover:text-cyber-red hover:bg-cyber-red/10 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </Section>
    </div>
  )
}
