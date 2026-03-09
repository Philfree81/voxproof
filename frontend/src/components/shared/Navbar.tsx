import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore, Theme } from '../../store/themeStore'
import LogoSobre from './LogoSobre'
import MicIcon from './MicIcon'
import api from '../../services/api'

// ─── Theme definitions (shared with dropdown) ────────────────────────────────
const THEMES: { id: Theme; label: string; colors: [string, string] }[] = [
  { id: 'classic',   label: 'Classic',   colors: ['#4f46e5', '#f9fafb'] },
  { id: 'futuriste', label: 'Futuriste', colors: ['#00e5ff', '#05070f'] },
  { id: 'blue',      label: 'Blue',      colors: ['#1e6fcc', '#deeeff'] },
  { id: 'sobre',     label: 'Sobre',     colors: ['#2c3e6b', '#c9a84c'] },
]

function Swatch({ colors }: { colors: [string, string] }) {
  return (
    <span className="flex gap-0.5 shrink-0">
      <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: colors[0] }} />
      <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: colors[1] }} />
    </span>
  )
}

// ─── Brand logo ───────────────────────────────────────────────────────────────
function BrandLogo({ onClick }: { onClick: () => void }) {
  const { theme } = useThemeStore()
  if (theme === 'futuriste') return (
    <Link to="/" onClick={onClick}>
      <img src="/logo.png" alt="VoxProof" className="h-20 w-auto"
        style={{ filter: 'drop-shadow(0 0 10px #00e5ff) drop-shadow(0 0 4px #00e5ff)' }} />
    </Link>
  )
  if (theme === 'blue') return (
    <Link to="/" onClick={onClick}>
      <img src="/logo.jpeg" alt="VoxProof" className="h-12 w-auto" />
    </Link>
  )
  if (theme === 'sobre') return (
    <Link to="/" onClick={onClick}>
      <LogoSobre className="h-10 w-auto" />
    </Link>
  )
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2">
      <MicIcon className="w-5 h-7" />
      <span className="font-bold text-xl text-th-accent">VoxProof</span>
    </Link>
  )
}

