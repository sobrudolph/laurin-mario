"""Spracuje odfotené kresby (kresby/*.jpg) na herné sprity s priehľadným pozadím (assets/*.png).

Použitie:  python tools/spracuj_kresby.py
Potrebuje: pip install pillow numpy scipy
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "kresby"
OUT = ROOT / "assets"
OUT.mkdir(exist_ok=True)

# meno: (zdroj, orezanie (l,t,r,b) alebo None, max rozmer výstupu, zelené fľaky = pozadie)
SPRITES = {
    "hrac":        ("mario.jpg", None, 360, False),
    "hrac_foto":   ("mario_vlastna_foto.jpg", (30, 20, 1272, 938), 360, False),
    "macka":       ("macka.jpg", None, 420, True),
    "hrib":        ("hrib.jpg", (0, 0, 1280, 940), 260, False),
    "korytnacka":  ("korytnacka.jpg", None, 300, False),
}

# Oblasť tváre na kresbe bez tváre (v súradniciach pôvodnej fotky)
FACE_RECT_SRC = (470, 190, 955, 475)


def process(name, src, crop, max_dim, green_is_bg):
    im = Image.open(SRC / src).convert("RGB")
    if crop:
        im = im.crop(crop)
    a = np.asarray(im).astype(np.float32) / 255.0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    lum = 0.299 * r + 0.587 * g + 0.114 * b

    # lokálny jas papiera (odstráni ťahy, nechá tiene papiera)
    paper = ndi.grey_closing(lum, size=(41, 41))
    paper = ndi.gaussian_filter(paper, 25)

    bg_like = (lum > paper - 0.13) & (sat < 0.16)
    if green_is_bg:
        hue_green = (g > r + 0.03) & (g > b + 0.03)
        bg_like |= hue_green & (lum > 0.35)

    # pozadie = to, čo je spojené s okrajom obrázka
    lab, _ = ndi.label(bg_like)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    border = border[border > 0]
    background = np.isin(lab, border)
    fg = ~background

    # odstráni tenké čiary od ceruzky a fľaky: jadro = otvorenie, potom vráti okolie jadra
    core = ndi.binary_opening(fg, structure=np.ones((9, 9)))
    lab2, n = ndi.label(core)
    if n:
        sizes = ndi.sum(core, lab2, range(1, n + 1))
        keep = np.isin(lab2, 1 + np.where(sizes > 1500)[0])
    else:
        keep = core
    mask = fg & ndi.binary_dilation(keep, iterations=7)
    mask = ndi.binary_fill_holes(mask) if name != "hrac_foto" else mask
    # jemný okraj
    alpha = ndi.gaussian_filter(mask.astype(np.float32), 1.0)

    ys, xs = np.where(mask)
    t, btm, l, rgt = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([a, alpha])[t:btm, l:rgt]
    out = Image.fromarray((rgba * 255).clip(0, 255).astype(np.uint8), "RGBA")
    scale = max_dim / max(out.size)
    size = (round(out.width * scale), round(out.height * scale))
    out = out.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")
    out.save(OUT / f"{name}.png", optimize=True)
    info = {"w": size[0], "h": size[1]}

    if name == "hrac_foto":
        ox, oy = (crop[0], crop[1]) if crop else (0, 0)
        fx0, fy0, fx1, fy1 = FACE_RECT_SRC
        info["face"] = [
            round((fx0 - ox - l) * scale), round((fy0 - oy - t) * scale),
            round((fx1 - fx0) * scale), round((fy1 - fy0) * scale),
        ]
    print(name, info)
    return info


if __name__ == "__main__":
    meta = {k: process(k, *v) for k, v in SPRITES.items()}
    (OUT / "sprites.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
