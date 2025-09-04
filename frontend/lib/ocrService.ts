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
  const lines: string[] = ocrData?.lines ?? [];
  if (!lines.length) return null;

  const parsedAbilities = parseOCRLines(lines);

  const compareRes = await fetch(
    `http://localhost:5000/api/characters/${characterId}/compareAbilities`,
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
  compareResult: any
): Promise<Record<string, number>> {
  if (!compareResult?.toUpdate || !characterId) {
    throw new Error("No updates to confirm");
  }

  const updates: Record<string, number> = {};
  compareResult.toUpdate.forEach((u: any) => {
    updates[u.name] = u.new;
  });

  // ✅ use your existing backend logic
  const updated = await updateCharacterAbilities(characterId, updates);

  return updated.character?.abilities || updates;
}
