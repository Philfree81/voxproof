import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

export default function KycPage() {
  const { user, fetchMe } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.kycStatus === 'APPROVED') navigate('/dashboard')
  }, [user])

  async function startVerification() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/kyc/start')
      window.location.href = data.url
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de démarrer la vérification')
    } finally {
      setLoading(false)
    }
  }

  async function checkStatus() {
    setChecking(true)
    try {
      await api.get('/kyc/status')
      await fetchMe()
    } finally {
      setChecking(false)
    }
  }

  const isRejected = user?.kycStatus === 'REJECTED'
  const isPending  = user?.kycStatus === 'PENDING'

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <span className="text-5xl">🪪</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Vérification d'identité</h1>
          <p className="text-gray-500 text-sm mt-2">
            Vérifiez votre identité pour que vos certificats portent la mention
            <strong> « Identité vérifiée »</strong>. Processus sécurisé par Stripe Identity.
          </p>

          {/* Status badge */}
          {isRejected && (
            <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4 text-left">
              <p className="text-sm font-semibold text-red-800">Vérification échouée</p>
              <p className="text-xs text-red-600 mt-1">
                La vérification n'a pas abouti (pièce non reconnue, photo floue, document expiré…).
                Vous pouvez relancer le processus avec une pièce d'identité valide.
              </p>
            </div>
          )}

          {isPending && (
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
              <p className="text-sm font-semibold text-amber-800">Vérification en cours</p>
              <p className="text-xs text-amber-600 mt-1">
                Si vous avez déjà complété la vérification Stripe, cliquez sur « Vérifier le statut ».
                Sinon relancez le processus ci-dessous.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {user?.kycStatus !== 'APPROVED' && (
              <button onClick={startVerification} disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading
                  ? 'Redirection…'
                  : isRejected
                    ? 'Relancer la vérification'
                    : 'Vérifier mon identité'}
              </button>
            )}

            {isPending && (
              <button onClick={checkStatus} disabled={checking}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50">
                {checking ? 'Vérification…' : 'Vérifier le statut'}
              </button>
            )}
          </div>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          <div className="mt-4">
            <button onClick={() => navigate('/dashboard')}
              className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
              Continuer sans vérifier pour l'instant
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-400">
            <p>Vos documents sont traités par Stripe Identity — VoxProof ne les conserve pas.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
