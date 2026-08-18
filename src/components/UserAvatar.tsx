import Link from "next/link";

type Props = {
  name: string;
  avatarUrl?: string | null;
  userId?: string | null;
  size?: number;
};

export default function UserAvatar({ name, avatarUrl, userId, size = 28 }: Props) {
  const initials = (name || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const img = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover border border-white/10 bg-black/20 shrink-0"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        background: "color-mix(in srgb, var(--pit-highlight) 70%, black 30%)",
      }}
    >
      {initials}
    </div>
  );

  if (userId) {
    return (
      <Link href={`/profile/${userId}`} className="shrink-0">
        {img}
      </Link>
    );
  }

  return img;
}
