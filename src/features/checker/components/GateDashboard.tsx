import { useEffect, useMemo, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { Play, Pause, Cpu, Copy, Check, Trash2 } from 'lucide-react'
import { CircularProgress } from '@/shared/ui/CircularProgress'
import { GateShell } from '@/widgets/GateShell/GateShell'
import { CardGenerator } from './CardGenerator'
import { useGateStore, type CardStatus } from '../store/gateStore'
import { useUserStore } from '../store/userStore'
import { useLivesStore } from '../store/livesStore'
import { getGateConfig } from '../config/gateCatalog'

type Tab = 'live' | 'dead' | 'unknown'

const STATUS_COLOR: Record<CardStatus, string> = {
  live: 'text-cyber-green',
  dead: 'text-cyber-red',
  unknown: 'text-cyber-yellow',
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now.toLocaleTimeString('en-US', { hour12: true })
}

interface GateDashboardProps {
  /** Id del gate del catálogo. Por defecto 'vice'. */
  gateId?: string
}

export function GateDashboard({ gateId }: GateDashboardProps) {
  const {
    gateName, liveCost, deadCost,
    queue, results, currentCard, prevCard,
    isRunning, isPaused, stats, notice,
    configure, setQueue, appendQueue, start, pause, resume, reset,
  } = useGateStore()
  const credits = useUserStore((s) => s.profile.credits)
  const livesVault = useLivesStore((s) => s.lives)

  // Mapa rápido raw -> datos de emisor enriquecidos.
  const livesByRaw = useMemo(() => {
    const m = new Map<string, (typeof livesVault)[number]>()
    livesVault.forEach((l) => m.set(l.raw, l))
    return m
  }, [livesVault])

  const [draft, setDraft] = useState('')
  const [genOpen, setGenOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('live')
  const [copied, setCopied] = useState(false)
  const time = useClock()
  const feedRef = useRef<HTMLDivElement>(null)

  // Aplica la configuración del gate al montar / cambiar de gate.
  useEffect(() => {
    configure(getGateConfig(gateId))
    setDraft('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateId])

  // Sincroniza la cola con el textarea sólo cuando NO está corriendo.
  useEffect(() => {
    if (!isRunning) {
      setQueue(draft.split('\n'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  // Auto-scroll del feed de resultados.
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [results.length])

  const progress = useMemo(() => {
    const denom = stats.total || 1
    return Math.round((stats.checked / denom) * 100)
  }, [stats.checked, stats.total])

  const handleStart = () => {
    if (isPaused) {
      resume()
    } else {
      start()
    }
  }

  const handleGenerated = (lines: string[]) => {
    if (isRunning) {
      appendQueue(lines)
    } else {
      setDraft(prev => (prev.trim() ? prev.trim() + '\n' : '') + lines.join('\n'))
    }
  }

  const filtered = results.filter(r => r.status === tab)

  const copyFiltered = async () => {
    if (filtered.length === 0) return
    await navigator.clipboard.writeText(filtered.map(r => r.raw).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const circLabel = isRunning && !isPaused ? `${progress}%` : isPaused ? 'Paused' : 'Idle'

  return (
    <GateShell
      title={gateName}
      subtitle={`(Live Cost - ${liveCost} & Dead Cost - ${deadCost})`}
    >
      {/* Barra de créditos / aviso */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm">
          <span className="text-xs text-cyber-text-muted uppercase tracking-wider">Credits</span>
          <span className={clsx(
            'text-sm font-mono font-bold tabular-nums',
            credits < liveCost ? 'text-cyber-red' : 'text-cyber-green'
          )}>
            {credits}
          </span>
        </div>
        {notice && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-red/50 bg-cyber-red/10 text-cyber-red text-sm animate-fade-in">
            {notice}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Panel izquierdo: lista + controles */}
        <div className="flex flex-col">
          <textarea
            value={isRunning ? [currentCard, ...queue].filter(Boolean).join('\n') : draft}
            onChange={e => setDraft(e.target.value)}
            readOnly={isRunning}
            spellCheck={false}
            placeholder={'4737029165106320|03|2028|472\n...one card per line (number|MM|YYYY|CVV)'}
            className={clsx(
              'w-full h-[340px] resize-none rounded-xl border border-cyber-border bg-cyber-dark/80 backdrop-blur-sm p-5',
              'text-sm font-mono text-cyber-text/90 leading-relaxed text-center',
              'placeholder:text-cyber-text-muted/40 placeholder:text-left',
              'focus:border-cyber-blue/60 focus:shadow-[0_0_20px_rgba(0,212,255,0.15)] focus:outline-none transition-all',
              isRunning && 'opacity-80'
            )}
          />

          <div className="grid grid-cols-3 gap-3 mt-5">
            <button
              onClick={handleStart}
              disabled={(isRunning && !isPaused) || queue.length === 0}
              className="flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-bold text-white bg-cyber-green-dark hover:bg-cyber-green hover:text-cyber-black hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isPaused ? 'Resume' : 'Start'} <Play size={16} />
            </button>
            <button
              onClick={pause}
              disabled={!isRunning || isPaused}
              className="flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-bold text-white bg-cyber-red hover:bg-cyber-red-dark hover:shadow-[0_0_20px_rgba(255,0,64,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Pause <Pause size={16} />
            </button>
            <button
              onClick={() => setGenOpen(true)}
              className="flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-bold text-white bg-cyber-blue/80 hover:bg-cyber-blue hover:text-cyber-black hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all"
            >
              Generator <Cpu size={16} />
            </button>
          </div>
        </div>

        {/* Panel derecho: stats */}
        <div className="rounded-xl border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-7 py-7">
          <div className="flex items-center justify-between">
            <CircularProgress
              value={progress}
              label={circLabel}
              running={isRunning && !isPaused}
              size={170}
            />
            <div className="flex-1 ml-8 space-y-4">
              <StatRow color="bg-cyber-blue" label="Total" value={stats.total} />
              <StatRow color="bg-cyber-green" label="Lives" value={stats.live} />
              <StatRow color="bg-cyber-red" label="Dead" value={stats.dead} />
              <StatRow color="bg-cyber-yellow" label="Checked" value={stats.checked} />
            </div>
          </div>

          <div className="border-t border-cyber-border my-5" />

          <div className="space-y-3 text-sm">
            <InfoRow label="On Queue:" value={isRunning ? String(queue.length) : (queue.length ? String(queue.length) : 'None')} />
            <InfoRow label="Prev. Card:" value={prevCard ?? 'None'} mono />
            <InfoRow label="Time:" value={time} mono />
          </div>
        </div>
      </div>

      {/* Tabs de resultados */}
      <div className="mt-6 rounded-xl border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-cyber-border px-2">
          <div className="flex">
            <TabButton active={tab === 'live'} onClick={() => setTab('live')}
              label={`Live - ${stats.live}`} color="text-cyber-green" />
            <TabButton active={tab === 'dead'} onClick={() => setTab('dead')}
              label={`Dead - ${stats.dead}`} color="text-cyber-red" />
            <TabButton active={tab === 'unknown'} onClick={() => setTab('unknown')}
              label={`Unknown - ${stats.unknown}`} color="text-cyber-yellow" />
          </div>
          <div className="flex items-center gap-1 pr-2">
            <button
              onClick={copyFiltered}
              disabled={filtered.length === 0}
              className="p-2 text-cyber-text-muted hover:text-cyber-text disabled:opacity-30 transition-colors"
              title="Copy"
            >
              {copied ? <Check size={16} className="text-cyber-green" /> : <Copy size={16} />}
            </button>
            <button
              onClick={reset}
              className="p-2 text-cyber-text-muted hover:text-cyber-red transition-colors"
              title="Clear all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div ref={feedRef} className="max-h-[320px] overflow-y-auto p-4 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-cyber-text-muted/60 py-12">
              No {tab} cards yet.
            </p>
          ) : (
            filtered.map((r, i) => {
              const intel = r.status === 'live' ? livesByRaw.get(r.raw) : undefined
              return (
                <div
                  key={`${r.raw}-${i}`}
                  className="px-3.5 py-2.5 rounded-lg bg-cyber-dark/50 animate-fade-in"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={clsx('truncate font-mono text-[13px]', STATUS_COLOR[r.status])}>{r.raw}</span>
                    <span className="text-cyber-text-muted/70 text-[11px] whitespace-nowrap">
                      {r.message}
                    </span>
                  </div>

                  {/* Intel del emisor para lives */}
                  {r.status === 'live' && (
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {!intel?.enriched ? (
                        <span className="text-[10px] text-cyber-text-muted/60 italic">Looking up issuer…</span>
                      ) : (
                        <>
                          {intel.cardType && (
                            <span className={clsx(
                              'text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold',
                              intel.cardType.toLowerCase() === 'debit'
                                ? 'bg-cyber-blue/15 text-cyber-blue'
                                : intel.cardType.toLowerCase() === 'credit'
                                  ? 'bg-cyber-purple/15 text-cyber-purple'
                                  : 'bg-cyber-border/40 text-cyber-text-muted'
                            )}>
                              {intel.cardType}
                            </span>
                          )}
                          {intel.brand && (
                            <span className="text-[10px] text-cyber-text-muted">{intel.brand}</span>
                          )}
                          <span className="text-[10px] text-cyber-text/90">{intel.bank || 'Unknown bank'}</span>
                          {intel.country && (
                            <span className="text-[10px] text-cyber-text-muted">
                              · {intel.countryEmoji ? `${intel.countryEmoji} ` : ''}{intel.country}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <CardGenerator
        open={genOpen}
        onClose={() => setGenOpen(false)}
        onGenerate={handleGenerated}
      />
    </GateShell>
  )
}

function StatRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className={clsx('w-2.5 h-2.5 rounded-full', color)} />
        <span className="text-sm text-cyber-text">{label}</span>
      </div>
      <span className="text-sm font-mono text-cyber-text tabular-nums">{value}</span>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-cyber-text-muted">{label}</span>
      <span className={clsx('text-cyber-text truncate max-w-[55%] text-right', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  )
}

function TabButton({
  active, onClick, label, color,
}: { active: boolean; onClick: () => void; label: string; color: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative px-4 py-3 text-sm transition-colors',
        active ? clsx('font-semibold', color) : 'text-cyber-text-muted hover:text-cyber-text'
      )}
    >
      {label}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-current" />}
    </button>
  )
}
