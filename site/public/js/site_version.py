"""
Semantic versioning for CatNoir (site + catalogue).

  MAJOR — breaking / manual milestone (--bump-major)
  MINOR — catalogue data changes (auto on catalog diff)
  PATCH — website bug fixes (--bump-patch)
"""
from __future__ import annotations

import json
import re
from pathlib import Path

VERSION_FILE = Path(__file__).parent / "site_version.json"
REPO_ROOT = Path(__file__).resolve().parents[3]
PACKAGE_JSON = REPO_ROOT / "package.json"

_VERSION_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")


def parse_version(version: str) -> tuple[int, int, int]:
    m = _VERSION_RE.match(str(version).strip())
    if not m:
        raise ValueError(f"Invalid version {version!r} (expected MAJOR.MINOR.PATCH)")
    return int(m.group(1)), int(m.group(2)), int(m.group(3))


def format_version(parts: tuple[int, int, int]) -> str:
    return f"{parts[0]}.{parts[1]}.{parts[2]}"


def load_version() -> str:
    if not VERSION_FILE.exists():
        return "1.0.0"
    try:
        with open(VERSION_FILE, encoding="utf-8") as f:
            data = json.load(f)
        v = data.get("version") if isinstance(data, dict) else None
        if v:
            parse_version(str(v))
            return str(v).strip()
    except (json.JSONDecodeError, OSError, TypeError, ValueError):
        pass
    return "1.0.0"


def save_version(version: str) -> None:
    parse_version(version)
    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        json.dump({"version": version}, f, indent=4)
        f.write("\n")
    sync_package_json(version)


def sync_package_json(version: str) -> None:
    if not PACKAGE_JSON.exists():
        return
    try:
        with open(PACKAGE_JSON, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError, TypeError):
        return
    if not isinstance(data, dict):
        return
    data["version"] = version
    with open(PACKAGE_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def bump_version(kind: str) -> str:
    """Return the new version string after bumping major, minor, or patch."""
    major, minor, patch = parse_version(load_version())
    if kind == "major":
        major += 1
        minor = 0
        patch = 0
    elif kind == "minor":
        minor += 1
        patch = 0
    elif kind == "patch":
        patch += 1
    else:
        raise ValueError(f"Unknown bump kind: {kind!r}")
    new_v = format_version((major, minor, patch))
    save_version(new_v)
    return new_v


def bump_patch_cli(message: str | None = None) -> str:
    """CLI: bump patch (website fix) and log to catalog_updates.json."""
    from catalog_changelog import append_updates, format_date

    new_v = bump_version("patch")
    day = format_date()
    note = message.strip() if message else f"Website release version {new_v}"
    append_updates([note], day=day)
    print(f"Version {new_v} (patch). Logged: {note}")
    return new_v
