#!/usr/bin/env python3

"""
Generate outline-only versions (transparent background with colored edges)
for header images, with variants for light and dark themes.

Inputs (must exist):
  - images/IAG_logo.jpg
  - images/figure_gardel.png

Outputs:
  - images/IAG_logo_outline_light.png
  - images/IAG_logo_outline_dark.png
  - images/figure_gardel_outline_light.png
  - images/figure_gardel_outline_dark.png

Implementation notes:
  - Uses PIL's FIND_EDGES filter, thickens edges slightly, thresholds to mask
    and colorizes edges with theme-appropriate colors, on transparent RGBA.
  - Colors selected to match site theme variables: light uses near-black edges,
    dark uses near-white edges for contrast. Highlight color is #cc9900; we keep
    outlines neutral so they work atop secondary backgrounds.
"""

from pathlib import Path

from PIL import Image, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parent


def generate_outline(src_path: Path, out_light: Path, out_dark: Path,
                     edge_thickness: int = 2,
                     threshold: int = 24,
                     light_color=(26, 26, 26, 255),  # #1a1a1a
                     dark_color=(245, 245, 245, 255)):  # #f5f5f5
    img = Image.open(src_path).convert("RGBA")

    # Edge detection on luminance
    gray = img.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)

    # Enhance edges slightly
    for _ in range(max(1, edge_thickness - 1)):
        edges = edges.filter(ImageFilter.MaxFilter(3))

    # Normalize and threshold to create a binary mask
    edges = ImageOps.autocontrast(edges)
    mask = edges.point(lambda p: 255 if p > threshold else 0).convert("L")

    # Remove weak speckles with a slight blur and re-threshold
    mask = mask.filter(ImageFilter.MedianFilter(3)).point(lambda p: 255 if p > 127 else 0)

    # Build RGBA outputs with colored edges on transparent background
    w, h = img.size
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))

    light_img = base.copy()
    dark_img = base.copy()

    # Composite colored edges using mask
    light_layer = Image.new("RGBA", (w, h), light_color)
    dark_layer = Image.new("RGBA", (w, h), dark_color)
    light_img = Image.composite(light_layer, light_img, mask)
    dark_img = Image.composite(dark_layer, dark_img, mask)

    out_light.parent.mkdir(parents=True, exist_ok=True)
    light_img.save(out_light)
    dark_img.save(out_dark)


def main():
    inputs = [
        (ROOT / "IAG_logo.jpg", ROOT / "IAG_logo_outline_light.png", ROOT / "IAG_logo_outline_dark.png"),
        (ROOT / "figure_gardel.png", ROOT / "figure_gardel_outline_light.png", ROOT / "figure_gardel_outline_dark.png"),
    ]

    for src, out_l, out_d in inputs:
        if not src.exists():
            raise FileNotFoundError(f"Missing input image: {src}")
        generate_outline(src, out_l, out_d)

    print("Outline images generated successfully.")


if __name__ == "__main__":
    main()


