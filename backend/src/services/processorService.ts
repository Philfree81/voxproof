/**
 * Client for the Python acoustic processor microservice.
 */
import { env } from '../config/env'

export interface SpectrogramMetrics {
  centroide_hz: number       // spectral centroid (Hz) — brightness of the voice
  rolloff_hz: number         // 85% energy rolloff frequency (Hz)
  energie_grave_pct: number  // % energy below 500 Hz
  energie_medium_pct: number // % energy 500–3000 Hz
  energie_aigu_pct: number   // % energy above 3000 Hz
  variabilite: number        // normalized RMS variability (0–1)
}

export interface ProcessorResult {
  acoustic_hash: string
  voice_hash: string            // stable biometric voice identity hash
  radar_chart: string           // base64 PNG
  properties_chart: string      // base64 PNG
  spectrogram: string           // base64 PNG
  spectrogram_metrics: SpectrogramMetrics
  pdf: string                   // base64 PDF
}

export async function processSession(
  audioFiles: Express.Multer.File[],
  user: { firstName: string | null; lastName: string | null; email: string },
  language: string,
  textSetIndex: number,
  txHash: string,
  blockNumber: number,
  validUntil?: Date,
  kycVerified?: boolean,
  textSetName?: string,
): Promise<ProcessorResult> {
  const form = new FormData()

  audioFiles.forEach((file, i) => {
    const blob = new Blob([file.buffer], { type: file.mimetype })
    form.append(`audio${i + 1}`, blob, file.originalname || `audio${i + 1}.webm`)
  })

  form.append('first_name', user.firstName || 'N/A')
  form.append('last_name', user.lastName || 'N/A')
  form.append('email', user.email)
  form.append('language', language)
  form.append('text_set_index', String(textSetIndex))
  if (textSetName) form.append('text_set_name', textSetName)
  form.append('tx_hash', txHash)
  form.append('block_number', String(blockNumber))
  if (validUntil) form.append('valid_until', validUntil.toISOString())
  form.append('kyc_verified', kycVerified === false ? 'false' : 'true')

  const response = await fetch(`${env.processorUrl}/process`, {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' })) as { detail?: string }
    throw new Error(`Processor error: ${error.detail || response.statusText}`)
  }

  return response.json() as Promise<ProcessorResult>
}
