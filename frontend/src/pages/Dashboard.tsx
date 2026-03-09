import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import { useAuthStore } from '../store/authStore'
import { VoiceSession, SpectrogramMetrics } from '../types'
import api from '../services/api'
import { getSet, SET_LABELS } from '../data/readingTexts'
import type { Language } from '../data/readingTexts'

const LANG_FLAG: Record<string, string> = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸' }

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ANCHORED:   { label: 'Certifiée',   cls: 'bg-green-100 text-green-700' },
  PROCESSING: { label: 'En cours…',  cls: 'bg-yellow-100 text-yellow-700' },
  FAILED:     { label: 'Échouée',    cls: 'bg-red-100 text-red-700' },
  RECORDING:  { label: 'Incomplète', cls: 'bg-gray-100 text-th-text-secondary' },
}


function SpectrogramMetricsPanel({ m }: { m: SpectrogramMetrics }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 pb-3">
      <div className="bg-slate-800 rounded-lg px-3 py-2 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Centroïde</p>
        <p className="text-sm font-mono text-white font-semibold">{Math.round(m.centroide_hz)} Hz</p>
      </div>
      <div className="bg-slate-800 rounded-lg px-3 py-2 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Rolloff 85%</p>
        <p className="text-sm font-mono text-white font-semibold">{Math.round(m.rolloff_hz)} Hz</p>
      </div>
      <div className="bg-slate-800 rounded-lg px-3 py-2 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Variabilité</p>
        <p className="text-sm font-mono text-white font-semibold">{(m.variabilite * 100).toFixed(0)} %</p>
      </div>
      <div className="bg-slate-700 rounded-lg px-3 py-2 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Graves &lt;500Hz</p>
        <p className="text-sm font-mono text-white font-semibold">{m.energie_grave_pct.toFixed(1)} %</p>
      </div>
      <div className="bg-slate-700 rounded-lg px-3 py-2 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Médium 500-3kHz</p>
        <p className="text-sm font-mono text-white font-semibold">{m.energie_medium_pct.toFixed(1)} %</p>
      </div>
      <div className="bg-slate-700 rounded-lg px-3 py-2 text-center">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Aigus &gt;3kHz</p>
        <p className="text-sm font-mono text-white font-semibold">{m.energie_aigu_pct.toFixed(1)} %</p>
      </div>
    </div>
  )
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Dashboard() {
  const { user, fetchMe } = useAuthStore()
  const [sessions, setSessions] = useState<VoiceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    if (!user) fetchMe()
  }, [])

  useEffect(() => {
    if (!user) return
    api.get('/sessions')
      .then(r => setSessions(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
    api.get('/payments/credits')
      .then(r => setCredits(r.data.available))
      .catch(() => {})
  }, [user])

  async function purchase(priceId: string) {
    setPurchasing(true)
    const stripeTab = window.open('', '_blank')
    try {
      const { data } = await api.post('/payments/purchase', { priceId })
      if (stripeTab) stripeTab.location.href = data.url
      else window.location.href = data.url
      const deadline = Date.now() + 10 * 60 * 1000
      const interval = setInterval(async () => {
        if (Date.now() > deadline) { clearInterval(interval); setPurchasing(false); return }
        try {
          const r = await api.get('/payments/credits')
          if (r.data.available > (credits ?? 0)) {
            clearInterval(interval); stripeTab?.close()
            setCredits(r.data.available); setPurchasing(false)
          }
        } catch { /* ignore */ }
      }, 2000)
    } catch { stripeTab?.close(); setPurchasing(false) }
  }

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', '/dashboard')
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

  function downloadTexts(s: VoiceSession) {
    const lang = s.language as Language
    const texts = getSet(s.textSetIndex, lang)
    const setLabel = SET_LABELS[lang]?.[s.textSetIndex] ?? `Set ${s.textSetIndex}`
    const lines = [
      `VoxProof — Textes de certification vocale`,
      `Session : ${s.id}`,
      `Ensemble : ${setLabel}`,
      `Langue : ${lang.toUpperCase()}`,
      `Date : ${formatDate(s.createdAt)}`,
      ``,
      ...texts.map((t, i) => `Texte ${i + 1} :\n${t}`).join('\n\n').split('\n'),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voxproof-textes-${s.id.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Mes certifications</h1>
            <p className="text-th-text-muted text-sm mt-0.5">
              {user?.firstName ? `Bienvenue, ${user.firstName}` : user?.email}
            </p>
          </div>
          <Link to="/session/new"
            className="bg-th-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-th-accent-hover">
            + Nouvelle certification
          </Link>
        </div>

        {/* Credits widget */}
        {credits !== null && (
          credits > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-green-700">{credits}</span>
                <span className="text-sm text-green-700">crédit{credits > 1 ? 's' : ''} disponible{credits > 1 ? 's' : ''}</span>
              </div>
              <Link to="/session/new" className="text-sm font-medium text-green-700 hover:underline">
                Lancer une certification →
              </Link>
            </div>
          ) : (
            <div className="bg-panel border border-th-border rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-th-text-muted">Aucun crédit disponible</p>
              {purchasing ? (
                <span className="text-sm text-th-accent flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-th-accent border-t-transparent rounded-full animate-spin inline-block" />
                  En attente…
                </span>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => purchase(import.meta.env.VITE_STRIPE_PRICE_ANNUAL)}
                    className="text-xs border border-th-border text-th-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-2 transition-colors">
                    1 cert — 14 €
                  </button>
                  <button onClick={() => purchase(import.meta.env.VITE_STRIPE_PRICE_LIFETIME)}
                    className="text-xs bg-th-accent text-white px-3 py-1.5 rounded-lg hover:bg-th-accent-hover transition-colors">
                    Pack 5 — 57 €
                  </button>
                </div>
              )}
            </div>
          )
        )}


        {/* Sessions list */}
        <div>
          <h2 className="text-sm font-semibold text-th-text-muted uppercase tracking-wide mb-3">
            Mes sessions vocales
          </h2>

          {loading ? (
            <div className="bg-panel rounded-2xl border border-th-border p-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-panel rounded-2xl border border-th-border p-8 text-center">
              <p className="text-th-text-muted text-sm">Aucune session vocale pour l'instant.</p>
              <Link to="/session/new"
                className="mt-3 inline-block text-th-accent text-sm font-medium hover:underline">
                Créer votre première signature vocale →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map(s => {
                const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.RECORDING
                const canDelete = s.status === 'FAILED' || s.status === 'RECORDING'
                const isAnchored = s.status === 'ANCHORED'

                const headerBg = isAnchored
                  ? 'bg-slate-800'
                  : s.status === 'PROCESSING' ? 'bg-amber-50 border-b border-amber-100'
                  : s.status === 'FAILED' ? 'bg-red-50 border-b border-red-100'
                  : 'bg-surface-2 border-b border-th-border-light'

                const kycBadgeCls = isAnchored
                  ? (s.kycVerified ? 'bg-green-500/20 text-green-100' : 'bg-orange-400/20 text-orange-100')
                  : (s.kycVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')

                const subtitle = isAnchored
                  ? `Certifiée le ${formatDate(s.anchoredAt)} · Session ${s.id.slice(0, 8)}`
                  : `Session ${s.id.slice(0, 8)} · Créée le ${formatDate(s.createdAt)}`

                return (
                  <div key={s.id} className={`rounded-2xl border overflow-hidden ${isAnchored ? 'border-indigo-200 shadow-sm' : 'border-th-border'}`}>

                    {/* ── Header ── */}
                    <div className={`px-6 py-4 flex items-center justify-between flex-wrap gap-3 ${headerBg}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{LANG_FLAG[s.language] ?? '🌐'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isAnchored ? 'bg-panel/20 text-white border border-white/30' : badge.cls}`}>
                              {badge.label}
                            </span>
                            {s.kycVerified
                              ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${kycBadgeCls}`}>✓ Identité vérifiée</span>
                              : <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${kycBadgeCls}`}>⚠ Non vérifiée</span>
                            }
                          </div>
                          <p className={`text-xs mt-0.5 ${isAnchored ? 'text-slate-400' : 'text-th-text-muted'}`}>
                            {subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isAnchored && (
                          <button onClick={() => downloadPdf(s.id)} disabled={downloading === s.id}
                            className="text-xs bg-panel text-indigo-700 px-4 py-2 rounded-lg font-semibold hover:bg-th-accent-subtle disabled:opacity-60">
                            {downloading === s.id ? '…' : '↓ Certificat PDF'}
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => deleteSession(s.id)} disabled={deleting === s.id}
                            className="text-xs border border-red-200 text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 font-medium">
                            {deleting === s.id ? '…' : 'Supprimer'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Corps session non-ancrée ── */}
                    {!isAnchored && (
                      <div className="bg-panel px-6 py-4 flex items-center justify-between">
                        {s.status === 'PROCESSING' && (
                          <div className="flex items-center gap-3 text-amber-700">
                            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                            <p className="text-xs">Analyse et ancrage en cours, cela peut prendre quelques minutes…</p>
                          </div>
                        )}
                        {s.status === 'FAILED' && (
                          <p className="text-xs text-red-500">L'ancrage a échoué. Vous pouvez supprimer cette session et en créer une nouvelle.</p>
                        )}
                        {s.status === 'RECORDING' && (
                          <>
                            <p className="text-xs text-th-text-muted">Session incomplète — l'enregistrement n'a pas été finalisé.</p>
                            <Link to={`/session/${s.id}`}
                              className="shrink-0 ml-4 text-xs bg-th-accent text-white px-3 py-1.5 rounded-lg hover:bg-th-accent-hover font-medium">
                              Continuer →
                            </Link>
                          </>
                        )}
                      </div>
                    )}

                    {/* ── Corps session ancrée ── */}
                    {isAnchored && (
                      <div className="bg-surface-2 p-6 space-y-5">

                        {/* ── Empreintes ── */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-th-text-muted uppercase tracking-wide">Empreintes cryptographiques</p>
                          <div className="bg-slate-800 rounded-xl px-4 py-3">
                            <p className="text-xs text-slate-400 font-semibold uppercase mb-1">SHA-256 session</p>
                            <p className="font-mono text-xs text-white break-all">{s.acousticHash}</p>
                          </div>
                          {s.voiceHash && (
                            <div className="bg-slate-700 rounded-xl px-4 py-3">
                              <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Empreinte vocale biométrique</p>
                              <p className="font-mono text-xs text-white break-all">{s.voiceHash}</p>
                            </div>
                          )}
                        </div>

                        {/* ── Blockchain + Radar ── */}
                        {(s.txHash || s.radarChartBase64) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

                            {/* Colonne gauche : blockchain */}
                            {s.txHash && (
                              <div className="flex flex-col">
                                <p className="text-xs font-semibold text-th-text-muted uppercase tracking-wide mb-2">Ancrage blockchain</p>
                                <div className="bg-panel rounded-xl border border-th-border divide-y divide-th-border-light flex-1">
                                  <div className="px-4 py-3 flex items-center justify-center">
                                    <p className="text-sm font-bold text-th-text-secondary">Infos blockchain</p>
                                  </div>
                                  <div className="px-4 py-3 flex flex-col justify-center">
                                    <p className="text-xs text-th-text-muted uppercase font-semibold tracking-wide">Réseau</p>
                                    <p className="text-sm text-gray-800 font-medium mt-0.5">Avalanche C-Chain</p>
                                  </div>
                                  <div className="px-4 py-3 flex flex-col justify-center">
                                    <p className="text-xs text-th-text-muted uppercase font-semibold tracking-wide">Bloc</p>
                                    <p className="text-sm font-mono text-gray-800 font-medium mt-0.5">#{s.blockNumber?.toLocaleString()}</p>
                                  </div>
                                  <div className="px-4 py-3 flex flex-col justify-center">
                                    <p className="text-xs text-th-text-muted uppercase font-semibold tracking-wide">Transaction</p>
                                    <a href={`https://snowtrace.io/tx/${s.txHash}`} target="_blank" rel="noopener noreferrer"
                                      className="text-sm font-mono text-th-accent hover:underline mt-0.5 block break-all">
                                      {s.txHash}
                                    </a>
                                  </div>
                                  <div className="px-4 py-3 flex flex-col justify-center">
                                    <p className="text-xs text-th-text-muted uppercase font-semibold tracking-wide">Prochain enregistrement conseillé</p>
                                    <p className="text-sm text-gray-800 font-medium mt-0.5">
                                      {s.validUntil ? formatDate(s.validUntil) : '—'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Colonne droite : radar */}
                            {s.radarChartBase64 && (
                              <div className="flex flex-col">
                                <p className="text-xs font-semibold text-th-text-muted uppercase tracking-wide mb-2">Profil acoustique</p>
                                <div className="bg-panel rounded-xl border border-th-border divide-y divide-th-border-light flex-1 flex flex-col">
                                  <div className="px-4 py-3 flex items-center justify-center">
                                    <p className="text-sm font-bold text-th-text-secondary">Profil acoustique</p>
                                  </div>
                                  <div className="p-2 flex-1 flex items-center justify-center">
                                    <img src={`data:image/png;base64,${s.radarChartBase64}`} alt="Radar" className="w-3/4" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Propriétés + Spectrogramme ── */}
                        {(s.propertiesChartBase64 || s.spectrogramBase64) && (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-th-text-muted uppercase tracking-wide">Analyse acoustique</p>
                            {s.propertiesChartBase64 && (
                              <div className="bg-panel rounded-xl border border-th-border p-2 flex flex-col items-center">
                                <p className="text-xs text-th-text-muted text-center mb-1 font-medium">Propriétés acoustiques</p>
                                <img src={`data:image/png;base64,${s.propertiesChartBase64}`} alt="Propriétés" className="w-3/4" />
                              </div>
                            )}
                            {s.spectrogramBase64 && (
                              <div className="rounded-xl overflow-hidden border border-th-border bg-[#0f172a]">
                                <div className="flex justify-center">
                                  <img src={`data:image/png;base64,${s.spectrogramBase64}`} alt="Spectrogramme" className="w-3/4" />
                                </div>
                                {s.spectrogramMetrics && (
                                  <SpectrogramMetricsPanel m={s.spectrogramMetrics} />
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Téléchargements ── */}
                        <div>
                          <p className="text-xs font-semibold text-th-text-muted uppercase tracking-wide mb-2">Téléchargements</p>
                          <div className="flex gap-2 flex-wrap">
                            <button onClick={() => downloadTexts(s)}
                              className="text-xs border border-th-border text-th-text-secondary px-3 py-1.5 rounded-lg hover:bg-surface-2 font-medium">
                              ↓ Textes lus
                            </button>
                            {s.audioCids && s.audioCids.length > 0 && s.audioCids.map((cid, i) => (
                              <a key={cid} href={`https://gateway.pinata.cloud/ipfs/${cid}`}
                                download={`voxproof-${s.id.slice(0, 8)}-audio${i + 1}.webm`}
                                title={s.audioUnpinAt ? `Disponible jusqu'au ${formatDate(s.audioUnpinAt)}` : ''}
                                className="text-xs border border-indigo-200 text-th-accent px-3 py-1.5 rounded-lg hover:bg-th-accent-subtle font-medium">
                                ↓ Audio {i + 1}
                              </a>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
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
