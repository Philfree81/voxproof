import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying VoxProof with account:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', ethers.formatEther(balance), 'AVAX')

  const VoxProof = await ethers.getContractFactory('VoxProof')
  const contract = await VoxProof.deploy()
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('VoxProof deployed to:', address)
  console.log('Add this to your .env:')
  console.log(`VOXPROOF_CONTRACT_ADDRESS=${address}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
