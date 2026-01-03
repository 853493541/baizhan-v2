"use client";

import React, { useMemo } from "react";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal";

import type { BossMapProps } from "./types";
import { useBossMapController } from "./useBossMapController";

import {
  bossData,
  highlightAbilities,
  row1,
  row2,
} from "./constants";

import BossMapHeader from "./MapHeader";
import BossCard from "./BossCard"; // ✅ render cards directly (so we can per-floor control 异)
import BossDropsController from "./DropsController";
import BossOverrideController from "./OverrideController";

/* ======================================================
   🧬 Mutation visibility rule
   Show "异" ONLY if ORIGINAL weekly boss is one of:
   肖红 / 青年程沐华 / 困境韦柔丝
   (NOT based on resolved boss, so 程沐华 as original will NOT show)
====================================================== */
const MUTATION_ORIGINAL_BOSSES = new Set([
  "肖红",
  "青年程沐华",
  "困境韦柔丝",
]);

export default function BossMap({
  scheduleId,
  group,
  weeklyMap,
  countdown,
  onRefresh,
  onGroupUpdate,
}: BossMapProps) {
  /* -----------------------------------------------------
     CONTROLLER (single source of truth)
  ----------------------------------------------------- */
  const c = useBossMapController({
    scheduleId,
    group,
    weeklyMap,
    onRefresh,
    onGroupUpdate,
  });

  /* -----------------------------------------------------
     STATUS DOT
  ----------------------------------------------------- */
  const statusCircleClass = useMemo(() => {
    return {
      not_started: styles.statusIdleDot,
      started: styles.statusBusyDot,
      finished: styles.statusDoneDot,
    }[c.status];
  }, [c.status]);

  /* -----------------------------------------------------
     ROLE COLOR
  ----------------------------------------------------- */
  const getRoleClass = (role: string) => {
    if (!role) return "";
    switch (role.toLowerCase()) {
      case "tank":
        return styles.tankBtn;
      case "dps":
        return styles.dpsBtn;
      case "healer":
        return styles.healerBtn;
      default:
        return "";
    }
  };

  /* -----------------------------------------------------
     Per-floor: should show mutation button?
     Based ONLY on ORIGINAL weeklyMap boss.
  ----------------------------------------------------- */
  const canShowMutation = (floor: number) => {
    const original = weeklyMap?.[floor];
    return original ? MUTATION_ORIGINAL_BOSSES.has(original) : false;
  };

  /* -----------------------------------------------------
     Render a row of BossCards (so we can per-floor control 异)
  ----------------------------------------------------- */
  const renderRow = (floors: number[]) => {
    return (
      <div className={styles.row}>
        {floors.map((f) => (
          <BossCard
            key={f}
            floor={f}
            boss={c.resolveBoss(f)}
            group={c.localGroup}
            bossData={bossData}
            highlightAbilities={highlightAbilities}
            kill={c.localGroup.kills?.find((k: any) => k.floor === f)}
            activeMembers={c.activeMembers}
            onSelect={c.handleSelectBossCard}
            onChangeBoss={c.openBossModal}
            // ✅ CRITICAL: only pass handler if this floor supports mutation
            onToggleMutation={
              canShowMutation(f)
                ? () => c.toggleMutationFloor(f)
                : undefined
            }
          />
        ))}
      </div>
    );
  };

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <>
      {/* ================= HEADER ================= */}
      <BossMapHeader
        title="本周地图"
        countdown={countdown}
        statusText={c.statusLabel[c.status]}
        statusDotClass={statusCircleClass}
        onFinish={c.handleFinish}
        showFinish={c.status !== "finished"}
        leftSlot={
          <div className={styles.memberButtons}>
            {c.localGroup.characters?.map((cc: any, i: number) => {
              const isActive = c.activeMembers.includes(i);
              const roleClass = getRoleClass(cc.role);

              return (
                <button
                  key={i}
                  onClick={() => c.toggleMember(i)}
                  className={`${styles.actionBtn} ${roleClass} ${
                    !isActive ? styles.inactiveBtn : ""
                  }`}
                >
                  {cc.name}
                </button>
              );
            })}
          </div>
        }
      />

      {/* ================= ROW 1 (81–90) ================= */}
      {renderRow(row1)}

      {/* ================= ROW 2 (100–91) ================= */}
      {renderRow(row2)}

      {/* ================= DROPS ================= */}
      <BossDropsController
        scheduleId={scheduleId}
        localGroup={c.localGroup}
        selected={c.selected}
        status={c.status}
        onClose={c.closeDrops}
        onSave={c.onDropsSave}
        onAfterReset={c.onAfterReset}
        onMarkStarted={c.onMarkStarted}
      />

      {/* ================= BOSS OVERRIDE MODAL ================= */}
      <BossOverrideController
        scheduleId={scheduleId}
        groupIndex={c.localGroup.index}
        bossModal={c.bossModal}
        group={c.localGroup}
        bossData={bossData}
        highlightAbilities={highlightAbilities}
        onClose={c.closeBossModal}
        onSuccess={c.onBossOverrideSuccess}
      />

      {/* ================= FINISH CONFIRM ================= */}
      {c.confirmOpen && (
        <ConfirmModal
          title="确认结束"
          message="是否确认结束？"
          intent="success"
          onCancel={c.cancelConfirm}
          onConfirm={c.confirmFinish}
        />
      )}
    </>
  );
}
