export async function updateCharacterAbilities(
  id: string,
  updates: Record<string, number>
) {
  const res = await fetch(`http://localhost:5000/api/characters/${id}/abilities`, {
    method: "PATCH", // ✅ match backend route
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ abilities: updates }), // ✅ keep wrapped in "abilities"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Update abilities failed: ${res.status} ${res.statusText} ${text}`);
  }

  return res.json();
}
