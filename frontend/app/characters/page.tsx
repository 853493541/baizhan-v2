"use client";

import { useEffect, useState } from "react";
import CreateCharacterModal from "./CreateCharacterModal";
import CharacterCard from "./CharacterCard";
import { Character } from "@/types/Character"; // ✅ shared type

export default function CharacterStoragePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // ✅ normalize gender from backend to match strict type
  const normalizeGender = (g: string): "男" | "女" => (g === "男" ? "男" : "女");

  const refreshCharacters = () => {
    fetch(`${API_URL}/api/characters`)
      .then((res) => res.json())
      .then((data) => {
        const normalized: Character[] = data.map((c: any) => ({
          ...c,
          gender: normalizeGender(c.gender),
        }));
        setCharacters(normalized);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load characters");
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshCharacters();
  }, []);

  const handleCreate = async (data: any) => {
    try {
      // ✅ Load last owner (default Unknown)
      const lastOwner = localStorage.getItem("lastOwner") || "Unknown";

      const completeData = {
        name: data.name,
        account: String(data.account ?? "").trim(),
        server: data.server || "乾坤一掷",
        gender: normalizeGender(data.gender || "女"), // ✅ enforce strict
        class: data.class || "少林",
        role: data.role,
        active: data.active ?? true,
        owner: data.owner?.trim() || lastOwner, // 🔹 use new owner if typed, else last
      };

      // ✅ Save this owner for future character creation
      localStorage.setItem("lastOwner", completeData.owner);

      const res = await fetch(`${API_URL}/api/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeData),
      });

      if (!res.ok) throw new Error("Failed to create character");

      await res.json();
      refreshCharacters(); // refresh list after creation
    } catch (err) {
      console.error(err);
      alert("Error creating character");
    }
  };

  if (loading) return <p>Loading characters...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Character Storage</h1>

      {/* Character cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {characters.map((char) => (
          <CharacterCard
            key={char._id}
            character={char}
            onUpdated={refreshCharacters} // ✅ pass down
          />
        ))}
      </div>

      {/* Create button + modal */}
      <div style={{ marginTop: "32px" }}>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          + 新建角色
        </button>
      </div>

      <CreateCharacterModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
