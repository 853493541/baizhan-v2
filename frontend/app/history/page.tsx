"use client";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";

interface HistoryItem {
  _id: string;
  characterName: string;
  abilityName: string;
  beforeLevel: number;
  afterLevel: number;
  updatedAt: string;
}

export default function AbilityHistoryPage() {
  const [data, setData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [filterAbility, setFilterAbility] = useState("");
  const [limit, setLimit] = useState(200);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/characters/abilities/history`);
      if (filterName.trim()) url.searchParams.set("name", filterName.trim());
      if (filterAbility.trim()) url.searchParams.set("ability", filterAbility.trim());
      url.searchParams.set("limit", limit.toString());

      const res = await fetch(url.toString());
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("❌ 获取技能记录失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 撤回技能更新（调用后端 revert）
  const handleRevert = async (id: string, item: HistoryItem) => {
    const confirmMsg = `确认将 ${item.characterName} 的 ${item.abilityName} 撤回到 ${item.beforeLevel}重 吗？`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters/abilities/history/${id}/revert`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("撤回失败");

      console.log(`🌀 撤回成功：${item.characterName} - ${item.abilityName} → ${item.beforeLevel}重`);
      await fetchHistory();
    } catch (err) {
      alert("❌ 撤回失败");
      console.error("❌ 撤回失败:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterName, filterAbility, limit]);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>技能更新记录</h2>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="按角色名筛选…"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="按技能名筛选…"
          value={filterAbility}
          onChange={(e) => setFilterAbility(e.target.value)}
          className={styles.input}
        />
        <select
          className={styles.select}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          <option value={50}>显示 50 条</option>
          <option value={100}>显示 100 条</option>
          <option value={200}>显示 200 条</option>
          <option value={500}>显示 500 条</option>
        </select>
        <button onClick={fetchHistory} className={styles.refreshBtn}>
          刷新
        </button>
      </div>

      {loading ? (
        <p>加载中…</p>
      ) : data.length === 0 ? (
        <p>暂无记录。</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>时间</th>
              <th>角色</th>
              <th>技能</th>
              <th>变化</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={i}>
                <td>{new Date(item.updatedAt).toLocaleString("zh-CN")}</td>
                <td>{item.characterName}</td>
                <td>{item.abilityName}</td>
                <td>{`${item.beforeLevel}重 → ${item.afterLevel}重`}</td>
                <td>
                  <button
                    className={styles.revertBtn}
                    onClick={() => handleRevert(item._id, item)}
                  >
                    撤回
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
