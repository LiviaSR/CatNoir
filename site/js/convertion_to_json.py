import pandas as pd
import json
import math
import sys
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


def row_to_entry(row):
    """Convert a single CSV row into a catalog JSON entry."""
    type_val = row["Type"]
    if pd.isna(type_val) or type_val == 0 or str(type_val).strip() == "0":
        bh_type = ""
    else:
        bh_type = str(type_val).strip()

    entry = {
        "name": row["name"],
        "Confirmed": True,
        "Type": bh_type,
        "hasReferences": False,
    }

    for field_name, mu_col, up_col, down_col, type_col in FIELDS:
        entry[field_name] = build_field(
            row[mu_col], row[up_col], row[down_col],
            safe_type(row[type_col])
        )

    return entry


def generate():
    """Fully regenerate BH_Catalog.json from the CSV (overwrites manual edits)."""
    df = pd.read_csv(CSV_FILE)
    catalog = [row_to_entry(row) for _, row in df.iterrows()]

    with open(JSON_FILE, "w") as f:
        json.dump(catalog, f, indent=4)

    print(f"Generated {JSON_FILE.name} with {len(catalog)} entries.")


def patch():
    """
    Patch mode: add/update only the 'type' key inside each parameter block of
    the existing JSON, without touching references, comments, Type, or any other
    manually curated data.
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

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=4, ensure_ascii=False)

    print(f"Patched {patched} entries in {JSON_FILE.name}.")
    if unmatched:
        print(f"No CSV match for {len(unmatched)} entries:")
        for n in unmatched:
            print(f"  - {n!r}")


if __name__ == "__main__":
    if "--patch" in sys.argv:
        patch()
    else:
        generate()
