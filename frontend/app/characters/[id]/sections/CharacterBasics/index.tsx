"use client";

import { useState, useEffect } from "react";
import { FaCog } from "react-icons/fa"; // ⚙️ gear icon
import styles from "./styles.module.css";

interface Character {
  _id: string;
  name: string;
  account: string;
  server: string;
  gender: "男" | "女";
  class: string;
  role: "DPS" | "Tank" | "Healer";
  active: boolean;
}

export interface CharacterEditData {
  server: string;
  role: string;
  active: boolean;
}

interface CharacterBasicsProps {
  character: Character;
  onSave: (data: CharacterEditData) => void;
  onDelete: () => void;
}

const servers = ["梦江南", "乾坤一掷", "唯我独尊"];
const roles = ["DPS", "Tank", "Healer"];

export default function CharacterBasics({
  character,
  onSave,
  onDelete,
}: CharacterBasicsProps) {
  const [isModalOpen, setModalOpen] = useState(false);
  const genderLabel = character.gender === "男" ? "男 ♂" : "女 ♀";

  const roleClass =
    character.role === "Tank"
      ? styles.tank
      : character.role === "Healer"
      ? styles.healer
      : styles.dps;

  return (
    <>
      <div className={`${styles.card} ${roleClass}`}>
        {/* Edit button at top-right */}
        <button
          onClick={() => setModalOpen(true)}
          className={styles.iconButton}
          aria-label="编辑角色"
        >
          <FaCog />
        </button>

        <div className={styles.info}>
          <h2 className={styles.name}>{character.name}</h2>
          <p>区服: {character.server}</p>
          <p>性别: {genderLabel}</p>
          <p>门派: {character.class}</p>
        </div>
      </div>

      {isModalOpen && (
        <CharacterEditModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={onSave}
          onDelete={onDelete}
          initialData={{
            server: character.server,
            role: character.role,
            active: character.active,
          }}
        />
      )}
    </>
  );
}

// ======================
// Edit Modal inline
// ======================
interface CharacterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CharacterEditData) => void;
  onDelete: () => void;
  initialData: CharacterEditData;
}

function CharacterEditModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}: CharacterEditModalProps) {
  const [server, setServer] = useState(initialData.server);
  const [role, setRole] = useState(initialData.role);
  const [active, setActive] = useState(initialData.active);

  useEffect(() => {
    setServer(initialData.server);
    setRole(initialData.role);
    setActive(initialData.active);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ server, role, active });
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 style={{ marginBottom: 16 }}>编辑角色</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <label>
            区服:
            <select
              value={server}
              onChange={(e) => setServer(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              {servers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            定位:
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ marginLeft: 8 }}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label>
            是否启用:
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ marginLeft: 8 }}
            />
          </label>

          <div className={styles.modalActions}>
            <button type="button" onClick={onDelete} className={styles.delete}>
              删除角色
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={onClose} className={styles.cancel}>
                取消
              </button>
              <button type="submit" className={styles.save}>
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
