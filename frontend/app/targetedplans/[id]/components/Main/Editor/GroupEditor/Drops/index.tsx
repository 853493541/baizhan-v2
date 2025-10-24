"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import AbilityPicker from "./AbilityPicker";
import LevelPicker from "./LevelPicker";
import MemberList from "./MemberList";
import ConfirmModal from "./ConfirmModal";
import type { AbilityCheck, Character, GroupResult } from "@/utils/solver";

interface Props {
  API_URL: string;
  planId: string;
  group: GroupResult;
  checkedAbilities: AbilityCheck[];
  onClose: () => void;
  onSaved: () => void;
}

export default function GroupDrops({
  API_URL,
  planId,
  group,
  checkedAbilities,
  onClose,
  onSaved,
}: Props) {
  const [step, setStep] = useState<"ability" | "level" | "member" | "confirm">("ability");
  const [selectedAbility, setSelectedAbility] = useState<string>("");
  const [selectedLevel, setSelectedLevel] = useState<9 | 10 | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(false);

  /* -----------------------------------------------------------------------
     💾 Save drop record immediately when selecting character
  ----------------------------------------------------------------------- */
  const saveDropRecord = async (char: Character, ability: string, level: 9 | 10) => {
    const groupIndex = Number(group.index ?? 0);
    const endpoint = `${API_URL}/api/targeted-plans/${planId}/groups/${groupIndex}/drops`;
    const payload = { characterId: char._id, ability, level };

    console.log("🧭 [saveDropRecord] URL:", endpoint);
    console.log("🧭 [saveDropRecord] Payload:", payload);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text();
      console.log("🧭 [saveDropRecord] Raw response:", rawText);

      let data: any;
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }

      console.log("🧭 [saveDropRecord] Parsed response:", data);
      console.log("🧭 [saveDropRecord] Status:", res.status, res.statusText);

      if (!res.ok) {
        console.warn("⚠️ [saveDropRecord] HTTP Error:", res.status);
        alert(`❌ Failed to save drop: ${res.status}`);
      } else if (!data || !data.success) {
        console.warn("⚠️ [saveDropRecord] Backend did not confirm success");
        alert("❌ Backend did not confirm success (no DB change)");
      } else {
        console.log(`✅ Drop saved for ${char.name}: ${ability} (${level})`);
        onSaved?.();
      }
    } catch (err: any) {
      console.error("❌ [saveDropRecord] Network/logic error:", err);
      alert("❌ Network error while saving drop. Check console logs.");
    }
  };

  /* -----------------------------------------------------------------------
     💾 Save to backpack
  ----------------------------------------------------------------------- */
  const saveToBackpack = async () => {
    if (!selectedCharacter || !selectedAbility || !selectedLevel) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/characters/${selectedCharacter._id}/storage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ability: selectedAbility,
            level: selectedLevel,
          }),
        }
      );

      const text = await res.text();
      console.log("🧭 [saveToBackpack] Response text:", text);

      if (!res.ok) throw new Error("添加失败");
      alert("✅ 已保存到背包！");
      onSaved();
      onClose();
    } catch (err) {
      console.error("❌ [saveToBackpack] 保存失败:", err);
      alert("❌ 保存失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------------------
     ⚔️ Use immediately
  ----------------------------------------------------------------------- */
  const useImmediately = async () => {
    if (!selectedCharacter || !selectedAbility || !selectedLevel) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/characters/${selectedCharacter._id}/storage/use`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ability: selectedAbility,
            level: selectedLevel,
          }),
        }
      );

      const text = await res.text();
      console.log("🧭 [useImmediately] Response text:", text);

      if (!res.ok) {
        console.warn("⚠️ [useImmediately] storage/use failed, trying fallback");
        const fallback = await fetch(
          `${API_URL}/api/targeted-plans/${planId}/use-drop`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              characterId: selectedCharacter._id,
              ability: selectedAbility,
              level: selectedLevel,
            }),
          }
        );
        if (!fallback.ok) throw new Error("使用失败");
      }

      alert(`✅ ${selectedCharacter.name} 已成功使用 ${selectedAbility}！`);
      onSaved();
      onClose();
    } catch (err) {
      console.error("❌ [useImmediately] 使用失败:", err);
      alert("❌ 使用失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------------------------
     🧭 Step rendering
  ----------------------------------------------------------------------- */
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {step === "ability" && (
          <AbilityPicker
            checkedAbilities={checkedAbilities}
            onSelect={(a) => {
              setSelectedAbility(a);
              setStep("level");
            }}
            onClose={onClose}
          />
        )}

        {step === "level" && (
          <LevelPicker
            selectedAbility={selectedAbility}
            onSelectLevel={(lvl) => {
              setSelectedLevel(lvl);
              setStep("member");
            }}
            onBack={() => setStep("ability")}
          />
        )}

        {step === "member" && (
          <MemberList
            group={group}
            selectedAbility={selectedAbility}
            selectedLevel={selectedLevel as 9 | 10}
            onSelectCharacter={async (char) => {
              setSelectedCharacter(char);
              await saveDropRecord(char, selectedAbility, selectedLevel as 9 | 10);
              setStep("confirm");
            }}
            onBack={() => setStep("level")}
          />
        )}

        {step === "confirm" && selectedCharacter && (
          <ConfirmModal
            selectedAbility={selectedAbility}
            selectedLevel={selectedLevel as 9 | 10}
            character={selectedCharacter}
            onUse={useImmediately}
            onSave={saveToBackpack}
            onBack={() => setStep("member")}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
