"use client";

import React from "react";
import NavLink from "../NavLink";
import styles from "./styles.module.css";

export default function Sidebar() {
  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>

        {/* 主页 */}
        <NavLink href="/">🏠 主页</NavLink>

        {/* 角色 */}
        <NavLink href="/characters">🧩 全部角色</NavLink>
        <NavLink href="/backpack">📦 角色背包</NavLink>

        {/* 排表 */}
        <NavLink href="/playground">📊 本周排表</NavLink>

        {/* 地图 */}
        {/* <NavLink href="/map">🗺️ 本周地图</NavLink> */}

        {/* 地图 */}
        <NavLink href="/ranking">🏆 排行榜</NavLink>

        {/* 地图 */}
        <NavLink href="/history">🕒 技能更新记录</NavLink>

        {/* 数据中心（放最后） */}
        <NavLink href="/infocenter">📚 数据中心</NavLink>

      </nav>
    </div>
  );
}
