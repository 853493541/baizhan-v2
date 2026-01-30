"use client";

import styles from "./styles.module.css";
import { EFFECT_DISPLAY } from "./effectDisplay";

type RuntimeEffect = {
  type: string;
  value?: number;
  chance?: number;
  remainingTurns?: number;
  repeatTurns?: number;
};

type Props = {
  statuses?: RuntimeEffect[];
};

export default function StatusBar({ statuses }: Props) {
  if (!statuses || statuses.length === 0) return null;

  return (
    <div className={styles.statusBar}>
      {statuses.map((s, i) => {
        const render = EFFECT_DISPLAY[s.type];
        if (!render) return null;

        return (
          <div key={i} className={styles.statusPill}>
            {render(s)}
          </div>
        );
      })}
    </div>
  );
}
