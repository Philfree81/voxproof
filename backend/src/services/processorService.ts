/**
 * Client for the Python acoustic processor microservice.
 */
import { env } from '../config/env'

export interface ProcessorResult {
  acoustic_hash: string
  radar_chart: string      // base64 PNG
  properties_chart: string // base64 PNG
  pdf: string              // base64 PDF
}

export async function processSession(
  audioFiles: Express.Multer.File[],
  user: { firstName: string | null; lastName: string | null; email: string },
  language: string,
  textSetIndex: number,
  txHash: string,
  blockNumber: number,
  validUntil?: Date,
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
  form.append('tx_hash', txHash)
  form.append('block_number', String(blockNumber))
  if (validUntil) form.append('valid_until', validUntil.toISOString())

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
