"use client";

import { Character } from "@/types/Character";
import styles from "./styles.module.css";

// ✅ Use the ONE canonical CharacterCard
import CharacterCard from "@/app/characters/components/CharacterCard";

/* 🔥 Main characters */
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "五溪",
  "东海甜妹",
  "饲猫大桔",
  "唐宵风",
]);

interface Props {
  characters: Character[];
  onUpdated: () => void;
}

export default function Cards({ characters, onUpdated }: Props) {
  const mainCharacters = characters.filter((c) =>
    MAIN_CHARACTERS.has(c.name)
  );

  const otherCharacters = characters.filter(
    (c) => !MAIN_CHARACTERS.has(c.name)
  );

  return (
    <div className={styles.cardGrid}>
      {/* 🔥 Main characters first */}
      {mainCharacters.map((char) => (
        <CharacterCard
          key={char._id}
          char={char}
          API_URL={process.env.NEXT_PUBLIC_API_URL || ""}
          onCharacterUpdate={onUpdated}
        />
      ))}

      {/* ───────── Divider ───────── */}
      {/* {mainCharacters.length > 0 && otherCharacters.length > 0 && (
        <div className={styles.divider} />
      )} */}

      {/* Others */}
      {otherCharacters.map((char) => (
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
