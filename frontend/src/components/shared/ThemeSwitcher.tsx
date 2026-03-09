import { useState } from 'react'
import { useThemeStore, Theme } from '../../store/themeStore'

const THEMES: { id: Theme; label: string; icon: string }[] = [
  { id: 'classic',   label: 'Classic',      icon: '☀️' },
  { id: 'futuriste', label: 'Futuriste',    icon: '⚡' },
  { id: 'blue',      label: 'VoxProof Blue', icon: '🔷' },
  { id: 'sobre',     label: 'Sobre',        icon: '⚖️' },
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore()
  const [open, setOpen] = useState(false)
  const current = THEMES.find(t => t.id === theme)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-th-text-secondary hover:text-th-text-primary hover:bg-surface-2 transition-colors"
        aria-label="Changer de thème"
      >
        <span className="text-base">{current.icon}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-panel border border-th-border rounded-xl shadow-lg z-20 overflow-hidden">
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
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {theme === t.id && <span className="ml-auto text-xs opacity-70">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
