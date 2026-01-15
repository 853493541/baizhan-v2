"use client";

import { Character } from "@/types/Character";
import styles from "./styles.module.css";

// ✅ Use the ONE canonical CharacterCard
import CharacterCard from "@/app/characters/components/CharacterCard";

interface Props {
  characters: Character[];
  onUpdated: () => void;
}

export default function Cards({ characters, onUpdated }: Props) {
  return (
    <div className={styles.cardGrid}>
      {characters.map((char) => (
        <CharacterCard
          key={char._id}
          char={char}
          API_URL={process.env.NEXT_PUBLIC_API_URL || ""}
          onCharacterUpdate={onUpdated}
        />
      ))}
    </div>
  );
}
