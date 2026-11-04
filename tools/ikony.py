"""Vytvorí ikony aplikácie (assets/ikony) z kresby hráča."""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "ikony"
OUT.mkdir(parents=True, exist_ok=True)
hrac = Image.open(ROOT / "assets" / "hrac.png").convert("RGBA")


def ikona(size, okraj, zaoblenie):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    bg = Image.new("RGBA", (size, size), (94, 194, 240, 255))
    tr = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(tr).rectangle([0, int(size * 0.8), size, size], fill=(93, 180, 65, 255))
    bg.alpha_composite(tr)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=zaoblenie, fill=255)
    im.paste(bg, (0, 0), mask)
    m = int(size * okraj)
    h = hrac.copy()
    h.thumbnail((size - 2 * m, size - 2 * m), Image.LANCZOS)
    im.alpha_composite(h, ((size - h.width) // 2, (size - h.height) // 2))
    return im


ikona(192, 0.08, 36).save(OUT / "ikona-192.png")
ikona(512, 0.08, 96).save(OUT / "ikona-512.png")
ikona(512, 0.2, 0).save(OUT / "ikona-maskable-512.png")
ikona(180, 0.1, 0).convert("RGB").save(OUT / "apple-touch-icon.png")
print("ok")
