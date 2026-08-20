"use client";

import Link from "next/link";
import FantasiDeskMark from "@/components/FantasiDeskMark";

export default function FantasyRailWidget() {
  return (
    <div className="pit-panel p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-pit mb-1">
            a product of theBallpit
          </div>
          <FantasiDeskMark size="nav" />
        </div>
        <Link href="/fantasy" className="btn-write px-3 py-1.5 rounded-lg text-xs">
          Open
        </Link>
      </div>
      <p className="text-xs text-muted-pit mb-3">
        Free roster tools. Credits for Set my week and research. Same login as the pit.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/fantasy" className="btn-metal px-3 py-1.5 rounded-lg text-xs">
          NFL desk
        </Link>
        <Link href="/fantasy/golf" className="btn-metal px-3 py-1.5 rounded-lg text-xs">
          Golf card
        </Link>
      </div>
    </div>
  );
}

