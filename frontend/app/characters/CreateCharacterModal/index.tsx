"use client";

import { useState, useEffect } from "react";
import styles from "./styles.module.css";

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

const servers = ["梦江南", "乾坤一掷", "唯我独尊"];
const genders = ["女", "男"];
const classes = [
  "七秀", "五毒", "万花", "天策", "明教", "纯阳", "少林", "长歌", "药宗",
  "蓬莱", "刀宗", "凌雪", "唐门", "藏剑", "丐帮", "霸刀", "衍天", "万灵", "段氏", "苍云"
];
const roles = ["DPS", "Tank", "Healer"];

export default function CreateCharacterModal({
  isOpen,
  onClose,
  onCreate,
}: CreateCharacterModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    account: "",
    server: servers[0],
    gender: genders[0],
    class: classes[0],
    role: roles[0],
    active: true,
    owner: "",
  });

  useEffect(() => {
    if (isOpen) {
      const lastOwner = localStorage.getItem("lastOwner") || "";
      setFormData((prev) => ({ ...prev, owner: lastOwner }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      account: String(formData.account ?? "").trim(),
      owner: String(formData.owner ?? "").trim() || "Unknown",
    };

    localStorage.setItem("lastOwner", payload.owner);

    if (!payload.account) {
      alert("账号不能为空！");
      return;
    }

    onCreate(payload);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className={styles.close}>
          ✕
        </button>

        <h2 className={styles.title}>创建新角色</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="角色名"
            value={formData.name}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="text"
            name="account"
            placeholder="账号"
            value={formData.account}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="text"
            name="owner"
            placeholder="拥有者"
            value={formData.owner}
            onChange={handleChange}
            className={styles.input}
            required
          />

          <select name="server" value={formData.server} onChange={handleChange} className={styles.select}>
            {servers.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="gender" value={formData.gender} onChange={handleChange} className={styles.select}>
            {genders.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select name="class" value={formData.class} onChange={handleChange} className={styles.select}>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="role" value={formData.role} onChange={handleChange} className={styles.select}>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <label className={styles.checkbox}>
            <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
            <span>是否启用</span>
          </label>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancel}>
              取消
            </button>
            <button type="submit" className={styles.submit}>
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
