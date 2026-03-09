import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

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
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="text-2xl">🎙️</span>
          <span className="font-bold text-xl text-brand-700">VoxProof</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-4">
          <a href="https://blog.voxproof.com/glossaire/" target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-brand-600 font-medium">
            Glossaire
          </a>
          <a href="https://blog.voxproof.com" target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-brand-600 font-medium">
            Blog
          </a>
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-brand-600 font-medium">
                Dashboard
              </Link>
              <span className="text-sm text-gray-500 truncate max-w-[160px]">{user.email}</span>
              <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600 font-medium">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-brand-600 font-medium">
                Login
              </Link>
              <Link to="/register" className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 font-medium">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-gray-600 hover:text-gray-900"
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

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          <a href="https://blog.voxproof.com/glossaire/" target="_blank" rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-gray-600 hover:text-brand-600 font-medium">
            Glossaire
          </a>
          <a href="https://blog.voxproof.com" target="_blank" rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-gray-600 hover:text-brand-600 font-medium">
            Blog
          </a>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-gray-600 hover:text-brand-600 font-medium">
                Dashboard
              </Link>
              <p className="py-2 text-sm text-gray-400 truncate">{user.email}</p>
              <button onClick={handleLogout}
                className="block py-2 text-sm text-red-500 hover:text-red-700 font-medium w-full text-left">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm text-gray-600 hover:text-brand-600 font-medium">
                Login
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="block mt-1 text-center bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 text-sm font-medium">
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
