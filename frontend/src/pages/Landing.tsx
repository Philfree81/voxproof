import { Link } from 'react-router-dom'
import { useThemeStore } from '../store/themeStore'
import LogoSobre from '../components/shared/LogoSobre'

function HeroLogo() {
  const { theme } = useThemeStore()
  if (theme === 'futuriste') {
    return (
      <img
        src="/logo.png"
        alt="VoxProof"
        className="h-48 w-auto mx-auto"
        style={{ filter: 'drop-shadow(0 0 20px #00e5ff) drop-shadow(0 0 8px #00e5ff)' }}
      />
    )
  }
  if (theme === 'blue') {
    return <img src="/logo.jpeg" alt="VoxProof" className="h-20 w-auto mx-auto" />
  }
  if (theme === 'sobre') {
    return <LogoSobre className="h-16 w-auto mx-auto" />
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-5xl sm:text-6xl">🎙️</span>
      <span className="text-3xl sm:text-4xl font-bold text-th-text-primary tracking-tight">VoxProof</span>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 md:pt-24 md:pb-16 text-center">
        <HeroLogo />
        <h1 className="text-3xl sm:text-5xl font-bold text-th-text-primary mt-6 leading-tight">
          Votre voix, <span className="text-th-accent">pour toujours sur la blockchain</span>
        </h1>
        <p className="mt-5 text-base sm:text-xl text-th-text-muted max-w-2xl mx-auto">
          Enregistrez, certifiez et notarisez votre empreinte vocale sur la blockchain Avalanche.
          Obtenez un certificat infalsifiable, vérifiable par tous — définitivement.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link to="/register"
            className="bg-th-accent text-white px-6 sm:px-8 py-3 rounded-xl font-semibold text-base sm:text-lg hover:bg-th-accent-hover transition-colors">
            Commencer gratuitement
          </Link>
          <Link to="/login"
            className="border border-th-border text-th-text-secondary px-6 sm:px-8 py-3 rounded-xl font-semibold text-base sm:text-lg hover:bg-surface-2 transition-colors">
            Se connecter
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-th-text-primary text-center mb-12">Comment ça marche</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: '📝', step: '1', title: 'Inscription', desc: 'Créez votre compte avec votre email et un mot de passe' },
            { icon: '🪪', step: '2', title: 'Vérification', desc: 'Vérification d\'identité KYC via Stripe Identity (pièce d\'identité + selfie)' },
            { icon: '🎤', step: '3', title: 'Enregistrement', desc: 'Lisez 5 textes à voix haute pour capturer votre empreinte acoustique' },
            { icon: '⛓️', step: '4', title: 'Certification', desc: 'Vos empreintes sont ancrées sur Avalanche — immuables et vérifiables pour toujours' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-14 h-14 bg-th-accent-subtle rounded-2xl flex items-center justify-center text-2xl mx-auto">
                {item.icon}
              </div>
              <p className="text-th-accent font-bold text-sm mt-3">ÉTAPE {item.step}</p>
              <h3 className="font-semibold text-th-text-primary mt-1">{item.title}</h3>
              <p className="text-sm text-th-text-muted mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-surface-2 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-th-text-primary text-center mb-4">Tarifs simples</h2>
          <p className="text-center text-th-text-muted mb-12">Chaque certification est ancrée définitivement sur la blockchain — aucun abonnement</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-panel rounded-2xl border border-th-border p-8">
              <h3 className="font-bold text-xl text-th-text-primary">1 certification</h3>
              <p className="text-4xl font-bold text-th-text-primary mt-3">14 €</p>
              <p className="text-sm text-th-text-muted mt-2">Pour certifier votre voix une fois, avec preuve blockchain permanente</p>
              <ul className="mt-6 space-y-2 text-sm text-th-text-secondary">
                <li>✓ 1 certification vocale complète</li>
                <li>✓ Certificat PDF officiel</li>
                <li>✓ Ancrage blockchain Avalanche</li>
                <li>✓ Empreinte biométrique vocale</li>
              </ul>
              <Link to="/register" className="block mt-6 text-center border border-th-accent text-th-accent py-2.5 rounded-xl font-medium hover:bg-th-accent-subtle transition-colors">
                Commencer
              </Link>
            </div>
            <div className="bg-th-accent rounded-2xl p-8 text-white">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-xl">Pack 5 certifications</h3>
                <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">−19 %</span>
              </div>
              <p className="text-4xl font-bold mt-3">57 €<span className="text-lg text-white/60"> soit 11,40 €/cert.</span></p>
              <p className="text-sm text-white/70 mt-2">Pour plusieurs certifications ou plusieurs membres d'une équipe</p>
              <ul className="mt-6 space-y-2 text-sm text-white/80">
                <li>✓ 5 certifications vocales complètes</li>
                <li>✓ Certificats PDF officiels</li>
                <li>✓ Ancrage blockchain Avalanche</li>
                <li>✓ Crédits utilisables à votre rythme</li>
              </ul>
              <Link to="/register" className="block mt-6 text-center bg-white text-th-accent py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
                Commencer
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
