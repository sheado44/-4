import { supabase } from "@/lib/supabaseClient";

export type PrefKey =
  | "favorite_articles"
  | "my_article_comments"
  | "replies_to_me"
  | "moshpit_replies"
  | "watchlist";

export type Prefs = Record<PrefKey, boolean>;

export const DEFAULT_PREFS: Prefs = {
  favorite_articles: true,
  my_article_comments: true,
  replies_to_me: true,
  moshpit_replies: true,
  watchlist: false,
};

export const PREF_LABELS: { key: PrefKey; label: string; hint: string }[] = [
  { key: "favorite_articles", label: "Favorites published", hint: "New articles from favorites" },
  { key: "my_article_comments", label: "Comments on my articles", hint: "Talk on a piece I wrote" },
  { key: "replies_to_me", label: "Replies to my comments", hint: "Answers under an article" },
  { key: "moshpit_replies", label: "theMoshpit replies", hint: "Answers on my pit posts" },
  { key: "watchlist", label: "Watchlist activity", hint: "Favorites commenting anywhere" },
];

export async function loadNotifyPrefs(userId: string): Promise<Prefs> {
  let next = { ...DEFAULT_PREFS };
  try {
    const raw = localStorage.getItem("ballpit-notify-prefs");
    if (raw) next = { ...next, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_prefs")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.notification_prefs && typeof profile.notification_prefs === "object") {
    next = { ...next, ...profile.notification_prefs };
  }
  return next;
}

export async function saveNotifyPrefs(userId: string, prefs: Prefs) {
  localStorage.setItem("ballpit-notify-prefs", JSON.stringify(prefs));
  await supabase.from("profiles").update({ notification_prefs: prefs }).eq("id", userId);
}
