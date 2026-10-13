/* Anem a cole — pantalles i exercicis. */
const app = document.getElementById('app');

/* ---------- Utilitats ---------- */
const aleatori = llista => llista[Math.floor(Math.random() * llista.length)];
const barreja = llista => {
  const c = [...llista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};
const espera = ms => new Promise(r => setTimeout(r, ms));
const D = () => Estat.dades;

// Escriu el text en majúscula o minúscula segons l'ajust.
const mostra = text => D().ajustos.tipus === 'minuscula' ? text.toLowerCase() : text.toUpperCase();

// Treu accents i dígrafs per saber quines lletres té una paraula.
function lletresDe(paraula) {
  return paraula.toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/Ç/g, 'C').replace(/L·L/g, 'L').replace(/NY/g, 'N')
    .replace(/[^A-Z]/g, '').split('');
}

// En l'ordre en què s'han activat (és l'ordre en què es van aprenent).
const actives = () => D().ajustos.lletres.filter(l => LLETRES[l]);
const vocalsActives = () => actives().filter(l => LLETRES[l].vocal);
const consonantsActives = () => actives().filter(l => !LLETRES[l].vocal);

function paraulesDisponibles() {
  const act = new Set(actives());
  return PARAULES.filter(w => lletresDe(w.p).every(l => act.has(l)));
}

const ICONA = {
  casa: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>',
  altaveu: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  engranatge: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>',
  uneix: '<svg viewBox="0 0 24 24" class="icona-uneix"><path d="M5 17 9 7l6 9 4-10"/><circle cx="5" cy="17" r="2.2"/><circle cx="9" cy="7" r="2.2"/><circle cx="15" cy="16" r="2.2"/><circle cx="19" cy="6" r="2.2"/></svg>',
};

function barra({ inici = true, repetir = null, premis = false } = {}) {
  const esquerra = inici
    ? `<button class="boto-rodo" data-accio="inici" aria-label="Inici">${ICONA.casa}</button>`
    : premis ? `<button class="boto-rodo boto-premis" data-accio="premis" aria-label="Premis">${D().adhesius ? ADHESIUS[D().adhesius - 1] : '🎁'}</button>` : '<span></span>';
  return `
    <header class="barra">
      ${esquerra}
      <div class="comptador" aria-label="Estrelles"><span class="estrella">⭐</span><b>${D().estrelles}</b></div>
      ${repetir ? `<button class="boto-rodo boto-veu" data-accio="repetir" aria-label="Torna-ho a dir">${ICONA.altaveu}</button>` : '<span></span>'}
    </header>`;
}

let repetir = null; // què diu el botó de l'altaveu
let torn = 0; // per aturar exercicis quan es canvia de pantalla

app.addEventListener('click', e => {
  const b = e.target.closest('[data-accio]');
  if (!b) return;
  if (b.dataset.accio === 'inici') pantallaInici();
  if (b.dataset.accio === 'premis') { Veu.diu(FRASES.menu.premis); pantallaPremis(); }
  if (b.dataset.accio === 'repetir' && repetir) repetir();
});

/* ---------- Premis ---------- */
async function donaEstrella() {
  D().estrelles++;
  const b = app.querySelector('.comptador b');
  if (b) { b.textContent = D().estrelles; b.parentElement.classList.remove('salta'); void b.offsetWidth; b.parentElement.classList.add('salta'); }
  let adhesiuNou = false;
  if (D().estrelles % ESTRELLES_PER_ADHESIU === 0 && D().adhesius < ADHESIUS.length) {
    D().adhesius++;
    adhesiuNou = true;
  }
  Estat.desa();
  return adhesiuNou;
}

function celebra(emoji, frase) {
  return new Promise(resol => {
    So.premi();
    const capa = document.createElement('div');
    capa.className = 'celebracio';
    let estrelles = '';
    for (let i = 0; i < 14; i++) {
      estrelles += `<span style="left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.8}s">⭐</span>`;
    }
    capa.innerHTML = `${estrelles}<div class="premi">${emoji}</div>`;
    document.body.appendChild(capa);
    let fet = false;
    const tanca = () => { if (fet) return; fet = true; capa.remove(); resol(); };
    capa.addEventListener('click', tanca);
    Veu.diu(frase).then(() => espera(300)).then(tanca);
  });
}

