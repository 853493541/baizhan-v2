import type { Character, GroupResult } from "@/utils/solver";

/* ---------------- Group Operations ---------------- */

/** ➕ Add a new empty group */
export const handleAddGroup = (setLocalGroups: any) => {
  setLocalGroups((prev: GroupResult[]) => [
    ...prev,
    { characters: [], missingAbilities: [], violations: [] },
  ]);
};

/** ❌ Remove a group by index */
export const handleRemoveGroup = (setLocalGroups: any, idx: number) => {
  setLocalGroups((prev: GroupResult[]) => prev.filter((_, i) => i !== idx));
};

/* =======================================================================
   🟢 Add Character — merge full ability map (preserve levels)
   ======================================================================= */
export const handleAddCharacter = (
  setLocalGroups: any,
  groupIdx: number,
  char: Character,
  allCharacters: Character[]
) => {
  const fullChar = allCharacters.find((c) => c._id === char._id) || char;

  setLocalGroups((prev: GroupResult[]) => {
    const updated = prev.map((g) => ({
      ...g,
      characters: g.characters.filter((c) => c._id !== fullChar._id),
    }));

    if (updated[groupIdx].characters.length >= 3) return prev;

    updated[groupIdx].characters.push({
      ...fullChar,
      abilities: fullChar.abilities, // ✅ ensure full map is stored
      selectedAbilities: [
        { name: "", level: 0 },
        { name: "", level: 0 },
        { name: "", level: 0 },
      ],
    });

    console.log(
      `[trace][handleAddCharacter] stored full abilities for ${fullChar.name}:`,
      fullChar.abilities
    );

    return updated;
  });
};

/* =======================================================================
   🟢 Replace Character — also inject full ability map
   ======================================================================= */
export const handleReplaceCharacter = (
  setLocalGroups: any,
  groupIdx: number,
  oldCharId: string,
  newChar: Character,
  allCharacters: Character[]
) => {
  const fullChar = allCharacters.find((c) => c._id === newChar._id) || newChar;

  setLocalGroups((prev: GroupResult[]) => {
    const updated = prev.map((g) => ({
      ...g,
      characters: g.characters.filter((c) => c._id !== fullChar._id),
    }));

    const group = updated[groupIdx];
    const i = group.characters.findIndex((c) => c._id === oldCharId);
    if (i !== -1) {
      group.characters[i] = {
        ...fullChar,
        abilities: fullChar.abilities, // ✅ keep full map
        selectedAbilities: [
          { name: "", level: 0 },
          { name: "", level: 0 },
          { name: "", level: 0 },
        ],
      };
    }

    console.log(
      `[trace][handleReplaceCharacter] stored full abilities for ${fullChar.name}:`,
      fullChar.abilities
    );

    return updated;
  });
};

/** 🗑️ Remove a character from a group */
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

/* =======================================================================
   🧠 Ability Change — now correctly detects levels from full map
   ======================================================================= */
export const handleAbilityChange = (
  setLocalGroups: any,
  setAbilityOpenId: any,
  setAbilityPos: any,
  setAbilityCtx: any,
  groupIdx: number,
  charId: string,
  slot: number,
  ability: string,
  fullCharacter?: Character // 🆕 receive full character with levels
) => {
  setLocalGroups((prev: GroupResult[]) => {
    const updated = [...prev];

    updated[groupIdx].characters = updated[groupIdx].characters.map((c) => {
      if (c._id === charId) {
        let level = 0;

        // 1) Prefer levels from the passed-in full character (dropdown had it)
        if (fullCharacter?.abilities) {
          if (Array.isArray(fullCharacter.abilities)) {
            const found = (fullCharacter.abilities as any[]).find(
              (a) => a?.name === ability && typeof a.level === "number"
            );
            level = found ? found.level : 0;
          } else if (typeof fullCharacter.abilities === "object") {
            level = (fullCharacter.abilities as Record<string, number>)[ability] ?? 0;
          }
        }

        // 2) Fallback: try whatever is on the local character state
        if (level === 0 && c.abilities) {
          if (Array.isArray(c.abilities)) {
            const found = (c.abilities as any[]).find(
              (a) => a?.name === ability && typeof a.level === "number"
            );
            level = found ? found.level : 0;
          } else if (typeof c.abilities === "object") {
            level = (c.abilities as Record<string, number>)[ability] ?? 0;
          }
        }

        console.log(
          `[trace][handleAbilityChange] ${c.name} selecting ${ability}, detected level: ${level}`,
          { fromFull: fullCharacter?.abilities, fromLocal: c.abilities }
        );

        // 3) Update the selected slots
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

/* =======================================================================
   💾 Save Changes — keep ability levels when sending to backend
   ======================================================================= */
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
      abilities: Array.isArray(c.selectedAbilities)
        ? c.selectedAbilities.map((a) => ({
            name: a.name || "",
            level: a.level ?? 0,
          }))
        : [
            { name: "", level: 0 },
            { name: "", level: 0 },
            { name: "", level: 0 },
          ],
    })),
    status: g.status || "not_started",
    kills: g.kills || [],
  }));

  console.groupCollapsed(
    "%c[trace][saveChanges] Payload being sent to backend",
    "color:#00b894;font-weight:bold;"
  );
  console.log(JSON.stringify(payload, null, 2));
  console.groupEnd();

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
    console.log("✅ [trace][saveChanges] Success!");
  } catch (err) {
    console.error("❌ Save failed:", err);
    alert("保存失败，请查看控制台日志。");
  }

  setEditing(false);
};
