import { expect } from 'chai'
import { ethers } from 'hardhat'
import { VoxProof } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('VoxProof', () => {
  let contract: VoxProof
  let owner: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress

  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes('sample-audio-content'))
  const sampleCid = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
  const sampleTitle = 'My voice memo'

  beforeEach(async () => {
    ;[owner, user1, user2] = await ethers.getSigners()
    const VoxProofFactory = await ethers.getContractFactory('VoxProof')
    contract = await VoxProofFactory.deploy()
    await contract.waitForDeployment()
  })

  describe('anchorProof', () => {
    it('anchors a proof and emits ProofAnchored event', async () => {
      await expect(contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle))
        .to.emit(contract, 'ProofAnchored')
        .withArgs(1, user1.address, sampleHash, sampleCid, sampleTitle, await getTimestamp())
    })

    it('increments totalProofs', async () => {
      await contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle)
      expect(await contract.totalProofs()).to.equal(1)
    })

    it('reverts on duplicate hash', async () => {
      await contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle)
      await expect(
        contract.connect(user2).anchorProof(sampleHash, sampleCid, 'other')
      ).to.be.revertedWithCustomError(contract, 'HashAlreadyAnchored')
    })

    it('reverts on empty hash', async () => {
      await expect(
        contract.connect(user1).anchorProof(ethers.ZeroHash, sampleCid, sampleTitle)
      ).to.be.revertedWithCustomError(contract, 'EmptyHash')
    })

    it('reverts on empty CID', async () => {
      await expect(
        contract.connect(user1).anchorProof(sampleHash, '', sampleTitle)
      ).to.be.revertedWithCustomError(contract, 'EmptyCid')
    })
  })

  describe('getProof', () => {
    it('returns correct proof data', async () => {
      await contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle)
      const proof = await contract.getProof(1)
      expect(proof.id).to.equal(1)
      expect(proof.owner).to.equal(user1.address)
      expect(proof.audioHash).to.equal(sampleHash)
      expect(proof.ipfsCid).to.equal(sampleCid)
      expect(proof.title).to.equal(sampleTitle)
      expect(proof.revoked).to.equal(false)
    })

    it('reverts for non-existent proof', async () => {
      await expect(contract.getProof(999)).to.be.revertedWithCustomError(contract, 'ProofNotFound')
    })
  })

  describe('verifyHash', () => {
    it('returns true for anchored hash', async () => {
      await contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle)
      const [exists, proofId, revoked] = await contract.verifyHash(sampleHash)
      expect(exists).to.equal(true)
      expect(proofId).to.equal(1)
      expect(revoked).to.equal(false)
    })

    it('returns false for unknown hash', async () => {
      const [exists] = await contract.verifyHash(ethers.keccak256(ethers.toUtf8Bytes('unknown')))
      expect(exists).to.equal(false)
    })
  })

  describe('revokeProof', () => {
    it('owner can revoke their proof', async () => {
      await contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle)
      await expect(contract.connect(user1).revokeProof(1))
        .to.emit(contract, 'ProofRevoked')
        .withArgs(1, user1.address, await getTimestamp())
      const proof = await contract.getProof(1)
      expect(proof.revoked).to.equal(true)
    })

    it('non-owner cannot revoke', async () => {
      await contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle)
      await expect(contract.connect(user2).revokeProof(1))
        .to.be.revertedWithCustomError(contract, 'NotProofOwner')
    })

    it('cannot revoke twice', async () => {
      await contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle)
      await contract.connect(user1).revokeProof(1)
      await expect(contract.connect(user1).revokeProof(1))
        .to.be.revertedWithCustomError(contract, 'ProofAlreadyRevoked')
    })
  })

  describe('getUserProofIds', () => {
    it('returns all proof IDs for a user', async () => {
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes('second-audio'))
      await contract.connect(user1).anchorProof(sampleHash, sampleCid, 'First')
      await contract.connect(user1).anchorProof(hash2, sampleCid, 'Second')
      const ids = await contract.getUserProofIds(user1.address)
      expect(ids.length).to.equal(2)
      expect(ids[0]).to.equal(1)
      expect(ids[1]).to.equal(2)
    })
  })

  describe('pause / unpause', () => {
    it('owner can pause and unpause', async () => {
      await contract.connect(owner).pause()
      await expect(
        contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle)
      ).to.be.revertedWithCustomError(contract, 'EnforcedPause')
      await contract.connect(owner).unpause()
      await expect(
        contract.connect(user1).anchorProof(sampleHash, sampleCid, sampleTitle)
      ).to.not.be.reverted
    })

    it('non-owner cannot pause', async () => {
      await expect(contract.connect(user1).pause())
        .to.be.revertedWithCustomError(contract, 'OwnableUnauthorizedAccount')
    })
  })
})

async function getTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock('latest')
  return block!.timestamp
}
