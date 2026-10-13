/* Veu: fa servir la veu de la tablet (síntesi de veu) en català. */
const Veu = (() => {
  const sintesi = window.speechSynthesis;
  let veus = [];
  let triada = null;

  function carregarVeus() {
    if (!sintesi) return;
    veus = sintesi.getVoices().filter(v => /^ca([-_]|$)/i.test(v.lang));
    const nom = Estat.dades.ajustos.veu;
    triada = veus.find(v => v.name === nom) || veus.find(v => v.localService) || veus[0] || null;
  }

  if (sintesi) {
    carregarVeus();
    sintesi.addEventListener?.('voiceschanged', carregarVeus);
  }

  // Diu un text. Retorna una promesa que s'acaba quan ha acabat de parlar.
  function diu(text, { tallar = true } = {}) {
    return new Promise(resol => {
      if (!sintesi) return resol();
      if (tallar) sintesi.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ca-ES';
      if (triada) u.voice = triada;
      u.rate = Estat.dades.ajustos.velocitat;
      u.pitch = 1.05;
      let fet = false;
      const acaba = () => { if (!fet) { fet = true; resol(); } };
      u.onend = acaba;
      u.onerror = acaba;
      // Per si la tablet no avisa quan acaba.
      setTimeout(acaba, 900 + text.length * 120);
      sintesi.speak(u);
    });
  }

  async function seqüencia(textos) {
    sintesi?.cancel();
    for (const t of textos) await diu(t, { tallar: false });
  }

  return {
    diu,
    seqüencia,
    calla: () => sintesi?.cancel(),
    disponible: () => !!sintesi,
    veusCatala: () => { carregarVeus(); return veus; },
    triar: nom => { Estat.dades.ajustos.veu = nom; Estat.desa(); carregarVeus(); },
    actual: () => triada,
  };
})();

/* Sons curts (sense fitxers): una campaneta quan encerta. */
const So = (() => {
  let ctx = null;
  function nota(freq, inici, durada, volum = 0.18) {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    const t = ctx.currentTime + inici;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volum, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + durada);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + durada);
  }
  return {
    encert() { try { nota(660, 0, 0.25); nota(880, 0.12, 0.35); } catch (e) {} },
    premi() { try { [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.12, 0.4)); } catch (e) {} },
  };
})();
