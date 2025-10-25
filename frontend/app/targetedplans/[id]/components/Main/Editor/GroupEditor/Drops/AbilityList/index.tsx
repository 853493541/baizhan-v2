"use client";
import Image from "next/image";
import styles from "./styles.module.css";

export default function AbilityList({
  abilities,
  selectedAbility,
  setSelectedAbility,
  search,
  setSearch,
}: any) {
  return (
    <div className={styles.leftColumn}>
      <h4>技能</h4>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索技能..."
        className={styles.search}
      />
      <div className={styles.list}>
        {abilities.map((a: string) => (
          <button
            key={a}
            onClick={() => setSelectedAbility(a)}
            className={`${styles.item} ${selectedAbility === a ? styles.active : ""}`}
          >
            <Image src={`/icons/${a}.png`} alt={a} width={20} height={20} />
            <span>{a.slice(0, 2)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
