import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function RegisterForm() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [cgvAccepted, setCgvAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { setToken, setUser } = useAuthStore()
  const navigate = useNavigate()

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!cgvAccepted) { setError('Vous devez accepter les Conditions Générales de Vente et d\'Utilisation.'); return }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      setToken(data.token)
      setUser(data.user)
      setShowSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      {/* Success popup */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-panel rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center border border-th-border">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-th-text-primary mb-2">Compte créé !</h2>
            <p className="text-th-text-secondary text-sm mb-6">
              Votre compte est actif. Vous pouvez dès maintenant créer votre première session de certification vocale.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-th-accent text-white py-2.5 rounded-lg font-medium hover:bg-th-accent-hover transition-colors"
            >
              Accéder à mon tableau de bord →
            </button>
          </div>
        </div>
      )}

      <div className="bg-panel rounded-2xl shadow-sm border border-th-border p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🎙️</span>
          <h1 className="text-2xl font-bold text-th-text-primary mt-2">Create your account</h1>
          <p className="text-th-text-muted text-sm mt-1">Start notarizing your voice</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">First name</label>
              <input name="firstName" value={form.firstName} onChange={onChange}
                className="w-full border border-th-border bg-surface rounded-lg px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent"
                placeholder="Jane" />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Last name</label>
              <input name="lastName" value={form.lastName} onChange={onChange}
                className="w-full border border-th-border bg-surface rounded-lg px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent"
                placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={onChange} required
              className="w-full border border-th-border bg-surface rounded-lg px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={onChange} required minLength={8}
              className="w-full border border-th-border bg-surface rounded-lg px-3 py-2 text-sm text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent"
              placeholder="Min. 8 characters" />
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="cgv"
              checked={cgvAccepted}
              onChange={e => setCgvAccepted(e.target.checked)}
              className="mt-0.5 accent-th-accent flex-shrink-0"
            />
            <label htmlFor="cgv" className="text-xs text-th-text-muted leading-relaxed cursor-pointer">
              J'ai lu et j'accepte les{' '}
              <Link to="/cgv" target="_blank" className="text-th-accent hover:underline font-medium">
                Conditions Générales de Vente et d'Utilisation
              </Link>
              , y compris la déclaration d'identité sur l'honneur et le caractère irréversible de la certification blockchain.
            </label>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading || !cgvAccepted}
            className="w-full bg-th-accent text-white py-2.5 rounded-lg font-medium hover:bg-th-accent-hover disabled:opacity-50 transition-colors">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-th-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-th-accent hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
