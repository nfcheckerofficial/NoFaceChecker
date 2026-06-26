import { create } from 'zustand'
import { useAuthStore } from '@/features/auth/authStore'

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''
const SERVER_URL = API_BASE || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:4242`

export interface UserProfile {
  username: string
  telegramId: string
  registeredOn: string
  credits: number
}

export interface SessionStats {
  lives: number
  dead: number
  unknown: number
}

interface UserState {
  profile: UserProfile
  myStats: SessionStats
  globalStats: SessionStats
  rankers: { label: string; value: number }[]

  setProfile: (patch: Partial<UserProfile>) => void
  addLives: (n?: number) => void
  recordResult: (status: 'live' | 'dead' | 'unknown') => Promise<void>
  spendCredits: (n: number) => boolean
  addCredits: (n: number) => void
  syncFromAuth: (user: { id: number; username: string; credits: number; role: string; telegram_id: string | null; created_at: string }) => void
  fetchStats: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: {
    username: '',
    telegramId: '',
    registeredOn: '',
    credits: 0,
  },
  myStats: { lives: 0, dead: 0, unknown: 0 },
  globalStats: { lives: 0, dead: 0, unknown: 0 },
  rankers: [],

  setProfile: (patch) =>
    set((s) => ({ profile: { ...s.profile, ...patch } })),

  addLives: (n = 1) =>
    set((s) => ({ myStats: { ...s.myStats, lives: s.myStats.lives + n } })),

  recordResult: async (status) => {
    const token = useAuthStore.getState().token
    if (token) {
      try {
        const res = await fetch(`${SERVER_URL}/api/stats/record`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status }),
        })
        if (res.ok) {
          const data = await res.json()
          set({ myStats: data.stats })
          return
        }
      } catch {}
    }
    set((s) => ({
      myStats: {
        lives: s.myStats.lives + (status === 'live' ? 1 : 0),
        dead: s.myStats.dead + (status === 'dead' ? 1 : 0),
        unknown: s.myStats.unknown + (status === 'unknown' ? 1 : 0),
      },
    }))
  },

  fetchStats: async () => {
    const token = useAuthStore.getState().token
    if (!token) return
    try {
      const [meRes, globalRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/stats/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${SERVER_URL}/api/stats/global`),
      ])
      if (meRes.ok) {
        const me = await meRes.json()
        set({ myStats: { lives: me.checks_live, dead: me.checks_dead, unknown: me.checks_unknown } })
      }
      if (globalRes.ok) {
        const global = await globalRes.json()
        set({
          globalStats: { lives: global.checks_live, dead: global.checks_dead, unknown: global.checks_unknown },
          rankers: (global.rankers || []).map((r: { username: string; value: number }) => ({ label: r.username, value: r.value })),
        })
      }
    } catch {}
  },

  spendCredits: (n) => {
    const { profile } = get()
    if (profile.credits < n) return false
    const credits = profile.credits - n
    set({ profile: { ...profile, credits } })
    syncAdminCredits(profile.username, credits)
    persistCredits(credits)
    return true
  },

  addCredits: (n) => {
    const { profile } = get()
    const credits = profile.credits + n
    set({ profile: { ...profile, credits } })
    syncAdminCredits(profile.username, credits)
    persistCredits(credits)
  },

  syncFromAuth: (user) => {
    set({
      profile: {
        username: user.username,
        telegramId: user.telegram_id || '',
        registeredOn: user.created_at ? user.created_at.split('T')[0] : '',
        credits: user.credits,
      },
    })
    get().fetchStats()
  },
}))

function syncAdminCredits(username: string, credits: number) {
  import('@/features/admin/adminStore').then((mod) => {
    const user = mod.useAdminStore.getState().users.find((x) => x.username === username)
    if (user) mod.useAdminStore.getState().updateUser(user.id, { credits })
  })
}

async function persistCredits(credits: number) {
  const token = useAuthStore.getState().token
  if (!token) return
  try {
    await fetch(`${SERVER_URL}/api/auth/credits`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ credits }),
    })
  } catch {}
}

