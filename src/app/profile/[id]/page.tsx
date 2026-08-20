"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { formatTime, formatTimeFull } from "@/lib/time";
import WarriorMark, { isWarrior } from "@/components/WarriorMark";

type Article = {
  id: string;
  title: string;
  section: string;
  body: string;
  created_at: string;
};

type Comment = {
  id: string;
  article_id: string;
  body: string;
  created_at: string;
  article_title?: string;
};

type Relationship = {
  tier: "BFF" | "Ally" | "Neutral" | "Foe" | "Strangers";
  positive: number;
  negative: number;
  total: number;
};

function calcTier(positive: number, negative: number): Relationship {
  const total = positive + negative;
  if (total === 0) return { tier: "Strangers", positive, negative, total };
  const ratio = positive / total;
  if (ratio >= 0.95) return { tier: "BFF", positive, negative, total };
  if (ratio >= 0.7) return { tier: "Ally", positive, negative, total };
  if (ratio <= 0.3) return { tier: "Foe", positive, negative, total };
  return { tier: "Neutral", positive, negative, total };
}

function tierColor(tier: Relationship["tier"]) {
  switch (tier) {
    case "BFF":
      return "text-pink-300 border-pink-400/40 bg-pink-500/10";
    case "Ally":
      return "text-green-300 border-green-400/40 bg-green-500/10";
    case "Foe":
      return "text-red-300 border-red-400/40 bg-red-500/10";
    case "Neutral":
      return "text-yellow-200 border-yellow-400/30 bg-yellow-500/10";
    default:
      return "text-gray-300 border-gray-400/30 bg-black/20";
  }
}

