import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
        <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold shrink-0">
          JR
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1">Jordan Reyes</h1>
          <p className="text-gray-400 mb-4">
            NFL & college football analyst • Chicago
          </p>

          {/* Ranks + Heat */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
              <div className="text-xs text-gray-400">Publisher Rank</div>
              <div className="font-bold text-forge-accent text-lg">#7</div>
            </div>
            <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
              <div className="text-xs text-gray-400">Commenter Rank</div>
              <div className="font-bold text-white text-lg">#22</div>
            </div>
            <div className="bg-forge-900 border border-forge-700 rounded-xl px-4 py-2">
              <div className="text-xs text-gray-400">Heat</div>
              <div className="font-bold text-orange-400 text-lg">Hot</div>
            </div>
          </div>

          <p className="text-gray-300 max-w-2xl text-sm leading-relaxed">
            Former D-II offensive lineman turned film and data nerd. I write about the trenches, scheme evolution, and the numbers that actually matter. Also an active commenter who isn’t afraid to push back.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">28</div>
          <div className="text-xs text-gray-400 mt-1">Articles</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">84k</div>
          <div className="text-xs text-gray-400 mt-1">Article Views</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">156</div>
          <div className="text-xs text-gray-400 mt-1">Comments</div>
        </div>
        <div className="bg-forge-900 border border-forge-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">1,240</div>
          <div className="text-xs text-gray-400 mt-1">Likes Received</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-forge-800 mb-6 text-sm font-medium">
        <button className="pb-3 border-b-2 border-forge-accent text-forge-accent">
          Articles
        </button>
        <button className="pb-3 text-gray-400 hover:text-white transition">
          Comments
        </button>
        <button className="pb-3 text-gray-400 hover:text-white transition">
          About
        </button>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        <Link
          href="/article/1"
          className="block bg-forge-900 border border-forge-800 rounded-xl p-5 hover:border-forge-700 transition"
        >
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span className="text-forge-accent font-medium">#1 Ranked</span>
            <span>•</span>
            <span>NFL</span>
            <span>•</span>
            <span className="text-yellow-500">★ 4.8</span>
            <span>•</span>
            <span>Aug 12, 2026</span>
          </div>
          <h2 className="text-lg font-bold mb-1">
            Why the Bears&apos; Offensive Line Is Quietly Elite in 2026
          </h2>
          <p className="text-gray-400 text-sm">12.4k views • 48 comments</p>
        </Link>

        <div className="bg-forge-900 border border-forge-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span className="bg-forge-700 px-2 py-0.5 rounded">#8</span>
            <span>•</span>
            <span>NFL</span>
            <span>•</span>
            <span className="text-yellow-500">★ 4.5</span>
            <span>•</span>
            <span>Jul 28, 2026</span>
          </div>
          <h2 className="text-lg font-bold mb-1">
            The Evolution of Zone Blocking in the Modern NFL
          </h2>
          <p className="text-gray-400 text-sm">6.2k views • 22 comments</p>
        </div>

        <div className="bg-forge-900 border border-forge-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span className="bg-forge-700 px-2 py-0.5 rounded">#19</span>
            <span>•</span>
            <span>College Football</span>
            <span>•</span>
            <span className="text-yellow-500">★ 4.3</span>
            <span>•</span>
            <span>Jul 14, 2026</span>
          </div>
          <h2 className="text-lg font-bold mb-1">
            Why Group of 5 Programs Are Closing the Talent Gap
          </h2>
          <p className="text-gray-400 text-sm">4.1k views • 31 comments</p>
        </div>
      </div>
    </main>
  );
}
