import { create } from 'zustand'
import { User } from '../types'
import api from '../services/api'
import { useThemeStore } from './themeStore'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('voxproof_token'),
  loading: false,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    localStorage.setItem('voxproof_token', token)
    set({ token })
  },

  logout: () => {
    localStorage.removeItem('voxproof_token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data })
      if (data.theme) useThemeStore.getState().applyUserTheme(data.theme)
    } finally {
      set({ loading: false })
    }
  },
}))
