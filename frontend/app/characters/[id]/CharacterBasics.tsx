"use client";

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

interface CharacterBasicsProps {
  character: Character;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CharacterBasics({
  character,
  onEdit,
  onDelete,
}: CharacterBasicsProps) {
  const genderLabel = character.gender === "男" ? "男 ♂" : "女 ♀";

  return (
    <div style={{ marginBottom: 24 }}>
      <h2>{character.name}</h2>
      <p>账号: {character.account}</p>
      <p>区服: {character.server}</p>
      <p>性别: {genderLabel}</p>
      <p>门派: {character.class}</p>
      <p>定位: {character.role}</p>
      <p>是否启用: {character.active ? "是" : "否"}</p>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={onEdit}
          style={{
            marginRight: 12,
            padding: "8px 16px",
            background: "orange",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          编辑角色
        </button>

        <button
          onClick={onDelete}
          style={{
            padding: "8px 16px",
            background: "red",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          删除角色
        </button>
      </div>
    </div>
  );
}
