"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatTime, formatTimeFull } from "@/lib/time";

type Room = "floor" | "sports" | "pop" | "after-dark";

type Post = {
  id: string;
  user_id: string;
  author_name: string;
  room: Room;
  body: string;
  parent_id: string | null;
  created_at: string;
  audience?: "all" | "private";
  audience_ids?: string[];
};

type VoicePerson = { id: string; name: string };

type VoteMap = Record<string, { up: number; down: number; myVote: number | null }>;

const ROOMS: { id: Room; label: string }[] = [
  { id: "floor", label: "the Floor" },
  { id: "sports", label: "Sports" },
  { id: "pop", label: "Pop" },
  { id: "after-dark", label: "After Dark" },
];

const MAX_LEN = 800;

function splitBody(body: string) {
  const m = body.match(/\n?\!\[gif\]\((.*?)\)\s*$/);
  if (!m) return { text: body, gif: null as string | null };
  return { text: body.slice(0, m.index).trimEnd(), gif: m[1] };
}

async function searchGifs(q: string) {
  const query = q.trim() || "sports";
  const url =
    "https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&limit=12&rating=pg-13&q=" +
    encodeURIComponent(query);
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.data || []).map((g: { id: string; images?: { downsized?: { url?: string }; preview_gif?: { url?: string } } }) => ({
    id: g.id,
    url: g.images?.downsized?.url || "",
    preview: g.images?.preview_gif?.url || g.images?.downsized?.url || "",
  })).filter((g: { url: string }) => g.url);
}

