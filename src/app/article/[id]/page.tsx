import Link from "next/link";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-5">
        <span className="bg-forge-accent/15 text-forge-accent px-2.5 py-1 rounded-md font-semibold">
          #1 Sports
        </span>
        <span className="bg-forge-800 px-2.5 py-1 rounded-md">NFL</span>
        <span className="text-yellow-500 font-medium">★ 4.8</span>
        <span>•</span>
        <span>Aug 12, 2026</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6 tracking-tight">
        Why the Bears&apos; Offensive Line Is Quietly Elite in 2026
      </h1>

      {/* Author + Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-forge-800">
        <Link href="/profile" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
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

        <div className="flex items-center gap-5 text-sm text-gray-400">
          <div className="text-center">
            <div className="font-semibold text-white">12.4k</div>
            <div className="text-xs">views</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-white">48</div>
            <div className="text-xs">comments</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-yellow-500">4.8</div>
            <div className="text-xs">rating</div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="w-full h-64 md:h-80 rounded-2xl bg-gradient-to-br from-orange-700/40 to-blue-900/50 mb-10 flex items-center justify-center border border-forge-800">
        <div className="text-center">
          <div className="text-6xl mb-2">🏈</div>
          <div className="text-sm text-orange-200/80 font-medium">
            Chicago Bears OL – 2026 Season
          </div>
        </div>
      </div>

      {/* Article Body */}
      <article className="prose prose-invert max-w-none">
        <p className="text-lg text-gray-200 leading-relaxed mb-6">
          For years, the Chicago Bears offensive line was a punchline. In 2026, the joke is over.
        </p>

        <p className="text-gray-300 leading-relaxed mb-6">
          Advanced metrics from multiple independent sources now rank the Bears’ front five among the top units in the NFL — a transformation that has flown under the radar while the spotlight stays locked on Caleb Williams and the skill players.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-white">The Numbers Don’t Lie</h2>

        <p className="text-gray-300 leading-relaxed mb-6">
          According to next-gen tracking and independent film graders, Chicago currently sits:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-8">
          {[
            { value: "3rd", label: "Pass Block Win Rate" },
            { value: "5th", label: "Run Block Efficiency" },
            { value: "2nd", label: "Pressure Rate Allowed" },
            { value: "1st", label: "Screen Success %" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-forge-900 border border-forge-700 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-forge-accent">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <p className="text-gray-300 leading-relaxed mb-6">
          These aren’t vanity stats. They translate directly to time in the pocket and explosive run opportunities.
        </p>

        <blockquote className="border-l-4 border-forge-accent pl-5 my-8 italic text-orange-100/90">
          “We’re not asking Caleb to be Superman every snap anymore. The line is giving him a chance to play on schedule.”
          <footer className="text-sm not-italic text-gray-400 mt-2">
            — Anonymous NFC North scout
          </footer>
        </blockquote>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-white">What It Means Going Forward</h2>

        <p className="text-gray-300 leading-relaxed mb-6">
          A functional offensive line doesn’t just protect the quarterback. It changes play-calling philosophy, opens the playbook, and reduces the need for constant max-protect packages that telegraph the pass.
        </p>

        <p className="text-gray-300 leading-relaxed mb-6">
          If the Bears can maintain this level of play through December, the narrative around the franchise will shift from “Will the line hold?” to “How high is the ceiling?”
        </p>
      </article>

      {/* Rating + Actions */}
      <div className="mt-12 pt-8 border-t border-forge-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Rate this article</p>
            <div className="flex items-center gap-1 text-2xl text-yellow-500">
              <button className="hover:scale-110 transition">★</button>
              <button className="hover:scale-110 transition">★</button>
              <button className="hover:scale-110 transition">★</button>
              <button className="hover:scale-110 transition">★</button>
              <button className="hover:scale-110 transition text-gray-600">★</button>
              <span className="text-sm text-gray-400 ml-2">4.8 (128 ratings)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm transition">
              👍 842
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm transition">
              💬 48
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm transition">
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Comments */}
      <section className="mt-14">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Comments (48)</h3>
        </div>

        {/* Write Comment CTA */}
        <Link
          href="/article/1/comment"
          className="block bg-forge-900 border border-forge-800 hover:border-forge-accent/50 rounded-2xl p-5 mb-8 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium group-hover:text-forge-accent transition">
                Write a comment
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                Full editor • Images • GIFs • AI tools
              </div>
            </div>
            <div className="text-forge-accent text-sm font-medium">
              Open →
            </div>
          </div>
        </Link>

        {/* Existing comments */}
        <div className="space-y-6">
          {[
            {
              initials: "DK",
              color: "bg-green-700",
              name: "Derek K.",
              rank: 14,
              heat: "On Fire",
              heatColor: "text-orange-400",
              time: "2h ago",
              text: "Finally someone posting the actual film grades instead of the same old “Bears line is bad” narrative. The right tackle improvement alone is massive.",
              likes: 24,
              dislikes: 3,
              likedBy: ["Maya Chen", "Aisha Lane", "Tom Keller", "Sam Rivera", "+20 more"],
              dislikedBy: ["Chris P.", "Jordan M.", "Alex T."],
            },
            {
              initials: "SR",
              color: "bg-red-700",
              name: "Sam R.",
              rank: 47,
              heat: "Warm",
              heatColor: "text-yellow-500",
              time: "4h ago",
              text: "I’m still skeptical until we see them against the better edge rushers in December. But the data is hard to argue with right now.",
              likes: 11,
              dislikes: 8,
              likedBy: ["Jordan Reyes", "Derek K.", "Lisa M.", "+8 more"],
              dislikedBy: ["Mike T.", "Chris P.", "Alex R.", "Sam K.", "+4 more"],
            },
            {
              initials: "AL",
              color: "bg-purple-600",
              name: "Aisha L.",
              rank: 9,
              heat: "Hot",
              heatColor: "text-orange-300",
              time: "6h ago",
              text: "This is the kind of analysis that actually moves the conversation forward. Great work.",
              likes: 19,
              dislikes: 1,
              likedBy: ["Jordan Reyes", "Maya Chen", "Tom Keller", "Derek K.", "+15 more"],
              dislikedBy: ["Anonymous"],
            },
          ].map((c) => (
            <div key={c.name} className="flex gap-3">
              <div
                className={`w-10 h-10 rounded-full ${c.color} flex items-center justify-center text-sm font-bold shrink-0`}
              >
                {c.initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm mb-1">
                  <div className="relative group">
                    <Link
                      href="/profile"
                      className="font-medium hover:text-forge-accent transition cursor-pointer"
                    >
                      {c.name}
                    </Link>
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                      <div className="bg-forge-800 border border-forge-600 text-xs text-white px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                        <div>#{c.rank} Commenter</div>
                        <div className={`mt-0.5 ${c.heatColor}`}>
                          Heat: {c.heat}
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-gray-500">{c.time}</span>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed mb-3">{c.text}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <button className="flex items-center gap-1.5 hover:text-green-400 transition">
                    👍 {c.likes}
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-red-400 transition">
                    👎 {c.dislikes}
                  </button>
                  <Link
                    href="/article/1/comment"
                    className="hover:text-forge-accent transition"
                  >
                    Reply
                  </Link>
                </div>

                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <div>
                    <span className="text-green-500/80">Liked by:</span>{" "}
                    {c.likedBy.join(", ")}
                  </div>
                  <div>
                    <span className="text-red-400/80">Disliked by:</span>{" "}
                    {c.dislikedBy.join(", ")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
