import { env } from '../config/env'

interface Attachment {
  name: string
  content: string // base64
}

interface SendCertificateParams {
  to: { email: string; name: string }
  sessionId: string
  txHash: string
  acousticHash: string
  blockNumber: number
  validUntil: Date | null
  pdfBase64: string
  audioFiles: Express.Multer.File[]
}

async function sendSimpleEmail(to: { email: string; name: string }, subject: string, htmlContent: string): Promise<void> {
  console.log('[Brevo] apiKey:', env.brevoApiKey ? 'SET' : 'EMPTY', '| sender:', env.brevoSenderEmail)
  if (!env.brevoApiKey) {
    console.warn('BREVO_API_KEY not set — skipping email')
    return
  }
  console.log(`[Brevo] Sending "${subject}" to ${to.email}`)
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': env.brevoApiKey },
    body: JSON.stringify({
      sender: { name: env.brevoSenderName, email: env.brevoSenderEmail },
      to: [{ email: to.email, name: to.name }],
      subject,
      htmlContent,
    }),
  })
  const body = await response.json().catch(() => ({}))
  console.log(`[Brevo] Response ${response.status}:`, JSON.stringify(body))
  if (!response.ok) {
    throw new Error(`Brevo email error: ${(body as any).message || response.statusText}`)
  }
}

export async function sendWelcomeEmail(to: { email: string; name: string }): Promise<void> {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a2e; font-size: 24px;">🎙️ VoxProof</h1>
  </div>
  <h2 style="color: #1a1a2e;">Bienvenue sur VoxProof !</h2>
  <p>Bonjour <strong>${to.name}</strong>,</p>
  <p>Votre compte a bien été créé. Vous pouvez maintenant vous connecter et commencer votre certification vocale sur la blockchain Avalanche.</p>
  <p>Prochaine étape : vérifiez votre identité (KYC) pour débloquer les enregistrements.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #aaa; font-size: 12px; text-align: center;">VoxProof — Certification vocale sur Avalanche Blockchain</p>
</body></html>`
  await sendSimpleEmail(to, 'Bienvenue sur VoxProof', html)
  console.log(`Welcome email sent to ${to.email}`)
}

export async function sendPasswordResetEmail(to: { email: string; name: string }, resetUrl: string): Promise<void> {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a2e; font-size: 24px;">🎙️ VoxProof</h1>
  </div>
  <h2 style="color: #1a1a2e;">Réinitialisation de votre mot de passe</h2>
  <p>Bonjour <strong>${to.name}</strong>,</p>
  <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
      Réinitialiser mon mot de passe
    </a>
  </div>
  <p style="color: #666; font-size: 13px;">Ce lien expire dans <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #aaa; font-size: 12px; text-align: center;">VoxProof — Certification vocale sur Avalanche Blockchain</p>
</body></html>`
  await sendSimpleEmail(to, 'Réinitialisation de votre mot de passe VoxProof', html)
  console.log(`Password reset email sent to ${to.email}`)
}

export async function sendCertificateEmail(params: SendCertificateParams): Promise<void> {
  if (!env.brevoApiKey) {
    console.warn('BREVO_API_KEY not set — skipping email')
    return
  }

  const { to, sessionId, txHash, acousticHash, blockNumber, validUntil, pdfBase64, audioFiles } = params

  const pdfAttachment: Attachment = {
    name: `voxproof-certificate-${sessionId.slice(0, 8)}.pdf`,
    content: pdfBase64,
  }
  const audioAttachments: Attachment[] = audioFiles.map((file, i) => ({
    name: `enregistrement-${i + 1}${getExtension(file.originalname)}`,
    content: file.buffer.toString('base64'),
  }))

  // Brevo limite les pièces jointes à ~5 MB (base64). Si les audios dépassent 4 MB, on ne joint que le PDF.
  const audioSizeBytes = audioAttachments.reduce((sum, a) => sum + a.content.length, 0)
  const attachments: Attachment[] = audioSizeBytes < 4 * 1024 * 1024
    ? [pdfAttachment, ...audioAttachments]
    : [pdfAttachment]

  const audioNote = audioSizeBytes >= 4 * 1024 * 1024
    ? '<p style="color:#b45309;font-size:13px;">⚠ Vos fichiers audio sont trop volumineux pour être joints par email. Vous pouvez les télécharger depuis votre tableau de bord.</p>'
    : ''

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a2e; font-size: 24px;">VoxProof</h1>
    <p style="color: #666; font-size: 14px;">Certification vocale blockchain</p>
  </div>

  <h2 style="color: #1a1a2e;">Votre certificat vocal est prêt</h2>

  <p>Bonjour <strong>${to.name}</strong>,</p>

  <p>Votre empreinte vocale a été ancrée avec succès sur la blockchain Avalanche.
  Vous trouverez en pièce jointe votre certificat PDF ainsi que vos 5 enregistrements audio.</p>
  ${audioNote}

  <div style="background: #f5f5f5; border-left: 4px solid #e94560; padding: 15px; margin: 20px 0; border-radius: 4px;">
    <h3 style="margin-top: 0; color: #1a1a2e;">Détails de la certification</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 0; color: #666; width: 140px;">Session ID</td>
        <td style="padding: 6px 0; font-family: monospace; font-size: 12px;">${sessionId}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #666;">Transaction hash</td>
        <td style="padding: 6px 0; font-family: monospace; font-size: 12px; word-break: break-all;">${txHash}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #666;">Bloc</td>
        <td style="padding: 6px 0; font-family: monospace;">#${blockNumber}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #666;">Hash acoustique</td>
        <td style="padding: 6px 0; font-family: monospace; font-size: 12px; word-break: break-all;">${acousticHash}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #666;">Valide jusqu'au</td>
        <td style="padding: 6px 0;">${validUntil ? validUntil.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'À vie'}</td>
      </tr>
    </table>
  </div>

  <p style="color: #666; font-size: 13px;">
    Conservez précieusement ces fichiers. Le certificat PDF et vos enregistrements constituent
    la preuve de votre identité vocale à la date du ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #aaa; font-size: 12px; text-align: center;">
    VoxProof — Certification vocale sur Avalanche Blockchain<br>
    Cet email a été envoyé automatiquement, merci de ne pas y répondre.
  </p>
</body>
</html>`

  const payload = {
    sender: { name: env.brevoSenderName, email: env.brevoSenderEmail },
    to: [{ email: to.email, name: to.name }],
    subject: 'Votre certificat vocal VoxProof est prêt',
    htmlContent: htmlBody,
    attachment: attachments,
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.brevoApiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { message?: string }
    throw new Error(`Brevo email error: ${error.message || response.statusText}`)
  }

  console.log(`Certificate email sent to ${to.email} for session ${sessionId}`)
}

function getExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/)
  return match ? match[0] : '.webm'
}