export default function PublicProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [displayName, setDisplayName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [link, setLink] = useState("");
  const [sex, setSex] = useState("");
  const [age, setAge] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [warriorComments, setWarriorComments] = useState<{ created_at: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"articles" | "comments" | "satire">("articles");
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");
  const [acceptingSponsors, setAcceptingSponsors] = useState(false);
  const [giftTier, setGiftTier] = useState<"press" | "desk">("desk");
  const [giftLength, setGiftLength] = useState<"month" | "ongoing">("month");
  const [giftMessage, setGiftMessage] = useState("");
  const [gifting, setGifting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      const { data: authData } = await supabase.auth.getUser();
      const viewer = authData.user;
      setViewerId(viewer?.id || null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, bio, link, sex, age, location, updated_at, avatar_url, plan, accepting_sponsors")
        .eq("id", id)
        .maybeSingle();

      const { data: articleData } = await supabase
        .from("articles")
        .select("id, title, section, body, created_at, author_name")
        .eq("user_id", id)
        .order("created_at", { ascending: false });

      const mappedArticles = (articleData || []).map((a) => ({
        id: a.id,
        title: a.title,
        section: a.section,
        body: a.body,
        created_at: a.created_at,
      }));
      setArticles(mappedArticles);

      const { data: stamp } = await supabase
        .from("comments")
        .select("created_at")
        .eq("user_id", id);
      setWarriorComments(stamp || []);

      if (viewer?.id) {
        const { data: commentData } = await supabase
          .from("comments")
          .select("id, article_id, body, created_at")
          .eq("user_id", id)
          .order("created_at", { ascending: false });

        const commentsWithTitles: Comment[] = [];
        for (const comment of commentData || []) {
          const { data: art } = await supabase
            .from("articles")
            .select("title")
            .eq("id", comment.article_id)
            .single();
          commentsWithTitles.push({
            ...comment,
            article_title: art?.title || "Article",
          });
        }
        setComments(commentsWithTitles);

        if (viewer.id !== id) {
          let positive = 0;
          let negative = 0;

          const theirCommentIds = (commentData || []).map((c) => c.id);
          if (theirCommentIds.length > 0) {
            const { data: votesOnThem } = await supabase
              .from("comment_votes")
              .select("vote")
              .eq("user_id", viewer.id)
              .in("comment_id", theirCommentIds);
            (votesOnThem || []).forEach((v) => {
              if (v.vote === 1) positive += 1;
              if (v.vote === -1) negative += 1;
            });
          }

          const theirArticleIds = mappedArticles.map((a) => a.id);
          if (theirArticleIds.length > 0) {
            const { data: ratings } = await supabase
              .from("ratings")
              .select("stars")
              .eq("user_id", viewer.id)
              .in("article_id", theirArticleIds);
            (ratings || []).forEach((r) => {
              if (r.stars >= 4) positive += 1;
              else if (r.stars <= 2) negative += 1;
            });
          }

          setRelationship(calcTier(positive, negative));
        } else {
          setRelationship(null);
        }
      } else {
        setComments([]);
        setRelationship(null);
        if (activeTab === "comments") setActiveTab("articles");
      }

      if (profile?.display_name) setDisplayName(profile.display_name);
      else if (articleData?.[0]?.author_name) setDisplayName(articleData[0].author_name);

      setAvatarUrl(profile?.avatar_url || "");
      setBio(profile?.bio || "");
      setLink(profile?.link || "");
      setSex(profile?.sex || "");
      setAge(profile?.age ?? null);
      setLocation(profile?.location || "");
      setUpdatedAt(profile?.updated_at || null);
      setPlan(String(profile?.plan || "free").toLowerCase());
      setAcceptingSponsors(Boolean(profile?.accepting_sponsors));
      setLoading(false);
    };

    load();
  }, [id]);

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const details = [sex, age ? String(age) : "", location].filter(Boolean);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-muted-pit">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex flex-col items-center text-center mb-10">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover mb-5 border-4 border-white/10 shadow-lg bg-black/20"
          />
        ) : (
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center text-5xl md:text-6xl font-bold mb-5 border-4 border-white/10 shadow-lg bg-blue-600">
            {initials}
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold mb-2">{displayName}</h1>
        {isWarrior(warriorComments) && (
          <div className="mb-3">
            <WarriorMark />
          </div>
        )}

        {details.length > 0 && (
          <p className="text-sm text-muted-pit mb-3">{details.join(" · ")}</p>
        )}

        {bio && (
          <p className="text-sm max-w-xl mb-3" style={{ color: "var(--pit-text)" }}>
            {bio}
          </p>
        )}

        {link && (
          <a
            href={link.startsWith("http") ? link : `https://${link}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-highlight-pit hover:opacity-80 mb-3"
          >
            {link}
          </a>
        )}

        {viewerId && viewerId !== id && relationship && (
          <div className={`mt-2 px-4 py-2 rounded-xl border text-sm ${tierColor(relationship.tier)}`}>
            <div className="font-semibold">{relationship.tier}</div>
            <div className="text-xs opacity-80">
              {relationship.total === 0
                ? "No interactions yet"
                : `${relationship.positive} positive · ${relationship.negative} negative`}
            </div>
            <div className="text-[11px] opacity-70 mt-1">Only visible to you</div>
          </div>
        )}

        {viewerId && viewerId !== id && (
          <div className="mt-5 w-full max-w-md text-left pit-panel p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-1">Tier</div>
            <div className="text-sm font-semibold mb-2 capitalize">{plan === "desk" ? "Desk" : plan === "press" ? "Press" : "Pit Pass"}</div>
            <div className="text-sm text-muted-pit mb-3">
              {acceptingSponsors ? "Accepting sponsors." : "Not accepting sponsors."}
            </div>
            {acceptingSponsors ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={giftTier}
                    onChange={(e) => setGiftTier(e.target.value as "press" | "desk")}
                    className="rounded-lg px-2 py-2 text-sm bg-black/20 border border-white/10"
                  >
                    <option value="press">Press ($12)</option>
                    <option value="desk">Desk ($25)</option>
                  </select>
                  <select
                    value={giftLength}
                    onChange={(e) => setGiftLength(e.target.value as "month" | "ongoing")}
                    className="rounded-lg px-2 py-2 text-sm bg-black/20 border border-white/10"
                  >
                    <option value="month">1 month</option>
                    <option value="ongoing">Ongoing</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled={gifting}
                  onClick={async () => {
                    setGiftMessage("");
                    setGifting(true);
                    const { error } = await supabase.rpc("cover_account", {
                      recipient: id,
                      gift_tier: giftTier,
                      gift_length: giftLength,
                    });
                    setGifting(false);
                    if (error) {
                      setGiftMessage(error.message);
                      return;
                    }
                    setPlan(giftTier);
                    setGiftMessage(
                      giftLength === "ongoing"
                        ? "Covered on a renewing basis. Stripe will replace this stub."
                        : "One month covered. Stripe will replace this stub."
                    );
                  }}
                  className="btn-write w-full px-4 py-2 rounded-xl text-sm disabled:opacity-60"
                >
                  {gifting ? "Covering..." : "Cover this account"}
                </button>
                {giftMessage && <p className="text-xs text-muted-pit mt-2">{giftMessage}</p>}
              </>
            ) : null}
          </div>
        )}

      </div>

      <div className="flex gap-6 border-b border-white/10 mb-6 text-sm font-medium overflow-x-auto justify-center md:justify-start">
        <button
          onClick={() => setActiveTab("articles")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "articles"
              ? "border-b-2 border-[var(--pit-highlight)] text-highlight-pit"
              : "text-muted-pit"
          }`}
        >
          Articles
        </button>

        {viewerId && (
          <button
            onClick={() => setActiveTab("comments")}
            className={`pb-3 whitespace-nowrap transition ${
              activeTab === "comments"
                ? "border-b-2 border-[var(--pit-highlight)] text-highlight-pit"
                : "text-muted-pit"
            }`}
          >
            Comments
          </button>
        )}

        <button
          onClick={() => setActiveTab("satire")}
          className={`pb-3 whitespace-nowrap transition ${
            activeTab === "satire" ? "border-b-2 border-purple-300 text-purple-200" : "text-muted-pit"
          }`}
        >
          Satire
        </button>
      </div>

      {activeTab === "articles" &&
        (articles.length === 0 ? (
          <div className="pit-panel rounded-2xl p-8 text-center text-sm text-muted-pit">
            No articles yet.
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="block pit-panel rounded-xl p-5 hover:opacity-95 transition"
              >
                <div className="flex items-center gap-2 text-xs text-muted-pit mb-1">
                  <span className="text-highlight-pit font-medium">{article.section}</span>
                  <span>•</span>
                  <span title={formatTimeFull(article.created_at)}>
                    {formatTime(article.created_at)}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{article.title}</h3>
                <p className="text-muted-pit text-sm line-clamp-3">{article.body}</p>
              </Link>
            ))}
          </div>
        ))}

      {activeTab === "comments" && viewerId &&
        (comments.length === 0 ? (
          <div className="pit-panel rounded-2xl p-8 text-center text-sm text-muted-pit">
            No comments yet.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Link
                key={comment.id}
                href={`/article/${comment.article_id}`}
                className="block pit-panel rounded-xl p-5 hover:opacity-95 transition"
              >
                <div className="text-xs text-muted-pit mb-2">
                  On <span style={{ color: "var(--pit-text)" }}>{comment.article_title}</span>
                  {" · "}
                  <span title={formatTimeFull(comment.created_at)}>
                    {formatTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{comment.body}</p>
              </Link>
            ))}
          </div>
        ))}

      {activeTab === "satire" && (
        <div className="pit-panel rounded-2xl p-8 text-center text-sm text-muted-pit border border-purple-500/20">
          No satire yet.
        </div>
      )}

      {updatedAt && (
        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-muted-pit">
          <span title={formatTimeFull(updatedAt)}>
            Profile updated {formatTime(updatedAt)}
          </span>
        </div>
      )}
    </main>
  );
}

