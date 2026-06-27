import { create } from 'zustand'
import { useUserStore } from '@/features/checker/store/userStore'
import { useAuthStore } from '@/features/auth/authStore'

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''
const SERVER_URL = API_BASE

export interface User {
  id: string
  username: string
  email: string
  credits: number
  role: 'admin' | 'user'
  telegram_id: string | null
  banned: boolean
  banReason?: string
  createdAt: string
  lastSession: string
}

export interface Gate {
  id: string
  name: string
  category: string
  endpoint: string
  status: 'active' | 'inactive' | 'maintenance'
  cost: number
  description: string
}

export interface Country {
  id: string
  name: string
  code: string
  endpoint: string
  active: boolean
}

let nextUserId = 100
let nextGateId = 100
let nextCountryId = 100

function syncUserCredits(username: string, credits: number) {
  const { profile, setProfile } = useUserStore.getState()
  if (profile.username === username) {
    setProfile({ credits })
  }
}

interface AdminState {
  users: User[]
  gates: Gate[]
  countries: Country[]

  fetchUsers: () => Promise<void>
  addUser: (u: Omit<User, 'id' | 'createdAt' | 'lastSession'>) => void
  updateUser: (id: string, patch: Partial<User>) => void
  deleteUser: (id: string) => void
  toggleBan: (id: string, reason?: string) => void
  addCredits: (id: string, amount: number) => void
  removeCredits: (id: string, amount: number) => Promise<boolean>
  resetAllCredits: () => Promise<boolean>

  addGate: (g: Omit<Gate, 'id'>) => void
  updateGate: (id: string, patch: Partial<Gate>) => void
  deleteGate: (id: string) => void

  addCountry: (c: Omit<Country, 'id'>) => void
  updateCountry: (id: string, patch: Partial<Country>) => void
  deleteCountry: (id: string) => void
  toggleCountry: (id: string) => void
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [
    { id: '1', username: 'kikolaquema24', email: 'kiko@example.com', credits: 827, role: 'admin', telegram_id: null, banned: false, createdAt: '2024-05-06', lastSession: '2024-12-20' },
    { id: '2', username: 'jatin029', email: 'jatin@example.com', credits: 15420, role: 'user', telegram_id: null, banned: false, createdAt: '2024-03-15', lastSession: '2024-12-19' },
    { id: '3', username: 'Thejacker', email: 'jacker@example.com', credits: 10400, role: 'user', telegram_id: null, banned: false, createdAt: '2024-02-20', lastSession: '2024-12-18' },
    { id: '4', username: 'M3LECI0', email: 'm3l@example.com', credits: 9300, role: 'user', telegram_id: null, banned: true, banReason: 'Spamming gates', createdAt: '2024-04-10', lastSession: '2024-11-30' },
    { id: '5', username: 'Hector32', email: 'hector@example.com', credits: 8900, role: 'user', telegram_id: null, banned: false, createdAt: '2024-01-25', lastSession: '2024-12-20' },
  ],
  gates: [
    { id: '1', name: 'Vice Gate', category: 'Stripe CCN', endpoint: '/api/gates/vice', status: 'active', cost: 5, description: 'High success rate Stripe checker' },
    { id: '2', name: 'Ocean Gate', category: 'Stripe CCN', endpoint: '/api/gates/ocean', status: 'active', cost: 8, description: 'Premium Stripe authentication' },
    { id: '3', name: 'Horus Gate', category: 'Charge', endpoint: '/api/gates/horus', status: 'active', cost: 10, description: 'PayPal charge verification' },
    { id: '4', name: 'Auth Gate', category: 'Stripe Auth', endpoint: '/api/gates/auth', status: 'maintenance', cost: 15, description: '3D Secure authentication' },
    { id: '5', name: 'AllBirds', category: 'Special', endpoint: '/api/gates/allbirds', status: 'inactive', cost: 20, description: 'Shopify special gate' },
  ],
  countries: [
    { id: '1', name: 'United States', code: 'US', endpoint: '/api/random/us', active: true },
    { id: '2', name: 'United Kingdom', code: 'GB', endpoint: '/api/random/gb', active: true },
    { id: '3', name: 'Germany', code: 'DE', endpoint: '/api/random/de', active: true },
    { id: '4', name: 'France', code: 'FR', endpoint: '/api/random/fr', active: false },
    { id: '5', name: 'Spain', code: 'ES', endpoint: '/api/random/es', active: true },
    { id: '6', name: 'Italy', code: 'IT', endpoint: '/api/random/it', active: true },
    { id: '7', name: 'Brazil', code: 'BR', endpoint: '/api/random/br', active: false },
    { id: '8', name: 'Japan', code: 'JP', endpoint: '/api/random/jp', active: true },
  ],

