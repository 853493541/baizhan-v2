"use client";

import React, { useMemo } from "react";
import styles from "./styles.module.css";
import ConfirmModal from "@/app/components/ConfirmModal";

import type { BossMapProps } from "./types";
import { useBossMapController } from "./useBossMapController";
import {
  bossData,
  tradableSet,
  highlightAbilities,
  row1,
  row2,
} from "./constants";

import BossMapHeader from "./MapHeader";
import BossRows from "./Rows";
import BossDropsController from "./DropsController";
import BossOverrideController from "./OverrideController";

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
      <BossRows
        floors={row1}
        localGroup={c.localGroup}
        resolveBoss={c.resolveBoss}
        bossData={bossData}
        highlightAbilities={highlightAbilities}
        tradableSet={tradableSet}
        activeMembers={c.activeMembers}
        onSelect={c.handleSelectBossCard}
        onChangeBoss={c.openBossModal}
        onToggleMutation={c.toggleMutationFloor}   // ✅ ADD
      />

      {/* ================= ROW 2 (100–91) ================= */}
      <BossRows
        floors={row2}
        localGroup={c.localGroup}
        resolveBoss={c.resolveBoss}
        bossData={bossData}
        highlightAbilities={highlightAbilities}
        tradableSet={tradableSet}
        activeMembers={c.activeMembers}
        onSelect={c.handleSelectBossCard}
        onChangeBoss={c.openBossModal}
        onToggleMutation={c.toggleMutationFloor}   // ✅ ADD
      />

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
