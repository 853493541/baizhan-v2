import type { Character, GroupResult } from "@/utils/solver";

/* ---------------- Group Operations ---------------- */
export const handleAddGroup = (setLocalGroups: any) => {
  setLocalGroups((prev: GroupResult[]) => [
    ...prev,
    { characters: [], missingAbilities: [], violations: [] },
  ]);
};

export const handleRemoveGroup = (setLocalGroups: any, idx: number) => {
  setLocalGroups((prev: GroupResult[]) => prev.filter((_, i) => i !== idx));
};

export const handleAddCharacter = (
  setLocalGroups: any,
  groupIdx: number,
  char: Character
) => {
  setLocalGroups((prev: GroupResult[]) => {
    const updated = prev.map((g) => ({
      ...g,
      characters: g.characters.filter((c) => c._id !== char._id),
    }));
    if (updated[groupIdx].characters.length >= 3) return prev;
    updated[groupIdx].characters.push({ ...char, abilities: ["", "", ""] });
    return updated;
  });
};

export const handleReplaceCharacter = (
  setLocalGroups: any,
  groupIdx: number,
  oldCharId: string,
  newChar: Character
) => {
  setLocalGroups((prev: GroupResult[]) => {
    const updated = prev.map((g) => ({
      ...g,
      characters: g.characters.filter((c) => c._id !== newChar._id),
    }));
    const group = updated[groupIdx];
    const i = group.characters.findIndex((c) => c._id === oldCharId);
    if (i !== -1) group.characters[i] = { ...newChar, abilities: ["", "", ""] };
    return updated;
  });
};

export const handleRemoveCharacter = (
  setLocalGroups: any,
  groupIdx: number,
  charId: string
) => {
  setLocalGroups((prev: GroupResult[]) => {
    const updated = [...prev];
    updated[groupIdx].characters = updated[groupIdx].characters.filter(
      (c) => c._id !== charId
    );
    return updated;
  });
};

/* ---------------- Ability Operations ---------------- */
export const handleAbilityChange = (
  setLocalGroups: any,
  setAbilityOpenId: any,
  setAbilityPos: any,
  setAbilityCtx: any,
  groupIdx: number,
  charId: string,
  slot: number,
  ability: string
) => {
  setLocalGroups((prev: GroupResult[]) => {
    const updated = [...prev];
    updated[groupIdx].characters = updated[groupIdx].characters.map((c) => {
      if (c._id === charId) {
        const arr = [...(c.abilities || ["", "", ""])];
        const dup = arr.findIndex((a, i) => a === ability && i !== slot);
        if (dup !== -1) arr[dup] = "";
        arr[slot] = ability;
        return { ...c, abilities: arr };
      }
      return c;
    });
    return updated;
  });
  setAbilityOpenId(null);
  setAbilityPos(null);
  setAbilityCtx(null);
};

/* ---------------- Save ---------------- */
export const saveChanges = async (
  scheduleId: string,
  localGroups: GroupResult[],
  setGroups: any,
  setEditing: any
) => {
  setGroups(localGroups);
  const payload = localGroups.map((g, idx) => ({
    index: idx + 1,
    characters: g.characters.map((c) => ({
      characterId: c._id || c.characterId || null,
      abilities: Array.isArray(c.abilities) ? c.abilities : ["", "", ""],
    })),
    status: g.status || "not_started",
    kills: g.kills || [],
  }));

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/targeted-plans/${scheduleId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: payload }),
      }
    );
    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    // alert("✅ 已保存修改！");
  } catch (err) {
    console.error("❌ Save failed:", err);
    alert("保存失败，请查看控制台日志。");
  }
  setEditing(false);
};
