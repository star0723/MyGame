"""Slice + key the hand-placed sprite sheets into clean uniform-grid spritesheets.

Background: baked Photoshop checkerboard (light grays). We flood-fill the
light/low-sat pixels that touch each frame's surrounding region, which keys the
checkerboard while protecting enclosed white (skull interiors). Frames are then
detected per row-band, anchored on the lower-body centroid + shadow baseline,
and repacked into a fixed cell grid that Phaser can load with load.spritesheet.
"""
import json
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

# row-band layout per sheet: list of (name, expected_frame_count)
LAYOUT = {
    "kl": [("idle", 4), ("walk", 6), ("attack", 6), ("hurt", 2), ("death", 6)],
    "bf": [("fly", 4), ("move", 6), ("swoop", 4), ("ball", 2), ("death", 6)],
}
OUT_NAME = {"kl": "skeleton", "bf": "bat"}
COLUMNS = 6  # repacked grid width


def key_background(rgb):
    """Return boolean fg mask (True = sprite pixel)."""
    arr = rgb.astype(int)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    light = (mn >= 222) & ((mx - mn) <= 18)            # checkerboard candidates
    lbl, n = ndimage.label(light)                       # connected light regions
    border = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    border.discard(0)
    bg = np.isin(lbl, list(border))                     # only border-connected light = bg
    return ~bg


def bands(occ, gap_merge, min_size, thr):
    runs = []
    s = None
    for i, v in enumerate(occ):
        if v > thr and s is None:
            s = i
        elif v <= thr and s is not None:
            runs.append([s, i])
            s = None
    if s is not None:
        runs.append([s, len(occ)])
    merged = []
    for run in runs:
        if merged and run[0] - merged[-1][1] < gap_merge:
            merged[-1][1] = run[1]
        else:
            merged.append(run)
    return [tuple(m) for m in merged if m[1] - m[0] >= min_size]


def detect_frames(fg):
    h, w = fg.shape
    row_occ = fg.sum(axis=1)
    # merge a bat body with its detached ground shadow (gap <=~18px) but keep
    # true rows apart (inter-row gaps are >=34px in both sheets).
    row_bands = bands(row_occ, gap_merge=28, min_size=30, thr=2)
    frames = []  # (x0,y0,x1,y1) per frame, reading order
    rows_meta = []
    for (ry0, ry1) in row_bands:
        band = fg[ry0:ry1, :]
        col_occ = band.sum(axis=0)
        col_bands = bands(col_occ, gap_merge=8, min_size=18, thr=max(2, int(0.03 * (ry1 - ry0))))
        row_frames = []
        for (cx0, cx1) in col_bands:
            sub = fg[ry0:ry1, cx0:cx1]
            ys, xs = np.where(sub)
            if len(xs) == 0:
                continue
            fx0, fx1 = cx0 + xs.min(), cx0 + xs.max() + 1
            fy0, fy1 = ry0 + ys.min(), ry0 + ys.max() + 1
            row_frames.append((fx0, fy0, fx1, fy1))
        frames.extend(row_frames)
        rows_meta.append(len(row_frames))
    return frames, rows_meta


def anchor_of(fg, box):
    """Horizontal anchor = median x of lower-body fg; vertical anchor = bottom."""
    x0, y0, x1, y1 = box
    sub = fg[y0:y1, x0:x1]
    h = y1 - y0
    lower = sub[int(h * 0.45):, :]            # legs/torso, ignore extended weapon arm
    ys, xs = np.where(lower if lower.any() else sub)
    ax = x0 + int(np.median(xs))
    return ax, y1                              # (anchorX, baselineY)


def process(tag, path, outdir):
    img = Image.open(path).convert("RGB")
    rgb = np.array(img)
    fg = key_background(rgb)
    rgba = np.dstack([rgb, (fg * 255).astype(np.uint8)])

    frames, rows_meta = detect_frames(fg)
    expected = [c for _n, c in LAYOUT[tag]]
    print(f"[{tag}] rows -> frame counts: {rows_meta}  total={len(frames)}  expected={expected}")
    if rows_meta != expected:
        print(f"[{tag}] !! WARNING: detected row counts differ from expected layout")

    # uniform cell from max extents around each frame's anchor
    left = right = top = 0
    for box in frames:
        ax, by = anchor_of(fg, box)
        x0, y0, x1, y1 = box
        left = max(left, int(ax - x0))
        right = max(right, int(x1 - ax))
        top = max(top, int(by - y0))
    pad = 6
    cellW = int(left + right + pad * 2)
    cellH = int(top + pad * 2)
    anchor_cx = int(left + pad)       # where anchorX lands in the cell
    anchor_by = int(cellH - pad)      # where baseline lands in the cell

    rows = (len(frames) + COLUMNS - 1) // COLUMNS
    sheet = Image.new("RGBA", (cellW * COLUMNS, cellH * rows), (0, 0, 0, 0))
    src = Image.fromarray(rgba)
    for i, box in enumerate(frames):
        ax, by = anchor_of(fg, box)
        x0, y0, x1, y1 = box
        crop = src.crop((int(x0), int(y0), int(x1), int(y1)))
        cell_x = (i % COLUMNS) * cellW
        cell_y = (i // COLUMNS) * cellH
        px = int(cell_x + anchor_cx - (ax - x0))
        py = int(cell_y + anchor_by - (by - y0))
        sheet.paste(crop, (px, py), crop)

    # animation index ranges from layout (use detected per-row counts)
    anims = {}
    cursor = 0
    for (name, _expected), got in zip(LAYOUT[tag], rows_meta):
        anims[name] = [cursor, cursor + got - 1]
        cursor += got

    name = OUT_NAME[tag]
    sheet.save(f"{outdir}/{name}.png")
    manifest = {
        "image": f"{name}.png",
        "frameWidth": cellW,
        "frameHeight": cellH,
        "columns": COLUMNS,
        "count": len(frames),
        "anchor": {"x": round(anchor_cx / cellW, 4), "y": round(anchor_by / cellH, 4)},
        "anims": anims,
    }
    with open(f"{outdir}/{name}.json", "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[{tag}] cell={cellW}x{cellH} grid={COLUMNS}x{rows} anims={anims}")
    print(f"[{tag}] anchor cell=({anchor_cx},{anchor_by}) norm={manifest['anchor']}")
    return manifest


if __name__ == "__main__":
    outdir = sys.argv[1] if len(sys.argv) > 1 else "/tmp"
    for tag, path in [("kl", "docs/Source/kl.png"), ("bf", "docs/Source/bf.png")]:
        process(tag, path, outdir)
