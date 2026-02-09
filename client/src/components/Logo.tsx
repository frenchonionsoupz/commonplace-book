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
      {/* Book cover - front */}
      <path
        d="M30 20 L80 25 L80 85 L30 80 Z"
        fill="#c27c5c"
      />
      {/* Book spine */}
      <path
        d="M20 22 L30 20 L30 80 L20 82 Z"
        fill="#9a6648"
      />
      {/* Book pages - top */}
      <path
        d="M20 22 L30 20 L80 25 L70 23 L22 19 Z"
        fill="#e8ddd0"
        stroke="#9a6648"
        strokeWidth="1"
      />
      {/* Spine edge highlight */}
      <line
        x1="30"
        y1="20"
        x2="30"
        y2="80"
        stroke="#7d5339"
        strokeWidth="2"
      />
    </svg>
  );
}
