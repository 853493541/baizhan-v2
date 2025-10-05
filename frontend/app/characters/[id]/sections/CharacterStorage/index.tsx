"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.css";

interface StoredItem {
  ability: string;
  level: number;
  sourceBoss?: string;
  receivedAt: string;
  used: boolean;
}

interface Props {
  characterId: string;
}

export default function CharacterStorage({ characterId }: Props) {
  const [storage, setStorage] = useState<StoredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // 🧭 Fetch storage
  useEffect(() => {
    if (!characterId) return;
    fetch(`${API_URL}/api/characters/${characterId}/storage`)
      .then((res) => res.json())
      .then((data) => {
        setStorage(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("无法加载仓库数据");
        setLoading(false);
      });
  }, [characterId, API_URL]);

  const handleUse = async (item: StoredItem) => {
    if (!confirm(`确定要使用 ${item.ability}${item.level}重 吗？`)) return;
    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}/storage/use`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ability: item.ability, level: item.level }),
      });
      if (!res.ok) throw new Error("使用失败");
      alert(`✅ 已使用 ${item.ability}${item.level}重`);
      // Refresh after using
      setStorage((prev) =>
        prev.map((s) =>
          s.ability === item.ability && !s.used ? { ...s, used: true } : s
        )
      );
    } catch (err) {
      console.error("❌ useStoredAbility error:", err);
      alert("使用失败");
    }
  };

  if (loading) return <p>加载中...</p>;
  if (error) return <p>{error}</p>;
  if (!storage.length) return <p>仓库为空</p>;

  return (
    <div className={styles.card}>
      <h2 className={styles.sectionTitle}>角色仓库</h2>
      <table className={styles.storageTable}>
        <thead>
          <tr>
            <th>技能</th>
            <th>等级</th>
            <th>来源首领</th>
            <th>获得时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {storage.map((item, idx) => (
            <tr key={idx}>
              <td>{item.ability}</td>
              <td>{item.level}重</td>
              <td>{item.sourceBoss || "-"}</td>
              <td>{new Date(item.receivedAt).toLocaleString()}</td>
              <td>
                {item.used ? (
                  <span className={styles.usedTag}>已使用</span>
                ) : (
                  <span className={styles.savedTag}>未使用</span>
                )}
              </td>
              <td>
                {!item.used && (
                  <button
                    onClick={() => handleUse(item)}
                    className={styles.useBtn}
                  >
                    使用
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
