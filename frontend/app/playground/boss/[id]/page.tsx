"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "./styles.module.css";
import { bossSolver, Character as SolverCharacter, Ability } from "@/utils/bossSolver";

type Role = "DPS" | "Tank" | "Healer";

interface BossPlan {
  _id: string;
  server: string;
  groupSize?: number;
  boss: string;
  createdAt: string;
}

interface Character {
  _id: string;
  name: string;
  role: Role | string;
  server: string;
  account: string;
  abilities?: Record<string, number> | string[];
}

export default function BossPlanDetail() {
  const params = useParams();
  const id = params?.id as string;

  const [plan, setPlan] = useState<BossPlan | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [allAbilities, setAllAbilities] = useState<string[]>([]);
  const [solverResult, setSolverResult] = useState<any>(null);

  // ✅ Defaults
  const [roles, setRoles] = useState<Role[]>(["DPS", "DPS", "Healer"]);
  const [locked, setLocked] = useState<string[][]>([
    ["帝骖龙翔", "FLEX", "剑飞惊天"],
    ["帝骖龙翔", "FLEX", "剑心通明"],
    ["帝骖龙翔", "FLEX", "云海听弦"],
  ]);
  const [flexible, setFlexible] = useState<string[]>([
    "引燃",
    "黑煞落贪狼",
    "疯狂疾走",
  ]);

  // -------------------------------------------------------------------
  // Fetch boss plan + characters
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/boss-plans/${id}`
        );
        if (!res.ok) throw new Error("❌ Failed to fetch boss plan");
        const data: BossPlan = await res.json();
        console.log("📦 BossPlan fetched:", data);
        setPlan(data);

        const allRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/characters`
        );
        if (allRes.ok) {
          const all = (await allRes.json()) as Character[];
          setCharacters(all.filter((c) => c.server === data.server));
        } else {
          setCharacters([]);
        }
      } catch (e) {
        console.error("❌ Error fetching boss plan or characters:", e);
        setPlan(null);
        setCharacters([]);
      }
    })();
  }, [id]);

  // -------------------------------------------------------------------
  // Load ability list
  useEffect(() => {
    (async () => {
      try {
        const mod = await import(
          "../../../data/boss_skills_collection_reward.json"
        );
        const abilityList: string[] = [];
        Object.values(mod.default as Record<string, string[]>).forEach((arr) => {
          arr.forEach((a) => {
            if (!abilityList.includes(a)) abilityList.push(a);
          });
        });
        setAllAbilities(abilityList.sort());
      } catch (e) {
        console.error("❌ Failed to load abilities:", e);
        setAllAbilities([]);
      }
    })();
  }, []);

  // -------------------------------------------------------------------
  // Solver
  const runBossSolver = () => {
    if (!plan || characters.length === 0) {
      setSolverResult({ error: "❌ 没有可用角色" });
      return;
    }

    const safeGroupSize = plan.groupSize ?? 3;
    const safeGroupCount = Math.floor(characters.length / safeGroupSize);

    console.log("⚙️ Running solver with:", {
      safeGroupSize,
      safeGroupCount,
      charactersCount: characters.length,
    });

    // 🔄 Map to solver characters with ability objects
    const mapped: SolverCharacter[] = characters.map((c) => {
      let abilityArray: Ability[] = [];

      if (Array.isArray(c.abilities)) {
        abilityArray = c.abilities.map((a) => ({
          name: a,
          level: 9, // default if no level
        }));
      } else if (c.abilities && typeof c.abilities === "object") {
        abilityArray = Object.entries(c.abilities).map(([name, level]) => ({
          name,
          level: Number(level),
        }));
      }

      return {
        _id: c._id,
        name: c.name,
        role: c.role as Role,
        abilities: abilityArray,
        account: c.account,
      };
    });

    const result = bossSolver({
      characters: mapped,
      groupSize: safeGroupSize,
      groupCount: safeGroupCount,
      flexRequired: flexible,
      locked: locked,
      roles: roles,
    });

    console.log("🧩 Solver Result:", result);
    setSolverResult(result);
  };

  // -------------------------------------------------------------------
  if (!plan) return <p>加载中...</p>;

  return (
    <div className={styles.container}>
      <h2>Boss Plan Detail</h2>
      <p>
        <b>Boss:</b> {plan.boss}
      </p>
      <p>
        <b>服务器:</b> {plan.server}
      </p>
      <p>
        <b>分组人数:</b> {plan.groupSize ?? "未定义 (临时默认 3)"}
      </p>
      <p>
        <b>创建时间:</b> {new Date(plan.createdAt).toLocaleString()}
      </p>

      <h3>角色必带技能 (Locked)</h3>
      {locked.map((row, idx) => (
        <div key={idx} className={styles.lockedRow}>
          <label>
            角色 {idx + 1}{" "}
            <select
              value={roles[idx]}
              onChange={(e) => {
                const copy = [...roles];
                copy[idx] = e.target.value as Role;
                setRoles(copy);
              }}
            >
              <option value="DPS">DPS</option>
              <option value="Tank">Tank</option>
              <option value="Healer">Healer</option>
            </select>
          </label>
          {row.map((ability, j) => (
            <select
              key={j}
              value={ability}
              onChange={(e) => {
                const copy = [...locked];
                copy[idx][j] = e.target.value;
                setLocked(copy);
              }}
            >
              <option value="帝骖龙翔">帝骖龙翔</option>
              <option value="FLEX">FLEX</option>
              {allAbilities.map((a) => (
                <option key={`${idx}-${j}-${a}`} value={a}>
                  {a}
                </option>
              ))}
            </select>
          ))}
        </div>
      ))}

      <h3>团队必备技能 (Flexible)</h3>
      <div className={styles.flexRow}>
        {flexible.map((a, idx) => (
          <select
            key={idx}
            value={a}
            onChange={(e) => {
              const copy = [...flexible];
              copy[idx] = e.target.value;
              setFlexible(copy);
            }}
          >
            {allAbilities.map((ab) => (
              <option key={`${idx}-${ab}`} value={ab}>
                {ab}
              </option>
            ))}
          </select>
        ))}
      </div>

      <button onClick={runBossSolver} className={styles.button}>
        运行 BossSolver
      </button>

      <h3>后端提供的角色</h3>
      <p>已获取角色数量: {characters.length}</p>

      <h3>Solver 结果</h3>
      {!solverResult ? (
        <p>⚠️ 尚未运行 Solver</p>
      ) : !solverResult.success ? (
        <pre>{JSON.stringify(solverResult.errors, null, 2)}</pre>
      ) : (
        <div>
          {solverResult.groups.map((g: any) => (
            <div key={g.index} className={styles.groupBox}>
              <h4>小组 {g.index}</h4>
              <ul className={styles.charList}>
                {g.characters.map((c: any) => (
                  <li
                    key={c._id}
                    className={`${styles.charItem} ${
                      styles[c.role.toLowerCase()]
                    }`}
                  >
                    <span className={styles.charName}>
                      {c.name} （{c.role}）
                    </span>
                    ：
                    {c.usedAbilities.length > 0
                      ? c.usedAbilities
                          .map((a: Ability) => `${a.name}(${a.level})`)
                          .join(" ")
                      : "无"}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
