import { useState } from 'react'
import { clsx } from 'clsx'
import {
  CreditCard, ThumbsUp, ThumbsDown, User, MessageCircle,
  CalendarClock, DollarSign, BadgeCheck, PieChart, BarChart3,
  Trophy, TrendingUp, Activity, Crown,
} from 'lucide-react'
import { DonutChart } from '@/shared/ui/DonutChart'
import { BarChart } from '@/shared/ui/BarChart'
import { CodeRain } from '@/shared/ui/CodeRain'
import { useUserStore } from '@/features/checker/store/userStore'

const DROPPER_CARDS = [
  { num: '5276015007382801|10|2030|844', tag: 'CREDIT', cc: 'AR', active: true, likes: 12, dislikes: 2 },
  { num: '2630328107120291722', tag: 'CREDIT', cc: 'US', active: false, likes: 8, dislikes: 1 },
  { num: '5168414018707745103120291543', tag: 'DEBIT', cc: 'TR', active: false, likes: 5, dislikes: 3 },
  { num: '5218532722700464111120', tag: '', cc: '', active: false, likes: 2, dislikes: 0 },
]

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`
  return String(n)
}

export function OverviewPage() {
  const { profile, myStats, globalStats, rankers } = useUserStore()
  const [votes, setVotes] = useState(DROPPER_CARDS.map(c => ({ likes: c.likes, dislikes: c.dislikes, userVote: null as 'like' | 'dislike' | null })))

  const handleVote = (index: number, type: 'like' | 'dislike') => {
    setVotes(prev => prev.map((v, i) => {
      if (i !== index) return v
      if (v.userVote === type) {
        return { ...v, [type === 'like' ? 'likes' : 'dislikes']: v[type === 'like' ? 'likes' : 'dislikes'] - 1, userVote: null }
      }
      const updated = { ...v }
      if (v.userVote === 'like') updated.likes--
      if (v.userVote === 'dislike') updated.dislikes--
      updated[type === 'like' ? 'likes' : 'dislikes']++
      updated.userVote = type
      return updated
    }))
  }

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
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-black via-cyber-black/70 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(255,0,64,0.18),transparent_55%)]" />
        <div className="relative h-full flex flex-col justify-center pl-7 pr-4 max-w-[60%]">
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

      {/* Card From Dropper with Voting */}
      <section className="relative rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm pl-5 pr-4 py-4">
        <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-cyber-green" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <CreditCard size={18} className="text-cyber-text-muted" />
              <h2 className="text-sm font-semibold text-cyber-text">Card From Dropper</h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[13px]">
              {DROPPER_CARDS.map((c, i) => (
                <span key={i} className={clsx('flex items-center gap-1.5', c.active ? 'text-cyber-text' : 'text-cyber-text-muted/50')}>
                  {c.num}
                  {c.tag && <span className="text-[11px]">- {c.tag}</span>}
                  {c.cc && <span className="text-[10px] uppercase opacity-70">{c.cc}</span>}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {DROPPER_CARDS.map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <button
                  onClick={() => handleVote(i, 'like')}
                  className={clsx(
                    'w-8 h-8 rounded-md border flex items-center justify-center transition-all',
                    votes[i].userVote === 'like'
                      ? 'bg-cyber-green/20 border-cyber-green text-cyber-green'
                      : 'bg-cyber-dark border-cyber-border text-cyber-text-muted hover:text-cyber-green'
                  )}
                >
                  <ThumbsUp size={13} />
                </button>
                <span className="text-[10px] text-cyber-text-muted w-4 text-center">{votes[i].likes}</span>
                <button
                  onClick={() => handleVote(i, 'dislike')}
                  className={clsx(
                    'w-8 h-8 rounded-md border flex items-center justify-center transition-all',
                    votes[i].userVote === 'dislike'
                      ? 'bg-cyber-red/20 border-cyber-red text-cyber-red'
                      : 'bg-cyber-dark border-cyber-border text-cyber-text-muted hover:text-cyber-red'
                  )}
                >
                  <ThumbsDown size={13} />
                </button>
                <span className="text-[10px] text-cyber-text-muted w-4 text-center">{votes[i].dislikes}</span>
              </div>
            ))}
          </div>
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

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartCard icon={<PieChart size={18} className="text-cyber-green" />} title="Global Statistics">
          <div className="flex justify-center py-4">
            <DonutChart
              segments={[
                { value: globalStats.dead, color: 'var(--color-cyber-red)' },
                { value: globalStats.lives, color: 'var(--color-cyber-green)' },
                { value: globalStats.unknown, color: 'var(--color-cyber-blue)' },
              ]}
              topLabel={fmtCompact(globalStats.dead)}
              bottomLabel={fmtCompact(globalStats.unknown)}
              rightLabel={fmtCompact(globalStats.lives)}
              size={220}
            />
          </div>
        </ChartCard>

        <ChartCard icon={<PieChart size={18} className="text-cyber-blue" />} title="Your Statistics">
          <div className="flex justify-center py-4">
            <DonutChart
              segments={[
                { value: myStats.dead, color: 'var(--color-cyber-red)' },
                { value: myStats.lives, color: 'var(--color-cyber-green)' },
                { value: myStats.unknown, color: 'var(--color-cyber-blue)' },
              ]}
              topLabel={fmtCompact(myStats.dead)}
              bottomLabel={fmtCompact(myStats.unknown)}
              rightLabel={fmtCompact(myStats.lives)}
              size={220}
            />
          </div>
        </ChartCard>

        <ChartCard icon={<BarChart3 size={18} className="text-cyber-green" />} title="Top Rankers">
          <BarChart data={rankers} height={260} />
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
