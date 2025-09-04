"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ComparisonModal from "./ComparisonModal";
import CharacterEditModal, { CharacterEditData } from "./CharacterEditModal";
import CharacterAbilities from "./CharacterAbilities";
import CollectionStatus from "./CollectionStatus";
import CharacterBasics from "./CharacterBasics";
import OCRSection from "./OCRSection";

import { runOCR } from "../../../lib/ocrService";
import { updateCharacterAbilities } from "../../../lib/characterService";

interface Character {
  _id: string;
  name: string;
  account: string;
  server: string;
  gender: "男" | "女";
  class: string;
  role: "DPS" | "Tank" | "Healer";
  active: boolean;
  abilities: Record<string, number>;
}

export default function CharacterDetailPage() {
  const { id } = useParams();
  const characterId = Array.isArray(id) ? id[0] : (id as string); // ✅ always a string
  const router = useRouter();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [compareResult, setCompareResult] = useState<any | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showOcrUpload, setShowOcrUpload] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  // ============================
  // Load character
  // ============================
  useEffect(() => {
    if (!characterId) return;
    fetch(`http://localhost:5000/api/characters/${characterId}`)
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
  }, [characterId]);

  // ============================
  // Save edits
  // ============================
  const handleSaveEdit = async (data: CharacterEditData) => {
    if (!characterId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/characters/${characterId}/info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setCharacter(updated);
      setIsEditOpen(false);
      alert("角色信息已更新");
    } catch (err) {
      console.error(err);
      alert("更新失败");
    }
  };

  // ============================
  // Delete character
  // ============================
  const handleDelete = async () => {
    if (!characterId) return;
    if (!confirm("确定要删除这个角色吗？")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/characters/${characterId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      alert("角色已删除");
      router.push("/characters");
    } catch (err) {
      console.error(err);
      alert("删除失败");
    }
  };

  // ============================
  // OCR Handler
  // ============================
  useEffect(() => {
    if (ocrFile && characterId) {
      setOcrProcessing(true);
      runOCR(ocrFile, characterId)
        .then((result) => setCompareResult(result))
        .catch((err) => {
          console.error(err);
          alert("OCR request failed");
        })
        .finally(() => setOcrProcessing(false));
    }
  }, [ocrFile, characterId]);

  const handleConfirmUpdate = async () => {
    if (!compareResult?.toUpdate || !characterId) return;
    const updates: Record<string, number> = {};
    compareResult.toUpdate.forEach((u: any) => {
      updates[u.name] = u.new;
    });
    try {
      const updated = await updateCharacterAbilities(characterId, updates);
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

  return (
    <div style={{ padding: "20px", maxWidth: 1000, margin: "0 auto" }}>
      <h1>角色详情</h1>

      <CharacterBasics
        character={character}
        onEdit={() => setIsEditOpen(true)}
        onDelete={handleDelete}
      />

      {character && (
        <CharacterEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveEdit}
          initialData={{
            server: character.server,
            role: character.role,
            active: character.active,
          }}
        />
      )}

      <h3 style={{ marginTop: 24 }}>技能</h3>
      <CharacterAbilities abilities={character.abilities} />

      <CollectionStatus character={character} />

      <OCRSection
        show={showOcrUpload}
        onToggle={() => setShowOcrUpload(!showOcrUpload)}
        onFileSelected={(file) => setOcrFile(file)}
        processing={ocrProcessing}
        onCancelProcessing={() => setOcrProcessing(false)}
      />

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
