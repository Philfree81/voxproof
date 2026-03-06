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
      setError(err.response?.data?.error || 'Could not start verification')
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

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <span className="text-5xl">🪪</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Identity Verification</h1>
          <p className="text-gray-500 text-sm mt-2">
            We need to verify your identity before you can start anchoring voice proofs.
            This is a one-time process powered by Stripe Identity.
          </p>

          {user?.kycStatus && (
            <div className={`inline-block mt-4 px-3 py-1 rounded-full text-sm font-medium ${statusColors[user.kycStatus]}`}>
              Status: {user.kycStatus}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {user?.kycStatus !== 'APPROVED' && (
              <button onClick={startVerification} disabled={loading}
                className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50">
                {loading ? 'Redirecting…' : 'Start Verification'}
              </button>
            )}

            {user?.kycStatus === 'PENDING' && (
              <button onClick={checkStatus} disabled={checking}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50">
                {checking ? 'Checking…' : 'Check Status'}
              </button>
            )}

            {user?.kycStatus === 'REJECTED' && (
              <p className="text-red-600 text-sm">
                Verification failed. Please try again with a valid government-issued ID.
              </p>
            )}
          </div>

          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

          <div className="mt-4">
            <button onClick={() => navigate('/dashboard')}
              className="w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
              Passer pour l'instant — continuer sans vérifier mon identité
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-400">
            <p>Your documents are processed securely by Stripe Identity.</p>
            <p>VoxProof does not store your ID documents.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