// Suma un encert (o reinicia la ratxa) i puja de nivell si toca.
async function apunta(activitat, primerIntent, maxNivell) {
  let adhesiu = false;
  let puja = false;
  if (primerIntent) {
    adhesiu = await donaEstrella();
    D().seguits[activitat]++;
    if (D().seguits[activitat] >= ENCERTS_PER_NIVELL) {
      D().seguits[activitat] = 0;
      if (D().nivells[activitat] < maxNivell) { D().nivells[activitat]++; puja = true; }
    }
  } else {
    D().seguits[activitat] = 0;
  }
  Estat.desa();
  if (adhesiu) await celebra(ADHESIUS[D().adhesius - 1], FRASES.adhesiu);
  if (puja) await celebra('🏆', FRASES.nivell);
}

// Opcions de resposta: comú a tots els exercicis.
function preparaOpcions(contenidor, correcta, { frase, enEncert = [], activitat, maxNivell }) {
  const elTorn = torn;
  let primerIntent = true;
  let resolt = false;
  let enAcabar = () => {};
  contenidor.addEventListener('click', async e => {
    const b = e.target.closest('.opcio');
    if (!b || resolt || b.classList.contains('apagada')) return;
    if (b.dataset.valor === correcta) {
      resolt = true;
      b.classList.add('correcta');
      contenidor.classList.add('resolt');
      So.encert();
      await Veu.seqüencia([aleatori(FRASES.encert), ...enEncert]);
      if (elTorn !== torn) return;
      await apunta(activitat, primerIntent, maxNivell);
      if (elTorn === torn) enAcabar();
    } else {
      primerIntent = false;
      b.classList.remove('balla'); void b.offsetWidth; b.classList.add('balla');
      b.classList.add('apagada');
      await Veu.seqüencia([aleatori(FRASES.error), frase]);
    }
  });
  return { quanAcabi: f => { enAcabar = f; } };
}

