"use client";

import { useState, useEffect } from "react";
import styles from "./styles.module.css";

interface CharacterEditData {
  server: string;
  role: string;
  active: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  characterId: string;
  initialData: CharacterEditData;
}

const servers = ["梦江南", "乾坤一掷", "唯我独尊"];
const roles = [
  { key: "DPS", label: "输出" },
  { key: "Tank", label: "防御" },
  { key: "Healer", label: "治疗" },
];

export default function EditBasicInfoModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  characterId,
  initialData,
}: Props) {
  const [server, setServer] = useState(initialData.server);
  const [role, setRole] = useState(initialData.role);
  const [active, setActive] = useState(initialData.active);
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!isOpen) return;
    setServer(initialData.server);
    setRole(initialData.role);
    setActive(initialData.active);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  /* ============================
     Auto-save
  ============================ */
  const autoSave = async (field: Partial<CharacterEditData>) => {
    if (!API_URL) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/characters/${characterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(field),
      });
      if (!res.ok) throw new Error("Save failed");
      onSave();
    } catch (err) {
      console.error("Auto save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  /* ============================
     Handlers
  ============================ */
  const handleServerClick = (s: string) => {
    if (s !== server) {
      setServer(s);
      autoSave({ server: s });
    }
  };

  const handleRoleClick = (r: string) => {
    if (r !== role) {
      setRole(r);
      autoSave({ role: r });
    }
  };

  const handleToggle = () => {
    const newVal = !active;
    setActive(newVal);
    autoSave({ active: newVal });
  };

  const handleDeleteClick = () => {
    onClose();
    onDelete();
  };

  /* ============================
     Render
  ============================ */
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()} // ⛔ prevent overlay close
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>编辑基础信息</h2>
 
        </div>

        {/* 区服 */}
        <div className={styles.field}>
          <label className={styles.label}>区服</label>
          <div className={styles.optionGroup}>
            {servers.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleServerClick(s)}
                className={`${styles.optionBtn} ${
                  server === s ? styles.active : ""
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 定位 */}
        <div className={styles.field}>
          <label className={styles.label}>定位</label>
          <div className={styles.optionGroup}>
            {roles.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => handleRoleClick(r.key)}
                className={`${styles.optionBtn} ${
                  role === r.key ? styles.active : ""
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* 启用 */}
        <div className={styles.field}>
          <label className={styles.label}>是否启用</label>
          <div
            className={`${styles.toggle} ${active ? styles.on : ""}`}
            onClick={handleToggle}
          >
            <div className={styles.knob} />
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleDeleteClick}
            className={styles.delete}
            disabled={saving}
          >
            删除角色
          </button>

          <button
            type="button"
            onClick={onClose}
            className={styles.cancel}
            disabled={saving}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
