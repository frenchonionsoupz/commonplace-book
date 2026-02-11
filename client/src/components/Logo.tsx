interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left page */}
      <path d="M50 30 L50 75 L15 68 L15 25 Z" fill="#c88050" />
      {/* Right page */}
      <path d="M50 30 L50 75 L85 68 L85 25 Z" fill="#f0d5b8" />
      {/* Spine */}
      <line x1="50" y1="28" x2="50" y2="76" stroke="#a0603c" strokeWidth="3" strokeLinecap="round" />
      {/* Left page lines */}
      <line x1="24" y1="38" x2="44" y2="41" stroke="#a86840" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="24" y1="46" x2="44" y2="49" stroke="#a86840" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
      <line x1="24" y1="54" x2="44" y2="57" stroke="#a86840" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
    </svg>
  );
}
