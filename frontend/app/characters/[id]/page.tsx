"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ComparisonModal from "./ComparisonModal"; // adjust import path if needed

interface Character {
  _id: string;
  characterId: string;
  account: string;
  server: string;
  gender: "male" | "female"; // enforce type
  class: string;
  abilities: Record<string, number>;
}

export default function CharacterDetailPage() {
  const { id } = useParams();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLines, setOcrLines] = useState<string[] | null>(null);
  const [compareResult, setCompareResult] = useState<any | null>(null);

  // ============================
  // Load character
  // ============================
  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5000/api/characters/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCharacter(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load character");
        setLoading(false);
      });
  }, [id]);

  // ============================
  // Parser: OCR lines -> { abilityName: level }
  // ============================
  const parseOCRLines = (lines: string[]): Record<string, number> => {
    if (!lines) return {};

    const chineseLevelMap: Record<string, number> = {
      十重: 10,
      九重: 9,
      八重: 8,
      七重: 7,
      六重: 6,
      五重: 5,
      四重: 4,
      三重: 3,
      二重: 2,
      一重: 1,
    };

    let currentLevel: number | null = null;
    const parsed: Record<string, number> = {};

    for (const line of lines) {
      const text = line.trim();
      if (!text) continue;

      if (chineseLevelMap[text] !== undefined) {
        currentLevel = chineseLevelMap[text];
        continue;
      }

      // keep all OCR results, even if not in DB
      if (currentLevel) {
        parsed[text] = currentLevel;
      }
    }

    return parsed;
  };

  // ============================
  // OCR + Compare
  // ============================
  const handleOCRPreview = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/ocr", {
        method: "POST",
        body: formData,
      });
      const ocrData = await res.json();
      const lines = ocrData?.lines ?? [];
      setOcrLines(lines);

      // 🔹 Immediately compare with DB
      if (lines.length && id) {
        const parsedAbilities = parseOCRLines(lines);
        const compareRes = await fetch(
          `http://localhost:5000/api/characters/${id}/compareAbilities`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ abilities: parsedAbilities }),
          }
        );
        const result = await compareRes.json();
        console.log("Compare API result:", result);
        setCompareResult(result);
      }
    } catch (err) {
      console.error(err);
      alert("OCR request failed");
    }
  };

  useEffect(() => {
    if (ocrFile) {
      handleOCRPreview(ocrFile);
    }
  }, [ocrFile]);

  // ============================
  // Confirm update
  // ============================
  const handleConfirmUpdate = async () => {
    if (!compareResult?.toUpdate || !id) return;

    const updates: Record<string, number> = {};
    compareResult.toUpdate.forEach((u: any) => {
      updates[u.name] = u.new;
    });

    try {
      const res = await fetch(`http://localhost:5000/api/characters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ abilities: updates }),
      });
      const updated = await res.json();
      setCharacter(updated.character || updated);
      setCompareResult(null);
      alert("Character updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  // ============================
  // Render
  // ============================
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!character) return <p>No character found</p>;

  // pretty print gender
  const genderLabel =
    character.gender === "male"
      ? "Male ♂"
      : character.gender === "female"
      ? "Female ♀"
      : `Invalid (${character.gender})`;

  return (
    <div style={{ padding: "20px", maxWidth: 1000, margin: "0 auto" }}>
      <h1>Character Detail</h1>
      <h2>{character.characterId}</h2>
      <p>Account: {character.account}</p>
      <p>Server: {character.server}</p>
      <p>Gender: {genderLabel}</p>
      <p>Class: {character.class}</p>

      <h3>Abilities</h3>
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 12,
          maxHeight: 240,
          overflow: "auto",
        }}
      >
        <ul style={{ margin: 0 }}>
          {Object.entries(character.abilities).map(([name, value]) => (
            <li key={name}>
              {name}: {value}
            </li>
          ))}
        </ul>
      </div>

      <h3 style={{ marginTop: 24 }}>Upload OCR Screenshot</h3>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
      />

      {ocrLines && (
        <div style={{ marginTop: 20 }}>
          <h3>OCR Result (Preview)</h3>
          <pre
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
              maxHeight: 300,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              background: "#fafafa",
            }}
          >
            {ocrLines.join("\n")}
          </pre>
        </div>
      )}

      {compareResult && (
        <ComparisonModal
          toUpdate={compareResult.toUpdate || []}
          ocrOnly={compareResult.ocrOnly || []}
          dbOnly={compareResult.dbOnly || []}
          onConfirm={handleConfirmUpdate}
          onClose={() => setCompareResult(null)}
        />
      )}
    </div>
  );
}
