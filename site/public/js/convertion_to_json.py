import copy
import json
import math
import sys

import pandas as pd
from catalog_changelog import record_catalog_changes, sync_changelog_from_disk
from site_version import bump_patch_cli, load_version
from pathlib import Path

CSV_FILE = Path(__file__).parent / "BH_parameters_FullSamp.csv"
JSON_FILE = Path(__file__).parent / "BH_Catalog.json"

# (output_key, mu_column, sigma_up_column, sigma_down_column, type_column)
FIELDS = [
    ("P_orb",     "porb_mu",  "porb_sigma_plus",  "porb_sigma_minus", "type_p"),
    ("K_cp",      "kcp_mu",   "kcp_sigma_plus",   "kcp_sigma_minus",  "type_k"),
    ("e",         "e_mu",     "e_sigma",           "e_sigma",          "type_e"),
    ("orb_angle", "i_mu",     "i_sigma_plus",      "i_sigma_minus",    "type_i"),
    ("q",         "q_mu",     "q_sigma_plus",      "q_sigma_minus",    "type_q"),
    ("m_literat", "mbh_mu",   "mbh_sigma_plus",    "mbh_sigma_minus",  "type_m"),
    ("m_bh",      "m_new_mu", "m_new_sigma_plus",  "m_new_sigma_minus","type_mnew"),
]

ENTRY_HEADER_KEYS = ("name", "simbad", "Confirmed", "Type")

# Reference URLs in CSV (citation text / descrip stays in BH_Catalog.json only)
REF_LINK_COLUMNS = ("ref_1", "ref_2", "ref_3")


def safe_float(val):
    """Return a float, or None for NaN / None / missing values."""
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return None
    return float(val)


def safe_type(val):
    """Return the distribution type string, or None for missing / zero values."""
    if val is None:
        return None
    s = str(val).strip()
    return None if s in ("", "0", "nan") else s


def references_from_row(row, descrip_by_link=None):
    """Build references from CSV link columns; descrip from existing JSON when provided."""
    descrip_by_link = descrip_by_link or {}
    refs = []
    for link_col in REF_LINK_COLUMNS:
        if link_col not in row.index:
            continue
        link_val = row[link_col]
        if pd.isna(link_val) or not str(link_val).strip():
            continue
        link_s = str(link_val).strip()
        refs.append({"link": link_s, "descrip": descrip_by_link.get(link_s, "")})
    return refs if refs else None


def descrip_map_from_references(refs):
    """Map link URL → citation text for merging CSV links with JSON descriptions."""
    if not refs:
        return {}
    return {
        str(r["link"]).strip(): str(r.get("descrip", "")).strip()
        for r in refs
        if isinstance(r, dict) and r.get("link")
    }


def system_references_from_entry(entry):
    """
    Extract system-level references from a catalogue object.
    Each item must have 'link' and 'descrip' (as used by the webpage).
    """
    if not isinstance(entry, dict):
        return None
    refs = entry.get("references")
    if not isinstance(refs, list):
        return None
    out = []
    for r in refs:
        if not isinstance(r, dict):
            continue
        link = r.get("link")
        descrip = r.get("descrip")
        if link is None or descrip is None:
            continue
        link_s = str(link).strip()
        descrip_s = str(descrip).strip()
        if link_s and descrip_s:
            out.append({"link": link_s, "descrip": descrip_s})
    return out if out else None


def apply_system_references(entry, references):
    """Attach or clear system-level references on a catalogue entry."""
    if references:
        entry["hasReferences"] = True
        entry["references"] = references
    else:
        entry["hasReferences"] = False
        entry.pop("references", None)


def order_entry(entry):
    """Stable key order: header, references, parameter blocks, then any extras."""
    ordered = {}
    for k in ENTRY_HEADER_KEYS:
        if k in entry:
            ordered[k] = entry[k]
    ordered["hasReferences"] = entry.get("hasReferences", False)
    if ordered["hasReferences"] and entry.get("references"):
        ordered["references"] = entry["references"]
    for field_name, *_ in FIELDS:
        if field_name in entry:
            ordered[field_name] = entry[field_name]
    for k, v in entry.items():
        if k not in ordered:
            ordered[k] = v
    return ordered


def load_existing_catalog():
    """Load current BH_Catalog.json before overwrite, or None if missing."""
    if not JSON_FILE.exists():
        return None
    try:
        with open(JSON_FILE, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError, TypeError):
        return None
    return data if isinstance(data, list) else None


def load_preserved_manual_fields():
    """
    Load manually curated simbad URLs and system references by source name
    from the existing BH_Catalog.json (read before regenerate overwrites it).
    """
    simbad_by_name = {}
    refs_by_name = {}
    descrip_by_name = {}

    if not JSON_FILE.exists():
        return simbad_by_name, refs_by_name, descrip_by_name

    try:
        with open(JSON_FILE, encoding="utf-8") as f:
            catalog = json.load(f)
    except (json.JSONDecodeError, OSError, TypeError):
        return simbad_by_name, refs_by_name, descrip_by_name

    if not isinstance(catalog, list):
        return simbad_by_name, refs_by_name, descrip_by_name

    for e in catalog:
        if not isinstance(e, dict):
            continue
        name = e.get("name")
        if not name:
            continue
        s = e.get("simbad")
        if s and str(s).strip():
            simbad_by_name[name] = str(s).strip()
        refs = system_references_from_entry(e)
        if refs:
            refs_by_name[name] = refs
            descrip_by_name[name] = descrip_map_from_references(refs)

    return simbad_by_name, refs_by_name, descrip_by_name


