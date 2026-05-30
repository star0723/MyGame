"""process_keyed.py — slice an already-transparent character sprite sheet into
its animation frames and repack them into a uniform 6-column grid the game can
animate (same convention as the minion sprites).

Run from project root (E:/myGame):
    python docs/Source/process_keyed.py <input.png> <name>
or with no args to process all three hero/enemy sheets.

Outputs (to public/assets/):
    <name>.png                      repacked uniform grid, 6 cols, row-major
    <name>.json                     manifest (sizes, anchor normalized, row ranges)
    test/_<name>_grid.png           dark-bg numbered preview for verification

Algorithm (alpha-keyed, inputs already transparent):
  1. alpha row-projection -> row bands (merge bands < ROW_GAP apart);
     a band taller than TALL_RATIO * median is two merged animation rows -> split.
  2. PER-ROW column-projection -> frame x-ranges (global projection would merge
     frames that overlap horizontally across rows); tighten each frame to its
     own opaque vertical bounds.
  3. per-frame anchor: x = median column of lower-body opaque pixels (bottom
     LOWER_BODY fraction, so raised weapons/arms don't skew it); y = frame bottom.
  4. repack row-major into a uniform 6-col grid; cell = max extent around the
     anchor across all frames + PAD; every frame placed so its anchor lands at
     the same in-cell point. Crop + composite only (preserves antialiasing).
"""
import os
import sys
import json
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# ---- tunables -------------------------------------------------------------
COLUMNS = 6
ALPHA_FG = 40          # alpha above this counts as foreground
ROW_GAP = 18           # merge row bands separated by < this many empty rows
COL_GAP = 12           # split frames within a row at gaps >= this
WIDE_RATIO = 1.5       # a frame wider than this * median is two merged frames
                       # (a horizontal weapon bridged the inter-frame gap) -> split
PAD = 6                # padding around the max extent in each cell
TALL_RATIO = 1.6       # a row taller than this * median is two merged rows
LOWER_BODY = 0.40      # bottom fraction used for the horizontal anchor
DARK = (19, 11, 24)
TEST_DIR = "public/assets/test"
OUT_DIR = "public/assets"


def runs(mask_1d, gap):
    """Contiguous runs of True in a 1D bool mask, merging runs < gap apart."""
    raw, start = [], None
    for i, v in enumerate(mask_1d):
        if v and start is None:
            start = i
        elif not v and start is not None:
            raw.append((start, i)); start = None
    if start is not None:
        raw.append((start, len(mask_1d)))
    merged = []
    for s, e in raw:
        if merged and s - merged[-1][1] < gap:
            merged[-1][1] = e
        else:
            merged.append([s, e])
    return [(s, e) for s, e in merged]


def group_bands(sub, n):
    """Group contiguous sub-bands into n groups by cutting at the n-1 widest gaps."""
    if len(sub) <= n:
        return sub
    gaps = sorted(((sub[i + 1][0] - sub[i][1], i) for i in range(len(sub) - 1)),
                  reverse=True)
    cut_after = sorted(idx for _, idx in gaps[: n - 1])
    groups, start = [], 0
    for c in cut_after + [len(sub) - 1]:
        seg = sub[start:c + 1]
        groups.append((seg[0][0], seg[-1][1]))
        start = c + 1
    return groups


