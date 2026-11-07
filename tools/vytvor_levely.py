"""Vygeneruje js/levely.js so všetkými levelmi hry.

Použitie:  python tools/vytvor_levely.py
Každý level je mriežka 15 riadkov; zem je v riadkoch 13 a 14, na zemi stojí všetko v riadku 12.
"""
import json
from pathlib import Path

H = 15


class Level:
    def __init__(self, w, jamy):
        self.w = w
        self.g = [[" "] * w for _ in range(H)]
        for x in range(w):
            if not any(a <= x <= b for a, b in jamy):
                self.g[13][x] = "#"
                self.g[14][x] = "#"

    def put(self, x, y, ch):
        self.g[y][x] = ch

    def row(self, x0, x1, y, ch):
        for x in range(x0, x1 + 1):
            self.g[y][x] = ch

    def stlpik(self, x, h, ch="S"):  # stĺpik z kameňov výšky h na zemi
        for i in range(h):
            self.g[12 - i][x] = ch

    def schody_hore(self, x0, n):
        for i in range(n):
            self.stlpik(x0 + i, i + 1)

    def schody_dole(self, x0, n):
        for i in range(n):
            self.stlpik(x0 + i, n - i)

    def zem(self, *xs, ch="g"):  # nepriatelia na zemi
        for x in xs:
            self.g[12][x] = ch

    def riadky(self):
        return ["".join(r).rstrip() for r in self.g]


# ------------------------------------------------------------------ LEVEL 1 – bez mačky
def level1():
    L = Level(200, [(66, 68), (112, 115), (150, 151)])
    L.put(5, 12, "P")
    L.row(9, 11, 10, "o")
    L.put(15, 9, "?")
    L.row(19, 23, 9, "B"); L.put(20, 9, "?"); L.put(22, 9, "?")
    L.zem(24)
    L.stlpik(28, 1); L.stlpik(29, 2)
    L.put(28, 10, "o"); L.put(29, 9, "o")
    L.zem(34, 36)
    L.row(38, 42, 10, "=")
    L.row(38, 42, 8, "o")
    L.zem(45, 48)
    L.zem(55, ch="k")
    L.row(58, 62, 9, "B"); L.put(59, 5, "?"); L.put(60, 5, "H"); L.put(61, 5, "?")
    L.row(66, 68, 9, "o")
    L.schody_hore(72, 4)
    L.stlpik(76, 4); L.stlpik(77, 4)
    L.row(76, 77, 7, "o")
    L.zem(79)
    L.put(82, 12, "C")
    L.zem(88, 90)
    L.row(92, 95, 9, "="); L.row(98, 101, 6, "=")
    L.row(98, 101, 5, "o"); L.put(93, 8, "o"); L.put(94, 8, "o")
    L.zem(105, ch="k"); L.zem(108)
    L.row(113, 114, 10, "=")
    L.put(113, 9, "o"); L.put(114, 9, "o")
    L.zem(118)
    L.row(120, 127, 9, "B"); L.row(120, 127, 8, "o"); L.put(123, 9, "?"); L.put(123, 5, "?")
    L.zem(125); L.zem(130, ch="k"); L.zem(134, 136)
    L.schody_hore(140, 4); L.schody_dole(144, 4)
    L.put(150, 9, "o"); L.put(151, 9, "o")
    L.zem(155, ch="k"); L.zem(158); L.zem(160, ch="k")
    L.row(162, 164, 9, "?")
    L.zem(166)
    L.schody_hore(168, 5)
    L.stlpik(173, 5)
    L.put(182, 12, "F")
    return {"nazov": "Lúka", "rychlost": 1.0, "riadky": L.riadky()}


# ------------------------------------------------------------------ LEVEL 2 – sivá mačka
def level2():
    L = Level(215, [(40, 42), (70, 73), (100, 103), (140, 144), (176, 179)])
    L.put(4, 12, "P")
    L.row(8, 11, 10, "o")
    L.put(18, 9, "?"); L.row(19, 21, 9, "B"); L.put(22, 9, "?"); L.put(20, 5, "H")
    L.zem(26, 28); L.zem(34, ch="k")
    # jama medzi kamennými schodmi
    L.schody_hore(36, 3); L.stlpik(39, 3)
    L.stlpik(43, 3); L.stlpik(44, 2); L.stlpik(45, 1)
    L.row(40, 42, 7, "o")
    # plošinka s hríbom
    L.row(48, 52, 9, "="); L.put(50, 8, "g"); L.row(48, 52, 6, "o")
    L.row(55, 60, 9, "B"); L.put(57, 9, "?"); L.put(59, 9, "?"); L.row(55, 60, 8, "o")
    L.zem(58, 61); L.zem(65, ch="k")
    # široká jama (4)
    L.row(70, 73, 8, "o")
    # stĺpiky s nepriateľmi medzi nimi
    L.stlpik(78, 2); L.zem(80); L.stlpik(82, 3); L.zem(84); L.stlpik(86, 4)
    L.put(86, 7, "o")
    L.row(88, 92, 8, "="); L.row(94, 97, 5, "="); L.row(94, 97, 4, "o")
    L.row(101, 102, 9, "=")
    L.put(108, 12, "C")
    L.put(110, 12, "c")  # sivá mačka v strede levelu (hneď za kontrolnou vlajkou)
    L.row(112, 119, 9, "B"); L.put(114, 9, "?"); L.put(117, 9, "?"); L.put(115, 5, "?")
    L.zem(113, 115); L.zem(120, ch="k"); L.zem(124, 126)
    L.schody_hore(128, 4); L.schody_dole(132, 4)
    L.row(129, 134, 6, "o")
    # jama (5) s kameňom uprostred
    L.put(142, 10, "S"); L.put(142, 9, "o")
    L.zem(150, 154, ch="k"); L.zem(157, 159)
    L.row(152, 156, 9, "="); L.row(152, 156, 8, "o")
    L.put(163, 9, "?"); L.put(164, 9, "B"); L.put(165, 9, "?")
    L.row(166, 168, 5, "B"); L.row(166, 168, 4, "o")
    L.zem(168, 170); L.zem(173, ch="k")
    L.row(176, 179, 9, "o")
    L.schody_hore(184, 7); L.stlpik(191, 7)
    L.zem(194)
    L.put(202, 12, "F")
    return {"nazov": "Mačací kopec", "rychlost": 1.15, "riadky": L.riadky()}


