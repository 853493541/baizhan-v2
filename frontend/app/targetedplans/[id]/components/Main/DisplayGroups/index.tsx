import styles from "./styles.module.css";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

// ✅ Hardcoded mains
const MAIN_CHARACTERS = new Set([
  "剑心猫猫糕",
  "东海甜妹",
  "饲猫大桔",
  "五溪",
  "唐宵风",
  "程老黑",
]);

interface Props {
  title: string;
  groups: { g: GroupResult & { status?: "not_started" | "started" | "finished" }; i: number }[];
  setActiveIdx: (i: number | null) => void;
  checkGroupQA: (
    group: GroupResult,
    conflictLevel: number,
    checkedAbilities: AbilityCheck[]
  ) => string[];
  conflictLevel: number;
  checkedAbilities: AbilityCheck[];
}

export default function DisplayGroups({
  title,
  groups,
  setActiveIdx,
  checkGroupQA,
  conflictLevel,
  checkedAbilities,
}: Props) {
  // 🧩 [main] Debug: Component mount + props
  console.log("[main][DisplayGroups] 🧩 Render start:", {
    title,
    groupCount: groups?.length,
    hasCheckGroupQA: typeof checkGroupQA === "function",
    conflictLevel,
    abilitiesCount: checkedAbilities?.length,
  });

  if (!groups || groups.length === 0) {
    console.warn("[main][DisplayGroups] ⚠️ No groups received — nothing to render");
    return (
      <div className={styles.empty}>
        <h4>{title}</h4>
        <p>⚠️ 暂无小组数据 (DisplayGroups)</p>
      </div>
    );
  }

  const renderStatus = (status?: string) => {
    const s = status || "not_started";
    const dotClass =
      s === "finished"
        ? styles.finished
        : s === "started"
        ? styles.started
        : styles.notStarted;
    const text =
      s === "finished" ? "完成" : s === "started" ? "进行中" : "未开始";

    return (
      <span className={`${styles.statusDot} ${dotClass}`}>
        ● <span className={styles.statusText}>{text}</span>
      </span>
    );
  };

  return (
    <>
      <h3 className={styles.sectionSubtitle}>{title}</h3>
      <div className={styles.groupsGrid}>
        {groups.map(({ g, i }, groupIdx) => {
          // 🧩 Debug each group
          console.log("[main][DisplayGroups] 🔍 Rendering group:", {
            groupIndex: i,
            charactersCount: g.characters?.length,
            firstCharacter: g.characters?.[0],
            status: g.status,
          });

          // ✅ Flatten nested structure
          const flatChars = (g.characters || []).map((cRaw: any) =>
            cRaw.characterId ? { ...cRaw.characterId, ...cRaw } : cRaw
          );

          const qaWarnings = checkGroupQA(g, conflictLevel, checkedAbilities);

          return (
            <div
              key={`group-${i}`}
              className={styles.groupCard}
              onClick={() => {
                console.log("[main][DisplayGroups] 🖱 Clicked group", i);
                setActiveIdx(i);
              }}
            >
              <div className={styles.groupHeader}>
                <h4 className={styles.groupTitle}>组 {i + 1}</h4>
                {renderStatus(g.status)}
              </div>

              <ul className={styles.memberList}>
                {flatChars.length === 0 && (
                  <li className={styles.memberItem} style={{ color: "#888" }}>
                    （暂无成员）
                  </li>
                )}
                {flatChars.map((c, idx) => (
                  <li
                    key={`${c._id || c.name || "char"}-${i}-${idx}`}
                    className={`${styles.memberItem} ${
                      c.role === "Tank"
                        ? styles.tank
                        : c.role === "Healer"
                        ? styles.healer
                        : styles.dps
                    }`}
                  >
                    {MAIN_CHARACTERS.has(c.name) ? "★ " : ""}
                    {c.name || "(未命名)"}
                  </li>
                ))}
              </ul>

              {qaWarnings.length > 0 && (
                <div className={styles.groupViolation}>
                  {qaWarnings.map((w, idx) => (
                    <p key={`warn-${i}-${idx}`}>⚠️ {w}</p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
