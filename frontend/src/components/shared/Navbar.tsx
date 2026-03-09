import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import ThemeSwitcher from './ThemeSwitcher'
import LogoSobre from './LogoSobre'

function BrandLogo({ onClick }: { onClick: () => void }) {
  const { theme } = useThemeStore()

  if (theme === 'futuriste') {
    return (
      <Link to="/" className="flex items-center" onClick={onClick}>
        <img
          src="/logo.png"
          alt="VoxProof"
          className="h-16 w-auto"
          style={{ filter: 'drop-shadow(0 0 10px #00e5ff) drop-shadow(0 0 4px #00e5ff)' }}
        />
      </Link>
    )
  }

  if (theme === 'blue') {
    return (
      <Link to="/" className="flex items-center" onClick={onClick}>
        <img src="/logo.jpeg" alt="VoxProof" className="h-12 w-auto" />
      </Link>
    )
  }

  if (theme === 'sobre') {
    return (
      <Link to="/" className="flex items-center" onClick={onClick}>
        <LogoSobre className="h-10 w-auto" />
      </Link>
    )
  }

  return (
    <Link to="/" className="flex items-center gap-2" onClick={onClick}>
      <span className="text-2xl">🎙️</span>
      <span className="font-bold text-xl text-th-accent">VoxProof</span>
    </Link>
  )
}

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  return (
    <nav className="bg-panel border-b border-th-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <BrandLogo onClick={() => setMenuOpen(false)} />

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
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
              <Link to="/dashboard" className="text-sm text-th-text-secondary hover:text-th-accent font-medium transition-colors">
                Dashboard
              </Link>
              <span className="text-sm text-th-text-muted truncate max-w-[160px]">{user.email}</span>
              <button onClick={handleLogout} className="text-sm text-th-text-secondary hover:text-red-500 font-medium transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-th-text-secondary hover:text-th-accent font-medium transition-colors">
                Login
              </Link>
              <Link to="/register" className="text-sm bg-th-accent text-white px-4 py-2 rounded-lg hover:bg-th-accent-hover font-medium transition-colors">
                Get Started
              </Link>
            </>
          )}
          <ThemeSwitcher />
        </div>

        {/* Mobile: theme switcher + hamburger */}
        <div className="sm:hidden flex items-center gap-2">
          <ThemeSwitcher />
          <button
            className="p-2 text-th-text-secondary hover:text-th-text-primary transition-colors"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu"
          >
            {menuOpen ? (
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
      {menuOpen && (
        <div className="sm:hidden bg-panel border-t border-th-border-light px-4 py-3 space-y-1">
          <a href="https://blog.voxproof.com/glossaire/" target="_blank" rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-th-text-secondary hover:text-th-accent font-medium">
            Glossaire
          </a>
          <a href="https://blog.voxproof.com" target="_blank" rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-th-text-secondary hover:text-th-accent font-medium">
            Blog
          </a>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-th-text-secondary hover:text-th-accent font-medium">
                Dashboard
              </Link>
              <p className="py-2 text-sm text-th-text-muted truncate">{user.email}</p>
              <button onClick={handleLogout}
                className="block py-2 text-sm text-red-500 hover:text-red-400 font-medium w-full text-left">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-th-text-secondary hover:text-th-accent font-medium">
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="block mt-1 text-center bg-th-accent text-white px-4 py-2 rounded-lg hover:bg-th-accent-hover text-sm font-medium">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
