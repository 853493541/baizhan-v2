import React from "react";
import Image from "next/image";   // ✅ import from next/image
import styles from "./styles.module.css";

export default function TopBar() {
  return (
    <div className={styles.wrap}>
      {/* ✅ points to /public/icons/app_icon.png */}
      <Image src="/icons/app_icon.png" alt="logo" width={24} height={24} />
      
      <div className={styles.title}>百战 · 控制台</div>
      <div className={styles.right}>
        <span className={styles.version}>v0.1 draft</span>
      </div>
    </div>
  );
}
