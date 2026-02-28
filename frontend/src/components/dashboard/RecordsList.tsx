import { useState } from 'react'
import { VoiceRecord } from '../../types'
import api from '../../services/api'
import ProofCard from '../proof/ProofCard'

interface Props {
  records: VoiceRecord[]
  onRefresh: () => void
}

export default function RecordsList({ records, onRefresh }: Props) {
  const [anchoring, setAnchoring] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAnchor(recordId: string) {
    setAnchoring(recordId)
    setError(null)
    try {
      await api.post(`/proofs/records/${recordId}/anchor`)
      onRefresh()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Anchoring failed')
    } finally {
      setAnchoring(null)
    }
  }

  if (!records.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <span className="text-5xl">🎙️</span>
        <p className="mt-3 font-medium">No recordings yet</p>
        <p className="text-sm mt-1">Record your first voice note above</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {records.map((record) => (
        <div key={record.id} className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{record.title}</h3>
              {record.description && <p className="text-sm text-gray-500 mt-0.5">{record.description}</p>}
              <p className="text-xs text-gray-400 mt-1">{new Date(record.createdAt).toLocaleString()}</p>
            </div>
            <span className="text-2xl">🎤</span>
          </div>

          <audio controls src={`https://gateway.pinata.cloud/ipfs/${record.ipfsCid}`}
            className="w-full my-3" />

          {record.proof ? (
            <ProofCard record={record} proof={record.proof} />
          ) : (
            <button
              onClick={() => handleAnchor(record.id)}
              disabled={anchoring === record.id}
              className="w-full mt-2 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {anchoring === record.id ? 'Anchoring on blockchain…' : '⛓️ Anchor Proof on Avalanche'}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
