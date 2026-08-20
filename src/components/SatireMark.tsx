export default function SatireMark({
  size = "hero",
}: {
  size?: "hero" | "nav";
}) {
  const mark = { color: "#D4A056" };
  const lab = { color: "#F4F7FB" };
  return (
    <span
      className={size === "nav" ? "text-sm font-extrabold" : "font-extrabold"}
      style={{ letterSpacing: "-0.03em" }}
    >
      s<span style={mark}>a</span>t<span style={mark}>i</span>re
      <span style={lab}>Lab</span>
    </span>
  );
}

