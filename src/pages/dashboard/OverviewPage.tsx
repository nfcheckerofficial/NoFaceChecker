import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { useShallow } from 'zustand/react/shallow'
import {
  BarChart3, Trophy, TrendingUp, Activity, Crown, Terminal,
  Search, Zap, Database, Clock, ArrowRight,
  CheckCircle, XCircle, Loader, History, Gauge,
} from 'lucide-react'
import { StreamRank } from '@/shared/ui/StreamRank'
import { Section, Grid, Card, Divider } from '@/shared/ui/Section'
import { useUserStore } from '@/features/checker/store/userStore'
import { useCheckerStore } from '@/features/checker/store/checkerStore'
import { useLivesStore } from '@/features/checker/store/livesStore'

const QUICK_ACTIONS = [
  { label: 'Card Checker', icon: Terminal, href: '/dashboard', color: 'text-cyber-blue', desc: 'Verify single cards' },
  { label: 'Generator', icon: Zap, href: '/dashboard/generator', color: 'text-cyber-yellow', desc: 'Generate valid cards' },
  { label: 'BIN Lookup', icon: Search, href: '/dashboard/bin-lookup', color: 'text-cyber-purple', desc: 'Search BIN database' },
  { label: 'Bulk Checker', icon: Database, href: '/checker/bulk', color: 'text-cyber-green', desc: 'Mass verification' },
]

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return String(n)
}