def detect_rows(alpha):
    """Row bands via alpha row-projection; split abnormally tall merged rows."""
    rowmass = (alpha > ALPHA_FG).sum(axis=1)
    bands = runs(rowmass > 0, ROW_GAP)
    if not bands:
        return bands
    heights = sorted(e - s for s, e in bands)
    med = heights[len(heights) // 2]
    out = []
    for s, e in bands:
        h = e - s
        if h > TALL_RATIO * med:
            n = max(2, round(h / med))
            sub = runs((alpha[s:e] > ALPHA_FG).sum(axis=1) > 0, gap=6)
            if len(sub) >= n:
                out.extend((s + ss, s + ee) for ss, ee in group_bands(sub, n))
            else:
                step = h / n
                out.extend((s + round(i * step), s + round((i + 1) * step))
                           for i in range(n))
        else:
            out.append((s, e))
    return out


def detect_frames(alpha, row):
    """Within one row band: column-projection -> frames, tightened vertically.

    Two characters can merge into one wide band when a horizontal weapon from one
    bridges the gap to the next. After the initial split, any frame much wider
    than the row's median is re-split at its lowest-mass interior valley (where
    only the thin weapon connects the two bodies)."""
    s, e = row
    sub = alpha[s:e]
    colmass = (sub > ALPHA_FG).sum(axis=0)
    spans = runs(colmass > 0, COL_GAP)
    if not spans:
        return []
    widths = sorted(x1 - x0 for x0, x1 in spans)
    med = widths[len(widths) // 2]
    fixed = []
    for x0, x1 in spans:
        w = x1 - x0
        if w > WIDE_RATIO * med:
            n = max(2, round(w / med))
            fixed.extend(split_wide(colmass, x0, x1, n))
        else:
            fixed.append((x0, x1))
    frames = []
    for x0, x1 in fixed:
        cell = sub[:, x0:x1] > ALPHA_FG
        ys = np.where(cell.any(axis=1))[0]
        xs = np.where(cell.any(axis=0))[0]
        if len(ys) == 0:
            continue
        frames.append((x0 + int(xs[0]), s + int(ys[0]),
                       x0 + int(xs[-1]) + 1, s + int(ys[-1]) + 1))
    return frames


def split_wide(colmass, x0, x1, n):
    """Split [x0,x1) into n pieces at the n-1 lowest-mass interior columns,
    keeping cut points apart so we don't slice through a single body."""
    seg = colmass[x0:x1]
    w = x1 - x0
    min_apart = w // (n + 1)
    cuts = []
    order = sorted(range(1, w - 1), key=lambda j: seg[j])
    for j in order:
        if len(cuts) >= n - 1:
            break
        if all(abs(j - c) >= min_apart for c in cuts):
            cuts.append(j)
    cuts = sorted(c + x0 for c in cuts)
    pts = [x0] + cuts + [x1]
    return [(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]


def frame_anchor(alpha, fr):
    """x = median column of lower-body opaque pixels, y = frame bottom."""
    x0, top, x1, bot = fr
    h = bot - top
    lb_top = bot - max(1, int(round(h * LOWER_BODY)))
    region = alpha[lb_top:bot, x0:x1] > ALPHA_FG
    cols = np.where(region.any(axis=0))[0]
    if len(cols) == 0:
        region = alpha[top:bot, x0:x1] > ALPHA_FG
        cols = np.where(region.any(axis=0))[0]
    ax = x0 + int(np.median(cols)) if len(cols) else (x0 + x1) // 2
    return ax, bot


def process(path, name):
    im = Image.open(path).convert("RGBA")
    alpha = np.array(im)[:, :, 3]

    rows = detect_rows(alpha)
    row_frames = [detect_frames(alpha, r) for r in rows]
    row_counts = [len(f) for f in row_frames]

    flat = []
    for frs in row_frames:
        for fr in frs:
            flat.append((fr, frame_anchor(alpha, fr)))

    left = max(ax - fr[0] for fr, (ax, ay) in flat)
    right = max(fr[2] - ax for fr, (ax, ay) in flat)
    up = max(ay - fr[1] for fr, (ax, ay) in flat)
    down = max(fr[3] - ay for fr, (ax, ay) in flat)

    cell_w = left + right + 2 * PAD
    cell_h = up + down + 2 * PAD
    anchor_x = left + PAD
    anchor_y = up + PAD

    count = len(flat)
    rows_grid = (count + COLUMNS - 1) // COLUMNS
    sheet = Image.new("RGBA", (cell_w * COLUMNS, cell_h * rows_grid), (0, 0, 0, 0))
    for i, (fr, (ax, ay)) in enumerate(flat):
        x0, top, x1, bot = fr
        crop = im.crop((x0, top, x1, bot))
        cx, cy = i % COLUMNS, i // COLUMNS
        dst_x = cx * cell_w + anchor_x - (ax - x0)
        dst_y = cy * cell_h + anchor_y - (ay - top)
        sheet.alpha_composite(crop, (dst_x, dst_y))

    os.makedirs(OUT_DIR, exist_ok=True)
    sheet.save(f"{OUT_DIR}/{name}.png")

    ranges, idx = {}, 0
    for r, c in enumerate(row_counts):
        if c == 0:
            continue
        ranges[f"row{r}"] = [idx, idx + c - 1]
        idx += c

    manifest = {
        "image": f"{name}.png",
        "frameWidth": cell_w, "frameHeight": cell_h,
        "columns": COLUMNS, "count": count,
        "anchor": {"x": round(anchor_x / cell_w, 4), "y": round(anchor_y / cell_h, 4)},
        "rows": row_counts, "rowRanges": ranges,
    }
    with open(f"{OUT_DIR}/{name}.json", "w") as f:
        json.dump(manifest, f, indent=2)

    os.makedirs(TEST_DIR, exist_ok=True)
    bg = Image.new("RGBA", sheet.size, DARK + (255,))
    bg.alpha_composite(sheet)
    bg = bg.convert("RGB")
    d = ImageDraw.Draw(bg)
    try:
        font = ImageFont.truetype("arial.ttf", 28)
    except Exception:
        font = ImageFont.load_default()
    for i in range(count):
        cx, cy = (i % COLUMNS) * cell_w, (i // COLUMNS) * cell_h
        d.rectangle([cx, cy, cx + cell_w - 1, cy + cell_h - 1], outline=(90, 90, 110))
        d.text((cx + 4, cy + 2), str(i), fill=(255, 220, 90), font=font)
    bg.save(f"{TEST_DIR}/_{name}_grid.png")

    print(f"\n== {name} ==")
    print(f"  detected rows: {len(rows)} -> per-row frame counts {row_counts}")
    print(f"  frameWidth={cell_w} frameHeight={cell_h} count={count}")
    print(f"  anchor (normalized) = {manifest['anchor']}")
    print(f"  rowRanges = {ranges}")
    return manifest


if __name__ == "__main__":
    if len(sys.argv) == 3:
        process(sys.argv[1], sys.argv[2])
    else:
        for p, n in [
            ("public/assets/sprites/d6c7a11296ef656699666f24e6c7f58e.png", "militia"),
            ("public/assets/sprites/cfa4c0c4681802970ec79d61bb427385.png", "archer"),
            ("public/assets/sprites/b4f8294b7ef3d5f4bd17b163aa35058e.png", "paladin"),
        ]:
            process(p, n)
