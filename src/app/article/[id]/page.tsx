import Link from "next/link";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isFanFiction = id === "5";

  if (isFanFiction) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Fan Fiction banner */}
        <div className="mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="bg-purple-500/20 text-purple-300 font-semibold px-2.5 py-1 rounded-md">
              Fan Fiction
            </span>
            <span className="text-purple-200/80">
              Clearly untrue · Written for entertainment
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4">
          <span className="bg-purple-500/15 text-purple-300 px-2.5 py-1 rounded-md font-semibold">
            #1 Fan Fiction
          </span>
          <span className="bg-forge-800 px-2.5 py-1 rounded-md">Satire</span>
          <span className="text-yellow-500 font-medium">★ 4.9</span>
          <span className="text-gray-600">•</span>
          <span>Aug 10, 2026</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6 tracking-tight">
          Caleb Williams Accidentally Invents Time Travel During a Scramble
        </h1>

        {/* Author */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-forge-800">
          <Link href="/profile" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full bg-orange-600 flex items-center justify-center font-bold">
              SR
            </div>
            <div>
              <div className="font-semibold group-hover:text-forge-accent transition">
                Sam Rivera
              </div>
              <div className="text-sm text-gray-400">Fan Fiction · 6 pieces</div>
            </div>
          </Link>

          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-white">6.3k</div>
              <div className="text-xs text-gray-500">views</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">91</div>
              <div className="text-xs text-gray-500">comments</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-yellow-500">4.9</div>
              <div className="text-xs text-gray-500">rating</div>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="w-full h-56 md:h-72 rounded-2xl bg-gradient-to-br from-purple-700/30 to-forge-900 mb-10 flex items-center justify-center border border-purple-500/20">
          <div className="text-center">
            <div className="text-5xl mb-2">🌀</div>
            <div className="text-sm text-purple-200/70 font-medium">
              Clearly untrue Fan Fiction
            </div>
          </div>
        </div>

        {/* Body */}
        <article className="max-w-none">
          <p className="text-lg text-gray-200 leading-relaxed mb-5">
            It started as a broken play. It ended with Walter Payton learning the RPO in 1985.
          </p>
          <p className="text-gray-300 leading-relaxed mb-5">
            According to sources that definitely do not exist, Williams scrambled left, stepped through what witnesses described as “a shimmering portal of pure chaos,” and landed on a practice field outside Chicago forty years earlier.
          </p>
          <p className="text-gray-300 leading-relaxed mb-5">
            Coaches at the time reportedly asked only one question: “Can he block?”
          </p>
          <p className="text-gray-300 leading-relaxed mb-5">
            The rest of the story involves a talking mascot, a cursed playbook, and one very confused time-traveling quarterback who just wanted a first down.
          </p>
        </article>

        <div className="mt-8 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-sm text-purple-200/80">
          This is Fan Fiction. It is intentionally untrue and written for entertainment.
        </div>

        {/* Comments CTA */}
        <section className="mt-12">
          <h3 className="text-xl font-bold mb-5">Comments (91)</h3>
          <Link
            href="/article/1/comment"
            className="block bg-forge-900 border border-forge-800 hover:border-purple-500/40 rounded-2xl p-4 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium group-hover:text-purple-300 transition">
                  Write a comment
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Images · GIFs · AI tools
                </div>
              </div>
              <div className="text-purple-300 text-sm font-medium">Open →</div>
            </div>
          </Link>
        </section>
      </main>
    );
  }

  // Regular article treatment
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4">
        <span className="bg-forge-accent/15 text-forge-accent px-2.5 py-1 rounded-md font-semibold">
          #1 Sports
        </span>
        <span className="bg-forge-800 px-2.5 py-1 rounded-md">NFL</span>
        <span className="text-yellow-500 font-medium">★ 4.8</span>
        <span className="text-gray-600">•</span>
        <span>Aug 12, 2026</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6 tracking-tight">
        Why the Bears&apos; Offensive Line Is Quietly Elite in 2026
      </h1>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-forge-800">
        <Link href="/profile" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center font-bold">
            JR
          </div>
          <div>
            <div className="font-semibold group-hover:text-forge-accent transition">
              Jordan Reyes
            </div>
            <div className="text-sm text-gray-400">
              Publisher Rank #7 • 28 articles
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="font-semibold text-white">12.4k</div>
            <div className="text-xs text-gray-500">views</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-white">48</div>
            <div className="text-xs text-gray-500">comments</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-yellow-500">4.8</div>
            <div className="text-xs text-gray-500">rating</div>
          </div>
        </div>
      </div>

      <div className="w-full h-56 md:h-72 rounded-2xl bg-gradient-to-br from-orange-700/30 to-blue-900/40 mb-10 flex items-center justify-center border border-forge-800">
        <div className="text-center">
          <div className="text-5xl mb-2">🏈</div>
          <div className="text-sm text-orange-200/70 font-medium">
            Chicago Bears OL – 2026
          </div>
        </div>
      </div>

      <article className="max-w-none">
        <p className="text-lg text-gray-200 leading-relaxed mb-5">
          For years, the Chicago Bears offensive line was a punchline. In 2026, the joke is over.
        </p>
        <p className="text-gray-300 leading-relaxed mb-5">
          Advanced metrics from multiple independent sources now rank the Bears’ front five among the top units in the NFL — a transformation that has flown under the radar while the spotlight stays locked on Caleb Williams and the skill players.
        </p>
        <h2 className="text-xl font-bold mt-9 mb-4 text-white">The Numbers Don’t Lie</h2>
        <p className="text-gray-300 leading-relaxed mb-5">
          According to next-gen tracking and independent film graders, Chicago currently sits near the top of the league in pass-block win rate and pressure rate allowed.
        </p>
      </article>

      <section className="mt-12">
        <h3 className="text-xl font-bold mb-5">Comments (48)</h3>
        <Link
          href="/article/1/comment"
          className="block bg-forge-900 border border-forge-800 hover:border-forge-accent/40 rounded-2xl p-4 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium group-hover:text-forge-accent transition">
                Write a comment
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                Images · GIFs · AI tools
              </div>
            </div>
            <div className="text-forge-accent text-sm font-medium">Open →</div>
          </div>
        </Link>
      </section>
    </main>
  );
}
