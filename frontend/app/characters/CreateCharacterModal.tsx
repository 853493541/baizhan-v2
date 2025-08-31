"use client";

import { useState } from "react";

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
}

const servers = ["梦江南", "乾坤一掷", "唯我独尊"];
const genders = ["女", "男"];   // 女 first now
const classes = [
  "七秀","五毒","万花","天策","明教","纯阳","少林","长歌","药宗",
  "蓬莱","刀宗","凌雪","唐门","藏剑","丐帮","霸刀","衍天","万灵","段氏","苍云"
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
    gender: genders[0],   // now defaults to 女
    class: classes[0],
    role: roles[0],
    active: true,
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
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

        <h2 className="text-xl mb-4">创建新角色</h2>
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
          <input
            type="text"
            name="account"
            placeholder="账号"
            value={formData.account}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <select name="server" value={formData.server} onChange={handleChange} className="w-full border p-2 rounded">
            {servers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border p-2 rounded">
            {genders.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select name="class" value={formData.class} onChange={handleChange} className="w-full border p-2 rounded">
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="role" value={formData.role} onChange={handleChange} className="w-full border p-2 rounded">
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
            <span>是否启用</span>
          </label>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">取消</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">创建</button>
          </div>
        </form>
      </div>
    </div>
  );
}
