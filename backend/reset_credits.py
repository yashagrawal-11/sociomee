import json
from pathlib import Path
from datetime import datetime, timezone

DATA_FILE = Path(__file__).resolve().parent / "credits_data.json"

# Wipe old data completely
data = {}
DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
print(f"credits_data.json cleared at {DATA_FILE}")
print("All users will get fresh 20 credits on next login.")