import Link from "next/link";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4">
        <span className="bg-forge-accent/20 text-forge-accent px-2.5 py-1 rounded font-medium">
          #1 Ranked
        </span>
        <span className="bg-forge-800 px-2.5 py-1 rounded">NFL</span>
        <span className="text-yellow-500">★ 4.8</span>
        <span>•</span>
        <span>Aug 12, 2026</span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
        Why the Bears&apos; Offensive Line Is Quietly Elite in 2026
      </h1>

      <div className="flex items-center justify-between mb-8 pb-6 border-b border-forge-800">
        <Link href="/profile" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
            JR
          </div>
          <div>
            <div className="font-medium group-hover:text-forge-accent transition">
              Jordan Reyes
            </div>
            <div className="text-sm text-gray-400">
              Publisher Rank #7 • 28 published articles
            </div>
          </div>
        </Link>
        <div className="text-sm text-gray-400 text-right">
          <div>12.4k views</div>
          <div>48 comments</div>
        </div>
      </div>

      <div className="w-full h-64 md:h-80 rounded-xl bg-gradient-to-br from-orange-700/50 to-blue-900/60 mb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-2">🏈</div>
          <div className="text-sm text-orange-200 font-medium">
            Chicago Bears OL – 2026 Season
          </div>
        </div>
      </div>

      <div className="prose prose-invert max-w-none space-y-4">
        <p className="text-lg text-gray-200">
          For years, the Chicago Bears offensive line was a punchline. In 2026, the joke is over.
        </p>
        <p className="text-gray-300">
          Advanced metrics from multiple independent sources now rank the Bears’ front five among the top units in the NFL.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-3">The Numbers Don’t Lie</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
          {[
            { value: "3rd", label: "Pass Block Win Rate" },
            { value: "5th", label: "Run Block Efficiency" },
            { value: "2nd", label: "Pressure Rate Allowed" },
            { value: "1st", label: "Screen Success %" },
          ].map((stat) => (
            <div key={stat.label} className="bg-forge-900 border border-forge-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-forge-accent">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <p className="text-gray-400 text-sm mt-10 pt-6 border-t border-forge-800">
          This article passed automated quality review.
        </p>
      </div>

      <div className="flex items-center gap-4 mt-8 pt-6 border-t border-forge-800">
        <button className="flex items-center gap-2 px-4 py-2 bg-forge-800 hover:bg-forge-700 rounded-lg text-sm transition">
          👍 842
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-forge-800 hover:bg-forge-700 rounded-lg text-sm transition">
          💬 48
        </button>
      </div>

      <section className="mt-12">
        <h3 className="text-xl font-bold mb-2">Comments</h3>
        <p className="text-sm text-gray-400 mb-6">
          Free speech zone — any legal speech is welcome.
        </p>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 mb-6">
          <textarea
            placeholder="Add your take..."
            className="w-full bg-transparent border-0 text-gray-200 placeholder-gray-500 resize-none h-20 outline-none"
          />
          <div className="flex justify-end mt-2">
            <button className="bg-forge-accent hover:bg-forge-accentHover text-white text-sm font-medium px-4 py-1.5 rounded-lg transition">
              Post Comment
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
