import Link from "next/link";

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
  const metal: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(180deg, #F4F6F7 0%, #D0D5DA 35%, #9AA3AB 70%, #6E777F 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    filter:
      "drop-shadow(0 1px 0 rgba(255,255,255,0.2)) drop-shadow(0 2px 2px rgba(0,0,0,0.45))",
  };

  const accentA: React.CSSProperties = {
    color: "#C4A574",
    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.45))",
  };

  const accentI: React.CSSProperties = {
    color: "#C4A574",
    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.45))",
  };

  const mark = (
    <span
      className={`inline-flex items-baseline font-bold tracking-tight select-none ${sizeClass[size]} ${className}`}
      aria-label="theBallpit"
      style={{ background: "transparent" }}
    >
      <span style={metal}>the</span>
      <span style={metal}>B</span>
      <span style={accentA}>a</span>
      <span style={metal}>llp</span>
      <span className="relative inline-block" style={accentI}>
        ı
        <span
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            top: size === "lg" ? "-0.08em" : "-0.04em",
            fontSize: "0.38em",
            lineHeight: 1,
          }}
          aria-hidden
        >
          🏀
        </span>
      </span>
      <span style={metal}>t</span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center no-underline bg-transparent">
        {mark}
      </Link>
    );
  }

  return mark;
}
