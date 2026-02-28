import { Proof, VoiceRecord } from '../../types'

interface Props {
  record: VoiceRecord
  proof: Proof
}

const EXPLORER: Record<number, string> = {
  43114: 'https://snowtrace.io/tx',
  43113: 'https://testnet.snowtrace.io/tx',
}

export default function ProofCard({ record, proof }: Props) {
  const explorerUrl = `${EXPLORER[proof.chainId] || 'https://snowtrace.io/tx'}/${proof.txHash}`
  const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${record.ipfsCid}`

  return (
    <div className={`rounded-2xl border p-5 ${proof.revoked ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${proof.revoked ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
            {proof.revoked ? 'REVOKED' : 'ANCHORED'}
          </span>
          <h3 className="font-semibold text-gray-900 mt-1">{record.title}</h3>
        </div>
        <span className="text-2xl">⛓️</span>
      </div>

      <div className="space-y-2 text-sm">
        <Row label="Network" value={proof.network === 'avalanche' ? 'Avalanche C-Chain' : 'Avalanche Fuji (testnet)'} />
        <Row label="Block" value={`#${proof.blockNumber.toLocaleString()}`} />
        <Row label="Anchored" value={new Date(proof.anchoredAt).toLocaleString()} />
        <Row label="Proof ID" value={`#${proof.contractProofId}`} />

        <div className="flex items-center justify-between">
          <span className="text-gray-500">Transaction</span>
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
            className="text-brand-600 hover:underline font-mono text-xs truncate max-w-[200px]">
            {proof.txHash.slice(0, 12)}…{proof.txHash.slice(-6)}
          </a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500">Audio (IPFS)</span>
          <a href={ipfsUrl} target="_blank" rel="noopener noreferrer"
            className="text-brand-600 hover:underline text-xs">
            View on IPFS
          </a>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}
