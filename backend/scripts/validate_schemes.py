import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.models import Scheme

root = Path(__file__).resolve().parents[2]
paths = sorted((root / "data" / "schemes").glob("*.json"))
errors = []
for path in paths:
    try:
        Scheme.model_validate(json.loads(path.read_text(encoding="utf-8")))
    except Exception as exc:
        errors.append(f"{path.name}: {exc}")
if errors:
    raise SystemExit("\n".join(errors))
print(f"Validated {len(paths)} scheme records")
