"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight inline-block mb-4">
            <span className="text-forge-accent">Press</span>
            <span className="text-white">Me</span>
          </Link>
          <h1 className="text-xl font-semibold mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-gray-400">
            {mode === "login"
              ? "Log in to write, comment, and track your ranks."
              : "Join to publish articles, Fan Fiction, and comments."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-forge-900 border border-forge-800 rounded-2xl p-6">
          {/* Mode toggle */}
          <div className="flex mb-6 bg-forge-950 rounded-xl p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm rounded-lg transition ${
                mode === "login"
                  ? "bg-forge-800 text-white font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm rounded-lg transition ${
                mode === "signup"
                  ? "bg-forge-800 text-white font-medium"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-4"
          >
            {mode === "signup" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Display name
                </label>
                <input
                  type="text"
                  placeholder="How you want to appear"
                  className="w-full bg-forge-950 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full bg-forge-950 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-forge-950 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
              />
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-forge-950 border border-forge-800 rounded-xl px-4 py-3 text-sm focus:border-forge-accent outline-none transition"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-forge-accent hover:bg-forge-accentHover text-white font-medium py-3 rounded-xl transition text-sm"
            >
              {mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-xs text-gray-500 mt-4">
              <button className="hover:text-gray-300 transition">
                Forgot password?
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Prototype only — real authentication comes later.
        </p>
      </div>
    </main>
  );
}
