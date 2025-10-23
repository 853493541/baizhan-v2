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

/* 🟢 Add Character — keeps full ability map, adds empty selectedAbilities */
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

    updated[groupIdx].characters.push({
      ...char,
      selectedAbilities: [
        { name: "", level: 0 },
        { name: "", level: 0 },
        { name: "", level: 0 },
      ],
    });
    return updated;
  });
};

/* 🟢 Replace Character — keeps full ability map, resets selectedAbilities */
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
    if (i !== -1) {
      group.characters[i] = {
        ...newChar,
        selectedAbilities: [
          { name: "", level: 0 },
          { name: "", level: 0 },
          { name: "", level: 0 },
        ],
      };
    }
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
/**
 * Updates one of the three selected abilities for a character.
 * Also copies the real level from the full abilities map if available.
 */
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
        // Get the real level from the full ability map if available
        const level =
          typeof c.abilities === "object" && !Array.isArray(c.abilities)
            ? c.abilities[ability] || 0
            : 0;

        // Clone or initialize selectedAbilities
        const arr = [
          ...(c.selectedAbilities || [
            { name: "", level: 0 },
            { name: "", level: 0 },
            { name: "", level: 0 },
          ]),
        ];

        // Prevent duplicate selection
        const dup = arr.findIndex((a, i) => a.name === ability && i !== slot);
        if (dup !== -1) arr[dup] = { name: "", level: 0 };

        // Set the new ability and level
        arr[slot] = { name: ability, level };

        return { ...c, selectedAbilities: arr };
      }
      return c;
    });

    return updated;
  });

  // Close dropdowns
  setAbilityOpenId(null);
  setAbilityPos(null);
  setAbilityCtx(null);
};

/* ---------------- Save ---------------- */
/**
 * Saves all groups to backend.
 * Converts selectedAbilities into a simplified payload:
 * [
 *   { characterId: "...", abilities: ["斗转金移", "漾剑式", "疯狂疾走"] }
 * ]
 */
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
      // Only send names (backend can still look up levels if needed)
      abilities: Array.isArray(c.selectedAbilities)
        ? c.selectedAbilities.map((a) => a.name || "")
        : ["", "", ""],
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
  } catch (err) {
    console.error("❌ Save failed:", err);
    alert("保存失败，请查看控制台日志。");
  }

  setEditing(false);
};
