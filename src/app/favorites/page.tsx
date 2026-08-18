"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type FavRow = {
  favorite_user_id: string;
  display_name: string;
  location: string | null;
};

export default function FavoritesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<FavRow[]>([]);
  const [message, setMessage] = useState("");

  const load = async (uid: string) => {
    const { data: favRows, error } = await supabase
      .from("favorites")
      .select("favorite_user_id")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setRows([]);
      return;
    }

    const list: FavRow[] = [];
    for (const row of favRows || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, location")
        .eq("id", row.favorite_user_id)
        .maybeSingle();

      list.push({
        favorite_user_id: row.favorite_user_id,
        display_name: profile?.display_name || "User",
        location: profile?.location || null,
      });
    }
    setRows(list);
  };

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      await load(user.id);
      setLoading(false);
    };
    boot();
  }, [router]);

  const removeFavorite = async (favoriteUserId: string, name: string) => {
    if (!userId) return;
    setMessage("");

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("favorite_user_id", favoriteUserId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Removed ${name}.`);
    await load(userId);
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-pit">
        Loading favorites...
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--pit-text)" }}>
          Manage favorites
        </h1>
        <Link href="/" className="text-sm text-muted-pit hover:opacity-100">
          Back home
        </Link>
      </div>

      {message && <p className="text-sm text-yellow-500 mb-4">{message}</p>}

      {rows.length === 0 ? (
        <div className="pit-panel p-6 text-sm text-muted-pit">
          No favorites yet. Use Find on the home page to add people.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.favorite_user_id}
              className="pit-panel p-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/profile/${r.favorite_user_id}`}
                  className="font-medium hover:opacity-80 block truncate"
                  style={{ color: "var(--pit-text)" }}
                >
                  {r.display_name}
                </Link>
                <div className="text-xs text-muted-pit truncate">
                  {r.location || "No location"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFavorite(r.favorite_user_id, r.display_name)}
                className="text-xs px-3 py-1.5 rounded-lg btn-metal shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