/* ---------- Pantalla d'entrada ---------- */
function pantallaEntrada() {
  torn++;
  app.innerHTML = `
    <main class="entrada">
      <div class="logo">
        <span class="globus g1">A</span><span class="globus g2">E</span><span class="globus g3">I</span>
      </div>
      <h1>Anem a cole</h1>
      <button class="boto-play" id="play" aria-label="Comencem">
        <svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>
      </button>
    </main>`;
  document.getElementById('play').addEventListener('click', () => {
    const installada = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    if (!installada && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    pantallaInici(true);
  });
}

/* ---------- Inici ---------- */
function pantallaInici(saluda = false) {
  torn++;
  Veu.calla();
  repetir = () => Veu.diu(FRASES.benvinguda);
  const exemple = mostra(consonantsActives()[0] || 'M') + mostra(vocalsActives()[0] || 'A');
  app.innerHTML = `
    ${barra({ inici: false, repetir: true, premis: true })}
    <main class="inici">
      <button class="targeta t-lletres" data-anar="lletres">
        <span class="dibuix lletra-gran">${mostra(actives()[0] || 'A')}</span>
        <span class="nom">Lletres</span>
      </button>
      <button class="targeta t-sillabes" data-anar="sillabes">
        <span class="dibuix lletra-gran">${exemple}</span>
        <span class="nom">Síl·labes</span>
      </button>
      <button class="targeta t-paraules" data-anar="paraules">
        <span class="dibuix">🍎</span>
        <span class="nom">Paraules</span>
      </button>
      <button class="targeta t-numeros" data-anar="numeros">
        <span class="dibuix lletra-gran">123</span>
        <span class="nom">Números</span>
      </button>
      <button class="targeta t-compta" data-anar="compta">
        <span class="dibuix">🐞</span>
        <span class="nom">Compta</span>
      </button>
      <button class="targeta t-uneix" data-anar="uneix">
        <span class="dibuix">${ICONA.uneix}</span>
        <span class="nom">Uneix</span>
      </button>
    </main>
    <button class="boto-adult" id="adult" aria-label="Adults: mantén premut">
      <svg class="anell" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17"/></svg>
      ${ICONA.engranatge}
    </button>`;

  app.querySelector('.inici').addEventListener('click', e => {
    const t = e.target.closest('[data-anar]');
    if (!t) return;
    const on = t.dataset.anar;
    ({
      lletres: pantallaLletres, sillabes: pantallaSillabes, paraules: pantallaParaules,
      numeros: pantallaNumeros, compta: pantallaCompta, uneix: pantallaUneix,
    })[on]();
  });
  preparaBotoAdult(document.getElementById('adult'));
  if (saluda) Veu.diu(FRASES.benvinguda);
}

/* ---------- 1. Lletres ---------- */
function pantallaLletres() {
  torn++;
  const llista = actives();
  const nivell = Math.min(D().nivells.lletres, llista.length - 1);
  const nova = llista[nivell];
  if (!D().vistes.includes(nova)) return presentaLletra(nova);

  const apreses = llista.slice(0, nivell + 1);
  const objectiu = Math.random() < 0.5 ? nova : aleatori(apreses);
  const altres = barreja(llista.filter(l => l !== objectiu));
  // Primer les lletres ja vistes, després qualsevol altra activa.
  const distractors = [...altres.filter(l => apreses.includes(l)), ...altres.filter(l => !apreses.includes(l))].slice(0, 2);
  const opcions = barreja([objectiu, ...distractors]);
  const L = LLETRES[objectiu];
  const frase = `Toca la ${L.nom}.`;
  repetir = () => Veu.diu(frase);

  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="exercici">
      <div class="pregunta">
        <button class="boto-escolta" data-accio="repetir" aria-label="Escolta">${ICONA.altaveu}</button>
      </div>
      <div class="opcions">
        ${opcions.map(l => `<button class="opcio lletra" data-valor="${l}">${mostra(l)}</button>`).join('')}
      </div>
    </main>`;

  preparaOpcions(app.querySelector('.opcions'), objectiu, {
    frase, activitat: 'lletres', maxNivell: llista.length - 1,
  }).quanAcabi(pantallaLletres);
  Veu.diu(frase);
}

function presentaLletra(lletra) {
  const L = LLETRES[lletra];
  const elTorn = torn;
  const frases = [`Aquesta és la ${L.nom}.`, `${L.nom}, de ${L.exemple}.`];
  const continua = () => {
    if (elTorn !== torn) return;
    if (!D().vistes.includes(lletra)) { D().vistes.push(lletra); Estat.desa(); }
    pantallaLletres();
  };
  repetir = () => Veu.seqüencia(frases);
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="presentacio">
      <button class="lletra-presentada" data-accio="repetir">${mostra(lletra)}</button>
      <div class="exemple"><span class="dibuix">${L.dibuix}</span><span class="paraula">${mostra(L.exemple)}</span></div>
    </main>`;
  // Passa sol a l'exercici quan acaba de parlar.
  Veu.seqüencia(frases).then(() => espera(300)).then(continua);
}

/* ---------- 2. Síl·labes ---------- */
function pantallaSillabes() {
  torn++;
  const elTorn = torn;
  const cons = consonantsActives();
  const voc = vocalsActives();
  if (!cons.length || !voc.length) return avisFaltenLletres();
  const nivell = Math.min(D().nivells.sillabes, cons.length - 1);
  const consNivell = cons.slice(0, nivell + 1);
  const c = Math.random() < 0.5 ? cons[nivell] : aleatori(consNivell);
  const v = aleatori(voc);
  const sil = c + v;
  const diuSil = sil.toLowerCase();
  const instruccio = 'Toca les dues lletres per ajuntar-les.';
  repetir = () => Veu.diu(instruccio);

  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="exercici sillabes">
      <div class="ajunta">
        <button class="fitxa" data-l="${c}">${mostra(c)}</button>
        <span class="signe">+</span>
        <button class="fitxa" data-l="${v}">${mostra(v)}</button>
      </div>
      <div class="resultat"></div>
    </main>`;

  const tocades = new Set();
  app.querySelector('.ajunta').addEventListener('click', async e => {
    const f = e.target.closest('.fitxa');
    if (!f || app.querySelector('.ajunta').classList.contains('junta')) return;
    f.classList.add('tocada');
    tocades.add(f.dataset.l);
    await Veu.diu(LLETRES[f.dataset.l].nom);
    if (elTorn !== torn || tocades.size < 2) return;
    app.querySelector('.ajunta').classList.add('junta');
    await espera(250);
    app.querySelector('.resultat').innerHTML = `<div class="sillaba">${mostra(sil)}</div>`;
    await Veu.diu(`${diuSil}!`);
    await espera(200);
    if (elTorn === torn) triaSillaba(sil, consNivell, cons, voc, nivell, cons.length - 1);
  });
  Veu.diu(instruccio);
}

function triaSillaba(sil, consNivell, cons, voc, nivell, maxNivell) {
  torn++;
  const totes = [];
  cons.forEach(c => voc.forEach(v => totes.push(c + v)));
  // Distractors semblants: mateixa consonant o mateixa vocal.
  const semblants = barreja(totes.filter(s => s !== sil && (s[0] === sil[0] || s[1] === sil[1]) && consNivell.includes(s[0])));
  const resta = barreja(totes.filter(s => s !== sil && !semblants.includes(s)));
  const opcions = barreja([sil, ...[...semblants, ...resta].slice(0, 2)]);
  const frase = `On posa ${sil.toLowerCase()}?`;
  repetir = () => Veu.diu(frase);

  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="exercici">
      <div class="pregunta">
        <button class="boto-escolta" data-accio="repetir" aria-label="Escolta">${ICONA.altaveu}</button>
      </div>
      <div class="opcions">
        ${opcions.map(s => `<button class="opcio lletra" data-valor="${s}">${mostra(s)}</button>`).join('')}
      </div>
    </main>`;
  preparaOpcions(app.querySelector('.opcions'), sil, {
    frase, activitat: 'sillabes', maxNivell,
  }).quanAcabi(pantallaSillabes);
  Veu.diu(frase);
}

/* ---------- 3. Paraules ---------- */
function pantallaParaules() {
  torn++;
  let disponibles = paraulesDisponibles();
  // Si amb les lletres actives hi ha poques paraules, n'agafa de les més fàcils.
  if (disponibles.length < 3) {
    const act = new Set(actives());
    disponibles = [...PARAULES].sort((a, b) =>
      lletresDe(a.p).filter(l => !act.has(l)).length - lletresDe(b.p).filter(l => !act.has(l)).length).slice(0, 6);
  }
  const maxNivell = Math.max(0, disponibles.length - 3);
  const nivell = Math.min(D().nivells.paraules, maxNivell);
  const grup = disponibles.slice(0, nivell + 3);
  const nova = grup[grup.length - 1];
  const objectiu = Math.random() < 0.4 ? nova : aleatori(grup);
  const distractors = barreja(disponibles.filter(w => w !== objectiu))
    .sort((a, b) => Math.abs(a.p.length - objectiu.p.length) - Math.abs(b.p.length - objectiu.p.length))
    .slice(0, 2);
  const opcions = barreja([objectiu, ...distractors]);
  const frase = `On posa ${objectiu.p}?`;
  repetir = () => Veu.diu(frase);

  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="exercici paraules">
      <div class="pregunta">
        <button class="imatge" data-accio="repetir" aria-label="Escolta">${objectiu.d}</button>
      </div>
      <div class="opcions">
        ${opcions.map(w => `<button class="opcio paraula" data-valor="${w.p}">${mostra(w.p)}</button>`).join('')}
      </div>
    </main>`;
  preparaOpcions(app.querySelector('.opcions'), objectiu.p, {
    frase, activitat: 'paraules', maxNivell,
  }).quanAcabi(pantallaParaules);
  Veu.diu(frase);
}

/* ---------- Premis ---------- */
function pantallaPremis() {
  torn++;
  const n = D().adhesius;
  const falten = ESTRELLES_PER_ADHESIU - (D().estrelles % ESTRELLES_PER_ADHESIU);
  const frase = n
    ? `Tens ${D().estrelles} estrelles i ${n} ${n === 1 ? 'adhesiu' : 'adhesius'}. Molt bé!`
    : `Tens ${D().estrelles} estrelles. Amb ${falten} més, guanyes el primer adhesiu!`;
  repetir = () => Veu.diu(frase);
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="premis">
      <div class="album">
        ${ADHESIUS.map((a, i) => i < n
          ? `<button class="adhesiu" data-i="${i}">${a}</button>`
          : `<div class="adhesiu buit"></div>`).join('')}
      </div>
      <div class="falten">${'⭐'.repeat(ESTRELLES_PER_ADHESIU - falten)}<span class="buides">${'⭐'.repeat(falten)}</span></div>
    </main>`;
  app.querySelector('.album').addEventListener('click', e => {
    const a = e.target.closest('.adhesiu:not(.buit)');
    if (!a) return;
    a.classList.remove('salta'); void a.offsetWidth; a.classList.add('salta');
    So.encert();
  });
  Veu.diu(frase);
}

function avisFaltenLletres() {
  repetir = null;
  app.innerHTML = `${barra()}<main class="avis"><p>Cal activar almenys una vocal i una consonant al mode adult.</p></main>`;
}

/* ---------- 4. Números: escolta i toca ---------- */
const articleNum = n => (n === 1 ? "l'u" : `el ${NUMEROS[n]}`);

// Dos números diferents de n, a prop de n (entre 1 i 10).
function distractorsNum(n, maxim = 10) {
  const prop = barreja([n - 2, n - 1, n + 1, n + 2].filter(x => x >= 1 && x <= maxim));
  const resta = barreja(Array.from({ length: maxim }, (_, i) => i + 1).filter(x => x !== n && !prop.includes(x)));
  return [...prop, ...resta].slice(0, 2);
}

function pantallaNumeros() {
  torn++;
  const maxNivell = 7; // nivell 0: de l'1 al 3 ... nivell 7: de l'1 al 10
  const nivell = Math.min(D().nivells.numeros, maxNivell);
  const maxim = nivell + 3;
  const n = Math.random() < 0.5 ? maxim : 1 + Math.floor(Math.random() * maxim);
  const opcions = barreja([n, ...distractorsNum(n, Math.max(maxim, 3))]);
  const frase = `Toca ${articleNum(n)}.`;
  repetir = () => Veu.diu(frase);
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="exercici">
      <div class="pregunta">
        <button class="boto-escolta" data-accio="repetir" aria-label="Escolta">${ICONA.altaveu}</button>
      </div>
      <div class="opcions">
        ${opcions.map(x => `<button class="opcio lletra numero" data-valor="${x}">${x}</button>`).join('')}
      </div>
    </main>`;
  preparaOpcions(app.querySelector('.opcions'), String(n), {
    frase, activitat: 'numeros', maxNivell,
  }).quanAcabi(pantallaNumeros);
  Veu.diu(frase);
}

/* ---------- 5. Compta ---------- */
function pantallaCompta() {
  torn++;
  const maxNivell = 7; // fins a 3 ... fins a 10
  const nivell = Math.min(D().nivells.compta, maxNivell);
  const maxim = nivell + 3;
  const n = Math.random() < 0.5 ? maxim : 1 + Math.floor(Math.random() * maxim);
  const cosa = aleatori(COSES_PER_COMPTAR);
  const opcions = barreja([n, ...distractorsNum(n)]);
  const frase = "Quants n'hi ha?";
  repetir = () => Veu.diu(frase);
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="exercici compta">
      <div class="safata">
        ${Array.from({ length: n }, () => `<button class="cosa">${cosa}</button>`).join('')}
      </div>
      <div class="opcions">
        ${opcions.map(x => `<button class="opcio lletra numero" data-valor="${x}">${x}</button>`).join('')}
      </div>
    </main>`;
  // Tocar les coses les compta en veu alta.
  let comptades = 0;
  app.querySelector('.safata').addEventListener('click', e => {
    const c = e.target.closest('.cosa');
    if (!c || c.classList.contains('comptada')) return;
    c.classList.add('comptada');
    comptades++;
    c.dataset.n = comptades;
    Veu.diu(NUMEROS[comptades]);
  });
  preparaOpcions(app.querySelector('.opcions'), String(n), {
    frase, activitat: 'compta', maxNivell, enEncert: [`${NUMEROS[n]}!`],
  }).quanAcabi(pantallaCompta);
  Veu.diu(frase);
}

/* ---------- 6. Uneix els números ---------- */
// Es creuen els segments a-b i c-d? Retorna el punt de tall o null.
function talla(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function distSegment(p, a, b) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2));
  return dist(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}

