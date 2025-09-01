from playwright.sync_api import sync_playwright
from collections import defaultdict
import json
import time

url = "https://www.jx3box.com/fb/baizhan?tab=skill"

boss_to_skills = defaultdict(list)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(url)

    # Wait until the table actually has data
    page.wait_for_selector("table tr >> nth=1", timeout=60000)

    rows = page.query_selector_all("table tr")[1:]  # skip header
    print(f"[DEBUG] Found {len(rows)} rows in table")

    for row in rows:
        cells = row.query_selector_all("td")
        if len(cells) >= 2:
            skill = cells[0].inner_text().strip()
            boss = cells[1].inner_text().strip()
            if skill and boss:
                boss_to_skills[boss].append(skill)

    browser.close()

with open("boss_skills.json", "w", encoding="utf-8") as f:
    json.dump(boss_to_skills, f, ensure_ascii=False, indent=2)

print(f"✅ Saved boss_skills.json with {len(boss_to_skills)} bosses")
print("Sample:", dict(list(boss_to_skills.items())[:5]))
