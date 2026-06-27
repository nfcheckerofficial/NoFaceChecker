import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Vault, Copy, Check, Trash2, Search, Eye, EyeOff, Download, Filter } from 'lucide-react'
import { GateShell } from '@/widgets/GateShell/GateShell'
import { useLivesStore } from '@/features/checker/store/livesStore'

export function LiveVaultPage() {
  const { lives, clear } = useLivesStore()
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [filterGate, setFilterGate] = useState('')
  const [filterBank, setFilterBank] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterType, setFilterType] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const gates = useMemo(() => [...new Set(lives.map(l => l.gateName))].sort(), [lives])
  const banks = useMemo(() => [...new Set(lives.filter(l => l.bank).map(l => l.bank!))].sort(), [lives])
  const countries = useMemo(() => [...new Set(lives.filter(l => l.country).map(l => l.country!))].sort(), [lives])
  const types = useMemo(() => [...new Set(lives.filter(l => l.cardType).map(l => l.cardType!))].sort(), [lives])

  const filtered = useMemo(() => {
    return lives.filter(l => {
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!l.raw.toLowerCase().includes(q) &&
            !l.gateName.toLowerCase().includes(q) &&
            !l.bank?.toLowerCase().includes(q) &&
            !l.brand?.toLowerCase().includes(q)) return false
      }
      if (filterGate && l.gateName !== filterGate) return false
      if (filterBank && l.bank !== filterBank) return false
      if (filterCountry && l.country !== filterCountry) return false
      if (filterType && l.cardType !== filterType) return false
      return true
    })
  }, [lives, search, filterGate, filterBank, filterCountry, filterType])

  const handleCopyAll = async () => {
    if (filtered.length === 0) return
    await navigator.clipboard.writeText(filtered.map(l => l.raw).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleCopySelected = async () => {
    if (selected.size === 0) return
    await navigator.clipboard.writeText(filtered.filter(l => selected.has(l.raw)).map(l => l.raw).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleExportCSV = () => {
    if (filtered.length === 0) return
    const header = 'raw,gate,bin,bank,brand,type,country,capturedAt'
    const rows = filtered.map(l =>
      [l.raw, l.gateName, l.number.slice(0, 6), l.bank || '', l.brand || '', l.cardType || '', l.country || '', new Date(l.capturedAt).toISOString()].join(',')
    )
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'lives.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSelect = (raw: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(raw)) next.delete(raw); else next.add(raw)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(l => l.raw)))
  }

  return (
    <GateShell title="Live Vault" subtitle={`${lives.length} cards captured across all gates`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-cyber-border/50 bg-cyber-panel/60 text-sm text-cyber-text placeholder-cyber-text-muted/50 focus:outline-none focus:border-cyber-blue/50"
          />
        </div>
        <button onClick={() => setShowFilters(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border/50 bg-cyber-panel/60 text-xs text-cyber-text-muted hover:text-cyber-text transition-colors">
          <Filter size={14} /> Filter
        </button>
        <button onClick={() => setShowAll(v => !v)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border/50 bg-cyber-panel/60 text-xs text-cyber-text-muted hover:text-cyber-text transition-colors">
          {showAll ? <EyeOff size={14} /> : <Eye size={14} />} {showAll ? 'Hide' : 'Show'}
        </button>
        <button onClick={handleCopyAll} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border/50 bg-cyber-panel/60 text-xs text-cyber-text-muted hover:text-cyber-text disabled:opacity-30 transition-colors">
          {copied ? <Check size={14} className="text-cyber-green" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
        </button>
        <button onClick={handleExportCSV} disabled={filtered.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border/50 bg-cyber-panel/60 text-xs text-cyber-text-muted hover:text-cyber-text disabled:opacity-30 transition-colors">
          <Download size={14} /> CSV
        </button>
        <button onClick={clear} disabled={lives.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-red/30 bg-cyber-red/10 text-xs text-cyber-red hover:bg-cyber-red/20 disabled:opacity-30 transition-colors">
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg border border-cyber-border/30 bg-cyber-panel/40">
          <select value={filterGate} onChange={e => setFilterGate(e.target.value)} className="px-2 py-1.5 rounded border border-cyber-border/50 bg-cyber-black/60 text-xs text-cyber-text">
            <option value="">All gates</option>
            {gates.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="px-2 py-1.5 rounded border border-cyber-border/50 bg-cyber-black/60 text-xs text-cyber-text">
            <option value="">All banks</option>
            {banks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="px-2 py-1.5 rounded border border-cyber-border/50 bg-cyber-black/60 text-xs text-cyber-text">
            <option value="">All countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-2 py-1.5 rounded border border-cyber-border/50 bg-cyber-black/60 text-xs text-cyber-text">
            <option value="">All types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cyber-text-muted/50">
          <Vault size={40} className="mb-3 opacity-30" />
          <p className="text-sm">No cards found</p>
          <p className="text-xs mt-1">{lives.length === 0 ? 'Run gates to capture live cards' : 'Try different filters'}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <button onClick={selectAll} className="text-xs text-cyber-text-muted hover:text-cyber-text transition-colors">
              {selected.size === filtered.length ? 'Deselect all' : `Select all (${filtered.length})`}
            </button>
            {selected.size > 0 && (
              <button onClick={handleCopySelected} className="text-xs text-cyber-green hover:underline transition-colors">
                Copy {selected.size} selected
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((card) => {
              const masked = showAll ? card.raw : card.raw.replace(/\|.*$/, '').replace(/\d(?=\d{4})/g, '*')
              const isSelected = selected.has(card.raw)
              return (
                <div
                  key={card.raw}
                  onClick={() => toggleSelect(card.raw)}
                  className={clsx(
                    'rounded-xl border p-4 transition-all cursor-pointer',
                    isSelected
                      ? 'border-cyber-green/50 bg-cyber-green/5'
                      : 'border-cyber-border/40 bg-gradient-to-br from-cyber-panel/80 to-cyber-dark/80 hover:border-cyber-green/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-cyber-green font-semibold">{card.gateName}</span>
                    <span className="text-[10px] text-cyber-text-muted">
                      {new Date(card.capturedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-mono text-xs sm:text-sm text-cyber-text break-all">{masked}</p>
                  {card.enriched && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {card.brand && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-blue/10 text-cyber-blue">{card.brand}</span>}
                      {card.cardType && <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-purple/10 text-cyber-purple">{card.cardType}</span>}
                      {card.country && <span className="text-[10px] text-cyber-text-muted">{card.countryEmoji} {card.country}</span>}
                      {card.bank && <span className="text-[10px] text-cyber-text-muted/70 truncate max-w-[120px]">{card.bank}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </GateShell>
  )
}
