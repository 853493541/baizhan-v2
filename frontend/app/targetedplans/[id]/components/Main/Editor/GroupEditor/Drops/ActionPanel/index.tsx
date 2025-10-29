"use client";
import styles from "./styles.module.css";

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
    try {
      await fetch(
        `${API_URL}/api/targeted-plans/${planId}/groups/${groupIndex}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "finished" }),
        }
      );
      group.status = "finished";
      console.log(`✅ Group ${groupIndex} marked as finished after action.`);
    } catch (err) {
      console.error("❌ Failed to mark group as finished:", err);
    }
  };

  const saveToBackpack = async () => {
    if (!fullChar || !selectedAbility || !selectedLevel) return;

    // Prevent saving 9 if already has 10 in backpack
    if (selectedLevel === 9 && hasLevel10InStorage(fullChar, selectedAbility)) {
      // alert(
      //   `⚠️ ${fullChar.name} 的背包中已存在 ${selectedAbility}（10重）。\n不能再保存 9重。`
      // );
      return;
    }

    setLoading(true);
    try {
      await recordDrop(fullChar, selectedAbility, selectedLevel);
      await fetch(`${API_URL}/api/characters/${fullChar._id}/storage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ability: selectedAbility, level: selectedLevel }),
      });

      // 🟢 Mark group as finished
      await markGroupAsDone();

      alert("✅ 已存入背包！");
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
      // 🟩 Step 1: record and apply the chosen level (usually 9)
      await recordDrop(fullChar, selectedAbility, selectedLevel);
      await fetch(`${API_URL}/api/characters/${fullChar._id}/storage/use`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ability: selectedAbility, level: selectedLevel }),
      });

      alert(`✅ ${fullChar.name} 已使用${selectedAbility}（${selectedLevel}重）`);

      // 🟨 Step 2: if we just used 9重, check if backpack has 10重
      if (
        selectedLevel === 9 &&
        hasLevel10InStorage(fullChar, selectedAbility)
      ) {
        const useTen = confirm(
          `${fullChar.name} 的背包中有 ${selectedAbility}（十重）, 是否使用？`
        );
        if (useTen) {
          await fetch(`${API_URL}/api/characters/${fullChar._id}/storage/use`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ability: selectedAbility, level: 10 }),
          });
          // alert(`✅ ${fullChar.name} 已使用 ${selectedAbility}（十重）`);
        }
      }

      // 🟢 Mark group as finished
      await markGroupAsDone();

      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const disabled =
    !selectedAbility || !selectedLevel || !fullChar || loading;

  return (
    <div className={styles.column}>
      <div className={styles.sectionDivider}>操作</div>

      <div className={styles.btnCol}>
        <button
          onClick={useImmediately}
          disabled={disabled}
          className={`${styles.useBtn} ${disabled ? styles.disabled : ""}`}
        >
          立即使用
        </button>

        <button
          onClick={saveToBackpack}
          disabled={disabled}
          className={`${styles.saveBtn} ${disabled ? styles.disabled : ""}`}
        >
          保存到背包
        </button>
      </div>
    </div>
  );
}
