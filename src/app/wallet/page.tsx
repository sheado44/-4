"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type StoreItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
};

const STORE_ITEMS: StoreItem[] = [
  {
    id: "ai-credit-5",
    name: "5 AI Credits",
    description: "Use for AI images, satire generation, and other AI tools.",
    cost: 50,
  },
  {
    id: "ai-credit-20",
    name: "20 AI Credits",
    description: "Bigger AI pack for articles and comments.",
    cost: 150,
  },
  {
    id: "badge-correspondent",
    name: "Correspondent Badge",
    description: "Profile badge placeholder for active publishers.",
    cost: 150,
  },
  {
    id: "merch-hat",
    name: "Ballpit Hat",
    description: "Merch placeholder. Fulfillment later.",
    cost: 500,
  },
];

export default function WalletPage() {
  const [points, setPoints] = useState(0);
  const [aiCredits, setAiCredits] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadWallet = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);
    const { data: profile } = await supabase
      .from("profiles")
      .select("points, ai_credits")
      .eq("id", user.id)
      .maybeSingle();

    setPoints(profile?.points ?? 0);
    setAiCredits(profile?.ai_credits ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleRedeem = async (item: StoreItem) => {
    setMessage("");
    if (!userId) {
      setMessage("Log in to use your wallet.");
      return;
    }
    if (points < item.cost) {
      setMessage("Not enough points for that item.");
      return;
    }

    const newPoints = points - item.cost;
    let newAiCredits = aiCredits;

    if (item.id === "ai-credit-5") newAiCredits += 5;
    if (item.id === "ai-credit-20") newAiCredits += 20;

    const { error: ledgerError } = await supabase.from("points_ledger").insert({
      user_id: userId,
      points: -item.cost,
      reason: `Redeemed: ${item.name}`,
    });
    if (ledgerError) {
      setMessage(`Redeem failed: ${ledgerError.message}`);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        points: newPoints,
        ai_credits: newAiCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      setMessage(`Redeem failed: ${profileError.message}`);
      return;
    }

    setPoints(newPoints);
    setAiCredits(newAiCredits);
    setMessage(`Redeemed ${item.name}.`);
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-gray-300">Loading wallet...</p>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-3">Wallet</h1>
        <p className="text-gray-300 mb-4">Log in to view your wallet.</p>
        <Link href="/login" className="text-forge-accent">
          Log in / Sign up
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wallet</h1>
        <p className="text-gray-300 text-sm">
          Points come from contributions. AI credits power generation tools.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-r from-orange-600/20 to-forge-900 border border-orange-500/30 rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wide text-gray-300 mb-1">Points</div>
          <div className="text-4xl font-bold text-white mb-2">{points}</div>
          <div className="text-sm text-gray-300">Real articles +50 · Satire +5</div>
        </div>
        <div className="bg-gradient-to-r from-blue-600/20 to-forge-900 border border-blue-400/30 rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wide text-gray-300 mb-1">AI Credits</div>
          <div className="text-4xl font-bold text-white mb-2">{aiCredits}</div>
          <div className="text-sm text-gray-300">New users get 20 · spend on AI tools</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Store</h2>
      <div className="space-y-4">
        {STORE_ITEMS.map((item) => {
          const canBuy = points >= item.cost;
          return (
            <div
              key={item.id}
              className="bg-forge-900 border border-forge-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <div className="font-semibold text-white mb-1">{item.name}</div>
                <div className="text-sm text-gray-300 mb-2">{item.description}</div>
                <div className="text-sm text-forge-accent font-medium">{item.cost} pts</div>
              </div>
              <button
                onClick={() => handleRedeem(item)}
                disabled={!canBuy}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  canBuy
                    ? "bg-forge-accent hover:bg-forge-accentHover text-white"
                    : "bg-black/20 text-gray-400 cursor-not-allowed"
                }`}
              >
                {canBuy ? "Redeem" : "Need more points"}
              </button>
            </div>
          );
        })}
      </div>

      {message && <p className="mt-6 text-sm text-yellow-200">{message}</p>}

      <div className="mt-10">
        <Link href="/profile" className="text-sm text-gray-300 hover:text-white">
          ← Back to profile
        </Link>
      </div>
    </main>
  );
}
