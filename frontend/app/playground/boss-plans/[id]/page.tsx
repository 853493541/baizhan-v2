"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import specialBosses from "../../../data/special_boss.json";
import styles from "../../styles.module.css";

interface Character {
  _id: string;
  name: string;
  account: string;
  role: string;
}

interface BossPlan {
  _id: string;
  server: string;
  groupSize: number;
  boss: string;
  createdAt: string;
}

export default function BossPlanDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [plan, setPlan] = useState<BossPlan | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchPlan(id);
  }, [id]);

  const fetchPlan = async (planId: string) => {
    try {
      // 1. Fetch boss plan
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/boss-plans/${planId}`
      );
      if (!res.ok) throw new Error("Failed to fetch boss plan");
      const data: BossPlan = await res.json();
      setPlan(data);

      // 2. Fetch characters by server
      const charRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters?server=${data.server}`
      );
      const chars = charRes.ok ? await charRes.json() : [];
      setCharacters(chars);
    } catch (err) {
      console.error("❌ Error fetching boss plan detail:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.container}>Loading...</div>;
  if (!plan) return <div className={styles.container}>未找到 Boss Plan</div>;

  const bossSkills =
    plan.boss && (specialBosses as Record<string, string[]>)[plan.boss]
      ? (specialBosses as Record<string, string[]>)[plan.boss]
      : [];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Boss Plan Detail</h2>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>{plan.boss}</h3>
        <p>服务器: {plan.server}</p>
        <p>分组人数: {plan.groupSize}</p>
        <p>创建时间: {new Date(plan.createdAt).toLocaleString()}</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.subtitle}>Boss 技能</h3>
        {bossSkills.length === 0 ? (
          <p className={styles.empty}>无技能数据</p>
        ) : (
          <ul>
            {bossSkills.map((skill, idx) => (
              <li key={idx}>{skill}</li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.subtitle}>角色 (服务器 {plan.server})</h3>
        {characters.length === 0 ? (
          <p className={styles.empty}>暂无角色</p>
        ) : (
          <ul>
            {characters.map((c) => (
              <li key={c._id}>
                {c.name} ({c.role}) - 账号 {c.account}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
