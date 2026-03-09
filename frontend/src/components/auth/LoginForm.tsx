import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import MicIcon from '../shared/MicIcon'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.token)
      setUser(data.user)
      if (data.user.theme) useThemeStore.getState().applyUserTheme(data.user.theme)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-panel rounded-2xl shadow-sm border border-th-border p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <MicIcon className="w-10 h-14 mx-auto" />
          <h1 className="text-2xl font-bold text-th-text-primary mt-2">Welcome back</h1>
          <p className="text-th-text-muted text-sm mt-1">Sign in to VoxProof</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-th-border bg-surface rounded-lg px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-th-border bg-surface rounded-lg px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent"
              placeholder="••••••••" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-th-accent text-white py-2.5 rounded-lg font-medium hover:bg-th-accent-hover disabled:opacity-50 transition-colors">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-th-text-muted mt-4">
          <Link to="/forgot-password" className="text-th-accent hover:underline">Mot de passe oublié ?</Link>
        </p>
        <p className="text-center text-sm text-th-text-muted mt-2">
          No account?{' '}
          <Link to="/register" className="text-th-accent hover:underline font-medium">Register</Link>
        </p>
      </div>
    </div>
  )
}
