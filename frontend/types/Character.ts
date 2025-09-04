export interface Character {
  _id: string;
  name: string;
  account: string;
  server: string;
  gender: "男" | "女";   // ✅ strict
  class: string;
  role: string;
  active: boolean;
  abilities: Record<string, number>;
}
