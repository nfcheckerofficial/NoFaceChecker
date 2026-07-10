import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Phone, RefreshCw, Copy, Check, MessageSquare, Clock, Loader2, Globe, WifiOff } from 'lucide-react'
import { clsx } from 'clsx'

const API = import.meta.env.VITE_PAYMENTS_API ?? ''

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

const COUNTRIES: Record<string, { name: string; flag: string }> = {
  '1': { name: 'USA / Canada', flag: '🇺🇸' },
  '44': { name: 'United Kingdom', flag: '🇬🇧' },
  '49': { name: 'Germany', flag: '🇩🇪' },
  '43': { name: 'Austria', flag: '🇦🇹' },
  '34': { name: 'Spain', flag: '🇪🇸' },
  '33': { name: 'France', flag: '🇫🇷' },
  '39': { name: 'Italy', flag: '🇮🇹' },
  '91': { name: 'India', flag: '🇮🇳' },
  '84': { name: 'Vietnam', flag: '🇻🇳' },
  '62': { name: 'Indonesia', flag: '🇮🇩' },
  '95': { name: 'Myanmar', flag: '🇲🇲' },
  '38': { name: 'Ukraine', flag: '🇺🇦' },
  '61': { name: 'Australia', flag: '🇦🇺' },
  '64': { name: 'New Zealand', flag: '🇳🇿' },
  '32': { name: 'Belgium', flag: '🇧🇪' },
  '35': { name: 'Portugal', flag: '🇵🇹' },
  '79': { name: 'Russia', flag: '🇷🇺' },
  '81': { name: 'Japan', flag: '🇯🇵' },
  '82': { name: 'South Korea', flag: '🇰🇷' },
  '55': { name: 'Brazil', flag: '🇧🇷' },
  '52': { name: 'Mexico', flag: '🇲🇽' },
  '90': { name: 'Turkey', flag: '🇹🇷' },
}

function detectCountry(flat: string) {
  for (const [prefix, c] of Object.entries(COUNTRIES)) {
    if (flat.startsWith(prefix)) return { ...c, code: `+${prefix}` }
  }
  return { name: flat.slice(0, 3), flag: '🌍', code: `+${flat.slice(0, 3)}` }
}

function Section({ title, icon, children, accent = 'purple', className }: { title?: string; icon?: React.ReactNode; children: React.ReactNode; accent?: string; className?: string }) {
  return (
    <div className={clsx('rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm overflow-hidden', className)}>
      {title && (
        <div className={clsx('flex items-center gap-2 px-5 py-3.5 border-b', `border-${accent}-500/30`)}>
          {icon && <span className={clsx('text-', accent === 'purple' ? 'cyber-text-muted' : `${accent}-400`)}>{icon}</span>}
          <h2 className="text-xs font-semibold text-cyber-text/80 uppercase tracking-wider font-mono">{title}</h2>
        </div>
      )}
      <div className={title ? 'p-5' : 'p-0'}>{children}</div>
    </div>
  )
}

