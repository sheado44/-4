export default function MashPitMark({
  size = "hero",
}: {
  size?: "hero" | "nav";
}) {
  const mark = { color: "#D4A056" };
  return (
    <span
      className={size === "nav" ? "text-sm font-extrabold" : "font-extrabold"}
      style={{ letterSpacing: "-0.03em" }}
    >
      m<span style={mark}>a</span>shP<span style={mark}>i</span>t
    </span>
  );
}