// ─── Main navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch credits when dropdown opens
  useEffect(() => {
    if (dropdownOpen && user) {
      api.get('/payments/credits').then(r => setCredits(r.data.available)).catch(() => {})
    }
  }, [dropdownOpen])

  async function purchase(priceId: string) {
    setPurchasing(true)
    setDropdownOpen(false)
    const stripeTab = window.open('', '_blank')
    try {
      const { data } = await api.post('/payments/purchase', { priceId })
      if (stripeTab) stripeTab.location.href = data.url
      else window.location.href = data.url
      const prev = credits ?? 0
      const deadline = Date.now() + 10 * 60 * 1000
      const interval = setInterval(async () => {
        if (Date.now() > deadline) { clearInterval(interval); setPurchasing(false); return }
        try {
          const r = await api.get('/payments/credits')
          if (r.data.available > prev) { clearInterval(interval); stripeTab?.close(); setCredits(r.data.available); setPurchasing(false) }
        } catch { /* ignore */ }
      }, 2000)
    } catch { stripeTab?.close(); setPurchasing(false) }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [dropdownOpen])

  function handleLogout() {
    logout()
    setDropdownOpen(false)
    setMobileOpen(false)
    navigate('/login')
  }

  const displayName = user ? ([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email) : ''

  return (
    <nav className="bg-panel border-b border-th-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Left: Logo */}
        <BrandLogo onClick={() => { setDropdownOpen(false); setMobileOpen(false) }} />

        {/* Desktop: public links + account */}
        <div className="hidden sm:flex items-center gap-5">
          <a href="https://blog.voxproof.com/glossaire/" target="_blank" rel="noopener noreferrer"
            className="text-sm text-th-text-secondary hover:text-th-accent font-medium transition-colors">
            Glossaire
          </a>
          <a href="https://blog.voxproof.com" target="_blank" rel="noopener noreferrer"
            className="text-sm text-th-text-secondary hover:text-th-accent font-medium transition-colors">
            Blog
          </a>

          {user ? (
            <>
              <Link to="/dashboard"
                className="text-sm font-medium text-th-text-secondary hover:text-th-accent transition-colors">
                Mes certifications
              </Link>

              {/* ─── Account dropdown ─── */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-th-accent text-white text-xs font-bold flex items-center justify-center">
                    {(displayName[0] || '?').toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-th-text-primary max-w-[120px] truncate">
                    {user.firstName || user.email.split('@')[0]}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-th-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-panel border border-th-border rounded-2xl shadow-xl z-50 overflow-hidden">

                    {/* Account header */}
                    <div className="px-4 py-3 border-b border-th-border-light">
                      <p className="text-sm font-semibold text-th-text-primary truncate">{displayName}</p>
                      <p className="text-xs text-th-text-muted truncate mt-0.5">{user.email}</p>
                    </div>

                    {/* Profile link */}
                    <div className="py-1">
                      <Link to="/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-th-text-secondary hover:bg-surface-2 hover:text-th-text-primary transition-colors">
                        <span className="text-base">👤</span> Mon profil
                      </Link>
                    </div>

                    {/* Credits */}
                    <div className="px-4 py-3 border-t border-th-border-light">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-th-text-muted uppercase tracking-wide">Crédits</p>
                        {credits !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${credits > 0 ? 'text-green-700 bg-green-50' : 'text-th-text-muted bg-surface-2'}`}>
                            {credits} disponible{credits > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {purchasing ? (
                        <p className="text-xs text-th-accent flex items-center gap-1.5">
                          <span className="w-3 h-3 border border-th-accent border-t-transparent rounded-full animate-spin inline-block" />
                          En attente de paiement…
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button onClick={() => purchase(import.meta.env.VITE_STRIPE_PRICE_ANNUAL)}
                            className="flex flex-col items-center py-2 px-1 rounded-lg border border-th-border text-xs hover:border-th-accent hover:bg-th-accent-subtle transition-colors">
                            <span className="font-semibold text-th-text-primary">1 crédit</span>
                            <span className="text-th-accent font-bold">14 €</span>
                          </button>
                          <button onClick={() => purchase(import.meta.env.VITE_STRIPE_PRICE_LIFETIME)}
                            className="flex flex-col items-center py-2 px-1 rounded-lg bg-th-accent text-xs hover:bg-th-accent-hover transition-colors">
                            <span className="font-semibold text-white">Pack 5</span>
                            <span className="text-white font-bold">57 €</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Theme switcher */}
                    <div className="px-4 py-3 border-t border-th-border-light">
                      <p className="text-xs font-semibold text-th-text-muted uppercase tracking-wide mb-2">Thème</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {THEMES.map(t => (
                          <button key={t.id} onClick={() => setTheme(t.id)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                              theme === t.id
                                ? 'bg-th-accent-subtle text-th-accent font-semibold border border-th-accent/30'
                                : 'text-th-text-secondary hover:bg-surface-2'
                            }`}>
                            <Swatch colors={t.colors} />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-th-border-light py-1">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <span className="text-base">↩</span> Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-th-text-secondary hover:text-th-accent font-medium transition-colors">
                Connexion
              </Link>
              <Link to="/register" className="text-sm bg-th-accent text-white px-4 py-2 rounded-lg hover:bg-th-accent-hover font-medium transition-colors">
                Commencer
              </Link>
            </>
          )}
        </div>

        {/* Mobile: hamburger */}
        <div className="sm:hidden">
          <button onClick={() => setMobileOpen(v => !v)} className="p-2 text-th-text-secondary" aria-label="Menu">
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden bg-panel border-t border-th-border-light px-4 py-3 space-y-1">
          <a href="https://blog.voxproof.com/glossaire/" target="_blank" rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm text-th-text-secondary hover:text-th-accent font-medium">
            Glossaire
          </a>
          <a href="https://blog.voxproof.com" target="_blank" rel="noopener noreferrer"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm text-th-text-secondary hover:text-th-accent font-medium">
            Blog
          </a>

          {user ? (
            <>
              <div className="py-2 border-t border-th-border-light">
                <p className="text-sm font-semibold text-th-text-primary">{displayName}</p>
                <p className="text-xs text-th-text-muted mt-0.5">{user.email}</p>
              </div>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-th-text-secondary hover:text-th-accent font-medium">
                Mes certifications
              </Link>
              <Link to="/profile" onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-th-text-secondary hover:text-th-accent font-medium">
                Mon profil
              </Link>

              {/* Theme switcher mobile */}
              <div className="py-2 border-t border-th-border-light">
                <p className="text-xs font-semibold text-th-text-muted uppercase tracking-wide mb-2">Thème</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        theme === t.id
                          ? 'bg-th-accent-subtle text-th-accent font-semibold border border-th-accent/30'
                          : 'text-th-text-secondary hover:bg-surface-2'
                      }`}>
                      <Swatch colors={t.colors} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleLogout}
                className="block w-full text-left py-2 text-sm text-red-500 hover:text-red-400 font-medium border-t border-th-border-light mt-1 pt-3">
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-th-text-secondary hover:text-th-accent font-medium">
                Connexion
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}
                className="block mt-1 text-center bg-th-accent text-white px-4 py-2 rounded-lg hover:bg-th-accent-hover text-sm font-medium">
                Commencer
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
