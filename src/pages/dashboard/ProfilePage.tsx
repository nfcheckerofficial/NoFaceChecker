import { useMemo, useState } from 'react'
import {
  ShieldCheck, User, Hash, CalendarDays, Wallet, Check, Pencil, X,
  Activity, Skull, HelpCircle, Copy,
} from 'lucide-react'
import { clsx } from 'clsx'
import { GateShell } from '@/widgets/GateShell/GateShell'
import { useUserStore } from '@/features/checker/store/userStore'
import { useLivesStore } from '@/features/checker/store/livesStore'

export function ProfilePage() {
  const { profile, myStats, setProfile } = useUserStore()
  const lives = useLivesStore((s) => s.lives)

  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile.username)
  const [telegramId, setTelegramId] = useState(profile.telegramId)
  const [copied, setCopied] = useState(false)

  const total = myStats.lives + myStats.dead + myStats.unknown
  const hitRate = total > 0 ? ((myStats.lives / total) * 100).toFixed(2) : '0.00'

  const initials = useMemo(
    () => profile.username.slice(0, 2).toUpperCase(),
    [profile.username]
  )

  const save = () => {
    setProfile({ username: username.trim() || profile.username, telegramId: telegramId.trim() })
    setEditing(false)
  }

  const cancel = () => {
    setUsername(profile.username)
    setTelegramId(profile.telegramId)
    setEditing(false)
  }

  const copyId = async () => {
    await navigator.clipboard.writeText(profile.telegramId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <GateShell title="Your Profile" subtitle="Account & session details">
      <div className="max-w-[900px] mx-auto space-y-5">
        {/* Identity card */}
        <div className="rounded-xl border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <span className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyber-purple/30 to-cyber-red/30 border border-cyber-border flex items-center justify-center text-2xl font-orbitron font-bold text-cyber-text shrink-0">
              {initials}
            </span>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-cyber-text-muted mb-1">Username</label>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-cyber-dark border border-cyber-border rounded-md text-cyber-text focus:border-cyber-purple focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-cyber-text-muted mb-1">Telegram ID</label>
                    <input
                      value={telegramId}
                      onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ''))}
                      inputMode="numeric"
                      className="w-full px-3 py-2 text-sm font-mono bg-cyber-dark border border-cyber-border rounded-md text-cyber-text focus:border-cyber-purple focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-orbitron font-bold text-cyber-text truncate">{profile.username}</h2>
                  <p className="text-sm text-cyber-text-muted mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-cyber-green" /> Verified operator
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {editing ? (
                <>
                  <button onClick={save}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyber-green/80 text-cyber-black text-sm font-semibold hover:bg-cyber-green transition-colors">
                    <Check size={15} /> Save
                  </button>
                  <button onClick={cancel}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyber-border text-cyber-text-muted hover:text-cyber-text text-sm transition-colors">
                    <X size={15} /> Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-cyber-border text-cyber-text-muted hover:text-cyber-text text-sm transition-colors">
                  <Pencil size={14} /> Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Account details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow icon={<User size={16} />} label="Username" value={profile.username} />
          <div className="flex items-start gap-3 rounded-lg border border-cyber-border bg-cyber-panel/50 px-4 py-3.5">
            <span className="text-cyber-text-muted mt-0.5"><Hash size={16} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-cyber-text-muted">Telegram ID</p>
              <p className="text-sm font-mono text-cyber-text truncate">{profile.telegramId}</p>
            </div>
            <button onClick={copyId} title="Copy ID"
              className="text-cyber-text-muted hover:text-cyber-text transition-colors">
              {copied ? <Check size={14} className="text-cyber-green" /> : <Copy size={14} />}
            </button>
          </div>
          <DetailRow icon={<CalendarDays size={16} />} label="Registered on" value={profile.registeredOn} />
          <DetailRow icon={<Wallet size={16} />} label="Credits"
            value={profile.credits.toLocaleString()} valueClass="text-cyber-green font-semibold" />
        </div>

        {/* Session stats */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-cyber-text-muted mb-3">Session stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile icon={<Check size={18} />} label="Lives" value={myStats.lives.toLocaleString()}
              tone="text-cyber-green" />
            <StatTile icon={<Skull size={18} />} label="Dead" value={myStats.dead.toLocaleString()}
              tone="text-cyber-red" />
            <StatTile icon={<HelpCircle size={18} />} label="Unknown" value={myStats.unknown.toLocaleString()}
              tone="text-cyber-yellow" />
            <StatTile icon={<Activity size={18} />} label="Hit rate" value={`${hitRate}%`}
              tone="text-cyber-blue" />
          </div>
        </div>

        <p className="text-[11px] text-cyber-text-muted/70">
          Captured live cards in your vault: <span className="text-cyber-text">{lives.length}</span>
        </p>
      </div>
    </GateShell>
  )
}

function DetailRow({ icon, label, value, valueClass }: {
  icon: React.ReactNode; label: string; value: string; valueClass?: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-cyber-border bg-cyber-panel/50 px-4 py-3.5">
      <span className="text-cyber-text-muted mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-cyber-text-muted">{label}</p>
        <p className={clsx('text-sm text-cyber-text truncate', valueClass)}>{value}</p>
      </div>
    </div>
  )
}

function StatTile({ icon, label, value, tone }: {
  icon: React.ReactNode; label: string; value: string; tone: string
}) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/50 px-4 py-4 text-center">
      <span className={clsx('inline-flex mb-1.5', tone)}>{icon}</span>
      <p className={clsx('text-lg font-bold', tone)}>{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-cyber-text-muted mt-0.5">{label}</p>
    </div>
  )
}
