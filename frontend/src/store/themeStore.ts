import { create } from 'zustand'
import api from '../services/api'

export type Theme = 'classic' | 'futuriste' | 'blue' | 'sobre'

const ALL_THEMES: Theme[] = ['classic', 'futuriste', 'blue', 'sobre']
const STORAGE_KEY = 'voxproof-theme'

function applyTheme(theme: Theme) {
  const html = document.documentElement
  ALL_THEMES.forEach(t => html.classList.remove(`theme-${t}`))
  html.classList.add(`theme-${theme}`)
}

const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
const initialTheme: Theme = storedTheme ?? 'classic'
applyTheme(initialTheme)

interface ThemeStore {
  theme: Theme
  defaultTheme: Theme
  setTheme: (t: Theme) => void
  applyUserTheme: (t: string) => void
  fetchDefault: () => Promise<void>
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initialTheme,
  defaultTheme: 'classic',

  setTheme: (theme) => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
    set({ theme })
    const token = localStorage.getItem('voxproof_token')
    if (token) {
      api.patch('/auth/me/theme', { theme }).catch(() => {})
    }
  },

  applyUserTheme: (t: string) => {
    const theme = (ALL_THEMES.includes(t as Theme) ? t : 'classic') as Theme
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
    set({ theme })
  },

  fetchDefault: async () => {
    try {
      const { data } = await api.get('/config')
      const def = (ALL_THEMES.includes(data.defaultTheme) ? data.defaultTheme : 'classic') as Theme
      set({ defaultTheme: def })
      if (!storedTheme) {
        applyTheme(def)
        set({ theme: def })
      }
    } catch {}
  },
}))
