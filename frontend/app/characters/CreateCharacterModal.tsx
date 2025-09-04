"use client";

import { useEffect, useState } from "react";

export type CharacterEditData = {
  name: string;                     // ✅ added
  server: string;
  role: "DPS" | "Tank" | "Healer";
  active: boolean;
};

interface CharacterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CharacterEditData) => void | Promise<void>;
  initialData: CharacterEditData;   // ✅ now matches CharacterDetailPage
}

const servers = ["梦江南", "乾坤一掷", "唯我独尊"];
const roles = ["DPS", "Tank", "Healer"] as const;

export default function CharacterEditModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CharacterEditModalProps) {
  const [formData, setFormData] = useState<CharacterEditData>(initialData);

  // keep modal synced if props change
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue as never,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-xl p-6 w-[400px] shadow-lg relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        <h2 className="text-xl mb-4">编辑角色</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            placeholder="角色名"
            value={formData.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />

          <select
            name="server"
            value={formData.server}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            {servers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
            />
            <span>是否启用</span>
          </label>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
