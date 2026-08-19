"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import NotificationLog, {
  DEFAULT_PREFS,
  PREF_LABELS,
  loadNotifyPrefs,
  saveNotifyPrefs,
  type PrefKey,
  type Prefs,
} from "@/components/NotificationLog";

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setPrefs(await loadNotifyPrefs(user.id));
      setLoading(false);
    };
    boot();
  }, []);

  const toggle = async (key: PrefKey) => {
    if (!userId) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await saveNotifyPrefs(userId, next);
    setMessage("Mix saved.");
  };

  if (!loading && !userId) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold mb-3">Event log</h1>
        <p className="text-sm text-muted-pit">
          A theBallpit account is required.{" "}
          <Link href="/login" className="text-highlight-pit">
            Log in
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-2">Event log</h1>
      <p className="text-sm text-muted-pit mb-6">
        Timestamp, who, what they said or published, and a link. Pick the mix.
      </p>

      <div className="pit-panel p-4 mb-6 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit">Custom mix</div>
        {PREF_LABELS.map((row) => (
          <label key={row.key} className="flex items-start justify-between gap-3 text-sm">
            <span>
              <span className="block" style={{ color: "var(--pit-text)" }}>
                {row.label}
              </span>
              <span className="block text-[11px] text-muted-pit">{row.hint}</span>
            </span>
            <input
              type="checkbox"
              checked={prefs[row.key]}
              onChange={() => toggle(row.key)}
              className="h-4 w-4 mt-1"
            />
          </label>
        ))}
        {message && <p className="text-xs text-muted-pit">{message}</p>}
      </div>

      {userId && !loading && <NotificationLog userId={userId} prefs={prefs} />}
    </main>
  );
}
