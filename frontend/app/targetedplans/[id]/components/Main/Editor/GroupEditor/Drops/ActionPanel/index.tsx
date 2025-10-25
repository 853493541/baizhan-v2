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
  const recordDrop = async (char: any, ability: string, level: number) => {
    const groupIndex = Number(group.index ?? 0);
    const endpoint = `${API_URL}/api/targeted-plans/${planId}/groups/${groupIndex}/drops`;
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: char._id, ability, level }),
    }).catch(() => {});
  };

  const saveToBackpack = async () => {
    if (!selectedCharacter || !selectedAbility || !selectedLevel) return;
    setLoading(true);
    try {
      await recordDrop(selectedCharacter, selectedAbility, selectedLevel);
      await fetch(`${API_URL}/api/characters/${selectedCharacter._id}/storage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ability: selectedAbility, level: selectedLevel }),
      });
      alert("✅ 已保存到背包，并已记录掉落！");
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const useImmediately = async () => {
    if (!selectedCharacter || !selectedAbility || !selectedLevel) return;
    setLoading(true);
    try {
      await recordDrop(selectedCharacter, selectedAbility, selectedLevel);
      await fetch(`${API_URL}/api/characters/${selectedCharacter._id}/storage/use`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ability: selectedAbility, level: selectedLevel }),
      });
      alert(`✅ ${selectedCharacter.name} 已成功使用 ${selectedAbility}（${selectedLevel}重）`);
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.column}>
      <h4>操作</h4>
      <div className={styles.btnCol}>
        <button
          onClick={useImmediately}
          disabled={!selectedCharacter || !selectedAbility || !selectedLevel || loading}
          className={styles.useBtn}
        >
          立即使用
        </button>
        <button
          onClick={saveToBackpack}
          disabled={!selectedCharacter || !selectedAbility || !selectedLevel || loading}
          className={styles.saveBtn}
        >
          保存到背包
        </button>
      </div>
    </div>
  );
}
