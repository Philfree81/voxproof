import { useAuthStore } from '../store/authStore'
import Layout from '../components/shared/Layout'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Mon profil</h1>
          <p className="text-th-text-muted text-sm mt-1">Gérez vos informations personnelles</p>
        </div>

        {/* User info */}
        <div className="bg-panel border border-th-border rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-th-text-muted uppercase tracking-wide">Informations</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-th-text-muted text-xs mb-0.5">Nom</p>
              <p className="font-medium text-th-text-primary">
                {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'}
              </p>
            </div>
            <div>
              <p className="text-th-text-muted text-xs mb-0.5">Email</p>
              <p className="font-medium text-th-text-primary">{user?.email}</p>
            </div>
            <div>
              <p className="text-th-text-muted text-xs mb-0.5">Statut email</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                ✓ Email vérifié
              </span>
            </div>
            <div>
              <p className="text-th-text-muted text-xs mb-0.5">Vérification d'identité numérique</p>
              {user?.kycVerificationId ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  ✓ Vérifiée
                </span>
              ) : (
                <a href="/kyc" className="inline-flex items-center gap-1 text-xs font-medium text-th-accent hover:underline">
                  Vérifier →
                </a>
              )}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  )
}
