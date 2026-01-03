// BossMap/types.ts
import type { GroupResult } from "@/utils/solver";

export interface ExtendedGroup extends GroupResult {
  index: number;
  status?: "not_started" | "started" | "finished";
  kills?: any[];

  // per-group boss overrides
  adjusted90?: string;
  adjusted100?: string;

    downgradedFloors?: number[];
    
}

export interface BossMapProps {
  scheduleId: string;
  group: ExtendedGroup;
  weeklyMap: Record<number, string>;
  countdown?: number;
  onRefresh?: () => void;
  onGroupUpdate?: (g: ExtendedGroup) => void;
}
