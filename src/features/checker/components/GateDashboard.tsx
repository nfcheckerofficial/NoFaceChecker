import { useEffect, useMemo, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { Play, Pause, Cpu, Copy, Check, Trash2, Zap, Activity, Clock, ArrowRight, AlertTriangle, ChevronDown } from 'lucide-react'
import { CircularProgress } from '@/shared/ui/CircularProgress'
import { GateShell } from '@/widgets/GateShell/GateShell'
import { CardGenerator } from './CardGenerator'
import { useGateStore, type CardStatus } from '../store/gateStore'
import { useUserStore } from '../store/userStore'
import { useLivesStore } from '../store/livesStore'
import { getGateConfig, getGatesSortedByRate, getBestGate, isAmazonGate } from '../config/gateCatalog'
import { initAudio } from '@/shared/utils/sound'

type Tab = 'live' | 'dead' | 'unknown'

const STATUS_COLOR: Record<CardStatus, string> = {
  live: 'text-cyber-green',
  dead: 'text-cyber-red',
  unknown: 'text-cyber-yellow',
}

const STATUS_BG: Record<CardStatus, string> = {
  live: 'bg-cyber-green',
  dead: 'bg-cyber-red',
  unknown: 'bg-cyber-yellow',
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

  const livesByRaw = useMemo(() => {
    const m = new Map<string, (typeof livesVault)[number]>()
    livesVault.forEach((l) => m.set(l.raw, l))
    return m
  }, [livesVault])

  const sortedGates = useMemo(() => getGatesSortedByRate(), [])

  const [draft, setDraft] = useState('')
  const [genOpen, setGenOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('live')
  const [copied, setCopied] = useState(false)
  const [gateSelectorOpen, setGateSelectorOpen] = useState(false)
  const [amazonCookie, setAmazonCookie] = useState('')
  const time = useClock()
  const feedRef = useRef<HTMLDivElement>(null)

  const isAmazon = isAmazonGate(gateId || useGateStore.getState().gateId)

  useEffect(() => {
    configure(getGateConfig(gateId || getBestGate().id))
    setDraft('')
    return () => {
      if (gateId) reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (e.key === 'Enter') handleStart()
      if (e.key === ' ' && !isRunning) { e.preventDefault(); handleStart() }
      else if (e.key === ' ' && isRunning) { e.preventDefault(); if (isPaused) resume(); else pause() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isRunning, isPaused, handleStart, pause, resume])

  useEffect(() => {
    if (!isRunning) {
      setQueue(draft.split('\n'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [results.length])

  const progress = useMemo(() => {
    const denom = stats.total || 1
    return Math.round((stats.checked / denom) * 100)
  }, [stats.checked, stats.total])

  const handleStart = async () => {
    initAudio()
    if (isPaused) {
      resume()
      return
    }
    if (isAmazon && amazonCookie.trim() === '') {
      useGateStore.setState({ notice: 'Se requiere la cookie de Amazon para procesar.' })
      return
    }
    await start()
  }

  const handleGenerated = (lines: string[]) => {
    if (isRunning) {
      appendQueue(lines)
    } else {
      setDraft(lines.join('\n'))
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

  const running = isRunning && !isPaused

  return (
    <GateShell
      title={gateName}
      subtitle={`(Live Cost - ${liveCost} & Dead Cost - ${deadCost})`}
    >
      {/* Gate selector (solo cuando no hay gateId fijo) */}
      {!gateId && (
        <div className="relative mb-4">
          <button
            onClick={() => setGateSelectorOpen(o => !o)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyber-border/50 bg-cyber-panel/60 backdrop-blur-sm hover:border-cyber-blue/40 transition-all w-full sm:w-auto"
          >
            <Zap size={14} className="text-cyber-green" />
            <span className="text-xs text-cyber-text-muted uppercase tracking-wider">Gate:</span>
            <span className="text-sm font-bold text-cyber-text">{gateName}</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyber-green/10 text-cyber-green">{(getGateConfig(gateId || useGateStore.getState().gateId).liveRate * 100).toFixed(0)}% live</span>
            <ChevronDown size={14} className="text-cyber-text-muted" />
          </button>
          {gateSelectorOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setGateSelectorOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 w-full sm:w-80 max-h-72 overflow-y-auto rounded-xl border border-cyber-border/50 bg-cyber-dark/95 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] p-1">
                {sortedGates.map((g) => {
                  const selected = g.id === useGateStore.getState().gateId
                  return (
                    <button
                      key={g.id}
                      onClick={() => {
                        configure(g)
                        setGateSelectorOpen(false)
                      }}
                      className={clsx(
                        'flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-all',
                        selected ? 'bg-cyber-blue/10 text-cyber-blue' : 'text-cyber-text/80 hover:bg-cyber-panel/60'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={clsx('w-1.5 h-1.5 rounded-full', selected ? 'bg-cyber-green' : 'bg-cyber-border')} />
                        <span className="font-medium">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-cyber-green font-mono">{(g.liveRate * 100).toFixed(0)}%</span>
                        <span className="text-cyber-text-muted/50">{g.liveCost}cr</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Credits + status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-cyber-border/50 bg-cyber-panel/60 backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2">
            <Zap size={14} className={credits < liveCost ? 'text-cyber-red' : 'text-cyber-green'} />
            <span className="text-xs text-cyber-text-muted uppercase tracking-wider">Credits</span>
          </div>
          <span className={clsx(
            'text-sm font-mono font-bold tabular-nums',
            credits < liveCost ? 'text-cyber-red drop-shadow-[0_0_8px_rgba(255,0,64,0.3)]' : 'text-cyber-green'
          )}>
            {credits}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {running && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyber-green/10 border border-cyber-green/30 motion-safe:animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-cyber-green motion-safe:animate-pulse shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
              <span className="text-xs text-cyber-green font-semibold uppercase tracking-wider">Processing</span>
            </div>
          )}
          {isPaused && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyber-yellow/10 border border-cyber-yellow/30">
              <span className="w-2 h-2 rounded-full bg-cyber-yellow" />
              <span className="text-xs text-cyber-yellow font-semibold uppercase tracking-wider">Paused</span>
            </div>
          )}
        </div>
        {notice && (
          <div className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyber-red/40 bg-gradient-to-r from-cyber-red/10 to-transparent text-cyber-red text-sm motion-safe:animate-[fadeIn_0.3s_ease-out]">
            <AlertTriangle size={14} className="shrink-0" />
            {notice}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
        {/* Left panel: cards list + controls */}
        <div className="flex flex-col">
          {/* Amazon cookie input */}
          {isAmazon && (
            <div className="mb-3">
              <label className="block text-xs text-cyber-text-muted mb-1 uppercase tracking-wider">
                Amazon Cookie (sessi+�n)
              </label>
              <textarea
                value={amazonCookie}
                onChange={e => setAmazonCookie(e.target.value)}
                readOnly={isRunning}
                spellCheck={false}
                placeholder={'Pega aqu+� la cookie de Amazon (session-id, ubid, etc.)...'}
                className={clsx(
                  'w-full h-[70px] resize-none rounded-xl border border-cyber-border/60 bg-cyber-dark/80 p-3',
                  'text-xs font-mono text-cyber-text/90 leading-relaxed',
                  'placeholder:text-cyber-text-muted/30',
                  'focus:outline-none focus:border-cyber-yellow/50',
                  isRunning && 'opacity-80'
                )}
              />
              {amazonCookie.trim() === '' && (
                <p className="text-[10px] text-cyber-yellow/70 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Se requiere la cookie de Amazon para procesar las tarjetas
                </p>
              )}
            </div>
          )}

          {/* Textarea */}
          <div className="relative group/ta">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyber-blue/30 via-cyber-purple/20 to-cyber-blue/30 opacity-0 group-focus-within/ta:opacity-100 transition-opacity duration-500 blur-sm" />
            <textarea
              value={isRunning ? [currentCard, ...queue].filter(Boolean).join('\n') : draft}
              onChange={e => setDraft(e.target.value)}
              readOnly={isRunning}
              spellCheck={false}
              placeholder={'4737029165106320|03|2028|472\n...one card per line (number|MM|YYYY|CVV)'}
              className={clsx(
                'relative w-full h-[280px] sm:h-[340px] resize-none rounded-2xl border border-cyber-border/60 bg-gradient-to-b from-cyber-dark/90 to-cyber-panel/60 backdrop-blur-sm p-4 sm:p-5',
                'text-xs sm:text-sm font-mono text-cyber-text/90 leading-relaxed',
                'placeholder:text-cyber-text-muted/30 placeholder:text-xs sm:placeholder:text-sm',
                'focus:outline-none focus:border-cyber-blue/50 focus:shadow-[0_0_30px_rgba(0,212,255,0.1)]',
                'transition-all duration-300',
                isRunning && 'opacity-80'
              )}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
            <button
              onClick={handleStart}
              disabled={(isRunning && !isPaused) || queue.length === 0}
              className={clsx(
                'relative overflow-hidden group/btn flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300',
                'disabled:opacity-35 disabled:cursor-not-allowed',
                isPaused
                  ? 'bg-gradient-to-r from-cyber-green-dark to-cyber-green text-white hover:shadow-[0_0_25px_rgba(0,255,136,0.3)]'
                  : 'bg-gradient-to-r from-cyber-green-dark to-cyber-green text-white hover:shadow-[0_0_25px_rgba(0,255,136,0.3)]'
              )}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-1.5 sm:gap-2">
                {isPaused ? 'Resume' : 'Start'}
                <Play size={14} className="sm:hidden" />
                <Play size={16} className="hidden sm:block" />
              </span>
            </button>
            <button
              onClick={pause}
              disabled={!isRunning || isPaused}
              className="relative overflow-hidden group/btn flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyber-red to-cyber-red-dark hover:shadow-[0_0_25px_rgba(255,0,64,0.3)] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-1.5 sm:gap-2">
                Pause <Pause size={14} className="sm:hidden" /><Pause size={16} className="hidden sm:block" />
              </span>
            </button>
            <button
              onClick={() => setGenOpen(true)}
              className="relative overflow-hidden group/btn flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyber-blue to-cyber-blue/80 hover:shadow-[0_0_25px_rgba(0,212,255,0.3)] transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-1.5 sm:gap-2">
                Gen <Cpu size={14} className="sm:hidden" /><span className="hidden sm:inline">Generator</span><Cpu size={16} className="hidden sm:block" />
              </span>
            </button>
          </div>
        </div>

        {/* Right panel: Stats */}
        <div className="rounded-2xl border border-cyber-border/50 bg-gradient-to-br from-cyber-panel/80 via-cyber-panel/60 to-cyber-dark/80 backdrop-blur-md p-5 sm:px-7 sm:py-7 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-0">
            <CircularProgress
              value={progress}
              label={circLabel}
              running={running}
              size={140}
            />
            <div className="flex-1 sm:ml-6 lg:ml-8 w-full space-y-3 sm:space-y-4">
              <StatRow color="bg-cyber-blue" label="Total" value={stats.total} />
              <StatRow color="bg-cyber-green" label="Lives" value={stats.live} />
              <StatRow color="bg-cyber-red" label="Dead" value={stats.dead} />
              <StatRow color="bg-cyber-yellow" label="Checked" value={stats.checked} />
            </div>
          </div>

          <div className="border-t border-cyber-border/40 my-4 sm:my-5" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-0 text-xs sm:text-sm">
            <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:gap-1 px-3 py-2 sm:py-0 rounded-lg sm:rounded-none bg-cyber-dark/50 sm:bg-transparent">
              <span className="text-cyber-text-muted/70 flex items-center gap-1.5">
                <Activity size={12} className="text-cyber-blue" /> Queue
              </span>
              <span className="text-cyber-text font-mono">{isRunning ? queue.length : (queue.length || '0')}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:gap-1 px-3 py-2 sm:py-0 rounded-lg sm:rounded-none bg-cyber-dark/50 sm:bg-transparent">
              <span className="text-cyber-text-muted/70 flex items-center gap-1.5">
                <ArrowRight size={12} className="text-cyber-purple" /> Prev
              </span>
              <span className="text-cyber-text font-mono truncate max-w-[120px] text-right sm:text-left">{prevCard ? prevCard.slice(0, 16) + '...' : 'None'}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-start sm:flex-col sm:gap-1 px-3 py-2 sm:py-0 rounded-lg sm:rounded-none bg-cyber-dark/50 sm:bg-transparent">
              <span className="text-cyber-text-muted/70 flex items-center gap-1.5">
                <Clock size={12} className="text-cyber-yellow" /> Time
              </span>
              <span className="text-cyber-text font-mono">{time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-5 sm:mt-6 rounded-2xl border border-cyber-border/50 bg-gradient-to-b from-cyber-panel/60 to-cyber-dark/60 backdrop-blur-md overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.15)]">
        {/* Tabs header */}
        <div className="flex items-center justify-between border-b border-cyber-border/40 px-1 sm:px-2">
          <div className="flex">
            <TabButton active={tab === 'live'} onClick={() => setTab('live')}
              label={`Live`} count={stats.live} color="text-cyber-green" dot="bg-cyber-green" />
            <TabButton active={tab === 'dead'} onClick={() => setTab('dead')}
              label={`Dead`} count={stats.dead} color="text-cyber-red" dot="bg-cyber-red" />
            <TabButton active={tab === 'unknown'} onClick={() => setTab('unknown')}
              label={`Unknown`} count={stats.unknown} color="text-cyber-yellow" dot="bg-cyber-yellow" />
          </div>
          <div className="flex items-center gap-1 pr-1 sm:pr-2">
            <button
              onClick={copyFiltered}
              disabled={filtered.length === 0}
              className="p-1.5 sm:p-2 rounded-lg text-cyber-text-muted hover:text-cyber-text hover:bg-cyber-panel disabled:opacity-30 transition-all"
              title="Copy filtered"
            >
              {copied ? <Check size={14} className="sm:hidden text-cyber-green" /> : <Copy size={14} className="sm:hidden" />}
              {copied ? <Check size={16} className="hidden sm:block text-cyber-green" /> : <Copy size={16} className="hidden sm:block" />}
            </button>
            <button
              onClick={reset}
              className="p-1.5 sm:p-2 rounded-lg text-cyber-text-muted hover:text-cyber-red hover:bg-cyber-red/10 transition-all"
              title="Clear all"
            >
              <Trash2 size={14} className="sm:hidden" />
              <Trash2 size={16} className="hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Feed */}
        <div ref={feedRef} className="max-h-[280px] sm:max-h-[320px] overflow-y-auto p-3 sm:p-4 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-cyber-text-muted/50">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center mb-3',
                tab === 'live' ? 'bg-cyber-green/10' : tab === 'dead' ? 'bg-cyber-red/10' : 'bg-cyber-yellow/10'
              )}>
                <Activity size={18} className={STATUS_COLOR[tab]} />
              </div>
              <p className="text-xs sm:text-sm">No {tab} cards yet</p>
            </div>
          ) : (
            filtered.map((r, i) => {
              const intel = r.status === 'live' ? livesByRaw.get(r.raw) : undefined
              return (
                <div
                  key={`${r.raw}-${i}`}
                  className="px-3 sm:px-3.5 py-2.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyber-dark/70 to-cyber-panel/50 border border-cyber-border/30 motion-safe:animate-[fadeIn_0.3s_ease-out] hover:border-cyber-border/60 transition-all"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={clsx('w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0', STATUS_BG[r.status])} />
                    <span className={clsx('flex-1 truncate font-mono text-xs sm:text-[13px]', STATUS_COLOR[r.status])}>
                      {r.raw}
                    </span>
                    <span className={clsx(
                      'text-[10px] sm:text-[11px] whitespace-nowrap px-2 py-0.5 rounded-full',
                      r.status === 'live' ? 'bg-cyber-green/10 text-cyber-green/80' :
                      r.status === 'dead' ? 'bg-cyber-red/10 text-cyber-red/80' :
                      'bg-cyber-yellow/10 text-cyber-yellow/80'
                    )}>
                      {r.message}
                    </span>
                  </div>

                  {r.status === 'live' && (
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 ml-3 sm:ml-4">
                      {!intel?.enriched ? (
                        <span className="text-[9px] sm:text-[10px] text-cyber-text-muted/50 italic flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-cyber-blue motion-safe:animate-pulse" />
                          Looking up issuer...
                        </span>
                      ) : (
                        <>
                          {intel.cardType && (
                            <span className={clsx(
                              'text-[8px] sm:text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold',
                              intel.cardType.toLowerCase() === 'debit'
                                ? 'bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/20'
                                : intel.cardType.toLowerCase() === 'credit'
                                  ? 'bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/20'
                                  : 'bg-cyber-border/40 text-cyber-text-muted border border-cyber-border/30'
                            )}>
                              {intel.cardType}
                            </span>
                          )}
                          {intel.brand && (
                            <span className="text-[9px] sm:text-[10px] text-cyber-text-muted/80">{intel.brand}</span>
                          )}
                          <span className="text-[9px] sm:text-[10px] text-cyber-text/80">{intel.bank || 'Unknown'}</span>
                          {intel.country && (
                            <span className="text-[9px] sm:text-[10px] text-cyber-text-muted/60">
                              {intel.countryEmoji ? `${intel.countryEmoji} ` : ''}{intel.country}
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
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className={clsx('w-2 h-2 rounded-full', color, 'shadow-[0_0_6px_currentColor]')} />
        <span className="text-xs sm:text-sm text-cyber-text/90">{label}</span>
      </div>
      <span className="text-xs sm:text-sm font-mono text-cyber-text font-bold tabular-nums">{value}</span>
    </div>
  )
}

function TabButton({
  active, onClick, label, count, color, dot,
}: { active: boolean; onClick: () => void; label: string; count: number; color: string; dot: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-all duration-200',
        active
          ? clsx('font-bold', color)
          : 'text-cyber-text-muted/60 hover:text-cyber-text/80'
      )}
    >
      <span className={clsx('w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full', dot, active && 'shadow-[0_0_6px_currentColor]')} />
      {label}
      <span className={clsx(
        'text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md font-mono',
        active ? 'bg-current/10' : 'bg-cyber-border/30 text-cyber-text-muted/50'
      )}>
        {count}
      </span>
      {active && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-current rounded-full shadow-[0_0_8px_currentColor]" />}
    </button>
  )
}
