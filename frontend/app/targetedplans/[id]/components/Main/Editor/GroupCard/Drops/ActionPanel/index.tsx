"use client";
import { useState } from "react";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal";

export default function ActionPanel({
  API_URL,
  planId,
  group,
  allCharacters,
  selectedCharacter,
  selectedAbility,
  selectedLevel,
  loading,
  setLoading,
  onClose,
  onSaved,
}: any) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingLv10Use, setPendingLv10Use] = useState(false);

  const fullChar =
    selectedCharacter &&
    (allCharacters.find((c: any) => c._id === selectedCharacter._id) ||
      selectedCharacter);

  const hasLevel10InStorage = (char: any, ability: string) => {
    const storage = Array.isArray(char?.storage) ? char.storage : [];
    return storage.some(
      (item: any) =>
        item.ability === ability && item.level === 10 && item.used === false
    );
  };

  const recordDrop = async (char: any, ability: string, level: number) => {
    const groupIndex = Number(group.index ?? 0);
    const endpoint = `${API_URL}/api/targeted-plans/${planId}/groups/${groupIndex}/drops`;
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: char._id, ability, level }),
    }).catch(() => {});
  };

  const markGroupAsDone = async () => {
    const groupIndex = Number(group.index ?? 0);
    await fetch(
      `${API_URL}/api/targeted-plans/${planId}/groups/${groupIndex}/status`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finished" }),
      }
    );
    group.status = "finished";
  };

  const saveToBackpack = async () => {
    if (!fullChar || !selectedAbility || !selectedLevel) return;

    setLoading(true);
    try {
      await recordDrop(fullChar, selectedAbility, selectedLevel);
      await fetch(`${API_URL}/api/characters/${fullChar._id}/storage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ability: selectedAbility, level: selectedLevel }),
      });
      await markGroupAsDone();
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const useImmediately = async () => {
    if (!fullChar || !selectedAbility || !selectedLevel) return;

    setLoading(true);
    try {
      await recordDrop(fullChar, selectedAbility, selectedLevel);
      await fetch(`${API_URL}/api/characters/${fullChar._id}/storage/use`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ability: selectedAbility, level: selectedLevel }),
      });

      // 🔑 Instead of window.confirm
      if (
        selectedLevel === 9 &&
        hasLevel10InStorage(fullChar, selectedAbility)
      ) {
        setPendingLv10Use(true);
        setConfirmOpen(true);
        return;
      }

      await markGroupAsDone();
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const confirmUseLv10 = async () => {
    setConfirmOpen(false);
    setPendingLv10Use(false);

    await fetch(`${API_URL}/api/characters/${fullChar._id}/storage/use`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ability: selectedAbility, level: 10 }),
    });

    await markGroupAsDone();
    onSaved();
    onClose();
  };

  const disabled =
    !selectedAbility || !selectedLevel || !fullChar || loading;

  return (
    <>
      <div className={styles.column}>
        <div className={styles.sectionDivider}>操作</div>

        <div className={styles.btnCol}>
          <button
            onClick={useImmediately}
            disabled={disabled}
            className={`${styles.useBtn} ${disabled ? styles.disabled : ""}`}
          >
            使用
          </button>

          <button
            onClick={saveToBackpack}
            disabled={disabled}
            className={`${styles.saveBtn} ${disabled ? styles.disabled : ""}`}
          >
            存入背包
          </button>
        </div>
      </div>

      {/* ✅ Custom Confirm Modal */}
      {confirmOpen && pendingLv10Use && (
        <ConfirmModal
          title="确认使用"
          message={`${fullChar.name} 的背包中已有 ${selectedAbility}（十重），是否继续使用？`}
          confirmText="使用十重"
          cancelText="取消"
          onConfirm={confirmUseLv10}
          onCancel={() => {
            setConfirmOpen(false);
            setPendingLv10Use(false);
            onSaved();
            onClose();
          }}
        />
      )}
    </>
  );
}
