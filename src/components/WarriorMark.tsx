export default function WarriorMark({
  size = "md",
}: {
  size?: "sm" | "md";
}) {
  const letters = ["w", "a", "r", "r", "i", "o", "r"];
  const small = size === "sm";
  return (
    <span
      className="inline-flex items-center gap-[3px]"
      title="keyboard warrior"
      aria-label="warrior"
    >
      {letters.map((ch, i) => {
        const accent = ch === "a" || ch === "i";
        return (
          <span
            key={`${ch}-${i}`}
            className="inline-flex items-center justify-center font-bold uppercase"
            style={{
              width: small ? 16 : 22,
              height: small ? 18 : 26,
              fontSize: small ? 9 : 11,
              letterSpacing: 0,
              borderRadius: small ? 3 : 4,
              background:
                "linear-gradient(180deg, #F4F7FB 0%, #C8CDD2 52%, #8B9298 100%)",
              color: accent ? "#7A5A22" : "#1E2022",
              border: "1px solid #D4A056",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.75), 0 1px 0 rgba(0,0,0,0.35)",
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export function isWarrior(
  comments: { created_at: string }[],
  minTotal = 5
) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = comments.filter(
    (c) => new Date(c.created_at).getTime() >= weekAgo
  ).length;
  return recent >= 50 || comments.length >= minTotal;
}

