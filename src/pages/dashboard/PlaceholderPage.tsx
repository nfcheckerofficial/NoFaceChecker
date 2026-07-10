import { useState, useEffect, useCallback, useRef } from 'react'
import { Phone, RefreshCw, Copy, Check, MessageSquare, Clock, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Section } from '@/shared/ui/Section'

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

const API = import.meta.env.VITE_PAYMENTS_API ?? ''

export function PlaceholderPage() {
  const [numbers, setNumbers] = useState<SmsNumber[]>([])
  const [selectedNumber, setSelectedNumber] = useState('')
  const [messages, setMessages] = useState<SmsMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSms, setLoadingSms] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNumbers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/tempsms/numbers`)
      if (res.ok) {
        const data: SmsNumber[] = await res.json()
        if (data?.length) {
          setNumbers(data)
          if (!selectedNumber || !data.find(n => n.NumberFlat === selectedNumber)) {
            setSelectedNumber(data[0].NumberFlat)
          }
        }
      }
    } catch {}
    setLoading(false)
  }, [])

  const fetchMessages = useCallback(async (silent = false) => {
    if (!selectedNumber) return
    if (!silent) setLoadingSms(true)
    try {
      const res = await fetch(`${API}/api/tempsms/sms/${selectedNumber}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : data?.messages || [])
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

  const formatDate = (unix: number) => {
    const d = new Date(unix * 1000)
    return d.toLocaleString()
  }

  return (
    <div className="max-w-[960px] mx-auto space-y-5 motion-safe:animate-slide-up">
      <Section title="SMS Pool" icon={<Phone size={14} />} accent="purple">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-cyber-text-muted/30" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {numbers.map(n => (
                <button key={n.NumberFlat} onClick={() => setSelectedNumber(n.NumberFlat)}
                  className={clsx(
                    'flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-mono transition-all duration-300 border',
                    selectedNumber === n.NumberFlat
                      ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple'
                      : 'bg-white/[0.02] border-white/[0.04] text-cyber-text-muted/70 hover:bg-white/[0.04]'
                  )}>
                  <span className="font-semibold">{n.NumberFormatted}</span>
                  <span className="text-[10px] text-cyber-text-muted/50">{n.SmsCount} msgs</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-sm font-mono text-cyber-text/80">
                {numbers.find(n => n.NumberFlat === selectedNumber)?.NumberFormatted || 'Select a number'}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => copyText(selectedNumber, 'num')}
                  className="p-2 rounded-lg text-cyber-text-muted/50 hover:text-cyber-text transition-colors">
                  {copied === 'num' ? <Check size={13} className="text-cyber-green" /> : <Copy size={13} />}
                </button>
                <label className="flex items-center gap-1.5 text-[10px] text-cyber-text-muted/50 cursor-pointer select-none">
                  <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
                    className="w-3 h-3 rounded border-white/20 bg-white/[0.05] text-cyber-purple focus:ring-0" />
                  Auto
                </label>
                <button onClick={() => fetchMessages()} disabled={loadingSms}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-[11px] text-cyber-text-muted/70 hover:text-cyber-text hover:bg-white/[0.03] disabled:opacity-40 transition-colors font-mono">
                  <RefreshCw size={11} className={loadingSms ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-4">
                  <MessageSquare size={22} className="text-cyber-text-muted/20" />
                </div>
                <p className="text-sm text-cyber-text-muted/50 font-mono">
                  {loadingSms ? 'Loading...' : 'No messages yet'}
                </p>
                <p className="text-xs text-cyber-text-muted/30 mt-1.5 font-mono">
                  Send an SMS to this number to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] group">
                    <div className="w-8 h-8 rounded-lg bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center shrink-0">
                      <MessageSquare size={13} className="text-cyber-purple/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold font-mono text-cyber-text/80">{msg.sender}</span>
                        <span className="text-[10px] text-cyber-text-muted/30 font-mono flex items-center gap-1">
                          <Clock size={9} /> {formatDate(msg.unix)}
                        </span>
                      </div>
                      <p className="text-sm text-cyber-text/70 font-mono leading-relaxed">{msg.text}</p>
                    </div>
                    <button onClick={() => copyText(msg.text, String(i))}
                      className="p-1.5 rounded-lg text-cyber-text-muted/20 hover:text-cyber-text hover:bg-white/[0.05] transition-all shrink-0 opacity-0 group-hover:opacity-100">
                      {copied === String(i) ? <Check size={12} className="text-cyber-green" /> : <Copy size={12} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  )
}
