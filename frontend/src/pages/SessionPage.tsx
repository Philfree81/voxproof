import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import { useRecorder } from '../hooks/useRecorder'
import { SET_LABELS, getText, Language } from '../data/readingTexts'
import api from '../services/api'

type Step = 'setup' | 'recording' | 'review' | 'processing' | 'done'

const LANG_NAMES: Record<Language, string> = { fr: 'Français', en: 'English', es: 'Español' }

export default function SessionPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { recording, audioBlob, audioUrl, duration, error, start, stop, reset } = useRecorder()

  const [step, setStep] = useState<Step>('setup')
  const [language, setLanguage] = useState<Language>('fr')
  const [setIndex, setSetIndex] = useState(0)
  const [currentText, setCurrentText] = useState(0)
  const [recordings, setRecordings] = useState<Blob[]>([])
  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)
  const [submitError, setSubmitError] = useState('')
  const [hasCredit, setHasCredit] = useState<boolean | null>(null)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    api.get('/payments/status')
      .then(r => setHasCredit(r.data.hasCredit))
      .catch(() => setHasCredit(false))
  }, [])

  function formatDuration(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  function handleStopAndSave() {
    stop()
    setTimeout(() => {
      if (audioBlob) {
        const newRecs = [...recordings, audioBlob]
        const newUrls = [...audioUrls, audioUrl!]
        setRecordings(newRecs)
        setAudioUrls(newUrls)

        if (currentText < 4) {
          setCurrentText(currentText + 1)
          reset()
        } else {
          setStep('review')
        }
      }
    }, 300)
  }

  function handleRetake(index: number) {
    const newRecs = [...recordings]
    const newUrls = [...audioUrls]
    newRecs.splice(index, 1)
    newUrls.splice(index, 1)
    setRecordings(newRecs)
    setAudioUrls(newUrls)
    setCurrentText(index)
    reset()
    setStep('recording')
  }

  async function purchase(priceId: string) {
    setPurchasing(true)
    // Open tab synchronously before any await to avoid popup blockers
    const stripeTab = window.open('', '_blank')
    try {
      const { data } = await api.post('/payments/purchase', { priceId })
      if (stripeTab) stripeTab.location.href = data.url
      else window.location.href = data.url

      // Poll for payment confirmation every 2 s (max 10 min)
      const deadline = Date.now() + 10 * 60 * 1000
      const interval = setInterval(async () => {
        if (Date.now() > deadline) {
          clearInterval(interval)
          setPurchasing(false)
          return
        }
        try {
          const r = await api.get('/payments/status')
          if (r.data.hasCredit) {
            clearInterval(interval)
            stripeTab?.close()
            setHasCredit(true)
            setPurchasing(false)
          }
        } catch { /* ignore */ }
      }, 2000)
    } catch {
      stripeTab?.close()
      setPurchasing(false)
    }
  }

  async function handleSubmit() {
    if (!hasCredit) {
      setSubmitError('purchase_required')
      return
    }
    setStep('processing')
    setSubmitError('')
    try {
      const form = new FormData()
      recordings.forEach((blob, i) => {
        form.append('audio', blob, `audio${i + 1}.webm`)
      })
      form.append('language', language)
      form.append('textSetIndex', String(setIndex))

      const { data } = await api.post('/sessions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      setStep('done')
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Processing failed')
      setStep('review')
    }
  }

  function downloadPdf() {
    const bytes = atob(result.pdf)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob = new Blob([arr], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voxproof-certificate-${result.sessionId.slice(0, 8)}.pdf`
    a.click()
  }

  // ─── SETUP ────────────────────────────────────────────────────────────────
  if (step === 'setup') return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle session vocale</h1>
          <p className="text-gray-500 text-sm mt-1">Vous allez enregistrer 5 textes pour créer votre signature acoustique.</p>
        </div>

        {user?.kycStatus !== 'APPROVED' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm font-medium text-orange-800">⚠ Identité non vérifiée</p>
            <p className="text-xs text-orange-600 mt-1">Votre certificat portera la mention <strong>« Identité non vérifiée »</strong>. Vous pouvez tout de même enregistrer votre signature vocale.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Langue d'enregistrement</label>
            <div className="flex gap-2">
              {(['fr', 'en', 'es'] as Language[]).map(l => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors
                    ${language === l ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {LANG_NAMES[l]}
                </button>
              ))}
            </div>
          </div>

          {/* Text set */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ensemble de textes</label>
            <div className="space-y-2">
              {SET_LABELS[language].map((label, i) => (
                <button key={i} onClick={() => setSetIndex(i)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors
                    ${setIndex === i ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-medium' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                  <span className="font-semibold mr-2">{i + 1}.</span>{label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview first text */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Aperçu — Texte 1/5</p>
            <p className="text-sm text-gray-600 leading-relaxed">{getText(setIndex, 0, language)}</p>
          </div>

          <button onClick={() => setStep('recording')}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Commencer l'enregistrement →
          </button>
        </div>
      </div>
    </Layout>
  )

  // ─── RECORDING ────────────────────────────────────────────────────────────
  if (step === 'recording') return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Enregistrement</h1>
          <span className="text-sm text-gray-500">Texte {recordings.length + 1} / 5</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${
              i < recordings.length ? 'bg-indigo-600' :
              i === recordings.length ? 'bg-indigo-200' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Text to read */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-indigo-400 uppercase mb-3">Lisez ce texte</p>
          <p className="text-base text-gray-800 leading-relaxed">
            {getText(setIndex, recordings.length, language)}
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Recorder controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all
            ${recording ? 'bg-red-100 animate-pulse' : audioBlob ? 'bg-green-100' : 'bg-indigo-50'}`}>
            {recording ? '🔴' : audioBlob ? '✅' : '🎙️'}
          </div>

          {recording && (
            <p className="text-xl font-mono font-bold text-red-600">{formatDuration(duration)}</p>
          )}

          {!audioBlob ? (
            !recording ? (
              <button onClick={start}
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-indigo-700">
                Commencer
              </button>
            ) : (
              <button onClick={handleStopAndSave}
                className="bg-red-600 text-white px-8 py-2.5 rounded-lg font-medium hover:bg-red-700">
                Arrêter et sauvegarder
              </button>
            )
          ) : (
            <div className="w-full space-y-3">
              <audio controls src={audioUrl!} className="w-full" />
              <div className="flex gap-2">
                <button onClick={() => { reset() }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Recommencer
                </button>
                <button onClick={handleStopAndSave}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                  {recordings.length < 4 ? 'Texte suivant →' : 'Terminer ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )

  // ─── REVIEW ───────────────────────────────────────────────────────────────
  if (step === 'review') return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vérification</h1>
          <p className="text-gray-500 text-sm">Réécoutez vos enregistrements avant de soumettre.</p>
        </div>

        {recordings.map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Texte {i + 1}</p>
              <button onClick={() => handleRetake(i)}
                className="text-xs text-indigo-600 hover:underline">Recommencer</button>
            </div>
            <audio controls src={audioUrls[i]} className="w-full h-8" />
          </div>
        ))}

        {submitError && submitError !== 'purchase_required' && (
          <p className="text-red-600 text-sm">{submitError}</p>
        )}

        {hasCredit === false ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-indigo-900">Choisissez votre formule</p>
              <p className="text-xs text-indigo-500 mt-1">Un achat = une signature vocale ancrée sur la blockchain</p>
            </div>
            {purchasing ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-indigo-700">En attente de confirmation du paiement…</p>
                <p className="text-xs text-indigo-400">Complétez le paiement dans l'onglet qui vient de s'ouvrir</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => purchase(import.meta.env.VITE_STRIPE_PRICE_ANNUAL)}
                  className="flex flex-col items-center gap-1 bg-white border-2 border-indigo-300 hover:border-indigo-600 rounded-xl p-4 transition-colors">
                  <span className="text-lg font-bold text-indigo-700">1 an</span>
                  <span className="text-xs text-gray-500">Accès 12 mois</span>
                  <span className="text-sm font-semibold text-gray-800 mt-1">9 €</span>
                </button>
                <button
                  onClick={() => purchase(import.meta.env.VITE_STRIPE_PRICE_LIFETIME)}
                  className="flex flex-col items-center gap-1 bg-indigo-600 hover:bg-indigo-700 rounded-xl p-4 transition-colors">
                  <span className="text-lg font-bold text-white">À vie</span>
                  <span className="text-xs text-indigo-200">Accès permanent</span>
                  <span className="text-sm font-semibold text-white mt-1">29 €</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={handleSubmit}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700">
            Analyser et certifier →
          </button>
        )}
      </div>
    </Layout>
  )

  // ─── PROCESSING ───────────────────────────────────────────────────────────
  if (step === 'processing') return (
    <Layout>
      <div className="max-w-xl mx-auto flex flex-col items-center gap-6 py-16">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Analyse en cours…</h2>
          <p className="text-gray-500 text-sm mt-1">Extraction de la signature acoustique et ancrage blockchain.</p>
        </div>
      </div>
    </Layout>
  )

  // ─── DONE ─────────────────────────────────────────────────────────────────
  if (step === 'done' && result) return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">Signature vocale certifiée !</h1>
          <p className="text-gray-500 text-sm mt-1">Votre empreinte acoustique est ancrée sur la blockchain.</p>
        </div>

        {/* Hash */}
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Empreinte acoustique (SHA-256)</p>
          <p className="text-green-400 font-mono text-xs break-all">{result.acousticHash}</p>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Profil acoustique</p>
            <img src={`data:image/png;base64,${result.radarChart}`} alt="Radar" className="w-full" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Propriétés</p>
            <img src={`data:image/png;base64,${result.propertiesChart}`} alt="Properties" className="w-full" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={downloadPdf}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700">
            Télécharger le certificat PDF
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50">
            Dashboard
          </button>
        </div>
      </div>
    </Layout>
  )

  return null
}
