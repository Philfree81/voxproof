import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="bg-panel rounded-2xl shadow-sm border border-th-border p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🔑</span>
          <h1 className="text-2xl font-bold text-th-text-primary mt-2">Mot de passe oublié</h1>
          <p className="text-th-text-muted text-sm mt-1">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <p className="text-th-text-primary font-medium mb-2">Email envoyé !</p>
            <p className="text-th-text-muted text-sm mb-6">
              Si un compte existe avec cette adresse, vous recevrez un email avec un lien valable 1 heure.
            </p>
            <Link to="/login" className="text-th-accent hover:underline text-sm font-medium">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-th-border bg-surface rounded-lg px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent"
                placeholder="you@example.com"
              />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-th-accent text-white py-2.5 rounded-lg font-medium hover:bg-th-accent-hover disabled:opacity-50 transition-colors"
            >
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>

            <p className="text-center text-sm text-th-text-muted">
              <Link to="/login" className="text-th-accent hover:underline font-medium">
                Retour à la connexion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
