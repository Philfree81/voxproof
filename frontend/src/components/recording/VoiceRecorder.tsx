import { useState } from 'react'
import { useRecorder } from '../../hooks/useRecorder'
import api from '../../services/api'

interface Props {
  onSuccess: () => void
}

export default function VoiceRecorder({ onSuccess }: Props) {
  const { recording, audioBlob, audioUrl, duration, error, start, stop, reset } = useRecorder()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  function formatDuration(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  async function handleUpload() {
    if (!audioBlob || !title.trim()) return
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('title', title)
      if (description) formData.append('description', description)
      await api.post('/records', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      reset()
      setTitle('')
      setDescription('')
      onSuccess()
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">New Recording</h2>

      <div className="flex flex-col items-center gap-4">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all
          ${recording ? 'bg-red-100 animate-pulse' : 'bg-brand-50'}`}>
          {recording ? '🔴' : '🎙️'}
        </div>

        {recording && (
          <p className="text-2xl font-mono font-bold text-red-600">{formatDuration(duration)}</p>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!audioBlob ? (
          <div className="flex gap-3">
            {!recording ? (
              <button onClick={start}
                className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors">
                Start Recording
              </button>
            ) : (
              <button onClick={stop}
                className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors">
                Stop
              </button>
            )}
          </div>
        ) : (
          <div className="w-full space-y-3">
            <audio controls src={audioUrl!} className="w-full" />
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Recording title *"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            {uploadError && <p className="text-red-600 text-sm">{uploadError}</p>}
            <div className="flex gap-2">
              <button onClick={reset}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                Discard
              </button>
              <button onClick={handleUpload} disabled={!title.trim() || uploading}
                className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                {uploading ? 'Saving…' : 'Save to IPFS'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
