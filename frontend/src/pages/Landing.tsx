import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <span className="text-6xl">🎙️</span>
        <h1 className="text-5xl font-bold text-gray-900 mt-6 leading-tight">
          Your voice, <span className="text-brand-600">forever on-chain</span>
        </h1>
        <p className="mt-5 text-xl text-gray-500 max-w-2xl mx-auto">
          Record, store, and notarize your voice recordings on the Avalanche blockchain.
          Get a tamper-proof certificate that anyone can verify — forever.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link to="/register"
            className="bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-colors">
            Get Started Free
          </Link>
          <Link to="/login"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors">
            Sign In
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: '📝', step: '1', title: 'Register', desc: 'Create your account with email and password' },
            { icon: '🪪', step: '2', title: 'Verify ID', desc: 'Quick KYC with your ID card and selfie via Stripe Identity' },
            { icon: '🎤', step: '3', title: 'Record', desc: 'Record or upload your voice audio' },
            { icon: '⛓️', step: '4', title: 'Get Proof', desc: 'Your audio hash is anchored on Avalanche — immutable forever' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-2xl mx-auto">
                {item.icon}
              </div>
              <p className="text-brand-600 font-bold text-sm mt-3">STEP {item.step}</p>
              <h3 className="font-semibold text-gray-900 mt-1">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Simple pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="font-bold text-xl text-gray-900">Starter</h3>
              <p className="text-4xl font-bold text-gray-900 mt-3">€9<span className="text-lg text-gray-400">/mo</span></p>
              <ul className="mt-6 space-y-2 text-sm text-gray-600">
                <li>✓ 10 recordings per month</li>
                <li>✓ IPFS storage</li>
                <li>✓ Blockchain proof certificate</li>
                <li>✓ Avalanche C-Chain anchoring</li>
              </ul>
              <Link to="/register" className="block mt-6 text-center border border-brand-600 text-brand-600 py-2.5 rounded-xl font-medium hover:bg-brand-50">
                Get started
              </Link>
            </div>
            <div className="bg-brand-600 rounded-2xl p-8 text-white">
              <h3 className="font-bold text-xl">Pro</h3>
              <p className="text-4xl font-bold mt-3">€29<span className="text-lg text-white/60">/mo</span></p>
              <ul className="mt-6 space-y-2 text-sm text-white/80">
                <li>✓ 100 recordings per month</li>
                <li>✓ Priority IPFS pinning</li>
                <li>✓ PDF proof certificates</li>
                <li>✓ Everything in Starter</li>
              </ul>
              <Link to="/register" className="block mt-6 text-center bg-white text-brand-600 py-2.5 rounded-xl font-medium hover:bg-gray-50">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
