"use client";

import styles from "./styles.module.css";
import Assigned from "./Assigned";
import Processed from "./Processed";
import DropStats from "./DropStats";
import type { GroupResult } from "@/utils/solver";
import { useResultWindow } from "./useResultWindow";

interface Props {
  scheduleId: string;
  group: GroupResult;
  onRefresh?: () => void;
}

export default function ResultWindow({ scheduleId, group, onRefresh }: Props) {
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
      <Assigned
        drops={assigned}
        group={localGroup}
        onUse={handleUse}
        onStore={handleStore}
        loading={loading}
      />
      <Processed drops={processed} group={localGroup} />
      <DropStats group={localGroup} assigned={drops} />
    </div>
  );
}
