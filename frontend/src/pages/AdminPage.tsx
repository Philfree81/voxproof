import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import type { AdminUser, Purchase, KycStatus } from '../types'
import type { Theme } from '../store/themeStore'

type Tab = 'users' | 'sessions' | 'texts' | 'activity' | 'config'

const THEME_LABELS: Record<string, { label: string; colors: [string, string] }> = {
  classic:   { label: 'Classic',       colors: ['#4f46e5', '#f9fafb'] },
  futuriste: { label: 'Futuriste',     colors: ['#00e5ff', '#05070f'] },
  blue:      { label: 'VoxProof Blue', colors: ['#1e6fcc', '#deeeff'] },
  sobre:     { label: 'Sobre',         colors: ['#2c3e6b', '#c9a84c'] },
}

function ThemeBadge({ theme }: { theme?: string }) {
  const t = theme && THEME_LABELS[theme] ? THEME_LABELS[theme] : THEME_LABELS['classic']
  return (
    <span className="inline-flex items-center gap-1 text-xs text-th-text-muted">
      <span className="flex gap-0.5">
        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: t.colors[0] }} />
        <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: t.colors[1] }} />
      </span>
      {t.label}
    </span>
  )
}

interface ActivityLog {
  id: string
  action: string
  metadata: Record<string, string>
  ip?: string
  createdAt: string
  user?: { email: string; firstName?: string; lastName?: string }
}

const PREDEFINED_THEMES = [
  { key: 'vocal_threats',  label: 'Menaces sur la voix (deepfakes, vol, tromperies)' },
  { key: 'voice_aging',    label: 'La voix au fil de la vie' },
  { key: 'sovereignty',    label: 'Souveraineté & Dignité' },
  { key: 'action_memory',  label: 'Action & Mémoire' },
  { key: 'voice_impact',   label: "L'importance de la voix" },
]

interface TextSet {
  id: string
  name: string
  theme: string
  isActive: boolean
  isDefault: boolean
  isBuiltin: boolean
  texts: { fr: string[]; en: string[]; es: string[] }
  createdAt: string
}

interface AdminSession {
  id: string
  status: string
  language: string
  txHash?: string
  blockNumber?: number
  anchoredAt?: string
  validUntil?: string | null
  emailSentAt?: string
  kycVerified: boolean
  audioCids?: string[]
  createdAt: string
  user: { email: string; firstName?: string; lastName?: string }
}

const KYC_BADGE: Record<KycStatus, string> = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING:  'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
}

const STATUS_BADGE: Record<string, string> = {
  ANCHORED:   'bg-green-100 text-green-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  FAILED:     'bg-red-100 text-red-700',
  RECORDING:  'bg-gray-100 text-th-text-secondary',
}

