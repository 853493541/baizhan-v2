"use client";

import { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { getDefaultAbilityPool } from "@/utils/playgroundHelpers";
import {
  toastError,
  toastSuccess,
} from "@/app/components/toast/toast";

interface Ability {
  name: string;
  level: number;
  available: boolean;
}

interface Props {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

const SERVERS = ["乾坤一掷", "唯我独尊", "梦江南"];
const ALL_SERVERS = "全服";

/*
  ✅ Preset Structure

  key = internal id
  label = what user sees (and used in naming)
  owners = owner filter list
*/
const OWNER_GROUPS = {
  group1: {
    label: "猫猫糕",
    owners: ["猫猫糕", "桔子", "甜妹", "阿绰"],
  },
  group2: {
    label: "五溪",
    owners: ["豆子", "五溪", "风袖"],
  },
};

function generateTimestampName(
  server: string,
  groupLabel: string | null
) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  // If group selected → replace server in name
  if (groupLabel) {
    return `${groupLabel}${mm}${dd}-${hh}${min}`;
  }

  return `${server}${mm}${dd}-${hh}${min}`;
}

export default function CreateScheduleModal({
  onClose,
  onConfirm,
}: Props) {
  const [server, setServer] = useState<string>(ALL_SERVERS);
  const [name, setName] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<
    keyof typeof OWNER_GROUPS | null
  >(null);

  /* ✅ Initial Auto Name */
  useEffect(() => {
    setName(generateTimestampName(ALL_SERVERS, null));
    toastSuccess("已自动选择全服");
  }, []);

  const handleSelectServer = (s: string) => {
    setServer(s);

    const groupLabel = selectedGroup
      ? OWNER_GROUPS[selectedGroup].label
      : null;

    setName(generateTimestampName(s, groupLabel));
  };

  const handleSelectGroup = (
    key: keyof typeof OWNER_GROUPS
  ) => {
    const newGroup =
      selectedGroup === key ? null : key;

    setSelectedGroup(newGroup);

    const groupLabel = newGroup
      ? OWNER_GROUPS[newGroup].label
      : null;

    setName(generateTimestampName(server, groupLabel));
  };

  const handleSubmit = async () => {
    if (!server) {
      toastError("请选择服务器后再创建排表。");
      return;
    }

    try {
      const url =
        server === ALL_SERVERS
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/characters`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/characters?server=${server}`;

      const charRes = await fetch(url);
      if (!charRes.ok)
        throw new Error("Failed to fetch characters");

      const characters = await charRes.json();

      let filteredCharacters = characters;

      // ✅ Owner filtering
      if (selectedGroup) {
        const allowedOwners =
          OWNER_GROUPS[selectedGroup].owners;

        filteredCharacters = filteredCharacters.filter(
          (c: any) =>
            allowedOwners.includes(c.owner)
        );
      }

      // ✅ Active filtering
      filteredCharacters =
        filteredCharacters.filter(
          (c: any) => c.active
        );

      if (filteredCharacters.length === 0) {
        toastError("没有符合条件的角色。");
        return;
      }

      const poolRaw =
        await getDefaultAbilityPool();

      const fullPool: Ability[] =
        poolRaw.map((a) => ({
          ...a,
          available: true,
        }));

      const payload = {
        name: name || "未命名排表",
        server, // submit unaffected
        checkedAbilities: fullPool,
        characterCount:
          filteredCharacters.length,
        characters: filteredCharacters.map(
          (c: any) => c._id
        ),
        groups: [],
      };

      onConfirm(payload);
      onClose();
    } catch (err) {
      console.error(
        "❌ [CreateModal] Error creating schedule:",
        err
      );
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <h2 className={styles.title}>
          新建排表
        </h2>

        {/* ================= SERVER ================= */}
        <div className={styles.label}>
          服务器
        </div>
        <div className={styles.serverButtons}>
          {[ALL_SERVERS, ...SERVERS].map(
            (s) => (
              <button
                key={s}
                type="button"
                className={`${styles.serverBtn} ${
                  server === s
                    ? styles.selected
                    : ""
                }`}
                onClick={() =>
                  handleSelectServer(s)
                }
              >
                {s}
              </button>
            )
          )}
        </div>

        {/* ================= GROUP ================= */}
        <div className={styles.label}>
          分组
        </div>
        <div className={styles.serverButtons}>
          {Object.entries(
            OWNER_GROUPS
          ).map(([key, value]) => (
            <button
              key={key}
              type="button"
              className={`${styles.serverBtn} ${
                selectedGroup === key
                  ? styles.selected
                  : ""
              }`}
              onClick={() =>
                handleSelectGroup(
                  key as keyof typeof OWNER_GROUPS
                )
              }
            >
              {value.label}
            </button>
          ))}
        </div>

        {/* ================= NAME ================= */}
        <label className={styles.label}>
          排表名称
          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="输入排表名称"
            className={styles.input}
          />
        </label>

        {/* ================= ACTIONS ================= */}
        <div className={styles.actions}>
          <button
            className={styles.btnSecondary}
            onClick={onClose}
          >
            取消
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}