#!/usr/bin/env python3
# scripts/refine_skill_data.py

import json
import argparse
from pathlib import Path

def load_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path: Path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def normalize_name(s: str) -> str:
    return s.strip() if isinstance(s, str) else ""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True, help="skill_data.json")
    parser.add_argument("--cdcolor", required=True, help="skill_data_cd_color.json")
    parser.add_argument("--out", required=True, help="output json")
    args = parser.parse_args()

    base_path = Path(args.base)
    cdcolor_path = Path(args.cdcolor)
    out_path = Path(args.out)

    base_data = load_json(base_path)
    cdcolor_data = load_json(cdcolor_path)

    # build lookup by skillName
    cd_map = {}
    for row in cdcolor_data:
        name = normalize_name(row.get("skillName"))
        if not name:
            continue
        cd_map[name] = {
            "breakColor": row.get("breakColor"),
            "cooldown": row.get("cooldown"),
        }

    merged = []
    for item in base_data:
        name = normalize_name(item.get("name"))
        extra = cd_map.get(name, {})
        merged.append({
            **item,
            "breakColor": extra.get("breakColor"),
            "cooldown": extra.get("cooldown"),
        })

    save_json(out_path, merged)

if __name__ == "__main__":
    main()
