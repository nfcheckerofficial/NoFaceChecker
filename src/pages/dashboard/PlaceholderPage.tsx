import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Phone, RefreshCw, Copy, Check, MessageSquare, Clock, Loader2, Globe, WifiOff, Search, Download, Star, Trash2, Bell, BellOff } from 'lucide-react'
import { clsx } from 'clsx'

const API = import.meta.env.VITE_PAYMENTS_API ?? ''
const FAV_KEY = 'chk_sms_favorites'

interface SmsNumber {
  NumberFormatted: string
  NumberFlat: string
  SmsCount: number
}

interface SmsMessage {
  sender: string
  text: string
  date: string
  unix: number
}

const KNOWN_FLAGS: Record<string, { name: string; flag: string }> = {
  '1': { name: 'USA/Canada', flag: '🇺🇸' }, '44': { name: 'UK', flag: '🇬🇧' },
  '49': { name: 'Germany', flag: '🇩🇪' }, '43': { name: 'Austria', flag: '🇦🇹' },
  '34': { name: 'Spain', flag: '🇪🇸' }, '33': { name: 'France', flag: '🇫🇷' },
  '39': { name: 'Italy', flag: '🇮🇹' }, '91': { name: 'India', flag: '🇮🇳' },
  '61': { name: 'Australia', flag: '🇦🇺' }, '64': { name: 'NZ', flag: '🇳🇿' },
  '81': { name: 'Japan', flag: '🇯🇵' }, '82': { name: 'S.Korea', flag: '🇰🇷' },
  '55': { name: 'Brazil', flag: '🇧🇷' }, '52': { name: 'Mexico', flag: '🇲🇽' },
  '90': { name: 'Turkey', flag: '🇹🇷' }, '31': { name: 'Netherlands', flag: '🇳🇱' },
  '46': { name: 'Sweden', flag: '🇸🇪' }, '47': { name: 'Norway', flag: '🇳🇴' },
  '48': { name: 'Poland', flag: '🇵🇱' }, '7': { name: 'Russia', flag: '🇷🇺' },
}

function getCountry(flat: string) {
  for (const [prefix, c] of Object.entries(KNOWN_FLAGS)) {
    if (flat.startsWith(prefix)) return c
  }
  return { name: flat.slice(0, 3), flag: '📡' }
}

function loadFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]') } catch { return [] }
}
function saveFavorites(f: string[]) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(f)) } catch {}
}

