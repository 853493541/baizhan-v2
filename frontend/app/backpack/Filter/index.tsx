"use client";

import React, { useEffect } from "react";
import styles from "./styles.module.css";
import Dropdown from "../../components/layout/dropdown";

interface Props {
  ownerFilter: string;
  serverFilter: string;
  roleFilter: string;
  onlyWithStorage: boolean;
  uniqueOwners: string[];
  uniqueServers: string[];
  setOwnerFilter: (v: string) => void;
  setServerFilter: (v: string) => void;
  setRoleFilter: (v: string) => void;
  setOnlyWithStorage: (v: boolean) => void;
}

export default function BackpackFilter({
  ownerFilter,
  serverFilter,
  roleFilter,
  onlyWithStorage,
  uniqueOwners,
  uniqueServers,
  setOwnerFilter,
  setServerFilter,
  setRoleFilter,
  setOnlyWithStorage,
}: Props) {
  // ✅ Load from localStorage or default to checked
  useEffect(() => {
    const saved = localStorage.getItem("backpackFilters");
    if (saved) {
      const parsed = JSON.parse(saved);
      setOwnerFilter(parsed.owner || "");
      setServerFilter(parsed.server || "");
      setRoleFilter(parsed.role || "");
      setOnlyWithStorage(parsed.onlyWithStorage ?? true);
    } else {
      setOnlyWithStorage(true);
    }
  }, []);

  // ✅ Save to localStorage whenever filters change
  useEffect(() => {
    localStorage.setItem(
      "backpackFilters",
      JSON.stringify({
        owner: ownerFilter,
        server: serverFilter,
        role: roleFilter,
        onlyWithStorage,
      })
    );
  }, [ownerFilter, serverFilter, roleFilter, onlyWithStorage]);

  // ✅ Reset button
  const handleReset = () => {
    setOwnerFilter("");
    setServerFilter("");
    setRoleFilter("");
    setOnlyWithStorage(true);
    localStorage.removeItem("backpackFilters");
  };

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterRow}>
        {/* ✅ “全部角色” 默认显示 */}
        <Dropdown
          label="角色"
          options={["全部", ...uniqueOwners]}
          value={ownerFilter ? ownerFilter : "拥有者"}
          onChange={(val) => setOwnerFilter(val === "全部" ? "" : val)}
        />

        {/* ✅ “全部服务器” 默认显示 */}
        <Dropdown
          label="服务器"
          options={["全部", ...uniqueServers]}
          value={serverFilter ? serverFilter : "服务器"}
          onChange={(val) => setServerFilter(val === "全部" ? "" : val)}
        />

        {/* ✅ Role buttons */}
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

        {/* ✅ Checkbox (default checked) */}
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={onlyWithStorage}
            onChange={(e) => setOnlyWithStorage(e.target.checked)}
          />
          仅显示有存储
        </label>

        <button className={styles.resetBtn} onClick={handleReset}>
          重置
        </button>
      </div>
    </div>
  );
}
