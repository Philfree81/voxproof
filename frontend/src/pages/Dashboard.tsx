import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/shared/Layout'
import VoiceRecorder from '../components/recording/VoiceRecorder'
import RecordsList from '../components/dashboard/RecordsList'
import { useAuthStore } from '../store/authStore'
import { useWallet } from '../hooks/useWallet'
import { VoiceRecord, PaginatedResponse } from '../types'
import api from '../services/api'

export default function Dashboard() {
  const { user, fetchMe } = useAuthStore()
  const { address, connecting, connect } = useWallet()
  const [records, setRecords] = useState<VoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) fetchMe()
  }, [])

  useEffect(() => {
    if (user?.kycStatus === 'PENDING' || user?.kycStatus === 'REJECTED') {
      navigate('/kyc')
    }
  }, [user])

  async function loadRecords() {
    setLoading(true)
    try {
      const { data } = await api.get<PaginatedResponse<VoiceRecord>>('/records')
      setRecords(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.kycStatus === 'APPROVED') loadRecords()
  }, [user])

  const walletConnected = address || user?.walletAddress

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {user?.firstName ? `Welcome, ${user.firstName}` : user?.email}
            </p>
          </div>
          {!walletConnected ? (
            <button onClick={connect} disabled={connecting}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
              {connecting ? 'Connecting…' : '🦊 Connect Wallet'}
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              <p className="text-xs text-green-700 font-mono">
                {(walletConnected as string).slice(0, 6)}…{(walletConnected as string).slice(-4)}
              </p>
            </div>
          )}
        </div>

        {/* KYC warning */}
        {user?.kycStatus !== 'APPROVED' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm text-yellow-800">Complete identity verification to start recording</p>
            <button onClick={() => navigate('/kyc')}
              className="text-sm bg-yellow-600 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-700">
              Verify ID
            </button>
          </div>
        )}

        {/* Recorder */}
        {user?.kycStatus === 'APPROVED' && (
          <VoiceRecorder onSuccess={loadRecords} />
        )}

        {/* Records */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Recordings</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading…</div>
          ) : (
            <RecordsList records={records} onRefresh={loadRecords} />
          )}
        </div>
      </div>
    </Layout>
  )
}
