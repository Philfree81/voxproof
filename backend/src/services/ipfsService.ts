import PinataSDK from '@pinata/sdk'
import { Readable } from 'stream'
import { env } from '../config/env'

const pinata = new PinataSDK(env.pinataApiKey, env.pinataSecretApiKey)

export async function uploadAudioToIPFS(
  buffer: Buffer,
  filename: string,
  userId: string
): Promise<{ cid: string; url: string }> {
  const stream = Readable.from(buffer)
  const result = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: {
      name: filename,
      keyvalues: { userId, app: 'voxproof' } as Record<string, string>,
    },
    pinataOptions: { cidVersion: 1 },
  })

  return {
    cid: result.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
  }
}

export async function unpinFromIPFS(cid: string): Promise<void> {
  await pinata.unpin(cid)
}
