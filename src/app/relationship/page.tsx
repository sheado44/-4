import Link from "next/link";

export default function RelationshipPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <Link
        href="/profile"
        className="text-sm text-gray-400 hover:text-forge-accent transition mb-6 inline-block"
      >
        ← Back to profile
      </Link>

      <h1 className="text-2xl font-bold mb-1">Your relationship with Jordan Reyes</h1>
      <p className="text-sm text-gray-400 mb-8">
        Only visible to you
      </p>

      {/* Summary */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 mb-8">
        <div className="font-semibold text-green-400">Ally</div>
        <div className="text-sm text-gray-400 mt-0.5">
          14 likes · 2 dislikes · 5 comments · 3 replies
        </div>
      </div>

      {/* Liked */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-green-400 mb-3">Liked (14)</h2>
        <div className="space-y-2">
          <Link
            href="/article/1"
            className="block bg-forge-900 border border-forge-800 hover:border-forge-700 rounded-xl px-4 py-3 transition"
          >
            <div className="text-xs text-gray-500 mb-1">Your article</div>
            <div className="text-sm text-gray-200">
              Why the Bears&apos; Offensive Line Is Quietly Elite in 2026
            </div>
          </Link>

          <Link
            href="/article/1/comment/detail"
            className="block bg-forge-900 border border-forge-800 hover:border-forge-700 rounded-xl px-4 py-3 transition"
          >
            <div className="text-xs text-gray-500 mb-1">Your comment</div>
            <div className="text-sm text-gray-200 line-clamp-2">
              “The biometric data angle is underrated. Most people still think load management is just resting stars.”
            </div>
          </Link>

          <div className="text-xs text-gray-500 px-1 pt-1">+12 more</div>
        </div>
      </div>

      {/* Disliked */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-red-400 mb-3">Disliked (2)</h2>
        <div className="space-y-2">
          <Link
            href="/article/1/comment/detail"
            className="block bg-forge-900 border border-forge-800 hover:border-forge-700 rounded-xl px-4 py-3 transition"
          >
            <div className="text-xs text-gray-500 mb-1">Your comment</div>
            <div className="text-sm text-gray-200 line-clamp-2">
              “Artists skipping festivals feels inevitable once you look at the economics.”
            </div>
          </Link>

          <Link
            href="/article/1"
            className="block bg-forge-900 border border-forge-800 hover:border-forge-700 rounded-xl px-4 py-3 transition"
          >
            <div className="text-xs text-gray-500 mb-1">Your article</div>
            <div className="text-sm text-gray-200">
              The Evolution of Zone Blocking in the Modern NFL
            </div>
          </Link>
        </div>
      </div>

      {/* Commented on your work */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-blue-400 mb-3">Commented on your work (5)</h2>
        <div className="space-y-2">
          <Link
            href="/article/1"
            className="block bg-forge-900 border border-forge-800 hover:border-forge-700 rounded-xl px-4 py-3 transition"
          >
            <div className="text-xs text-gray-500 mb-1">
              On your article · Why the Bears&apos; Offensive Line...
            </div>
            <div className="text-sm text-gray-200 line-clamp-2">
              “This is the kind of analysis that actually moves the conversation forward. Great work.”
            </div>
          </Link>

          <Link
            href="/article/1"
            className="block bg-forge-900 border border-forge-800 hover:border-forge-700 rounded-xl px-4 py-3 transition"
          >
            <div className="text-xs text-gray-500 mb-1">
              On your article · MLS Attendance Is Surging...
            </div>
            <div className="text-sm text-gray-200 line-clamp-2">
              “Secondary markets point is spot on. The data has been heading this way for two years.”
            </div>
          </Link>

          <div className="text-xs text-gray-500 px-1 pt-1">+3 more</div>
        </div>
      </div>

      {/* Replied to you */}
      <div>
        <h2 className="text-sm font-semibold text-purple-400 mb-3">Replied to you (3)</h2>
        <div className="space-y-2">
          <Link
            href="/article/1/comment/detail"
            className="block bg-forge-900 border border-forge-800 hover:border-forge-700 rounded-xl px-4 py-3 transition"
          >
            <div className="text-xs text-gray-500 mb-1">
              Reply to your comment
            </div>
            <div className="text-sm text-gray-200 line-clamp-2">
              “Agreed on the right tackle. That signing changed the entire unit.”
            </div>
          </Link>

          <Link
            href="/article/1/comment/detail"
            className="block bg-forge-900 border border-forge-800 hover:border-forge-700 rounded-xl px-4 py-3 transition"
          >
            <div className="text-xs text-gray-500 mb-1">
              Reply to your comment
            </div>
            <div className="text-sm text-gray-200 line-clamp-2">
              “I’d push back a bit on the screen success rate, but the overall point stands.”
            </div>
          </Link>

          <div className="text-xs text-gray-500 px-1 pt-1">+1 more</div>
        </div>
      </div>
    </main>
  );
}
