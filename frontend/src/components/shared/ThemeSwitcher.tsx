import { useState } from 'react'
import { useThemeStore, Theme } from '../../store/themeStore'

type ThemeDef = {
  id: Theme
  label: string
  colors: [string, string]
}

const THEMES: ThemeDef[] = [
  { id: 'classic',   label: 'Classic',       colors: ['#4f46e5', '#f9fafb'] },
  { id: 'futuriste', label: 'Futuriste',     colors: ['#00e5ff', '#05070f'] },
  { id: 'blue',      label: 'VoxProof Blue', colors: ['#1e6fcc', '#deeeff'] },
  { id: 'sobre',     label: 'Sobre',         colors: ['#2c3e6b', '#c9a84c'] },
]

function Swatch({ colors, size = 3 }: { colors: [string, string]; size?: number }) {
  const px = `${size * 4}px`
  return (
    <span className="flex gap-0.5 shrink-0">
      <span className="rounded-full border border-black/10" style={{ width: px, height: px, background: colors[0] }} />
      <span className="rounded-full border border-black/10" style={{ width: px, height: px, background: colors[1] }} />
    </span>
  )
}

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore()
  const [open, setOpen] = useState(false)
  const current = THEMES.find(t => t.id === theme)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-th-text-secondary hover:text-th-text-primary hover:bg-surface-2 transition-colors"
        aria-label="Changer de thème"
      >
        <Swatch colors={current.colors} size={3} />
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-panel border border-th-border rounded-xl shadow-lg z-20 overflow-hidden">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                  theme === t.id
                    ? 'bg-th-accent-subtle text-th-accent font-medium'
                    : 'text-th-text-secondary hover:bg-surface-2 hover:text-th-text-primary'
                }`}
              >
                <Swatch colors={t.colors} size={3} />
                <span>{t.label}</span>
                {theme === t.id && <span className="ml-auto text-xs opacity-50">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
