const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function updateCharacterAbilities(
  id: string,
  updates: Record<string, number>
) {
  const payload = { abilities: updates };
  console.log("📤 Sending payload to backend:", payload);

  const res = await fetch(`${API_URL}/api/characters/${id}/abilities`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("❌ Backend rejected update:", text);
    throw new Error(
      `Update abilities failed: ${res.status} ${res.statusText} ${text}`
    );
  }

  return res.json();
}
