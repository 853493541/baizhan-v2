"use client";

import { useEffect, useState } from "react";
import CreateCharacterModal from "./CreateCharacterModal";
import CharacterCard from "./CharacterCard";
import { Character } from "@/types/Character";
import styles from "./page.module.css"; // ✅ CSS module
import { normalizeGender } from "@/utils/normalize"; // 🔹 optional util

export default function CharacterStoragePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
        setError("角色加载失败");
        setLoading(false);
      });
  };

  useEffect(() => {
    refreshCharacters();
  }, []);

  const handleCreate = async (data: any) => {
    try {
      const lastOwner = localStorage.getItem("lastOwner") || "Unknown";

      const completeData = {
        name: data.name,
        account: String(data.account ?? "").trim(),
        server: data.server || "乾坤一掷",
        gender: normalizeGender(data.gender || "女"),
        class: data.class || "少林",
        role: data.role,
        active: data.active ?? true,
        owner: data.owner?.trim() || lastOwner,
      };

      localStorage.setItem("lastOwner", completeData.owner);

      const res = await fetch(`${API_URL}/api/characters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeData),
      });

      if (!res.ok) throw new Error("Failed to create character");

      await res.json();
      refreshCharacters();
    } catch (err) {
      console.error(err);
      alert("创建角色时出错");
    }
  };

  if (loading) return <p className={styles.message}>角色加载中...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>角色仓库</h1>

      <div className={styles.cardGrid}>
        {characters.map((char) => (
          <CharacterCard
            key={char._id}
            character={char}
            onUpdated={refreshCharacters}
          />
        ))}
      </div>

      <div className={styles.createButtonWrapper}>
        <button
          onClick={() => setModalOpen(true)}
          className={styles.createButton}
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
