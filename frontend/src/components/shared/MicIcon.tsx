interface MicIconProps {
  className?: string
}

export default function MicIcon({ className = 'w-10 h-14' }: MicIconProps) {
  return (
    <svg viewBox="0 0 64 96" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="4" width="28" height="48" rx="14" fill="currentColor" className="text-th-accent" />
      <line x1="18" y1="24" x2="46" y2="24" stroke="white" strokeWidth="1.2" strokeOpacity="0.3" />
      <line x1="18" y1="32" x2="46" y2="32" stroke="white" strokeWidth="1.2" strokeOpacity="0.3" />
      <line x1="18" y1="40" x2="46" y2="40" stroke="white" strokeWidth="1.2" strokeOpacity="0.3" />
      <line x1="26" y1="4" x2="26" y2="52" stroke="white" strokeWidth="1.2" strokeOpacity="0.3" />
      <line x1="38" y1="4" x2="38" y2="52" stroke="white" strokeWidth="1.2" strokeOpacity="0.3" />
      <path d="M10 44 Q10 68 32 68 Q54 68 54 44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-th-accent" />
      <line x1="32" y1="68" x2="32" y2="84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-th-accent" />
      <line x1="20" y1="84" x2="44" y2="84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-th-accent" />
      <rect x="24" y="10" width="6" height="20" rx="3" fill="white" fillOpacity="0.18" />
    </svg>
  )
}