export function OverviewPage() {
  const { profile, myStats, globalStats, rankers, fetchStats } = useUserStore(useShallow((s) => ({
    profile: s.profile,
    myStats: s.myStats,
    globalStats: s.globalStats,
    rankers: s.rankers,
    fetchStats: s.fetchStats,
  })))
  const history = useCheckerStore((s) => s.history)
  const lives = useLivesStore((s) => s.lives)
  const [currentTip, setCurrentTip] = useState(0)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const tips = ['Use proxies to avoid rate limits', 'Rotate user agents every 10 requests', 'Check BIN before running gates', 'Keep your API keys secure']

  const sessionLives = useRef(0)
  const sessionTotal = useRef(0)
  const sessionStarted = useRef(Date.now())
  const prevHistoryLen = useRef(history.length)

  useEffect(() => {
    if (history.length > prevHistoryLen.current) {
      const newCount = history.length - prevHistoryLen.current
      sessionTotal.current += newCount
      for (let i = prevHistoryLen.current; i < history.length; i++) {
        if (history[i].status === 'live') sessionLives.current++
      }
      prevHistoryLen.current = history.length
    }
  }, [history])

  const gatePerf = useMemo(() => {
    const map = new Map<string, { live: number; dead: number; unknown: number }>()
    for (const h of history) {
      const g = h.gateName || 'Unknown'
      if (!map.has(g)) map.set(g, { live: 0, dead: 0, unknown: 0 })
      const entry = map.get(g)!
      if (h.status === 'live') entry.live++
      else if (h.message === 'UNKNOWN') entry.unknown++
      else entry.dead++
    }
    return Array.from(map.entries()).map(([name, vals]) => ({
      name,
      ...vals,
      total: vals.live + vals.dead + vals.unknown,
      rate: vals.live + vals.dead + vals.unknown > 0 ? (vals.live / (vals.live + vals.dead + vals.unknown)) * 100 : 0,
    })).sort((a, b) => b.rate - a.rate)
  }, [history])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => setCurrentTip(p => (p + 1) % tips.length), 6000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_PAYMENTS_API ?? ''}/api/stats/global`, { signal: AbortSignal.timeout(5000) })
        setApiStatus(res.ok ? 'online' : 'offline')
      } catch { setApiStatus('offline') }
    }
    check()
  }, [])

  const chartData = [
    { label: 'Lives', value: myStats.lives },
    { label: 'Dead', value: myStats.dead },
    { label: 'Unknown', value: myStats.unknown },
  ]

  const recentActivity = history.slice(0, 8)

  return (
    <div className="relative min-h-[calc(100vh_-_4rem)] -m-3 sm:-m-6">
      <div className="relative px-3 sm:px-6 py-6">
        <div className="max-w-[1200px] mx-auto space-y-4">
      {/* Hero banner */}
      <section className="relative h-36 sm:h-44 rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-cyber-purple/[0.08] via-cyber-blue/[0.04] to-transparent">
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-black/60 via-cyber-black/30 to-cyber-black/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(157,0,255,0.1),transparent_60%)]" />
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[10px] text-cyber-text-muted/60 uppercase tracking-[0.2em] mb-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green motion-safe:animate-pulse" />
            SESSION ACTIVE
          </div>
          <h1 className="text-xl sm:text-3xl font-orbitron font-bold tracking-wide bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(157,0,255,0.3)]">
            NO FACE CHECKER
          </h1>
          <p className="text-xs text-cyber-text-muted/60 mt-1.5 max-w-sm">
            Stay anonymous. Run gates, generate cards and check intel from one console.
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map((action, i) => (
          <Link
            key={i}
            to={action.href}
            className="group relative rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm px-4 py-4 hover:bg-white/[0.04] hover:border-cyber-red/30 transition-all duration-300 active:scale-[0.97]"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={clsx('w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.04]', action.color)}>
                <action.icon size={18} />
              </span>
              <ArrowRight size={14} className="text-cyber-text-muted/30 group-hover:text-cyber-red group-hover:translate-x-0.5 transition-all ml-auto" />
            </div>
            <p className="text-sm font-semibold text-cyber-text/90 group-hover:text-cyber-red transition-colors">{action.label}</p>
            <p className="text-[11px] text-cyber-text-muted/60 mt-0.5">{action.desc}</p>
          </Link>
        ))}
      </section>

      {/* Stats overview */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<TrendingUp size={16} />} label="Total Checked" value={fmtCompact(myStats.lives + myStats.dead + myStats.unknown)} accent="from-cyber-blue/20 to-cyber-blue/5" valueClass="text-cyber-blue" />
        <StatCard icon={<Activity size={16} />} label="Success Rate" value={myStats.lives + myStats.dead + myStats.unknown > 0 ? `${((myStats.lives / (myStats.lives + myStats.dead + myStats.unknown)) * 100).toFixed(1)}%` : '0%'} accent="from-cyber-green/20 to-cyber-green/5" valueClass="text-cyber-green" />
        <StatCard icon={<Trophy size={16} />} label="Your Rank" value={rankers.findIndex(r => r.label === profile.username) >= 0 ? `#${rankers.findIndex(r => r.label === profile.username) + 1}` : '-'} accent="from-cyber-yellow/20 to-cyber-yellow/5" valueClass="text-cyber-yellow" />
        <StatCard icon={<Crown size={16} />} label="Lives" value={fmtCompact(myStats.lives)} accent="from-cyber-purple/20 to-cyber-purple/5" valueClass="text-cyber-purple" />
      </section>

      {/* Session Stats + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Gauge size={15} className="text-cyber-blue" />
            <h2 className="text-sm font-semibold text-cyber-text/90">This Session</h2>
            <span className="text-[10px] text-cyber-text-muted/50 ml-auto font-mono">
              {new Date(sessionStarted.current).toLocaleTimeString()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-cyber-text/90">{sessionTotal.current}</p>
              <p className="text-[10px] text-cyber-text-muted/60 mt-0.5 font-mono">Checks</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-cyber-green">{sessionLives.current}</p>
              <p className="text-[10px] text-cyber-text-muted/60 mt-0.5 font-mono">Lives</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-cyber-text/90">{lives.length}</p>
              <p className="text-[10px] text-cyber-text-muted/60 mt-0.5 font-mono">In vault</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm px-5 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-cyber-green" />
            <h2 className="text-sm font-semibold text-cyber-text/90">System Status</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatusBadge label="API Server" status={apiStatus} />
            <StatusBadge label="Database" status="online" />
            <StatusBadge label="Gates" status="online" />
            <StatusBadge label="WebSocket" status="online" />
          </div>
        </section>
      </div>

      {/* System Monitor */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={<BarChart3 size={16} className="text-cyber-blue" />} title="Gate Performance (Live Rate)">
          {gatePerf.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-cyber-text-muted/60">No gate data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gatePerf.slice(0, 8).map(g => (
                <div key={g.name} className="flex items-center gap-3">
                  <span className="text-[11px] text-cyber-text-muted/70 w-24 truncate shrink-0 font-mono" title={g.name}>{g.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    {g.total > 0 && (
                      <>
                        <div className="h-full bg-cyber-green float-left transition-all" style={{ width: `${(g.live / g.total) * 100}%` }} />
                        <div className="h-full bg-cyber-red float-left transition-all" style={{ width: `${(g.dead / g.total) * 100}%` }} />
                        <div className="h-full bg-cyber-yellow/60 float-left transition-all" style={{ width: `${(g.unknown / g.total) * 100}%` }} />
                      </>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-cyber-text-muted/70 w-10 text-right">{g.rate.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard icon={<History size={16} className="text-cyber-yellow" />} title="Recent Activity">
          {recentActivity.length === 0 ? (
            <div className="text-center py-6">
              <Clock size={20} className="text-cyber-text-muted/30 mx-auto mb-2" />
              <p className="text-xs text-cyber-text-muted/60">No checks performed yet in this session</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {recentActivity.map((result, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                    <div className="flex items-center gap-2.5">
                      <span className={clsx(
                        'w-2 h-2 rounded-full',
                        result.status === 'live' ? 'bg-cyber-green shadow-[0_0_6px_rgba(0,255,136,0.6)]' : result.message === 'UNKNOWN' ? 'bg-cyber-yellow shadow-[0_0_6px_rgba(255,200,0,0.6)]' : 'bg-cyber-red shadow-[0_0_6px_rgba(255,0,64,0.6)]'
                      )} />
                      <span className="text-[11px] font-mono text-cyber-text-muted/80">
                        ****{result.cardNumber.slice(-7)}
                      </span>
                    </div>
                    <span className={clsx(
                      'text-[10px] font-bold uppercase tracking-wider font-mono',
                      result.status === 'live' ? 'text-cyber-green' : result.message === 'UNKNOWN' ? 'text-cyber-yellow' : 'text-cyber-red'
                    )}>
                      {result.message === 'UNKNOWN' ? 'UNKNOWN' : result.status}
                    </span>
                  </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard icon={<BarChart3 size={16} className="text-cyber-green" />} title="Top Rankers">
          <StreamRank data={rankers} />
        </ChartCard>

        <ChartCard icon={<BarChart3 size={16} className="text-cyber-blue" />} title="Global Statistics">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Checks" value={fmtCompact(globalStats.dead + globalStats.lives + globalStats.unknown)} color="text-cyber-blue" />
            <MiniStat label="Lives" value={fmtCompact(globalStats.lives)} color="text-cyber-green" sub={globalStats.dead + globalStats.lives + globalStats.unknown > 0 ? `${((globalStats.lives / (globalStats.dead + globalStats.lives + globalStats.unknown)) * 100).toFixed(1)}%` : '0%'} />
            <MiniStat label="Dead" value={fmtCompact(globalStats.dead)} color="text-cyber-red" />
            <MiniStat label="Unknown" value={fmtCompact(globalStats.unknown)} color="text-cyber-purple" />
          </div>
        </ChartCard>

        <ChartCard icon={<BarChart3 size={16} className="text-cyber-blue" />} title="Your Statistics">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Checks" value={fmtCompact(myStats.dead + myStats.lives + myStats.unknown)} color="text-cyber-blue" />
            <MiniStat label="Lives" value={fmtCompact(myStats.lives)} color="text-cyber-green" sub={`${((myStats.lives / (myStats.dead + myStats.lives + myStats.unknown)) * 100).toFixed(1)}%`} />
            <MiniStat label="Dead" value={fmtCompact(myStats.dead)} color="text-cyber-red" />
            <MiniStat label="Unknown" value={fmtCompact(myStats.unknown)} color="text-cyber-purple" />
          </div>
        </ChartCard>
      </section>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent, valueClass }: { icon: React.ReactNode; label: string; value: string; accent: string; valueClass: string }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm px-4 py-4 flex items-center gap-3 hover:bg-white/[0.03] transition-all duration-300">
      <span className={clsx('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0', accent)}>
        {icon}
      </span>
      <div>
        <p className={clsx('text-lg font-bold', valueClass)}>{value}</p>
        <p className="text-xs text-cyber-text-muted/70">{label}</p>
      </div>
    </div>
  )
}

function ChartCard({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-semibold text-cyber-text/90">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function StatusBadge({ label, status }: { label: string; status: 'checking' | 'online' | 'offline' }) {
  const icon = status === 'checking' ? <Loader size={11} className="animate-spin" /> : status === 'online' ? <CheckCircle size={11} /> : <XCircle size={11} />
  const color = status === 'checking' ? 'text-cyber-yellow border-cyber-yellow/20 bg-cyber-yellow/5' : status === 'online' ? 'text-cyber-green border-cyber-green/20 bg-cyber-green/5' : 'text-cyber-red border-cyber-red/20 bg-cyber-red/5'
  return (
    <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-mono', color)}>
      {icon}
      <span className="font-medium">{label}</span>
      <span className="ml-auto opacity-60">{status === 'checking' ? '...' : status === 'online' ? 'Active' : 'Down'}</span>
    </div>
  )
}

function MiniStat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
      <p className={clsx('text-lg font-bold', color)}>{value}</p>
      <p className="text-[11px] text-cyber-text-muted/60 mt-0.5 font-mono">
        {label}{sub ? <span className="ml-2 text-cyber-text-muted/40">({sub})</span> : null}
      </p>
    </div>
  )
}
