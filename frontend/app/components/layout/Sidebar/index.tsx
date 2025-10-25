import React from "react";
import NavLink from "../NavLink";
import styles from "./styles.module.css";

export default function Sidebar() {
  return (
    <div className={styles.wrap}>
      <div className={styles.brand}>
        <span>导航</span>
      </div>

      <nav className={styles.nav}>
        <NavLink href="/">🏠 主页</NavLink>
        <NavLink href="/characters">🧩 角色仓库</NavLink>
        <NavLink href="/map">🗺️ 本周地图</NavLink>
        <NavLink href="/playground">📊 排表</NavLink>
        <NavLink href="/targetedplans">🎯 对单排表</NavLink>
        <NavLink href="/history">📜 历史记录</NavLink>
        <NavLink href="/backpack">📦 角色背包</NavLink>
      </nav>
    </div>
  );
}