export function PlaceholderPage() {
  const [numbers, setNumbers] = useState<SmsNumber[]>([])
  const [selectedNumber, setSelectedNumber] = useState('')
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSms, setLoadingSms] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [searchMsg, setSearchMsg] = useState('')
  const [favorites, setFavorites] = useState<string[]>(loadFavorites)
  const [notifSound, setNotifSound] = useState(false)
  const [error, setError] = useState('')
  const prevCount = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const filteredMessages = useMemo(() => {
    if (!searchMsg.trim()) return messages
    const q = searchMsg.toLowerCase()
    return messages.filter(m => m.text.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q))
  }, [messages, searchMsg])

  const stats = useMemo(() => {
    const totalSms = messages.length
    const uniqueSenders = new Set(messages.map(m => m.sender)).size
    return { totalSms, uniqueSenders }
  }, [messages])

  const fetchNumbers = useCallback(async () => {
    setError('')
    try {
      const res = await fetch(`${API}/api/tempsms/numbers`)
      if (res.ok) {
        const data = await res.json()
        const list: SmsNumber[] = data?.items || (Array.isArray(data) ? data : [])
        if (list.length) {
          setNumbers(list)
          if (!selectedNumber || !list.find(n => n.NumberFlat === selectedNumber)) {
            setSelectedNumber(list[0].NumberFlat)
          }
        } else { setError('No numbers available right now') }
      } else { setError(`Server error: ${res.status}`) }
    } catch { setError('Could not connect to SMS service') }
    setLoading(false)
  }, [])

  const fetchMessages = useCallback(async (silent = false) => {
    if (!selectedNumber) return
    if (!silent) setLoadingSms(true)
    try {
      const res = await fetch(`${API}/api/tempsms/sms/${selectedNumber}`)
      if (res.ok) {
        const data = await res.json()
        const msgs = data?.messages || (Array.isArray(data) ? data : [])
        if (msgs.length > prevCount.current && prevCount.current > 0 && notifSound) {
          try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f4B/f3+AgH9/f3+AgH9/f3+AgH9/f3+AgH9/f38').play() } catch {}
        }
        prevCount.current = msgs.length
        setMessages(msgs)
      }
    } catch {}
    if (!silent) setLoadingSms(false)
  }, [selectedNumber, notifSound])

  useEffect(() => { fetchNumbers() }, [])
  useEffect(() => { if (selectedNumber) fetchMessages() }, [selectedNumber])
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoRefresh && selectedNumber) intervalRef.current = setInterval(() => fetchMessages(true), 8000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, selectedNumber, fetchMessages])

  const copyText = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500) } catch {}
  }

  const toggleFav = (flat: string) => {
    setFavorites(prev => {
      const next = prev.includes(flat) ? prev.filter(f => f !== flat) : [...prev, flat]
      saveFavorites(next)
      return next
    })
  }

  const clearMessages = () => { setMessages([]); prevCount.current = 0 }

  const exportMessages = () => {
    if (!messages.length) return
    const text = messages.map(m => `[${new Date(m.unix * 1000).toLocaleString()}] ${m.sender}: ${m.text}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `sms-${selectedNumber}.txt`; a.click()
  }

  const selectedInfo = selectedNumber ? getCountry(selectedNumber) : null

  return (
    <div className="max-w-[1000px] mx-auto motion-safe:animate-slide-up">

      {/* Main card */}
      <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm overflow-hidden">

        {/* === HEADER === */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.04]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-purple/20 to-cyber-blue/10 border border-cyber-purple/20 flex items-center justify-center">
            <Phone size={17} className="text-cyber-purple/80" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-orbitron font-bold text-cyber-text tracking-wide">SMS Pool</h1>
              {!loading && numbers.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyber-purple/10 text-cyber-purple/80 border border-cyber-purple/20 font-mono">{numbers.length}</span>
              )}
            </div>
            <p className="text-[10px] text-cyber-text-muted/50 font-mono mt-0.5">
              {loading ? 'Loading...' : numbers.length > 0 ? `${numbers.length} disposable numbers` : 'Temporary SMS receiver'}
            </p>
          </div>
          {!loading && numbers.length > 0 && (
            <div className="flex items-center gap-1">
              <button onClick={exportMessages} disabled={!messages.length} className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text hover:bg-white/[0.03] disabled:opacity-30 transition-colors" title="Export">
                <Download size={13} />
              </button>
              <button onClick={() => setNotifSound(!notifSound)} className={clsx('p-2 rounded-lg transition-colors', notifSound ? 'text-cyber-green hover:bg-cyber-green/10' : 'text-cyber-text-muted/40 hover:text-cyber-text hover:bg-white/[0.03]')} title="Sound alert">
                {notifSound ? <Bell size={13} /> : <BellOff size={13} />}
              </button>
              <button onClick={fetchNumbers} className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text hover:bg-white/[0.03] transition-colors" title="Refresh numbers">
                <RefreshCw size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="p-5 space-y-5">

          {/* === ERROR STATE === */}
          {error && !loading && numbers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-cyber-red/[0.08] to-cyber-red/[0.02] border border-cyber-red/20 flex items-center justify-center mb-6">
                <WifiOff size={32} className="text-cyber-red/50" />
              </div>
              <p className="text-base text-cyber-red/70 font-mono font-semibold mb-2">Service Unavailable</p>
              <p className="text-sm text-cyber-text-muted/50 font-mono mb-6 max-w-md">{error}</p>
              <button onClick={() => { setLoading(true); fetchNumbers() }}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyber-red/20 to-cyber-red/10 border border-cyber-red/30 text-sm text-cyber-red font-semibold hover:bg-cyber-red/20 transition-all font-mono">
                <RefreshCw size={14} /> Retry Connection
              </button>
            </div>
          )}

          {/* === LOADING === */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-purple/20 to-cyber-blue/10 border border-cyber-purple/20 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-cyber-purple/60" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyber-purple/30 animate-ping" />
              </div>
              <p className="text-sm text-cyber-text-muted/60 font-mono mb-1">Loading SMS Pool</p>
              <div className="w-32 h-1 rounded-full bg-white/[0.03] overflow-hidden">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyber-purple/40 to-cyber-blue/40 animate-shimmer" />
              </div>
            </div>
          )}

          {/* === NUMBERS SECTION === */}
          {!loading && numbers.length > 0 && (
            <>
              {/* Favorites bar */}
              {favorites.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <Star size={11} className="text-cyber-yellow/60 shrink-0" />
                  {favorites.map(f => {
                    const num = numbers.find(n => n.NumberFlat === f)
                    if (!num) return null
                    const c = getCountry(f)
                    return (
                      <button key={f} onClick={() => setSelectedNumber(f)}
                        className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap border transition-all shrink-0',
                          selectedNumber === f
                            ? 'bg-cyber-yellow/15 border-cyber-yellow/30 text-cyber-yellow'
                            : 'border-white/[0.04] text-cyber-text-muted/60 hover:text-cyber-text')}>
                        <span>{c.flag}</span> {num.NumberFormatted}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Country groups */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {Array.from(new Map(numbers.map(n => {
                  const c = getCountry(n.NumberFlat)
                  return [c.flag, { ...c, count: numbers.filter(x => getCountry(x.NumberFlat).flag === c.flag).length }]
                })).values()).sort((a, b) => b.count - a.count).map(g => (
                  <div key={g.flag} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] font-mono text-cyber-text-muted/60 whitespace-nowrap shrink-0">
                    <span>{g.flag}</span>
                    <span className="text-[10px] opacity-60">{g.count}</span>
                  </div>
                ))}
              </div>

              {/* Numbers grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {numbers.map(n => {
                  const country = getCountry(n.NumberFlat)
                  const active = selectedNumber === n.NumberFlat
                  const isFav = favorites.includes(n.NumberFlat)
                  return (
                    <button key={n.NumberFlat} onClick={() => setSelectedNumber(n.NumberFlat)}
                      className={clsx(
                        'relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-mono transition-all duration-300 border overflow-hidden group',
                        active
                          ? 'bg-gradient-to-b from-cyber-purple/15 to-cyber-purple/5 border-cyber-purple/30 shadow-[0_0_20px_rgba(157,0,255,0.1)]'
                          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
                      )}>
                      {isFav && <Star size={10} className="absolute top-2 right-2 text-cyber-yellow/60" />}
                      <span className="text-xl">{country.flag}</span>
                      <span className="font-semibold text-[11px] leading-tight text-center">{n.NumberFormatted}</span>
                      <span className="text-[9px] text-cyber-text-muted/50">{n.SmsCount} SMS</span>
                      <button onClick={e => { e.stopPropagation(); toggleFav(n.NumberFlat) }}
                        className="absolute bottom-1 right-1 p-1 rounded text-cyber-text-muted/20 hover:text-cyber-yellow opacity-0 group-hover:opacity-100 transition-all">
                        <Star size={9} />
                      </button>
                      {active && <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-cyber-purple animate-pulse" />}
                    </button>
                  )
                })}
              </div>

              {/* === ACTIVE NUMBER BAR === */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedInfo?.flag}</span>
                  <div>
                    <p className="text-sm font-semibold font-mono text-cyber-text/90">{numbers.find(n => n.NumberFlat === selectedNumber)?.NumberFormatted}</p>
                    <p className="text-[10px] text-cyber-text-muted/40 font-mono">{selectedInfo?.name} · {stats.totalSms} msgs · {stats.uniqueSenders} senders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedNumber && (
                    <button onClick={() => toggleFav(selectedNumber)}
                      className={clsx('p-2 rounded-lg transition-colors', favorites.includes(selectedNumber) ? 'text-cyber-yellow' : 'text-cyber-text-muted/40 hover:text-cyber-text')}>
                      <Star size={13} />
                    </button>
                  )}
                  <button onClick={() => copyText(selectedNumber, 'num')} className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text transition-colors">
                    {copied === 'num' ? <Check size={13} className="text-cyber-green" /> : <Copy size={13} />}
                  </button>
                  <button onClick={clearMessages} disabled={!messages.length} className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-red disabled:opacity-30 transition-colors">
                    <Trash2 size={13} />
                  </button>
                  <label className="flex items-center gap-1 text-[10px] text-cyber-text-muted/40 cursor-pointer select-none font-mono">
                    <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="w-3 h-3 rounded border-white/20 bg-white/[0.05] text-cyber-purple focus:ring-0" />
                    Auto
                  </label>
                  <button onClick={() => fetchMessages()} disabled={loadingSms}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.06] text-[11px] text-cyber-text-muted/60 hover:text-cyber-text hover:bg-white/[0.03] disabled:opacity-40 transition-colors font-mono">
                    <RefreshCw size={10} className={loadingSms ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* === MESSAGES === */}
              <div className="space-y-3">
                {/* Search bar */}
                {messages.length > 0 && (
                  <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted/30" />
                    <input value={searchMsg} onChange={e => setSearchMsg(e.target.value)} placeholder="Search messages..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs font-mono text-cyber-text/80 placeholder:text-cyber-text-muted/30 focus:outline-none focus:border-cyber-purple/30 transition-colors" />
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-5">
                      <MessageSquare size={28} className="text-cyber-text-muted/15" />
                    </div>
                    <p className="text-base text-cyber-text-muted/50 font-mono font-semibold mb-1">No Messages</p>
                    <p className="text-sm text-cyber-text-muted/30 font-mono max-w-md">Send an SMS to <span className="text-cyber-purple/60 select-all">{numbers.find(n => n.NumberFlat === selectedNumber)?.NumberFormatted}</span></p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Search size={20} className="text-cyber-text-muted/20 mb-3" />
                    <p className="text-sm text-cyber-text-muted/50 font-mono">No results for &ldquo;{searchMsg}&rdquo;</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[450px] overflow-y-auto">
                    {filteredMessages.map((msg, i) => (
                      <div key={i}
                        className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] group hover:bg-white/[0.03] hover:border-white/[0.07] transition-all motion-safe:animate-fade-in">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-purple/15 to-cyber-blue/5 border border-cyber-purple/20 flex items-center justify-center shrink-0">
                          <MessageSquare size={14} className="text-cyber-purple/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs font-bold font-mono text-cyber-text/80">{msg.sender || 'Unknown'}</span>
                            <span className="text-[9px] text-cyber-text-muted/30 font-mono">{new Date(msg.unix * 1000).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-cyber-text/65 font-mono leading-relaxed break-words">{msg.text}</p>
                        </div>
                        <button onClick={() => copyText(msg.text, String(i))}
                          className="p-1.5 rounded-lg text-cyber-text-muted/20 hover:text-cyber-text hover:bg-white/[0.05] transition-all shrink-0 opacity-0 group-hover:opacity-100">
                          {copied === String(i) ? <Check size={11} className="text-cyber-green" /> : <Copy size={11} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer info */}
      {!loading && numbers.length > 0 && (
        <p className="text-[10px] text-cyber-text-muted/25 text-center mt-4 font-mono">
          Numbers provided by temp-sms.org · Auto-refresh {autoRefresh ? 'active' : 'off'}
        </p>
      )}
    </div>
  )
}
