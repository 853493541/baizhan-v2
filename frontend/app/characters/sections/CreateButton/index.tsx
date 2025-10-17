"use client";

import styles from "./styles.module.css";

interface Props {
  onClick: () => void;
  compact?: boolean;      // use a smaller header-sized button
  className?: string;     // optional external override
}

export default function CreateButton({ onClick, compact = false, className }: Props) {
  return (
    <button
      onClick={onClick}
      className={[
        styles.createButton,
        compact ? styles.compact : "",
        className ?? "",
      ].join(" ").trim()}
    >
      + 新建角色
    </button>
  );
}
