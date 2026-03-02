import { useState, useRef, useCallback } from 'react'

export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  const start = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone non accessible. Vérifiez que vous utilisez HTTPS ou localhost.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Pick best supported mimeType
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
      ].find((t) => MediaRecorder.isTypeSupported(t)) || ''

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(250)
      setRecording(true)

      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch (err: unknown) {
      const msg = err instanceof DOMException ? err.name : String(err)
      if (msg === 'NotAllowedError' || msg === 'PermissionDeniedError') {
        setError('Permission microphone refusée. Autorisez l\'accès dans votre navigateur.')
      } else if (msg === 'NotFoundError') {
        setError('Aucun microphone détecté sur cet appareil.')
      } else {
        setError(`Impossible d'accéder au microphone : ${msg}`)
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setError(null)
  }, [])

  return { recording, audioBlob, audioUrl, duration, error, start, stop, reset }
}
