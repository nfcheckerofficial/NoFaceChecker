import { useMemo, useState } from 'react'
import { ShieldCheck, Copy, Check, Trash2, X, Download } from 'lucide-react'
import { clsx } from 'clsx'
import { GateShell } from '@/widgets/GateShell/GateShell'
import { useLivesStore } from '@/features/checker/store/livesStore'

type TypeFilter = 'all' | 'debit' | 'credit'

export function LivesVaultPage() {
  const { lives, remove, clear } = useLivesStore()
  const [filter, setFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [copied, setCopied] = useState(false)

  // Lista de gates presentes para el filtro.
  const gates = useMemo(() => {
    const map = new Map<string, string>()
    lives.forEach((l) => map.set(l.gateId, l.gateName))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [lives])

  const debitCount = lives.filter((l) => l.cardType?.toLowerCase() === 'debit').length
  const creditCount = lives.filter((l) => l.cardType?.toLowerCase() === 'credit').length

  const filtered = lives.filter((l) => {
    const gateOk = filter === 'all' || l.gateId === filter
    const typeOk = typeFilter === 'all' || l.cardType?.toLowerCase() === typeFilter
    return gateOk && typeOk
  })

  const copyAll = async () => {
    if (!filtered.length) return
    await navigator.clipboard.writeText(filtered.map((l) => l.raw).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const downloadAll = () => {
    if (!filtered.length) return
    const blob = new Blob([filtered.map((l) => l.raw).join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lives_${filter}_${filtered.length}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <GateShell title="Lives Vault" subtitle={`${lives.length} captured live cards`}>
      <div className="rounded-xl border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-cyber-border">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}
              label={`All (${lives.length})`} />
            {gates.map((g) => (
              <FilterChip
                key={g.id}
                active={filter === g.id}
                onClick={() => setFilter(g.id)}
                label={`${g.name} (${lives.filter((l) => l.gateId === g.id).length})`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyAll} disabled={!filtered.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-cyber-text-muted hover:text-cyber-text border border-cyber-border disabled:opacity-30 transition-colors">
              {copied ? <Check size={13} className="text-cyber-green" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={downloadAll} disabled={!filtered.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-cyber-text-muted hover:text-cyber-text border border-cyber-border disabled:opacity-30 transition-colors">
              <Download size={13} /> Save
            </button>
            <button onClick={clear} disabled={!lives.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-cyber-text-muted hover:text-cyber-red border border-cyber-border disabled:opacity-30 transition-colors">
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>

        {/* Filtro por tipo */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cyber-border">
          <span className="text-[10px] uppercase tracking-wider text-cyber-text-muted mr-1">Type</span>
          <FilterChip active={typeFilter === 'all'} onClick={() => setTypeFilter('all')}
            label={`All (${lives.length})`} />
          <FilterChip active={typeFilter === 'debit'} onClick={() => setTypeFilter('debit')}
            label={`Debit (${debitCount})`} />
          <FilterChip active={typeFilter === 'credit'} onClick={() => setTypeFilter('credit')}
            label={`Credit (${creditCount})`} />
        </div>

        {/* Lista */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="w-14 h-14 rounded-full bg-cyber-dark border border-cyber-border flex items-center justify-center mb-3">
                <ShieldCheck size={26} className="text-cyber-green" />
              </span>
              <p className="text-sm text-cyber-text-muted">
                No live cards captured yet. Run a gate to start collecting.
              </p>
            </div>
          ) : (
            filtered.map((l, i) => (
              <div
                key={`${l.raw}-${i}`}
                className="px-3.5 py-2.5 rounded-lg bg-cyber-dark/50 animate-fade-in group"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Check size={14} className="text-cyber-green shrink-0" />
                    <span className="text-cyber-green font-mono text-[13px] truncate">{l.raw}</span>
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-cyber-border text-cyber-text-muted">
                      {l.gateName}
                    </span>
                    <button
                      onClick={() => remove(l.raw)}
                      className="text-cyber-text-muted hover:text-cyber-red opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </span>
                </div>

                {/* Datos del emisor */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5 pl-6">
                  {!l.enriched ? (
                    <span className="text-[11px] text-cyber-text-muted/60 italic">Looking up issuer…</span>
                  ) : (
                    <>
                      {l.cardType && (
                        <span className={clsx(
                          'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold',
                          l.cardType.toLowerCase() === 'debit'
                            ? 'bg-cyber-blue/15 text-cyber-blue'
                            : l.cardType.toLowerCase() === 'credit'
                              ? 'bg-cyber-purple/15 text-cyber-purple'
                              : 'bg-cyber-border/40 text-cyber-text-muted'
                        )}>
                          {l.cardType}
                        </span>
                      )}
                      {l.brand && (
                        <span className="text-[11px] text-cyber-text-muted">{l.brand}</span>
                      )}
                      <span className="text-[11px] text-cyber-text">
                        {l.bank || 'Unknown bank'}
                      </span>
                      {l.country && (
                        <span className="text-[11px] text-cyber-text-muted">
                          · {l.countryEmoji ? `${l.countryEmoji} ` : ''}{l.country}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </GateShell>
  )
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-full text-xs transition-colors border',
        active
          ? 'bg-cyber-green/15 border-cyber-green/50 text-cyber-green'
          : 'border-cyber-border text-cyber-text-muted hover:text-cyber-text'
      )}
    >
      {label}
    </button>
  )
}
