import Link from "next/link";
import type { CSSProperties } from "react";

type Props = {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "text-lg md:text-xl",
  md: "text-xl md:text-2xl",
  lg: "text-2xl md:text-3xl",
};

function BasketballDot({ large }: { large?: boolean }) {
  return (
    <span
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{
        top: large ? "-0.14em" : "-0.1em",
        width: large ? "0.55em" : "0.48em",
        height: large ? "0.55em" : "0.48em",
      }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%">
        <defs>
          <radialGradient id="ballGrad" cx="34%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#F6B06A" />
            <stop offset="45%" stopColor="#E06B2A" />
            <stop offset="100%" stopColor="#8F2F0E" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#ballGrad)" />
        <path
          d="M32 2 C22 18 22 46 32 62 M32 2 C42 18 42 46 32 62 M2 32 H62"
          fill="none"
          stroke="#2A1810"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M8 18 C20 28 44 28 56 18 M8 46 C20 36 44 36 56 46"
          fill="none"
          stroke="#2A1810"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <ellipse cx="22" cy="18" rx="8" ry="5" fill="rgba(255,255,255,0.28)" />
      </svg>
    </span>
  );
}

export default function BallpitWordmark({
  href = "/",
  size = "md",
  className = "",
}: Props) {
  // Bright platinum / aluminum — high contrast on dark header
  const metal: CSSProperties = {
    backgroundImage:
      "linear-gradient(180deg, #FFFFFF 0%, #F2F4F6 18%, #C8CED4 48%, #9AA3AB 78%, #B8C0C8 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    filter:
      "drop-shadow(0 1px 0 rgba(255,255,255,0.45)) drop-shadow(0 2px 3px rgba(0,0,0,0.75))",
  };

  // Bronze / copper accents (a + i)
  const bronze: CSSProperties = {
    backgroundImage:
      "linear-gradient(165deg, #F0D0A0 0%, #D4A05A 18%, #B87333 42%, #8B5A2B 68%, #5C3A1E 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    filter:
      "drop-shadow(0 1px 0 rgba(255,220,170,0.35)) drop-shadow(0 2px 2px rgba(40,18,6,0.55))",
  };

  const mark = (
    <span
      className={`inline-flex items-baseline font-bold tracking-tight select-none ${sizeClass[size]} ${className}`}
      aria-label="theBallpit"
      style={{ background: "transparent" }}
    >
      <span style={metal}>the</span>
      <span style={metal}>B</span>
      <span style={bronze}>a</span>
      <span style={metal}>llp</span>
      <span className="relative inline-block" style={bronze}>
        ı
        <BasketballDot large={size === "lg"} />
      </span>
      <span style={metal}>t</span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center no-underline bg-transparent"
      >
        {mark}
      </Link>
    );
  }

  return mark;
}
