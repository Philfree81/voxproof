import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/shared/Layout'
import api from '../services/api'

interface PurchaseRecord {
  id: string
  productType: 'ANNUAL' | 'LIFETIME'
  stripePriceId: string
  usedAt: string | null
  createdAt: string
}

interface CreditsData {
  available: number
  total: number
  purchases: PurchaseRecord[]
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [credits, setCredits] = useState<CreditsData | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [loadingCredits, setLoadingCredits] = useState(true)

  useEffect(() => {
    api.get('/payments/credits')
      .then(r => setCredits(r.data))
      .finally(() => setLoadingCredits(false))
  }, [])

  async function purchase(priceId: string) {
    setPurchasing(true)
    const stripeTab = window.open('', '_blank')
    try {
      const { data } = await api.post('/payments/purchase', { priceId })
      if (stripeTab) stripeTab.location.href = data.url
      else window.location.href = data.url

      // Poll jusqu'à confirmation (max 10 min)
      const deadline = Date.now() + 10 * 60 * 1000
      const interval = setInterval(async () => {
        if (Date.now() > deadline) { clearInterval(interval); setPurchasing(false); return }
        try {
          const r = await api.get('/payments/credits')
          if (r.data.available > (credits?.available ?? 0)) {
            clearInterval(interval)
            stripeTab?.close()
            setCredits(r.data)
            setPurchasing(false)
          }
        } catch { /* ignore */ }
      }, 2000)
    } catch {
      stripeTab?.close()
      setPurchasing(false)
    }
  }

  function fmt(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const used = credits ? credits.total - credits.available : 0

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Mon profil</h1>
          <p className="text-th-text-muted text-sm mt-1">Gérez vos informations et vos crédits de certification</p>
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
              <p className="text-th-text-muted text-xs mb-0.5">Identité Stripe</p>
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

        {/* Credits */}
        <div className="bg-panel border border-th-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-th-text-muted uppercase tracking-wide">Crédits de certification</h2>

          {loadingCredits ? (
            <div className="h-12 flex items-center">
              <div className="w-5 h-5 border-2 border-th-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex items-end gap-6">
              <div>
                <p className="text-5xl font-bold text-th-accent">{credits?.available ?? 0}</p>
                <p className="text-sm text-th-text-muted mt-1">crédit{(credits?.available ?? 0) !== 1 ? 's' : ''} disponible{(credits?.available ?? 0) !== 1 ? 's' : ''}</p>
              </div>
              {used > 0 && (
                <div className="pb-1">
                  <p className="text-2xl font-semibold text-th-text-muted">{used}</p>
                  <p className="text-xs text-th-text-muted">utilisé{used !== 1 ? 's' : ''}</p>
                </div>
              )}
            </div>
          )}

          {/* Buy more */}
          <div className="pt-2 border-t border-th-border-light">
            <p className="text-sm font-medium text-th-text-primary mb-3">Acheter des crédits</p>
            {purchasing ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-th-accent">En attente de confirmation…</p>
                <p className="text-xs text-th-text-muted">Complétez le paiement dans l'onglet qui vient de s'ouvrir</p>
                <button
                  onClick={async () => {
                    const r = await api.get('/payments/credits')
                    setCredits(r.data)
                    setPurchasing(false)
                  }}
                  className="text-xs text-th-accent underline mt-1"
                >
                  J'ai payé — actualiser
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => purchase(import.meta.env.VITE_STRIPE_PRICE_ANNUAL)}
                  className="flex flex-col items-center gap-1 bg-surface border-2 border-th-border hover:border-th-accent rounded-xl p-4 transition-colors">
                  <span className="text-base font-bold text-th-accent">1 certification</span>
                  <span className="text-xs text-th-text-muted">Ancrage permanent</span>
                  <span className="text-lg font-bold text-th-text-primary mt-1">14 €</span>
                </button>
                <button
                  onClick={() => purchase(import.meta.env.VITE_STRIPE_PRICE_LIFETIME)}
                  className="flex flex-col items-center gap-1 bg-th-accent hover:bg-th-accent-hover rounded-xl p-4 transition-colors relative">
                  <span className="absolute -top-2 right-3 text-[10px] bg-white text-th-accent font-bold px-2 py-0.5 rounded-full">−19 %</span>
                  <span className="text-base font-bold text-white">Pack 5 certifs</span>
                  <span className="text-xs text-indigo-200">11,40 € / certification</span>
                  <span className="text-lg font-bold text-white mt-1">57 €</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Purchase history */}
        {credits && credits.total > 0 && (
          <div className="bg-panel border border-th-border rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-th-text-muted uppercase tracking-wide">Historique des achats</h2>
            <div className="space-y-2">
              {credits.purchases.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-th-border-light last:border-0">
                  <div>
                    <p className="text-sm font-medium text-th-text-primary">
                      {p.productType === 'LIFETIME' ? 'Pack 5 certifications' : '1 certification'}
                    </p>
                    <p className="text-xs text-th-text-muted">{fmt(p.createdAt)}</p>
                  </div>
                  {p.usedAt ? (
                    <span className="text-xs text-th-text-muted bg-surface-2 border border-th-border rounded-full px-2 py-0.5">
                      Utilisé le {fmt(p.usedAt)}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                      Disponible
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}