export function PlaceholderPage() {
  const [numbers, setNumbers] = useState<SmsNumber[]>([])
  const [selectedNumber, setSelectedNumber] = useState('')
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSms, setLoadingSms] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeCountry, setActiveCountry] = useState('all')
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, SmsNumber[]>()
    for (const n of numbers) {
      const c = detectCountry(n.NumberFlat)
      if (!map.has(c.code)) map.set(c.code, [])
      map.get(c.code)!.push(n)
    }
    return Array.from(map.entries()).map(([code, nums]) => ({ ...detectCountry(nums[0].NumberFlat), code, numbers: nums }))
      .sort((a, b) => b.numbers.length - a.numbers.length)
  }, [numbers])

  const filteredNumbers = useMemo(() => {
    if (activeCountry === 'all') return numbers
    return numbers.filter(n => detectCountry(n.NumberFlat).code === activeCountry)
  }, [numbers, activeCountry])

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
        } else {
          setError('No numbers available')
        }
      } else {
        setError(`Server error: ${res.status}`)
      }
    } catch {
      setError('Could not connect to SMS service')
    }
    setLoading(false)
  }, [])

  const fetchMessages = useCallback(async (silent = false) => {
    if (!selectedNumber) return
    if (!silent) setLoadingSms(true)
    try {
      const res = await fetch(`${API}/api/tempsms/sms/${selectedNumber}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data?.messages || (Array.isArray(data) ? data : []))
      }
    } catch {}
    if (!silent) setLoadingSms(false)
  }, [selectedNumber])

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

  const selectedInfo = selectedNumber ? detectCountry(selectedNumber) : null

  return (
    <div className="max-w-[1000px] mx-auto motion-safe:animate-slide-up">
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.04]">
          <span className="w-9 h-9 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center">
            <Phone size={16} className="text-cyber-purple/80" />
          </span>
          <div>
            <h1 className="text-sm font-bold font-orbitron text-cyber-text tracking-wide">SMS Pool</h1>
            <p className="text-[10px] text-cyber-text-muted/50 font-mono mt-0.5">
              {numbers.length > 0 ? `${numbers.length} numbers from ${grouped.length} countries` : 'Temporary phone numbers'}
            </p>
          </div>
          {!loading && numbers.length > 0 && (
            <button onClick={fetchNumbers} className="ml-auto p-2 rounded-lg text-cyber-text-muted/50 hover:text-cyber-text hover:bg-white/[0.03] transition-colors">
              <RefreshCw size={13} />
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Error state */}
          {error && !loading && numbers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyber-red/[0.06] border border-cyber-red/20 flex items-center justify-center mb-5">
                <WifiOff size={28} className="text-cyber-red/50" />
              </div>
              <p className="text-sm text-cyber-red/70 font-mono mb-2">{error}</p>
              <p className="text-xs text-cyber-text-muted/40 font-mono mb-5">The SMS service may be temporarily unavailable</p>
              <button onClick={() => { setLoading(true); fetchNumbers() }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyber-red/10 border border-cyber-red/30 text-xs text-cyber-red hover:bg-cyber-red/20 transition-colors font-mono">
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-cyber-text-muted/30 mb-3" />
              <p className="text-xs text-cyber-text-muted/40 font-mono">Loading numbers...</p>
            </div>
          )}

          {/* Country filters */}
          {!loading && numbers.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button onClick={() => setActiveCountry('all')}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all border shrink-0',
                  activeCountry === 'all' ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple' : 'border-white/[0.04] text-cyber-text-muted/60 hover:text-cyber-text hover:bg-white/[0.03]')}>
                <Globe size={11} /> All ({numbers.length})
              </button>
              {grouped.map(g => (
                <button key={g.code} onClick={() => setActiveCountry(g.code)}
                  className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all border shrink-0',
                    activeCountry === g.code ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple' : 'border-white/[0.04] text-cyber-text-muted/60 hover:text-cyber-text hover:bg-white/[0.03]')}>
                  <span>{g.flag}</span> {g.name} <span className="text-[10px] opacity-60">({g.numbers.length})</span>
                </button>
              ))}
            </div>
          )}

          {/* Numbers grid */}
          {!loading && numbers.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredNumbers.map(n => {
                const country = detectCountry(n.NumberFlat)
                const active = selectedNumber === n.NumberFlat
                return (
                  <button key={n.NumberFlat} onClick={() => setSelectedNumber(n.NumberFlat)}
                    className={clsx(
                      'relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-mono transition-all duration-300 border overflow-hidden',
                      active
                        ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple shadow-[0_0_15px_rgba(157,0,255,0.12)]'
                        : 'bg-white/[0.02] border-white/[0.04] text-cyber-text-muted/70 hover:bg-white/[0.04] hover:border-white/[0.08]'
                    )}>
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-semibold text-[11px] leading-tight text-center">{n.NumberFormatted}</span>
                    <span className="text-[9px] text-cyber-text-muted/50">{n.SmsCount} SMS</span>
                    {active && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyber-purple animate-pulse" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Active number bar */}
          {!loading && numbers.length > 0 && selectedInfo && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div className="flex items-center gap-3">
                <span className="text-xl">{selectedInfo.flag}</span>
                <div>
                  <p className="text-sm font-mono font-semibold text-cyber-text/90">{numbers.find(n => n.NumberFlat === selectedNumber)?.NumberFormatted}</p>
                  <p className="text-[10px] text-cyber-text-muted/40 font-mono">{selectedInfo.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copyText(selectedNumber, 'num')} className="p-2 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text transition-colors" title="Copy number">
                  {copied === 'num' ? <Check size={13} className="text-cyber-green" /> : <Copy size={13} />}
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
          )}

          {/* Messages */}
          {!loading && numbers.length > 0 && (
            messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
                  <MessageSquare size={24} className="text-cyber-text-muted/15" />
                </div>
                <p className="text-sm text-cyber-text-muted/40 font-mono">{loadingSms ? 'Loading messages...' : 'No messages yet'}</p>
                <p className="text-xs text-cyber-text-muted/25 mt-1.5 font-mono max-w-xs">Send an SMS to this number and messages will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] group hover:bg-white/[0.03] transition-all">
                    <div className="w-9 h-9 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center shrink-0">
                      <MessageSquare size={14} className="text-cyber-purple/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-xs font-semibold font-mono text-cyber-text/80">{msg.sender || 'Unknown'}</span>
                        <span className="text-[9px] text-cyber-text-muted/30 font-mono">{new Date(msg.unix * 1000).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-cyber-text/70 font-mono leading-relaxed break-words">{msg.text}</p>
                    </div>
                    <button onClick={() => copyText(msg.text, String(i))}
                      className="p-1.5 rounded-lg text-cyber-text-muted/20 hover:text-cyber-text hover:bg-white/[0.05] transition-all shrink-0 opacity-0 group-hover:opacity-100">
                      {copied === String(i) ? <Check size={11} className="text-cyber-green" /> : <Copy size={11} />}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