def build_field(mu, sigma_up, sigma_down, dist_type=None):
    """Build a measurement dict with auto-detected symmetry and zero→null mapping."""
    mu = safe_float(mu)
    sigma_up = safe_float(sigma_up)
    sigma_down = safe_float(sigma_down)

    all_zero_or_none = all(
        v is None or v == 0 for v in (mu, sigma_up, sigma_down)
    )
    if all_zero_or_none:
        return {
            "value": None,
            "type": dist_type,
            "hasReferences": False,
            "uncertainty": {
                "symmetrical": None,
                "up": None,
                "down": None,
            },
        }

    value = None if (mu is None or mu == 0) else mu
    symmetrical = sigma_up == sigma_down

    # In the source table, uniform ("u") bounds are stored inverted relative to
    # our JSON convention (down=lower, up=upper). Normalize here so rendering and
    # sorting can consistently rely on uncertainty.down/uncertainty.up.
    if dist_type == "u":
        sigma_up, sigma_down = sigma_down, sigma_up

    return {
        "value": value,
        "type": dist_type,
        "hasReferences": False,
        "uncertainty": {
            "symmetrical": symmetrical,
            "up": sigma_up,
            "down": sigma_down,
        },
    }


def row_to_entry(row, descrip_by_link=None):
    """Convert a single CSV row into a catalog JSON entry."""
    type_val = row["Type"]
    if pd.isna(type_val) or type_val == 0 or str(type_val).strip() == "0":
        bh_type = ""
    else:
        bh_type = str(type_val).strip()

    entry = {
        "name": row["name"],
        "simbad": None,
        "Confirmed": True,
        "Type": bh_type,
        "hasReferences": False,
    }

    for field_name, mu_col, up_col, down_col, type_col in FIELDS:
        entry[field_name] = build_field(
            row[mu_col], row[up_col], row[down_col],
            safe_type(row[type_col])
        )

    refs = references_from_row(row, descrip_by_link)
    if refs:
        apply_system_references(entry, refs)

    return entry


def generate():
    """
    Fully regenerate BH_Catalog.json from the CSV.

    Parameters, system Type, and reference links come from BH_parameters_FullSamp.csv.
    SIMBAD URLs and reference descriptions (descrip) are preserved from BH_Catalog.json.
    """
    old_catalog = load_existing_catalog()
    simbad_by_name, refs_by_name, descrip_by_name = load_preserved_manual_fields()

    df = pd.read_csv(CSV_FILE)
    catalog = []
    refs_from_csv = 0
    refs_fallback = 0
    for _, row in df.iterrows():
        name = row["name"]
        entry = row_to_entry(row, descrip_by_name.get(name, {}))
        if name in simbad_by_name:
            entry["simbad"] = simbad_by_name[name]
        if entry.get("hasReferences"):
            refs_from_csv += 1
        elif name in refs_by_name:
            apply_system_references(entry, refs_by_name[name])
            refs_fallback += 1
        catalog.append(order_entry(entry))

    changelog_added = record_catalog_changes(old_catalog, catalog)

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=4, ensure_ascii=False)
        f.write("\n")

    print(f"Generated {JSON_FILE.name} with {len(catalog)} entries.")
    print(f"  Preserved SIMBAD URLs for {len(simbad_by_name)} sources.")
    print(f"  References from CSV: {refs_from_csv}; JSON descrip fallback: {refs_fallback}.")
    if changelog_added:
        print(f"  Recorded {changelog_added} catalogue update(s).")
        print(f"  Site version is now {load_version()}.")


def patch():
    """
    Patch mode: add/update only the 'type' key inside each parameter block of
    the existing JSON, without touching references, comments, Type, simbad URLs,
    or any other manually curated data.
    """
    df = pd.read_csv(CSV_FILE)

    # Build a lookup: name → {field_name: dist_type}
    type_lookup = {}
    for _, row in df.iterrows():
        name = row["name"]
        field_types = {}
        for field_name, _, _, _, type_col in FIELDS:
            field_types[field_name] = safe_type(row[type_col])
        type_lookup[name] = field_types

    with open(JSON_FILE, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    old_catalog = copy.deepcopy(catalog)

    patched, unmatched = 0, []
    for entry in catalog:
        name = entry.get("name", "")
        if name not in type_lookup:
            unmatched.append(name)
            continue
        for field_name, dist_type in type_lookup[name].items():
            if field_name in entry and isinstance(entry[field_name], dict):
                entry[field_name]["type"] = dist_type
        patched += 1

    changelog_added = record_catalog_changes(old_catalog, catalog)

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=4, ensure_ascii=False)
        f.write("\n")

    print(f"Patched {patched} entries in {JSON_FILE.name}.")
    if changelog_added:
        print(f"  Recorded {changelog_added} catalogue update(s).")
        print(f"  Site version is now {load_version()}.")
    if unmatched:
        print(f"No CSV match for {len(unmatched)} entries:")
        for n in unmatched:
            print(f"  - {n!r}")


if __name__ == "__main__":
    if "--bump-patch" in sys.argv:
        idx = sys.argv.index("--bump-patch")
        msg = " ".join(sys.argv[idx + 1 :]).strip() or None
        bump_patch_cli(msg)
    elif "--changelog" in sys.argv:
        sync_changelog_from_disk()
    elif "--patch" in sys.argv:
        patch()
    else:
        generate()
