import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🎙️</span>
          <span className="font-bold text-xl text-brand-700">VoxProof</span>
        </Link>

        <div className="flex items-center gap-4">
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
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-red-600 font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-brand-600 font-medium">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 font-medium"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
