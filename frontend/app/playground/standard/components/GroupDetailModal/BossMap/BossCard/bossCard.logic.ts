import { useEffect, useMemo, useRef, useState } from "react";
import { calcBossNeeds } from "./calcBossNeeds";
import styles from "./styles.module.css";

/* =====================================================
   Card background class
===================================================== */
export function getSelectionCardClass(
  selection: any,
  tradableSet: Set<string>
): string {
  if (!selection) return "";

  if (selection.noDrop === true) return styles.cardHealer;

  const ability = selection.ability;
  const characterId = selection.characterId;

  if (!ability && !characterId) return styles.cardTank;
  if (ability && tradableSet.has(ability)) return styles.cardPurple;
  if (ability && !characterId) return styles.cardHealer;

  return styles.cardNormal;
}

/* =====================================================
   BossCard Logic Hook
===================================================== */
export function useBossCardLogic(params: {
  floor: number;
  boss: any;
  group: any;
  bossData: any;
  highlightAbilities: any;
  kill: any;
  activeMembers: number[];
  canShowSecondary: boolean;

  onSelect: any;
  onSelectSecondary: any;

  tradableSet: Set<string>;
  primaryClassName?: string;
}) {
  const {
    floor,
    boss,
    group,
    bossData,
    highlightAbilities,
    kill,
    activeMembers,
    canShowSecondary,
    onSelect,
    onSelectSecondary,
    tradableSet,
    primaryClassName,
  } = params;

  /* =====================================================
     STATE
  ===================================================== */
  const [dropPage, setDropPage] = useState<1 | 2>(1);

  /* =====================================================
     SECONDARY EDGE DETECTION (CRITICAL)
  ===================================================== */
  const prevHasSecondaryRef = useRef<boolean>(false);
  const hasSecondaryDrop = !!kill?.selectionSecondary;

  useEffect(() => {
    const prev = prevHasSecondaryRef.current;

    console.log("[second2][edge-check]", {
      boss,
      floor,
      prevHasSecondary: prev,
      nowHasSecondary: hasSecondaryDrop,
      willFlip: !prev && hasSecondaryDrop,
      selectionSecondary: kill?.selectionSecondary ?? null,
    });

    // 🔥 ONLY flip page when user just added secondary drop
    if (!prev && hasSecondaryDrop) {
      console.log("[second2][action] secondary added → switch to page 2");
      setDropPage(2);
    }

    prevHasSecondaryRef.current = hasSecondaryDrop;
  }, [hasSecondaryDrop, boss, floor, kill?.selectionSecondary]);

  /* =====================================================
     DROP LEVEL
  ===================================================== */
  const dropLevel: 9 | 10 = floor >= 81 && floor <= 90 ? 9 : 10;

  /* =====================================================
     NEEDS
  ===================================================== */
  const needs = useMemo(() => {
    if (!boss) return [];
    return calcBossNeeds({
      boss,
      bossData,
      group,
      activeMembers,
      dropLevel,
      highlightAbilities,
    });
  }, [boss, bossData, group, activeMembers, dropLevel, highlightAbilities]);

  /* =====================================================
     DROP LISTS
  ===================================================== */
  const fullDropList: string[] = boss ? bossData[boss] || [] : [];

  const tradableList = fullDropList.filter((a) => tradableSet.has(a));
  const dropList = fullDropList.filter((a) => !tradableSet.has(a));

  /* =====================================================
     PAGER STATE
  ===================================================== */
  const willDirectOpenSecondary =
    canShowSecondary && !hasSecondaryDrop;

  const canPage =
    !!canShowSecondary &&
    !!kill?.selection &&
    !!kill?.selectionSecondary;

  /* =====================================================
     ACTIVE CARD CLASS
  ===================================================== */
  const activeCardClass = useMemo(() => {
    if (dropPage === 1) {
      return primaryClassName || "";
    }

    if (!canShowSecondary) return "";

    const sel2 = kill?.selectionSecondary;
    if (!sel2) return "";

    return getSelectionCardClass(sel2, tradableSet);
  }, [
    dropPage,
    canShowSecondary,
    primaryClassName,
    kill?.selectionSecondary,
    tradableSet,
  ]);

  /* =====================================================
     CARD CLICK
  ===================================================== */
  const handleCardClick = () => {
    if (dropPage === 2) {
      if (!canShowSecondary) return;

      onSelectSecondary?.(
        floor,
        boss,
        dropList,
        tradableList,
        dropLevel
      );
    } else {
      onSelect(
        floor,
        boss,
        dropList,
        tradableList,
        dropLevel
      );
    }
  };

  /* =====================================================
     NEXT BUTTON
  ===================================================== */
  const handleNextButtonClick = () => {
    if (willDirectOpenSecondary) {
      console.log("[second2][button] direct open secondary modal");
      onSelectSecondary?.(
        floor,
        boss,
        dropList,
        tradableList,
        dropLevel
      );
      return;
    }

    console.log("[second2][button] paging to page 2");
    setDropPage(2);
  };

  /* =====================================================
     EXPORT
  ===================================================== */
  return {
    dropPage,
    setDropPage,
    dropLevel,

    needs,
    fullDropList,
    tradableList,
    dropList,

    canPage,
    activeCardClass,

    handleCardClick,
    handleNextButtonClick,

    willDirectOpenSecondary,
  };
}
