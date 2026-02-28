import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import api from '../services/api'

const AVALANCHE_CHAIN_ID = import.meta.env.VITE_AVALANCHE_CHAIN_ID || '43113'
const AVALANCHE_PARAMS = {
  chainId: `0x${parseInt(AVALANCHE_CHAIN_ID).toString(16)}`,
  chainName: AVALANCHE_CHAIN_ID === '43114' ? 'Avalanche C-Chain' : 'Avalanche Fuji Testnet',
  nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
  rpcUrls: [
    AVALANCHE_CHAIN_ID === '43114'
      ? 'https://api.avax.network/ext/bc/C/rpc'
      : 'https://api.avax-test.network/ext/bc/C/rpc',
  ],
  blockExplorerUrls: [
    AVALANCHE_CHAIN_ID === '43114'
      ? 'https://snowtrace.io'
      : 'https://testnet.snowtrace.io',
  ],
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask not found. Please install it.')
      return null
    }

    setConnecting(true)
    setError(null)

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: AVALANCHE_PARAMS.chainId }],
        })
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [AVALANCHE_PARAMS],
          })
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const addr = await signer.getAddress()

      await api.patch('/auth/me/wallet', { walletAddress: addr })
      setAddress(addr)
      return addr
    } catch (e: any) {
      setError(e.message || 'Failed to connect wallet')
      return null
    } finally {
      setConnecting(false)
    }
  }, [])

  const getContract = useCallback(async (abi: string[], contractAddress: string) => {
    if (!window.ethereum) throw new Error('MetaMask not found')
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(contractAddress, abi, signer)
  }, [])

  return { address, connecting, error, connect, getContract }
}

declare global {
  interface Window {
    ethereum?: any
  }
}
