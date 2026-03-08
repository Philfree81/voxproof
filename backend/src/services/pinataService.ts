import { env } from '../config/env'

const PINATA_BASE = 'https://api.pinata.cloud'

export async function uploadAudioToPinata(
  buffer: Buffer,
  filename: string,
  sessionId: string,
): Promise<string> {
  if (!env.pinataJwt) {
    console.warn('[Pinata] PINATA_JWT not set — skipping upload')
    return ''
  }

  const form = new FormData()
  const blob = new Blob([buffer])
  form.append('file', blob, filename)
  form.append('pinataMetadata', JSON.stringify({ name: `voxproof-${sessionId}-${filename}` }))
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

  const response = await fetch(`${PINATA_BASE}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.pinataJwt}` },
    body: form,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(`Pinata upload error: ${err.error || response.statusText}`)
  }

  const data = await response.json() as { IpfsHash: string }
  return data.IpfsHash
}

export async function unpinFromPinata(cid: string): Promise<void> {
  if (!env.pinataJwt) return

  const response = await fetch(`${PINATA_BASE}/pinning/unpin/${cid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${env.pinataJwt}` },
  })

  if (!response.ok && response.status !== 404) {
    console.error(`[Pinata] Failed to unpin ${cid}: ${response.statusText}`)
  } else {
    console.log(`[Pinata] Unpinned ${cid}`)
  }
}
