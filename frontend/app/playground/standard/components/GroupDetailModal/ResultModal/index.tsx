"use client";

import styles from "./styles.module.css";
import Assigned from "./Assigned";
import Processed from "./Processed";
import DropStats from "./DropStats";
import GroupDetail from "./GroupDetail";

import type { GroupResult, AbilityCheck } from "@/utils/solver";
import { useResultWindow } from "./useResultWindow";

interface Props {
  scheduleId: string;
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  onRefresh?: () => void;
}

export default function ResultWindow({
  scheduleId,
  group,
  checkedAbilities,
  onRefresh,
}: Props) {
  const { localGroup, drops, loading, handleUse, handleStore } =
    useResultWindow(scheduleId, group, onRefresh);

  const assigned = drops.filter(
    (d) => d.status === "assigned" || d.status === "pending"
  );

  const processed = drops.filter(
    (d) => d.status === "used" || d.status === "saved"
  );

  return (
    <div className={styles.row}>
      {/* 🔹 Static summary (desktop-only via its own CSS) */}
      <GroupDetail
        group={localGroup}
        checkedAbilities={checkedAbilities}
      />

      {/* 🔹 Interactive result blocks */}
      <Assigned
        drops={assigned}
        group={localGroup}
        onUse={handleUse}
        onStore={handleStore}
        loading={loading}
      />

      <Processed
        drops={processed}
        group={localGroup}
      />

      <DropStats
        group={localGroup}
        assigned={drops}
      />
    </div>
  );
}
