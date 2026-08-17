"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setMessage(error.message);
          setLoading(false);
          return;
        }
        router.push("/");
        return;
      }

      if (!displayName.trim()) {
        setMessage("Display name is required.");
        setLoading(false);
        return;
      }
      if (!birthday) {
        setMessage("Birthday is required.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            birthday,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        const birth = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;

        await supabase.from("profiles").upsert({
          id: data.user.id,
          display_name: displayName.trim(),
          birthday,
          age,
          points: 0,
          ai_credits: 20,
          owned_skins: "none",
          comment_avatar_skin: "none",
          comment_avatar_color: "#2563eb",
          updated_at: new Date().toISOString(),
        });
      }

      setMessage("Account created. Check your email if verification is required, then log in.");
      setMode("login");
    } catch (err: any) {
      setMessage(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">
        {mode === "login" ? "Log in" : "Sign up"}
      </h1>
      <p className="text-sm text-gray-300 mb-6">
        {mode === "login"
          ? "Jump back into The Ballpit."
          : "Create an account to publish, use tools, and earn points."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Display name *</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Birthday *</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
                required
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-forge-900 border border-forge-800 rounded-xl px-4 py-3 text-sm outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 rounded-xl bg-forge-accent text-white font-medium text-sm disabled:opacity-60"
        >
          {loading ? "Working..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-yellow-200">{message}</p>}

      <div className="mt-6 text-sm text-gray-300">
        {mode === "login" ? (
          <button
            type="button"
            onClick={() => setMode("signup")}
            className="text-forge-accent hover:text-orange-300"
          >
            Need an account? Sign up
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="text-forge-accent hover:text-orange-300"
          >
            Already have an account? Log in
          </button>
        )}
      </div>

      <div className="mt-8">
        <Link href="/" className="text-sm text-gray-300 hover:text-white">
          ← Back home
        </Link>
      </div>
    </main>
  );
}
