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
  const metal = {
    backgroundImage:
      "linear-gradient(180deg, #F4F6F7 0%, #D0D5DA 35%, #9AA3AB 70%, #6E777F 100%)",
    WebkitBackgroundClip: "text" as const,
    backgroundClip: "text" as const,
    color: "transparent",
    filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.25)) drop-shadow(0 2px 2px rgba(0,0,0,0.45))",
  };

  const accentA = {
    color: "#C4A574", // warm bronze — differentiated "a"
    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))",
  };

  const accentI = {
    color: "#7EB6FF", // cool steel-blue — differentiated "i"
    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))",
  };

  const inner = (
    <span
      className={`inline-flex items-baseline font-bold tracking-tight select-none ${sizeClass[size]} ${className}`}
      aria-label="theBallpit"
    >
      <span style={metal}>the</span>
      <span style={metal}>B</span>
      <span style={accentA}>a</span>
      <span style={metal}>llpit</span>
      {/* rebuild last letters so i can carry the ball dot */}
    </span>
  );

  // Cleaner explicit spelling with basketball-dotted i
  const mark = (
    <span
      className={`inline-flex items-baseline font-bold tracking-tight select-none ${sizeClass[size]} ${className}`}
      aria-label="theBallpit"
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
            top: size === "lg" ? "-0.05em" : size === "md" ? "-0.02em" : "0",
            fontSize: size === "lg" ? "0.42em" : "0.4em",
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
      <Link href={href} className="inline-flex items-center no-underline">
        {mark}
      </Link>
    );
  }

  return mark;
}
