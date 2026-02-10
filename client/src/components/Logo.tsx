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
      {/* Shadow */}
      <ellipse cx="50" cy="78" rx="28" ry="4" fill="rgba(0,0,0,0.06)" />

      {/* Left page spine edge (dark brown) */}
      <path
        d="M48 28 C38 24 22 26 16 31 L16 69 C22 67 38 64 48 67 Z"
        fill="#b07050"
      />
      {/* Left page (terracotta) */}
      <path
        d="M48 28 C38 24 24 26 20 30 L20 68 C26 66 38 64 48 67 Z"
        fill="#d4956e"
      />

      {/* Right page spine edge (light peach shadow) */}
      <path
        d="M52 28 C62 24 78 26 84 31 L84 69 C78 67 62 64 52 67 Z"
        fill="#e0c4a8"
      />
      {/* Right page (cream) */}
      <path
        d="M52 28 C62 24 76 26 80 30 L80 68 C74 66 62 64 52 67 Z"
        fill="#f2e0cc"
      />

      {/* Spine binding */}
      <rect x="47" y="26" width="6" height="44" rx="2" fill="#a0603c" />
    </svg>
  );
}
