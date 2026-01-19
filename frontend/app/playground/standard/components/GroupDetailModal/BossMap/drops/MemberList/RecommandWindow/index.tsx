"use client";

import React, { useState } from "react";
import styles from "./styles.module.css";
import type { RecommendationStep } from "./recommendation";

/**
 * 🧭 RecommandWindow — 推荐理由（简略 + 详细模式）
 *  - 默认显示简略一句话 + ❔ 按钮
 *  - 点击后弹出详细分析窗口
 */
export default function RecommandWindow({
  steps,
}: {
  steps: RecommendationStep[];
}) {
  const [open, setOpen] = useState(false);
  if (!steps || steps.length === 0) return null;

  /* 🪶 取最后一个成功或 fallback 原因，作为摘要显示 */
  const summary =
    [...steps]
      .reverse()
      .find((s) => s.passed === true || s.passed === "fallback")
      ?.reason || "暂无推荐理由";

  const getClass = (passed: boolean | "fallback" | undefined) => {
    if (passed === true) return styles.passed;
    if (String(passed).toLowerCase() === "fallback") return styles.fallback;
    return styles.failed;
  };

  return (
    <>
      {/* === Inline summary row === */}
      <div className={styles.summaryRow}>
        <span className={styles.summaryLabel}>推荐理由：</span>
        <span className={styles.summaryText}>{summary}</span>
        <button
          className={styles.infoBtn}
          onClick={() => setOpen(true)}
          title="查看详细原因"
        >
          ❔
        </button>
      </div>

      {/* === Modal overlay + window === */}
      {open && (
        <div
          className={styles.windowOverlay}
          onClick={() => setOpen(false)}
        >
          <div
            className={styles.window}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <span className={styles.title}>推荐决策过程</span>
              <button
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="关闭"
                title="关闭"
              >
                ✕
              </button>
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
        </div>
      )}
    </>
  );
}
