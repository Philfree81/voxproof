import { useState, FormEvent } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-th-text-secondary">Lien invalide.</p>
          <Link to="/login" className="text-th-accent hover:underline text-sm mt-2 block">Retour à la connexion</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-panel rounded-2xl shadow-sm border border-th-border p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🔒</span>
          <h1 className="text-2xl font-bold text-th-text-primary mt-2">Nouveau mot de passe</h1>
          <p className="text-th-text-muted text-sm mt-1">Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-th-text-primary font-medium mb-2">Mot de passe mis à jour !</p>
            <p className="text-th-text-muted text-sm mb-4">Redirection vers la connexion…</p>
            <Link to="/login" className="text-th-accent hover:underline text-sm font-medium">
              Se connecter maintenant
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-th-border bg-surface rounded-lg px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent"
                placeholder="Min. 8 caractères"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full border border-th-border bg-surface rounded-lg px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-th-accent text-white py-2.5 rounded-lg font-medium hover:bg-th-accent-hover disabled:opacity-50 transition-colors"
            >
              {loading ? 'Mise à jour…' : 'Enregistrer le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
