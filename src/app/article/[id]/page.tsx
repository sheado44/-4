"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ArticlePage() {
  const params = useParams();
  const id = params?.id as string;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("title, body")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Article not found");
        setLoading(false);
        return;
      }

      setTitle(data.title);
      setBody(data.body);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p>Loading article...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p>{error}</p>
        <Link href="/">Back home</Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <p className="text-sm text-orange-300 mb-2">ARTICLE PAGE</p>
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <div className="whitespace-pre-wrap text-gray-100 mb-8">{body}</div>
      <Link href="/" className="text-sm text-orange-300">
        ← Back home
      </Link>
    </main>
  );
}