function fmt(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editKyc, setEditKyc] = useState<KycStatus>('PENDING')
  const [saving, setSaving] = useState(false)

  // Config tab
  const [defaultTheme, setDefaultTheme] = useState<Theme>('classic')
  const [savingConfig, setSavingConfig] = useState(false)

  async function handleSaveConfig() {
    setSavingConfig(true)
    try {
      await api.put('/admin/config', { defaultTheme })
    } finally {
      setSavingConfig(false)
    }
  }

  // Compare tab
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')
  const [compareResult, setCompareResult] = useState<{ similarity: number; similarityPct: number; verdict: string; sessionA: any; sessionB: any } | null>(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareError, setCompareError] = useState('')

  async function handleCompare() {
    setCompareError('')
    setCompareResult(null)
    setCompareLoading(true)
    try {
      const { data } = await api.post('/admin/sessions/compare', { sessionIdA: compareA.trim(), sessionIdB: compareB.trim() })
      setCompareResult(data)
    } catch (e: any) {
      setCompareError(e.response?.data?.error || 'Erreur lors de la comparaison')
    } finally {
      setCompareLoading(false)
    }
  }

  // Activity tab
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activityFilter, setActivityFilter] = useState('')

  // Texts tab
  const [textSets, setTextSets] = useState<TextSet[]>([])
  const [textMode, setTextMode] = useState<'default' | 'random'>('default')
  const [generating, setGenerating] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('poetry')
  const [expandedSet, setExpandedSet] = useState<string | null>(null)
  const [previewLang, setPreviewLang] = useState<'fr' | 'en' | 'es'>('fr')

  // Manual creation form
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualTheme, setManualTheme] = useState('poetry')
  const emptyTexts = () => Array(5).fill('')
  const [manualTexts, setManualTexts] = useState<{ fr: string[]; en: string[]; es: string[] }>({ fr: emptyTexts(), en: emptyTexts(), es: emptyTexts() })
  const [manualLang, setManualLang] = useState<'fr' | 'en' | 'es'>('fr')
  const [creatingManual, setCreatingManual] = useState(false)

  useEffect(() => {
    if (user && !user.isAdmin) navigate('/', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    api.get('/admin/config').then(r => setDefaultTheme(r.data.defaultTheme)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    let req: Promise<any>
    if (tab === 'config') { setLoading(false); return }
    if (tab === 'users') {
      req = api.get('/admin/users').then(r => { setUsers(r.data); setSessions([]) })
    } else if (tab === 'sessions') {
      req = api.get('/admin/sessions').then(r => { setSessions(r.data); setUsers([]) })
    } else if (tab === 'texts') {
      req = api.get('/admin/text-sets').then(r => {
        setTextSets(r.data.sets)
        setTextMode(r.data.mode)
      })
    } else {
      req = api.get('/admin/activity').then(r => setActivityLogs(r.data))
    }
    req.finally(() => setLoading(false))
  }, [tab])

  async function handleDeleteUser(id: string, email: string) {
    if (!confirm(`Supprimer l'utilisateur ${email} ?`)) return
    await api.delete(`/admin/users/${id}`)
    setUsers(u => u.filter(x => x.id !== id))
  }

  async function handleDeleteCredit(userId: string, purchaseId: string) {
    if (!confirm('Supprimer ce crédit ?')) return
    await api.delete(`/admin/purchases/${purchaseId}`)
    setUsers(u => u.map(x => x.id === userId
      ? { ...x, purchases: x.purchases.filter(p => p.id !== purchaseId) }
      : x
    ))
  }

  async function handleAddCredit(userId: string, productType: 'ANNUAL' | 'LIFETIME') {
    const { data } = await api.post(`/admin/users/${userId}/credit`, { productType })
    setUsers(u => u.map(x => x.id === userId
      ? { ...x, purchases: [data, ...x.purchases] }
      : x
    ))
  }

  function openEdit(u: AdminUser) {
    setEditingUser(u)
    setEditEmail(u.email)
    setEditKyc(u.kycStatus)
  }

  async function handleSaveEdit() {
    if (!editingUser) return
    setSaving(true)
    const { data } = await api.patch(`/admin/users/${editingUser.id}`, {
      email: editEmail,
      kycStatus: editKyc,
    })
    setUsers(u => u.map(x => x.id === editingUser.id ? { ...x, ...data } : x))
    setEditingUser(null)
    setSaving(false)
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const { data } = await api.post('/admin/text-sets/generate', { theme: selectedTheme })
      setTextSets(s => [data, ...s])
    } catch (err: any) {
      alert(err.response?.data?.error || 'Génération échouée')
    } finally {
      setGenerating(false)
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    const { data } = await api.patch(`/admin/text-sets/${id}`, { isActive: !current })
    setTextSets(s => s.map(x => x.id === id ? { ...x, ...data } : x))
  }

  async function handleSetDefault(id: string) {
    const { data } = await api.patch(`/admin/text-sets/${id}`, { isDefault: true })
    setTextSets(s => s.map(x => ({ ...x, isDefault: x.id === id ? data.isDefault : false })))
  }

  async function handleDeleteSet(id: string) {
    if (!confirm('Supprimer ce set de textes ?')) return
    await api.delete(`/admin/text-sets/${id}`)
    setTextSets(s => s.filter(x => x.id !== id))
  }

  async function handleToggleMode() {
    const next = textMode === 'default' ? 'random' : 'default'
    await api.post('/admin/text-sets/mode', { mode: next })
    setTextMode(next)
  }

  async function handleCreateManual() {
    if (!manualName.trim()) return alert('Nom requis')
    if (manualTexts.fr.some(t => !t.trim()) || manualTexts.en.some(t => !t.trim()) || manualTexts.es.some(t => !t.trim())) {
      return alert('Les 5 textes doivent être remplis dans les 3 langues (FR, EN, ES)')
    }
    setCreatingManual(true)
    try {
      const { data } = await api.post('/admin/text-sets', {
        name: manualName.trim(),
        theme: manualTheme,
        texts: manualTexts,
      })
      setTextSets(s => [data, ...s])
      setShowManualForm(false)
      setManualName('')
      setManualTexts({ fr: emptyTexts(), en: emptyTexts(), es: emptyTexts() })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Création échouée')
    } finally {
      setCreatingManual(false)
    }
  }

  async function handleToggleAdmin(u: AdminUser) {
    if (!confirm(`${u.isAdmin ? 'Retirer' : 'Donner'} les droits admin à ${u.email} ?`)) return
    const { data } = await api.patch(`/admin/users/${u.id}`, { isAdmin: !u.isAdmin })
    setUsers(us => us.map(x => x.id === u.id ? { ...x, ...data } : x))
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-panel border-b border-th-border px-4 sm:px-6 py-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-th-text-muted hover:text-th-text-secondary text-sm">← Dashboard</button>
          <h1 className="text-lg font-bold text-th-text-primary">Back-office VoxProof</h1>
        </div>
        <span className="text-xs text-th-text-muted truncate max-w-[120px] sm:max-w-none hidden sm:block">{user?.email}</span>
      </div>

      {/* Tabs */}
      <div className="border-b border-th-border bg-panel px-2 sm:px-6 overflow-x-auto">
        <div className="flex gap-4 sm:gap-6 min-w-max">
          <button onClick={() => setTab('users')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'users' ? 'border-indigo-600 text-th-accent' : 'border-transparent text-th-text-muted hover:text-th-text-secondary'}`}>
            Utilisateurs{users.length ? ` (${users.length})` : ''}
          </button>
          <button onClick={() => setTab('sessions')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'sessions' ? 'border-indigo-600 text-th-accent' : 'border-transparent text-th-text-muted hover:text-th-text-secondary'}`}>
            Sessions{sessions.length ? ` (${sessions.length})` : ''}
          </button>
          <button onClick={() => setTab('texts')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'texts' ? 'border-indigo-600 text-th-accent' : 'border-transparent text-th-text-muted hover:text-th-text-secondary'}`}>
            Textes{textSets.length ? ` (${textSets.length})` : ''}
          </button>
          <button onClick={() => setTab('activity')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'activity' ? 'border-indigo-600 text-th-accent' : 'border-transparent text-th-text-muted hover:text-th-text-secondary'}`}>
            Activité{activityLogs.length ? ` (${activityLogs.length})` : ''}
          </button>
          <button onClick={() => setTab('config')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'config' ? 'border-indigo-600 text-th-accent' : 'border-transparent text-th-text-muted hover:text-th-text-secondary'}`}>
            Config
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'users' ? (
          <div className="space-y-4">
            {users.map(u => (
              <div key={u.id} className="bg-panel rounded-xl border border-th-border p-5">
                {/* User header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-th-text-primary">{u.email}</span>
                      {u.firstName && <span className="text-th-text-muted text-sm">{u.firstName} {u.lastName}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KYC_BADGE[u.kycStatus]}`}>{u.kycStatus}</span>
                      {u.isAdmin && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">ADMIN</span>}
                      <ThemeBadge theme={u.theme} />
                    </div>
                    <p className="text-xs text-th-text-muted mt-1">
                      Inscrit le {fmt(u.createdAt)} · {u.sessions.length} session(s)
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(u)}
                      className="text-xs px-3 py-1.5 border border-th-border rounded-lg hover:bg-surface-2">
                      Éditer
                    </button>
                    <button onClick={() => handleToggleAdmin(u)}
                      className="text-xs px-3 py-1.5 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50">
                      {u.isAdmin ? 'Retirer admin' : 'Rendre admin'}
                    </button>
                    <button onClick={() => handleDeleteUser(u.id, u.email)}
                      className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Sessions */}
                {u.sessions.length > 0 && (
                  <div className="mt-3 border-t border-th-border-light pt-3">
                    <button
                      onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                      className="text-xs text-th-accent hover:underline font-medium">
                      {expandedUser === u.id ? '▲ Masquer' : `▼ Voir ${u.sessions.length} session(s)`}
                    </button>
                    {expandedUser === u.id && (
                      <div className="mt-2 space-y-1">
                        {u.sessions.map(s => (
                          <div key={s.id} className="flex items-center gap-3 text-xs bg-surface-2 rounded-lg px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[s.status] || 'bg-gray-100 text-th-text-secondary'}`}>{s.status}</span>
                            <span className="font-mono text-th-text-muted">{s.id.slice(0, 8)}</span>
                            <span className="text-th-text-muted">{fmt(s.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Credits */}
                <div className="mt-4 border-t border-th-border-light pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-th-text-muted uppercase tracking-wide">Crédits</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleAddCredit(u.id, 'ANNUAL')}
                        className="text-xs px-2.5 py-1 bg-th-accent-subtle text-th-accent rounded-lg hover:bg-indigo-100 font-medium">
                        + 1 an
                      </button>
                      <button onClick={() => handleAddCredit(u.id, 'LIFETIME')}
                        className="text-xs px-2.5 py-1 bg-th-accent text-white rounded-lg hover:bg-th-accent-hover font-medium">
                        + À vie
                      </button>
                    </div>
                  </div>
                  {u.purchases.length === 0 ? (
                    <p className="text-xs text-th-text-muted italic">Aucun crédit</p>
                  ) : (
                    <div className="space-y-1">
                      {u.purchases.map((p: Purchase) => (
                        <div key={p.id} className="flex items-center justify-between text-xs bg-surface-2 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${p.productType === 'LIFETIME' ? 'bg-indigo-100 text-th-accent' : 'bg-blue-100 text-blue-700'}`}>
                              {p.productType === 'LIFETIME' ? 'À vie' : '1 an'}
                            </span>
                            <span className={p.usedAt ? 'text-th-text-muted line-through' : 'text-green-600 font-medium'}>
                              {p.usedAt ? `Utilisé le ${fmt(p.usedAt)}` : 'Disponible'}
                            </span>
                            {p.validUntil && <span className="text-th-text-muted">expire {fmt(p.validUntil)}</span>}
                          </div>
                          <button onClick={() => handleDeleteCredit(u.id, p.id)}
                            className="text-red-400 hover:text-red-600 ml-4">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'texts' ? (
          /* Texts tab */
          <div className="space-y-6">
            {/* Controls */}
            <div className="bg-panel rounded-xl border border-th-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-th-text-primary">Mode de sélection</p>
                  <p className="text-xs text-th-text-muted mt-0.5">
                    {textMode === 'default' ? 'L\'utilisateur choisit son thème' : 'Un set actif est tiré au sort à chaque session'}
                  </p>
                </div>
                <button onClick={handleToggleMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${textMode === 'random' ? 'bg-th-accent' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-panel shadow transition-transform ${textMode === 'random' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs font-medium text-th-text-secondary ml-2">{textMode === 'random' ? 'Aléatoire' : 'Choix libre'}</span>
              </div>

              <div className="border-t border-th-border-light pt-4">
                <p className="text-sm font-semibold text-th-text-primary mb-3">Générer un nouveau set avec l'IA</p>
                <div className="flex gap-3 flex-wrap">
                  <select value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)}
                    className="border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent">
                    {PREDEFINED_THEMES.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-2 bg-th-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-th-accent-hover disabled:opacity-50">
                    {generating
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Génération…</>
                      : '✦ Générer avec l\'IA'
                    }
                  </button>
                </div>
              </div>

              <div className="border-t border-th-border-light pt-4">
                <button onClick={() => setShowManualForm(v => !v)}
                  className="text-sm font-semibold text-th-text-secondary hover:text-th-accent flex items-center gap-2">
                  {showManualForm ? '▲' : '▼'} Créer manuellement un set
                </button>

                {showManualForm && (
                  <div className="mt-4 space-y-4">
                    <div className="flex gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-th-text-secondary mb-1">Nom du set</label>
                        <input value={manualName} onChange={e => setManualName(e.target.value)}
                          placeholder="Ex: Philosophie stoïcienne"
                          className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-th-text-secondary mb-1">Thème</label>
                        <select value={manualTheme} onChange={e => setManualTheme(e.target.value)}
                          className="border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent">
                          {PREDEFINED_THEMES.map(t => (
                            <option key={t.key} value={t.key}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex gap-2 mb-3">
                        <span className="text-xs font-medium text-th-text-secondary self-center">Langue :</span>
                        {(['fr', 'en', 'es'] as const).map(l => (
                          <button key={l} onClick={() => setManualLang(l)}
                            className={`text-xs px-2.5 py-1 rounded-lg border ${manualLang === l ? 'bg-th-accent text-white border-indigo-600' : 'border-th-border text-th-text-secondary hover:bg-surface-2'}`}>
                            {l.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-2">
                        {manualTexts[manualLang].map((text, i) => (
                          <div key={i}>
                            <label className="block text-xs text-th-text-muted mb-0.5">Texte {i + 1}</label>
                            <textarea
                              value={text}
                              onChange={e => {
                                const updated = [...manualTexts[manualLang]]
                                updated[i] = e.target.value
                                setManualTexts(prev => ({ ...prev, [manualLang]: updated }))
                              }}
                              rows={3}
                              placeholder={`Texte ${i + 1} en ${manualLang.toUpperCase()}…`}
                              className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={handleCreateManual} disabled={creatingManual}
                        className="bg-th-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-th-accent-hover disabled:opacity-50">
                        {creatingManual ? 'Création…' : 'Créer le set'}
                      </button>
                      <button onClick={() => { setShowManualForm(false); setManualName(''); setManualTexts({ fr: emptyTexts(), en: emptyTexts(), es: emptyTexts() }) }}
                        className="border border-th-border text-th-text-secondary px-4 py-2 rounded-lg text-sm hover:bg-surface-2">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sets list */}
            {textSets.length === 0 ? (
              <p className="text-sm text-th-text-muted text-center py-8">Aucun set disponible.</p>
            ) : textSets.map(s => (
              <div key={s.id} className={`bg-panel rounded-xl border p-5 ${s.isDefault ? 'border-th-accent' : s.isActive ? 'border-th-border' : 'border-th-border-light opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-th-text-primary">{s.name}</span>
                    {s.isBuiltin && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Standard</span>}
                    {s.isDefault && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-th-accent font-medium">Par défaut</span>}
                    {!s.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-th-text-muted">Inactif</span>}
                    <span className="text-xs text-th-text-muted">{fmt(s.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!s.isBuiltin && !s.isDefault && s.isActive && (
                      <button onClick={() => handleSetDefault(s.id)}
                        className="text-xs px-2.5 py-1 border border-th-accent text-th-accent rounded-lg hover:bg-th-accent-subtle">
                        Défaut
                      </button>
                    )}
                    <button onClick={() => handleToggleActive(s.id, s.isActive)}
                      className="text-xs px-2.5 py-1 border border-th-border text-th-text-secondary rounded-lg hover:bg-surface-2">
                      {s.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                    {!s.isBuiltin && (
                      <button onClick={() => handleDeleteSet(s.id)}
                        className="text-xs px-2.5 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                <button onClick={() => setExpandedSet(expandedSet === s.id ? null : s.id)}
                  className="text-xs text-th-accent hover:underline mt-2">
                  {expandedSet === s.id ? '▲ Masquer les textes' : '▼ Voir les textes'}
                </button>

                {expandedSet === s.id && (
                  <div className="mt-3 border-t border-th-border-light pt-3 space-y-3">
                    <div className="flex gap-2">
                      {(['fr', 'en', 'es'] as const).map(l => (
                        <button key={l} onClick={() => setPreviewLang(l)}
                          className={`text-xs px-2.5 py-1 rounded-lg border ${previewLang === l ? 'bg-th-accent text-white border-indigo-600' : 'border-th-border text-th-text-secondary hover:bg-surface-2'}`}>
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {s.texts[previewLang].map((text, i) => (
                      <div key={i} className="bg-surface-2 rounded-lg p-3">
                        <p className="text-xs font-semibold text-th-text-muted mb-1">Texte {i + 1}</p>
                        <p className="text-sm text-th-text-secondary leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : tab === 'activity' ? (
          /* Activity tab */
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {['', 'REGISTER', 'REGISTER_FAILED', 'LOGIN', 'LOGIN_FAILED', 'PURCHASE', 'PAYMENT_FAILED', 'SESSION_ANCHORED', 'PDF_DOWNLOADED', 'TEXTS_DOWNLOADED'].map(a => (
                <button key={a} onClick={() => setActivityFilter(a)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${activityFilter === a ? 'bg-th-accent text-white border-indigo-600' : 'border-th-border text-th-text-secondary hover:bg-surface-2'}`}>
                  {a || 'Tout'}
                </button>
              ))}
            </div>

            <div className="bg-panel rounded-xl border border-th-border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-surface-2 border-b border-th-border">
                  <tr>
                    {['Date', 'Action', 'Utilisateur', 'Détails', 'IP'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-th-text-muted uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border-light">
                  {activityLogs
                    .filter(l => !activityFilter || l.action === activityFilter)
                    .map(l => (
                    <tr key={l.id} className="hover:bg-surface-2">
                      <td className="px-4 py-3 text-xs text-th-text-muted whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          l.action === 'REGISTER' ? 'bg-blue-100 text-blue-700' :
                          l.action === 'REGISTER_FAILED' ? 'bg-red-100 text-red-600' :
                          l.action === 'LOGIN' ? 'bg-gray-100 text-th-text-secondary' :
                          l.action === 'LOGIN_FAILED' ? 'bg-red-100 text-red-600' :
                          l.action === 'PURCHASE' ? 'bg-green-100 text-green-700' :
                          l.action === 'PAYMENT_FAILED' ? 'bg-red-100 text-red-600' :
                          l.action === 'SESSION_ANCHORED' ? 'bg-indigo-100 text-th-accent' :
                          l.action === 'PDF_DOWNLOADED' ? 'bg-violet-100 text-violet-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>{l.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {l.user ? (
                          <div>
                            <p className="font-medium text-gray-800">{l.user.email}</p>
                            {l.user.firstName && <p className="text-th-text-muted">{l.user.firstName} {l.user.lastName}</p>}
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-th-text-muted font-mono">
                        {l.metadata && Object.entries(l.metadata)
                          .filter(([k]) => !['email'].includes(k))
                          .map(([k, v]) => <span key={k} className="mr-2">{k}: {String(v).slice(0, 20)}</span>)
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-th-text-muted font-mono">{l.ip ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {activityLogs.filter(l => !activityFilter || l.action === activityFilter).length === 0 && (
                <p className="text-center text-sm text-th-text-muted py-8">Aucune activité enregistrée.</p>
              )}
            </div>
          </div>
        ) : tab === 'config' ? (
          <div className="max-w-lg space-y-8">
            <div className="bg-panel rounded-2xl border border-th-border p-6">
              <h2 className="text-base font-bold text-th-text-primary mb-1">Thème par défaut</h2>
              <p className="text-sm text-th-text-muted mb-5">
                Appliqué aux visiteurs qui n'ont pas encore choisi de thème.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(THEME_LABELS) as [Theme, typeof THEME_LABELS[string]][]).map(([id, t]) => (
                  <button
                    key={id}
                    onClick={() => setDefaultTheme(id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors text-left ${
                      defaultTheme === id
                        ? 'border-th-accent bg-th-accent-subtle text-th-accent'
                        : 'border-th-border text-th-text-secondary hover:bg-surface-2'
                    }`}
                  >
                    <span className="flex gap-0.5 shrink-0">
                      <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: t.colors[0] }} />
                      <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: t.colors[1] }} />
                    </span>
                    {t.label}
                    {defaultTheme === id && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="mt-5 w-full bg-th-accent text-white py-2.5 rounded-xl font-medium hover:bg-th-accent-hover disabled:opacity-50 transition-colors text-sm"
              >
                {savingConfig ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          /* Sessions tab */
          <div className="space-y-6">

          {/* ── Comparaison vocale ── */}
          <div className="bg-panel rounded-xl border border-th-border p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">Comparer 2 voix</h3>
            <p className="text-xs text-th-text-muted">Entrez les IDs de deux sessions pour calculer la similarité cosinus entre leurs empreintes vocales.</p>
            <div className="flex gap-3 flex-wrap">
              <input value={compareA} onChange={e => setCompareA(e.target.value)} placeholder="Session ID A"
                className="flex-1 min-w-48 border border-th-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-th-accent" />
              <input value={compareB} onChange={e => setCompareB(e.target.value)} placeholder="Session ID B"
                className="flex-1 min-w-48 border border-th-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-th-accent" />
              <button onClick={handleCompare} disabled={!compareA || !compareB || compareLoading}
                className="px-4 py-2 bg-th-accent text-white rounded-lg text-sm font-medium hover:bg-th-accent-hover disabled:opacity-50">
                {compareLoading ? 'Calcul…' : 'Comparer'}
              </button>
            </div>
            {compareError && <p className="text-sm text-red-600">{compareError}</p>}
            {compareResult && (
              <div className={`rounded-xl p-4 border-2 ${
                compareResult.verdict === 'same_speaker_high_confidence' ? 'bg-green-50 border-green-300' :
                compareResult.verdict === 'same_speaker_likely' ? 'bg-blue-50 border-blue-300' :
                compareResult.verdict === 'uncertain' ? 'bg-yellow-50 border-yellow-300' :
                'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-center">
                    <p className="text-3xl font-bold font-mono text-gray-800">{compareResult.similarityPct.toFixed(1)}%</p>
                    <p className="text-xs text-th-text-muted">similarité cosinus</p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${
                      compareResult.verdict === 'same_speaker_high_confidence' ? 'text-green-700' :
                      compareResult.verdict === 'same_speaker_likely' ? 'text-blue-700' :
                      compareResult.verdict === 'uncertain' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>{
                      compareResult.verdict === 'same_speaker_high_confidence' ? '✓ Même locuteur — haute confiance (≥90%)' :
                      compareResult.verdict === 'same_speaker_likely' ? '~ Même locuteur probable (≥80%)' :
                      compareResult.verdict === 'uncertain' ? '? Incertain (≥70%)' :
                      '✗ Locuteurs différents (<70%)'
                    }</p>
                    <p className="text-xs text-th-text-muted mt-1">
                      Session A : {compareResult.sessionA.email} — {new Date(compareResult.sessionA.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-th-text-muted">
                      Session B : {compareResult.sessionB.email} — {new Date(compareResult.sessionB.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Liste des sessions ── */}
          <div className="bg-panel rounded-xl border border-th-border overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-th-border">
                <tr>
                  {['Utilisateur', 'Statut', 'Lng', 'KYC', 'TxHash', 'Ancré le', 'Valide', 'Email', 'Audios', 'Comparer'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-th-text-muted uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-light">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-th-text-primary">{s.user.email}</div>
                      {s.user.firstName && <div className="text-th-text-muted">{s.user.firstName} {s.user.lastName}</div>}
                      <div className="font-mono text-th-text-muted text-[10px] cursor-pointer hover:text-th-accent"
                        title={s.id} onClick={() => navigator.clipboard.writeText(s.id)}>
                        {s.id.slice(0, 8)}… <span className="text-gray-300">(copier)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[s.status] || ''}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-th-text-secondary">{s.language.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.kycVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {s.kycVerified ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.txHash ? (
                        <a href={`https://snowtrace.io/tx/${s.txHash}`} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs text-th-accent hover:underline">
                          {s.txHash.slice(0, 10)}…
                        </a>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-th-text-secondary">{fmt(s.anchoredAt)}</td>
                    <td className="px-4 py-3 text-xs text-th-text-secondary">{s.validUntil ? fmt(s.validUntil) : '∞'}</td>
                    <td className="px-4 py-3 text-xs text-th-text-secondary">{s.emailSentAt ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-xs text-th-text-secondary">
                      {s.audioCids && s.audioCids.length > 0
                        ? <span className="text-green-600 font-medium">{s.audioCids.length} fichier(s)</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setCompareA(s.id)}
                          className={`text-xs px-2 py-1 rounded font-medium border transition-colors ${compareA === s.id ? 'bg-th-accent text-white border-indigo-600' : 'border-th-border text-th-text-secondary hover:bg-surface-2'}`}>
                          → A
                        </button>
                        <button onClick={() => setCompareB(s.id)}
                          className={`text-xs px-2 py-1 rounded font-medium border transition-colors ${compareB === s.id ? 'bg-violet-600 text-white border-violet-600' : 'border-th-border text-th-text-secondary hover:bg-surface-2'}`}>
                          → B
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-panel rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-th-text-primary">Modifier l'utilisateur</h2>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Email</label>
              <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">Statut KYC</label>
              <select value={editKyc} onChange={e => setEditKyc(e.target.value as KycStatus)}
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent">
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingUser(null)}
                className="flex-1 border border-th-border text-th-text-secondary py-2 rounded-xl text-sm hover:bg-surface-2">
                Annuler
              </button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 bg-th-accent text-white py-2 rounded-xl text-sm font-medium hover:bg-th-accent-hover disabled:opacity-50">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
