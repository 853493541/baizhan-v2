"use client";

interface CharacterAbilitiesProps {
  abilities: Record<string, number>;
}

const levelOrder = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function CharacterAbilities({ abilities }: CharacterAbilitiesProps) {
  // Group abilities by level (value)
  const grouped: Record<number, string[]> = {};
  for (const [name, value] of Object.entries(abilities)) {
    if (!grouped[value]) grouped[value] = [];
    grouped[value].push(name);
  }

  // Sort alphabetically inside each level for stable display
  for (const lvl of Object.keys(grouped)) {
    grouped[Number(lvl)].sort();
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      {levelOrder.map((lvl) => {
        if (!grouped[lvl] || grouped[lvl].length === 0) return null;
        return (
          <div key={lvl}>
            {/* Level header */}
            <h3 style={{ color: "#d4af37", marginBottom: "8px" }}>
              {lvl}重
            </h3>

            {/* Abilities grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: "8px 16px",
              }}
            >
              {grouped[lvl].map((name) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px",
                  }}
                >
                  {/* Placeholder for icon */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      background: "#333",
                    }}
                  />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
