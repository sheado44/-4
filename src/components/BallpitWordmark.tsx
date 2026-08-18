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

export default function BallpitWordmark({
  href = "/",
  size = "md",
  className = "",
}: Props) {
  // Bright platinum on dark header
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

  // Brighter bronze / copper for a + i
  const bronze: CSSProperties = {
    backgroundImage:
      "linear-gradient(165deg, #FFE2B0 0%, #F0C070 16%, #DFA050 38%, #C47A30 62%, #9A5520 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    filter:
      "drop-shadow(0 1px 0 rgba(255,230,180,0.45)) drop-shadow(0 2px 2px rgba(40,18,6,0.55))",
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
      <span style={metal}>ll</span>
      <span style={metal}>p</span>
      <span style={bronze}>i</span>
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
