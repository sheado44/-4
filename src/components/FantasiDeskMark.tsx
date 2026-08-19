export default function FantasiDeskMark({
  size = "hero",
}: {
  size?: "hero" | "nav";
}) {
  const a = { color: "#D4A056" };
  const i = { color: "#F4F7FB" };
  return (
    <span
      className={size === "nav" ? "text-sm font-extrabold" : "font-extrabold"}
      style={{ letterSpacing: "-0.03em" }}
    >
      f<span style={a}>a</span>nt<span style={a}>a</span>s<span style={i}>i</span>Desk
    </span>
  );
}
