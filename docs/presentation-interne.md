# VoxProof — Présentation interne
### Document confidentiel — Usage équipe uniquement
---

## Qu'est-ce que VoxProof ?

VoxProof est une plateforme SaaS de **certification vocale notariée sur blockchain**. Elle permet à toute personne de prouver, de façon irréfutable et infalsifiable, que **sa voix est bien la sienne** à un instant donné — et que cet enregistrement n'a pas été modifié.

Le certificat produit lie trois éléments indissociables :
- L'**identité de la personne** (KYC Stripe Identity — carte d'identité + selfie)
- L'**empreinte biométrique vocale** (analyse acoustique IA)
- Une **preuve blockchain** horodatée et immuable (Avalanche C-Chain)

---

## Comment ça marche — le parcours complet

### 1. Inscription et vérification d'identité
L'utilisateur crée un compte et passe une vérification KYC via Stripe Identity (photo de pièce d'identité + selfie). Cette étape lie son identité civile à son profil VoxProof. Sans KYC, il peut enregistrer mais le certificat portera la mention "Identité non vérifiée".

### 2. Connexion du portefeuille blockchain
L'utilisateur connecte son portefeuille MetaMask. Cette adresse wallet devient son identifiant blockchain permanent — elle est inscrite sur la blockchain à chaque certification.

### 3. Enregistrement vocal
L'utilisateur lit 5 textes imposés à voix haute (disponibles en français, anglais, espagnol). Ces textes sont conçus pour couvrir un large spectre phonétique : voyelles ouvertes, consonnes sibilantes, nasales, occlusives. L'enregistrement dure environ 3 à 5 minutes.

### 4. Analyse acoustique par IA
Les 5 fichiers audio sont envoyés au microservice Python qui effectue :
- **Extraction ComParE** (6 373 features acoustiques) → hash SHA-256 unique de la session
- **Extraction eGeMAPS** (88 features) → graphiques radar et histogramme
- **D-vector Resemblyzer** (réseau GE2E, 256 dimensions) → empreinte biométrique vocale stable
- **Génération du spectrogramme** (visualisation fréquentielle)

### 5. Ancrage blockchain
Les deux hash sont inscrits de façon permanente sur **Avalanche C-Chain (mainnet)** :
- `audioHash` — SHA-256 de cet enregistrement précis (unique, non reproductible)
- `voiceHash` — empreinte biométrique vocale stable (identique d'une session à l'autre pour la même voix)

L'adresse du contrat intelligent, l'adresse wallet, et l'horodatage du bloc sont également enregistrés. L'opération est irréversible.

### 6. Stockage IPFS
Les fichiers audio sont uploadés sur IPFS via Pinata et conservés 5 jours (suffisant pour vérification immédiate). Les CIDs IPFS sont liés à la session.

### 7. Certificat PDF
Un certificat PDF est généré automatiquement et envoyé par email. Il contient :
- Identité du titulaire (nom, email, statut KYC)
- Les deux empreintes cryptographiques complètes
- Les graphiques d'analyse acoustique
- Le hash de transaction blockchain + numéro de bloc
- La date de prochain enregistrement conseillé
- Les textes lus lors de la session

---

## Ce qui est stocké — et où

| Donnée | Stockage | Durée |
|--------|----------|-------|
| Hash audio (SHA-256) | Blockchain Avalanche | Permanente |
| Hash vocal biométrique | Blockchain Avalanche | Permanente |
| Adresse wallet | Blockchain Avalanche | Permanente |
| Métadonnées session | Base PostgreSQL | Permanente |
| Certificat PDF | Base PostgreSQL (base64) | Permanente |
| Graphiques acoustiques | Base PostgreSQL (base64) | Permanente |
| Fichiers audio | IPFS (Pinata) | 5 jours |

**Les fichiers audio ne transitent jamais par nos serveurs de stockage.** Ils sont analysés en mémoire puis uploadés directement sur IPFS.

