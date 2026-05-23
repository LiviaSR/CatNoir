"""
Detect catalogue changes and append dated lines to catalog_updates.json.

Used by convertion_to_json.py (generate / patch) and --changelog for hand-edited JSON.
"""
from __future__ import annotations

import json
import math
from datetime import date
from pathlib import Path
from typing import Any

JSON_FILE = Path(__file__).parent / "BH_Catalog.json"
UPDATES_FILE = Path(__file__).parent / "catalog_updates.json"
SNAPSHOT_FILE = Path(__file__).parent / "BH_Catalog.snapshot.json"

FIELD_KEYS = (
    "P_orb",
    "K_cp",
    "e",
    "orb_angle",
    "q",
    "m_literat",
    "m_bh",
)

# Short labels used in auto-generated update lines
FIELD_UPDATE_LABELS = {
    "P_orb": "P_b",
    "K_cp": "K_cp",
    "e": "eccentricity",
    "orb_angle": "inclination",
    "q": "mass ratio q",
    "m_literat": "M_lit",
    "m_bh": "Mass",
}


def format_date(d: date | None = None) -> str:
    """Date string for the updates page (day only, DD/MM/YYYY)."""
    return (d or date.today()).strftime("%d/%m/%Y")


def load_updates() -> list[dict[str, str]]:
    if not UPDATES_FILE.exists():
        return []
    try:
        with open(UPDATES_FILE, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError, TypeError):
        return []
    if not isinstance(data, list):
        return []
    out = []
    for item in data:
        if isinstance(item, dict) and item.get("date") and item.get("message"):
            out.append(
                {"date": str(item["date"]).strip(), "message": str(item["message"]).strip()}
            )
    return out


def save_updates(entries: list[dict[str, str]]) -> None:
    with open(UPDATES_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=4, ensure_ascii=False)
        f.write("\n")


def load_snapshot() -> list[dict[str, Any]] | None:
    if not SNAPSHOT_FILE.exists():
        return None
    try:
        with open(SNAPSHOT_FILE, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError, TypeError):
        return None
    return data if isinstance(data, list) else None


def save_snapshot(catalog: list[dict[str, Any]]) -> None:
    with open(SNAPSHOT_FILE, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=4, ensure_ascii=False)
        f.write("\n")


def _num_equal(a: Any, b: Any) -> bool:
    if a is None and b is None:
        return True
    if a is None or b is None:
        return False
    try:
        return math.isclose(float(a), float(b), rel_tol=1e-9, abs_tol=1e-12)
    except (TypeError, ValueError):
        return a == b


def field_snapshot(field: Any) -> tuple | None:
    if not isinstance(field, dict):
        return None
    unc = field.get("uncertainty") or {}
    return (
        field.get("type"),
        field.get("value"),
        unc.get("symmetrical"),
        unc.get("up"),
        unc.get("down"),
    )


def fields_equal(old_field: Any, new_field: Any) -> bool:
    o, n = field_snapshot(old_field), field_snapshot(new_field)
    if o is None and n is None:
        return True
    if o is None or n is None:
        return False
    for ov, nv in zip(o, n):
        if isinstance(ov, (int, float)) or isinstance(nv, (int, float)):
            if not _num_equal(ov, nv):
                return False
        elif ov != nv:
            return False
    return True


def catalog_by_name(catalog: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for entry in catalog:
        if isinstance(entry, dict) and entry.get("name"):
            out[str(entry["name"])] = entry
    return out


def diff_entries(old_entry: dict[str, Any], new_entry: dict[str, Any]) -> list[str]:
    name = str(new_entry["name"])
    messages: list[str] = []

    if (old_entry.get("Type") or "") != (new_entry.get("Type") or ""):
        messages.append(f"Type updated for system {name}")

    old_simbad = (old_entry.get("simbad") or "").strip() if old_entry.get("simbad") else ""
    new_simbad = (new_entry.get("simbad") or "").strip() if new_entry.get("simbad") else ""
    if old_simbad != new_simbad:
        messages.append(f"SIMBAD link updated for system {name}")

    for field_name in FIELD_KEYS:
        if fields_equal(old_entry.get(field_name), new_entry.get(field_name)):
            continue
        label = FIELD_UPDATE_LABELS.get(field_name, field_name)
        if field_name == "m_bh":
            messages.append(f"Mass updated for system {name}")
        else:
            messages.append(f"{label} updated for system {name}")

    return messages


def diff_catalogs(
    old_catalog: list[dict[str, Any]], new_catalog: list[dict[str, Any]]
) -> list[str]:
    old_by = catalog_by_name(old_catalog)
    new_by = catalog_by_name(new_catalog)
    messages: list[str] = []

    for name in sorted(set(new_by) - set(old_by)):
        messages.append(f"Add system {name}")

    for name in sorted(set(old_by) - set(new_by)):
        messages.append(f"Remove system {name}")

    for name in sorted(set(old_by) & set(new_by)):
        messages.extend(diff_entries(old_by[name], new_by[name]))

    return messages


def append_updates(messages: list[str], day: str | None = None) -> int:
    if not messages:
        return 0
    day = day or format_date()
    entries = load_updates()
    existing = {(e["date"], e["message"]) for e in entries}
    added = 0
    for msg in messages:
        key = (day, msg)
        if key in existing:
            continue
        entries.insert(0, {"date": day, "message": msg})
        existing.add(key)
        added += 1
    if added:
        save_updates(entries)
    return added


def record_catalog_changes(
    old_catalog: list[dict[str, Any]] | None, new_catalog: list[dict[str, Any]]
) -> int:
    """
    Compare old vs new catalogue, append update lines, refresh snapshot.
    If old_catalog is None (no prior JSON), only create snapshot — no auto entries.
    """
    save_snapshot(new_catalog)
    if old_catalog is None:
        return 0
    messages = diff_catalogs(old_catalog, new_catalog)
    return append_updates(messages)


def sync_changelog_from_disk() -> int:
    """Compare BH_Catalog.json to the last snapshot (for manual JSON edits)."""
    if not JSON_FILE.exists():
        print(f"No {JSON_FILE.name} found.")
        return 0
    with open(JSON_FILE, encoding="utf-8") as f:
        new_catalog = json.load(f)
    if not isinstance(new_catalog, list):
        print("Catalog JSON must be a list.")
        return 0
    old_catalog = load_snapshot()
    if old_catalog is None:
        save_snapshot(new_catalog)
        print(f"Created baseline {SNAPSHOT_FILE.name} (no changelog entries).")
        return 0
    n = record_catalog_changes(old_catalog, new_catalog)
    if n:
        print(f"Recorded {n} update(s) in {UPDATES_FILE.name}.")
    else:
        print("No catalogue changes detected.")
        # Snapshot already updated in record_catalog_changes
    return n
