import { create } from 'zustand'

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
  recordResult: (status: 'live' | 'dead' | 'unknown') => void
  spendCredits: (n: number) => boolean
  addCredits: (n: number) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: {
    username: 'kikolaquema24',
    telegramId: '1766132134',
    registeredOn: '06-05-2024',
    credits: 827,
  },
  myStats: { lives: 1400, dead: 32000, unknown: 1400 },
  globalStats: { lives: 2_800_000, dead: 84_000_000, unknown: 87_000_000 },
  rankers: [
    { label: 'jatin029', value: 11000 },
    { label: 'Thejacker', value: 10400 },
    { label: 'M3LECI0', value: 9300 },
    { label: 'Hector32', value: 8900 },
    { label: 'Cialbon', value: 8700 },
  ],

  setProfile: (patch) =>
    set((s) => ({ profile: { ...s.profile, ...patch } })),

  addLives: (n = 1) =>
    set((s) => ({ myStats: { ...s.myStats, lives: s.myStats.lives + n } })),

  recordResult: (status) =>
    set((s) => ({
      myStats: {
        lives: s.myStats.lives + (status === 'live' ? 1 : 0),
        dead: s.myStats.dead + (status === 'dead' ? 1 : 0),
        unknown: s.myStats.unknown + (status === 'unknown' ? 1 : 0),
      },
    })),

  spendCredits: (n) => {
    const { profile } = get()
    if (profile.credits < n) return false
    const credits = profile.credits - n
    set({ profile: { ...profile, credits } })
    syncAdminCredits(profile.username, credits)
    return true
  },

  addCredits: (n) => {
    const { profile } = get()
    const credits = profile.credits + n
    set({ profile: { ...profile, credits } })
      syncAdminCredits(profile.username, credits)
  },
}))

// On first import, sync initial credits from adminStore
const u = useUserStore.getState().profile
syncAdminCredits(u.username, u.credits)

let _adminSync: ((u: string, c: number) => void) | null = null

function syncAdminCredits(username: string, credits: number) {
  if (_adminSync) {
    _adminSync(username, credits)
    return
  }
  import('@/features/admin/adminStore').then((mod) => {
    _adminSync = (u, c) => {
      const user = mod.useAdminStore.getState().users.find((x) => x.username === u)
      if (user) mod.useAdminStore.getState().updateUser(user.id, { credits: c })
    }
    _adminSync(username, credits)
  })
}
