import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import {
  User, MessageCircle,
  CalendarClock, DollarSign, BadgeCheck, PieChart, BarChart3,
  Trophy, TrendingUp, Activity, Crown, Sparkles,
} from 'lucide-react'
import { HoloStat } from '@/shared/ui/HoloStat'
import { StreamRank } from '@/shared/ui/StreamRank'
import { CodeRain } from '@/shared/ui/CodeRain'
import { useUserStore } from '@/features/checker/store/userStore'

const EXTRA_BASES = [
  { label: 'BIN Pool', value: '527601, 492937, 453201', color: 'text-cyber-blue' },
  { label: 'Proxy List', value: '24 active · 12 dead', color: 'text-cyber-green' },
  { label: 'User Agents', value: '142 freshly scraped', color: 'text-cyber-purple' },
  { label: 'DNS Records', value: '36 resolved', color: 'text-cyber-yellow' },
]

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return String(n)
}

export function OverviewPage() {
  const { profile, myStats, globalStats, rankers } = useUserStore()
  const [currentTip, setCurrentTip] = useState(0)
  const tips = ['Use proxies to avoid rate limits', 'Rotate user agents every 10 requests', 'Check BIN before running gates', 'Keep your API keys secure']

  useEffect(() => {
    const interval = setInterval(() => setCurrentTip(p => (p + 1) % tips.length), 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-[calc(100vh-4rem)] -m-5 sm:-m-6">
      {/* Fondo del hacker para todo el Overview */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/noface-hero.png)' }}
      />
      <div className="absolute inset-0 bg-cyber-black/88" />
      {/* Lluvia de código tipo hack cayendo detrás */}
      <CodeRain color="#00ff88" opacity={0.4} fontSize={15} />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black/55 via-cyber-black/70 to-cyber-black/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(157,0,255,0.1),transparent_60%)] pointer-events-none" />

      {/* Contenido */}
      <div className="relative px-5 sm:px-6 py-6">
        <div className="max-w-[1200px] mx-auto space-y-5">
      {/* Hero banner */}
      <section className="relative h-40 sm:h-52 rounded-xl overflow-hidden border border-cyber-purple/30 shadow-[0_0_30px_rgba(157,0,255,0.15)]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/noface-hero.png)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-black/50 via-cyber-black/30 to-cyber-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(157,0,255,0.12),transparent_60%)]" />
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-cyber-blue/80 mb-1">
            Welcome back, {profile.username}
          </p>
          <h1 className="text-2xl sm:text-3xl font-orbitron font-bold tracking-wide bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(157,0,255,0.4)]">
            NO FACE CHECKER
          </h1>
          <p className="text-xs text-cyber-text-muted mt-2 max-w-sm">
            Stay anonymous. Run gates, generate cards and check intel from one console.
          </p>
        </div>
      </section>

      {/* Extra Base Aleatorio */}
      <section className="relative rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-5 py-4">
        <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-cyber-purple" />
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-cyber-purple" />
          <h2 className="text-sm font-semibold text-cyber-text">Extra Base Aleatorio</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {EXTRA_BASES.map((item, i) => (
            <div key={i} className="bg-cyber-black/60 border border-cyber-border/40 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-cyber-text-muted mb-1">{item.label}</p>
              <p className={clsx('text-xs font-mono font-medium', item.color)}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Profile stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ProfileCard icon={<User size={20} />} iconBg="bg-blue-600/80"
          value={profile.username} label="Username" />
        <ProfileCard icon={<MessageCircle size={20} />} iconBg="bg-green-600/80"
          value={profile.telegramId} label="Telegram ID" />
        <ProfileCard icon={<CalendarClock size={20} />} iconBg="bg-orange-600/80"
          value={profile.registeredOn} label="Registered On" />
        <ProfileCard icon={<DollarSign size={20} />} iconBg="bg-purple-600/80"
          value={String(profile.credits)} label="Credits" />
      </section>

      {/* Quick Stats Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickStat icon={<TrendingUp size={18} />} label="Total Checked" value={fmtCompact(myStats.lives + myStats.dead + myStats.unknown)} color="text-cyber-blue" />
        <QuickStat icon={<Activity size={18} />} label="Success Rate" value={`${((myStats.lives / (myStats.lives + myStats.dead + myStats.unknown)) * 100).toFixed(1)}%`} color="text-cyber-green" />
        <QuickStat icon={<Trophy size={18} />} label="Your Rank" value="#12" color="text-cyber-yellow" />
        <QuickStat icon={<Crown size={18} />} label="Lives Today" value="47" color="text-cyber-purple" />
      </section>

      {/* Achievements */}
      <section className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-5 py-5">
        <div className="flex items-center gap-2 mb-5">
          <BadgeCheck size={18} className="text-cyber-green" />
          <h2 className="text-sm font-semibold text-cyber-text">Your Achievements (Lives)</h2>
        </div>
        <div className="flex items-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <span className="w-7 h-7 rounded-full bg-cyber-green/20 border border-cyber-green flex items-center justify-center shrink-0">
                <BadgeCheck size={15} className="text-cyber-green" />
              </span>
              {i < 5 && <span className="flex-1 h-0.5 bg-cyber-green/60 mx-1" />}
            </div>
          ))}
        </div>
      </section>

      {/* System Monitor */}
      <section className="flex flex-col gap-5">
        <ChartCard icon={<PieChart size={18} className="text-cyber-green" />} title="Global Statistics">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3">
            <HoloStat label="Total Checks" value={fmtCompact(globalStats.dead + globalStats.lives + globalStats.unknown)} accent="#22c55e" />
            <HoloStat label="Lives" value={fmtCompact(globalStats.lives)} sublabel={`${((globalStats.lives / (globalStats.dead + globalStats.lives + globalStats.unknown)) * 100).toFixed(1)}%`} accent="#3b82f6" />
            <HoloStat label="Dead" value={fmtCompact(globalStats.dead)} accent="#ef4444" />
            <HoloStat label="Unknown" value={fmtCompact(globalStats.unknown)} accent="#a855f7" />
          </div>
        </ChartCard>

        <ChartCard icon={<PieChart size={18} className="text-cyber-blue" />} title="Your Statistics">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3">
            <HoloStat label="Your Checks" value={fmtCompact(myStats.dead + myStats.lives + myStats.unknown)} accent="#3b82f6" />
            <HoloStat label="Your Lives" value={fmtCompact(myStats.lives)} sublabel={`${((myStats.lives / (myStats.dead + myStats.lives + myStats.unknown)) * 100).toFixed(1)}%`} accent="#22c55e" />
            <HoloStat label="Your Dead" value={fmtCompact(myStats.dead)} accent="#ef4444" />
            <HoloStat label="Your Unknown" value={fmtCompact(myStats.unknown)} accent="#a855f7" />
          </div>
        </ChartCard>

        <ChartCard icon={<BarChart3 size={18} className="text-cyber-green" />} title="Top Rankers">
          <div className="px-2 py-3">
            <StreamRank data={rankers} />
          </div>
        </ChartCard>
      </section>
        </div>
      </div>
    </div>
  )
}

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
      <span className={clsx('w-10 h-10 rounded-md flex items-center justify-center bg-cyber-dark', color)}>
        {icon}
      </span>
      <div>
        <p className="text-lg font-bold text-cyber-text">{value}</p>
        <p className="text-xs text-cyber-text-muted">{label}</p>
      </div>
    </div>
  )
}

function ProfileCard({
  icon, iconBg, value, label,
}: { icon: React.ReactNode; iconBg: string; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4 flex items-center gap-3">
      <span className={clsx('w-11 h-11 rounded-md flex items-center justify-center text-white shrink-0', iconBg)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-base font-semibold text-cyber-text truncate">{value}</p>
        <p className="text-xs text-cyber-text-muted">{label}</p>
      </div>
    </div>
  )
}

function ChartCard({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-sm font-semibold text-cyber-text">{title}</h2>
      </div>
      {children}
    </div>
  )
}
