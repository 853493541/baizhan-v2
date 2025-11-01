"use client";

import React, { useRef } from "react";
import styles from "./styles.module.css";
import type { RecommendationStep } from "./recommendation";

export default function RecommandWindow({
  steps,
}: {
  steps: RecommendationStep[];
  parentRef?: React.RefObject<HTMLDivElement>;
}) {
  const windowRef = useRef<HTMLDivElement>(null);

  if (!steps || steps.length === 0) return null;

  const getClass = (passed: boolean | "fallback" | undefined) => {
    if (passed === true) return styles.passed;
    if (String(passed).toLowerCase() === "fallback") return styles.fallback;
    return styles.failed;
  };

  return (
    <div ref={windowRef} className={styles.window}>
      <div className={styles.header}>
        <span className={styles.title}>推荐决策过程</span>
      </div>
      <div className={styles.content}>
        <ul className={styles.stepList}>
          {steps.map((step, i) => (
            <li key={i} className={getClass(step.passed)}>
              {step.reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
