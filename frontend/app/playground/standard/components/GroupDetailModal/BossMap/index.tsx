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
import BossCard from "./BossCard";
import BossDropsController from "./DropsController";
import BossOverrideController from "./OverrideController";

/* ======================================================
   🧬 Mutation visibility rule
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
     CONTROLLER
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
    switch (role?.toLowerCase()) {
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
     Mutation eligibility
  ----------------------------------------------------- */
  const canShowMutation = (floor: number) => {
    const original = weeklyMap?.[floor];
    return original ? MUTATION_ORIGINAL_BOSSES.has(original) : false;
  };

  /* -----------------------------------------------------
     Secondary-page eligibility (AUTHORITATIVE)
     - boss eligible (90/100 OR mutated)
     - AND primary drop exists
  ----------------------------------------------------- */
  const canShowSecondary = (floor: number) => {
    const kill = c.localGroup.kills?.find((k: any) => k.floor === floor);
    if (!kill?.selection || kill.selection.noDrop) return false;

    if (floor === 90 || floor === 100) return true;
    return canShowMutation(floor);
  };

  /* -----------------------------------------------------
     Render rows
  ----------------------------------------------------- */
  const renderRow = (floors: number[]) => (
    <div className={styles.row}>
      {floors.map((f) => {
        const boss = c.resolveBoss(f);

        return (
          <BossCard
            key={f}
            floor={f}
            boss={boss}
            group={c.localGroup}
            bossData={bossData}
            highlightAbilities={highlightAbilities}
            kill={c.localGroup.kills?.find((k: any) => k.floor === f)}
            activeMembers={c.activeMembers}

            /* =========================
               PRIMARY / SECONDARY SELECT
            ========================= */
            onSelect={c.handleSelectBossCard}
            onSelectSecondary={c.handleSelectSecondaryDrop}

            /* =========================
               Secondary page visibility
               (ONLY comes from BossMap)
            ========================= */
            canShowSecondary={canShowSecondary(f)}

            /* =========================
               Boss control
            ========================= */
            onChangeBoss={c.openBossModal}
            onToggleMutation={
              canShowMutation(f)
                ? () => c.toggleMutationFloor(f)
                : undefined
            }
          />
        );
      })}
    </div>
  );

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <>
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
              return (
                <button
                  key={i}
                  onClick={() => c.toggleMember(i)}
                  className={`${styles.actionBtn} ${getRoleClass(cc.role)} ${
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

      {renderRow(row1)}
      {renderRow(row2)}

      {/* =========================
         Drop modal controller
      ========================= */}
      <BossDropsController
        scheduleId={scheduleId}
        localGroup={c.localGroup}
        selected={c.selected}
        status={c.status}
        onClose={c.closeDrops}
        onSave={c.onDropsSave}
        onAfterReset={c.onAfterReset}
      />

      {/* =========================
         Boss override modal
      ========================= */}
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

      {/* =========================
         Finish confirmation
      ========================= */}
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
