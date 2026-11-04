// Jednoduché zvukové efekty (syntetizované, bez súborov). Hudba príde neskôr.
window.Zvuky = (() => {
  let ctx = null;
  let ticho = false;
  try { ticho = localStorage.getItem('laurinka.ticho') === '1'; } catch (e) {}

  function odomkni() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function ton(f1, f2, dlzka, typ = 'square', hlasitost = 0.12, oneskorenie = 0) {
    if (ticho || !ctx) return;
    const t = ctx.currentTime + oneskorenie;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = typ;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dlzka);
    g.gain.setValueAtTime(hlasitost, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dlzka);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dlzka + 0.02);
  }

  function sum(dlzka, hlasitost = 0.2) {
    if (ticho || !ctx) return;
    const n = Math.floor(ctx.sampleRate * dlzka);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = hlasitost;
    s.buffer = buf;
    s.connect(g).connect(ctx.destination);
    s.start();
  }

  const efekty = {
    skok: () => ton(260, 620, 0.16, 'square', 0.08),
    minca: () => { ton(988, 988, 0.07, 'square', 0.08); ton(1319, 1319, 0.25, 'square', 0.08, 0.07); },
    dupnutie: () => { ton(400, 90, 0.12, 'triangle', 0.25); },
    buch: () => ton(160, 60, 0.1, 'triangle', 0.3),
    tehla: () => { sum(0.25, 0.25); },
    zivot: () => [523, 659, 784, 1047].forEach((f, i) => ton(f, f, 0.12, 'square', 0.08, i * 0.09)),
    mnau: () => { ton(700, 1100, 0.15, 'sawtooth', 0.05); ton(1100, 600, 0.3, 'sawtooth', 0.05, 0.15); },
    au: () => ton(600, 200, 0.3, 'square', 0.1),
    kopnutie: () => ton(300, 900, 0.08, 'square', 0.1),
    smrt: () => [523, 440, 349, 262].forEach((f, i) => ton(f, f * 0.95, 0.18, 'square', 0.09, i * 0.17)),
    vyhra: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => ton(f, f, 0.16, 'square', 0.08, i * 0.12)),
    vlajka: () => ton(400, 1200, 0.5, 'triangle', 0.15),
  };

  return {
    odomkni,
    hraj(meno) { try { efekty[meno] && efekty[meno](); } catch (e) {} },
    get ticho() { return ticho; },
    prepni() {
      ticho = !ticho;
      try { localStorage.setItem('laurinka.ticho', ticho ? '1' : '0'); } catch (e) {}
      return ticho;
    },
  };
})();
