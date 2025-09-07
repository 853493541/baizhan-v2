export async function updateCharacterAbilities(
  id: string,
  updates: Record<string, number>
) {
  // ✅ Always wrap in { abilities: updates }
  const payload = { abilities: updates };

  console.log("📤 Sending payload to backend:", payload);

  const res = await fetch(
    `http://localhost:5000/api/characters/${id}/abilities`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("❌ Backend rejected update:", text);
    throw new Error(
      `Update abilities failed: ${res.status} ${res.statusText} ${text}`
    );
  }

  return res.json();
}
