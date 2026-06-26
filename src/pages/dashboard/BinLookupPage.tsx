import { useState } from 'react'
import { Search, Loader2, Building2, Globe, CreditCard, Wallet } from 'lucide-react'
import { clsx } from 'clsx'
import { lookupBin, type BinInfo } from '@/features/checker/services/binLookup'

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
    <div className="max-w-[800px] mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-md bg-cyber-blue/15 border border-cyber-blue/40 flex items-center justify-center">
          <Search size={20} className="text-cyber-blue" />
        </span>
        <div>
          <h1 className="text-xl font-orbitron font-bold text-cyber-text tracking-wide">Bin Lookup</h1>
          <p className="text-xs text-cyber-text-muted">Real issuer intel via binlist.net</p>
        </div>
      </header>

      <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 p-6">
        <label className="block text-xs uppercase tracking-wider text-cyber-text-muted mb-1.5">
          BIN / IIN (6–8 digits)
        </label>
        <div className="flex gap-3">
          <input
            value={bin}
            inputMode="numeric"
            onChange={e => setBin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="453201"
            className="flex-1 px-3.5 py-2.5 text-sm font-mono bg-cyber-dark border border-cyber-border rounded-md text-cyber-text placeholder:text-cyber-text-muted/60 focus:border-cyber-blue focus:outline-none"
          />
          <button
            onClick={run}
            disabled={loading}
            className="px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-cyber-blue/80 hover:bg-cyber-blue hover:text-cyber-black disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Lookup
          </button>
        </div>
        {error && <p className="text-xs text-cyber-red mt-3">{error}</p>}
      </div>

      {info && (
        <div className="mt-5 rounded-lg border border-cyber-border bg-cyber-panel/50 overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-cyber-border flex items-center justify-between">
            <span className="text-sm font-semibold text-cyber-text">Result</span>
            <span className={clsx(
              'text-[10px] uppercase px-2 py-0.5 rounded-full border',
              info.source === 'api'
                ? 'text-cyber-green border-cyber-green/40 bg-cyber-green/10'
                : 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10'
            )}>
              {info.source === 'api' ? `Live · ${info.provider}` : 'Offline fallback'}
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field icon={<CreditCard size={15} />} label="Scheme" value={info.scheme?.toUpperCase()} />
            <Field icon={<CreditCard size={15} />} label="Brand" value={info.brand} />
            <Field icon={<Wallet size={15} />} label="Type" value={info.type} />
            <Field icon={<Wallet size={15} />} label="Prepaid"
              value={info.prepaid === null ? null : info.prepaid ? 'Yes' : 'No'} />
            <Field icon={<Building2 size={15} />} label="Bank" value={info.bankName} />
            <Field icon={<Building2 size={15} />} label="Bank city" value={info.bankCity} />
            <Field icon={<Building2 size={15} />} label="Bank phone" value={info.bankPhone} />
            <Field icon={<Building2 size={15} />} label="Bank site" value={info.bankUrl} />
            <Field icon={<Globe size={15} />} label="Country"
              value={info.countryName ? `${info.countryEmoji ?? ''} ${info.countryName} (${info.countryCode ?? ''})` : null} />
            <Field icon={<Globe size={15} />} label="Currency" value={info.currency} />
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-cyber-text-muted mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-cyber-text-muted">{label}</p>
        <p className="text-sm text-cyber-text truncate">{value || '—'}</p>
      </div>
    </div>
  )
}
