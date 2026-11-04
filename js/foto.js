// Fotenie tváre do kresby. Fotka sa ukladá IBA lokálne v zariadení (localStorage), nikam sa neposiela.
window.Tvar = (() => {
  const KLUC = 'laurinka.tvar';
  return {
    nacitaj() { try { return localStorage.getItem(KLUC); } catch (e) { return null; } },
    uloz(data) { try { localStorage.setItem(KLUC, data); return true; } catch (e) { return false; } },
    zmaz() { try { localStorage.removeItem(KLUC); } catch (e) {} },
    // okienko pre tvár v súradniciach kresby (trochu väčšie, aby fotka podliezla pod okraje kresby)
    box(meta) {
      const [x, y, w, h] = meta.face;
      return { x: x - 6, y: y - 8, w: w + 12, h: h + 16, r: (h + 16) * 0.32 };
    },
    cesta(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    },
    // poskladá postavičku: fotka tváre za kresbou
    zloz(sprite, meta, tvarImg) {
      const cv = document.createElement('canvas');
      cv.width = sprite.width; cv.height = sprite.height;
      const c = cv.getContext('2d');
      const b = this.box(meta);
      c.save();
      this.cesta(c, b.x, b.y, b.w, b.h, b.r);
      c.clip();
      c.drawImage(tvarImg, b.x, b.y, b.w, b.h);
      c.restore();
      c.drawImage(sprite, 0, 0);
      return cv;
    },
  };
})();

