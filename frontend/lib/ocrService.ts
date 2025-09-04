import { parseOCRLines } from "../utils/ocrUtils";

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
