"use client";

import React, { useEffect } from "react";
import styles from "./styles.module.css";
import Dropdown from "../../components/layout/dropdown";

interface Props {
  ownerFilter: string;
  serverFilter: string;
  roleFilter: string;
  onlyWithStorage: boolean;
  showCoreOnly: boolean;
  uniqueOwners: string[];
  uniqueServers: string[];
  setOwnerFilter: (v: string) => void;
  setServerFilter: (v: string) => void;
  setRoleFilter: (v: string) => void;
  setOnlyWithStorage: (v: boolean) => void;
  setShowCoreOnly: (v: boolean) => void;
}

export default function BackpackFilter({
  ownerFilter,
  serverFilter,
  roleFilter,
  onlyWithStorage,
  showCoreOnly,
  uniqueOwners,
  uniqueServers,
  setOwnerFilter,
  setServerFilter,
  setRoleFilter,
  setOnlyWithStorage,
  setShowCoreOnly,
}: Props) {
  // ✅ Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("backpackFilters");
    if (saved) {
      const parsed = JSON.parse(saved);
      setOwnerFilter(parsed.owner || "");
      setServerFilter(parsed.server || "");
      setRoleFilter(parsed.role || "");
      setOnlyWithStorage(parsed.onlyWithStorage ?? true);
      setShowCoreOnly(parsed.showCoreOnly ?? false);
    } else {
      setOnlyWithStorage(true);
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
      })
    );
  }, [ownerFilter, serverFilter, roleFilter, onlyWithStorage, showCoreOnly]);

  // ✅ Reset
  const handleReset = () => {
    setOwnerFilter("");
    setServerFilter("");
    setRoleFilter("");
    setOnlyWithStorage(true);
    setShowCoreOnly(false);
    localStorage.removeItem("backpackFilters");
  };

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterRow}>
        <div className={styles.leftGroup}>
          {/* === Dropdowns === */}
          <Dropdown
            label="角色"
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
              className={`${styles.filterBtn} ${
                roleFilter === opt.value ? styles.selected : ""
              }`}
              onClick={() =>
                setRoleFilter(roleFilter === opt.value ? "" : opt.value)
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className={styles.rightGroup}>
          {/* === Toggle buttons on right === */}
          <button
            className={`${styles.toggleBtn} ${
              onlyWithStorage ? styles.active : ""
            }`}
            onClick={() => setOnlyWithStorage(!onlyWithStorage)}
          >
            仅显示有书
          </button>

          <button
            className={`${styles.toggleBtn} ${
              showCoreOnly ? styles.active : ""
            }`}
            onClick={() => setShowCoreOnly(!showCoreOnly)}
          >
            仅显示核心技能
          </button>

          <button className={styles.resetBtn} onClick={handleReset}>
            重置
          </button>
        </div>
      </div>
    </div>
  );
}
