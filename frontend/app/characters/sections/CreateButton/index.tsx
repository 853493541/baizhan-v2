"use client";

import styles from "./styles.module.css";

interface Props {
  onClick: () => void;
}

export default function CreateButton({ onClick }: Props) {
  return (
    <div className={styles.createButtonWrapper}>
      <button onClick={onClick} className={styles.createButton}>
        + 新建角色
      </button>
    </div>
  );
}
