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
};

type VoteMap = Record<string, { up: number; down: number; myVote: number | null }>;

const ROOMS: { id: Room; label: string }[] = [
  { id: "floor", label: "the Floor" },
  { id: "sports", label: "Sports" },
  { id: "pop", label: "Pop" },
  { id: "after-dark", label: "After Dark" },
];

const MAX_LEN = 800;

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
      .select("id, user_id, author_name, room, body, parent_id, created_at")
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
    if (!text) {
      setMessage("Write something first.");
      return;
    }
    if (text.length > MAX_LEN) {
      setMessage(`Keep it under ${MAX_LEN} characters.`);
      return;
    }

    setPosting(true);
    const { error } = await supabase.from("moshpit_posts").insert({
      user_id: userId,
      author_name: displayName || "User",
      room,
      body: text,
      parent_id: replyTo?.id || null,
    });
    setPosting(false);

    if (error) {
      setMessage(`Could not post: ${error.message}`);
      return;
    }

    setDraft("");
    setReplyTo(null);
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
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--pit-text)" }}>
              {post.body}
            </p>
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
      <p className="text-sm text-muted-pit leading-relaxed mb-4">
        theMoshpit is a rough room. Insults are allowed. theBallpit removes
        exploitation, doxxing, credible threats, spam, and impersonation.
        This is chat — not an article, not a score.
      </p>
      <Link href="/rules" className="text-xs text-highlight-pit mb-6 inline-block">
        House rules →
      </Link>

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
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-pit">
                {draft.length}/{MAX_LEN}
              </span>
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

