"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.css";
import GroupedResult from "./Components/GroupedResult";
import ConfirmModal from "@/app/components/ConfirmModal";
import Dropdown from "@/app/components/layout/dropdown"; // ✅ your dropdown
import { useAbilityHistory } from "./useAbilityHistory";

/* ===============================
   Utils
=============================== */
function formatShortTime(dateStr: string, isPhone: boolean) {
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (isPhone) return `${mm}/${dd}`;

  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

function shortenAbility(name: string, isPhone: boolean) {
  return isPhone ? name.slice(0, 2) : name;
}

function shortenName(name: string) {
  return name.slice(0, 4);
}

function getSmallGroupStatus(
  records: { beforeLevel: number; afterLevel: number }[]
) {
  const levels = [
    records[0].beforeLevel,
    ...records.map((r) => r.afterLevel),
  ];
  for (let i = 0; i < levels.length - 1; i++) {
    if (levels[i + 1] < levels[i]) return false;
  }
  return levels[levels.length - 1] >= levels[0];
}

/* ===============================
   Page
=============================== */
const PAGE_SIZE = 100;

const DAY_OPTIONS = ["1 天", "30 天", "60 天", "90 天", "全部"];

export default function AbilityHistoryPage() {
  const {
    loading,
    groupedData,

    filterName,
    setFilterName,
    filterAbility,
    setFilterAbility,

    days,
    setDays,
    importantOnly,
    setImportantOnly,

    refresh,
    revertSingle,
    revertGroup,

    confirmOpen,
    confirmMessage,
    onConfirmAction,
    closeConfirm,
  } = useAbilityHistory();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isPhone, setIsPhone] = useState(false);

  /* ===============================
     Responsive
  =============================== */
  useEffect(() => {
    const check = () => setIsPhone(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [groupedData.length, days, importantOnly, filterName, filterAbility]);

  const visibleGroups = useMemo(
    () => groupedData.slice(0, visibleCount),
    [groupedData, visibleCount]
  );

  const canLoadMore = visibleCount < groupedData.length;

  /* ===============================
     Days dropdown helpers
  =============================== */
  const dayValueLabel =
    days === "all" ? "全部" : `${days} 天`;

  const handleDayChange = (v: string) => {
    if (v === "全部") {
      setDays("all");
    } else {
      setDays(Number(v.replace(" 天", "")));
    }
  };

  return (
    <div className={styles.page}>
      {/* ================= Header ================= */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>技能更新记录</h2>
          <div className={styles.subTitle}>
            {loading ? "加载中…" : `共 ${groupedData.length} 组`}
          </div>
        </div>

        <div className={styles.headerRight}>
          <button
            onClick={refresh}
            className={styles.refreshBtn}
            disabled={loading}
          >
            刷新
          </button>
        </div>
      </div>

      {/* ================= Filters ================= */}
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <input
            className={styles.input}
            placeholder="角色"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />

          <input
            className={styles.input}
            placeholder="技能"
            value={filterAbility}
            onChange={(e) => setFilterAbility(e.target.value)}
          />

          {/* ✅ Custom Dropdown replaces native select */}
          <Dropdown
            label="时间范围"
            options={DAY_OPTIONS}
            value={dayValueLabel}
            onChange={handleDayChange}
          />

          <label className={styles.checkboxLabel}>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={importantOnly}
              onChange={(e) => setImportantOnly(e.target.checked)}
            />
            <span className={styles.checkboxText}>重要</span>
          </label>
        </div>
      </div>

      {/* ================= Table ================= */}
      {loading ? (
        <div className={styles.loading}>加载中…</div>
      ) : groupedData.length === 0 ? (
        <div className={styles.empty}>暂无记录</div>
      ) : (
        <div className={styles.tableWrap}>
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
              {visibleGroups.map((group) => {
                /* ===== Single ===== */
                if (group.records.length === 1) {
                  const r = group.records[0];
                  return (
                    <tr key={r._id}>
                      <td className={styles.timeCell}>
                        {formatShortTime(r.updatedAt, isPhone)}
                      </td>

                      <td className={styles.nameCell}>
                        {shortenName(r.characterName)}
                      </td>

                      <td className={styles.skillCol}>
                        <div className={styles.skillCell}>
                          <img
                            className={styles.skillIcon}
                            src={`/icons/${r.abilityName}.png`}
                            onError={(e) =>
                              ((e.currentTarget as HTMLImageElement).src =
                                "/icons/default.png")
                            }
                          />
                          <span className={styles.skillName}>
                            {shortenAbility(r.abilityName, isPhone)}
                          </span>
                        </div>
                      </td>

                      <td className={styles.changeCol}>
                        <span className={styles.changeText}>
                          {r.beforeLevel} → {r.afterLevel}
                        </span>
                      </td>

                      <td className={styles.actionCol}>
                        <button
                          className={styles.revertBtn}
                          onClick={() => revertSingle(r._id, r)}
                        >
                          撤回
                        </button>
                      </td>
                    </tr>
                  );
                }

                const abilitySet = new Set(
                  group.records.map((r) => r.abilityName)
                );
                const isSmall =
                  abilitySet.size === 1 && group.records.length < 6;

                /* ===== Small group ===== */
                if (isSmall) {
                  const first = group.records[0];
                  const ok = getSmallGroupStatus(group.records);

                  return (
                    <tr
                      key={group.groupId}
                      className={styles.smallGroupRow}
                    >
                      <td className={styles.timeCell}>
                        {formatShortTime(first.updatedAt, isPhone)}
                      </td>

                      <td className={styles.nameCell}>
                        {shortenName(first.characterName)}
                      </td>

                      <td className={styles.skillCol}>
                        <div className={styles.skillCell}>
                          <img
                            className={styles.skillIcon}
                            src={`/icons/${first.abilityName}.png`}
                          />
                          <span className={styles.skillName}>
                            {shortenAbility(first.abilityName, isPhone)}
                          </span>
                        </div>
                      </td>

                      <td
                        className={`${styles.changeCol} ${
                          ok ? styles.goodChain : styles.badChain
                        }`}
                      >
                        <span className={styles.chainText}>
                          {group.records.map((r, i) => (
                            <span
                              key={r._id}
                              className={styles.chainStep}
                            >
                              {i === 0 ? r.beforeLevel : ""}
                              →{r.afterLevel}
                            </span>
                          ))}
                        </span>
                      </td>

                      <td className={styles.actionCol}>
                        <button
                          className={styles.revertBtn}
                          onClick={() => revertGroup(group)}
                        >
                          撤回
                        </button>
                      </td>
                    </tr>
                  );
                }

                /* ===== Big group ===== */
                return (
                  <GroupedResult
                    key={group.groupId}
                    group={group}
                    onRevert={revertSingle}
                    onRevertGroup={revertGroup}
                    isPhone={isPhone}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= Load More ================= */}
      {!loading && canLoadMore && (
        <div className={styles.loadMoreWrap}>
          <button
            className={styles.loadMoreBtn}
            onClick={() =>
              setVisibleCount((v) =>
                Math.min(v + PAGE_SIZE, groupedData.length)
              )
            }
          >
            加载更多（+{PAGE_SIZE}）
          </button>
        </div>
      )}

      {/* ================= Confirm ================= */}
      {confirmOpen && onConfirmAction && (
        <ConfirmModal
          intent="danger"
          title="确认操作"
          message={confirmMessage}
          confirmText="确认"
          onCancel={closeConfirm}
          onConfirm={onConfirmAction}
        />
      )}
    </div>
  );
}
