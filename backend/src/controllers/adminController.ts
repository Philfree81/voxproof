import { Response } from 'express'
import { prisma } from '../config/database'
import { AuthRequest } from '../middleware/auth'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env'

// ─── App Config ───────────────────────────────────────────────────────────────

const VALID_THEMES = ['classic', 'futuriste', 'blue', 'sobre']

export async function getConfig(_req: AuthRequest, res: Response) {
  const row = await prisma.appConfig.findUnique({ where: { key: 'default_theme' } })
  return res.json({ defaultTheme: row?.value ?? 'classic' })
}

export async function setConfig(req: AuthRequest, res: Response) {
  const { defaultTheme } = req.body
  if (!defaultTheme || !VALID_THEMES.includes(defaultTheme)) {
    return res.status(400).json({ error: 'Invalid theme' })
  }
  await prisma.appConfig.upsert({
    where: { key: 'default_theme' },
    update: { value: defaultTheme },
    create: { key: 'default_theme', value: defaultTheme },
  })
  return res.json({ defaultTheme })
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      kycStatus: true,
      isAdmin: true,
      theme: true,
      createdAt: true,
      purchases: {
        select: { id: true, productType: true, usedAt: true, validUntil: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
      sessions: {
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return res.json(users)
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { email, kycStatus, isAdmin } = req.body

  const data: Record<string, unknown> = {}
  if (email !== undefined) data.email = email
  if (kycStatus !== undefined) data.kycStatus = kycStatus
  if (isAdmin !== undefined) data.isAdmin = isAdmin

  const user = await prisma.user.update({ where: { id }, data,
    select: { id: true, email: true, kycStatus: true, isAdmin: true },
  })
  return res.json(user)
}

export async function deleteUser(req: AuthRequest, res: Response) {
  await prisma.user.delete({ where: { id: req.params.id } })
  return res.status(204).send()
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export async function addCredit(req: AuthRequest, res: Response) {
  const { id: userId } = req.params
  const { productType } = req.body // 'ANNUAL' | 'LIFETIME'

  if (!['ANNUAL', 'LIFETIME'].includes(productType)) {
    return res.status(400).json({ error: 'productType must be ANNUAL or LIFETIME' })
  }

  const validUntil = productType === 'ANNUAL'
    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    : null

  const purchase = await prisma.purchase.create({
    data: {
      userId,
      stripePriceId: 'manual',
      productType,
      validUntil,
    },
  })
  return res.status(201).json(purchase)
}

export async function deleteCredit(req: AuthRequest, res: Response) {
  await prisma.purchase.delete({ where: { id: req.params.id } })
  return res.status(204).send()
}

// ─── Text Sets ────────────────────────────────────────────────────────────────

export async function listTextSets(_req: AuthRequest, res: Response) {
  const sets = await prisma.textSet.findMany({ orderBy: { createdAt: 'desc' } })
  const config = await prisma.appConfig.findUnique({ where: { key: 'text_selection_mode' } })
  return res.json({ sets, mode: config?.value ?? 'default' })
}

export async function createTextSet(req: AuthRequest, res: Response) {
  const { name, theme, texts } = req.body
  if (!name || !theme || !texts?.fr || !texts?.en || !texts?.es) {
    return res.status(400).json({ error: 'name, theme and texts (fr/en/es) required' })
  }
  const set = await prisma.textSet.create({ data: { name, theme, texts } })
  return res.status(201).json(set)
}

export async function updateTextSet(req: AuthRequest, res: Response) {
  const { id } = req.params
  const { name, theme, isActive, isDefault, texts } = req.body

  const existing = await prisma.textSet.findUnique({ where: { id } })
  // Builtin sets: only isActive can be toggled
  if (existing?.isBuiltin && (name !== undefined || theme !== undefined || isDefault !== undefined || texts !== undefined)) {
    return res.status(403).json({ error: 'Built-in sets: only isActive can be changed' })
  }

  // Only one default at a time
  if (isDefault) {
    await prisma.textSet.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
  }

  const set = await prisma.textSet.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(theme !== undefined && { theme }),
      ...(isActive !== undefined && { isActive }),
      ...(isDefault !== undefined && { isDefault }),
      ...(texts !== undefined && { texts }),
    },
  })
  return res.json(set)
}

export async function deleteTextSet(req: AuthRequest, res: Response) {
  const existing = await prisma.textSet.findUnique({ where: { id: req.params.id } })
  if (existing?.isBuiltin) return res.status(403).json({ error: 'Built-in sets cannot be deleted' })
  await prisma.textSet.delete({ where: { id: req.params.id } })
  return res.status(204).send()
}

export async function setTextSelectionMode(req: AuthRequest, res: Response) {
  const { mode } = req.body
  if (!['default', 'random'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be default or random' })
  }
  await prisma.appConfig.upsert({
    where: { key: 'text_selection_mode' },
    update: { value: mode },
    create: { key: 'text_selection_mode', value: mode },
  })
  return res.json({ mode })
}

const THEMES: Record<string, string> = {
  poetry:       'Poésie classique',
  cinema:       'Dialogues de cinéma',
  literature:   'Littérature romanesque',
  philosophy:   'Philosophie & Sagesse',
  nature:       'Nature & Paysages',
  history:      'Histoire & Civilisations',
  tale:         'Conte & Imaginaire',
  sport:        'Sport & Dépassement',
  science:      'Science & Découverte',
  identity:     'Identité & Mémoire',
}

export async function generateTextSet(req: AuthRequest, res: Response) {
  const { theme } = req.body
  if (!theme || !THEMES[theme]) {
    return res.status(400).json({ error: `theme must be one of: ${Object.keys(THEMES).join(', ')}` })
  }
  if (!env.anthropicApiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const themeName = THEMES[theme]
  const client = new Anthropic({ apiKey: env.anthropicApiKey })

  const prompt = `Tu es expert en phonétique appliquée à la biométrie vocale. Génère 5 textes de lecture ORIGINAUX pour la certification vocale VoxProof, dans le style du thème "${themeName}".

CONTRAINTES PHONÉTIQUES OBLIGATOIRES (chaque texte doit contenir TOUS ces éléments) :
- Voyelles ouvertes : sons [a], [ɛ], [ɔ], [œ] (ex: patte, fête, or, peur)
- Voyelles fermées : sons [i], [y], [u], [e], [o] (ex: vie, lune, doux, été, mot)
- Fricatives : au moins 3 occurrences de (f/v/s/z/ch/j) réparties dans le texte
- Nasales : au moins 3 occurrences de (m/n) et une nasale vocalique (an/en/in/on/un)
- Occlusives : au moins 2 paires (p/b), (t/d), (k/g)
- Liquides : sons [l] et [r] présents plusieurs fois
- Variation rythmique : mélanger phrases longues (20+ mots) et courtes (5-10 mots)
- Pauses naturelles : ponctuation variée (virgules, points, deux-points)

RÈGLES DE CONTENU :
- 100% original — aucune reproduction d'œuvre existante
- Style inspiré du thème "${themeName}" mais contenu entièrement inventé
- 45 à 60 mots par texte
- Registre soutenu, fluide à lire à voix haute
- Les 5 textes doivent être thématiquement variés entre eux
- Traduire chaque texte en anglais (en) et espagnol (es) en respectant le sens et les contraintes phonétiques équivalentes dans chaque langue

Réponds UNIQUEMENT avec un JSON valide brut, sans markdown, sans backticks, sans commentaire :
{
  "fr": ["texte1", "texte2", "texte3", "texte4", "texte5"],
  "en": ["texte1", "texte2", "texte3", "texte4", "texte5"],
  "es": ["texte1", "texte2", "texte3", "texte4", "texte5"]
}`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()
    const texts = JSON.parse(raw)

    if (!texts.fr || !texts.en || !texts.es ||
        texts.fr.length !== 5 || texts.en.length !== 5 || texts.es.length !== 5) {
      return res.status(500).json({ error: 'Invalid response from AI — wrong structure' })
    }

    const set = await prisma.textSet.create({
      data: { name: themeName, theme, texts },
    })
    return res.status(201).json(set)
  } catch (err: any) {
    console.error('[TextSet generate]', err)
    return res.status(500).json({ error: err.message || 'Generation failed' })
  }
}

export const PREDEFINED_THEMES = THEMES

// ─── Sessions ─────────────────────────────────────────────────────────────────

// ─── Activity Logs ────────────────────────────────────────────────────────────

export async function listActivityLogs(req: AuthRequest, res: Response) {
  const { action, userId, limit = '200' } = req.query as Record<string, string>
  const logs = await prisma.activityLog.findMany({
    where: {
      ...(action && { action }),
      ...(userId && { userId }),
    },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  })
  return res.json(logs)
}

// ─── Voice Comparison ─────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function compareSessions(req: AuthRequest, res: Response) {
  const { sessionIdA, sessionIdB } = req.body
  if (!sessionIdA || !sessionIdB) {
    return res.status(400).json({ error: 'sessionIdA and sessionIdB required' })
  }
  if (sessionIdA === sessionIdB) {
    return res.status(400).json({ error: 'Sessions must be different' })
  }

  const [a, b] = await Promise.all([
    prisma.voiceSession.findUnique({ where: { id: sessionIdA }, select: { id: true, voiceCentroid: true, createdAt: true, user: { select: { email: true } } } }),
    prisma.voiceSession.findUnique({ where: { id: sessionIdB }, select: { id: true, voiceCentroid: true, createdAt: true, user: { select: { email: true } } } }),
  ])

  if (!a || !b) return res.status(404).json({ error: 'One or both sessions not found' })
  if (!a.voiceCentroid || !b.voiceCentroid) {
    return res.status(422).json({ error: 'One or both sessions have no voice centroid (recorded before this feature was added)' })
  }

  const centroidA = a.voiceCentroid as number[]
  const centroidB = b.voiceCentroid as number[]
  const similarity = cosineSimilarity(centroidA, centroidB)

  const verdict =
    similarity >= 0.90 ? 'same_speaker_high_confidence' :
    similarity >= 0.80 ? 'same_speaker_likely' :
    similarity >= 0.70 ? 'uncertain' :
    'different_speaker'

  return res.json({
    similarity: Math.round(similarity * 10000) / 10000,
    similarityPct: Math.round(similarity * 1000) / 10,
    verdict,
    sessionA: { id: a.id, email: a.user?.email, createdAt: a.createdAt },
    sessionB: { id: b.id, email: b.user?.email, createdAt: b.createdAt },
  })
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function listSessions(_req: AuthRequest, res: Response) {
  const sessions = await prisma.voiceSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      status: true,
      language: true,
      txHash: true,
      blockNumber: true,
      anchoredAt: true,
      validUntil: true,
      emailSentAt: true,
      kycVerified: true,
      audioCids: true,
      createdAt: true,
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  })
  return res.json(sessions)
}
