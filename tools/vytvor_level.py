"""Vygeneruje js/level1.js (prvá verzia levelu). Potom sa dá level upravovať priamo v js/level1.js."""
from pathlib import Path

W, H = 200, 15
G = [[" "] * W for _ in range(H)]


def put(x, y, ch):
    G[y][x] = ch


def row(x0, x1, y, ch):
    for x in range(x0, x1 + 1):
        put(x, y, ch)


def column(x, h, ch="S"):  # stĺpik z kameňov výšky h na zemi
    for i in range(h):
        put(x, 12 - i, ch)


# zem (riadky 13 a 14) s jamami
pits = [(66, 68), (112, 115), (150, 151)]
for x in range(W):
    if not any(a <= x <= b for a, b in pits):
        put(x, 13, "#")
        put(x, 14, "#")

put(5, 12, "P")
# začiatok
for x in (9, 10, 11):
    put(x, 10, "o")
put(15, 9, "?")
row(19, 23, 9, "B"); put(20, 9, "?"); put(22, 9, "?")
put(24, 12, "g")
column(28, 1); column(29, 2)
for x in (28, 29):
    put(x, 12 - (x - 27) - 1, "o")
# mačka
put(34, 12, "c")
row(38, 42, 10, "=")
for x in range(38, 43):
    put(x, 8, "o")
put(45, 12, "g"); put(48, 12, "g")
put(55, 12, "k")
row(58, 62, 9, "B"); put(59, 5, "?"); put(60, 5, "H"); put(61, 5, "?")
# jama 1 s mincami
for x in (66, 67, 68):
    put(x, 9, "o")
# schody hore a plošina
for i, x in enumerate(range(72, 76)):
    column(x, i + 1)
column(76, 4); column(77, 4)
row(76, 77, 7, "o")
put(82, 12, "C")
put(88, 12, "g"); put(90, 12, "g")
row(92, 95, 9, "="); row(98, 101, 6, "=")
row(98, 101, 5, "o"); put(93, 8, "o"); put(94, 8, "o")
put(105, 12, "k"); put(108, 12, "g")
# jama 2 s plošinkou
row(113, 114, 10, "=")
put(113, 9, "o"); put(114, 9, "o")
row(120, 127, 9, "B"); row(120, 127, 8, "o"); put(123, 9, "?"); put(123, 5, "?")
put(125, 12, "g"); put(130, 12, "k"); put(134, 12, "g"); put(136, 12, "g")
# pyramída
for i, x in enumerate(range(140, 144)):
    column(x, i + 1)
for i, x in enumerate(range(144, 148)):
    column(x, 4 - i)
put(150, 9, "o"); put(151, 9, "o")
put(158, 12, "g"); put(160, 12, "k")
row(162, 164, 9, "?")
# koncové schody
for i, x in enumerate(range(168, 173)):
    column(x, i + 1)
column(173, 5)
put(182, 12, "F")

rows = ["".join(r) for r in G]
legend = """// LEVEL 1 – každý znak je jedno políčko (32x32 px). Výška levelu je 15 riadkov.
//   #  zem              B  tehla (rozbije sa)     ?  blok s mincou
//   H  blok so srdiečkom (život navyše)          S  kameň
//   =  drevená plošinka (dá sa na ňu vyskočiť zospodu)
//   o  minca            g  hríb                   k  korytnačka
//   c  mačka            P  štart hráča            C  kontrolná vlajka
//   F  cieľová vlajka (stojí na zemi)
// Riadky môžu byť rôzne dlhé, chýbajúce miesta sú prázdne.
"""
body = "window.LEVEL1 = [\n" + ",\n".join("  " + repr(r).replace("'", '"') for r in rows) + "\n];\n"
Path(__file__).resolve().parent.parent.joinpath("js", "level1.js").write_text(legend + body, encoding="utf-8")
print("ok")
