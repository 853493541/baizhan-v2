"use client";

import React, { useEffect } from "react";
import styles from "./styles.module.css";
import Dropdown from "../../components/layout/dropdown";
import pinyin from "pinyin";

interface Props {
  ownerFilter: string;
  serverFilter: string;
  roleFilter: string;
  onlyWithStorage: boolean;
  showCoreOnly: boolean;
  nameFilter: string; // ✅ new
  uniqueOwners: string[];
  uniqueServers: string[];
  setOwnerFilter: (v: string) => void;
  setServerFilter: (v: string) => void;
  setRoleFilter: (v: string) => void;
  setOnlyWithStorage: (v: boolean) => void;
  setShowCoreOnly: (v: boolean) => void;
  setNameFilter: (v: string) => void; // ✅ new
}

export default function BackpackFilter({
  ownerFilter,
  serverFilter,
  roleFilter,
  onlyWithStorage,
  showCoreOnly,
  nameFilter,
  uniqueOwners,
  uniqueServers,
  setOwnerFilter,
  setServerFilter,
  setRoleFilter,
  setOnlyWithStorage,
  setShowCoreOnly,
  setNameFilter,
}: Props) {
  // ✅ Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("backpackFilters");
    if (saved) {
      const parsed = JSON.parse(saved);
      setOwnerFilter(parsed.owner || "");
      setServerFilter(parsed.server || "");
      setRoleFilter(parsed.role || "");
      setOnlyWithStorage(parsed.onlyWithStorage ?? false);
      setShowCoreOnly(parsed.showCoreOnly ?? false);
      setNameFilter(parsed.name || "");
    } else {
      setOnlyWithStorage(false);
      setShowCoreOnly(false);
    }
  }, []);

  // ✅ Save whenever filters change
  useEffect(() => {
    localStorage.setItem(
      "backpackFilters",
      JSON.stringify({
        owner: ownerFilter,
        server: serverFilter,
        role: roleFilter,
        onlyWithStorage,
        showCoreOnly,
        name: nameFilter,
      })
    );
  }, [ownerFilter, serverFilter, roleFilter, onlyWithStorage, showCoreOnly, nameFilter]);

  // ✅ Reset
  const handleReset = () => {
    setOwnerFilter("");
    setServerFilter("");
    setRoleFilter("");
    setOnlyWithStorage(false);
    setShowCoreOnly(false);
    setNameFilter("");
    localStorage.removeItem("backpackFilters");
  };

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterRow}>
        <div className={styles.leftGroup}>
          {/* === Dropdowns === */}
          <Dropdown
            label="拥有者"
            options={["全部", ...uniqueOwners]}
            value={ownerFilter ? ownerFilter : "拥有者"}
            onChange={(val) => setOwnerFilter(val === "全部" ? "" : val)}
          />

          <Dropdown
            label="服务器"
            options={["全部", ...uniqueServers]}
            value={serverFilter ? serverFilter : "服务器"}
            onChange={(val) => setServerFilter(val === "全部" ? "" : val)}
          />

          {/* === Role buttons === */}
          {[
            { label: "防御", value: "Tank" },
            { label: "输出", value: "DPS" },
            { label: "治疗", value: "Healer" },
          ].map((opt) => (
            <button
              key={opt.value}
              className={`${styles.filterBtn} ${roleFilter === opt.value ? styles.selected : ""}`}
              onClick={() => setRoleFilter(roleFilter === opt.value ? "" : opt.value)}
            >
              {opt.label}
            </button>
          ))}

          {/* ✅ Move name search bar here */}
          <input
            type="text"
            placeholder="搜索角色名 / 拼音"
            className={styles.searchInput}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </div>

        <div className={styles.rightGroup}>
          {/* === Toggle buttons on right === */}
          <button
            className={`${styles.toggleBtn} ${onlyWithStorage ? styles.active : ""}`}
            onClick={() => setOnlyWithStorage(!onlyWithStorage)}
          >
            仅有书
          </button>

          <button
            className={`${styles.toggleBtn} ${showCoreOnly ? styles.active : ""}`}
            onClick={() => setShowCoreOnly(!showCoreOnly)}
          >
            仅核心技能
          </button>

          <button className={styles.resetBtn} onClick={handleReset}>
            重置
          </button>
        </div>
      </div>
    </div>
  );
}