# ------------------------------------------------------------------ LEVEL 3 – lietajúca mačka
def level3():
    L = Level(250, [(36, 40), (60, 66), (96, 101), (130, 138), (170, 175), (205, 210)])
    L.put(4, 12, "P")
    L.put(12, 12, "M")  # kocka na výber mačky
    L.row(16, 30, 2, "o")  # mince v oblakoch – iba pre lietajúcich
    L.put(17, 9, "?"); L.row(18, 20, 9, "B"); L.put(21, 9, "H")
    L.zem(22, 25); L.zem(28, ch="k")
    L.schody_hore(32, 4)
    L.put(38, 9, "S")  # kameň uprostred jamy
    L.row(36, 40, 6, "o")
    L.stlpik(41, 4); L.stlpik(42, 3)
    L.zem(46, 48, 52); L.zem(55, ch="k")
    L.row(48, 53, 9, "B"); L.put(50, 9, "?"); L.put(51, 5, "?")
    # dlhá jama (7) s kameňom uprostred
    L.put(63, 10, "S")
    L.row(60, 66, 3, "o")
    L.zem(70, 72, ch="k"); L.zem(75, 77)
    L.row(74, 79, 9, "="); L.put(76, 8, "g"); L.row(74, 79, 2, "o")
    L.schody_hore(83, 5); L.stlpik(88, 5)
    L.zem(92)
    L.row(97, 100, 9, "="); L.row(96, 101, 5, "o")
    L.put(106, 12, "C")
    L.zem(110, 112, 116)
    L.row(111, 115, 9, "?"); L.put(113, 5, "H")
    L.put(122, 12, "M")  # druhá kocka na výber mačky (po kontrolnej vlajke)
    L.zem(125, ch="k")
    # najdlhšia jama (9) – kamene ako schodíky
    L.row(132, 133, 12, "S"); L.row(136, 137, 11, "S")
    L.row(130, 138, 2, "o")
    L.zem(142, 144, ch="k"); L.zem(147, 149)
    L.row(150, 156, 9, "B"); L.put(152, 9, "?"); L.put(154, 9, "?"); L.row(150, 156, 4, "=")
    L.row(150, 156, 3, "o")
    L.zem(156, 158); L.zem(162, ch="k")
    L.schody_hore(164, 4); L.stlpik(168, 4); L.stlpik(169, 4)
    L.put(173, 9, "S")
    L.row(170, 175, 7, "o")
    L.stlpik(176, 4); L.stlpik(177, 3)
    L.zem(181, 183, 186, ch="g"); L.zem(189, ch="k")
    L.row(184, 188, 9, "="); L.row(192, 196, 6, "="); L.row(192, 196, 1, "o")
    L.zem(198, 200)
    L.row(205, 210, 9, "=")
    L.row(204, 211, 2, "o")
    L.schody_hore(214, 8); L.stlpik(222, 8)
    L.put(234, 12, "F")
    return {"nazov": "Oblaky", "rychlost": 1.3, "riadky": L.riadky()}


LEGENDA = """// LEVELY – každý znak je jedno políčko (32x32 px). Výška levelu je 15 riadkov.
// Generuje tools/vytvor_levely.py (úpravy rob radšej tam).
//   #  zem              B  tehla (rozbije sa)     ?  blok s mincou
//   H  blok so srdiečkom (život navyše)          S  kameň
//   =  drevená plošinka (dá sa na ňu vyskočiť zospodu)
//   o  minca            g  hríb                   k  korytnačka
//   c  sivá mačka       M  kocka na výber mačky (sivá / lietajúca)
//   P  štart hráča      C  kontrolná vlajka       F  cieľová vlajka
"""

if __name__ == "__main__":
    levely = [level1(), level2(), level3()]
    for i, lv in enumerate(levely, 1):
        r = lv["riadky"]
        assert len(r) == H
        for y, riadok in enumerate(r):
            for x, ch in enumerate(riadok):
                if ch in "gkcMP":
                    assert r[13][x:x + 1] == "#" or y < 12, f"level {i}: {ch} na x={x} nemá zem"
        print(f"level {i}: {lv['nazov']}, šírka {max(map(len, r))}")
    js = LEGENDA + "window.LEVELY = " + json.dumps(levely, ensure_ascii=False, indent=1) + ";\n"
    Path(__file__).resolve().parent.parent.joinpath("js", "levely.js").write_text(js, encoding="utf-8")
