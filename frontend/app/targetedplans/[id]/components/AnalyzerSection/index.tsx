"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import AbilityChecking from "./AbilityChecking";
import AbilityCoverage from "./AbilityCoverage";
import DropsWasted from "./DropsWasted";
import type { GroupResult, AbilityCheck } from "@/utils/solver";

interface Props {
  groups: GroupResult[];
  checkedAbilities: AbilityCheck[];
}

export default function AnalyzerSection({ groups, checkedAbilities }: Props) {
  const [activeTab, setActiveTab] = useState<"check" | "coverage" | "drops">("check");

  return (
    <div className={styles.container}>
      {/* 🟦 Tab Bar */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === "check" ? styles.active : ""}`}
          onClick={() => setActiveTab("check")}
        >
          关键掉落容纳
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "coverage" ? styles.active : ""}`}
          onClick={() => setActiveTab("coverage")}
        >
          战斗技能
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "drops" ? styles.active : ""}`}
          onClick={() => setActiveTab("drops")}
        >
          掉落浪费
        </button>
      </div>

      {/* 🟢 Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "check" && (
          <AbilityChecking groups={groups} checkedAbilities={checkedAbilities} />
        )}
        {activeTab === "coverage" && <AbilityCoverage groups={groups} />}
        {activeTab === "drops" && (
          <DropsWasted groups={groups} checkedAbilities={checkedAbilities} />
        )}
      </div>
    </div>
  );
}
