"""Analyze hero sprite sheets: detect row/col grid from alpha, emit a dark-bg
preview with detected row bands drawn, so we can map animations per sheet.

Run from project root:  python docs/Source/analyze.py
"""
import os
from PIL import Image
import numpy as np

DARK = (19, 11, 24)
TEST_DIR = "public/assets/test"


def bands(mass, gap):
    """Contiguous runs of >0, merging runs separated by < gap empties."""
    raw = []
    start = None
    for i, v in enumerate(mass):
        if v > 0 and start is None:
            start = i
        elif v == 0 and start is not None:
            raw.append((start, i))
            start = None
    if start is not None:
        raw.append((start, len(mass)))
    merged = []
    for b in raw:
        if merged and b[0] - merged[-1][1] < gap:
            merged[-1] = (merged[-1][0], b[1])
        else:
            merged.append([b[0], b[1]])
    return [tuple(b) for b in merged]


def analyze(path, name):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    alpha = arr[:, :, 3]
    H, W = alpha.shape
    rowmass = (alpha > 16).sum(axis=1)
    colmass = (alpha > 16).sum(axis=0)
    rb = bands(rowmass, gap=18)
    cb = bands(colmass, gap=10)
    print(f"\n== {name}  {os.path.basename(path)}  {W}x{H} ==")
    print(f"  rows: {len(rb)} -> {rb}")
    print(f"  cols: {len(cb)} -> {cb}")
    rh = [e - s for s, e in rb]
    print(f"  row heights: {rh}")
    print(f"  cols/row count = {len(cb)}; frameW@{len(cb)}cols={W/max(len(cb),1):.1f}")

    bg = Image.new("RGBA", (W, H), DARK + (255,))
    bg.alpha_composite(im)
    bg = bg.convert("RGB")
    px = bg.load()
    for (s, e) in rb:
        for x in range(W):
            if s < H:
                px[x, s] = (255, 80, 80)
            if e - 1 < H:
                px[x, e - 1] = (255, 80, 80)
    for (s, e) in cb:
        for y in range(H):
            if s < W:
                px[s, y] = (80, 160, 255)
            if e - 1 < W:
                px[e - 1, y] = (80, 160, 255)
    os.makedirs(TEST_DIR, exist_ok=True)
    out = f"{TEST_DIR}/_{name}_analyze.png"
    bg.save(out)
    print(f"  preview -> {out}")


if __name__ == "__main__":
    sheets = [
        ("public/assets/sprites/d6c7a11296ef656699666f24e6c7f58e.png", "militia"),
        ("public/assets/sprites/cfa4c0c4681802970ec79d61bb427385.png", "archer"),
        ("public/assets/sprites/b4f8294b7ef3d5f4bd17b163aa35058e.png", "paladin"),
    ]
    for path, name in sheets:
        analyze(path, name)
