import Link from "next/link";

export default function CommentDetailPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      {/* Back */}
      <Link
        href="/article/1"
        className="text-sm text-gray-400 hover:text-forge-accent transition mb-6 inline-block"
      >
        ← Back to article
      </Link>

      <h1 className="text-2xl font-bold mb-6">Comment Activity</h1>

      {/* Original comment */}
      <div className="bg-forge-900 border border-forge-800 rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 text-sm mb-2">
          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-xs font-bold">
            DK
          </div>
          <span className="font-medium">Derek K.</span>
          <span className="text-gray-500 text-xs">2h ago</span>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          Finally someone posting the actual film grades instead of the same old “Bears line is bad” narrative. The right tackle improvement alone is massive.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">24</div>
          <div className="text-xs text-gray-400 mt-1">Likes</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">3</div>
          <div className="text-xs text-gray-400 mt-1">Dislikes</div>
        </div>
      </div>

      {/* Liked by */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-green-400 mb-3">Liked by</h2>
        <div className="space-y-2">
          {[
            "Maya Chen",
            "Aisha Lane",
            "Tom Keller",
            "Sam Rivera",
            "Jordan Reyes",
            "Lisa M.",
            "Chris K.",
            "+17 more",
          ].map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 bg-forge-900 border border-forge-800 rounded-xl px-4 py-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-forge-700 flex items-center justify-center text-xs font-bold">
                {name.charAt(0)}
              </div>
              <span className="text-sm text-gray-200">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disliked by */}
      <div>
        <h2 className="text-sm font-semibold text-red-400 mb-3">Disliked by</h2>
        <div className="space-y-2">
          {["Chris P.", "Jordan M.", "Alex T."].map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 bg-forge-900 border border-forge-800 rounded-xl px-4 py-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-forge-700 flex items-center justify-center text-xs font-bold">
                {name.charAt(0)}
              </div>
              <span className="text-sm text-gray-200">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
