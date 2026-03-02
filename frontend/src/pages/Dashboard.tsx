import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import { useAuthStore } from '../store/authStore'
import { VoiceSession } from '../types'
import api from '../services/api'

const LANG_FLAG: Record<string, string> = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸' }

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ANCHORED:   { label: 'Certifiée',   cls: 'bg-green-100 text-green-700' },
  PROCESSING: { label: 'En cours…',  cls: 'bg-yellow-100 text-yellow-700' },
  FAILED:     { label: 'Échouée',    cls: 'bg-red-100 text-red-700' },
  RECORDING:  { label: 'Incomplète', cls: 'bg-gray-100 text-gray-600' },
}

interface SubStatus {
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | null
  currentPeriodEnd: string | null
}

function shortHash(h?: string) {
  if (!h) return '—'
  return h.slice(0, 8) + '…' + h.slice(-6)
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const { user, fetchMe } = useAuthStore()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<VoiceSession[]>([])
  const [sub, setSub] = useState<SubStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [renewing, setRenewing] = useState(false)

  useEffect(() => {
    if (!user) fetchMe()
  }, [])

  useEffect(() => {
    if (user?.kycStatus === 'PENDING' || user?.kycStatus === 'REJECTED') {
      navigate('/kyc')
      return
    }
    if (user?.kycStatus === 'APPROVED') {
      Promise.all([
        api.get('/sessions').then(r => setSessions(r.data)),
        api.get('/payments/status').then(r => setSub(r.data)).catch(() => setSub(null)),
      ]).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', '/dashboard')
      api.get('/payments/status').then(r => setSub(r.data))
    }
  }, [])

  async function downloadPdf(sessionId: string) {
    setDownloading(sessionId)
    try {
      const r = await api.get(`/sessions/${sessionId}/pdf`, { responseType: 'blob' })
      const blob = new Blob([r.data], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `voxproof-${sessionId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      alert('Certificat non disponible pour cette session.')
    } finally {
      setDownloading(null)
    }
  }

  async function renewSubscription() {
    setRenewing(true)
    try {
      const { data } = await api.post('/payments/subscribe')
      window.location.href = data.url
    } catch {
      setRenewing(false)
    }
  }

  async function deleteSession(sessionId: string) {
    setDeleting(sessionId)
    try {
      await api.delete(`/sessions/${sessionId}`)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } finally {
      setDeleting(null)
    }
  }

  const isActive = sub?.status === 'ACTIVE'
  const hasAnchored = sessions.some(s => s.status === 'ANCHORED')
  const daysLeft = sub?.currentPeriodEnd
    ? Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86_400_000)
    : null
  const isExpiringSoon = isActive && daysLeft !== null && daysLeft <= 30
  const isExpired = !isActive && (sub?.status === 'CANCELED' || sub?.status === 'PAST_DUE')

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {user?.firstName ? `Bienvenue, ${user.firstName}` : user?.email}
            </p>
          </div>
          {user?.kycStatus === 'APPROVED' && (
            <Link to="/session/new"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              + Nouvelle session
            </Link>
          )}
        </div>

        {/* KYC banner */}
        {user?.kycStatus !== 'APPROVED' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm text-yellow-800">Complétez la vérification d'identité pour commencer</p>
            <button onClick={() => navigate('/kyc')}
              className="text-sm bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700">
              Vérifier mon identité
            </button>
          </div>
        )}

        {/* Subscription status */}
        {user?.kycStatus === 'APPROVED' && !loading && (
          <>
            {/* Active & expiring soon */}
            {isExpiringSoon && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center justify-between">
                <p className="text-xs text-yellow-800">
                  Abonnement expire dans <span className="font-semibold">{daysLeft} jour{daysLeft! > 1 ? 's' : ''}</span> · Renouvelez pour prolonger vos certificats automatiquement
                </p>
                <button onClick={renewSubscription} disabled={renewing}
                  className="ml-4 shrink-0 text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700 disabled:opacity-60">
                  {renewing ? '…' : 'Renouveler'}
                </button>
              </div>
            )}

            {/* Active & healthy */}
            {isActive && !isExpiringSoon && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                <p className="text-xs text-green-700">
                  Abonnement actif · Certifications illimitées · Valide jusqu'au {formatDate(sub?.currentPeriodEnd)}
                </p>
                <span className="text-green-500">✓</span>
              </div>
            )}

            {/* Expired / canceled — only show if user has certified sessions */}
            {isExpired && hasAnchored && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Vos certificats ont expiré</p>
                  <p className="text-xs text-red-600 mt-0.5">Renouvelez votre abonnement pour prolonger leur validité d'un an</p>
                </div>
                <button onClick={renewSubscription} disabled={renewing}
                  className="ml-4 shrink-0 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium disabled:opacity-60">
                  {renewing ? '…' : 'Renouveler — 12€/an'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Sessions list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Mes sessions vocales
          </h2>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">Aucune session vocale pour l'instant.</p>
              {user?.kycStatus === 'APPROVED' && (
                <Link to="/session/new"
                  className="mt-3 inline-block text-indigo-600 text-sm font-medium hover:underline">
                  Créer votre première signature vocale →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(s => {
                const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.RECORDING
                const canDelete = s.status === 'FAILED' || s.status === 'RECORDING'

                return (
                  <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{LANG_FLAG[s.language] ?? '🌐'}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(s.createdAt)}</span>
                        </div>
                        {s.acousticHash && (
                          <p className="text-xs font-mono text-gray-500 truncate">
                            Hash : {shortHash(s.acousticHash)}
                          </p>
                        )}
                        {s.txHash && (
                          <p className="text-xs font-mono text-gray-400 truncate">
                            TX : {shortHash(s.txHash)} · Bloc #{s.blockNumber}
                          </p>
                        )}
                        {s.status === 'ANCHORED' && s.validUntil && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Valide jusqu'au <span className="font-medium text-gray-600">{formatDate(s.validUntil)}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {s.status === 'ANCHORED' && (
                          <button
                            onClick={() => downloadPdf(s.id)}
                            disabled={downloading === s.id}
                            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-60">
                            {downloading === s.id ? '…' : '↓ Certificat'}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => deleteSession(s.id)}
                            disabled={deleting === s.id}
                            className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 font-medium disabled:opacity-60">
                            {deleting === s.id ? '…' : 'Supprimer'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
