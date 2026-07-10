import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Mail, RefreshCw, Copy, Check, Trash2, Inbox, Loader2, ChevronLeft, User, Clock, Search, Download, Square, CheckSquare } from 'lucide-react'
import { clsx } from 'clsx'
import { Section } from '@/shared/ui/Section'

const API = import.meta.env.VITE_PAYMENTS_API ?? ''

interface Message {
  id: string
  from: { address: string; name: string }
  subject: string
  intro: string
  createdAt: string
}

interface MessageDetail {
  id: string
  from: { address: string; name: string }
  subject: string
  text: string
  html: string[]
  createdAt: string
}

function randomStr(n: number): string {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('')
}

function timeAgo(s: string): string {
  const d = Date.now() - new Date(s).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const STORAGE_KEY = 'instaddr_account'

function loadAccount(): { address: string; password: string; token: string } | null {
  try { const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (d?.address && d?.token) return d } catch {}
  return null
}

function saveAccount(data: { address: string; password: string; token: string }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

function clearAccount() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

export function InstaddrPage() {
  const saved = useRef(loadAccount())
  const [address, setAddress] = useState(saved.current?.address || '')
  const [password, setPassword] = useState(saved.current?.password || '')
  const [token, setToken] = useState(saved.current?.token || '')
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<MessageDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [reading, setReading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)
  const [apiError, setApiError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const headers = (): Record<string, string> => ({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const createAccount = useCallback(async () => {
    setApiError('')
    try {
      const domRes = await fetch(`${API}/api/instaddr/domains`, { headers: { Accept: 'application/json' } })
      if (!domRes.ok) throw new Error()
      const domains: { domain: string }[] = await domRes.json()
      if (!domains?.length) throw new Error()
      const domain = domains[0].domain
      const user = randomStr(12)
      const pass = randomStr(16)
      const email = `${user}@${domain}`

      const accRes = await fetch(`${API}/api/instaddr/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ address: email, password: pass }),
      })
      if (!accRes.ok) throw new Error()
      const acc = await accRes.json()

      const tokRes = await fetch(`${API}/api/instaddr/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ address: email, password: pass }),
      })
      if (!tokRes.ok) throw new Error()
      const tok = await tokRes.json()

      const finalToken = tok.token || tok
      setAddress(email)
      setPassword(pass)
      setToken(finalToken)
      setMessages([])
      setSelected(null)
      setSelectedIds(new Set())
      saveAccount({ address: email, password: pass, token: finalToken })
    } catch {
      setApiError('Failed to create email account. Try again.')
    }
  }, [])

  const fetchMessages = useCallback(async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`${API}/api/instaddr/messages`, { headers: headers() })
      if (res.ok) {
        const data = await res.json()
        setMessages(data?.hydra?.member || data || [])
      }
    } catch {}
    if (!silent) setLoading(false)
  }, [token])

  const readMessage = async (id: string) => {
    if (!token) return
    setReading(true)
    try {
      const res = await fetch(`${API}/api/instaddr/messages/${id}`, { headers: headers() })
      if (res.ok) {
        const data: MessageDetail = await res.json()
        setSelected(data)
      }
    } catch {}
    setReading(false)
  }

  const deleteMessage = async (id: string) => {
    if (!token) return
    try {
      await fetch(`${API}/api/instaddr/messages/${id}`, { method: 'DELETE', headers: headers() })
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

  useEffect(() => { createAccount() }, [])
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoRefresh && token) intervalRef.current = setInterval(() => fetchMessages(true), 10000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, token, fetchMessages])
  useEffect(() => { if (token) fetchMessages() }, [token])

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages
    const q = searchQuery.toLowerCase()
    return messages.filter(m => m.from?.address?.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q))
  }, [messages, searchQuery])

  const toggleSelect = (id: string) => {
    setSelectedIds(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  const selectAll = () => {
    if (selectedIds.size === filteredMessages.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredMessages.map(m => m.id)))
  }
  const isAllSelected = filteredMessages.length > 0 && selectedIds.size === filteredMessages.length

  if (!address) {
    return (
      <div className="max-w-[960px] mx-auto space-y-5">
        <Section title="Temporary Email" icon={<Mail size={14} />} accent="yellow">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {apiError ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-cyber-red/[0.06] border border-cyber-red/20 flex items-center justify-center mb-4">
                  <Mail size={24} className="text-cyber-red/60" />
                </div>
                <p className="text-sm text-cyber-red/70 font-mono mb-4">{apiError}</p>
                <button onClick={createAccount}
                  className="px-5 py-2.5 rounded-xl bg-cyber-red/10 border border-cyber-red/30 text-sm text-cyber-red hover:bg-cyber-red/20 transition-colors font-mono">
                  Retry
                </button>
              </>
            ) : (
              <>
                <Loader2 size={20} className="animate-spin text-cyber-text-muted/30 mb-4" />
                <p className="text-sm text-cyber-text-muted/50 font-mono">Creating temporary email...</p>
              </>
            )}
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="max-w-[960px] mx-auto space-y-5">
      <Section title="Temporary Email" icon={<Mail size={14} />} accent="yellow">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <span className="text-sm font-mono text-cyber-text/80">{address}</span>
            </div>
            <button onClick={() => copyText(address, 'email')}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] transition-colors shrink-0">
              {copied === 'email' ? <Check size={15} className="text-cyber-green" /> : <Copy size={15} className="text-cyber-text-muted" />}
            </button>
            <button onClick={() => { clearAccount(); createAccount() }}
              className="h-10 px-3 flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-xs text-cyber-text-muted/70 hover:text-cyber-text transition-colors shrink-0 font-mono whitespace-nowrap">
              <RefreshCw size={12} /> New
            </button>
          </div>
          <p className="text-xs text-cyber-text-muted/30 font-mono">
            This inbox auto-deletes after 24h. Refresh every 10s.
          </p>
        </div>
      </Section>

      {apiError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-cyber-red/20 bg-cyber-red/[0.04] text-xs text-cyber-red/80 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-red shrink-0" />
          {apiError}
        </div>
      )}

      <Section title="Inbox" icon={<Inbox size={14} />} accent="yellow">
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

        {selected ? (
          <div className="p-5">
            <div className="space-y-4 mb-5 pb-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyber-yellow/8 border border-cyber-yellow/15 flex items-center justify-center shrink-0">
                  <User size={15} className="text-cyber-yellow/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-cyber-text/90 font-mono truncate">{selected.from?.address || selected.from?.name || '?'}</p>
                  <p className="text-[11px] text-cyber-text-muted/50 font-mono truncate mt-0.5">{selected.subject || '(no subject)'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => copyText(selected.text || '', 'body')}
                    className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text hover:bg-white/[0.03] transition-colors" title="Copy body">
                    {copied === 'body' ? <Check size={13} className="text-cyber-green" /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => {
                    const b = new Blob([selected.text || ''], { type: 'text/plain' })
                    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `email-${selected.id}.txt`; a.click()
                    URL.revokeObjectURL(b as any)
                  }} className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text hover:bg-white/[0.03] transition-colors" title="Download">
                    <Download size={13} />
                  </button>
                  <button onClick={() => deleteMessage(selected.id)}
                    className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-red hover:bg-cyber-red/10 transition-colors" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-cyber-text-muted/40 font-mono flex items-center gap-1.5">
                <Clock size={10} /> {selected.createdAt}
              </p>
            </div>
            <div className="text-sm text-cyber-text/70 leading-relaxed whitespace-pre-wrap font-mono max-h-[420px] overflow-y-auto">
              {selected.text || <span className="text-cyber-text-muted/50 italic">(empty message)</span>}
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
              Send an email to <span className="text-cyber-yellow/60 select-all">{address}</span>
            </p>
          </div>
        ) : (
          <>
            {searchQuery && filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search size={20} className="text-cyber-text-muted/20 mb-3" />
                <p className="text-sm text-cyber-text-muted/50 font-mono">No results</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {filteredMessages.map(msg => {
                  const isSelected = selectedIds.has(msg.id)
                  return (
                    <div key={msg.id}
                      className={clsx('flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer group',
                        isSelected ? 'bg-cyber-yellow/[0.03]' : 'hover:bg-white/[0.015]')}>
                      <button onClick={e => { e.stopPropagation(); toggleSelect(msg.id) }}
                        className="p-1 rounded text-cyber-text-muted/30 hover:text-cyber-text transition-colors shrink-0">
                        {isSelected ? <CheckSquare size={12} /> : <Square size={12} />}
                      </button>
                      <div onClick={() => readMessage(msg.id)} className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-cyber-yellow/10 border border-cyber-yellow/20 flex items-center justify-center shrink-0">
                          <Mail size={14} className="text-cyber-yellow/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-cyber-text/80 truncate font-mono">{msg.from?.address || msg.from?.name || '?'}</p>
                          <p className="text-xs text-cyber-text-muted/50 truncate mt-0.5">{msg.subject || '(no subject)'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-cyber-text-muted/30 whitespace-nowrap font-mono">{timeAgo(msg.createdAt)}</span>
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