// Col·loca n punts de manera que el camí recte 1→2→…→n no es creui
// i no passi per sobre d'altres números. Així sempre es pot fer.
function colocaPunts(n, w, h, R) {
  const marge = R * 1.4;
  let millor = null;
  for (let intent = 0; intent < 300; intent++) {
    const punts = [];
    let proves = 0;
    while (punts.length < n && proves++ < 2000) {
      const p = { x: marge + Math.random() * (w - 2 * marge), y: marge + Math.random() * (h - 2 * marge) };
      if (punts.every(q => dist(p, q) > R * 3.4)) punts.push(p);
    }
    if (punts.length < n) continue;
    // Desfà els creuaments (2-opt).
    let canvi = true, voltes = 0;
    while (canvi && voltes++ < 500) {
      canvi = false;
      for (let i = 0; i < n - 3 && !canvi; i++) {
        for (let j = i + 2; j < n - 1; j++) {
          if (talla(punts[i], punts[i + 1], punts[j], punts[j + 1])) {
            const tros = punts.slice(i + 1, j + 1).reverse();
            punts.splice(i + 1, tros.length, ...tros);
            canvi = true;
            break;
          }
        }
      }
    }
    if (canvi) continue;
    // Cap línia recta ha de passar per sobre d'un altre número.
    const net = punts.every((p, k) => punts.every((a, i) =>
      i === n - 1 || i === k || i + 1 === k || distSegment(p, a, punts[i + 1]) > R * 1.5));
    millor = punts;
    if (net) break;
  }
  return millor;
}

