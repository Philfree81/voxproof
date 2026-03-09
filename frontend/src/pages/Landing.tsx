import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface">

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 md:pt-24 md:pb-16 text-center">
        <span className="text-5xl sm:text-6xl">🎙️</span>
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
          <p className="text-center text-th-text-muted mb-12">Un achat = une certification vocale complète ancrée sur la blockchain</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-panel rounded-2xl border border-th-border p-8">
              <h3 className="font-bold text-xl text-th-text-primary">Annuel</h3>
              <p className="text-4xl font-bold text-th-text-primary mt-3">15 €<span className="text-lg text-th-text-muted">/an</span></p>
              <p className="text-sm text-th-text-muted mt-2">Renouvellement conseillé chaque année pour maintenir une empreinte à jour</p>
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
              <h3 className="font-bold text-xl">À vie</h3>
              <p className="text-4xl font-bold mt-3">65 €<span className="text-lg text-white/60"> une fois</span></p>
              <p className="text-sm text-white/70 mt-2">Idéal pour une preuve d'antériorité ou une archive définitive</p>
              <ul className="mt-6 space-y-2 text-sm text-white/80">
                <li>✓ 1 certification vocale complète</li>
                <li>✓ Validité permanente sur la blockchain</li>
                <li>✓ Certificat PDF officiel</li>
                <li>✓ Aucun renouvellement requis</li>
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
