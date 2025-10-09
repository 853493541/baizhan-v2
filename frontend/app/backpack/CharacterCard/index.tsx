import React from "react";
import styles from "./styles.module.css";
import BackpackWindow from "./BackpackWindow/Index";

interface Character {
  _id: string;
  name: string;
  role: string;
  class: string;
  server: string;
  abilities?: Record<string, number>;
  storage?: any[];
}

const getClassIcon = (cls: string) => `/icons/class_icons/${cls}.png`;

interface Props {
  char: Character;
  API_URL: string;
}

export default function CharacterCard({ char, API_URL }: Props) {
  return (
    <div className={`${styles.card} ${styles[char.role?.toLowerCase()]}`}>
      {/* === Header === */}
      <div className={styles.headerRow}>
        <div className={styles.nameBlock}>
          <div className={styles.name}>
            <img
              src={getClassIcon(char.class)}
              alt={char.class}
              className={styles.classIcon}
            />
            {char.name}
          </div>
        </div>
        <div className={styles.server}>{char.server}</div>
      </div>

      {/* === Backpack Section === */}
      <BackpackWindow char={char} API_URL={API_URL} />
    </div>
  );
}
