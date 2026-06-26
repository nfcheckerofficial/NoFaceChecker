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
  /** Estadísticas del usuario (sesión). */
  myStats: SessionStats
  /** Estadísticas globales (mock). */
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
    set({ profile: { ...profile, credits: profile.credits - n } })
    return true
  },

  addCredits: (n) =>
    set((s) => ({ profile: { ...s.profile, credits: s.profile.credits + n } })),
}))
