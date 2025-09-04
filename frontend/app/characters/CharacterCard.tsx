"use client";

interface Character {
  _id: string;
  name: string;
  account: string;
  server: string;
  gender: string;
  class: string;
  role: string;
  active: boolean;
}

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  return (
    <div
      key={character._id}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px",
        width: "220px",
        cursor: "pointer",
      }}
      onClick={() => (window.location.href = `/characters/${character._id}`)}
    >
      <h3>{character.name}</h3>
      <p>Account: {character.account}</p>
      <p>Server: {character.server}</p>
      <p>Gender: {character.gender}</p>
      <p>Class: {character.class}</p>
      <p>Role: {character.role}</p>
      <p>Active: {character.active ? "是" : "否"}</p>
    </div>
  );
}
