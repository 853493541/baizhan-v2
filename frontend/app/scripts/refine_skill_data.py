import json
import re
from pathlib import Path

# === CONFIG ===
DATA_FILE = Path("frontend/app/data/skill_data.json")
KEEP_LEVELS_FROM = 8  # keep lv8–lv10 only

# === helpers ===
def trim_levels(match: re.Match) -> str:
    """
    <lv1 / lv2 / ... / lv10> → keep lv8–lv10
    """
    raw = match.group(1)
    parts = [p.strip() for p in raw.split("/")]

    if len(parts) < 10:
        return f"<{raw}>"

    start = KEEP_LEVELS_FROM - 1  # lv8 → index 7
    trimmed = parts[start:start + 3]
    return "<" + " / ".join(trimmed) + ">"

def num_to_wan(n: int) -> str:
    """
    Convert number to 万 with rounding, no decimals
    """
    return f"{round(n / 10000)}万"

def convert_numbers_to_wan(match: re.Match) -> str:
    """
    Inside <...>, convert large numbers to 万
    """
    content = match.group(1)
    parts = [p.strip() for p in content.split("/")]

    new_parts = []
    for p in parts:
        if p.isdigit():
            val = int(p)
            if val >= 1_000_000:
                new_parts.append(num_to_wan(val))
            else:
                new_parts.append(p)
        else:
            new_parts.append(p)

    return "<" + " / ".join(new_parts) + ">"

# === main ===
def main():
    with DATA_FILE.open("r", encoding="utf-8") as f:
        skills = json.load(f)

    refined = []

    for s in skills:
        desc = s.get("desc", "")

        # 1️⃣ trim to lv8–lv10
        desc = re.sub(r"<([^<>]+)>", trim_levels, desc)

        # 2️⃣ convert big numbers → 万
        desc = re.sub(r"<([^<>]+)>", convert_numbers_to_wan, desc)

        refined.append({
            "name": s["name"],
            "desc": desc
        })

    # overwrite same file
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(refined, f, ensure_ascii=False, indent=2)

    print(f"✅ Processed {len(refined)} skills")
    print(f"✍️ Updated → {DATA_FILE}")

if __name__ == "__main__":
    main()
