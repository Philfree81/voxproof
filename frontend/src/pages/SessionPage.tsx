import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import { useRecorder } from '../hooks/useRecorder'
import { SET_LABELS, getText, Language, READING_SETS } from '../data/readingTexts'
import api from '../services/api'

type Step = 'setup' | 'recording' | 'review' | 'processing' | 'done'

const LANG_NAMES: Record<Language, string> = { fr: 'Français', en: 'English', es: 'Español' }

const PROCESSING_STEPS = [
  { label: 'Analyse acoustique', detail: 'Mesure du timbre, du rythme et de l\'énergie de votre voix', duration: 18000 },
  { label: 'Calcul de l\'empreinte de session', detail: 'Génération d\'un identifiant unique pour cet enregistrement précis', duration: 22000 },
  { label: 'Modélisation biométrique', detail: 'Construction de votre profil vocal personnel et stable', duration: 35000 },
  { label: 'Ancrage blockchain', detail: 'Inscription immuable de vos empreintes sur la blockchain', duration: 25000 },
  { label: 'Génération du certificat', detail: 'Création du certificat officiel avec vos graphes acoustiques', duration: 10000 },
]

function ProcessingScreen() {
  const [activeStep, setActiveStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let total = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    PROCESSING_STEPS.forEach((s, i) => {
      if (i === PROCESSING_STEPS.length - 1) return
      total += s.duration
      const t = setTimeout(() => setActiveStep(i + 1), total)
      timers.push(t)
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-12 space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Analyse en cours…</h2>
          <p className="text-gray-400 text-sm mt-1">Durée habituelle : 1 à 2 minutes</p>
        </div>

        <div className="space-y-3">
          {PROCESSING_STEPS.map((s, i) => {
            const done = i < activeStep
            const active = i === activeStep
            return (
              <div key={i} className={`rounded-xl border p-4 transition-all duration-500 ${
                done ? 'border-green-200 bg-green-50' :
                active ? 'border-indigo-300 bg-indigo-50' :
                'border-gray-100 bg-white opacity-40'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    done ? 'bg-green-500 text-white' :
                    active ? 'bg-indigo-600 text-white' :
                    'bg-gray-200 text-gray-400'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${done ? 'text-green-700' : active ? 'text-indigo-700' : 'text-gray-400'}`}>
                      {s.label}
                      {active && <span className="ml-2 inline-block w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin align-middle" />}
                    </p>
                    <p className={`text-xs mt-0.5 ${done ? 'text-green-600' : active ? 'text-indigo-500' : 'text-gray-300'}`}>{s.detail}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400">Temps écoulé : {elapsed}s — ne fermez pas cette page</p>
      </div>
    </Layout>
  )
}

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

  // Dynamic text sets from DB (fallback to hardcoded if empty)
  const [dbSets, setDbSets] = useState<Array<{ id: string; name: string; isDefault: boolean; texts: { fr: string[]; en: string[]; es: string[] } }>>([])
  const [selectionMode, setSelectionMode] = useState<'default' | 'random'>('default')

  useEffect(() => {
    api.get('/sessions/text-sets').then(r => {
      if (r.data.sets?.length > 0) {
        setDbSets(r.data.sets)
        const mode = r.data.mode as 'default' | 'random'
        setSelectionMode(mode)
        if (mode === 'random') {
          const idx = Math.floor(Math.random() * r.data.sets.length)
          setSetIndex(idx)
        } else {
          const defIdx = r.data.sets.findIndex((s: any) => s.isDefault)
          if (defIdx >= 0) setSetIndex(defIdx)
        }
      }
    }).catch(() => {})
    api.get('/payments/status')
      .then(r => setHasCredit(r.data.hasCredit))
      .catch(() => setHasCredit(false))
  }, [])

  // Helpers to get text/label from DB sets or fallback to hardcoded
  function getSetLabel(i: number): string {
    return dbSets.length > 0 ? dbSets[i]?.name ?? '' : SET_LABELS[language][i]
  }
  function getSetCount(): number {
    return dbSets.length > 0 ? dbSets.length : READING_SETS.length
  }
  function getTextContent(sIdx: number, tIdx: number, lang: Language): string {
    if (dbSets.length > 0) return dbSets[sIdx]?.texts[lang]?.[tIdx] ?? ''
    return getText(sIdx, tIdx, lang)
  }

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
          {selectionMode === 'random' ? (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎲</span>
                <div>
                  <p className="text-sm font-semibold text-indigo-800">Thème sélectionné aléatoirement</p>
                  <p className="text-indigo-600 text-sm font-medium mt-0.5">{getSetLabel(setIndex)}</p>
                </div>
              </div>
              {dbSets.length > 1 && (
                <button
                  onClick={() => {
                    const newIdx = (setIndex + 1 + Math.floor(Math.random() * (dbSets.length - 1))) % dbSets.length
                    setSetIndex(newIdx)
                  }}
                  className="text-xs text-indigo-600 border border-indigo-300 rounded-lg px-3 py-1.5 hover:bg-indigo-100 transition-colors whitespace-nowrap font-medium"
                >
                  🎲 Nouveau tirage
                </button>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ensemble de textes</label>
              <div className="space-y-2">
                {Array.from({ length: getSetCount() }, (_, i) => getSetLabel(i)).map((label, i) => (
                  <button key={i} onClick={() => setSetIndex(i)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors
                      ${setIndex === i ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-medium' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                    <span className="font-semibold mr-2">{i + 1}.</span>{label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview first text */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Aperçu — Texte 1/5</p>
            <p className="text-sm text-gray-600 leading-relaxed">{getTextContent(setIndex, 0, language)}</p>
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
            {getTextContent(setIndex, recordings.length, language)}
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
                <button
                  onClick={async () => {
                    const r = await api.get('/payments/status')
                    if (r.data.hasCredit) { setHasCredit(true); setPurchasing(false) }
                    else alert('Paiement non encore confirmé. Réessayez dans quelques secondes.')
                  }}
                  className="mt-2 text-xs text-indigo-600 underline hover:text-indigo-800"
                >
                  J'ai payé — vérifier maintenant
                </button>
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
  if (step === 'processing') return <ProcessingScreen />

  // ─── DONE ─────────────────────────────────────────────────────────────────
  if (step === 'done' && result) return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">Signature vocale certifiée !</h1>
          <p className="text-gray-500 text-sm mt-1">Votre empreinte acoustique est ancrée sur la blockchain Avalanche.</p>
        </div>

        {/* Session hash */}
        <div className="bg-gray-900 rounded-xl p-4">
          <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Empreinte de session (SHA-256)</p>
          <p className="text-xs text-gray-500 mb-2">Hash unique de cet enregistrement précis — ancré sur la blockchain</p>
          <p className="text-green-400 font-mono text-xs break-all">{result.acousticHash}</p>
        </div>

        {/* Voice hash */}
        <div className="rounded-xl p-4" style={{ background: '#1e3a5f' }}>
          <p className="text-xs font-semibold uppercase mb-1" style={{ color: '#93c5fd' }}>Empreinte vocale (identité biométrique)</p>
          <p className="text-xs mb-2" style={{ color: '#60a5fa' }}>Hash stable de votre profil vocal — identique à chaque session</p>
          <p className="font-mono text-xs break-all" style={{ color: '#bfdbfe' }}>{result.voiceHash}</p>
        </div>

        {/* Blockchain info */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-gray-500 uppercase">Transaction</span>
            <a
              href={`https://snowtrace.io/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-indigo-600 hover:underline truncate max-w-xs"
            >
              {result.txHash.slice(0, 20)}…{result.txHash.slice(-8)}
            </a>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-gray-500 uppercase">Bloc</span>
            <span className="text-xs font-mono text-gray-700">#{result.blockNumber.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs font-medium text-gray-500 uppercase">Réseau</span>
            <span className="text-xs text-gray-700">Avalanche C-Chain (mainnet)</span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Profil acoustique radar</p>
            <img src={`data:image/png;base64,${result.radarChart}`} alt="Radar" className="w-full" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 text-center">Propriétés détaillées</p>
            <img src={`data:image/png;base64,${result.propertiesChart}`} alt="Properties" className="w-full" />
          </div>
        </div>

        {/* Spectrogram */}
        {result.spectrogram && (
          <div className="rounded-xl overflow-hidden">
            <img src={`data:image/png;base64,${result.spectrogram}`} alt="Spectrogramme" className="w-full" />
          </div>
        )}

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
