"use client";

import Link from "next/link";

export default function StatsPage() {
  return (
    <div>
      <h1>Stats</h1>

      <Link href="/stats/appearances">Appearances</Link>
    </div>
  );
}
