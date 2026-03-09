import Layout from '../components/shared/Layout'

export default function CgvPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Conditions Générales de Vente et d'Utilisation</h1>
          <p className="text-th-text-muted text-sm mt-1">Version 1.0 — Mars 2026 | Adelray SAS</p>
        </div>

        <section className="bg-panel border border-th-border rounded-2xl p-6 space-y-4 text-sm text-th-text-secondary leading-relaxed">

          <div>
            <h2 className="text-base font-bold text-th-text-primary mb-2">Article 1 — Éditeur du service</h2>
            <p><strong>Adelray SAS</strong> — RCS Paris 515 130 391<br />
            149 avenue du Maine, 75014 Paris, France<br />
            Email : contact@adelray.com<br />
            Hébergeur : OVH SAS, 2 rue Kellermann, 59100 Roubaix, France</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-th-text-primary mb-2">Article 2 — Objet</h2>
            <p>Les présentes CGV régissent l'accès et l'utilisation de la plateforme VoxProof, service de certification vocale par ancrage cryptographique sur la blockchain publique Avalanche. L'accès au service vaut acceptation pleine et entière des présentes CGV.</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-th-text-primary mb-2">Article 3 — Description du service</h2>
            <p>VoxProof permet d'enregistrer des échantillons vocaux, de générer une empreinte acoustique unique, de l'ancrer de manière immuable sur la blockchain Avalanche C-Chain et d'obtenir un certificat numérique horodaté.</p>
            <p className="mt-2"><strong>Caractère irréversible :</strong> toute empreinte ancrée sur la blockchain est par nature permanente et non modifiable. L'Utilisateur en est expressément informé avant toute certification.</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-th-text-primary mb-2">Article 4 — Accès au service</h2>
            <p>Service accessible à toute personne physique majeure ou personne morale dûment représentée, avec une adresse email valide. La création d'un compte et la validation de l'email confèrent le statut <strong>« Email vérifié »</strong>.</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-th-text-primary mb-2">Article 5 — Déclaration d'identité</h2>
            <p>En créant son compte, l'Utilisateur déclare sur l'honneur que les informations d'identité fournies sont exactes, qu'il est titulaire de l'adresse email renseignée, et que les enregistrements vocaux transmis sont les siens ou disposent d'une autorisation expresse écrite.</p>
            <p className="mt-2"><strong>Vérification d'identité optionnelle par session :</strong> lors d'une session de certification, l'Utilisateur peut choisir d'associer une vérification documentaire via Stripe Identity (document officiel + selfie). En cas de succès, la session est marquée <strong>« Identité vérifiée »</strong> et cette vérification est mémorisée sur le compte pour les sessions ultérieures.</p>
            <p className="mt-2">Toute fausse déclaration engage la responsabilité exclusive de l'Utilisateur.</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-th-text-primary mb-2">Article 6 — Tarifs et paiement</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse mt-2">
                <thead>
                  <tr className="bg-surface-2">
                    <th className="text-left px-3 py-2 border border-th-border">Offre</th>
                    <th className="text-left px-3 py-2 border border-th-border">Prix TTC</th>
                    <th className="text-left px-3 py-2 border border-th-border">Contenu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border border-th-border">Annuelle</td>
                    <td className="px-3 py-2 border border-th-border">15 € / an</td>
                    <td className="px-3 py-2 border border-th-border">1 certification vocale, renouvelable</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-th-border">À vie</td>
                    <td className="px-3 py-2 border border-th-border">65 €</td>
                    <td className="px-3 py-2 border border-th-border">1 certification vocale permanente</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2">Paiement via Stripe. Le droit de rétractation ne s'applique pas une fois l'empreinte ancrée sur la blockchain. Remboursement avant ancrage : contact@adelray.com (délai 48h).</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-th-text-primary mb-2">Article 7 — Données personnelles</h2>
            <p>Responsable : Adelray SAS, contact@adelray.com. Seul le hash SHA-256 de l'empreinte vocale est ancré sur la blockchain (public, permanent, non réversible). Les fichiers audio bruts sont supprimés automatiquement après 5 jours. Droits RGPD : accès, rectification, effacement, portabilité à contact@adelray.com.</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-th-text-primary mb-2">Article 8 — Responsabilités</h2>
            <p>Adelray s'engage à assurer la disponibilité du service et à ancrer les empreintes. La responsabilité d'Adelray est limitée au montant payé par l'Utilisateur pour la certification concernée.</p>
          </div>

          <div>
            <h2 className="text-base font-bold text-th-text-primary mb-2">Article 11 — Droit applicable — Médiation</h2>
            <p>Droit français. Médiation : CM2C, 14 rue Saint Jean, 75017 Paris — www.cm2c.net. À défaut, tribunaux de Paris.</p>
          </div>
        </section>

        <section className="bg-panel border border-th-border rounded-2xl p-6 space-y-4 text-sm text-th-text-secondary leading-relaxed">
          <h2 className="text-base font-bold text-th-text-primary">Terms and Conditions of Sale and Use (English)</h2>
          <p>This service is published by <strong>Adelray SAS</strong> — Paris Trade Register No. 515 130 391, 149 avenue du Maine, 75014 Paris, France. Hosting: OVH SAS, Roubaix, France.</p>
          <p>By creating an account, the User declares under their responsibility that identity information is accurate, that voice recordings are their own or authorised. Optional per-session identity verification via Stripe Identity marks the session as <strong>"Identity verified"</strong> and is cached for future sessions.</p>
          <p>Prices incl. VAT: Annual €15/year | Lifetime €65. Payment via Stripe. Right of withdrawal does not apply once fingerprint is anchored. These T&Cs are governed by French law. Mediation: CM2C — www.cm2c.net.</p>
        </section>

        <p className="text-xs text-th-text-muted text-center">
          Pour toute question : <a href="mailto:contact@adelray.com" className="text-th-accent hover:underline">contact@adelray.com</a>
        </p>
      </div>
    </Layout>
  )
}
