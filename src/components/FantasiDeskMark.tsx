export default function FantasiDeskMark({
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
      fant<span style={mark}>a</span>s<span style={mark}>i</span>Desk
    </span>
  );
}
