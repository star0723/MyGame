"""Key the solid-background goblin sheet (pixel_499c) with proper alpha matting.

Unlike the checkerboard sheets, pixel_499c sits on a single flat color (#f8f8f8).
That lets us recover a real anti-aliased alpha instead of a binary mask, which
kills the white fringe: a pixel is treated as background only when it is BOTH
near-neutral (low saturation) AND light, edge pixels get fractional alpha from a
lightness ramp, and we then un-blend the background color out of the rim.
"""
import json
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "E:/myGame/public/assets/test/pixel_499c_0dbb8b87-4b35-4293-8074-b6136c11dcf8.png"
OUT = "E:/myGame/public/assets/goblin"
PREVIEW = "E:/myGame/public/assets/test/_goblin_keyed_on_dark.png"
LAYOUT = [("idle", 4), ("walk", 6), ("attack", 6), ("hurt", 2), ("death", 6)]
COLUMNS = 6
DARK = (19, 11, 24)  # game void bg 0x130b18, to expose any fringe

B = np.array([248.0, 248.0, 248.0])      # measured flat background
S_NEUTRAL = 26                            # max channel-spread to count as "grey"
RAMP_LO, RAMP_HI = 228.0, 242.0           # only near-white greys ramp to transparent


def matte(rgb):
    """Return (rgbF float, alpha float 0..1)."""
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    sat = mx - mn
    val = (r + g + b) / 3.0

    # continuous "background-ness": light AND grey. Coloured or dark -> 0.
    light = np.clip((val - RAMP_LO) / (RAMP_HI - RAMP_LO), 0.0, 1.0)
    grey = np.clip(1.0 - sat / float(S_NEUTRAL), 0.0, 1.0)
    bgw = light * grey

    # A light-grey blob is background only if it reaches the border OR contains a
    # pure flat-fill seed. That keys enclosed white pockets (between limbs / among
    # debris) while protecting interior light detail that has no pure-white core.
    travel = bgw > 0.30
    lbl, _ = ndimage.label(travel)
    keep = set(lbl[0, :]) | set(lbl[-1, :]) | set(lbl[:, 0]) | set(lbl[:, -1])
    definite_bg = (sat <= 4) & (val >= 246)
    keep |= set(np.unique(lbl[definite_bg]).tolist())
    keep.discard(0)
    keyable = np.isin(lbl, list(keep))

    alpha = np.where(keyable, 1.0 - bgw, 1.0).astype(float)

    # un-blend background: observed C = a*F + (1-a)*B  ->  F = (C-(1-a)B)/a
    a3 = np.clip(alpha[:, :, None], 1e-3, 1.0)
    F = (rgb - (1 - a3) * B) / a3
    F = np.clip(F, 0, 255)
    return F, alpha


def bands(occ, gap, minsz, thr):
    runs = []
    s = None
    for i, v in enumerate(occ):
        if v > thr and s is None:
            s = i
        elif v <= thr and s is not None:
            runs.append([s, i]); s = None
    if s is not None:
        runs.append([s, len(occ)])
    merged = []
    for run in runs:
        if merged and run[0] - merged[-1][1] < gap:
            merged[-1][1] = run[1]
        else:
            merged.append(run)
    return [tuple(m) for m in merged if m[1] - m[0] >= minsz]


def detect(fgmask):
    frames, counts = [], []
    for (y0, y1) in bands(fgmask.sum(axis=1), 28, 30, 2):
        band = fgmask[y0:y1, :]
        cb = bands(band.sum(axis=0), 8, 18, max(2, int(0.03 * (y1 - y0))))
        row = []
        for (x0, x1) in cb:
            sub = fgmask[y0:y1, x0:x1]
            ys, xs = np.where(sub)
            if len(xs) == 0:
                continue
            row.append((x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1))
        frames.extend(row); counts.append(len(row))
    return frames, counts


def anchor_of(fg, box):
    x0, y0, x1, y1 = box
    sub = fg[y0:y1, x0:x1]
    lower = sub[int((y1 - y0) * 0.45):, :]
    ys, xs = np.where(lower if lower.any() else sub)
    return x0 + int(np.median(xs)), y1


def main():
    img = np.array(Image.open(SRC).convert("RGB")).astype(float)
    F, alpha = matte(img)
    fg = alpha > 0.15
    frames, counts = detect(fg)
    print(f"goblin rows->{counts} total={sum(counts)} expected={[c for _, c in LAYOUT]}")

    rgba = np.dstack([F, alpha * 255]).astype(np.uint8)
    src = Image.fromarray(rgba)

    left = right = top = 0
    for box in frames:
        ax, by = anchor_of(fg, box)
        left = max(left, int(ax - box[0])); right = max(right, int(box[2] - ax))
        top = max(top, int(by - box[1]))
    pad = 6
    cellW, cellH = int(left + right + pad * 2), int(top + pad * 2)
    acx, aby = int(left + pad), int(cellH - pad)
    rows = (len(frames) + COLUMNS - 1) // COLUMNS
    sheet = Image.new("RGBA", (cellW * COLUMNS, cellH * rows), (0, 0, 0, 0))
    for i, box in enumerate(frames):
        ax, by = anchor_of(fg, box)
        crop = src.crop((int(box[0]), int(box[1]), int(box[2]), int(box[3])))
        px = (i % COLUMNS) * cellW + acx - (ax - box[0])
        py = (i // COLUMNS) * cellH + aby - (by - box[1])
        sheet.paste(crop, (int(px), int(py)), crop)

    sheet.save(f"{OUT}.png")
    anims, cur = {}, 0
    for (name, _), got in zip(LAYOUT, counts):
        anims[name] = [cur, cur + got - 1]; cur += got
    with open(f"{OUT}.json", "w") as f:
        json.dump({"image": "goblin.png", "frameWidth": cellW, "frameHeight": cellH,
                   "columns": COLUMNS, "count": len(frames),
                   "anchor": {"x": round(acx / cellW, 4), "y": round(aby / cellH, 4)},
                   "anims": anims}, f, indent=2)
    print(f"goblin cell={cellW}x{cellH} grid={COLUMNS}x{rows} anchor=({acx},{aby}) anims={anims}")

    # preview composited on the game's dark bg to expose any fringe
    bg = Image.new("RGBA", sheet.size, DARK + (255,))
    Image.alpha_composite(bg, sheet).convert("RGB").save(PREVIEW)
    print(f"preview -> {PREVIEW}")


if __name__ == "__main__":
    main()
