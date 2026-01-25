export interface Character {
  _id: string;
  name: string;
  account: string;
  server: "梦江南" | "乾坤一掷" | "唯我独尊";
  gender: "男" | "女";   // ✅ strict
  class: string;
  role: "DPS" | "Tank" | "Healer"; // 🔹 stricter, matches backend
  active: boolean;
  abilities: Record<string, number>;
  owner: string; // 🔹 NEW
  hasActions?: boolean;
}
