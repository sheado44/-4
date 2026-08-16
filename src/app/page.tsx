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
    id: "5",
    rank: 1,
    section: "Fan Fiction",
    category: "Satire",
    title: "Caleb Williams Accidentally Invents Time Travel During a Scramble",
    excerpt: "In this clearly untrue tale, a broken play sends the Bears QB into 1985, where he teaches Walter Payton the RPO.",
    author: "Sam Rivera",
    authorInitials: "SR",
    authorColor: "bg-orange-600",
    views: "6.3k",
    comments: 91,
    stars: 4.9,
    emoji: "🌀",
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
];

const topPublishers = [
  { rank: 1, name: "Jordan Reyes", initials: "JR", color: "bg-blue-600", points: 1840, articles: 4 },
  { rank: 2, name: "Maya Chen", initials: "MC", color: "bg-pink-600", points: 1620, articles: 5 },
  { rank: 3, name: "Aisha Lane", initials: "AL", color: "bg-purple-600", points: 1490, articles: 3 },
  { rank: 4, name: "Tom Keller", initials: "TK", color: "bg-green-600", points: 1310, articles: 4 },
  { rank: 5, name: "Sam Rivera", initials: "SR", color: "bg-orange-600", points: 1180, articles: 3 },
];

const hottestCommenters = [
  { rank: 1, name: "Derek K.", initials: "DK", color: "bg-green-700", heat: "On Fire", heatColor: "text-red-400" },
  { rank: 2, name: "Aisha L.", initials: "AL", color: "bg-purple-600", heat: "Hot", heatColor: "text-orange-400" },
  { rank: 3, name: "Maya Chen", initials: "MC", color: "bg-pink-600", heat: "Lukewarm", heatColor: "text-yellow-400" },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Logo Hero */}
      <section className="pt-14 pb-10 text-center">
        <h1 className="text-6xl md:text-7xl font-black tracking-tight select-none leading-none">
          <span className="text-white">Press</span>
          <span className="text-gray-400">ME</span>
        </h1>
        <p className="text-gray-500 mt-3 text-xs tracking-[0.3em] uppercase">
          Sports & Pop Culture
        </p>
      </section>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-2 mb-5 justify-center md:justify-start">
          <button className="px-5 py-2 rounded-full bg-forge-accent text-white text-sm font-semibold shadow-md shadow-orange-500/20">
            All
          </button>
          <button className="px-5 py-2 rounded-full bg-forge-800 hover:bg-forge-700 text-sm font-medium transition">
            Sports
          </button>
          <button className="px-5 py-2 rounded-full bg-forge-800 hover:bg-forge-700 text-sm font-medium transition">
            Pop Culture
          </button>
          <button className="px-5 py-2 rounded-full bg-forge-800 hover:bg-forge-700 text-sm font-medium transition">
            Fan Fiction
          </button>
        </div>

        <div className="flex gap-6 text-sm font-medium justify-center md:justify-start">
          <button className="text-forge-accent border-b-2 border-forge-accent pb-1">Top Ranked</button>
          <button className="text-gray-400 hover:text-white pb-1 transition">Newest</button>
          <button className="text-gray-400 hover:text-white pb-1 transition">Rising</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 grid lg:grid-cols-3 gap-8">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-4">
          {sampleArticles.map((article) => (
            <article
              key={article.id}
              className="group bg-forge-900/60 border border-forge-800 hover:border-forge-accent/40 rounded-2xl p-5 transition-all duration-200 hover:bg-forge-900"
            >
              <div className="flex gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        article.section === "Fan Fiction"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-forge-accent/15 text-forge-accent"
                      }`}
                    >
                      #{article.rank} {article.section}
                    </span>
                    <span>{article.category}</span>
                    <span className="text-yellow-500">★ {article.stars}</span>
                  </div>

                  <Link href={`/article/${article.id}`}>
                    <h2 className="text-lg md:text-xl font-bold mb-2 group-hover:text-forge-accent transition leading-snug">
                      {article.title}
                    </h2>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <Link href="/profile" className="flex items-center gap-2 hover:text-white transition">
                      <div className={`w-7 h-7 rounded-full ${article.authorColor} flex items-center justify-center text-xs font-bold`}>
                        {article.authorInitials}
                      </div>
                      <span>{article.author}</span>
                    </Link>
                    <span>{article.views} views</span>
                    <span>{article.comments} comments</span>
                  </div>
                </div>

                <div className="hidden sm:flex w-24 h-24 md:w-28 md:h-28 rounded-xl bg-gradient-to-br from-forge-800 to-forge-900 items-center justify-center text-4xl shrink-0 border border-forge-700 group-hover:border-forge-600 transition">
                  {article.emoji}
                </div>
              </div>
            </article>
          ))}

          <div className="text-center pt-6">
            <button className="px-8 py-3 bg-forge-800 hover:bg-forge-700 rounded-xl text-sm font-medium transition">
              Load More Articles
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Publisher Leaderboard */}
          <div className="bg-forge-900/80 border border-forge-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Publisher Leaderboard</h3>
              <span className="text-[10px] text-gray-500 bg-forge-800 px-2 py-1 rounded-full">7 days</span>
            </div>

            <div className="space-y-2">
              {topPublishers.map((pub) => (
                <Link
                  href="/profile"
                  key={pub.rank}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-forge-800/80 transition"
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-xs ${
                    pub.rank === 1 ? "bg-yellow-500 text-black" :
                    pub.rank === 2 ? "bg-gray-300 text-black" :
                    pub.rank === 3 ? "bg-amber-700 text-white" :
                    "bg-forge-700 text-gray-300"
                  }`}>
                    {pub.rank}
                  </div>
                  <div className={`w-8 h-8 rounded-full ${pub.color} flex items-center justify-center text-xs font-bold`}>
                    {pub.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{pub.name}</div>
                    <div className="text-[11px] text-gray-500">{pub.articles} articles</div>
                  </div>
                  <div className="text-sm font-semibold text-forge-accent">
                    {pub.points}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Hottest Commenters */}
          <div className="bg-forge-900/80 border border-forge-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Hottest Commenters</h3>
              <span className="text-[10px] text-gray-500 bg-forge-800 px-2 py-1 rounded-full">48 hrs</span>
            </div>

            <div className="space-y-2">
              {hottestCommenters.map((c) => (
                <Link
                  href="/profile"
                  key={c.rank}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-forge-800/80 transition"
                >
                  <div className="w-7 h-7 flex items-center justify-center rounded-full font-bold text-xs bg-forge-700 text-gray-300">
                    {c.rank}
                  </div>
                  <div className={`w-8 h-8 rounded-full ${c.color} flex items-center justify-center text-xs font-bold`}>
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.name}</div>
                    <div className={`text-[11px] ${c.heatColor}`}>{c.heat}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-orange-600/15 to-forge-900 border border-orange-500/20 rounded-2xl p-5 text-center">
            <p className="font-semibold mb-1">Got a take?</p>
            <p className="text-sm text-gray-400 mb-4">Write it. Rank it.</p>
            <Link
              href="/editor"
              className="inline-block bg-forge-accent hover:bg-forge-accentHover text-white font-medium px-6 py-2.5 rounded-xl transition text-sm"
            >
              Write Article
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
