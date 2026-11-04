"""Nasadenie novej verzie hry na GitHub (GitHub Pages).

Použitie:  python tools/nasad.py

Postup:
  1. zistí novú verziu (prvé nasadenie = v0.01, potom vždy +0.01)
  2. urobí lokálnu zálohu celého projektu do priečinka zalohy/
  3. ukáže, čo sa zmenilo, a POČKÁ NA POTVRDENIE
  4. až po potvrdení zapíše verziu, urobí commit, tag a push na GitHub
"""
import datetime
import re
import subprocess
import sys
import zipfile
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERZIA_JS = ROOT / "js" / "verzia.js"
SW_JS = ROOT / "sw.js"
ZALOHY = ROOT / "zalohy"
VYNECHAJ = {".git", "zalohy", "__pycache__", ".claude"}


def git(*args, check=True):
    r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    if check and r.returncode != 0:
        print(r.stdout + r.stderr)
        sys.exit(f"Chyba pri: git {' '.join(args)}")
    return r


def aktualna_verzia():
    m = re.search(r'HRA_VERZIA\s*=\s*"([\d.]+)"', VERZIA_JS.read_text(encoding="utf-8"))
    return Decimal(m.group(1))


def zapis_verziu(v):
    s = f"{v:.2f}"
    VERZIA_JS.write_text(VERZIA_JS.read_text(encoding="utf-8").replace(
        re.search(r'HRA_VERZIA\s*=\s*"[\d.]+"', VERZIA_JS.read_text(encoding="utf-8")).group(0),
        f'HRA_VERZIA = "{s}"'), encoding="utf-8")
    sw = SW_JS.read_text(encoding="utf-8")
    SW_JS.write_text(re.sub(r"const VERZIA = '[\d.]+';", f"const VERZIA = '{s}';", sw), encoding="utf-8")


def zaloha(nova):
    ZALOHY.mkdir(exist_ok=True)
    cas = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    ciel = ZALOHY / f"zaloha_pred_v{nova:.2f}_{cas}.zip"
    with zipfile.ZipFile(ciel, "w", zipfile.ZIP_DEFLATED) as z:
        for p in ROOT.rglob("*"):
            rel = p.relative_to(ROOT)
            if p.is_file() and not (set(rel.parts) & VYNECHAJ):
                z.write(p, rel)
    return ciel


def main():
    for s in (sys.stdout, sys.stderr):
        try:
            s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    if subprocess.run(["git", "--version"], capture_output=True).returncode != 0:
        sys.exit("Git nie je nainštalovaný.")
    if not (ROOT / ".git").exists():
        git("init", "-b", "main")
        print("Vytvorený nový git repozitár.")

    akt = aktualna_verzia()
    tag_existuje = git("rev-parse", "-q", "--verify", f"refs/tags/v{akt:.2f}", check=False).returncode == 0
    nova = akt + Decimal("0.01") if tag_existuje else akt

    ciel = zaloha(nova)
    print(f"✔ Záloha: {ciel}")

    zmeny = git("status", "--short").stdout.strip()
    print(f"\nNová verzia: v{nova:.2f}  (doteraz nasadená: {'v%.2f' % akt if tag_existuje else 'žiadna'})")
    print("Zmenené súbory:\n" + (zmeny or "  (žiadne)"))
    origin = git("remote", "get-url", "origin", check=False)
    if origin.returncode != 0:
        print("\n⚠ Nie je nastavený GitHub repozitár (origin). Nasadenie sa zastaví po commite.")
    else:
        print("Cieľ: " + origin.stdout.strip())

    if input(f"\nNasadiť verziu v{nova:.2f}? [a/N] ").strip().lower() not in ("a", "ano", "áno", "y", "yes"):
        print("Zrušené. Nič sa nenasadilo (záloha zostala).")
        return

    zapis_verziu(nova)
    git("add", "-A")
    git("commit", "-m", f"Verzia v{nova:.2f}")
    git("tag", f"v{nova:.2f}")
    if origin.returncode == 0:
        git("push", "-u", "origin", "main")
        git("push", "origin", f"v{nova:.2f}")
        print(f"✔ Verzia v{nova:.2f} je nasadená. GitHub Pages ju zverejní do 1–2 minút.")
    else:
        print(f"✔ Verzia v{nova:.2f} je pripravená lokálne (commit + tag). Chýba origin na GitHube.")


if __name__ == "__main__":
    main()
