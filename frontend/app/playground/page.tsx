"use client";

import React, { useState, useEffect } from "react";
import CreateScheduleModal from "./CreateScheduleModal";
import Link from "next/link";
import styles from "./styles.module.css";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Character {
  _id: string;
  name: string;
  account: string;
  role: string;
}

interface Schedule {
  _id: string;
  server: string;
  mode: "default" | "custom";
  conflictLevel: number;
  createdAt: string;
  checkedAbilities: Ability[];
  characterCount: number;
}

export default function PlaygroundPage() {
  const [showModal, setShowModal] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/schedules`
      );
      if (!res.ok) throw new Error("Failed to fetch schedules");
      const data = await res.json();
      setSchedules(data);
    } catch (err) {
      console.error("❌ Error fetching schedules:", err);
    }
  };

  const handleConfirm = async (
    conflictLevel: number,
    server: string,
    mode: "default" | "custom",
    checkedAbilities: Ability[]
  ) => {
    try {
      // fetch characters
      const charRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/characters`
      );
      const characters: Character[] = charRes.ok ? await charRes.json() : [];

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/schedules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conflictLevel,
            server,
            mode,
            checkedAbilities,
            characterCount: characters.length,
            characters: characters.map((c) => c._id),
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to create schedule");
      await res.json();

      fetchSchedules();
    } catch (err) {
      console.error("❌ Error creating schedule:", err);
    }

    setShowModal(false);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>排表 Playground</h2>

      <button className={styles.createBtn} onClick={() => setShowModal(true)}>
        新建排表
      </button>

      {showModal && (
        <CreateScheduleModal
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
        />
      )}

      <h3 className={styles.subtitle}>已有排表</h3>
      {schedules.length === 0 ? (
        <p className={styles.empty}>暂无排表</p>
      ) : (
        <div className={styles.cardGrid}>
          {schedules.map((s) => (
            <Link key={s._id} href={`/playground/${s._id}`} className={styles.card}>
              <h4 className={styles.cardTitle}>
                {new Date(s.createdAt).toLocaleString()}
              </h4>
              <p>服务器: {s.server}</p>
              <p>模式: {s.mode}</p>
              <p>冲突等级: {s.conflictLevel}</p>
              <p>角色数量: {s.characterCount}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
