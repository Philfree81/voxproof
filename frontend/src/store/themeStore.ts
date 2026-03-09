import { create } from 'zustand'

export type Theme = 'classic' | 'futuriste' | 'blue'

const ALL_THEMES: Theme[] = ['classic', 'futuriste', 'blue']
const STORAGE_KEY = 'voxproof-theme'

function applyTheme(theme: Theme) {
  const html = document.documentElement
  ALL_THEMES.forEach(t => html.classList.remove(`theme-${t}`))
  html.classList.add(`theme-${theme}`)
}

const initialTheme = (localStorage.getItem(STORAGE_KEY) as Theme) || 'classic'
applyTheme(initialTheme)

interface ThemeStore {
  theme: Theme
  setTheme: (t: Theme) => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
    set({ theme })
  },
}))