---

## Les deux empreintes — différence fondamentale

### Empreinte de session (SHA-256 audio)
- Unique et différente à chaque enregistrement
- Prouve que **cet enregistrement précis** a existé, à cette date, sans altération
- C'est l'équivalent d'un scellé cryptographique sur le fichier audio

### Empreinte vocale biométrique (voiceHash)
- **Stable d'une session à l'autre** pour la même personne
- Basée sur les 128 dimensions les plus stables du d-vector neuronal GE2E
- Permet de relier plusieurs certifications à une même identité vocale
- La blockchain permet de retrouver toutes les sessions d'une même voix via `getProofsByVoiceHash`

---

## Valeur probatoire

VoxProof produit un faisceau de preuves convergentes :

1. **Preuve d'existence horodatée** — la blockchain certifie que l'enregistrement existait à une date précise et n'a pas été modifié depuis
2. **Preuve d'identité** — le KYC Stripe Identity lie la voix à une personne physique identifiée
3. **Preuve d'intégrité** — toute modification du fichier audio invalide le hash SHA-256
4. **Preuve biométrique** — le voiceHash confirme que la voix enregistrée correspond à l'identité déclarée

> Le certificat VoxProof n'est pas un acte notarié au sens légal français. Il constitue un **moyen de preuve privé à forte valeur probatoire**, utilisable dans le cadre de litiges civils, de procédures d'authentification, ou comme preuve d'antériorité.

---

## Tarifs

### Enregistrement annuel — 15 €
- 1 certification vocale complète
- Valable 1 an (renouvellement annuel conseillé pour maintenir une empreinte à jour)
- Certificat PDF + ancrage blockchain + email de confirmation
- Accès au dashboard avec historique

### Certification à vie — 65 €
- 1 certification vocale complète
- Validité permanente sur la blockchain (aucun renouvellement)
- Idéal pour une preuve d'antériorité ou une archive définitive
- Mêmes fonctionnalités que l'offre annuelle

> **Pourquoi renouveler chaque année ?** La voix évolue naturellement avec l'âge, la santé, et les conditions d'enregistrement. Un renouvellement annuel garantit que l'empreinte reste représentative de la voix actuelle de la personne.

---

## Architecture technique (résumé)

| Composant | Technologie |
|-----------|-------------|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | Node.js + Express + TypeScript + Prisma |
| Base de données | PostgreSQL |
| Microservice IA | Python + FastAPI + OpenSMILE + Resemblyzer |
| Blockchain | Avalanche C-Chain (Solidity + ethers.js) |
| Stockage audio | IPFS via Pinata |
| Paiements | Stripe (abonnements + paiement unique) |
| KYC | Stripe Identity |
| Emails | Brevo (transactionnel) |
| Alertes serveur | Brevo + Twilio WhatsApp |
| Monitoring | Cron PM2 + UptimeRobot |
| Hébergement | VPS dédié Ubuntu (57.129.137.157) |

---

## Cas d'usage

- **Artistes et créateurs** — prouver l'antériorité d'une voix, d'un style vocal, d'une performance
- **Professionnels de la voix** — comédiens, doubleurs, chanteurs — protéger leur signature sonore
- **Authentification forte** — organisations souhaitant vérifier l'identité d'un intervenant à distance
- **Prévention des deepfakes** — disposer d'une référence certifiée antérieure à toute usurpation
- **Ressources humaines** — archiver la voix d'un dirigeant ou d'un signataire pour validation future
- **Médical / légal** — enregistrement de consentements éclairés avec preuve d'identité biométrique

---

## Administration VoxProof

L'interface d'administration est accessible sur `https://voxproof.com/admin` pour les comptes marqués `isAdmin = true` en base. Elle permet de gérer l'ensemble de la plateforme sans accès direct au serveur.

### Gestion des utilisateurs

