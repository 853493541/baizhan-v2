"use client";

import { useEffect, useState } from "react";
import CreateCharacterModal from "./CreateCharacterModal";

interface Character {
  _id: string;
  name: string;
  account: string;
  server: string;
  gender: string;
  class: string;
  role: string;
  active: boolean;
}

export default function CharacterStoragePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/characters")
      .then((res) => res.json())
      .then((data) => {
        setCharacters(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load characters");
        setLoading(false);
      });
  }, []);

  const handleCreate = async (data: any) => {
    try {
      const completeData = {
        name: data.name,
        account: String(data.account ?? "").trim(),
        server: data.server || "乾坤一掷",
        gender: data.gender || "女",
        class: data.class || "少林",
        role: data.role,
        active: data.active ?? true,
      };

      const res = await fetch("http://localhost:5000/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeData),
      });

      if (!res.ok) throw new Error("Failed to create character");

      const newChar = await res.json();
      setCharacters([...characters, newChar]);
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
          <div
            key={char._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "12px",
              width: "220px",
              cursor: "pointer",
            }}
            onClick={() => (window.location.href = `/characters/${char._id}`)}
          >
            <h3>{char.name}</h3>
            <p>Account: {char.account}</p>
            <p>Server: {char.server}</p>
            <p>Gender: {char.gender}</p>
            <p>Class: {char.class}</p>
            <p>Role: {char.role}</p>
            <p>Active: {char.active ? "是" : "否"}</p>
          </div>
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
