import { parseOCRLines } from "../utils/ocrUtils";
import { updateCharacterAbilities } from "./characterService";

// ✅ Base URLs from env (fallback empty so fetch throws if missing)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const OCR_URL = process.env.NEXT_PUBLIC_OCR_URL || "";
// console.log("🌍 OCR_URL in frontend:", OCR_URL);


/**
 * Run OCR on uploaded image and compare abilities
 */
export async function runOCR(file: File, characterId: string) {
  const formData = new FormData();
  formData.append("file", file);

  // --- Step 1: OCR service (FastAPI)
  console.log("🌍 OCR_URL in frontend:", OCR_URL);
  const res = await fetch(`${OCR_URL}/ocr/`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`OCR request failed (${res.status})`);
  }

  const ocrData = await res.json();
  console.log("🔍 Raw OCR result from backend:", ocrData);

  const lines: string[] = ocrData?.lines ?? [];
  if (!lines.length) return null;

  const parsedAbilities = parseOCRLines(lines);

  // --- Step 2: Compare abilities (Express)
  const compareRes = await fetch(
    `${API_URL}/api/characters/${characterId}/compare-abilities`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ abilities: parsedAbilities }),
    }
  );
  if (!compareRes.ok) {
    throw new Error(`Compare request failed (${compareRes.status})`);
  }

  return compareRes.json();
}

/**
 * Confirm OCR updates by persisting them to backend
 */
export async function confirmOCRUpdate(
  characterId: string,
  updates: Record<string, number>
): Promise<Record<string, number>> {
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error("No updates to confirm");
  }

  console.log("📦 Preparing payload for backend:", { abilities: updates });

  const updated = await updateCharacterAbilities(characterId, {
    abilities: updates,
  });

  return updated.character?.abilities || updates;
}
