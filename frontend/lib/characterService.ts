export async function updateCharacterAbilities(
  id: string,
  updates: Record<string, number>
) {
  const res = await fetch(`http://localhost:5000/api/characters/${id}/abilities`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ abilities: updates }),
  });
  if (!res.ok) throw new Error("Update abilities failed");
  return res.json();
}
