# Laurinkina hra

Skákačka s ručne kreslenými postavičkami. Beží v prehliadači a dá sa pridať ako ikona na plochu (Android aj iPhone).

## Súbory
- `index.html`, `style.css` – stránka hry
- `js/hra.js` – hra (fyzika, nepriatelia, mačka, kreslenie)
- `js/levely.js` – **všetky levely** (generuje `tools/vytvor_levely.py`, legenda je na začiatku súboru)
- `js/foto.js` – fotenie tváre (fotka zostáva len v zariadení)
- `js/zvuky.js` – zvukové efekty
- `sw.js`, `manifest.webmanifest` – offline režim, ikona na plochu, automatické aktualizácie
- `kresby/` – pôvodné fotky kresieb (nenahrávajú sa na GitHub)
- `assets/` – spracované postavičky

## Nástroje
- `python tools/spracuj_kresby.py` – po zmene kresieb v `kresby/` znovu vytvorí postavičky
- `python tools/ikony.py` – vytvorí ikony aplikácie
- `python tools/nasad.py` – záloha + nasadenie novej verzie (pýta sa na potvrdenie)

## Lokálne spustenie
```
python -m http.server 8765
```
a otvoriť http://localhost:8765

## Ovládanie
Šípky = chôdza, medzerník = skok (dlhšie držanie = vyšší skok), Shift = beh, ↓ = zosadnúť z mačky, P = pauza.
Na mobile sú dotykové tlačidlá.
