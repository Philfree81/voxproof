import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import type { AdminUser, Purchase, KycStatus } from '../types'

type Tab = 'users' | 'sessions' | 'texts' | 'activity'

interface ActivityLog {
  id: string
  action: string
  metadata: Record<string, string>
  ip?: string
  createdAt: string
  user?: { email: string; firstName?: string; lastName?: string }
}

const PREDEFINED_THEMES = [
  { key: 'poetry',      label: 'Poésie classique' },
  { key: 'cinema',      label: 'Dialogues de cinéma' },
  { key: 'literature',  label: 'Littérature romanesque' },
  { key: 'philosophy',  label: 'Philosophie & Sagesse' },
  { key: 'nature',      label: 'Nature & Paysages' },
  { key: 'history',     label: 'Histoire & Civilisations' },
  { key: 'tale',        label: 'Conte & Imaginaire' },
  { key: 'sport',       label: 'Sport & Dépassement' },
  { key: 'science',     label: 'Science & Découverte' },
  { key: 'identity',    label: 'Identité & Mémoire' },
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
  RECORDING:  'bg-gray-100 text-gray-600',
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

  useEffect(() => {
    if (user && !user.isAdmin) navigate('/', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    setLoading(true)
    let req: Promise<any>
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

  async function handleToggleAdmin(u: AdminUser) {
    if (!confirm(`${u.isAdmin ? 'Retirer' : 'Donner'} les droits admin à ${u.email} ?`)) return
    const { data } = await api.patch(`/admin/users/${u.id}`, { isAdmin: !u.isAdmin })
    setUsers(us => us.map(x => x.id === u.id ? { ...x, ...data } : x))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</button>
          <h1 className="text-lg font-bold text-gray-900">Back-office VoxProof</h1>
        </div>
        <span className="text-xs text-gray-400">{user?.email}</span>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-6">
          <button onClick={() => setTab('users')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Utilisateurs{users.length ? ` (${users.length})` : ''}
          </button>
          <button onClick={() => setTab('sessions')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'sessions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Sessions{sessions.length ? ` (${sessions.length})` : ''}
          </button>
          <button onClick={() => setTab('texts')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'texts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Textes{textSets.length ? ` (${textSets.length})` : ''}
          </button>
          <button onClick={() => setTab('activity')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'activity' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Activité{activityLogs.length ? ` (${activityLogs.length})` : ''}
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'users' ? (
          <div className="space-y-4">
            {users.map(u => (
              <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5">
                {/* User header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{u.email}</span>
                      {u.firstName && <span className="text-gray-500 text-sm">{u.firstName} {u.lastName}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KYC_BADGE[u.kycStatus]}`}>{u.kycStatus}</span>
                      {u.isAdmin && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">ADMIN</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Inscrit le {fmt(u.createdAt)} · {u.sessions.length} session(s)
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(u)}
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
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
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                      className="text-xs text-indigo-600 hover:underline font-medium">
                      {expandedUser === u.id ? '▲ Masquer' : `▼ Voir ${u.sessions.length} session(s)`}
                    </button>
                    {expandedUser === u.id && (
                      <div className="mt-2 space-y-1">
                        {u.sessions.map(s => (
                          <div key={s.id} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[s.status] || 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                            <span className="font-mono text-gray-400">{s.id.slice(0, 8)}</span>
                            <span className="text-gray-400">{fmt(s.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Credits */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Crédits</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleAddCredit(u.id, 'ANNUAL')}
                        className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium">
                        + 1 an
                      </button>
                      <button onClick={() => handleAddCredit(u.id, 'LIFETIME')}
                        className="text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                        + À vie
                      </button>
                    </div>
                  </div>
                  {u.purchases.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Aucun crédit</p>
                  ) : (
                    <div className="space-y-1">
                      {u.purchases.map((p: Purchase) => (
                        <div key={p.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${p.productType === 'LIFETIME' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                              {p.productType === 'LIFETIME' ? 'À vie' : '1 an'}
                            </span>
                            <span className={p.usedAt ? 'text-gray-400 line-through' : 'text-green-600 font-medium'}>
                              {p.usedAt ? `Utilisé le ${fmt(p.usedAt)}` : 'Disponible'}
                            </span>
                            {p.validUntil && <span className="text-gray-400">expire {fmt(p.validUntil)}</span>}
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
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Mode de sélection</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {textMode === 'default' ? 'L\'utilisateur choisit son thème' : 'Un set actif est tiré au sort à chaque session'}
                  </p>
                </div>
                <button onClick={handleToggleMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${textMode === 'random' ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${textMode === 'random' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs font-medium text-gray-600 ml-2">{textMode === 'random' ? 'Aléatoire' : 'Choix libre'}</span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Générer un nouveau set avec l'IA</p>
                <div className="flex gap-3 flex-wrap">
                  <select value={selectedTheme} onChange={e => setSelectedTheme(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {PREDEFINED_THEMES.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    {generating
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Génération…</>
                      : '✦ Générer avec l\'IA'
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* Sets list */}
            {textSets.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun set disponible.</p>
            ) : textSets.map(s => (
              <div key={s.id} className={`bg-white rounded-xl border p-5 ${s.isDefault ? 'border-indigo-300' : s.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{s.name}</span>
                    {s.isBuiltin && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">Standard</span>}
                    {s.isDefault && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">Par défaut</span>}
                    {!s.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactif</span>}
                    <span className="text-xs text-gray-400">{fmt(s.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!s.isBuiltin && !s.isDefault && s.isActive && (
                      <button onClick={() => handleSetDefault(s.id)}
                        className="text-xs px-2.5 py-1 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50">
                        Défaut
                      </button>
                    )}
                    {!s.isBuiltin && (
                      <button onClick={() => handleToggleActive(s.id, s.isActive)}
                        className="text-xs px-2.5 py-1 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
                        {s.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    )}
                    {!s.isBuiltin && (
                      <button onClick={() => handleDeleteSet(s.id)}
                        className="text-xs px-2.5 py-1 border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                <button onClick={() => setExpandedSet(expandedSet === s.id ? null : s.id)}
                  className="text-xs text-indigo-500 hover:underline mt-2">
                  {expandedSet === s.id ? '▲ Masquer les textes' : '▼ Voir les textes'}
                </button>

                {expandedSet === s.id && (
                  <div className="mt-3 border-t border-gray-100 pt-3 space-y-3">
                    <div className="flex gap-2">
                      {(['fr', 'en', 'es'] as const).map(l => (
                        <button key={l} onClick={() => setPreviewLang(l)}
                          className={`text-xs px-2.5 py-1 rounded-lg border ${previewLang === l ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {s.texts[previewLang].map((text, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-400 mb-1">Texte {i + 1}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
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
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${activityFilter === a ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  {a || 'Tout'}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Date', 'Action', 'Utilisateur', 'Détails', 'IP'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activityLogs
                    .filter(l => !activityFilter || l.action === activityFilter)
                    .map(l => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          l.action === 'REGISTER' ? 'bg-blue-100 text-blue-700' :
                          l.action === 'REGISTER_FAILED' ? 'bg-red-100 text-red-600' :
                          l.action === 'LOGIN' ? 'bg-gray-100 text-gray-600' :
                          l.action === 'LOGIN_FAILED' ? 'bg-red-100 text-red-600' :
                          l.action === 'PURCHASE' ? 'bg-green-100 text-green-700' :
                          l.action === 'PAYMENT_FAILED' ? 'bg-red-100 text-red-600' :
                          l.action === 'SESSION_ANCHORED' ? 'bg-indigo-100 text-indigo-700' :
                          l.action === 'PDF_DOWNLOADED' ? 'bg-violet-100 text-violet-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>{l.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {l.user ? (
                          <div>
                            <p className="font-medium text-gray-800">{l.user.email}</p>
                            {l.user.firstName && <p className="text-gray-400">{l.user.firstName} {l.user.lastName}</p>}
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {l.metadata && Object.entries(l.metadata)
                          .filter(([k]) => !['email'].includes(k))
                          .map(([k, v]) => <span key={k} className="mr-2">{k}: {String(v).slice(0, 20)}</span>)
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{l.ip ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {activityLogs.filter(l => !activityFilter || l.action === activityFilter).length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">Aucune activité enregistrée.</p>
              )}
            </div>
          </div>
        ) : (
          /* Sessions tab */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Utilisateur', 'Statut', 'Lng', 'KYC', 'TxHash', 'Ancré le', 'Valide', 'Email', 'Audios'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">
                      <div className="font-medium text-gray-900">{s.user.email}</div>
                      {s.user.firstName && <div className="text-gray-400">{s.user.firstName} {s.user.lastName}</div>}
                      <div className="font-mono text-gray-300">{s.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[s.status] || ''}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.language.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.kycVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {s.kycVerified ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.txHash ? (
                        <a href={`https://snowtrace.io/tx/${s.txHash}`} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-xs text-indigo-500 hover:underline">
                          {s.txHash.slice(0, 10)}…
                        </a>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{fmt(s.anchoredAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.validUntil ? fmt(s.validUntil) : '∞'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.emailSentAt ? '✓' : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {s.audioCids && s.audioCids.length > 0
                        ? <span className="text-green-600 font-medium">{s.audioCids.length} fichier(s)</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Modifier l'utilisateur</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut KYC</label>
              <select value={editKyc} onChange={e => setEditKyc(e.target.value as KycStatus)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingUser(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
