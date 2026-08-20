"use client";

import Link from "next/link";
import FantasiDeskMark from "@/components/FantasiDeskMark";

export default function RulesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-pit mb-3">
        theBallpit
      </p>
      <h1 className="text-3xl font-extrabold mb-3">House rules</h1>
      <p className="text-sm text-muted-pit leading-relaxed mb-8">
        theBallpit is a rough room. Insults and strong language are allowed.
        theBallpit is not an HR department. A short list still gets removed so
        the pit does not become a crime scene.
      </p>

      <section className="pit-panel p-5 mb-5">
        <h2 className="font-semibold mb-3">Products of theBallpit</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--pit-text)" }}>
          <span className="font-semibold">fantasiDesk</span> is a product of theBallpit —
          the sports desk (rosters, scoring, AI lineup tools). Same house, same login,
          same credits. mashPit, trashPit, and theMoneyPit are rooms of theBallpit, not
          separate companies.
        </p>
        <Link href="/fantasy" className="text-sm text-highlight-pit">
          Open <FantasiDeskMark size="nav" /> →
        </Link>
      </section>

      <section className="pit-panel p-5 mb-5">
        <h2 className="font-semibold mb-3">Allowed</h2>
        <ul className="text-sm space-y-2 leading-relaxed" style={{ color: "var(--pit-text)" }}>
          <li>Profanity and hostile sports / pop-culture takes</li>
          <li>Mocking writers, teams, celebrities, and bad articles</li>
          <li>Mean satire (it must stay labeled satire)</li>
          <li>“This is trash” energy in comments</li>
          <li>Arguments, including political ones, as long as they stay in the pit</li>
        </ul>
      </section>

      <section className="pit-panel p-5 mb-5">
        <h2 className="font-semibold mb-3">Removed</h2>
        <ul className="text-sm space-y-2 leading-relaxed" style={{ color: "var(--pit-text)" }}>
          <li>Sexual content involving minors — zero tolerance</li>
          <li>Non-consensual intimate images</li>
          <li>Doxxing / posting someone’s private contact info or home</li>
          <li>Direct threats of violence treated as real</li>
          <li>Spam, scams, malware</li>
          <li>Impersonating theBallpit, fantasiDesk, or stealing another user’s identity</li>
        </ul>
      </section>

      <section className="pit-panel p-5 mb-8">
        <h2 className="font-semibold mb-3">How this works</h2>
        <ul className="text-sm space-y-2 leading-relaxed" style={{ color: "var(--pit-text)" }}>
          <li>
            Same rules for anon, free accounts, and paid tiers. Tools are paid.
            Speech is not.
          </li>
          <li>Satire is fiction. It is not news. It still follows the removed list.</li>
          <li>
            An article may be hidden or desk-only for quality. That is not a
            speech ban.
          </li>
          <li>
            fantasiDesk scoring, credits, and AI taps follow theMoneyPit. A used
            credit is gone even if the result is weak.
          </li>
        </ul>
      </section>

      <p className="text-xs text-muted-pit mb-6">
        One line: theBallpit is a rough room. Insults and strong language are
        allowed. theBallpit removes illegal content, exploitation, doxxing,
        credible threats, spam, and impersonation. fantasiDesk is a product of
        theBallpit.
      </p>

      <Link href="/" className="text-sm text-highlight-pit">
        ← Back home
      </Link>
    </main>
  );
}

