"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";

export interface HistoryItem {
  _id: string;
  characterName: string;
  abilityName: string;
  beforeLevel: number;
  afterLevel: number;
  updatedAt: string;
}

export interface GroupedItem {
  groupId: string;
  characterName: string;
  updatedAt: string;
  records: HistoryItem[];
}

interface Props {
  group: GroupedItem;
  onRevert: (id: string, item: HistoryItem) => Promise<void>;
  onRevertGroup: (group: GroupedItem) => Promise<void>;
}

// ✅ Helper: short time format (MM/DD HH:MM)
function formatShortTime(dateStr: string) {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export default function GroupedResult({ group, onRevert, onRevertGroup }: Props) {
  const [open, setOpen] = useState(false);
  const truncate = (name: string) => (name.length > 2 ? name.slice(0, 2) : name);

  // ─────────────── Modal ───────────────
  const modalContent =
    open &&
    createPortal(
      <div className={styles.modalBackdrop} onClick={() => setOpen(false)}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* ─────────────── Header Row ─────────────── */}
          <div className={styles.headerRow}>
            <h3 className={styles.title}>
              {group.characterName} 的批量更新（{formatShortTime(group.updatedAt)}）
            </h3>
            <div className={styles.headerButtons}>
              <button
                className={styles.revertAllBtn}
                onClick={() => onRevertGroup(group)}
              >
                撤回
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
              >
                关闭
              </button>
            </div>
          </div>

          <p className={styles.subTitle}>共 {group.records.length} 条记录</p>

          {/* ─────────────── Ability Grid ─────────────── */}
          <div className={styles.grid}>
            {group.records.map((r) => (
              <div key={r._id} className={styles.card}>
                <img
                  src={`/icons/${r.abilityName}.png`}
                  alt={r.abilityName}
                  className={styles.icon}
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).src = "/icons/default.png")
                  }
                />
                <span className={styles.name}>{truncate(r.abilityName)}</span>
                <span className={styles.change}>
                  {r.beforeLevel} → {r.afterLevel}
                </span>
                <button
                  className={styles.revertBtn}
                  onClick={() => onRevert(r._id, r)}
                >
                  撤回全部
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>,
      document.body
    );

  // ─────────────── Table Row ───────────────
  return (
    <>
      <tr className={styles.groupRow} onClick={() => setOpen(true)}>
        <td>{formatShortTime(group.updatedAt)}</td>
        <td>{group.characterName}</td>
        <td colSpan={2} style={{ color: "#888" }}>
          {group.records.length} 个技能（点击查看）
        </td>
        <td>
          <button
            className={styles.revertBtn}
            onClick={(e) => {
              e.stopPropagation();
              onRevertGroup(group);
            }}
          >
            撤回
          </button>
        </td>
      </tr>

      {modalContent}
    </>
  );
}