function initials(name: string) {
  return (name || "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MoshpitPage() {
  const [room, setRoom] = useState<Room>("floor");
  const [posts, setPosts] = useState<Post[]>([]);
  const [votes, setVotes] = useState<VoteMap>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Post | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifHits, setGifHits] = useState<{ id: string; url: string; preview: string }[]>([]);
  const [gifPicked, setGifPicked] = useState<string | null>(null);
  const [gifBusy, setGifBusy] = useState(false);
  const [voice, setVoice] = useState<"all" | "private">("all");
  const [voicePeople, setVoicePeople] = useState<VoicePerson[]>([]);
  const [voiceQuery, setVoiceQuery] = useState("");
  const [voiceHits, setVoiceHits] = useState<VoicePerson[]>([]);

  useEffect(() => {
    const boot = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setUserId(user?.id || null);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        setDisplayName(
          profile?.display_name ||
            user.user_metadata?.display_name ||
            user.email?.split("@")[0] ||
            "User"
        );
      }
    };
    boot();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = async (currentRoom: Room, currentUser: string | null) => {
    setLoading(true);
    const { data: postData } = await supabase
      .from("moshpit_posts")
      .select("id, user_id, author_name, room, body, parent_id, created_at, audience, audience_ids")
      .eq("room", currentRoom)
      .order("created_at", { ascending: false })
      .limit(120);

    const list = (postData || []) as Post[];
    setPosts(list);

    const ids = list.map((p) => p.id);
    const next: VoteMap = {};
    ids.forEach((id) => {
      next[id] = { up: 0, down: 0, myVote: null };
    });

    if (ids.length) {
      const { data: voteData } = await supabase
        .from("moshpit_votes")
        .select("post_id, user_id, vote")
        .in("post_id", ids);

      for (const row of voteData || []) {
        if (!next[row.post_id]) continue;
        if (row.vote === 1) next[row.post_id].up += 1;
        if (row.vote === -1) next[row.post_id].down += 1;
        if (currentUser && row.user_id === currentUser) {
          next[row.post_id].myVote = row.vote;
        }
      }
    }

    setVotes(next);
    setLoading(false);
  };

  useEffect(() => {
    load(room, userId);
    const channel = supabase
      .channel("moshpit-live-" + room)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "moshpit_posts" },
        () => load(room, userId)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "moshpit_votes" },
        () => load(room, userId)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [room, userId]);

  const roots = useMemo(
    () => posts.filter((p) => !p.parent_id),
    [posts]
  );
  const repliesByParent = useMemo(() => {
    const map: Record<string, Post[]> = {};
    for (const p of posts) {
      if (!p.parent_id) continue;
      if (!map[p.parent_id]) map[p.parent_id] = [];
      map[p.parent_id].push(p);
    }
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => a.created_at.localeCompare(b.created_at))
    );
    return map;
  }, [posts]);

  const submit = async () => {
    setMessage("");
    if (!userId) {
      setMessage("A theBallpit account is required to post in theMoshpit.");
      return;
    }
    const text = draft.trim();
    if (!text && !gifPicked) {
      setMessage("Write something or pick a GIF.");
      return;
    }
    if (text.length > MAX_LEN) {
      setMessage(`Keep it under ${MAX_LEN} characters.`);
      return;
    }

    const inherited = replyTo && replyTo.audience === "private";
    const audience = inherited || voice === "private" ? "private" : "all";
    const audience_ids = inherited
      ? Array.from(new Set([...(replyTo.audience_ids || []), replyTo.user_id, userId]))
      : audience === "private"
      ? voicePeople.map((p) => p.id)
      : [];

    if (audience === "private" && audience_ids.length === 0) {
      setMessage("Add at least one person to hear this, or switch Voice to All.");
      return;
    }

    setPosting(true);
    const { error } = await supabase.from("moshpit_posts").insert({
      user_id: userId,
      author_name: displayName || "User",
      room,
      body: gifPicked ? `${text}\n![gif](${gifPicked})` : text,
      parent_id: replyTo?.id || null,
      audience,
      audience_ids,
    });
    setPosting(false);

    if (error) {
      setMessage(`Could not post: ${error.message}`);
      return;
    }

    setDraft("");
    setReplyTo(null);
    setGifPicked(null);
    setGifOpen(false);
    load(room, userId);
  };

  const vote = async (post: Post, value: 1 | -1) => {
    if (!userId) {
      setMessage("Log in to vote.");
      return;
    }
    if (post.user_id === userId) {
      setMessage("No voting on your own post.");
      return;
    }

    const current = votes[post.id]?.myVote;
    if (current === value) {
      await supabase
        .from("moshpit_votes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", userId);
    } else if (current) {
      await supabase
        .from("moshpit_votes")
        .update({ vote: value })
        .eq("post_id", post.id)
        .eq("user_id", userId);
    } else {
      await supabase.from("moshpit_votes").insert({
        post_id: post.id,
        user_id: userId,
        vote: value,
      });
    }
    load(room, userId);
  };

  const renderPost = (post: Post, isReply = false) => {
    const v = votes[post.id] || { up: 0, down: 0, myVote: null };
    return (
      <div
        key={post.id}
        className={`pit-panel rounded-xl p-4 ${isReply ? "ml-8 md:ml-12" : ""}`}
      >
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/${post.user_id}`}
            className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border border-white/10"
            style={{ background: "rgba(0,0,0,0.35)" }}
          >
            {initials(post.author_name)}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-pit mb-1">
              <Link href={`/profile/${post.user_id}`} className="font-semibold hover:opacity-80" style={{ color: "var(--pit-text)" }}>
                {post.author_name}
              </Link>
              <span title={formatTimeFull(post.created_at)}>{formatTime(post.created_at)}</span>
              {isReply && <span>reply</span>}
              {post.audience === "private" && <span>private</span>}
            </div>
            {(() => {
              const parsed = splitBody(post.body);
              return (
                <>
                  {parsed.text && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--pit-text)" }}>
                      {parsed.text}
                    </p>
                  )}
                  {parsed.gif && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={parsed.gif} alt="" className="mt-3 max-h-56 rounded-xl" />
                  )}
                </>
              );
            })()}
            <div className="flex items-center gap-3 mt-3 text-xs">
              <button
                type="button"
                onClick={() => vote(post, 1)}
                className={`px-2 py-1 rounded-md ${v.myVote === 1 ? "btn-write" : "btn-metal"}`}
              >
                ▲ {v.up}
              </button>
              <button
                type="button"
                onClick={() => vote(post, -1)}
                className={`px-2 py-1 rounded-md ${v.myVote === -1 ? "btn-write" : "btn-metal"}`}
              >
                ▼ {v.down}
              </button>
              {!isReply && userId && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(post);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-muted-pit hover:opacity-80"
                >
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-pit mb-2">theBallpit</p>
      <h1 className="text-3xl font-extrabold mb-2">theMoshpit</h1>
      <p className="text-sm text-muted-pit mb-5">
        Chat and trash talk. Same house rules.{" "}
        <Link href="/rules" className="text-highlight-pit">Rules</Link>
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {ROOMS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              setRoom(r.id);
              setReplyTo(null);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              room === r.id ? "btn-write" : "btn-metal"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="pit-panel rounded-2xl p-4 mb-6">
        {userId ? (
          <>
            {replyTo && (
              <div className="text-xs text-muted-pit mb-2 flex items-center justify-between gap-2">
                <span>
                  Replying to <span style={{ color: "var(--pit-text)" }}>{replyTo.author_name}</span>
                </span>
                <button type="button" onClick={() => setReplyTo(null)} className="text-highlight-pit">
                  Cancel
                </button>
              </div>
            )}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
              placeholder={replyTo ? "Write a reply..." : "Say it."}
              className="w-full min-h-[110px] bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none mb-2"
            />
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-2">Voice</div>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setVoice("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs ${voice === "all" && !replyTo?.audience ? "btn-write" : "btn-metal"}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setVoice("private")}
                  className={`px-3 py-1.5 rounded-lg text-xs ${voice === "private" || replyTo?.audience === "private" ? "btn-write" : "btn-metal"}`}
                >
                  Only some
                </button>
              </div>
              {replyTo?.audience === "private" ? (
                <p className="text-[11px] text-muted-pit">This reply stays in the private thread.</p>
              ) : voice === "private" ? (
                <div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {voicePeople.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setVoicePeople((prev) => prev.filter((x) => x.id !== p.id))}
                        className="text-xs px-2 py-1 rounded-full btn-metal"
                      >
                        {p.name} ×
                      </button>
                    ))}
                  </div>
                  <input
                    value={voiceQuery}
                    onChange={async (e) => {
                      const q = e.target.value;
                      setVoiceQuery(q);
                      if (q.trim().length < 2) {
                        setVoiceHits([]);
                        return;
                      }
                      const { data } = await supabase
                        .from("profiles")
                        .select("id, display_name")
                        .ilike("display_name", `%${q.trim()}%`)
                        .limit(6);
                      setVoiceHits(
                        (data || [])
                          .filter((row) => row.id !== userId)
                          .map((row) => ({ id: row.id, name: row.display_name || "User" }))
                      );
                    }}
                    placeholder="Add people by display name"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none bg-black/20 border border-white/10"
                  />
                  {voiceHits.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {voiceHits.map((hit) => (
                        <button
                          key={hit.id}
                          type="button"
                          className="block w-full text-left text-sm px-2 py-1 rounded-md btn-metal"
                          onClick={() => {
                            setVoicePeople((prev) =>
                              prev.some((x) => x.id === hit.id) ? prev : [...prev, hit]
                            );
                            setVoiceQuery("");
                            setVoiceHits([]);
                          }}
                        >
                          {hit.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-muted-pit">Everyone in this room can see it.</p>
              )}
            </div>
            {gifPicked && (
              <div className="mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gifPicked} alt="" className="max-h-32 rounded-lg" />
                <button type="button" className="text-xs text-muted-pit mt-1" onClick={() => setGifPicked(null)}>
                  Remove GIF
                </button>
              </div>
            )}
            {gifOpen && (
              <div className="mb-3 rounded-xl border border-white/10 p-3">
                <div className="flex gap-2 mb-2">
                  <input
                    value={gifQuery}
                    onChange={(e) => setGifQuery(e.target.value)}
                    placeholder="Search GIFs"
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none bg-black/20 border border-white/10"
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        setGifBusy(true);
                        setGifHits(await searchGifs(gifQuery));
                        setGifBusy(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-metal px-3 py-2 rounded-lg text-sm"
                    onClick={async () => {
                      setGifBusy(true);
                      setGifHits(await searchGifs(gifQuery));
                      setGifBusy(false);
                    }}
                  >
                    Search
                  </button>
                </div>
                {gifBusy && <p className="text-xs text-muted-pit">Searching...</p>}
                <div className="grid grid-cols-3 gap-2">
                  {gifHits.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setGifPicked(g.url);
                        setGifOpen(false);
                      }}
                      className="rounded-lg overflow-hidden border border-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.preview} alt="" className="w-full h-20 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const next = !gifOpen;
                    setGifOpen(next);
                    if (next && gifHits.length === 0) {
                      setGifBusy(true);
                      setGifHits(await searchGifs("sports"));
                      setGifBusy(false);
                    }
                  }}
                  className="btn-metal px-3 py-1.5 rounded-lg text-xs"
                >
                  GIF
                </button>
                <span className="text-[11px] text-muted-pit">
                  {draft.length}/{MAX_LEN}
                </span>
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={posting}
                className="btn-write px-4 py-2 rounded-xl text-sm disabled:opacity-60"
              >
                {posting ? "Posting..." : replyTo ? "Reply" : "Post"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-pit">
            Anyone can read theMoshpit. A{" "}
            <Link href="/login" className="text-highlight-pit">
              theBallpit account
            </Link>{" "}
            is required to post.
          </p>
        )}
        {message && <p className="text-sm text-yellow-200 mt-3">{message}</p>}
      </div>

      {loading ? (
        <p className="text-sm text-muted-pit">Loading the floor...</p>
      ) : roots.length === 0 ? (
        <p className="text-sm text-muted-pit">Quiet in here. Be first.</p>
      ) : (
        <div className="space-y-3">
          {roots.map((post) => (
            <div key={post.id} className="space-y-2">
              {renderPost(post)}
              {(repliesByParent[post.id] || []).map((reply) => renderPost(reply, true))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
