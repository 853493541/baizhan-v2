"use client";

import { useEffect, useState } from "react";

interface Character {
  _id: string;
  characterId: string;
  account: string;
  server: string;
  gender: string;
  class: string;
}

export default function CharacterStoragePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [characterId, setCharacterId] = useState("");
  const [account, setAccount] = useState("");
  const [server, setServer] = useState("");
  const [gender, setGender] = useState("");
  const [charClass, setCharClass] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/characters")
      .then((res) => res.json())
      .then((data) => {
        setCharacters(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load characters");
        setLoading(false);
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          account,
          server,
          gender,
          class: charClass,
        }),
      });
      if (!res.ok) throw new Error("Failed to create character");
      const newChar = await res.json();
      setCharacters([...characters, newChar]);

      // Reset form
      setCharacterId("");
      setAccount("");
      setServer("");
      setGender("");
      setCharClass("");
    } catch (err) {
      console.error(err);
      alert("Error creating character");
    }
  };

  if (loading) return <p>Loading characters...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Character Storage</h1>

      {/* Character cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {characters.map((char) => (
          <div
            key={char._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "12px",
              width: "220px",
              cursor: "pointer",
            }}
            onClick={() =>
              (window.location.href = `/characters/${char._id}`)
            }
          >
            <h3>{char.characterId}</h3>
            <p>Account: {char.account}</p>
            <p>Server: {char.server}</p>
            <p>Gender: {char.gender}</p>
            <p>Class: {char.class}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      <h2 style={{ marginTop: "32px" }}>Create Character</h2>
      <form onSubmit={handleCreate} style={{ display: "grid", gap: "8px", maxWidth: "400px" }}>
        <input
          placeholder="角色ID"
          value={characterId}
          onChange={(e) => setCharacterId(e.target.value)}
          required
        />
        <input
          placeholder="所属账号"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          required
        />
        <input
          placeholder="区服"
          value={server}
          onChange={(e) => setServer(e.target.value)}
          required
        />
        <input
          placeholder="性别"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          required
        />
        <input
          placeholder="职业"
          value={charClass}
          onChange={(e) => setCharClass(e.target.value)}
          required
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