function pantallaUneix() {
  torn++;
  const elTorn = torn;
  const maxNivell = UNEIX_PUNTS_PER_NIVELL.length - 1;
  const nivell = Math.min(D().nivells.uneix, maxNivell);
  const n = UNEIX_PUNTS_PER_NIVELL[nivell];
  repetir = () => Veu.diu(FRASES.uneix);
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="uneix"><svg class="tauler"></svg></main>`;

  const svg = app.querySelector('.tauler');
  const { width: w, height: h } = svg.getBoundingClientRect();
  const R = Math.max(30, Math.min(w, h) * 0.075);
  const punts = colocaPunts(n, w, h, R);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const NS = 'http://www.w3.org/2000/svg';
  const capaLinies = document.createElementNS(NS, 'g');
  const capaPunts = document.createElementNS(NS, 'g');
  svg.append(capaLinies, capaPunts);
  const cercles = punts.map((p, i) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'punt');
    g.innerHTML = `<circle cx="${p.x}" cy="${p.y}" r="${R}"/><text x="${p.x}" y="${p.y}" font-size="${R * 1.15}">${i + 1}</text>`;
    capaPunts.append(g);
    return g;
  });

  let fets = [];      // línies acabades: llistes de punts
  let actual = 0;     // número on som (índex)
  let traç = null;    // línia que s'està dibuixant
  let camí = null;
  let primerIntent = true;
  let bloquejat = false;

  const marca = () => cercles.forEach((c, i) => {
    c.classList.toggle('fet', i < actual);
    c.classList.toggle('actual', i === actual);
  });
  marca();

  const dibuixa = (pts, el) => el.setAttribute('d', 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L'));

  function creua(a, b) {
    const inici = punts[actual];
    for (const linia of fets) {
      for (let i = 0; i < linia.length - 1; i++) {
        const x = talla(a, b, linia[i], linia[i + 1]);
        if (x && dist(x, inici) > R * 0.9) return true;
      }
    }
    return false;
  }

  async function tornaHi() {
    bloquejat = true;
    primerIntent = false;
    traç = null;
    svg.classList.remove('balla'); void svg.getBoundingClientRect(); svg.classList.add('balla');
    capaLinies.querySelectorAll('path').forEach(p => p.classList.add('creuat'));
    await Veu.diu(FRASES.creuat);
    if (elTorn !== torn) return;
    capaLinies.innerHTML = '';
    fets = [];
    actual = 0;
    marca();
    bloquejat = false;
  }

  async function acaba() {
    bloquejat = true;
    svg.classList.add('acabat');
    So.premi();
    await Veu.seqüencia([aleatori(FRASES.encert), FRASES.uneixFet]);
    if (elTorn !== torn) return;
    await apunta('uneix', primerIntent, maxNivell);
    if (elTorn === torn) pantallaUneix();
  }

  const posicio = e => {
    const r = svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  svg.addEventListener('pointerdown', e => {
    if (bloquejat || traç) return;
    const p = posicio(e);
    if (dist(p, punts[actual]) > R * 1.4) {
      // Ha tocat un altre lloc: li recordem on ha de començar.
      const toc = punts.findIndex(q => dist(p, q) < R * 1.2);
      if (toc >= 0) Veu.diu(`Comença per ${articleNum(actual + 1)}.`);
      return;
    }
    svg.setPointerCapture(e.pointerId);
    traç = { id: e.pointerId, pts: [punts[actual]] };
    camí = document.createElementNS(NS, 'path');
    camí.setAttribute('class', 'linia');
    capaLinies.append(camí);
  });

  svg.addEventListener('pointermove', e => {
    if (!traç || e.pointerId !== traç.id || bloquejat) return;
    const p = posicio(e);
    const darrer = traç.pts[traç.pts.length - 1];
    if (dist(p, darrer) < 4) return;
    if (creua(darrer, p)) { camí.remove(); return tornaHi(); }
    traç.pts.push(p);
    dibuixa(traç.pts, camí);
    const seguent = punts[actual + 1];
    if (distSegment(seguent, darrer, p) < R) {
      traç.pts.push(seguent);
      dibuixa(traç.pts, camí);
      camí.classList.add('feta');
      fets.push(traç.pts);
      traç = null;
      actual++;
      marca();
      So.encert();
      Veu.diu(NUMEROS[actual + 1]);
      if (actual === n - 1) acaba();
    }
  });

  const deixa = e => {
    if (!traç || e.pointerId !== traç.id) return;
    // Ha aixecat el dit abans d'arribar: esborrem només aquest tros.
    camí.remove();
    traç = null;
  };
  svg.addEventListener('pointerup', deixa);
  svg.addEventListener('pointercancel', deixa);

  Veu.seqüencia([FRASES.uneix, `Comença per ${articleNum(1)}.`]);
}

/* ---------- Mode adult ---------- */
function preparaBotoAdult(boto) {
  let temps = null;
  const atura = () => { clearTimeout(temps); boto.classList.remove('carregant'); };
  boto.addEventListener('pointerdown', e => {
    e.preventDefault();
    boto.classList.add('carregant');
    temps = setTimeout(() => { atura(); preguntaSuma(); }, 3000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => boto.addEventListener(ev, atura));
  boto.addEventListener('contextmenu', e => e.preventDefault());
}

function preguntaSuma() {
  torn++;
  Veu.calla();
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 5 + Math.floor(Math.random() * 5);
  let entrada = '';
  app.innerHTML = `
    ${barra()}
    <main class="suma">
      <p class="titol-adult">Només per a adults</p>
      <div class="operacio">${a} + ${b} = <span class="resposta">?</span></div>
      <div class="teclat">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'OK'].map(t => `<button data-t="${t}">${t}</button>`).join('')}
      </div>
    </main>`;
  const mostraEntrada = () => { app.querySelector('.resposta').textContent = entrada || '?'; };
  app.querySelector('.teclat').addEventListener('click', e => {
    const t = e.target.closest('button')?.dataset.t;
    if (t === undefined) return;
    if (t === '⌫') entrada = entrada.slice(0, -1);
    else if (t === 'OK') {
      if (Number(entrada) === a + b) return pantallaAdult();
      return preguntaSuma();
    } else if (entrada.length < 2) entrada += t;
    mostraEntrada();
  });
}

function pantallaAdult() {
  torn++;
  repetir = null;
  const aj = D().ajustos;
  const veus = Veu.veusCatala();
  const actual = Veu.actual();
  const n = D().nivells;
  app.innerHTML = `
    ${barra()}
    <main class="adult">
      <h2>Mode adult</h2>

      <section>
        <h3>Lletres que es treballen</h3>
        <p class="ajuda">Toca per activar o desactivar. Calen almenys 3, amb una vocal i una consonant.</p>
        <div class="graella-lletres">
          ${Object.keys(LLETRES).map(l => `<button class="tria ${aj.lletres.includes(l) ? 'activa' : ''} ${LLETRES[l].vocal ? 'vocal' : ''}" data-l="${l}">${mostra(l)}</button>`).join('')}
        </div>
        <p class="ajuda" id="avis-lletres"></p>
      </section>

      <section>
        <h3>Tipus de lletra</h3>
        <div class="segments">
          <button data-tipus="majuscula" class="${aj.tipus === 'majuscula' ? 'activa' : ''}">MAJÚSCULA</button>
          <button data-tipus="minuscula" class="${aj.tipus === 'minuscula' ? 'activa' : ''}">minúscula</button>
        </div>
      </section>

      <section>
        <h3>Veu</h3>
        ${!Veu.disponible() ? '<p class="alerta">Aquest navegador no pot parlar. Obre l\'app amb Google Chrome.</p>'
          : !veus.length ? `<p class="alerta">No s'ha trobat cap veu en català a la tablet. Ves a <b>Configuració → Gestió general → Idioma → Sortida de text a veu</b> (o similar), tria <b>Google</b> i descarrega la veu <b>Català</b>. Després tanca i torna a obrir l'app.</p>`
          : `<label class="camp">Veu
              <select id="veu">${veus.map(v => `<option ${actual && v.name === actual.name ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
            </label>`}
        <label class="camp">Velocitat
          <input type="range" id="velocitat" min="0.6" max="1.2" step="0.05" value="${aj.velocitat}">
        </label>
        <button class="boto-text" id="prova-veu">${ICONA.altaveu} Provar la veu</button>
      </section>

      <section>
        <h3>Progrés</h3>
        <p>⭐ ${D().estrelles} estrelles · ${D().adhesius} adhesius</p>
        <p>Nivell lletres: ${n.lletres + 1} · síl·labes: ${n.sillabes + 1} · paraules: ${n.paraules + 1}</p>
        <p>Nivell números: ${n.numeros + 1} · compta: ${n.compta + 1} · uneix: ${n.uneix + 1}</p>
        <p class="ajuda">El progrés només es guarda en aquesta tablet.</p>
        <button class="boto-text perill" id="esborra">Esborrar el progrés</button>
      </section>

      <button class="boto-text principal" data-accio="inici">Tornar</button>
    </main>`;

  const avis = document.getElementById('avis-lletres');
  app.querySelector('.graella-lletres').addEventListener('click', e => {
    const b = e.target.closest('.tria');
    if (!b) return;
    const l = b.dataset.l;
    const nova = aj.lletres.includes(l) ? aj.lletres.filter(x => x !== l) : [...aj.lletres, l];
    const v = nova.filter(x => LLETRES[x].vocal).length;
    if (nova.length < 3 || v === 0 || v === nova.length) {
      avis.textContent = 'No es pot treure: calen almenys 3 lletres, amb una vocal i una consonant.';
      return;
    }
    avis.textContent = '';
    aj.lletres = nova;
    b.classList.toggle('activa');
    Estat.desa();
  });
  app.querySelector('.segments').addEventListener('click', e => {
    const b = e.target.closest('[data-tipus]');
    if (!b) return;
    aj.tipus = b.dataset.tipus;
    Estat.desa();
    pantallaAdult();
  });
  document.getElementById('veu')?.addEventListener('change', e => Veu.triar(e.target.value));
  document.getElementById('velocitat').addEventListener('change', e => { aj.velocitat = Number(e.target.value); Estat.desa(); });
  document.getElementById('prova-veu').addEventListener('click', () =>
    Veu.seqüencia(['Hola! Anem a cole.', 'Ema, de mà. Pe, de poma.', 'ma, me, mi, mo, mu.', 'On posa pilota?', 'u, dos, tres, quatre, cinc, sis, set, vuit, nou, deu.']));
  document.getElementById('esborra').addEventListener('click', () => {
    if (confirm('Segur que vols esborrar les estrelles, els adhesius i els nivells?')) {
      Estat.reinicia();
      pantallaAdult();
    }
  });
}

/* ---------- Engega ---------- */
pantallaEntrada();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
