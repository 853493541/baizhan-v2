"use client";

import { useParams } from "next/navigation";
import TargetedPlanDetail from "./TargetedPlanDetail";

export default function TargetedPlanPage() {
  const params = useParams();
  console.log("🧭 useParams() =", params); // debug helper

  // ✅ your folder uses [id], so grab it directly
  const planId = params?.id as string | undefined;

  // wait for Next.js hydration
  if (!planId) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: "16px", color: "#666" }}>加载中...</p>
      </div>
    );
  }

  return <TargetedPlanDetail planId={planId} />;
}
