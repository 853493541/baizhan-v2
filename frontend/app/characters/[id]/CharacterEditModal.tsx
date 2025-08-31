"use client";

import { useState, useEffect } from "react";

interface CharacterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { server: string; role: string; active: boolean }) => void;
  initialData: { server: string; role: string; active: boolean };
}

const servers = ["梦江南", "乾坤一掷", "唯我独尊"];
const roles = ["DPS", "Tank", "Healer"];

export default function CharacterEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CharacterEditModalProps) {
  const [server, setServer] = useState(initialData.server);
  const [role, setRole] = useState(initialData.role);
  const [active, setActive] = useState(initialData.active);

  // Reset values when opening
  useEffect(() => {
    setServer(initialData.server);
    setRole(initialData.role);
    setActive(initialData.active);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ server, role, active });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          width: "400px",
        }}
      >
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "6px 12px", background: "#ccc", border: "none", borderRadius: 6 }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                padding: "6px 12px",
                background: "blue",
                color: "white",
                border: "none",
                borderRadius: 6,
              }}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
