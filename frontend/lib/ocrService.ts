import { parseOCRLines } from "../utils/ocrUtils";
import { updateCharacterAbilities } from "./characterService"; // ✅ reuse proven service

// Run OCR and return comparison result
export async function runOCR(file: File, characterId: string) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:8000/ocr", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("OCR request failed");

  const ocrData = await res.json();

  // 🔍 Debug log
  console.log("🔍 Raw OCR result from backend:", ocrData);

  const lines: string[] = ocrData?.lines ?? [];
  if (!lines.length) return null;

  const parsedAbilities = parseOCRLines(lines);

  // ✅ Use the correct backend route
  const compareRes = await fetch(
    `http://localhost:5000/api/characters/${characterId}/compare-abilities`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ abilities: parsedAbilities }),
    }
  );
  if (!compareRes.ok) throw new Error("Compare request failed");

  return compareRes.json();
}

// ✅ Confirm update by reusing characterService
export async function confirmOCRUpdate(
  characterId: string,
  updates: Record<string, number>
): Promise<Record<string, number>> {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("No updates to confirm");
  }

  // 🔍 Debug log
  console.log("📦 Preparing payload for backend:", { abilities: updates });

  // ✅ Always wrap in abilities
  const updated = await updateCharacterAbilities(characterId, {
    abilities: updates,
  });

  return updated.character?.abilities || updates;
}
