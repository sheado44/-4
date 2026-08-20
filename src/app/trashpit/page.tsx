"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TrashPitMark from "@/components/TrashPitMark";
import { supabase } from "@/lib/supabaseClient";
import { formatTime } from "@/lib/time";

type Item = {
  id: string;
  title: string;
  section: string;
  created_at: string;
};

export default function TrashPitPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id || null;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data: rows } = await supabase
        .from("articles")
        .select("id, title, section, created_at")
        .eq("user_id", uid)
        .eq("status", "discarded")
        .order("created_at", { ascending: false })
        .limit(50);
      setItems(rows || []);
      setLoading(false);
    };
    boot();
  }, []);

  if (!userId && !loading) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold mb-2">
          <TrashPitMark />
        </h1>
        <p className="text-sm text-muted-pit mb-5">
          Personal discard. Not a public feed. Log in to see what you threw out.
        </p>
        <Link href="/login" className="btn-write inline-block px-5 py-2.5 rounded-xl text-sm">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-pit">not a public room</div>
      <h1 className="text-3xl font-extrabold mb-2">
        <TrashPitMark />
      </h1>
      <p className="text-sm text-muted-pit mb-6">
        Stuff you made and did not throw in the pit. Only you can see this. satireLab is the public fiction lab.
      </p>
      {loading ? (
        <p className="text-sm text-muted-pit">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-pit">Empty. From Write, send a draft here instead of publishing.</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => (
            <Link
              key={a.id}
              href={`/article/${a.id}`}
              className="block pit-panel px-4 py-3"
            >
              <div className="font-medium truncate">{a.title}</div>
              <div className="text-[11px] text-muted-pit">
                {a.section} · {formatTime(a.created_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

