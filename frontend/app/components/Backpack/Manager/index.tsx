"use client";

import React, { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";
import styles from "./styles.module.css";
import AddBackpackModal from "../AddBackpackModal";
import { createPinyinMap, pinyinFilter } from "../../../../utils/pinyinSearch";

interface StorageItem {
  ability: string;
  level: number;
  used?: boolean;
}

interface Character {
  _id: string;
  name?: string;
  abilities?: Record<string, number>;
  storage?: StorageItem[];
}

interface Props {
  char: Character;
  API_URL: string;
  onClose: () => void;
  onUpdated: (newChar: Character) => void;
}

const getAbilityIcon = (name: string) => `/icons/${name}.png`;

export default function Manager({ char, API_URL, onClose, onUpdated }: Props) {
  const [localChar, setLocalChar] = useState<Character>(char);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const pinyinMap = useMemo(() => {
    const names = (localChar.storage || []).map((s) => s.ability);
    return createPinyinMap(names);
  }, [localChar]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = localChar.storage || [];
    if (!q) return list;
    const abilityNames = list.map((it) => it.ability);
    const filteredNames = pinyinFilter(abilityNames, pinyinMap, q);
    return list.filter((it) => filteredNames.includes(it.ability));
  }, [search, localChar, pinyinMap]);

  const refreshCharacter = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/characters/${char._id}`);
      if (!res.ok) throw new Error("加载角色失败");
      const data = await res.json();
      setLocalChar(data);
      onUpdated(data);
    } catch (e) {
      alert("刷新失败，请稍后再试");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runWithRefresh = async (action: () => Promise<void>) => {
    try {
      await action();
      await refreshCharacter();
    } catch (err) {
      console.error("❌ action failed:", err);
      alert("操作失败，请稍后再试");
    }
  };

  const handleUse = (item: StorageItem) =>
    runWithRefresh(async () => {
      if (!confirm(`确定要使用 ${item.ability}：${item.level}重 吗？`)) return;
      const res = await fetch(
        `${API_URL}/api/characters/${char._id}/storage/use`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        }
      );
      if (!res.ok) throw new Error("使用失败");
    });

  const handleDelete = (item: StorageItem) =>
    runWithRefresh(async () => {
      if (!confirm(`确定要删除 ${item.ability}：${item.level}重 吗？`)) return;
      const res = await fetch(
        `${API_URL}/api/characters/${char._id}/storage/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ability: item.ability, level: item.level }),
        }
      );
      if (!res.ok) throw new Error("删除失败");
    });

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <h2>全部技能 {loading && <span>加载中...</span>}</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.topBar}>
            <input
              className={styles.search}
              placeholder="搜索技能..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className={styles.addBtn}
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={18} /> 添加书籍
            </button>
          </div>

          {!filteredItems.length && (
            <p className={styles.empty}>没有找到相关技能</p>
          )}

          <ul className={styles.itemList}>
            {filteredItems.map((item, idx) => (
              <li
                key={`${item.ability}-${idx}`}
                className={`${styles.itemRow} ${
                  item.used ? styles.itemUsed : ""
                }`}
              >
                <div className={styles.itemLeft}>
                  <img
                    src={getAbilityIcon(item.ability)}
                    alt={item.ability}
                    className={styles.abilityIcon}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <span className={styles.abilityText}>
                    {item.ability}：{item.level}重
                  </span>
                </div>

                <div className={styles.buttons}>
                  {!item.used && (
                    <button
                      onClick={() => handleUse(item)}
                      className={`${styles.btn} ${styles.useBtn}`}
                    >
                      使用
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item)}
                    className={`${styles.btn} ${styles.deleteBtn}`}
                  >
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className={styles.footer}>
            <button onClick={onClose} className={styles.cancelBtn}>
              关闭
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddBackpackModal
          API_URL={API_URL}
          characterId={char._id}
          onClose={() => setShowAddModal(false)}
          onAdded={refreshCharacter}
        />
      )}
    </>
  );
}
