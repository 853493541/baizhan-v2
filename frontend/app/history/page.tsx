"use client";
import { useEffect, useState, useMemo } from "react";
import styles from "./styles.module.css";
import GroupedResult, {
  GroupedItem,
  HistoryItem,
} from "./Components/GroupedResult";
import { createPinyinMap, pinyinFilter } from "@/utils/pinyinSearch";
import ConfirmModal from "@/app/components/ConfirmModal";

import {
  toastSuccess,
  toastError,
} from "@/app/components/toast/toast";

function formatShortTime(dateStr: string) {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

export default function AbilityHistoryPage() {
  const [rawData, setRawData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [filterAbility, setFilterAbility] = useState("");
  const [limit, setLimit] = useState(100);

  const [nameMap, setNameMap] = useState<Record<string, any>>({});
  const [abilityMap, setAbilityMap] = useState<Record<string, any>>({});

  /* ===============================
     Confirm Modal State
  =============================== */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(
    null
  );

  const GROUP_WINDOW = 10000;
  const FETCH_LIMIT = 1000;

  /* ===============================
     Group nearby updates
  =============================== */
  const groupHistory = (
    items: HistoryItem[],
    maxGroups: number
  ): GroupedItem[] => {
    if (!items.length) return [];

    const groups: GroupedItem[] = [];
    let current: GroupedItem | null = null;

    for (const item of items) {
      const t = new Date(item.updatedAt).getTime();

      if (
        !current ||
        current.characterName !== item.characterName ||
        Math.abs(t - new Date(current.updatedAt).getTime()) > GROUP_WINDOW
      ) {
        current = {
          groupId: `${item.characterName}-${item.updatedAt}`,
          characterName: item.characterName,
          updatedAt: item.updatedAt,
          records: [item],
        };
        groups.push(current);
        if (groups.length >= maxGroups) break;
      } else {
        current.records.push(item);
      }
    }
    return groups;
  };

  /* ===============================
     Fetch history
  =============================== */
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters/abilities/history`
      );
      url.searchParams.set("limit", FETCH_LIMIT.toString());

      const res = await fetch(url.toString());
      const json = await res.json();
      setRawData(json);

      const uniqueNames = [...new Set(json.map((x: any) => x.characterName))];
      const uniqueAbilities = [...new Set(json.map((x: any) => x.abilityName))];

      const [nameMapBuilt, abilityMapBuilt] = await Promise.all([
        createPinyinMap(uniqueNames),
        createPinyinMap(uniqueAbilities),
      ]);

      setNameMap(nameMapBuilt);
      setAbilityMap(abilityMapBuilt);
    } catch (err) {
      console.error("❌ 获取技能记录失败:", err);
      toastError("获取技能记录失败");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Filter + grouping
  =============================== */
  const filteredGroups = useMemo(() => {
    if (!rawData.length) return [];

    let filtered = rawData;

    if (filterName.trim()) {
      const allNames = [...new Set(rawData.map((x) => x.characterName))];
      const matchedNames = pinyinFilter(allNames, nameMap, filterName.trim());
      filtered = filtered.filter((x) =>
        matchedNames.includes(x.characterName)
      );
    }

    if (filterAbility.trim()) {
      const allAbilities = [...new Set(rawData.map((x) => x.abilityName))];
      const matchedAbilities = pinyinFilter(
        allAbilities,
        abilityMap,
        filterAbility.trim()
      );
      filtered = filtered.filter((x) =>
        matchedAbilities.includes(x.abilityName)
      );
    }

    return groupHistory(filtered, limit);
  }, [rawData, filterName, filterAbility, limit, nameMap, abilityMap]);

  /* ===============================
     Single revert (CONFIRM MODAL)
  =============================== */
  const handleRevert = (id: string, item: HistoryItem) => {
    setConfirmMessage(
      `确认将 ${item.characterName} 的 ${item.abilityName} 撤回到 ${item.beforeLevel}重 吗？`
    );

    setOnConfirmAction(() => async () => {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/characters/abilities/history/${id}/revert`,
          { method: "POST" }
        );
        toastSuccess("撤回成功");
        await fetchHistory();
      } catch (err) {
        console.error(err);
        toastError("撤回失败");
      } finally {
        setConfirmOpen(false);
      }
    });

    setConfirmOpen(true);
  };

  /* ===============================
     Batch revert (CONFIRM MODAL)
  =============================== */
  const handleRevertGroup = (group: GroupedItem) => {
    setConfirmMessage(
      `确定要撤回 ${group.characterName} 的 ${group.records.length} 项技能吗？`
    );

    setOnConfirmAction(() => async () => {
      try {
        const ids = group.records.map((r) => r._id);
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/characters/abilities/history/batch/revert`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          }
        );
        toastSuccess("批量撤回成功");
        await fetchHistory();
      } catch (err) {
        console.error(err);
        toastError("批量撤回失败");
      } finally {
        setConfirmOpen(false);
      }
    });

    setConfirmOpen(true);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>技能更新记录</h2>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="搜索角色名…"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="搜索技能名…"
          value={filterAbility}
          onChange={(e) => setFilterAbility(e.target.value)}
          className={styles.input}
        />
        <select
          className={styles.select}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          <option value={100}>显示 100 组</option>
          <option value={500}>显示 500 组</option>
          <option value={1000}>显示 1000 组</option>
        </select>
        <button onClick={fetchHistory} className={styles.refreshBtn}>
          刷新
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p>加载中…</p>
      ) : filteredGroups.length === 0 ? (
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
            {filteredGroups.map((group) =>
              group.records.length === 1 ? (
                <tr key={group.groupId}>
                  <td>{formatShortTime(group.records[0].updatedAt)}</td>
                  <td>{group.records[0].characterName}</td>
                  <td>
                    <div className={styles.skillCell}>
                      <img
                        src={`/icons/${group.records[0].abilityName}.png`}
                        alt={group.records[0].abilityName}
                        className={styles.skillIcon}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/icons/default.png";
                        }}
                      />
                      <span>{group.records[0].abilityName}</span>
                    </div>
                  </td>
                  <td>
                    {group.records[0].beforeLevel}重 →{" "}
                    {group.records[0].afterLevel}重
                  </td>
                  <td>
                    <button
                      className={styles.revertBtn}
                      onClick={() =>
                        handleRevert(
                          group.records[0]._id,
                          group.records[0]
                        )
                      }
                    >
                      撤回
                    </button>
                  </td>
                </tr>
              ) : (
                <GroupedResult
                  key={group.groupId}
                  group={group}
                  onRevert={handleRevert}
                  onRevertGroup={handleRevertGroup}
                />
              )
            )}
          </tbody>
        </table>
      )}

      {/* ✅ Confirm Modal */}
      {confirmOpen && onConfirmAction && (
        <ConfirmModal
        intent = "danger"
          title="确认操作"
          message={confirmMessage}
          confirmText="确认"
          onCancel={() => {
            setConfirmOpen(false);
            setOnConfirmAction(null);
          }}
          onConfirm={onConfirmAction}
        />
      )}
    </div>
  );
}
