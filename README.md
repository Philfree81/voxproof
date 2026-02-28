# VoxProof

VoxProof is a SaaS platform that lets users record, store, and notarize their voice recordings on the Avalanche blockchain. Each recording gets a permanent, tamper-proof proof certificate backed by IPFS and an on-chain transaction. Users are KYC-verified before they can anchor proofs.

---

## How It Works

1. **Register** — Create an account with email & password
2. **KYC** — Verify your identity with ID card + selfie (Stripe Identity)
3. **Connect Wallet** — Connect MetaMask on Avalanche C-Chain
4. **Upload / Record** — Record your voice or upload an audio file
5. **Anchor on Chain** — Audio is pinned to IPFS; SHA-256 hash stored on Avalanche
6. **Get Your Proof** — Certificate with IPFS link + transaction hash

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | Node.js + Express + TypeScript + Prisma |
| Database | PostgreSQL |
| Audio Storage | IPFS via Pinata |
| Blockchain | Avalanche C-Chain (Solidity + Hardhat) |
| Web3 | ethers.js + MetaMask |
| Auth | JWT + bcrypt |
| Payments | Stripe |
| KYC | Stripe Identity |
| DevOps | Docker + docker-compose |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- Docker & docker-compose
- MetaMask browser extension
- Pinata account
- Stripe account (with Identity enabled)

### 1. Configure environment
```bash
cp .env.example .env
# Fill in your keys in .env
```

### 2. Start the database
```bash
docker-compose up postgres -d
```

### 3. Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Deploy smart contract (Fuji testnet first)
```bash
cd contracts
npm install
npx hardhat run scripts/deploy.ts --network fuji
# Copy deployed address to .env → VOXPROOF_CONTRACT_ADDRESS
```

---

## Project Structure

```
voxproof/
├── frontend/          # React + Vite app
├── backend/           # Express API + Prisma ORM
├── contracts/         # Solidity smart contracts
├── docker-compose.yml
└── .env.example
```

---

## User Flow

```
Register → Email verify → KYC (ID card) → Connect wallet → Record → Proof
```

KYC statuses: pending → approved → rejected

---

## Plans

| Plan | Price | Recordings/month |
|---|---|---|
| Starter | €9/mo | 10 |
| Pro | €29/mo | 100 |
| Enterprise | Custom | Unlimited |
