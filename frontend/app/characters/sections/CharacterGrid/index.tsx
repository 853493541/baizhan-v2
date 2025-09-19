"use client";

import CharacterCard from "@/app/components/characters/CharacterCard";
import { Character } from "@/types/Character";
import styles from "./styles.module.css";

interface Props {
  characters: Character[];
  onUpdated: () => void;
}

export default function CharacterGrid({ characters, onUpdated }: Props) {
  return (
    <div className={styles.cardGrid}>
      {characters.map((char) => (
        <CharacterCard
          key={char._id}
          character={char}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}
