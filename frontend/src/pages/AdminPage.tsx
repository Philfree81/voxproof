import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import type { AdminUser, Purchase, KycStatus } from '../types'

type Tab = 'users' | 'sessions'

interface AdminSession {
  id: string
  status: string
  language: string
  txHash?: string
  blockNumber?: number
  anchoredAt?: string
  validUntil?: string | null
  emailSentAt?: string
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
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editKyc, setEditKyc] = useState<KycStatus>('PENDING')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && !user.isAdmin) navigate('/', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    setLoading(true)
    const req = tab === 'users'
      ? api.get('/admin/users').then(r => { setUsers(r.data); setSessions([]) })
      : api.get('/admin/sessions').then(r => { setSessions(r.data); setUsers([]) })
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
          {(['users', 'sessions'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'users' ? `Utilisateurs${users.length ? ` (${users.length})` : ''}` : 'Sessions'}
            </button>
          ))}
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
        ) : (
          /* Sessions tab */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Utilisateur', 'Statut', 'Langue', 'TxHash', 'Ancré le', 'Valide jusqu\'au', 'Email'].map(h => (
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
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[s.status] || ''}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.language.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      {s.txHash
                        ? <span className="font-mono text-xs text-gray-500">{s.txHash.slice(0, 10)}…</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{fmt(s.anchoredAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.validUntil ? fmt(s.validUntil) : '∞'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.emailSentAt ? fmt(s.emailSentAt) : '—'}</td>
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
