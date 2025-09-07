"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>百战 V2</h1>

      <section className={styles.panel}>
        <p className={styles.label}>请选择功能入口：</p>
        <Link href="/characters" className={styles.button}>
          进入角色仓库
        </Link>
      </section>
    </main>
  );
}
