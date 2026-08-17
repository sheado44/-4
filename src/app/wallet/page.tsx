"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type StoreItem = {
  id: string;
  name: string;
  description: string;
  cost: number;
  kind: "ai" | "skin" | "other";
  skinId?: string;
};

const STORE_ITEMS: StoreItem[] = [
  {
    id: "ai-credit-5",
    name: "5 AI Credits",
    description: "Use for AI images and tools.",
    cost: 50,
    kind: "ai",
  },
  {
    id: "ai-credit-20",
    name: "20 AI Credits",
    description: "Bigger AI pack.",
    cost: 150,
    kind: "ai",
  },
  {
    id: "skin-leopard",
    name: "Leopard Skin",
    description: "Patterned comment avatar skin.",
    cost: 100,
    kind: "skin",
    skinId: "leopard",
  },
  {
    id: "skin-zebra",
    name: "Zebra Skin",
    description: "Patterned comment avatar skin.",
    cost: 100,
    kind: "skin",
    skinId: "zebra",
  },
  {
    id: "skin-camo",
    name: "Camo Skin",
    description: "Patterned comment avatar skin.",
    cost: 100,
    kind: "skin",
    skinId: "camo",
  },
  {
    id: "skin-galaxy",
    name: "Galaxy Skin",
    description: "Patterned comment avatar skin.",
    cost: 100,
    kind: "skin",
    skinId: "galaxy",
  },
  {
    id: "skin-carbon",
    name: "Carbon Skin",
    description: "Patterned comment avatar skin.",
    cost: 100,
    kind: "skin",
    skinId: "carbon",
  },
];

function parseOwned(owned: string | null | undefined) {
  return Array.from(
    new Set(
      (owned || "none")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

export default function WalletPage() {
  const [points, setPoints] = useState(0);
  const [aiCredits, setAiCredits] = useState(0);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["none"]);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadWallet = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("points, ai_credits, owned_skins")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setMessage(`Wallet load failed: ${error.message}`);
    }

    setPoints(profile?.points ?? 0);
    setAiCredits(profile?.ai_credits ?? 0);
    setOwnedSkins(parseOwned(profile?.owned_skins));
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

    setBusyId(item.id);

    try {
      // fresh values from DB to avoid stale UI
      const { data: profile, error: profileReadError } = await supabase
        .from("profiles")
        .select("points, ai_credits, owned_skins")
        .eq("id", userId)
        .single();

      if (profileReadError || !profile) {
        throw new Error(profileReadError?.message || "Could not read wallet.");
      }

      const currentPoints = profile.points ?? 0;
      const currentCredits = profile.ai_credits ?? 0;
      const currentOwned = parseOwned(profile.owned_skins);

      if (item.kind === "skin" && item.skinId && currentOwned.includes(item.skinId)) {
        setMessage("You already own that skin.");
        setBusyId(null);
        return;
      }

      if (currentPoints < item.cost) {
        setMessage("Not enough points for that item.");
        setBusyId(null);
        return;
      }

      const newPoints = currentPoints - item.cost;
      let newCredits = currentCredits;
      let newOwned = [...currentOwned];

      if (item.kind === "ai") {
        if (item.id === "ai-credit-5") newCredits += 5;
        if (item.id === "ai-credit-20") newCredits += 20;
      }

      if (item.kind === "skin" && item.skinId && !newOwned.includes(item.skinId)) {
        newOwned.push(item.skinId);
      }

      const { error: ledgerError } = await supabase.from("points_ledger").insert({
        user_id: userId,
        points: -item.cost,
        reason: `Redeemed: ${item.name}`,
      });
      if (ledgerError) throw new Error(`Ledger failed: ${ledgerError.message}`);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          points: newPoints,
          ai_credits: newCredits,
          owned_skins: newOwned.join(","),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw new Error(`Balance update failed: ${updateError.message}`);

      setPoints(newPoints);
      setAiCredits(newCredits);
      setOwnedSkins(newOwned);
      setMessage(`Purchase complete: ${item.name}. -${item.cost} pts`);
    } catch (err: any) {
      setMessage(err?.message || "Purchase failed.");
    } finally {
      setBusyId(null);
    }
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
          Spend points on AI credits and avatar skins. All skins cost 100 pts.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-r from-orange-600/20 to-forge-900 border border-orange-500/30 rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wide text-gray-300 mb-1">Points</div>
          <div className="text-4xl font-bold text-white mb-2">{points}</div>
        </div>
        <div className="bg-gradient-to-r from-blue-600/20 to-forge-900 border border-blue-400/30 rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wide text-gray-300 mb-1">AI Credits</div>
          <div className="text-4xl font-bold text-white mb-2">{aiCredits}</div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Store</h2>
      <div className="space-y-4">
        {STORE_ITEMS.map((item) => {
          const owned =
            item.kind === "skin" && item.skinId
              ? ownedSkins.includes(item.skinId)
              : false;
          const canBuy = !owned && points >= item.cost;
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
                disabled={!canBuy || busyId === item.id}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  owned
                    ? "bg-black/20 text-gray-400 cursor-not-allowed"
                    : canBuy
                    ? "bg-forge-accent hover:bg-forge-accentHover text-white"
                    : "bg-black/20 text-gray-400 cursor-not-allowed"
                }`}
              >
                {owned
                  ? "Owned"
                  : busyId === item.id
                  ? "Working..."
                  : canBuy
                  ? "Buy"
                  : "Need more points"}
              </button>
            </div>
          );
        })}
      </div>

      {message && <p className="mt-6 text-sm text-yellow-200">{message}</p>}

      <div className="mt-10">
        <Link href="/settings" className="text-sm text-gray-300 hover:text-white">
          Equip skins in Settings →
        </Link>
      </div>
    </main>
  );
}
