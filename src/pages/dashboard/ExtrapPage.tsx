import { useState } from 'react'
import { Search, Loader2, HardDrive, CreditCard, Globe, Building2, Wallet, ChevronDown, ChevronRight, Hash } from 'lucide-react'
import { clsx } from 'clsx'
import { extrapolateBins, type ExtrapResult } from '@/features/checker/services/extrapService'

export function ExtrapPage() {
  const [bin, setBin] = useState('')
  const [exact, setExact] = useState<ExtrapResult | null>(null)
  const [nearby, setNearby] = useState<ExtrapResult[]>([])
  const [ranges, setRanges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNearby, setShowNearby] = useState(false)

  const run = async () => {
    const digits = bin.replace(/\D/g, '')
    setError('')
    setExact(null)
    setNearby([])
    setRanges([])
    if (digits.length < 4) {
      setError('Enter at least 4 digits.')
      return
    }
    setLoading(true)
    try {
      const result = await extrapolateBins(digits)
      setExact(result.exact)
      setNearby(result.nearby)
      setRanges(result.ranges)
      if (!result.exact && result.nearby.length === 0) {
        setError('No BIN data found. Try a different prefix.')
      }
    } catch {
      setError('Extrapolation failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-md bg-cyber-purple/15 border border-cyber-purple/40 flex items-center justify-center">
          <HardDrive size={20} className="text-cyber-purple" />
        </span>
        <div>
          <h1 className="text-xl font-orbitron font-bold text-cyber-text tracking-wide">Extrap Database</h1>
          <p className="text-xs text-cyber-text-muted">Extrapolate BIN ranges &amp; issuer intel</p>
        </div>
      </header>

      <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 p-6">
        <label className="block text-xs uppercase tracking-wider text-cyber-text-muted mb-1.5">
          BIN prefix (4–8 digits)
        </label>
        <div className="flex gap-3">
          <input
            value={bin}
            inputMode="numeric"
            onChange={e => setBin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            onKeyDown={e => e.key === 'Enter' && run()}
            placeholder="414720"
            className="flex-1 px-3.5 py-2.5 text-sm font-mono bg-cyber-dark border border-cyber-border rounded-md text-cyber-text placeholder:text-cyber-text-muted/60 focus:border-cyber-purple focus:outline-none"
          />
          <button
            onClick={run}
            disabled={loading}
            className="px-5 py-2.5 rounded-md text-sm font-semibold text-white bg-cyber-purple/80 hover:bg-cyber-purple hover:text-cyber-black disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Extrapolate
          </button>
        </div>
        {error && <p className="text-xs text-cyber-red mt-3">{error}</p>}
      </div>

      {exact && (
        <div className="mt-5 rounded-lg border border-cyber-border bg-cyber-panel/50 overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-cyber-border flex items-center justify-between">
            <span className="text-sm font-semibold text-cyber-text flex items-center gap-2">
              <Hash size={14} className="text-cyber-purple" />
              Exact BIN: <span className="font-mono text-cyber-purple">{exact.bin}</span>
            </span>
            <span className={clsx(
              'text-[10px] uppercase px-2 py-0.5 rounded-full border',
              exact.provider
                ? 'text-cyber-green border-cyber-green/40 bg-cyber-green/10'
                : 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10'
            )}>
              {exact.provider ? `Live · ${exact.provider}` : 'Offline'}
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field icon={<CreditCard size={14} />} label="Scheme" value={exact.scheme?.toUpperCase()} />
            <Field icon={<CreditCard size={14} />} label="Brand" value={exact.brand} />
            <Field icon={<Wallet size={14} />} label="Type" value={exact.type} />
            <Field icon={<Wallet size={14} />} label="Category" value={exact.category} />
            <Field icon={<Building2 size={14} />} label="Bank" value={exact.bankName} />
            <Field icon={<Globe size={14} />} label="Country" value={exact.countryName ? `${exact.countryEmoji ?? ''} ${exact.countryName} (${exact.countryCode ?? ''})` : null} />
            <Field icon={<Globe size={14} />} label="Currency" value={exact.currency} />
          </div>
        </div>
      )}

      {ranges.length > 0 && (
        <div className="mt-5 rounded-lg border border-cyber-border bg-cyber-panel/50 overflow-hidden animate-fade-in">
          <div className="px-5 py-3 border-b border-cyber-border">
            <span className="text-sm font-semibold text-cyber-text flex items-center gap-2">
              <Globe size={14} className="text-cyber-green" />
              Known BIN Ranges
            </span>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-border/50 text-[11px] uppercase tracking-wider text-cyber-text-muted">
                    <th className="text-left pb-2 font-medium">Prefix</th>
                    <th className="text-left pb-2 font-medium">Brand</th>
                    <th className="text-left pb-2 font-medium">Type</th>
                    <th className="text-left pb-2 font-medium">Banks</th>
                  </tr>
                </thead>
                <tbody>
                  {ranges.map((r, i) => (
                    <tr key={i} className="border-b border-cyber-border/20 last:border-0">
                      <td className="py-2 pr-4 font-mono text-cyber-text">{r.prefix}*</td>
                      <td className="py-2 pr-4 text-cyber-text">{r.brand}</td>
                      <td className="py-2 pr-4 text-cyber-text-muted">{r.type}</td>
                      <td className="py-2 text-cyber-text-muted">{r.banks.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {nearby.length > 0 && (
        <div className="mt-5 rounded-lg border border-cyber-border bg-cyber-panel/50 overflow-hidden animate-fade-in">
          <button
            onClick={() => setShowNearby(!showNearby)}
            className="w-full px-5 py-3 border-b border-cyber-border flex items-center justify-between hover:bg-cyber-dark/30 transition-colors"
          >
            <span className="text-sm font-semibold text-cyber-text flex items-center gap-2">
              <Search size={14} className="text-cyber-yellow" />
              Nearby BINs ({nearby.length} found)
            </span>
            {showNearby ? <ChevronDown size={16} className="text-cyber-text-muted" /> : <ChevronRight size={16} className="text-cyber-text-muted" />}
          </button>
          {showNearby && (
            <div className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cyber-border/50 text-[11px] uppercase tracking-wider text-cyber-text-muted">
                      <th className="text-left pb-2 font-medium">BIN</th>
                      <th className="text-left pb-2 font-medium">Brand</th>
                      <th className="text-left pb-2 font-medium">Type</th>
                      <th className="text-left pb-2 font-medium">Bank</th>
                      <th className="text-left pb-2 font-medium">Country</th>
                      <th className="text-left pb-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearby.map((n, i) => (
                      <tr key={i} className="border-b border-cyber-border/20 last:border-0">
                        <td className="py-2 pr-4 font-mono text-cyber-blue">{n.bin}</td>
                        <td className="py-2 pr-4 text-cyber-text">{n.brand || '—'}</td>
                        <td className="py-2 pr-4 text-cyber-text-muted">{n.type || '—'}</td>
                        <td className="py-2 pr-4 text-cyber-text-muted">{n.bankName || '—'}</td>
                        <td className="py-2 pr-4 text-cyber-text-muted">{n.countryEmoji ? `${n.countryEmoji} ${n.countryName}` : n.countryName || '—'}</td>
                        <td className="py-2">
                          <span className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-cyber-green/30 bg-cyber-green/10 text-cyber-green">
                            {n.provider}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-cyber-text-muted mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-cyber-text-muted">{label}</p>
        <p className="text-sm text-cyber-text truncate">{value || '—'}</p>
      </div>
    </div>
  )
}
