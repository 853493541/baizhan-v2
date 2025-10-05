"use client";
import React from "react";
import styles from "./styles.module.css";

export default function Processed({ drops }) {
  return (
    <div className={styles.box}>
      <h3 className={styles.title}>已处理</h3>
      <p>暂无数据</p>
    </div>
  );
}
