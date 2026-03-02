# VoxProof

VoxProof est une plateforme SaaS de certification d'identité vocale. L'utilisateur enregistre 5 textes imposés, le système extrait sa signature acoustique, l'ancre sur la blockchain Avalanche et émet un certificat PDF horodaté.

---

## Comment ça marche

1. **Inscription** — email + mot de passe
2. **KYC** — vérification d'identité (carte d'identité + selfie via Stripe Identity)
3. **Enregistrement** — 5 textes lus à voix haute dans le navigateur
4. **Abonnement** — 12 €/an, requis au moment de l'analyse
5. **Certification** — extraction de la signature acoustique, ancrage blockchain, émission du certificat PDF
6. **Renouvellement automatique** — chaque renouvellement annuel prolonge la validité de tous les certificats existants

---

## Signature acoustique — les deux algorithmes

Le traitement audio repose sur **OpenSMILE**, bibliothèque de référence en paralinguistique computationnelle.

### 1. eGeMAPS v02 — 88 features (visualisation)

*Extended Geneva Minimalistic Acoustic Parameter Set*

Ensemble standardisé et interprétable conçu pour capturer les caractéristiques vocales les plus stables et cliniquement pertinentes :

| Catégorie | Features |
|---|---|
| Fréquence fondamentale (F0) | hauteur de la voix, micro-variations |
| Jitter / Shimmer | instabilités de fréquence et d'amplitude |
| Formants (F1, F2, F3) | timbre, résonances du conduit vocal |
| Énergie / Loudness | dynamique de la parole |
| HNR | Harmonics-to-Noise Ratio — qualité vocale |
| Spectral flux | évolution temporelle du spectre |

Utilisé pour générer le **radar chart** (profil acoustique) et le **properties chart** dans le certificat PDF.

### 2. ComParE 2016 — 6373 features (empreinte cryptographique)

*Computational Paralinguistics Challenge*

Ensemble exhaustif issu de la recherche en paralinguistique computationnelle. Inclut tout eGeMAPS plus :

- LPC (Linear Predictive Coding) et MFCC étendus avec delta et delta-delta
- Statistiques temporelles fines : percentiles, moments, pentes, courbures
- Features spectrales sur de multiples granularités temporelles

Les 6 373 features sont extraites sur chacun des 5 enregistrements, concaténées (31 865 valeurs), puis passées en **SHA-256** → hash ancré sur Avalanche.

**Pourquoi deux ensembles ?** eGeMAPS (88 dims) est lisible et visualisable. ComParE (6 373 dims) est quasi-impossible à falsifier : chaque micro-variation du signal change radicalement le hash. L'un sert à l'affichage, l'autre à la preuve cryptographique.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | Node.js + Express + TypeScript + Prisma |
| Base de données | PostgreSQL |
| Processeur audio | Python + FastAPI + OpenSMILE + PyAV |
| Blockchain | Avalanche C-Chain (Solidity + Hardhat) |
| Auth | JWT + bcrypt |
| Paiements | Stripe (abonnement annuel) |
| KYC | Stripe Identity |
| DevOps | Docker + docker-compose |

---

## Architecture

```
voxproof/
├── frontend/       # React + Vite (port 5174)
├── backend/        # Express API + Prisma ORM (port 4000)
├── processor/      # Python FastAPI — extraction acoustique (port 5000)
├── contracts/      # Smart contracts Solidity + Hardhat
├── docker-compose.yml
└── .env.example
```

Flux de données :

```
Navigateur → Backend → Processor (Python)
                           ↓
                    OpenSMILE (eGeMAPS + ComParE)
                           ↓
                    SHA-256 hash → Avalanche blockchain
                           ↓
                    PDF certificat → Stocké en DB
```

---

## Démarrage local

### Prérequis

- Node.js >= 18
- Python >= 3.10
- Docker & docker-compose
- Compte Stripe (avec Identity activé)

### 1. Variables d'environnement

```bash
cp .env.example .env
# Renseigner les clés dans .env
```

### 2. Base de données

```bash
docker-compose up postgres -d
```

### 3. Backend

```bash
cd backend
npm install
npx prisma migrate dev --schema=src/prisma/schema.prisma
npm run dev
```

### 4. Processeur Python

```bash
cd processor
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 5000
```

### 5. Frontend

```bash
cd frontend
npm install
npm run dev --host 0.0.0.0 --port 5174
```

### 6. Smart contract (local Hardhat)

```bash
cd contracts
npm install
npx hardhat node                          # terminal dédié
npx hardhat run scripts/deploy.ts --network localhost
# Copier l'adresse deployée dans .env → VOXPROOF_CONTRACT_ADDRESS
```

### 7. Webhooks Stripe (local)

```bash
~/bin/stripe listen --forward-to localhost:4000/api/payments/webhook
# Copier le whsec_... dans .env → STRIPE_WEBHOOK_SECRET
```

---

## Réseaux blockchain

Configurable via `BLOCKCHAIN_RPC_URL` dans `.env` :

| Réseau | URL |
|---|---|
| Hardhat local (dev) | `http://127.0.0.1:8545` |
| Fuji testnet Avalanche | `https://api.avax-test.network/ext/bc/C/rpc` |
| Mainnet Avalanche | `https://api.avax.network/ext/bc/C/rpc` |

---

## Tarification

| Offre | Prix | Certifications |
|---|---|---|
| Abonnement annuel | 12 €/an | Illimitées |

Renouvellement automatique via Stripe. À chaque renouvellement, la date de validité de tous les certificats existants est prolongée d'un an.

---

## Statuts KYC

```
PENDING → APPROVED
        → REJECTED
```

## Statuts de session vocale

```
RECORDING → PROCESSING → ANCHORED
                       → FAILED
```
