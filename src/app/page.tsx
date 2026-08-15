import Link from "next/link";

const sampleArticles = [
  {
    id: "1",
    rank: 1,
    section: "Sports",
    category: "NFL",
    title: "Why the Bears' Offensive Line Is Quietly Elite in 2026",
    excerpt: "A deep dive into the advanced metrics that show Chicago's front is no longer a liability — and what it means for Caleb Williams' second year.",
    author: "Jordan Reyes",
    authorInitials: "JR",
    authorColor: "bg-blue-600",
    views: "12.4k",
    comments: 48,
    stars: 4.8,
    emoji: "🏈",
  },
  {
    id: "2",
    rank: 2,
    section: "Sports",
    category: "NBA",
    title: "The Quiet Revolution in NBA Load Management",
    excerpt: "Teams are using real-time biometric data differently in 2026. Here's what the numbers actually show about rest vs. rhythm.",
    author: "Aisha Lane",
    authorInitials: "AL",
    authorColor: "bg-purple-600",
    views: "9.8k",
    comments: 36,
    stars: 4.6,
    emoji: "🏀",
  },
  {
    id: "3",
    rank: 1,
    section: "Pop Culture",
    category: "Music",
    title: "Why 2026 Touring Is Breaking the Old Festival Model",
    excerpt: "Artists are skipping the big multi-day festivals in favor of their own controlled experiences. The data shows fans are following.",
    author: "Maya Chen",
    authorInitials: "MC",
    authorColor: "bg-pink-600",
    views: "8.1k",
    comments: 52,
    stars: 4.7,
    emoji: "🎵",
  },
  {
    id: "4",
    rank: 3,
    section: "Sports",
    category: "Soccer",
    title: "MLS Attendance Is Surging — But Not Where You Think",
    excerpt: "Secondary markets and midweek games are driving unexpected growth. The data challenges the big-market narrative.",
    author: "Tom Keller",
    authorInitials: "TK",
    authorColor: "bg-green-600",
    views: "7.1k",
    comments: 29,
    stars: 4.5,
    emoji: "⚽",
  },
];

const topPublishers = [
  { rank: 1, name: "Jordan Reyes", initials: "JR", color: "bg-blue-600", points: 1840, articles: 4 },
  { rank: 2, name: "Maya Chen", initials: "MC", color: "bg-pink-600", points: 1620, articles: 5 },
  { rank: 3, name: "Aisha Lane", initials: "AL", color: "bg-purple-600", points: 1490, articles: 3 },
  { rank: 4, name: "Tom Keller", initials: "TK", color: "bg-green-600", points: 1310, articles: 4 },
  { rank: 5, name: "Sam Rivera", initials: "SR", color: "bg-orange-600", points: 1180, articles: 3 },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-transparent to-blue-900/30 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-10 relative">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Ranked Writing by the Public
          </h1>
          <p className="text-2xl text-forge-accent font-medium italic mb-3">
            “We don’t make sports fun. You do!”
          </p>
          <p className="text-gray-400 text-lg max-w-2xl mb-8">
            Real takes. Real engagement. AI only helps keep quality high — the rankings come from readers.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            <button className="px-5 py-2 rounded-full bg-forge-accent text-white text-sm font-semibold shadow-lg shadow-orange-500/20">
              All
            </button>
            <button className="px-5 py-2 rounded-full bg-forge-800 hover:bg-forge-700 text-sm font-medium transition">
              Sports
            </button>
            <button className="px-5 py-2 rounded-full bg-forge-800 hover:bg-forge-700 text-sm font-medium transition">
              Pop Culture
            </button>
          </div>

          <div className="flex gap-6 text-sm font-medium">
            <button className="text-forge-accent border-b-2 border-forge-accent pb-1">Top Ranked</button>
            <button className="text-gray-400 hover:text-white pb-1">Newest</button>
            <button className="text-gray-400 hover:text-white pb-1">Rising</button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16 grid lg:grid-cols-3 gap-8">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-5">
          {sampleArticles.map((article) => (
            <article
              key={article.id}
              className="group bg-forge-900/80 border border-forge-800 hover:border-forge-accent/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/5"
            >
              <div className="flex gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span className="bg-forge-accent/15 text-forge-accent px-2 py-0.5 rounded-md font-semibold">
                      #{article.rank} {article.section}
                    </span>
                    <span>{article.category}</span>
                    <span className="text-yellow-500">★ {article.stars}</span>
                  </div>

                  <Link href={`/article/${article.id}`}>
                    <h2 className="text-xl font-bold mb-2 group-hover:text-forge-accent transition leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                      {article.excerpt}
                    </p>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <Link href="/profile" className="flex items-center gap-2 hover:text-white">
                      <div className={`w-7 h-7 rounded-full ${article.authorColor} flex items-center justify-center text-xs font-bold`}>
                        {article.authorInitials}
                      </div>
                      <span>{article.author}</span>
                    </Link>
                    <span>{article.views} views</span>
                    <span>{article.comments} comments</span>
                  </div>
                </div>

                <div className="hidden sm:flex w-28 h-28 rounded-xl bg-gradient-to-br from-forge-800 to-forge-900 items-center justify-center text-4xl shrink-0 border border-forge-700">
                  {article.emoji}
                </div>
              </div>
            </article>
          ))}

          <div className="text-center pt-4">
            <button className="px-8 py-3 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm font-medium transition">
              Load More Articles
            </button>
          </div>
        </div>

        {/* Sidebar - Publisher Leaderboard */}
        <aside className="space-y-6">
          <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Publisher Leaderboard</h3>
              <span className="text-xs text-gray-500 bg-forge-800 px-2 py-1 rounded">Last 7 days</span>
            </div>

            <div className="space-y-3">
              {topPublishers.map((pub) => (
                <Link
                  href="/profile"
                  key={pub.rank}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-forge-800/70 transition"
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                    pub.rank === 1 ? "bg-yellow-500 text-black" :
                    pub.rank === 2 ? "bg-gray-300 text-black" :
                    pub.rank === 3 ? "bg-amber-700 text-white" :
                    "bg-forge-700 text-gray-300"
                  }`}>
                    {pub.rank}
                  </div>
                  <div className={`w-9 h-9 rounded-full ${pub.color} flex items-center justify-center text-sm font-bold`}>
                    {pub.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{pub.name}</div>
                    <div className="text-xs text-gray-500">{pub.articles} articles</div>
                  </div>
                  <div className="text-sm font-semibold text-forge-accent">
                    {pub.points}
                  </div>
                </Link>
              ))}
            </div>

            <button className="w-full mt-4 text-sm text-center text-gray-400 hover:text-forge-accent transition">
              View full leaderboard →
            </button>
          </div>

          <div className="bg-gradient-to-br from-orange-600/20 to-forge-900 border border-orange-500/30 rounded-2xl p-5 text-center">
            <p className="font-semibold mb-2">Got a take?</p>
            <p className="text-sm text-gray-400 mb-4">Write it. Rank it. Own the board.</p>
            <Link
              href="/editor"
              className="inline-block bg-forge-accent hover:bg-forge-accentHover text-white font-medium px-6 py-2.5 rounded-xl transition"
            >
              Write Article
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
