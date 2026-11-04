// Laurinkina hra – hlavný kód hry
(() => {
  'use strict';

  const T = 32;              // veľkosť políčka
  const VH = 15 * T;         // výška pohľadu (15 políčok)
  const KROK = 1 / 60;

  // Fyzika (inšpirovaná klasickými skákačkami, prepočítaná na 32px políčka)
  const F = {
    chodMax: 3.0, behMax: 5.0,
    zrychChod: 0.09, zrychBeh: 0.13, zrychVzduch: 0.10,
    spomal: 0.14, smyk: 0.32,
    skok: 8.4, skokBeh: 9.6,
    gDrz: 0.27, gPad: 0.9, maxPad: 9.5,
    odraz: 6.5, odrazDrz: 10,
    coyote: 6, buffer: 8,
  };
  const HRAC = { w: 26, h: 44 };
  const JAZDA = { w: 58, h: 72 };
  const MACKA = { w: 58, h: 44 };
  const PEVNE = '#BS?HU';

  const $ = id => document.getElementById(id);
  const st = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const prekryv = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function rng(seed) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
  const zvuk = m => window.Zvuky && Zvuky.hraj(m);

  // ---------------------------------------------------------------- obrázky
  const IMG = {};
  let META = {};
  function nacitajObr(src) {
    return new Promise((ok, chyba) => { const i = new Image(); i.onload = () => ok(i); i.onerror = chyba; i.src = src; });
  }
  async function nacitajAssety() {
    const mena = ['hrac', 'hrac_foto', 'macka', 'hrib', 'korytnacka'];
    await Promise.all(mena.map(async m => { IMG[m] = await nacitajObr('assets/' + m + '.png'); }));
    try { META = await (await fetch('assets/sprites.json')).json(); } catch (e) { META = {}; }
    if (!META.hrac_foto) META.hrac_foto = { face: [75, 67, 190, 112] };
  }

  // ---------------------------------------------------------------- ručne kreslené dlaždice
  const wob = (r, a) => (r() - 0.5) * 2 * a;
  function cestaKrivo(c, r, x, y, w, h, a = 1.2, n = 4) {
    const p = [];
    for (let i = 0; i < n; i++) p.push([x + w * i / n + wob(r, a), y + wob(r, a)]);
    for (let i = 0; i < n; i++) p.push([x + w + wob(r, a), y + h * i / n + wob(r, a)]);
    for (let i = 0; i < n; i++) p.push([x + w - w * i / n + wob(r, a), y + h + wob(r, a)]);
    for (let i = 0; i < n; i++) p.push([x + wob(r, a), y + h - h * i / n + wob(r, a)]);
    c.beginPath();
    c.moveTo(p[0][0], p[0][1]);
    p.forEach(q => c.lineTo(q[0], q[1]));
    c.closePath();
  }
  function fixa(c, r, x, y, w, h, farba, tah, pocet = 7) {
    c.fillStyle = farba; c.fill();
    c.save(); c.clip();
    c.strokeStyle = tah; c.globalAlpha = 0.22; c.lineWidth = 2.5; c.lineCap = 'round';
    for (let i = 0; i < pocet; i++) {
      const yy = y + r() * h;
      const p = new Path2D(); // Path2D, aby sa nezmazala cesta tvaru (potrebná pre obrys)
      p.moveTo(x - 4, yy); p.lineTo(x + w + 4, yy + wob(r, 7)); c.stroke(p);
    }
    c.restore();
  }
  function obrys(c, hrubka = 2) { c.lineWidth = hrubka; c.strokeStyle = '#1d1a18'; c.lineJoin = 'round'; c.stroke(); }
  function ciara(c, r, x1, y1, x2, y2, hr = 1.6, farba = '#1d1a18') {
    c.beginPath(); c.moveTo(x1 + wob(r, .6), y1 + wob(r, .6));
    c.quadraticCurveTo((x1 + x2) / 2 + wob(r, 1.2), (y1 + y2) / 2 + wob(r, 1.2), x2 + wob(r, .6), y2 + wob(r, .6));
    c.lineWidth = hr; c.strokeStyle = farba; c.lineCap = 'round'; c.stroke();
  }
  function platnoDlazdice(kresli, seed, w = T, h = T) {
    const cv = document.createElement('canvas');
    cv.width = w * 2; cv.height = h * 2;
    const c = cv.getContext('2d');
    c.scale(2, 2);
    kresli(c, rng(seed));
    return cv;
  }
  const DL = {};
  function vytvorDlazdice() {
    const varianty = (meno, fn) => { DL[meno] = [0, 1, 2].map(i => platnoDlazdice(fn, meno.length * 97 + i * 31 + 7)); };
    varianty('zem', (c, r) => {
      c.fillStyle = '#b06b38'; c.fillRect(0, 0, T, T);
      cestaKrivo(c, r, 0, 0, T, T, 0.5); fixa(c, r, 0, 0, T, T, '#b06b38', '#6b3a1a');
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(4 + r() * 24, 4 + r() * 24, 1.5 + r() * 1.5, 0, 7); c.fillStyle = '#7b4422'; c.fill(); }
    });
    varianty('trava', (c, r) => {
      c.fillStyle = '#b06b38'; c.fillRect(0, 0, T, T);
      cestaKrivo(c, r, 0, 0, T, T, 0.5); fixa(c, r, 0, 0, T, T, '#b06b38', '#6b3a1a');
      c.beginPath(); c.moveTo(-1, 0);
      for (let x = 0; x <= T; x += 4) c.lineTo(x, 9 + wob(r, 2.2));
      c.lineTo(T + 1, 0); c.closePath();
      fixa(c, r, 0, 0, T, 12, '#5db441', '#2e7a1f', 4);
      c.beginPath(); c.moveTo(-1, 0);
      for (let x = 0; x <= T; x += 4) c.lineTo(x, 0.5 + wob(r, 0.6));
      obrys(c, 2);
    });
    varianty('B', (c, r) => {
      cestaKrivo(c, r, 1, 1, T - 2, T - 2); fixa(c, r, 1, 1, T - 2, T - 2, '#d4583a', '#7a2716'); obrys(c, 2);
      ciara(c, r, 2, 16, 30, 16); ciara(c, r, 16, 2, 16, 16); ciara(c, r, 8, 16, 8, 30); ciara(c, r, 24, 16, 24, 30);
    });
    const otaznik = (c, r) => {
      cestaKrivo(c, r, 1, 1, T - 2, T - 2); fixa(c, r, 1, 1, T - 2, T - 2, '#f6bb34', '#b5700b'); obrys(c, 2);
      c.font = 'bold 22px "Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 3; c.strokeStyle = '#6b3a12'; c.strokeText('?', 16 + wob(r, 1), 17);
      c.fillStyle = '#fff6d5'; c.fillText('?', 16 + wob(r, 1), 17);
      [[5, 5], [27, 5], [5, 27], [27, 27]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 1.4, 0, 7); c.fillStyle = '#6b3a12'; c.fill(); });
    };
    varianty('?', otaznik);
    DL['H'] = DL['?'];
    varianty('U', (c, r) => {
      cestaKrivo(c, r, 1, 1, T - 2, T - 2); fixa(c, r, 1, 1, T - 2, T - 2, '#9b7656', '#54392a'); obrys(c, 2);
      [[5, 5], [27, 5], [5, 27], [27, 27]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 1.4, 0, 7); c.fillStyle = '#3a2618'; c.fill(); });
    });
    varianty('S', (c, r) => {
      cestaKrivo(c, r, 1, 1, T - 2, T - 2, 1.4); fixa(c, r, 1, 1, T - 2, T - 2, '#a79d92', '#5d554d'); obrys(c, 2);
      ciara(c, r, 6, 8, 13, 13, 1.2); ciara(c, r, 20, 22, 27, 25, 1.2); ciara(c, r, 22, 6, 25, 11, 1.2);
    });
    varianty('=', (c, r) => {
      cestaKrivo(c, r, 0, 1, T, 12, 0.8); fixa(c, r, 0, 1, T, 12, '#c98d4f', '#7a4b1f', 3); obrys(c, 2);
      ciara(c, r, 4, 7, 26, 7, 1, '#7a4b1f');
    });
    DL.minca = platnoDlazdice((c, r) => {
      c.beginPath(); c.ellipse(10, 12, 7.5, 10, 0, 0, 7);
      fixa(c, r, 2, 2, 16, 20, '#ffd23f', '#c48a00', 3); obrys(c, 2);
      ciara(c, r, 10, 6, 10, 18, 2, '#c48a00');
    }, 5, 20, 24);
    DL.srdce = platnoDlazdice((c, r) => {
      c.beginPath(); c.moveTo(12, 21);
      c.bezierCurveTo(-4, 10, 4, -1, 12, 6); c.bezierCurveTo(20, -1, 28, 10, 12, 21);
      fixa(c, r, 0, 0, 24, 22, '#ff4f7b', '#a3173b', 3); obrys(c, 2);
    }, 9, 24, 22);
  }

  // pozadie – kopce, oblaky, kríky (predkreslené)
  const POZ = { kopce: [], oblaky: [], kriky: [] };
  function vytvorPozadie(sirkaSveta) {
    const r = rng(12345);
    POZ.kopce = []; POZ.oblaky = []; POZ.kriky = [];
    const kopec = (w, h, farba) => {
      const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = (h + 4) * 2;
      const c = cv.getContext('2d'); c.scale(2, 2);
      const rr = rng(w * 7 + h);
      c.beginPath(); c.moveTo(0, h + 4);
      for (let i = 0; i <= 20; i++) {
        const t = i / 20, x = t * w;
        c.lineTo(x, h + 4 - Math.sin(t * Math.PI) * h + wob(rr, 1.2));
      }
      c.closePath();
      fixa(c, rr, 0, 0, w, h + 4, farba, '#1f5d2a', 6); obrys(c, 2.2);
      return cv;
    };
    for (let x = -100; x < sirkaSveta * 0.45 + 1400; x += 260 + r() * 300) {
      const w = 220 + r() * 260, h = 70 + r() * 90;
      POZ.kopce.push({ x, w, h, cv: kopec(Math.round(w), Math.round(h), r() < 0.5 ? '#86cf6a' : '#74c25c') });
    }
    const oblak = (w) => {
      const h = w * 0.5;
      const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2;
      const c = cv.getContext('2d'); c.scale(2, 2);
      const rr = rng(w * 13);
      c.beginPath();
      const n = 4;
      for (let i = 0; i < n; i++) {
        const cx = w * (0.22 + 0.56 * i / (n - 1)), cy = h * (0.55 - Math.sin(i / (n - 1) * Math.PI) * 0.18);
        c.moveTo(cx + h * 0.33, cy); c.arc(cx, cy, h * (0.28 + rr() * 0.08), 0, Math.PI * 2);
      }
      c.fillStyle = '#ffffff'; c.fill();
      c.lineWidth = 2; c.strokeStyle = 'rgba(40,60,90,0.55)'; c.stroke();
      return cv;
    };
    for (let x = 0; x < sirkaSveta * 0.6 + 1600; x += 200 + r() * 260) {
      const w = Math.round(70 + r() * 70);
      POZ.oblaky.push({ x, y: 30 + r() * 110, w, cv: oblak(w) });
    }
    const krik = (w) => {
      const h = 26;
      const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2;
      const c = cv.getContext('2d'); c.scale(2, 2);
      const rr = rng(w * 3 + 1);
      c.beginPath();
      const n = Math.max(2, Math.round(w / 22));
      for (let i = 0; i < n; i++) {
        const cx = w * (0.5 + i) / n, rad = (w / n) * 0.62;
        c.moveTo(cx + rad, h); c.arc(cx, h, rad, Math.PI * 2, Math.PI, true);
      }
      fixa(c, rr, 0, 0, w, h, '#4fae3e', '#1f5d2a', 4); obrys(c, 2);
      return cv;
    };
    for (let x = 120; x < sirkaSveta; x += 180 + r() * 380) {
      POZ.kriky.push({ x, cv: krik(Math.round(44 + r() * 60)) });
    }
  }

  // ---------------------------------------------------------------- svet
  let svet = null;
  function postavSvet(levelRiadky, checkpointX) {
    const H = 15;
    const W = Math.max(...levelRiadky.map(r => r.length));
    const g = [];
    const s = {
      W, H, g, nepr: [], castice: [], popupy: [], bump: new Map(),
      start: { x: 3, y: 12 }, checkpointy: [], vlajka: null, macka: null, macka0: null,
      checkpoint: checkpointX ?? null, cas: 0,
    };
    for (let y = 0; y < H; y++) {
      g.push([]);
      const riadok = levelRiadky[y] || '';
      for (let x = 0; x < W; x++) {
        let ch = riadok[x] || ' ';
        switch (ch) {
          case 'P': s.start = { x, y }; ch = ' '; break;
          case 'g': s.nepr.push(novyNepriatel('hrib', x, y)); ch = ' '; break;
          case 'k': s.nepr.push(novyNepriatel('korytnacka', x, y)); ch = ' '; break;
          case 'c': s.macka0 = { x, y }; ch = ' '; break;
          case 'C': s.checkpointy.push({ x, y, aktivny: checkpointX === x }); ch = ' '; break;
          case 'F': s.vlajka = { x, y, vlajkaY: 0 }; ch = 'S'; break;
        }
        g[y].push(ch);
      }
    }
    if (s.macka0) s.macka = novaMacka(s.macka0.x * T + (T - MACKA.w) / 2, (s.macka0.y + 1) * T - MACKA.h);
    return s;
  }
  function novyNepriatel(typ, tx, ty) {
    const w = 28, h = typ === 'hrib' ? 30 : 40;
    return { typ, x: tx * T + (T - w) / 2, y: (ty + 1) * T - h, w, h, vx: -1, vy: 0, stav: 'chodi', t: 0, aktivny: false, chran: 0 };
  }
  function novaMacka(x, y) {
    return { x, y, w: MACKA.w, h: MACKA.h, vx: 0.6, vy: 0, stav: 'chodi', t: 0, domX: x, cakaj: 0, chod: 0 };
  }
  const tile = (x, y) => (y < 0 || y >= svet.H || x < 0 || x >= svet.W) ? ' ' : svet.g[y][x];
  function pevne(x, y) {
    if (x < 0 || x >= svet.W) return true;
    if (y < 0 || y >= svet.H) return false;
    const t = svet.g[y][x];
    return t !== ' ' && PEVNE.includes(t);
  }

  function posunX(e, dx) {
    e.x += dx;
    e.stena = 0;
    const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.01) / T);
    if (dx > 0) {
      const tx = Math.floor((e.x + e.w - 0.01) / T);
      for (let y = y0; y <= y1; y++) if (pevne(tx, y)) { e.x = tx * T - e.w; e.stena = 1; break; }
    } else if (dx < 0) {
      const tx = Math.floor(e.x / T);
      for (let y = y0; y <= y1; y++) if (pevne(tx, y)) { e.x = (tx + 1) * T; e.stena = -1; break; }
    }
  }
  function posunY(e, dy) {
    const predSpodok = e.y + e.h;
    e.y += dy;
    e.naZemi = false;
    const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.01) / T);
    if (dy > 0) {
      const ty = Math.floor((e.y + e.h - 0.01) / T);
      for (let x = x0; x <= x1; x++) {
        if (pevne(x, ty) || (tile(x, ty) === '=' && predSpodok <= ty * T + 0.5)) {
          e.y = ty * T - e.h; e.vy = 0; e.naZemi = true; return null;
        }
      }
    } else if (dy < 0) {
      const ty = Math.floor(e.y / T);
      const zasahy = [];
      for (let x = x0; x <= x1; x++) if (pevne(x, ty)) zasahy.push(x);
      if (zasahy.length) { e.y = (ty + 1) * T; e.vy = 0; return { ty, zasahy }; }
    }
    return null;
  }
  function boxVolny(b) {
    const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.01) / T);
    const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.01) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (pevne(x, y)) return false;
    return true;
  }

  // ---------------------------------------------------------------- hráč a stav hry
  let hrac = null;
  let hra = { zivoty: 3, mince: 0, skore: 0, nepriatelia: 0 };
  let kamera = { x: 0 };
  let rezim = 'menu'; // menu | hra | pauza | koniec
  let vyhra = null;
  let postavaImg = null;

  function novyHrac() {
    const sx = svet.checkpoint != null ? svet.checkpoint : svet.start.x;
    return {
      x: sx * T + 3, y: 13 * T - HRAC.h, w: HRAC.w, h: HRAC.h, vx: 0, vy: 0,
      naZemi: false, smer: 1, coyote: 0, buffer: 0, nesmrtelny: 60, jazdi: false,
      mrtvy: false, t: 0, chod: 0, predSpodok: 0,
    };
  }

  function novaHra() {
    hra = { zivoty: 3, mince: 0, skore: 0, nepriatelia: 0, start: performance.now() };
    svet = postavSvet(window.LEVEL1, null);
    vytvorPozadie(svet.W * T);
    hrac = novyHrac();
    vyhra = null;
    kamera.x = 0;
  }
  function znovuOdCheckpointu() {
    const cp = svet.checkpoint;
    svet = postavSvet(window.LEVEL1, cp);
    hrac = novyHrac();
    vyhra = null;
    kamera.x = clamp(hrac.x - sirkaPohladu * 0.4, 0, svet.W * T - sirkaPohladu);
  }

  function popup(x, y, text) { svet.popupy.push({ x, y, text, t: 0 }); }
  function pridajSkore(n, x, y) { hra.skore += n; if (x != null) popup(x, y, '+' + n); }
  function pridajMincu(x, y) {
    hra.mince++; hra.skore += 50; zvuk('minca');
    if (hra.mince % 50 === 0) { hra.zivoty++; zvuk('zivot'); popup(x, y - 20, '+1 ❤'); }
  }

  // ---------------------------------------------------------------- vstup
  const klav = { vlavo: false, vpravo: false, skok: false, beh: false, dole: false };
  const dotyk = { vlavo: false, vpravo: false, skok: false, beh: false, dole: false };
  let predSkok = false;
  const KLAVESY = {
    ArrowLeft: 'vlavo', KeyA: 'vlavo', ArrowRight: 'vpravo', KeyD: 'vpravo',
    Space: 'skok', ArrowUp: 'skok', KeyW: 'skok', KeyZ: 'skok', KeyK: 'skok',
    ShiftLeft: 'beh', ShiftRight: 'beh', KeyX: 'beh', KeyJ: 'beh',
    ArrowDown: 'dole', KeyS: 'dole',
  };
  addEventListener('keydown', e => {
    if (KLAVESY[e.code]) { klav[KLAVESY[e.code]] = true; if (rezim === 'hra') e.preventDefault(); }
    if ((e.code === 'Escape' || e.code === 'KeyP') && (rezim === 'hra' || rezim === 'pauza')) prepniPauzu();
    if (e.code === 'Enter' && rezim === 'menu') spustiHru();
    Zvuky.odomkni();
  });
  addEventListener('keyup', e => { if (KLAVESY[e.code]) klav[KLAVESY[e.code]] = false; });
  addEventListener('blur', () => { Object.keys(klav).forEach(k => klav[k] = false); if (rezim === 'hra') prepniPauzu(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && rezim === 'hra') prepniPauzu(); });

  function napojDotyk() {
    const box = $('dotyk');
    const prepocitaj = e => {
      e.preventDefault();
      Object.keys(dotyk).forEach(k => dotyk[k] = false);
      box.querySelectorAll('button').forEach(b => b.classList.remove('stlacene'));
      for (const t of e.touches) {
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const b = el && el.closest && el.closest('#dotyk button');
        if (b) {
          b.dataset.k.split(' ').forEach(k => dotyk[k] = true);
          b.classList.add('stlacene');
        }
      }
      Zvuky.odomkni();
    };
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(t => box.addEventListener(t, prepocitaj, { passive: false }));
  }
  const vstup = () => ({
    vlavo: klav.vlavo || dotyk.vlavo, vpravo: klav.vpravo || dotyk.vpravo,
    skok: klav.skok || dotyk.skok, beh: klav.beh || dotyk.beh, dole: klav.dole || dotyk.dole,
  });

  // ---------------------------------------------------------------- logika
  function udrieBlok(tx, ty) {
    const t = tile(tx, ty);
    const kluc = tx + ',' + ty;
    if (t === '?' || t === 'H') {
      svet.g[ty][tx] = 'U';
      svet.bump.set(kluc, 10);
      if (t === '?') {
        pridajMincu(tx * T + 16, ty * T);
        svet.castice.push({ typ: 'minca', x: tx * T + 6, y: ty * T - 24, vx: 0, vy: -7, t: 0 });
        popup(tx * T + 16, ty * T - 30, '+50');
      } else {
        hra.zivoty++; zvuk('zivot');
        svet.castice.push({ typ: 'srdce', x: tx * T + 4, y: ty * T - 24, vx: 0, vy: -5, t: 0 });
        popup(tx * T + 16, ty * T - 34, '+1 ❤');
      }
    } else if (t === 'B') {
      svet.g[ty][tx] = ' ';
      zvuk('tehla');
      for (let i = 0; i < 4; i++) {
        svet.castice.push({ typ: 'tehla', x: tx * T + (i % 2) * 16, y: ty * T + (i > 1 ? 16 : 0), vx: (i % 2 ? 2 : -2), vy: i > 1 ? -5 : -8, t: 0, rot: 0 });
      }
      pridajSkore(10);
    } else {
      zvuk('buch');
      svet.bump.set(kluc, 6);
    }
    // nepriatelia stojaci na bloku vyletia
    const nad = { x: tx * T, y: (ty - 1) * T, w: T, h: T };
    svet.nepr.forEach(n => { if (n.stav !== 'padnuty' && prekryv(n, nad)) zhodNepriatela(n, 1); });
    if (tile(tx, ty - 1) === 'o') { svet.g[ty - 1][tx] = ' '; pridajMincu(tx * T + 16, (ty - 1) * T); }
  }

  function zhodNepriatela(n, smer) {
    n.stav = 'padnuty'; n.vy = -6; n.vx = 1.5 * smer; n.t = 0;
    hra.nepriatelia++;
    pridajSkore(n.typ === 'hrib' ? 100 : 200, n.x + n.w / 2, n.y);
    zvuk('kopnutie');
  }

  function zraneny() {
    if (hrac.nesmrtelny > 0 || hrac.mrtvy || vyhra) return;
    if (hrac.jazdi) zosadni(true);
    else smrt();
  }

  function smrt() {
    hrac.mrtvy = true; hrac.vy = -10; hrac.vx = 0; hrac.t = 0;
    zvuk('smrt');
  }

  function nasadni(m) {
    const spodok = m.y + m.h;
    const box = { x: m.x + m.w / 2 - JAZDA.w / 2, y: spodok - JAZDA.h, w: JAZDA.w, h: JAZDA.h };
    if (!boxVolny(box)) return false;
    Object.assign(hrac, box);
    hrac.jazdi = true; hrac.vy = 0; hrac.naZemi = true;
    svet.macka = null;
    zvuk('mnau');
    popup(hrac.x + hrac.w / 2, hrac.y - 4, 'Mňau!');
    return true;
  }

  function zosadni(zraneny) {
    const spodok = hrac.y + hrac.h, cx = hrac.x + hrac.w / 2;
    const m = novaMacka(cx - MACKA.w / 2, spodok - MACKA.h);
    m.cakaj = zraneny ? 90 : 40;
    if (zraneny) { m.stav = 'utek'; m.t = 0; m.vx = -hrac.smer * 3.5; }
    else { m.vx = 0.6 * hrac.smer; }
    if (!boxVolny(m)) { m.y = Math.floor(spodok / T) * T - MACKA.h; }
    svet.macka = m;
    hrac.jazdi = false;
    hrac.w = HRAC.w; hrac.h = HRAC.h;
    hrac.x = cx - HRAC.w / 2; hrac.y = spodok - HRAC.h;
    if (zraneny) { hrac.vy = -6; hrac.nesmrtelny = 120; zvuk('au'); popup(cx, hrac.y - 6, 'Mňauu!'); }
    else { hrac.vy = -7; }
  }

  function aktualizujHraca() {
    const v = vstup();
    const novySkok = v.skok && !predSkok;
    predSkok = v.skok;
    const h = hrac;

    if (h.mrtvy) {
      h.t++;
      if (h.t > 30) { h.vy = Math.min(h.vy + 0.5, 12); h.y += h.vy; }
      if (h.t > 150) {
        hra.zivoty--;
        if (hra.zivoty <= 0) koniecHry(false);
        else znovuOdCheckpointu();
      }
      return;
    }
    if (vyhra) { aktualizujVyhru(); return; }

    if (h.nesmrtelny > 0) h.nesmrtelny--;
    if (novySkok) h.buffer = F.buffer;

    const nasobok = h.jazdi ? 1.12 : 1;
    const maxR = (v.beh ? F.behMax : F.chodMax) * nasobok;
    const smerVstup = (v.vpravo ? 1 : 0) - (v.vlavo ? 1 : 0);
    if (smerVstup) {
      const zr = h.naZemi ? (v.beh ? F.zrychBeh : F.zrychChod) : F.zrychVzduch;
      if (Math.sign(h.vx) === -smerVstup && h.naZemi) h.vx += smerVstup * F.smyk;
      else h.vx += smerVstup * zr;
      if (Math.abs(h.vx) > maxR) h.vx -= Math.sign(h.vx) * Math.min(F.spomal, Math.abs(h.vx) - maxR);
      h.smer = smerVstup;
    } else if (h.naZemi) {
      h.vx -= Math.sign(h.vx) * Math.min(Math.abs(h.vx), F.spomal);
    }

    if (h.naZemi) h.coyote = F.coyote; else h.coyote--;
    if (h.buffer > 0 && h.coyote > 0) {
      const r = clamp((Math.abs(h.vx) - 1) / (F.behMax - 1), 0, 1);
      h.vy = -(F.skok + (F.skokBeh - F.skok) * r) * (h.jazdi ? 1.08 : 1);
      h.coyote = 0; h.buffer = 0; h.naZemi = false;
      zvuk('skok');
    }
    if (h.buffer > 0) h.buffer--;

    // zosadnutie
    if (h.jazdi && v.dole && h.naZemi) zosadni(false);

    const g = (h.vy < 0 && v.skok) ? F.gDrz : F.gPad;
    h.vy = Math.min(h.vy + g, F.maxPad);

    h.predSpodok = h.y + h.h;
    posunX(h, h.vx);
    if (h.stena) h.vx = 0;
    const naraz = posunY(h, h.vy);
    if (naraz) {
      const cx = h.x + h.w / 2;
      let najlepsi = naraz.zasahy[0];
      naraz.zasahy.forEach(x => { if (Math.abs(x * T + 16 - cx) < Math.abs(najlepsi * T + 16 - cx)) najlepsi = x; });
      udrieBlok(najlepsi, naraz.ty);
    }
    if (h.naZemi) h.chod += Math.abs(h.vx); else h.chod = 0;

    // mince
    const x0 = Math.floor(h.x / T), x1 = Math.floor((h.x + h.w - 1) / T);
    const y0 = Math.floor(h.y / T), y1 = Math.floor((h.y + h.h - 1) / T);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (tile(x, y) === 'o') { svet.g[y][x] = ' '; pridajMincu(x * T + 16, y * T); }
    }

    // pád do jamy
    if (h.y > svet.H * T + 40) { if (h.jazdi) { h.jazdi = false; } h.nesmrtelny = 0; smrt(); h.vy = 0; return; }

    // checkpoint
    svet.checkpointy.forEach(cp => {
      if (!cp.aktivny && h.x + h.w > cp.x * T + 8) {
        cp.aktivny = true; svet.checkpoint = cp.x; zvuk('zivot'); popup(cp.x * T + 16, cp.y * T - 30, 'Uložené!');
      }
    });

    // cieľová vlajka
    const vl = svet.vlajka;
    if (vl) {
      // stačí sa dotknúť tyče alebo kameňa pod ňou
      if (h.x + h.w >= vl.x * T - 1 && h.y + h.h > 3 * T) zacniVyhru();
    }

    // mačka – nasadnutie
    const m = svet.macka;
    if (m && !h.jazdi && m.cakaj <= 0 && h.vy > 0 && prekryv(h, m) && h.predSpodok <= m.y + 18) nasadni(m);
  }

  function aktualizujMacku() {
    const m = svet.macka;
    if (!m) return;
    if (m.cakaj > 0) m.cakaj--;
    m.t++;
    if (m.stav === 'utek' && m.t > 70) { m.stav = 'chodi'; m.vx = 0.6 * Math.sign(m.vx || 1); m.domX = m.x; }
    m.vy = Math.min(m.vy + F.gPad, F.maxPad);
    const pred = m.vx;
    posunX(m, m.vx);
    if (m.stena) m.vx = -pred;
    posunY(m, m.vy);
    if (m.naZemi) {
      // neskočí do jamy
      const predok = m.vx > 0 ? Math.floor((m.x + m.w + 2) / T) : Math.floor((m.x - 2) / T);
      const podTy = Math.floor((m.y + m.h + 2) / T);
      if (!pevne(predok, podTy) && tile(predok, podTy) !== '=') m.vx = -m.vx;
      if (m.stav === 'chodi' && Math.abs(m.x - m.domX) > 3 * T && Math.sign(m.x - m.domX) === Math.sign(m.vx)) m.vx = -m.vx;
      m.chod += Math.abs(m.vx);
    }
    if (m.y > svet.H * T + 100) { m.x = svet.macka0.x * T; m.y = svet.macka0.y * T; m.vy = 0; }
  }

  function aktualizujNepriatelov() {
    const pravyOkraj = kamera.x + sirkaPohladu + 2 * T;
    for (const n of svet.nepr) {
      if (!n.aktivny) { if (n.x < pravyOkraj) n.aktivny = true; else continue; }
      n.t++;
      if (n.chran > 0) n.chran--;
      if (n.stav === 'padnuty') { n.vy += 0.5; n.y += n.vy; n.x += n.vx; continue; }
      if (n.stav === 'placka') continue;
      if (n.stav === 'pancier') {
        n.vx = 0;
        if (n.t > 480) { n.stav = 'chodi'; n.y -= 14; n.h = 40; n.vx = hrac.x < n.x ? -1 : 1; n.t = 0; }
      }
      n.vy = Math.min(n.vy + 0.5, F.maxPad);
      const pred = n.vx;
      posunX(n, n.vx);
      if (n.stena) { n.vx = -pred; if (n.stav === 'pancierIde' && Math.abs(n.x - hrac.x) < sirkaPohladu) zvuk('buch'); }
      posunY(n, n.vy);
    }
    // vzájomné zrážky
    const aktivni = svet.nepr.filter(n => n.aktivny && (n.stav === 'chodi' || n.stav === 'pancierIde' || n.stav === 'pancier'));
    for (let i = 0; i < aktivni.length; i++) for (let j = i + 1; j < aktivni.length; j++) {
      const a = aktivni[i], b = aktivni[j];
      if (!prekryv(a, b) || a.stav === 'padnuty' || b.stav === 'padnuty') continue;
      if (a.stav === 'pancierIde' && b.stav !== 'pancierIde') zhodNepriatela(b, Math.sign(a.vx));
      else if (b.stav === 'pancierIde' && a.stav !== 'pancierIde') zhodNepriatela(a, Math.sign(b.vx));
      else if (a.stav === 'pancierIde' && b.stav === 'pancierIde') { zhodNepriatela(a, 1); zhodNepriatela(b, -1); }
      else if (a.stav === 'chodi' && b.stav === 'chodi') {
        if ((a.x < b.x && a.vx > 0) || (a.x > b.x && a.vx < 0)) a.vx = -a.vx;
        if ((b.x < a.x && b.vx > 0) || (b.x > a.x && b.vx < 0)) b.vx = -b.vx;
      }
    }
    svet.nepr = svet.nepr.filter(n => !((n.stav === 'placka' && n.t > 30) || n.y > svet.H * T + 200));
  }

  function hracVsNepriatelia() {
    const h = hrac;
    if (h.mrtvy || vyhra) return;
    for (const n of svet.nepr) {
      if (!n.aktivny || n.stav === 'padnuty' || n.stav === 'placka') continue;
      if (!prekryv(h, n)) continue;
      const v = vstup();
      const zhora = h.vy > 0 && h.predSpodok <= n.y + 12;
      const odraz = () => { h.vy = -(v.skok ? F.odrazDrz : F.odraz); h.y = n.y - h.h; };
      if (zhora) {
        if (n.typ === 'hrib') {
          n.stav = 'placka'; n.t = 0; hra.nepriatelia++; pridajSkore(100, n.x + n.w / 2, n.y); zvuk('dupnutie');
        } else if (n.stav === 'chodi') {
          n.stav = 'pancier'; n.t = 0; n.y += 14; n.h = 26; n.vx = 0; pridajSkore(200, n.x + n.w / 2, n.y); zvuk('dupnutie');
        } else if (n.stav === 'pancier') {
          n.stav = 'pancierIde'; n.vx = (h.x + h.w / 2 < n.x + n.w / 2 ? 1 : -1) * 7; n.chran = 12; zvuk('kopnutie');
        } else if (n.stav === 'pancierIde') {
          n.stav = 'pancier'; n.vx = 0; n.t = 0; zvuk('dupnutie');
        }
        odraz();
      } else if (n.stav === 'pancier') {
        const smer = h.x + h.w / 2 < n.x + n.w / 2 ? 1 : -1;
        n.stav = 'pancierIde'; n.vx = smer * 7; n.chran = 15; n.t = 0;
        n.x = smer > 0 ? h.x + h.w + 1 : h.x - n.w - 1;
        zvuk('kopnutie');
      } else if (!(n.stav === 'pancierIde' && n.chran > 0)) {
        zraneny();
      }
    }
  }

  function aktualizujCastice() {
    for (const c of svet.castice) {
      c.t++;
      if (c.typ === 'minca') { c.vy += 0.45; c.y += c.vy; }
      else if (c.typ === 'srdce') { c.vy += 0.15; c.y += c.vy; }
      else { c.vy += 0.5; c.x += c.vx; c.y += c.vy; c.rot += 0.3; }
    }
    svet.castice = svet.castice.filter(c => (c.typ === 'minca' ? c.t < 30 : c.typ === 'srdce' ? c.t < 60 : c.y < svet.H * T + 50));
    svet.popupy.forEach(p => { p.t++; p.y -= 0.7; });
    svet.popupy = svet.popupy.filter(p => p.t < 50);
    for (const [k, v] of svet.bump) { if (v <= 1) svet.bump.delete(k); else svet.bump.set(k, v - 1); }
  }

  // ---- výhra
  function zacniVyhru() {
    const vl = svet.vlajka;
    vyhra = { faza: 'sklz', t: 0, tycX: vl.x * T + T / 2, chytilY: hrac.y };
    hrac.vx = 0; hrac.vy = 0;
    hrac.x = vyhra.tycX - hrac.w + 4;
    const bonus = Math.max(100, Math.round((12 * T - hrac.y) / (9 * T) * 50) * 100);
    pridajSkore(bonus, vyhra.tycX + 20, hrac.y);
    zvuk('vlajka');
  }
  function aktualizujVyhru() {
    const h = hrac, vl = svet.vlajka, v = vyhra;
    v.t++;
    const spodokTyce = vl.y * T; // vrch kameňa pod tyčou
    if (v.faza === 'sklz') {
      h.y = Math.min(h.y + 4, spodokTyce - h.h);
      vl.vlajkaY = Math.min(vl.vlajkaY + 4, (vl.y - 4) * T - 4);
      if (h.y >= spodokTyce - h.h && v.t > 40) { v.faza = 'zoskok'; h.x = v.tycX + 6; h.smer = 1; h.vy = -4; zvuk('vyhra'); }
    } else if (v.faza === 'zoskok' || v.faza === 'chod') {
      v.faza = 'chod';
      h.vx = 2.2;
      h.vy = Math.min(h.vy + F.gPad, F.maxPad);
      posunX(h, h.vx); posunY(h, h.vy);
      if (h.naZemi) h.chod += h.vx;
      const dvere = (vl.x + 7) * T;
      if (h.x + h.w / 2 >= dvere) { v.faza = 'dnu'; v.t = 0; }
    } else if (v.faza === 'dnu') {
      if (v.t > 50) { v.faza = 'hotovo'; koniecHry(true); }
    }
  }

  function koniecHry(vyhral) {
    rezim = 'koniec';
    const sek = Math.round((performance.now() - hra.start) / 1000);
    if (vyhral) {
      const naj = st.get('laurinka.najSkore', 0);
      if (hra.skore > naj) st.set('laurinka.najSkore', hra.skore);
    }
    $('koniec-nadpis').textContent = vyhral ? 'Hurá! Level je hotový! 🎉' : 'Koniec hry';
    $('koniec-info').innerHTML =
      `💰 Mince: <b>${hra.mince}</b><br>⭐ Body: <b>${hra.skore}</b><br>` +
      `🍄 Porazení nepriatelia: <b>${hra.nepriatelia}</b><br>⏱ Čas: <b>${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, '0')}</b>` +
      (vyhral ? `<br>🏆 Najlepšie: <b>${Math.max(hra.skore, st.get('laurinka.najSkore', 0))}</b>` : '');
    ukaz('koniec');
  }

  function krok() {
    svet.cas++;
    aktualizujHraca();
    if (!vyhra || vyhra.faza === 'sklz') {
      aktualizujMacku();
      aktualizujNepriatelov();
      hracVsNepriatelia();
    }
    aktualizujCastice();
    // kamera
    if (!hrac.mrtvy) {
      const ciel = hrac.x + hrac.w / 2 - sirkaPohladu * 0.42 + hrac.smer * 20;
      kamera.x += (ciel - kamera.x) * 0.12;
    }
    kamera.x = clamp(kamera.x, 0, Math.max(0, svet.W * T - sirkaPohladu));
  }

  // ---------------------------------------------------------------- kreslenie
  const platno = $('hra');
  const c = platno.getContext('2d');
  let mierka = 1, sirkaPohladu = 800, odsadenieY = 0, dpr = 1;

  function zmenaVelkosti() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = innerWidth, H = innerHeight;
    platno.width = Math.round(W * dpr); platno.height = Math.round(H * dpr);
    platno.style.width = W + 'px'; platno.style.height = H + 'px';
    mierka = H / VH;
    sirkaPohladu = W / mierka;
    odsadenieY = 0;
    if (sirkaPohladu < 14 * T) {
      mierka = W / (14 * T); sirkaPohladu = 14 * T; odsadenieY = (H - VH * mierka) / 2;
    }
    $('otoc').classList.toggle('skryte', !(H > W * 1.1 && jeDotyk));
  }
  addEventListener('resize', zmenaVelkosti);

  const FONT = '"Comic Sans MS", "Chalkboard SE", "Marker Felt", "Comic Neue", cursive';

  function kresliPostavu(img, x, spodok, w, h, smer, rot = 0, bob = 0, sx, sy, sw, sh) {
    c.save();
    c.translate(x, spodok);
    if (smer < 0) c.scale(-1, 1);
    c.rotate(rot);
    if (sw) c.drawImage(img, sx, sy, sw, sh, -w / 2, -h + bob, w, h);
    else c.drawImage(img, -w / 2, -h + bob, w, h);
    c.restore();
  }

  function kresli() {
    const W = platno.width / dpr, H = platno.height / dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // obloha
    const gr = c.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#5ec2f0'); gr.addColorStop(1, '#c8ecfb');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    if (!svet) return;
    c.setTransform(dpr * mierka, 0, 0, dpr * mierka, 0, dpr * odsadenieY);
    const kx = Math.round(kamera.x * mierka) / mierka;

    // oblaky a kopce (paralaxa)
    const drift = svet.cas * 0.05;
    for (const o of POZ.oblaky) {
      const x = o.x - kx * 0.3 - drift % 4000;
      if (x > -o.w && x < sirkaPohladu + 10) c.drawImage(o.cv, x, o.y, o.w, o.w * 0.5);
    }
    for (const k of POZ.kopce) {
      const x = k.x - kx * 0.5;
      if (x > -k.w && x < sirkaPohladu + 10) c.drawImage(k.cv, x, 13 * T - k.h - 4 + 6, k.w, k.h + 4);
    }
    c.save();
    c.translate(-kx, 0);
    for (const k of POZ.kriky) {
      if (k.x > kx - 200 && k.x < kx + sirkaPohladu + 10) {
        const tx = Math.floor(k.x / T);
        if (tile(tx, 13) === '#' && tile(tx + 1, 13) === '#') c.drawImage(k.cv, k.x, 13 * T - k.cv.height / 2 + 2, k.cv.width / 2, k.cv.height / 2);
      }
    }

    // domček v cieli
    if (svet.vlajka) kresliDomcek((svet.vlajka.x + 5) * T, 13 * T);

    // dlaždice
    const x0 = Math.max(0, Math.floor(kx / T) - 1), x1 = Math.min(svet.W - 1, Math.ceil((kx + sirkaPohladu) / T) + 1);
    for (let y = 0; y < svet.H; y++) {
      for (let x = x0; x <= x1; x++) {
        const t = svet.g[y][x];
        if (t === ' ') continue;
        const v = (x * 7 + y * 13) % 3;
        let off = 0;
        const b = svet.bump.get(x + ',' + y);
        if (b) off = -Math.sin((10 - b) / 10 * Math.PI) * 8;
        if (t === '#') {
          const img = (tile(x, y - 1) !== '#') ? DL.trava[v] : DL.zem[v];
          c.drawImage(img, x * T, y * T, T, T);
        } else if (t === 'o') {
          const s = Math.abs(Math.cos(svet.cas * 0.06 + x * 0.5));
          c.drawImage(DL.minca, x * T + 16 - 10 * s, y * T + 4, 20 * Math.max(0.15, s), 24);
        } else if (DL[t]) {
          c.drawImage(DL[t][v], x * T, y * T + off, T, T);
        }
      }
    }

    // checkpointy a vlajka
    svet.checkpointy.forEach(cp => kresliVlajocku(cp.x * T + 10, (cp.y + 1) * T, cp.aktivny));
    if (svet.vlajka) kresliCiel();

    // mačka
    const m = svet.macka;
    if (m) {
      const bob = m.naZemi ? -Math.abs(Math.sin(m.chod * 0.12)) * 2 : 0;
      const smer = m.vx >= 0 ? 1 : -1;
      kresliPostavu(IMG.macka, m.x + m.w / 2, m.y + m.h + 3, 76, 58, smer, 0, bob);
    }

    // nepriatelia
    for (const n of svet.nepr) {
      if (n.x > kx + sirkaPohladu + 40 || n.x < kx - 80) continue;
      const cx = n.x + n.w / 2, sp = n.y + n.h + 2;
      if (n.typ === 'hrib') {
        if (n.stav === 'placka') kresliPostavu(IMG.hrib, cx, sp, 38, 14, 1);
        else if (n.stav === 'padnuty') { c.save(); c.translate(cx, n.y + n.h / 2); c.scale(1, -1); c.drawImage(IMG.hrib, -18, -20, 36, 39); c.restore(); }
        else kresliPostavu(IMG.hrib, cx, sp, 36, 39, Math.floor(n.t / 12) % 2 ? 1 : -1);
      } else {
        const smer = n.vx > 0 ? -1 : 1; // kresba je otočená doľava
        const im = IMG.korytnacka;
        if (n.stav === 'chodi') kresliPostavu(im, cx, sp, 38, 46, smer, Math.sin(n.t * 0.2) * 0.05, -Math.abs(Math.sin(n.t * 0.2)) * 2);
        else if (n.stav === 'padnuty') { c.save(); c.translate(cx, n.y + n.h / 2); c.scale(1, -1); c.drawImage(im, -19, -23, 38, 46); c.restore(); }
        else {
          const tras = n.stav === 'pancier' && n.t > 380 ? Math.sin(n.t * 1.3) * 2 : 0;
          const otoc = n.stav === 'pancierIde' ? (Math.floor(n.t / 4) % 2 ? 1 : -1) : 1;
          kresliPostavu(im, cx + tras, sp, 34, 30, otoc, 0, 0, im.width * 0.42, im.height * 0.27, im.width * 0.58, im.height * 0.55);
        }
      }
    }

    // hráč
    kresliHraca();

    // častice
    for (const p of svet.castice) {
      if (p.typ === 'minca') c.drawImage(DL.minca, p.x, p.y, 20, 24);
      else if (p.typ === 'srdce') c.drawImage(DL.srdce, p.x, p.y, 24, 22);
      else { c.save(); c.translate(p.x + 8, p.y + 8); c.rotate(p.rot); c.drawImage(DL.B[0], 0, 0, 32, 32, -8, -8, 16, 16); c.restore(); }
    }
    c.font = 'bold 14px ' + FONT; c.textAlign = 'center';
    for (const p of svet.popupy) {
      c.globalAlpha = 1 - p.t / 50;
      c.lineWidth = 3; c.strokeStyle = '#1d1a18'; c.strokeText(p.text, p.x, p.y);
      c.fillStyle = '#fff'; c.fillText(p.text, p.x, p.y);
    }
    c.globalAlpha = 1;
    c.restore();

    if (rezim !== 'menu') kresliHUD();
  }

  function kresliHraca() {
    const h = hrac;
    if (!h || rezim === 'menu') return;
    if (vyhra && (vyhra.faza === 'dnu' || vyhra.faza === 'hotovo')) return;
    if (h.nesmrtelny > 0 && Math.floor(h.nesmrtelny / 4) % 2 && !h.mrtvy) return;
    const img = postavaImg || IMG.hrac;
    const pomer = img.width / img.height;
    const cx = h.x + h.w / 2, sp = h.y + h.h;
    if (h.mrtvy) {
      c.save(); c.translate(cx, h.y + h.h / 2); c.rotate(Math.min(h.t, 30) / 30 * Math.PI);
      c.drawImage(img, -25 * pomer, -25, 50 * pomer, 50); c.restore();
      return;
    }
    const kroky = h.chod * 0.15;
    const bob = h.naZemi && Math.abs(h.vx) > 0.2 ? -Math.abs(Math.sin(kroky)) * 3 : 0;
    let rot = h.naZemi ? Math.sin(kroky) * 0.06 : -0.08;
    if (vyhra && vyhra.faza === 'sklz') rot = 0;
    if (h.jazdi) {
      kresliPostavu(IMG.macka, cx, sp + 3, 76, 58, h.smer, 0, bob * 0.7);
      kresliPostavu(img, cx - 6 * h.smer, sp - 25 + bob * 0.7, 44 * pomer, 44, h.smer, rot * 0.5);
    } else {
      kresliPostavu(img, cx, sp + 2, 50 * pomer, 50, h.smer, rot, bob);
    }
  }

  function kresliVlajocku(x, spodok, aktivna) {
    c.fillStyle = '#5b4636'; c.fillRect(x - 1.5, spodok - 70, 3, 70);
    c.beginPath(); c.moveTo(x + 1.5, spodok - 70); c.lineTo(x + 28, spodok - 61); c.lineTo(x + 1.5, spodok - 52); c.closePath();
    c.fillStyle = aktivna ? '#ff4f9a' : '#d9d2c5'; c.fill();
    c.lineWidth = 2; c.strokeStyle = '#1d1a18'; c.stroke();
  }
  function kresliCiel() {
    const vl = svet.vlajka;
    const x = vl.x * T + T / 2, vrch = 3 * T, spodok = vl.y * T;
    c.fillStyle = '#4c9a3a'; c.fillRect(x - 2, vrch, 4, spodok - vrch);
    c.lineWidth = 1.5; c.strokeStyle = '#1d1a18'; c.strokeRect(x - 2, vrch, 4, spodok - vrch);
    c.beginPath(); c.arc(x, vrch - 5, 6, 0, 7); c.fillStyle = '#ffd23f'; c.fill(); c.stroke();
    const fy = vrch + 6 + vl.vlajkaY;
    c.beginPath(); c.moveTo(x - 2, fy); c.lineTo(x - 40, fy + 14); c.lineTo(x - 2, fy + 28); c.closePath();
    c.fillStyle = '#ff4f9a'; c.fill(); c.lineWidth = 2; c.stroke();
    c.font = '16px ' + FONT; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('★', x - 16, fy + 19);
  }
  function kresliDomcek(x, spodok) {
    const w = 128, h = 96;
    c.lineWidth = 2.5; c.strokeStyle = '#1d1a18'; c.lineJoin = 'round';
    c.beginPath(); c.rect(x, spodok - h, w, h); c.fillStyle = '#f2d7a6'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 14, spodok - h); c.lineTo(x + w / 2, spodok - h - 64); c.lineTo(x + w + 14, spodok - h); c.closePath();
    c.fillStyle = '#d4583a'; c.fill(); c.stroke();
    c.beginPath(); c.rect(x + w / 2 - 18, spodok - 54, 36, 54); c.fillStyle = '#7a4b1f'; c.fill(); c.stroke();
    c.beginPath(); c.arc(x + w / 2 + 10, spodok - 26, 2.5, 0, 7); c.fillStyle = '#ffd23f'; c.fill();
    c.beginPath(); c.rect(x + 12, spodok - 76, 26, 24); c.fillStyle = '#9fdcff'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x + 25, spodok - 76); c.lineTo(x + 25, spodok - 52); c.moveTo(x + 12, spodok - 64); c.lineTo(x + 38, spodok - 64); c.stroke();
    c.font = '20px ' + FONT; c.textAlign = 'center'; c.fillStyle = '#ff4f9a'; c.fillText('♥', x + w / 2, spodok - h - 18);
  }

  function kresliHUD() {
    const W = platno.width / dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = clamp(W / 900, 0.75, 1.3);
    c.save(); c.scale(s, s);
    c.font = 'bold 22px ' + FONT; c.textAlign = 'left'; c.textBaseline = 'middle';
    const txt = (t, x, y) => { c.lineWidth = 4; c.strokeStyle = '#1d1a18'; c.strokeText(t, x, y); c.fillStyle = '#fff'; c.fillText(t, x, y); };
    const pad = 14 + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-l')) || 0) / s;
    c.drawImage(DL.minca, pad, 12, 20, 24); txt('× ' + hra.mince, pad + 26, 25);
    c.drawImage(DL.srdce, pad + 100, 13, 24, 22); txt('× ' + hra.zivoty, pad + 130, 25);
    c.textAlign = 'center';
    txt('⭐ ' + hra.skore, W / s / 2, 25);
    c.restore();
  }

  // ---------------------------------------------------------------- obrazovky a menu
  const jeDotyk = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  function ukaz(id) {
    ['menu', 'pauza', 'koniec'].forEach(s => $(s).classList.toggle('skryte', s !== id));
    $('dotyk').classList.toggle('skryte', !(jeDotyk && rezim === 'hra'));
    $('hud-tlacidla').classList.toggle('skryte', rezim === 'menu');
  }

  function spustiHru() {
    Zvuky.odomkni();
    pripravPostavu();
    novaHra();
    rezim = 'hra';
    ukaz(null);
  }
  function prepniPauzu() {
    if (rezim === 'hra') { rezim = 'pauza'; ukaz('pauza'); }
    else if (rezim === 'pauza') { rezim = 'hra'; ukaz(null); posledny = performance.now(); }
  }
  function doMenu() {
    if (cakaReload) { location.reload(); return; }
    rezim = 'menu';
    novaHra();
    ukaz('menu');
    obnovMenu();
  }

  let tvarImg = null;
  function vybranaPostava() { return st.get('laurinka.postava', 'kreslena'); }
  function pripravPostavu() {
    postavaImg = (vybranaPostava() === 'foto' && tvarImg) ? Tvar.zloz(IMG.hrac_foto, META.hrac_foto, tvarImg) : IMG.hrac;
  }
  async function nacitajTvar() {
    const data = Tvar.nacitaj();
    tvarImg = null;
    if (data) { try { tvarImg = await nacitajObr(data); } catch (e) { tvarImg = null; } }
  }
  function obnovMenu() {
    const vyber = vybranaPostava();
    document.querySelectorAll('.karta').forEach(k => k.classList.toggle('vybrana', k.dataset.postava === vyber));
    const nc = $('nahlad-foto');
    const img = tvarImg ? Tvar.zloz(IMG.hrac_foto, META.hrac_foto, tvarImg) : IMG.hrac_foto;
    nc.width = img.width; nc.height = img.height;
    const k = nc.getContext('2d');
    k.clearRect(0, 0, nc.width, nc.height);
    if (!tvarImg) {
      const b = Tvar.box(META.hrac_foto);
      k.font = 'bold 70px ' + FONT; k.textAlign = 'center'; k.textBaseline = 'middle';
      k.fillStyle = '#9a9a9a'; k.fillText('📷', b.x + b.w / 2, b.y + b.h / 2);
    }
    k.drawImage(img, 0, 0);
    $('btn-zmaz').classList.toggle('skryte', !tvarImg);
    $('btn-odfot').textContent = tvarImg ? '📸 Odfotiť znova' : '📸 Odfotiť tvár';
    const naj = st.get('laurinka.najSkore', 0);
    $('naj-skore').textContent = naj ? '🏆 Najlepšie skóre: ' + naj : '';
  }
  function otvorFoto() {
    Zvuky.odomkni();
    $('menu').classList.add('skryte');
    Foto.otvor({
      sprite: IMG.hrac_foto, meta: META.hrac_foto,
      hotovo: async data => {
        if (data) {
          if (!Tvar.uloz(data)) alert('Fotku sa nepodarilo uložiť (málo miesta v zariadení).');
          st.set('laurinka.postava', 'foto');
          await nacitajTvar();
        }
        $('menu').classList.remove('skryte');
        obnovMenu();
      },
    });
  }
  function napojMenu() {
    $('verzia').textContent = 'v' + window.HRA_VERZIA;
    document.querySelectorAll('.karta').forEach(k => k.onclick = () => {
      const p = k.dataset.postava;
      if (p === 'foto' && !tvarImg) { otvorFoto(); return; }
      st.set('laurinka.postava', p);
      obnovMenu();
    });
    $('btn-hraj').onclick = spustiHru;
    $('btn-odfot').onclick = otvorFoto;
    $('btn-zmaz').onclick = async () => {
      if (!confirm('Naozaj zmazať fotku tváre z tohto zariadenia?')) return;
      Tvar.zmaz(); st.set('laurinka.postava', 'kreslena'); await nacitajTvar(); obnovMenu();
    };
    $('btn-pauza').onclick = prepniPauzu;
    $('btn-pokracuj').onclick = prepniPauzu;
    $('btn-menu-p').onclick = doMenu;
    $('btn-znova').onclick = spustiHru;
    $('btn-menu-k').onclick = doMenu;
    const tl = $('btn-zvuk');
    const obnovZvuk = () => { tl.textContent = Zvuky.ticho ? '🔇' : '🔊'; };
    tl.onclick = () => { Zvuky.prepni(); obnovZvuk(); };
    obnovZvuk();
  }

  // ---------------------------------------------------------------- slučka
  let posledny = performance.now(), akum = 0;
  function slucka(t) {
    requestAnimationFrame(slucka);
    const dt = Math.min(0.1, (t - posledny) / 1000);
    posledny = t;
    if (rezim === 'hra') {
      akum += dt;
      let n = 0;
      while (akum >= KROK && n < 5) { krok(); akum -= KROK; n++; }
      if (n === 5) akum = 0;
    } else if (rezim === 'menu' && svet) {
      svet.cas++;
      kamera.x = (Math.sin(svet.cas * 0.002) * 0.5 + 0.5) * Math.min(1400, svet.W * T - sirkaPohladu);
    }
    kresli();
  }

  // ---------------------------------------------------------------- aktualizácie (PWA)
  let cakaReload = false;
  function registrujSW() {
    if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
    const malKontrolera = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
      const skontroluj = () => reg.update().catch(() => {});
      document.addEventListener('visibilitychange', () => { if (!document.hidden) skontroluj(); });
      setInterval(skontroluj, 15 * 60 * 1000);
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!malKontrolera) return;
      if (rezim === 'hra' || rezim === 'pauza') { cakaReload = true; return; }
      location.reload();
    });
  }

  // ---------------------------------------------------------------- štart
  // na ladenie v konzole prehliadača
  window.__hra = { get hrac() { return hrac; }, get svet() { return svet; }, get rezim() { return rezim; }, get hra() { return hra; }, krok: () => krok(), kresli: () => kresli() };

  async function start() {
    zmenaVelkosti();
    try {
      await nacitajAssety();
    } catch (e) {
      $('nacitavanie').textContent = 'Nepodarilo sa načítať obrázky 😢';
      return;
    }
    vytvorDlazdice();
    await nacitajTvar();
    napojMenu();
    napojDotyk();
    novaHra();
    $('nacitavanie').classList.add('skryte');
    rezim = 'menu';
    ukaz('menu');
    obnovMenu();
    requestAnimationFrame(slucka);
    registrujSW();
  }
  start();
})();