| Action | Description |
|--------|-------------|
| Lister tous les utilisateurs | Voir email, nom, statut KYC, plan actif, historique des sessions |
| Modifier un utilisateur | Changer l'email, forcer le statut KYC (`APPROVED` / `PENDING` / `FAILED`), promouvoir admin |
| Supprimer un utilisateur | Suppression définitive du compte et de ses données |

### Gestion des crédits (accès manuel)

Un admin peut attribuer ou supprimer des crédits manuellement, sans passer par Stripe :
- **ANNUAL** — crédit annuel (expire dans 365 jours)
- **LIFETIME** — crédit à vie (pas d'expiration)

Utile pour : comptes de test, partenariats, compensation d'erreur, accès offerts.

### Gestion des sessions vocales

L'admin voit les 200 dernières sessions de tous les utilisateurs avec :
- Statut (ANCHORED / PROCESSING / FAILED / RECORDING)
- Langue, hash de transaction, numéro de bloc
- Statut KYC au moment de l'enregistrement
- CIDs IPFS des fichiers audio
- Email de certificat envoyé ou non

### Gestion des ensembles de textes

Les textes de lecture proposés aux utilisateurs sont gérables depuis l'admin :

| Action | Détail |
|--------|--------|
| Lister les ensembles | Voir tous les sets actifs, inactifs, built-in |
| Créer un ensemble | Nom, thème, textes FR/EN/ES |
| Modifier un ensemble | Activer/désactiver, définir comme défaut (non disponible pour les built-in) |
| Supprimer un ensemble | Uniquement les sets personnalisés (les built-in sont protégés) |
| **Générer par IA** | Saisir un thème → Claude génère automatiquement 5 textes phonétiquement optimisés en FR/EN/ES |

**Thèmes disponibles pour la génération IA :**
Poésie classique, Dialogues de cinéma, Littérature romanesque, Philosophie & Sagesse, Nature & Paysages, Histoire & Civilisations, Conte & Imaginaire, Sport & Dépassement, Science & Découverte, Identité & Mémoire.

**Mode de sélection des textes :**
- `default` — l'utilisateur choisit parmi les ensembles actifs
- `random` — un ensemble est tiré au sort automatiquement

### Journal d'activité

Toutes les actions importantes sont tracées (200 dernières entrées visibles) :
- Connexions, inscriptions, paiements
- Sessions ancrées, téléchargements PDF
- Modifications admin

---

## Blog VoxProof

Le blog est hébergé sur `https://blog.voxproof.com` via Ghost 6 (self-hosted).

| Élément | Détail |
|---------|--------|
| Back-office | `https://blog.voxproof.com/ghost/` |
| Hébergement | Même serveur VPS (57.129.137.157) |
| Base de données | MySQL (séparée de PostgreSQL VoxProof) |
| Emails | Brevo SMTP (même compte que VoxProof) |
| SSL | Let's Encrypt via acme.sh |
| Langues | Français et Anglais |
| Rédaction | Équipe + assistance IA (Claude) |

Le lien "Blog" est intégré dans la navbar principale de voxproof.com.

---

## Monitoring et alertes

| Système | Outil | Fréquence |
|---------|-------|-----------|
| Crash process PM2 | Script cron + Brevo email + Twilio WhatsApp | Toutes les 5 min |
| Indisponibilité site | UptimeRobot (externe) | Toutes les 5 min |
| Logs applicatifs | PM2 logs (`~/.pm2/logs/`) | Temps réel |

En cas de crash d'un des 3 services (backend, frontend, processor), une alerte est envoyée simultanément par **email** (ptriem@gmail.com) et **WhatsApp**.

UptimeRobot surveille `https://voxproof.com` et `https://blog.voxproof.com` depuis l'extérieur — couvre le cas d'une panne complète du serveur où PM2 ne tournerait plus.

---

*Document généré le 07/03/2026 — VoxProof v1.0*
