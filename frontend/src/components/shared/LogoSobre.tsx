export default function LogoSobre({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 250 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="VoxProof"
    >
      {/* Sceau circulaire */}
      <circle cx="32" cy="32" r="30" fill="#2c3e6b" />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="#c9a84c" strokeWidth="0.8" />

      {/* Capsule micro */}
      <rect x="26" y="10" width="12" height="20" rx="6" fill="#c9a84c" />

      {/* Arc du pied de micro */}
      <path
        d="M21 28 Q21 46 32 46 Q43 46 43 28"
        fill="none"
        stroke="#c9a84c"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Tige verticale */}
      <line x1="32" y1="46" x2="32" y2="53" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />

      {/* Base */}
      <line x1="23" y1="53" x2="41" y2="53" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" />

      {/* Texte VoxProof */}
      <text
        x="74"
        y="30"
        dominantBaseline="middle"
        fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
        fontSize="26"
        fontWeight="700"
        fill="#2c3e6b"
      >
        VoxProof
      </text>

      {/* Sous-titre doré */}
      <text
        x="75"
        y="52"
        dominantBaseline="middle"
        fontFamily="Georgia, serif"
        fontSize="9"
        fill="#c9a84c"
        letterSpacing="0.18em"
      >
        NOTARISATION VOCALE
      </text>
    </svg>
  )
}
