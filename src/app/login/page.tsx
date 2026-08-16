"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

function calcAge(birthday: string): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function BrandMark({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`}>
      <span className="text-white">The B</span>
      <span className="text-forge-accent">a</span>
      <span className="text-white">llp</span>
      <span className="text-forge-accent">i</span>
      <span className="text-white">t</span>
    </span>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
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

        const age = calcAge(birthday);
        if (age === null || age < 13 || age > 120) {
          setMessage("Please enter a valid birthday. You must be at least 13.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
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
        } else if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            display_name: displayName.trim(),
            birthday,
            age,
            updated_at: new Date().toISOString(),
          });

          setMessage("Account created. Check your email if confirmation is required, then log in.");
          setMode("login");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
        } else if (data.user) {
          setMessage("Logged in successfully.");
          window.location.href = "/profile";
        }
      }
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <BrandMark />
          </Link>
          <h1 className="text-xl font-semibold mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-gray-300">
            {mode === "login"
              ? "Log in to write, comment, and track your ranks."
              : "Join The Ballpit to publish articles, satire, and comments."}
          </p>
        </div>

        <div className="bg-forge-900 border border-forge-800 rounded-2xl p-6">
          <div className="flex mb-6 bg-black/20 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className={`flex-1 py-2 text-sm rounded-lg transition ${
                mode === "login"
                  ? "bg-forge-800 text-white font-medium"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
              className={`flex-1 py-2 text-sm rounded-lg transition ${
                mode === "signup"
                  ? "bg-forge-800 text-white font-medium"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs text-gray-300 mb-1.5">
                    Display name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How you want to appear"
                    required
                    className="w-full bg-black/20 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1.5">
                    Birthday <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-gray-300 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full bg-black/20 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-black/20 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-forge-accent hover:bg-forge-accentHover text-white font-medium py-3 rounded-xl transition text-sm disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Log in"
                : "Create account"}
            </button>
          </form>

          {message && (
            <p className="text-center text-sm mt-4 text-gray-200">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
