"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import styles from "./styles.module.css";

interface Character {
  _id: string;
  name: string;
  role?: "Tank" | "DPS" | "Healer";
}

interface DropItem {
  ability?: string;
  name?: string;
  level?: number;
  characterId?: string;
  characterName?: string;
  characterRole?: "Tank" | "DPS" | "Healer";
}

interface Props {
  API_URL: string;
  planId: string;
  groupIndex: number; // 0-based
  groupCharacters: Character[];
  refreshSignal?: number; // 🔁 optional external refresh trigger
}

export default function AssignedDrops({
  API_URL,
  planId,
  groupIndex,
  groupCharacters,
  refreshSignal,
}: Props) {
  const [drops, setDrops] = useState<DropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrop, setSelectedDrop] = useState<DropItem | null>(null);

  const base = API_URL.endsWith("/api")
    ? API_URL
    : `${API_URL.replace(/\/$/, "")}/api`;
  const backendIndex = groupIndex + 1;

  const fetchDrops = useCallback(async () => {
    const url = `${base}/targeted-plans/${planId}/groups/${backendIndex}/drops?t=${Date.now()}`;
    try {
      setLoading(true);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const withNames: DropItem[] = (data?.drops || []).map((d: DropItem) => {
        const found = groupCharacters.find((c) => c._id === d.characterId);
        return {
          ...d,
          characterName: found?.name || "未知角色",
          characterRole: found?.role,
        };
      });

      setDrops(withNames);
    } catch (err) {
      console.error("❌ [AssignedDrops] Failed to load drops:", err);
    } finally {
      setLoading(false);
    }
  }, [base, planId, backendIndex, groupCharacters]);

  useEffect(() => {
    if (groupIndex === undefined || groupIndex === null) return;
    fetchDrops();
  }, [groupIndex, planId, API_URL, groupCharacters.length, refreshSignal, fetchDrops]);
  // 🟢 include refreshSignal so it re-fetches when new drop is saved

  const handleDelete = async (drop: DropItem) => {
    if (!drop.ability || !drop.characterId) return;

    try {
      const res = await fetch(
        `${base}/targeted-plans/${planId}/groups/${backendIndex}/drops`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ability: drop.ability,
            characterId: drop.characterId,
          }),
        }
      );

      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      setSelectedDrop(null);
      await fetchDrops(); // ✅ instantly refresh after deletion
    } catch (err) {
      console.error("❌ 删除失败:", err);
      alert("❌ 删除失败，请稍后再试");
    }
  };

  if (loading) return <span className={styles.loading}>加载中…</span>;
  if (!drops.length) return <span className={styles.empty}></span>;

  return (
    <>
      <div className={styles.assignedDrops}>
        {drops.map((d, i) => {
          const iconSrc = `/icons/${d.ability || d.name}.png`;
          const abilityText = (d.ability || d.name || "未知技能").slice(0, 2);

          return (
            <div
              key={`${d.ability}-${d.characterId}-${i}`}
              className={styles.dropItem}
              onClick={() => setSelectedDrop(d)}
              title={d.ability || d.name || "技能"}
            >
              <div className={styles.iconWrapper}>
                <Image
                  src={iconSrc}
                  alt={d.ability || d.name || "技能"}
                  width={20}
                  height={20}
                  className={styles.icon}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              <span className={styles.abilityName}>
                {abilityText}
                {d.level ? <span className={styles.level}>{d.level}</span> : null}
              </span>

              {d.characterName && (
                <>
                  <span className={styles.arrow}>→</span>
                  <span
                    className={`${styles.characterBubble} ${
                      d.characterRole === "Tank"
                        ? styles.tank
                        : d.characterRole === "Healer"
                        ? styles.healer
                        : styles.dps
                    }`}
                  >
                    {d.characterName}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* === Modal === */}
      {selectedDrop && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedDrop(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* 🧱 Header Title */}
            <div className={styles.modalHeader}>删除掉落</div>

            <div className={styles.modalLine}>
              <Image
                src={`/icons/${selectedDrop.ability || selectedDrop.name}.png`}
                alt={selectedDrop.ability || "技能"}
                width={28}
                height={28}
                className={styles.modalIcon}
              />
              <span className={styles.abilityFullName}>
                {selectedDrop.ability || selectedDrop.name}
              </span>
              <span className={styles.levelInline}>
                {selectedDrop.level ?? "?"}重
              </span>
              <span className={styles.arrow}>→</span>
              <span
                className={`${styles.characterBubble} ${
                  selectedDrop.characterRole === "Tank"
                    ? styles.tank
                    : selectedDrop.characterRole === "Healer"
                    ? styles.healer
                    : styles.dps
                }`}
              >
                {selectedDrop.characterName}
              </span>
            </div>

            <div className={styles.modalFooterRight}>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(selectedDrop)}
              >
                删除
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedDrop(null)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
