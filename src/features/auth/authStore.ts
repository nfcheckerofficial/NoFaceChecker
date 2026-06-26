import { create } from 'zustand'
import { useUserStore } from '@/features/checker/store/userStore'

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''
const SERVER_URL = API_BASE

interface User {
  id: number
  username: string
  credits: number
  role: string
  telegram_id: string | null
  created_at: string
}

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null

  login: (username: string, password: string) => Promise<boolean>
  loginWithTelegram: (telegram_id: string) => Promise<boolean>
  register: (username: string, password: string, telegram_id: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  linkTelegram: (telegram_id: string) => Promise<boolean>
  clearError: () => void
}

function loadToken(): string | null {
  try { return localStorage.getItem('auth_token') } catch { return null }
}
function saveToken(t: string | null) {
  try { if (t) localStorage.setItem('auth_token', t); else localStorage.removeItem('auth_token') } catch {}
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: loadToken(),
  user: null,
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { set({ loading: false, error: data.error }); return false }
      saveToken(data.token)
      set({ token: data.token, user: data.user, loading: false })
      useUserStore.getState().syncFromAuth(data.user)
      return true
    } catch (err) {
      set({ loading: false, error: String(err) })
      return false
    }
  },

  register: async (username, password, telegram_id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, telegram_id }),
      })
      const data = await res.json()
      if (!res.ok) { set({ loading: false, error: data.error }); return false }
      saveToken(data.token)
      set({ token: data.token, user: data.user, loading: false })
      useUserStore.getState().syncFromAuth(data.user)
      return true
    } catch (err) {
      set({ loading: false, error: String(err) })
      return false
    }
  },

  loginWithTelegram: async (telegram_id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/telegram-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id }),
      })
      const data = await res.json()
      if (!res.ok) { set({ loading: false, error: data.error }); return false }
      saveToken(data.token)
      set({ token: data.token, user: data.user, loading: false })
      useUserStore.getState().syncFromAuth(data.user)
      return true
    } catch (err) {
      set({ loading: false, error: String(err) })
      return false
    }
  },

  linkTelegram: async (telegram_id) => {
    try {
      const token = get().token
      const res = await fetch(`${SERVER_URL}/api/auth/link-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ telegram_id }),
      })
      const data = await res.json()
      if (!res.ok) { set({ error: data.error }); return false }
      set({ user: data.user })
      useUserStore.getState().syncFromAuth(data.user)
      return true
    } catch (err) {
      set({ error: String(err) })
      return false
    }
  },

  logout: () => {
    saveToken(null)
    set({ token: null, user: null })
  },

  checkAuth: async () => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { saveToken(null); set({ token: null, user: null }); return }
      const user = await res.json()
      set({ user })
      useUserStore.getState().syncFromAuth(user)
    } catch {
      saveToken(null)
      set({ token: null, user: null })
    }
  },

  clearError: () => set({ error: null }),
}))
