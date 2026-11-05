"""Spracuje kresby kociek, mince, trávy a oblaku (kresby/*.jpg) na PNG s priehľadným pozadím.

Použitie:  python tools/spracuj_dlazdice.py
Výstup:    assets/minca.png, assets/kocka_otaznik.png, assets/kocka_hneda.png,
           assets/trava.png, assets/oblak.png
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "kresby"
OUT = ROOT / "assets"


def nacitaj(meno):
    a = np.asarray(Image.open(SRC / meno).convert("RGB")).astype(np.float32) / 255.0
    mx, mn = a.max(-1), a.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    paper = ndi.gaussian_filter(ndi.grey_closing(lum, size=(41, 41)), 25)
    papier = (lum > paper - 0.13) & (sat < 0.16)
    # vyváženie bielej: papier (tieň fotky) -> biela, farby sú potom živšie
    biela = np.percentile(a[papier], 70, axis=0)
    a = np.clip(a / np.maximum(biela, 0.3) * 1.02, 0, 1)
    return a, sat, lum, papier


def maska_vyrezu(papier, min_plocha=4000):
    """Popredie = všetko, čo nie je papier spojený s okrajom; bez tenkých čiar a fľakov."""
    lab, _ = ndi.label(papier)
    okraj = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    pozadie = np.isin(lab, okraj[okraj > 0])
    fg = ~pozadie
    jadro = ndi.binary_opening(fg, structure=np.ones((9, 9)))
    lab2, n = ndi.label(jadro)
    if n:
        vel = ndi.sum(jadro, lab2, range(1, n + 1))
        jadro = np.isin(lab2, 1 + np.argmax(vel))  # iba najväčší objekt
    m = fg & ndi.binary_dilation(jadro, iterations=7)
    return ndi.binary_fill_holes(m)


def uloz(rgb, alpha, meno, max_rozmer, stvorec=False):
    ys, xs = np.where(alpha > 0.5)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([rgb, alpha])[t:b, l:r]
    im = Image.fromarray((rgba * 255).clip(0, 255).astype(np.uint8), "RGBA").convert("RGBa")
    if stvorec:
        velkost = (max_rozmer, max_rozmer)
    else:
        s = max_rozmer / max(im.size)
        velkost = (round(im.width * s), round(im.height * s))
    im = im.resize(velkost, Image.LANCZOS).convert("RGBA")
    im.save(OUT / meno, optimize=True)
    print(meno, im.size)


def vybiel_papier(rgb, papier, maska, farba=(1.0, 1.0, 1.0)):
    """Papier vnútri kresby (napr. otáznik, vnútro oblaku) prefarbí na čistú bielu."""
    vnutri = papier & maska
    vnutri = ndi.binary_erosion(vnutri, iterations=1) | (vnutri & ~ndi.binary_erosion(maska, iterations=3))
    out = rgb.copy()
    out[vnutri] = farba
    return out


def kocka(zdroj, meno):
    a, sat, lum, papier = nacitaj(zdroj)
    m = maska_vyrezu(papier)
    # kocka = obdĺžnik: odreže kvapky farby pod/vedľa okraja (riadky/stĺpce s malým zaplnením)
    riadky = m.mean(1); stlpce = m.mean(0)
    ys = np.where(riadky > riadky.max() * 0.6)[0]; xs = np.where(stlpce > stlpce.max() * 0.6)[0]
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgb = vybiel_papier(a, papier, m, (1.0, 0.98, 0.9))
    alpha = ndi.gaussian_filter(m.astype(np.float32), 1.0)
    uloz(rgb[t:b, l:r], np.maximum(alpha[t:b, l:r], 0.0), meno, 128, stvorec=True)


def minca():
    a, sat, lum, papier = nacitaj("coin.jpg")
    m = maska_vyrezu(papier)
    rgb = vybiel_papier(a, papier, m, (1.0, 0.85, 0.2))
    uloz(rgb, ndi.gaussian_filter(m.astype(np.float32), 1.0), "minca.png", 96)


def oblak():
    a, sat, lum, papier = nacitaj("oblak.jpg")
    m = maska_vyrezu(papier)
    rgb = vybiel_papier(a, papier, m)
    uloz(rgb, ndi.gaussian_filter(m.astype(np.float32), 1.0), "oblak.png", 360)


def trava():
    a, sat, lum, papier = nacitaj("trava.jpg")
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    zelena = (g > r + 0.06) & (g > b + 0.02) & (sat > 0.15)
    # spodný pás vyplní (biele škrty v ňom), steblá nechá
    pas = ndi.binary_closing(zelena, structure=np.ones((15, 15)))
    riadky = zelena.mean(1)
    plny = np.where(riadky > 0.55)[0]
    m = zelena.copy()
    if len(plny):
        m[plny.min():] |= pas[plny.min():]
    m = ndi.binary_opening(m, structure=np.ones((3, 3)))
    rgb = a.copy()
    rgb[m & ~zelena] = (0.25, 0.6, 0.3)
    # bez spodného okraja fotky
    m[-12:] = False
    alpha = ndi.gaussian_filter(m.astype(np.float32), 0.8)
    ys, xs = np.where(m)
    t, btm = ys.min(), ys.max() + 1
    rgba = np.dstack([rgb, alpha])[t:btm]
    im = Image.fromarray((rgba * 255).clip(0, 255).astype(np.uint8), "RGBA").convert("RGBa")
    s = 64 / im.height
    im = im.resize((round(im.width * s), 64), Image.LANCZOS).convert("RGBA")
    # aby sa dala opakovať bez švu: koniec sa prelína so začiatkom
    x = np.asarray(im).astype(np.float32)
    o = 70
    t_ = np.linspace(0, 1, o)[None, :, None]
    zac = x[:, :o] * t_ + x[:, -o:] * (1 - t_)
    x = np.concatenate([zac, x[:, o:-o]], axis=1)
    im = Image.fromarray(x.clip(0, 255).astype(np.uint8), "RGBA")
    im.save(OUT / "trava.png", optimize=True)
    print("trava.png", im.size, "plny pas od", (plny.min() - t) * s if len(plny) else None)


if __name__ == "__main__":
    minca()
    kocka("kocka_s_otaznikom.jpg", "kocka_otaznik.png")
    kocka("kocka_hneda.jpg", "kocka_hneda.png")
    oblak()
    trava()
