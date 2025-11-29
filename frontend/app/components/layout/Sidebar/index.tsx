"use client";

import React, { useState } from "react";
import NavLink from "../NavLink";
import styles from "./styles.module.css";

export default function Sidebar() {
  const [openCharacters, setOpenCharacters] = useState(true);
  const [openSchedule, setOpenSchedule] = useState(true);
  const [openMap, setOpenMap] = useState(true);
  const [openDataHistory, setOpenDataHistory] = useState(true);
  const [openRanking, setOpenRanking] = useState(true);

  return (
    <div className={styles.wrap}>
      <nav className={styles.nav}>

        {/* 角色 */}
        <div className={styles.folder}>
          <div
            className={styles.folderHeader}
            onClick={() => setOpenCharacters(!openCharacters)}
          >
            <span>{openCharacters ? "▾" : "▸"}</span>
            <span style={{ marginLeft: 6 }}>角色</span>
          </div>

          {openCharacters && (
            <div className={styles.folderItems}>
              <NavLink href="/characters">🧩 仓库</NavLink>
              <NavLink href="/backpack">📦 背包</NavLink>
            </div>
          )}
        </div>

        {/* 排表 */}
        <div className={styles.folder}>
          <div
            className={styles.folderHeader}
            onClick={() => setOpenSchedule(!openSchedule)}
          >
            <span>{openSchedule ? "▾" : "▸"}</span>
            <span style={{ marginLeft: 6 }}>排表</span>
          </div>

          {openSchedule && (
            <div className={styles.folderItems}>
              <NavLink href="/playground">📊 标准</NavLink>
              <NavLink href="/targetedplans">🎯 荡剑恩仇</NavLink>
            </div>
          )}
        </div>

        {/* 地图 */}
        <div className={styles.folder}>
          <div
            className={styles.folderHeader}
            onClick={() => setOpenMap(!openMap)}
          >
            <span>{openMap ? "▾" : "▸"}</span>
            <span style={{ marginLeft: 6 }}>地图</span>
          </div>

          {openMap && (
            <div className={styles.folderItems}>
              <NavLink href="/map">🗺️ 本周</NavLink>
              <NavLink href="/map/history">🗂️ 历史</NavLink>
            </div>
          )}
        </div>

        {/* 数据历史 */}
        <div className={styles.folder}>
          <div
            className={styles.folderHeader}
            onClick={() => setOpenDataHistory(!openDataHistory)}
          >
            <span>{openDataHistory ? "▾" : "▸"}</span>
            <span style={{ marginLeft: 6 }}>数据历史</span>
          </div>

          {openDataHistory && (
            <div className={styles.folderItems}>
              <NavLink href="/history">📜 技能</NavLink>
              <div className={styles.placeholderItem}>🎒 背包</div>
            </div>
          )}
        </div>

        {/* 排行榜 */}
        <div className={styles.folder}>
          <div
            className={styles.folderHeader}
            onClick={() => setOpenRanking(!openRanking)}
          >
            <span>{openRanking ? "▾" : "▸"}</span>
            <span style={{ marginLeft: 6 }}>数据</span>
          </div>

          {openRanking && (
            <div className={styles.folderItems}>
              <NavLink href="/stats/appearances">📊 上班统计</NavLink>
              <div className={styles.placeholderItem}>📈 技能</div>
            </div>
          )}
        </div>

      </nav>
    </div>
  );
}
