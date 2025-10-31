"use client";

import React from "react";
import styles from "./styles.module.css";
import type { RecommendationStep } from "./recommendation";

export default function RecommandWindow({
  steps,
  onClose,
}: {
  steps: RecommendationStep[];
  onClose: () => void;
}) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={styles.window}>
      <div className={styles.header}>
        <span>推荐决策过程</span>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      <div className={styles.content}>
        <ul className={styles.stepList}>
          {steps.map((step, i) => {
            let className = styles.failed;
            if (step.passed === true) className = styles.passed;
            else if (step.passed === "fallback") className = styles.fallback;

            return (
              <li key={i} className={className}>
                {step.reason}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
