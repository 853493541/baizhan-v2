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
const rolesCN = ["输出", "防御", "治疗"];
const roleMap: Record<string, string> = {
  输出: "DPS",
  防御: "Tank",
  治疗: "Healer",
};

const classes = [
  "七秀", "五毒", "万花", "天策", "明教", "纯阳", "少林", "长歌", "药宗",
  "蓬莱", "刀宗", "凌雪", "唐门", "藏剑", "丐帮", "霸刀", "衍天", "万灵", "段氏", "苍云",
];

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
    role: rolesCN[0],
    active: true,
    owner: "",
  });

  const [warning, setWarning] = useState("");

  useEffect(() => {
    if (isOpen) {
      const lastOwner = localStorage.getItem("lastOwner") || "";
      const lastServer = localStorage.getItem("lastServer") || servers[0];
      setFormData((prev) => ({
        ...prev,
        owner: lastOwner,
        server: lastServer,
      }));
      setWarning("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let newValue =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value;

    if (name === "account") newValue = (newValue as string).toUpperCase();

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (name === "account") setWarning("");
  };

  const handleSelect = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      account: String(formData.account ?? "").trim(),
      owner: String(formData.owner ?? "").trim() || "Unknown",
      role: roleMap[formData.role] || "DPS",
    };

    const accountPattern = /^(?:[A-Z][0-9]?|[A-Z]{2})$/;
    if (!accountPattern.test(payload.account)) {
      setWarning("账号格式不正确！例: A, AA, A1");
      return;
    }

    localStorage.setItem("lastOwner", payload.owner);
    localStorage.setItem("lastServer", payload.server);

    setWarning("");
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
          {/* === Input Rows === */}
          <div className={styles.inputRow}>
            <label className={styles.inputLabel}>角色名称</label>
            <input
              type="text"
              name="name"
              placeholder="角色名"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              required
              autoComplete="off"
            />
          </div>

          <div className={styles.inputRow}>
            <label className={styles.inputLabel}>账号昵称</label>
            <input
              type="text"
              name="account"
              placeholder="账号格式：A, AA, A1"
              value={formData.account}
              onChange={handleChange}
              className={styles.input}
              required
              autoComplete="off"
            />
          </div>

          <div className={styles.inputRow}>
            <label className={styles.inputLabel}>拥有者</label>
            <input
              type="text"
              name="owner"
              placeholder="拥有者"
              value={formData.owner}
              onChange={handleChange}
              className={styles.input}
              required
              autoComplete="off"
            />
          </div>

          {/* === Button Selectors === */}
          <div className={styles.buttonGroup}>
            <label className={styles.groupLabel}>服务器</label>
            <div className={styles.buttonRow}>
              {servers.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => handleSelect("server", s)}
                  className={`${styles.optionBtn} ${
                    formData.server === s ? styles.activeBtn : ""
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <label className={styles.groupLabel}>性别</label>
            <div className={styles.buttonRow}>
              {genders.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => handleSelect("gender", g)}
                  className={`${styles.optionBtn} ${
                    formData.gender === g ? styles.activeBtn : ""
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <label className={styles.groupLabel}>定位</label>
            <div className={styles.buttonRow}>
              {rolesCN.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => handleSelect("role", r)}
                  className={`${styles.optionBtn} ${
                    formData.role === r ? styles.activeBtn : ""
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* === Class Selector === */}
          <div className={styles.inputRow}>
            <label className={styles.inputLabel}>门派</label>
            <select
              name="class"
              value={formData.class}
              onChange={handleChange}
              className={styles.select}
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Toggle Switch for 是否启用 */}
          <div className={styles.toggleRow}>
            <label className={styles.inputLabel}>是否启用</label>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {/* === Bottom Buttons === */}
          <div className={styles.actionRow}>
            {warning ? (
              <div className={styles.warning}>{warning}</div>
            ) : (
              <div className={styles.warningPlaceholder}></div>
            )}
            <div className={styles.btnRow}>
              <button type="button" onClick={onClose} className={styles.cancel}>
                取消
              </button>
              <button type="submit" className={styles.submit}>
                创建
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
