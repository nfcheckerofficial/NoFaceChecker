import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Vault, Copy, Check, Trash2, Search, Eye, EyeOff } from 'lucide-react'
import { GateShell } from '@/widgets/GateShell/GateShell'
import { useLivesStore } from '@/features/checker/store/livesStore'

export function LiveVaultPage() {
  const { lives, clear } = useLivesStore()
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return lives
    const q = search.toLowerCase()
    return lives.filter(l =>
      l.raw.toLowerCase().includes(q) ||
      l.gateName.toLowerCase().includes(q) ||
      l.bank?.toLowerCase().includes(q) ||
      l.brand?.toLowerCase().includes(q)
    )
  }, [lives, search])

  const handleCopyAll = async () => {
    if (filtered.length === 0) return
    await navigator.clipboard.writeText(filtered.map(l => l.raw).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <GateShell title="Live Vault" subtitle={`${lives.length} cards captured across all gates`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by card, gate, bank..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-cyber-border/50 bg-cyber-panel/60 text-sm text-cyber-text placeholder-cyber-text-muted/50 focus:outline-none focus:border-cyber-blue/50"
          />
        </div>
        <button
          onClick={() => setShowAll(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border/50 bg-cyber-panel/60 text-xs text-cyber-text-muted hover:text-cyber-text transition-colors"
        >
          {showAll ? <EyeOff size={14} /> : <Eye size={14} />}
          {showAll ? 'Hide numbers' : 'Show numbers'}
        </button>
        <button
          onClick={handleCopyAll}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border/50 bg-cyber-panel/60 text-xs text-cyber-text-muted hover:text-cyber-text disabled:opacity-30 transition-colors"
        >
          {copied ? <Check size={14} className="text-cyber-green" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy all'}
        </button>
        <button
          onClick={clear}
          disabled={lives.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-red/30 bg-cyber-red/10 text-xs text-cyber-red hover:bg-cyber-red/20 disabled:opacity-30 transition-colors"
        >
          <Trash2 size={14} />
          Clear vault
        </button>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cyber-text-muted/50">
          <Vault size={40} className="mb-3 opacity-30" />
          <p className="text-sm">No cards captured yet</p>
          <p className="text-xs mt-1">Run gates to capture live cards</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((card) => {
            const masked = card.raw.replace(/\|.*$/, '').replace(/\d(?=\d{4})/g, '*')
            return (
              <div
                key={card.raw}
                className="rounded-xl border border-cyber-border/40 bg-gradient-to-br from-cyber-panel/80 to-cyber-dark/80 p-4 hover:border-cyber-green/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-cyber-green font-semibold">{card.gateName}</span>
                  <span className="text-[10px] text-cyber-text-muted">
                    {new Date(card.capturedAt).toLocaleString()}
                  </span>
                </div>
                <p className="font-mono text-xs sm:text-sm text-cyber-text break-all">
                  {showAll ? card.raw : masked}
                </p>
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
      )}
    </GateShell>
  )
}