  fetchUsers: async () => {
    const token = useAuthStore.getState().token
    if (!token) { console.warn('[admin] No token for fetchUsers'); return }
    try {
      const url = `${SERVER_URL}/api/admin/users`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const users = await res.json()
        set({ users })
      } else {
        console.warn(`[admin] fetchUsers ${res.status}: ${res.statusText}`)
      }
    } catch (err) {
      console.error('[admin] fetchUsers error:', err)
    }
  },
  addUser: (u) => set((s) => ({
    users: [...s.users, { ...u, id: String(++nextUserId), createdAt: new Date().toISOString().split('T')[0], lastSession: 'Never' }],
  })),
  updateUser: (id, patch) => {
    const prev = get().users.find((u) => u.id === id)
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }))
    if (patch.credits !== undefined && prev) {
      syncUserCredits(prev.username, patch.credits)
    }
  },
  deleteUser: (id) => set((s) => ({
    users: s.users.filter((u) => u.id !== id),
  })),
  toggleBan: (id, reason) => set((s) => ({
    users: s.users.map((u) => (u.id === id ? { ...u, banned: !u.banned, banReason: u.banned ? undefined : (reason || 'No reason provided') } : u)),
  })),
  addCredits: async (id, amount) => {
    const user = get().users.find((u) => u.id === id)
    if (!user) return
    const newCredits = user.credits + amount
    const token = useAuthStore.getState().token
    try {
      await fetch(`${SERVER_URL}/api/admin/set-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: user.username, credits: newCredits }),
      })
    } catch {}
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, credits: newCredits } : u)) }))
    syncUserCredits(user.username, newCredits)
  },
  removeCredits: async (id, amount) => {
    const user = get().users.find((u) => u.id === id)
    if (!user || user.credits < amount) return false
    const newCredits = user.credits - amount
    const token = useAuthStore.getState().token
    try {
      await fetch(`${SERVER_URL}/api/admin/set-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: user.username, credits: newCredits }),
      })
    } catch {}
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, credits: newCredits } : u)) }))
    syncUserCredits(user.username, newCredits)
    return true
  },
  resetAllCredits: async () => {
    const token = useAuthStore.getState().token
    if (!token) return false
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/reset-credits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return false
      set((s) => ({ users: s.users.map((u) => ({ ...u, credits: 0 })) }))
      return true
    } catch { return false }
  },

  addGate: (g) => set((s) => ({
    gates: [...s.gates, { ...g, id: String(++nextGateId) }],
  })),
  updateGate: (id, patch) => set((s) => ({
    gates: s.gates.map((g) => (g.id === id ? { ...g, ...patch } : g)),
  })),
  deleteGate: (id) => set((s) => ({
    gates: s.gates.filter((g) => g.id !== id),
  })),

  addCountry: (c) => set((s) => ({
    countries: [...s.countries, { ...c, id: String(++nextCountryId) }],
  })),
  updateCountry: (id, patch) => set((s) => ({
    countries: s.countries.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  })),
  deleteCountry: (id) => set((s) => ({
    countries: s.countries.filter((c) => c.id !== id),
  })),
  toggleCountry: (id) => set((s) => ({
    countries: s.countries.map((c) => (c.id === id ? { ...c, active: !c.active } : c)),
  })),
}))