window.Foto = (() => {
  const sekcia = () => document.getElementById('foto');
  let platno, c, video, stream = null, rezim = 'kamera', otocena = 'user';
  let obr = null, posun = { x: 0, y: 0 }, zoom = 1, zoomKamera = nacitajZoom(), zachytene = null;
  const KAMERA_PRIBLIZENIE = 1;
  // predvolené priblíženie kamery: v okienku je ~1/3 šírky záberu; posuvník si zariadenie zapamätá
  function nacitajZoom() {
    try { const v = parseFloat(localStorage.getItem('laurinka.zoomKamery2')); if (v >= 1 && v <= 6) return v; } catch (e) {}
    return 3.1;
  } // 1 = v okienku je celý záber kamery
  let sprite, meta, hotovo, beh = false, rozlozenie = null;
  const ukazovatele = new Map();
  let pinch = null;

  function el(id) { return document.getElementById(id); }

  function stav(t) { el('foto-text').textContent = t; }

  function nastavTlacidla() {
    const po = !!zachytene;
    el('foto-odfot').classList.toggle('skryte', po);
    el('foto-otoc').classList.toggle('skryte', po || rezim !== 'kamera');
    el('foto-galeria').classList.toggle('skryte', po);
    el('foto-znova').classList.toggle('skryte', !po);
    el('foto-pouzi').classList.toggle('skryte', !po);
    el('foto-zoom-box').classList.toggle('skryte', po);
    el('foto-zoom').min = 1;
    el('foto-zoom').max = rezim === 'kamera' ? 6 : 4;
    el('foto-zoom').value = rezim === 'kamera' ? zoomKamera : zoom;
  }

  async function spustiKameru() {
    zastavKameru();
    rezim = 'kamera';
    nastavTlacidla();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      stav('Kamera tu nie je dostupná. Vyber fotku z galérie.');
      return;
    }
    stav('Zapínam kameru…');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: otocena, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
      });
      video.srcObject = stream;
      await video.play().catch(() => {});
      stav('Daj tvár do okienka (posuvníkom priblížiš) a stlač Odfotiť');
    } catch (e) {
      stav('Kameru sa nepodarilo zapnúť. Skús fotku z galérie.');
    }
  }

  function zastavKameru() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  function spocitajRozlozenie() {
    const W = platno.clientWidth, H = platno.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (platno.width !== Math.round(W * dpr) || platno.height !== Math.round(H * dpr)) {
      platno.width = Math.round(W * dpr); platno.height = Math.round(H * dpr);
    }
    const lista = 110;
    const volnaH = H - lista - 50;
    let sh = Math.min(volnaH * 0.95, (W * 0.9) * sprite.height / sprite.width);
    const s = sh / sprite.height;
    const sw = sprite.width * s;
    const sx = (W - sw) / 2, sy = 50 + (volnaH - sh) / 2;
    const b = Tvar.box(meta);
    rozlozenie = {
      W, H, dpr, s, sx, sy, sw, sh,
      fb: { x: sx + b.x * s, y: sy + b.y * s, w: b.w * s, h: b.h * s, r: b.r * s },
    };
  }

  // nakreslí zdroj (kamera / obrázok) v súradniciach obrazovky
  function kresliZdroj(k) {
    const L = rozlozenie;
    if (rezim === 'kamera') {
      if (!video || !video.videoWidth) return;
      // obraz z kamery je priblížený na okienko tváre (tvár na selfie ho vyplní bez naťahovania rúk)
      const vw = video.videoWidth, vh = video.videoHeight, fb = L.fb;
      const sc = Math.max(fb.w / vw, fb.h / vh) * KAMERA_PRIBLIZENIE * zoomKamera;
      const w = vw * sc, h = vh * sc;
      const cx = fb.x + fb.w / 2, cy = fb.y + fb.h / 2;
      k.save();
      k.translate(cx, cy);
      if (otocena === 'user') k.scale(-1, 1);
      k.drawImage(video, -w / 2, -h / 2, w, h);
      k.restore();
    } else if (obr) {
      const fb = L.fb;
      const sc = Math.max(fb.w / obr.width, fb.h / obr.height) * zoom;
      const w = obr.width * sc, h = obr.height * sc;
      k.drawImage(obr, fb.x + fb.w / 2 - w / 2 + posun.x, fb.y + fb.h / 2 - h / 2 + posun.y, w, h);
    }
  }

  function kresli() {
    if (!beh) return;
    requestAnimationFrame(kresli);
    spocitajRozlozenie();
    const L = rozlozenie;
    c.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
    c.fillStyle = '#f4efe4';
    c.fillRect(0, 0, L.W, L.H);
    c.save();
    Tvar.cesta(c, L.fb.x, L.fb.y, L.fb.w, L.fb.h, L.fb.r);
    c.clip();
    c.fillStyle = '#ddd';
    c.fillRect(L.fb.x, L.fb.y, L.fb.w, L.fb.h);
    if (zachytene) c.drawImage(zachytene, L.fb.x, L.fb.y, L.fb.w, L.fb.h);
    else kresliZdroj(c);
    c.restore();
    c.drawImage(sprite, L.sx, L.sy, L.sw, L.sh);
    if (!zachytene) {
      c.save();
      Tvar.cesta(c, L.fb.x, L.fb.y, L.fb.w, L.fb.h, L.fb.r);
      c.setLineDash([8, 6]);
      c.lineWidth = 2;
      c.strokeStyle = 'rgba(255,255,255,0.8)';
      c.stroke();
      c.restore();
    }
  }

  function odfot() {
    const L = rozlozenie;
    if (rezim === 'kamera' && (!video || !video.videoWidth)) return;
    if (rezim === 'obrazok' && !obr) return;
    const b = Tvar.box(meta);
    const cap = document.createElement('canvas');
    cap.width = Math.round(b.w * 2); cap.height = Math.round(b.h * 2);
    const k = cap.getContext('2d');
    const m = cap.width / L.fb.w;
    k.setTransform(m, 0, 0, m, -L.fb.x * m, -L.fb.y * m);
    kresliZdroj(k);
    zachytene = cap;
    Zvuky.hraj('minca');
    stav('Páči sa? Stlač Použiť alebo Znova');
    nastavTlacidla();
  }

  function pouzi() {
    if (!zachytene) return;
    const data = zachytene.toDataURL('image/jpeg', 0.85);
    zatvor();
    hotovo && hotovo(data);
  }

  function zatvor() {
    beh = false;
    zastavKameru();
    sekcia().classList.add('skryte');
  }

  function galeria(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => {
      zastavKameru();
      obr = im; rezim = 'obrazok'; posun = { x: 0, y: 0 }; zoom = 1; zachytene = null;
      el('foto-zoom').value = 1;
      stav('Posuň fotku prstom, priblíž posuvníkom');
      nastavTlacidla();
    };
    im.src = url;
  }

  function napoj() {
    platno = el('foto-platno');
    c = platno.getContext('2d');
    video = el('video');
    el('foto-spat').onclick = () => { zatvor(); hotovo && hotovo(null); };
    el('foto-odfot').onclick = odfot;
    el('foto-pouzi').onclick = pouzi;
    el('foto-znova').onclick = () => {
      zachytene = null;
      if (rezim === 'kamera') stav('Daj tvár do okienka a stlač Odfotiť');
      nastavTlacidla();
    };
    el('foto-otoc').onclick = () => { otocena = otocena === 'user' ? 'environment' : 'user'; spustiKameru(); };
    el('foto-galeria').onclick = () => el('foto-subor').click();
    el('foto-subor').onchange = galeria;
    el('foto-zoom').oninput = e => { const v = parseFloat(e.target.value); if (rezim === 'kamera') { zoomKamera = v; try { localStorage.setItem('laurinka.zoomKamery2', String(v)); } catch (e) {} } else zoom = v; };

    platno.addEventListener('pointerdown', e => {
      if (rezim !== 'obrazok' || zachytene) return;
      platno.setPointerCapture(e.pointerId);
      ukazovatele.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ukazovatele.size === 2) {
        const [a, b] = [...ukazovatele.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom };
      }
    });
    platno.addEventListener('pointermove', e => {
      const p = ukazovatele.get(e.pointerId);
      if (!p) return;
      if (ukazovatele.size === 1) {
        posun.x += e.clientX - p.x; posun.y += e.clientY - p.y;
      }
      p.x = e.clientX; p.y = e.clientY;
      if (ukazovatele.size === 2 && pinch) {
        const [a, b] = [...ukazovatele.values()];
        zoom = Math.min(4, Math.max(1, pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d));
        el('foto-zoom').value = zoom;
      }
    });
    const pusti = e => { ukazovatele.delete(e.pointerId); if (ukazovatele.size < 2) pinch = null; };
    platno.addEventListener('pointerup', pusti);
    platno.addEventListener('pointercancel', pusti);
    platno.addEventListener('wheel', e => {
      if (rezim !== 'obrazok') return;
      e.preventDefault();
      zoom = Math.min(4, Math.max(1, zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
      el('foto-zoom').value = zoom;
    }, { passive: false });
  }

  let napojene = false;
  return {
    otvor(opts) {
      if (!napojene) { napoj(); napojene = true; }
      sprite = opts.sprite; meta = opts.meta; hotovo = opts.hotovo;
      zachytene = null; obr = null;
      sekcia().classList.remove('skryte');
      beh = true;
      spustiKameru();
      requestAnimationFrame(kresli);
    },
  };
})();
