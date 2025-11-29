"use client";

import React from "react";
import styles from "./styles.module.css";

export default function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {open && <div className={styles.overlay} onClick={onClose} />}
      <div className={`${styles.drawer} ${open ? styles.open : ""}`}>
        {children}
      </div>
    </>
  );
}
