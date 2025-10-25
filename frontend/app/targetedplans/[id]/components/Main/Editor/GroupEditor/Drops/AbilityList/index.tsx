"use client";
import Image from "next/image";
import styles from "./styles.module.css";

const COMMON_ABILITIES = [
  "流霞点绛",
  "霞袖回春",
  "云海听弦",
  "无我无剑式",
  "三环套月式",
  "月流斩",
  "退山凝",
  "电挈昆吾",
  "震岳势",
];

export default function AbilityList({
  abilities,
  selectedAbility,
  setSelectedAbility,
  search,
  setSearch,
}: {
  abilities: string[];
  selectedAbility: string;
  setSelectedAbility: (a: string) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  const availableNames = new Set(abilities);

  // ✅ Common abilities displayed on top
  const commonList = COMMON_ABILITIES.filter((a) => availableNames.has(a));

  // ✅ Remove common ones from search list
  const filteredList = abilities.filter((a) => !COMMON_ABILITIES.includes(a));

  // ✅ Apply search filtering
  const visibleList = filteredList.filter((a) =>
    a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.leftColumn}>
      {/* === 🟩 Section: 常见掉落 === */}
      {commonList.length > 0 && (
        <>
          <div className={styles.sectionDivider}>常见掉落</div>
          <div className={styles.commonList}>
            {commonList.map((a) => (
              <button
                key={a}
                onClick={() => setSelectedAbility(a)}
                className={`${styles.abilityCard} ${
                  selectedAbility === a ? styles.active : ""
                }`}
              >
                <Image
                  src={`/icons/${a}.png`}
                  alt={a}
                  width={28}
                  height={28}
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                  className={styles.icon}
                />
                <span className={styles.abilityName}>{a}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* === 🟦 Section: 搜索技能 === */}
      <div className={styles.sectionDivider}>搜索技能</div>

      <div className={styles.searchArea}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="输入技能名..."
          className={styles.searchInput}
        />

        <div className={styles.list}>
          {visibleList.map((a) => (
            <button
              key={a}
              onClick={() => setSelectedAbility(a)}
              className={`${styles.abilityCard} ${
                selectedAbility === a ? styles.active : ""
              }`}
            >
              <Image
                src={`/icons/${a}.png`}
                alt={a}
                width={28}
                height={28}
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
                className={styles.icon}
              />
              <span className={styles.abilityName}>{a}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
