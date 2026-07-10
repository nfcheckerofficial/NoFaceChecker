import { useState } from 'react'
import { Search, Loader2, Building2, Globe, CreditCard, Wallet, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { lookupBin, type BinInfo } from '@/features/checker/services/binLookup'
import { Section, Grid, Card, Row } from '@/shared/ui/Section'

const EXAMPLE_BINS = ['453201', '492937', '414720', '510510', '601100']

export function BinLookupPage() {
  const [bin, setBin] = useState('')
  const [info, setInfo] = useState<BinInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    const digits = bin.replace(/\D/g, '')
    setError('')
    setInfo(null)
    if (digits.length < 6) {
      setError('Enter at least 6 digits.')
      return
    }
    setLoading(true)
    try {
      const result = await lookupBin(digits)
      setInfo(result)
    } catch {
      setError('Lookup failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-5">
      <Section title="BIN Lookup" icon={<Search size={14} />} accent="blue">
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              value={bin}
              inputMode="numeric"
              onChange={e => setBin(e.target.value.replace(/\D/g, '').slice(0, 8))}
              onKeyDown={e => e.key === 'Enter' && run()}
              placeholder="453201"
              className="flex-1 px-3.5 py-2.5 text-sm font-mono bg-white/[0.03] border border-white/[0.06] rounded-xl text-cyber-text placeholder:text-cyber-text-muted/30 focus:border-cyber-blue/50 focus:outline-none transition-colors"
            />
            <button
              onClick={run}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyber-blue/10 border border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/20 disabled:opacity-40 transition-all flex items-center gap-2 shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Lookup
            </button>
          </div>
          {!error && !info && (
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles size={11} className="text-cyber-text-muted/30" />
              <span className="text-[10px] text-cyber-text-muted/40 font-mono">Try:</span>
              {EXAMPLE_BINS.map(b => (
                <button key={b} onClick={() => { setBin(b); setInfo(null); setError('') }}
                  className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] text-[10px] font-mono text-cyber-text-muted/60 hover:text-cyber-blue hover:border-cyber-blue/30 transition-colors">
                  {b}
                </button>
              ))}
            </div>
          )}
          {error && <p className="text-xs text-cyber-red/80 font-mono">{error}</p>}
        </div>
      </Section>

      {info && (
        <Section title="Result" icon={<Search size={14} />} accent="blue">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyber-text-muted/50">BIN: {bin}</span>
              <span className={clsx(
                'text-[10px] uppercase px-2 py-0.5 rounded-full border font-mono',
                info.source === 'api'
                  ? 'text-cyber-green border-cyber-green/30 bg-cyber-green/[0.06]'
                  : 'text-cyber-yellow border-cyber-yellow/30 bg-cyber-yellow/[0.06]'
              )}>
                {info.source === 'api' ? `Live · ${info.provider}` : 'Offline'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Row icon={<CreditCard size={13} />} label="Scheme" value={info.scheme?.toUpperCase() || '—'} />
              <Row icon={<CreditCard size={13} />} label="Brand" value={info.brand || '—'} />
              <Row icon={<Wallet size={13} />} label="Type" value={info.type || '—'} />
              <Row icon={<Wallet size={13} />} label="Prepaid" value={info.prepaid === null ? '—' : info.prepaid ? 'Yes' : 'No'} />
              <Row icon={<Building2 size={13} />} label="Bank" value={info.bankName || '—'} />
              <Row icon={<Building2 size={13} />} label="Bank City" value={info.bankCity || '—'} />
              <Row icon={<Globe size={13} />} label="Country" value={info.countryName ? `${info.countryEmoji ?? ''} ${info.countryName} (${info.countryCode ?? ''})` : '—'} />
              <Row icon={<Globe size={13} />} label="Currency" value={info.currency || '—'} />
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
