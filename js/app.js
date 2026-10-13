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
      <button class="targeta t-globus" data-anar="globus">
        <span class="dibuix">🎈</span>
        <span class="nom">Globus</span>
      </button>
      <button class="targeta t-parelles" data-anar="parelles">
        <span class="dibuix">🃏</span>
        <span class="nom">Parelles</span>
      </button>
      <button class="targeta t-laberint" data-anar="laberint">
        <span class="dibuix">🚗</span>
        <span class="nom">Laberint</span>
      </button>
      <button class="targeta t-futbol" data-anar="futbol">
        <span class="dibuix">⚽</span>
        <span class="nom">Futbol</span>
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
      globus: pantallaGlobus, parelles: pantallaParelles, laberint: pantallaLaberint, futbol: pantallaFutbol,
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

// Quantes vegades es creuen les línies rectes 1→2→…→n.
function creuaments(punts) {
  let c = 0;
  for (let i = 0; i < punts.length - 3; i++)
    for (let j = i + 2; j < punts.length - 1; j++)
      if (talla(punts[i], punts[i + 1], punts[j], punts[j + 1])) c++;
  return c;
}

// Col·loca n punts de manera que el camí recte 1→2→…→n es creui exactament
// "creus" vegades (0 = es pot fer en línia recta). Cap línia recta passa per
// sobre d'un altre número, i queda espai a les vores per fer corbes.
function colocaPunts(n, w, h, R, creus = 0) {
  const marge = R * (creus ? 2.2 : 1.4);
  let millor = null;
  for (let intent = 0; intent < 400; intent++) {
    const punts = [];
    let proves = 0;
    while (punts.length < n && proves++ < 2000) {
      const p = { x: marge + Math.random() * (w - 2 * marge), y: marge + Math.random() * (h - 2 * marge) };
      if (punts.every(q => dist(p, q) > R * 3.4)) punts.push(p);
    }
    if (punts.length < n) continue;
    // Desfà creuaments (2-opt) fins que en quedin els que volem.
    let voltes = 0;
    while (creuaments(punts) > creus && voltes++ < 500) {
      let fet = false;
      for (let i = 0; i < n - 3 && !fet; i++) {
        for (let j = i + 2; j < n - 1; j++) {
          if (talla(punts[i], punts[i + 1], punts[j], punts[j + 1])) {
            const tros = punts.slice(i + 1, j + 1).reverse();
            punts.splice(i + 1, tros.length, ...tros);
            fet = true;
            break;
          }
        }
      }
    }
    if (creuaments(punts) !== creus) continue;
    const net = punts.every((p, k) => punts.every((a, i) =>
      i === n - 1 || i === k || i + 1 === k || distSegment(p, a, punts[i + 1]) > R * 1.5));
    if (!millor) millor = punts;
    if (net) return punts;
  }
  return millor || colocaPunts(n, w, h, R, Math.max(0, creus - 1));
}

function pantallaUneix() {
  torn++;
  const elTorn = torn;
  const maxNivell = UNEIX_NIVELLS.length - 1;
  const nivell = Math.min(D().nivells.uneix, maxNivell);
  const { punts: n, creus } = UNEIX_NIVELLS[nivell];
  repetir = () => Veu.diu(FRASES.uneix);
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="uneix">
      <div class="guia">${Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('')}</div>
      <svg class="tauler"></svg>
    </main>`;
  const guia = [...app.querySelectorAll('.guia span')];

  const svg = app.querySelector('.tauler');
  const { width: w, height: h } = svg.getBoundingClientRect();
  // Amb més números, una mica més petits perquè hi càpiguen.
  const R = Math.max(28, Math.min(w, h) * 0.075 * Math.sqrt(Math.min(1, 10 / n)));
  const punts = colocaPunts(n, w, h, R, creus);
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

  const marca = () => {
    cercles.forEach((c, i) => {
      c.classList.toggle('fet', i < actual);
      c.classList.toggle('actual', i === actual);
    });
    // Ajuda de dalt: els números ja units, pintats; el que toca buscar, fa pampallugues.
    guia.forEach((g, i) => {
      g.classList.toggle('fet', actual > 0 && i <= actual);
      g.classList.toggle('toca', actual === 0 ? i === 0 : i === actual + 1);
    });
  };
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
    await Veu.diu(felicita());
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

  Veu.seqüencia([FRASES.uneix, ...(creus ? ['Si cal, fes una corba.'] : []), `Comença per ${articleNum(1)}.`]);
}

/* ---------- 7. Globus: explota'ls en ordre ---------- */
const felicita = () => (D().ajustos.nom ? `Molt bé, ${D().ajustos.nom}!` : 'Molt bé!');

function pantallaGlobus() {
  torn++;
  const elTorn = torn;
  const maxNivell = GLOBUS_NIVELLS.length - 1;
  const nivell = Math.min(D().nivells.globus, maxNivell);
  const { globus: n, velocitat } = GLOBUS_NIVELLS[nivell];
  const COLORS = ['#FF7A6B', '#FFBE3D', '#2EC4A6', '#8C7BFF', '#4AA8FF', '#FF9F5A', '#F06FB0'];
  const frase = "Explota els globus en ordre.";
  let objectiu = 1;
  repetir = () => Veu.seqüencia([frase, `Busca ${articleNum(objectiu)}.`]);
  app.innerHTML = `${barra({ repetir: true })}<main class="cel"></main>`;
  const cel = app.querySelector('.cel');
  const { width: w, height: h } = cel.getBoundingClientRect();
  const mida = Math.max(70, Math.min(w, h) * 0.17);
  let primerIntent = true;
  let acabat = false;

  // Cada globus surt de sota i puja. Si arriba a dalt, torna a sortir per sota.
  const surt = (g, primer) => {
    g.x = mida * 0.1 + Math.random() * (w - mida * 1.2);
    g.y = h + (primer ? Math.random() * h * 0.5 : Math.random() * h * 0.2);
    g.fase = Math.random() * 6;
  };
  const globus = barreja(Array.from({ length: n }, (_, i) => i + 1)).map(num => {
    const el = document.createElement('button');
    el.className = 'globus-num';
    el.style.cssText = `width:${mida}px;height:${mida * 1.2}px;font-size:${mida * 0.45}px;--color:${COLORS[num % COLORS.length]}`;
    el.innerHTML = `<span>${num}</span>`;
    cel.append(el);
    const g = { num, el, viu: true };
    surt(g, true);
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (!g.viu || acabat) return;
      if (num === objectiu) {
        g.viu = false;
        el.classList.add('explota');
        So.encert();
        setTimeout(() => el.remove(), 300);
        objectiu++;
        if (objectiu > n) return final();
        // Que el següent no trigui a sortir.
        const seg = globus.find(x => x.num === objectiu);
        if (seg.y > h) seg.y = h;
        Veu.diu(NUMEROS[num]);
      } else {
        el.classList.remove('balla'); void el.offsetWidth; el.classList.add('balla');
        Veu.diu(`Busca ${articleNum(objectiu)}.`);
      }
    });
    return g;
  });

  async function final() {
    acabat = true;
    So.premi();
    await Veu.diu(felicita());
    if (elTorn !== torn) return;
    await apunta('globus', primerIntent, maxNivell);
    if (elTorn === torn) pantallaGlobus();
  }

  let abans = performance.now();
  const pas = ara => {
    if (elTorn !== torn || acabat) return;
    const dt = Math.min(50, ara - abans) / 1000;
    abans = ara;
    for (const g of globus) {
      if (!g.viu) continue;
      g.y -= velocitat * h * dt;
      g.fase += dt * 2;
      if (g.y < -mida * 1.3) {
        if (g.num === objectiu) primerIntent = false; // se n'ha anat el que buscava
        surt(g, false);
      }
      g.el.style.transform = `translate(${g.x + Math.sin(g.fase) * mida * 0.15}px, ${g.y}px)`;
    }
    requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
  Veu.seqüencia([frase, `Comença per ${articleNum(1)}.`]);
}

/* ---------- 8. Parelles ---------- */
// Columnes per posar les coses ben ordenades (com un dau).
const COLUMNES_COSES = [0, 1, 2, 3, 2, 3, 3, 4, 4];
function pantallaParelles() {
  torn++;
  const elTorn = torn;
  const maxNivell = PARELLES_NIVELLS.length - 1;
  const nivell = Math.min(D().nivells.parelles, maxNivell);
  const parells = PARELLES_NIVELLS[nivell];
  // Una vegada números amb quantitats, l'altra lletres amb dibuixos.
  const ambLletres = Math.random() < 0.5 && actives().length >= parells;
  let cartes = [];
  if (ambLletres) {
    barreja(actives()).slice(0, parells).forEach(l => {
      const L = LLETRES[l];
      cartes.push({ clau: l, cara: `<span class="carta-lletra">${mostra(l)}</span>`, diu: L.nom });
      cartes.push({ clau: l, cara: `<span class="carta-dibuix">${L.dibuix}</span>`, diu: L.exemple });
    });
  } else {
    const cosa = aleatori(COSES_PER_COMPTAR);
    barreja(Array.from({ length: PARELLES_MAX_QUANTITAT }, (_, i) => i + 1)).slice(0, parells).forEach(x => {
      cartes.push({ clau: x, cara: `<span class="carta-lletra">${x}</span>`, diu: NUMEROS[x] });
      cartes.push({ clau: x, cara: `<span class="carta-coses c${COLUMNES_COSES[x]}">${`<i>${cosa}</i>`.repeat(x)}</span>`, diu: NUMEROS[x] });
    });
  }
  cartes = barreja(cartes);
  const frase = ambLletres ? 'Troba les parelles: cada lletra amb el seu dibuix.' : 'Troba les parelles: cada número amb els seus dibuixos.';
  repetir = () => Veu.diu(frase);
  const total = cartes.length;
  const [cH, fH] = total <= 6 ? [3, 2] : total <= 8 ? [4, 2] : [4, 3]; // en horitzontal
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="parelles" style="--cols-h:${cH};--files-h:${fH};--cols-v:${fH};--files-v:${cH}">
      ${cartes.map((c, i) => `<button class="carta" data-i="${i}"><span class="dors"></span><span class="cara">${c.cara}</span></button>`).join('')}
    </main>`;

  let girades = [];
  let errors = 0;
  let trobades = 0;
  let ocupat = false;
  app.querySelector('.parelles').addEventListener('click', async e => {
    const b = e.target.closest('.carta');
    if (!b || ocupat || b.classList.contains('girada')) return;
    const c = cartes[b.dataset.i];
    b.classList.add('girada');
    girades.push(b);
    Veu.diu(c.diu);
    if (girades.length < 2) return;
    ocupat = true;
    const [a, z] = girades.map(x => cartes[x.dataset.i]);
    if (a.clau === z.clau) {
      girades.forEach(x => x.classList.add('feta'));
      girades = [];
      ocupat = false;
      trobades++;
      await espera(350);
      So.encert();
      if (trobades < parells) return;
      So.premi();
      await Veu.diu(felicita());
      if (elTorn !== torn) return;
      await apunta('parelles', errors <= parells, maxNivell);
      if (elTorn === torn) pantallaParelles();
    } else {
      errors++;
      await espera(900);
      if (elTorn !== torn) return;
      girades.forEach(x => x.classList.remove('girada'));
      girades = [];
      ocupat = false;
    }
  });
  Veu.diu(frase);
}

/* ---------- 9. Laberint ---------- */
// Fa un laberint de cols × files. Cada casella diu si té paret a dalt (d), dreta (r), baix (b) i esquerra (e).
function fesLaberint(cols, files) {
  const c = Array.from({ length: files }, () => Array.from({ length: cols }, () => ({ d: 1, r: 1, b: 1, e: 1, vista: 0 })));
  const pila = [[0, 0]];
  c[0][0].vista = 1;
  const dirs = [[0, -1, 'd', 'b'], [1, 0, 'r', 'e'], [0, 1, 'b', 'd'], [-1, 0, 'e', 'r']];
  while (pila.length) {
    const [x, y] = pila[pila.length - 1];
    const veins = dirs.filter(([dx, dy]) => c[y + dy]?.[x + dx] && !c[y + dy][x + dx].vista);
    if (!veins.length) { pila.pop(); continue; }
    const [dx, dy, p, q] = aleatori(veins);
    c[y][x][p] = 0;
    c[y + dy][x + dx][q] = 0;
    c[y + dy][x + dx].vista = 1;
    pila.push([x + dx, y + dy]);
  }
  return c;
}

// Es pot passar de (x,y) a la casella del costat (dx,dy)?
function obert(c, x, y, dx, dy) {
  const cel = c[y]?.[x];
  if (!cel || !c[y + dy]?.[x + dx]) return false;
  return !(dx === 1 ? cel.r : dx === -1 ? cel.e : dy === 1 ? cel.b : cel.d);
}

// Distància pel camí des d'una casella a totes les altres.
function distancies(c, x0, y0) {
  const d = c.map(f => f.map(() => Infinity));
  d[y0][x0] = 0;
  const cua = [[x0, y0]];
  while (cua.length) {
    const [x, y] = cua.shift();
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      if (obert(c, x, y, dx, dy) && d[y + dy][x + dx] === Infinity) {
        d[y + dy][x + dx] = d[y][x] + 1;
        cua.push([x + dx, y + dy]);
      }
    }
  }
  return d;
}

function pantallaLaberint() {
  torn++;
  const elTorn = torn;
  const maxNivell = LABERINT_NIVELLS.length - 1;
  const nivell = Math.min(D().nivells.laberint, maxNivell);
  const { mida: [llarg, curt], numeros: N, amagats } = LABERINT_NIVELLS[nivell];
  app.innerHTML = `${barra({ repetir: true })}<main class="laberint"><svg class="tauler-laberint"></svg></main>`;
  const svg = app.querySelector('.tauler-laberint');
  const caixa = svg.getBoundingClientRect();
  const horitzontal = caixa.width >= caixa.height;
  const [cols, files] = horitzontal ? [llarg, curt] : [curt, llarg];
  const C = Math.min(caixa.width / cols, caixa.height / files);
  const W = C * cols, H = C * files;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.maxWidth = `${W}px`;
  svg.style.maxHeight = `${H}px`;

  const lab = fesLaberint(cols, files);
  // Sortida a una cantonada i la meta a la cantonada contrària.
  const cantos = [[0, 0], [cols - 1, 0], [0, files - 1], [cols - 1, files - 1]];
  const k = Math.floor(Math.random() * 4);
  const [sx, sy] = cantos[k];
  const [mx, my] = cantos[3 - k];
  const dist = distancies(lab, sx, sy);
  const clau = (x, y) => `${x},${y}`;

  // Camí bo de la sortida a la meta.
  const camíBo = [];
  for (let x = mx, y = my; ;) {
    camíBo.unshift({ x, y });
    if (x === sx && y === sy) break;
    const pas = [[0, -1], [1, 0], [0, 1], [-1, 0]].find(([dx, dy]) => obert(lab, x, y, dx, dy) && dist[y + dy][x + dx] === dist[y][x] - 1);
    x += pas[0]; y += pas[1];
  }
  const alCamí = new Set(camíBo.map(p => clau(p.x, p.y)));

  // On van els números: uns quants al camí bo i, als nivells alts, la resta amagats en carrerons.
  const lliures = [];
  lab.forEach((f, y) => f.forEach((cel, x) => {
    if ((x === sx && y === sy) || (x === mx && y === my)) return;
    lliures.push({ x, y, camí: alCamí.has(clau(x, y)), carreró: 4 - (cel.d + cel.r + cel.b + cel.e) === 1, d: dist[y][x] });
  }));
  const nAmagats = Math.min(Math.round(N * amagats), lliures.filter(c => !c.camí).length);
  const separats = (llista, n) => {
    const tria = [];
    for (const c of barreja(llista)) {
      if (tria.length === n) break;
      if (tria.every(t => Math.abs(t.x - c.x) + Math.abs(t.y - c.y) >= 2)) tria.push(c);
    }
    return tria;
  };
  const amagatsLlocs = separats(lliures.filter(c => !c.camí).sort((a, b) => b.carreró - a.carreró).slice(0, nAmagats * 3), nAmagats);
  const alCamíLlocs = separats(lliures.filter(c => c.camí && amagatsLlocs.every(a => a.x !== c.x || a.y !== c.y)), N - amagatsLlocs.length);
  // Els numerem segons l'ordre en què es troben anant cap a la meta (com més a prop de la sortida, més petit).
  const llocs = [...amagatsLlocs, ...alCamíLlocs];
  // Si no n'hi caben prou separats, n'afegim on hi hagi lloc.
  for (const c of barreja(lliures)) {
    if (llocs.length >= N) break;
    if (llocs.every(l => l.x !== c.x || l.y !== c.y)) llocs.push(c);
  }
  llocs.sort((a, b) => a.d - b.d);
  const numeros = llocs.map((l, i) => ({ ...l, n: i + 1, agafat: false }));
  const total = numeros.length;

  let seguent = 1;
  const frase = () => (seguent <= total
    ? `Recull els números en ordre i surt per la bandera. Busca ${articleNum(seguent)}.`
    : 'Ja els tens tots! Ara, a la bandera.');
  repetir = () => Veu.diu(frase());

  let parets = '';
  lab.forEach((f, y) => f.forEach((cel, x) => {
    const X = x * C, Y = y * C;
    if (cel.d) parets += `M${X},${Y}h${C}`;
    if (cel.e) parets += `M${X},${Y}v${C}`;
    if (y === files - 1 && cel.b) parets += `M${X},${Y + C}h${C}`;
    if (x === cols - 1 && cel.r) parets += `M${X + C},${Y}v${C}`;
  }));
  const gruix = Math.max(4, C * 0.09);
  svg.innerHTML = `
    <path class="rastre" stroke-width="${C * 0.26}" d=""/>
    <path class="parets" stroke-width="${gruix}" d="${parets}"/>
    <text class="meta" x="${(mx + 0.5) * C}" y="${(my + 0.5) * C}" font-size="${C * 0.62}">🏁</text>
    ${numeros.map(o => `<g class="desti" data-n="${o.n}"><circle cx="${(o.x + 0.5) * C}" cy="${(o.y + 0.5) * C}" r="${C * 0.34}"/><text x="${(o.x + 0.5) * C}" y="${(o.y + 0.5) * C}" font-size="${C * 0.42}">${o.n}</text></g>`).join('')}
    <text class="cotxe" font-size="${C * 0.58}">🚗</text>`;
  const cotxe = svg.querySelector('.cotxe');
  const rastre = svg.querySelector('.rastre');
  let pos = { x: sx, y: sy };
  const camí = [pos];
  const colloca = () => {
    cotxe.setAttribute('x', (pos.x + 0.5) * C);
    cotxe.setAttribute('y', (pos.y + 0.5) * C);
    rastre.setAttribute('d', 'M' + camí.map(p => `${(p.x + 0.5) * C},${(p.y + 0.5) * C}`).join('L'));
  };
  colloca();

  let arrossega = null;
  let primerIntent = true;
  let acabat = false;
  let darrerAvis = null;

  const casellaDe = e => {
    const r = svg.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left) / r.width * cols), y: Math.floor((e.clientY - r.top) / r.height * files) };
  };

  async function guanya() {
    acabat = true;
    svg.classList.add('acabat');
    So.premi();
    await Veu.diu(felicita());
    if (elTorn !== torn) return;
    await apunta('laberint', primerIntent, maxNivell);
    if (elTorn === torn) pantallaLaberint();
  }

  function arribaA(x, y) {
    const lloc = clau(x, y);
    if (darrerAvis === lloc) return;
    darrerAvis = lloc;
    if (x === mx && y === my) {
      if (seguent > total) return guanya();
      return Veu.diu(`Encara en falten. Busca ${articleNum(seguent)}.`);
    }
    const o = numeros.find(o => o.x === x && o.y === y && !o.agafat);
    if (!o) { darrerAvis = null; return; }
    if (o.n === seguent) {
      o.agafat = true;
      svg.querySelector(`.desti[data-n="${o.n}"]`).classList.add('agafat');
      So.encert();
      seguent++;
      Veu.diu(seguent > total ? `${NUMEROS[o.n]}! Ara, a la bandera.` : NUMEROS[o.n]);
    } else {
      primerIntent = false;
      Veu.diu(`Aquest és ${articleNum(o.n)}. Primer, busca ${articleNum(seguent)}.`);
    }
  }

  svg.addEventListener('pointerdown', e => {
    if (acabat) return;
    const c = casellaDe(e);
    if (Math.abs(c.x - pos.x) + Math.abs(c.y - pos.y) > 1) return;
    svg.setPointerCapture(e.pointerId);
    arrossega = e.pointerId;
  });
  svg.addEventListener('pointermove', e => {
    if (arrossega !== e.pointerId || acabat) return;
    const c = casellaDe(e);
    // Avança casella a casella cap al dit; les parets no deixen passar.
    for (let i = 0; i < 12 && (c.x !== pos.x || c.y !== pos.y) && !acabat; i++) {
      const dx = Math.sign(c.x - pos.x), dy = Math.sign(c.y - pos.y);
      const opcions = Math.abs(c.x - pos.x) >= Math.abs(c.y - pos.y) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
      const pas = opcions.find(([a, b]) => (a || b) && obert(lab, pos.x, pos.y, a, b));
      if (!pas) break;
      pos = { x: pos.x + pas[0], y: pos.y + pas[1] };
      // Si torna enrere, esborra el rastre.
      const abans = camí.findIndex(p => p.x === pos.x && p.y === pos.y);
      if (abans >= 0) camí.length = abans + 1; else camí.push(pos);
      colloca();
      arribaA(pos.x, pos.y);
    }
  });
  const deixa = e => { if (arrossega === e.pointerId) arrossega = null; };
  svg.addEventListener('pointerup', deixa);
  svg.addEventListener('pointercancel', deixa);
  Veu.diu(frase());
}

/* ---------- 10. Futbol: jugar per les bandes, defensar junts, atacar separats ---------- */
// El camp es dibuixa sempre de 1000 de llarg × 620 d'ample (la nostra porteria a x=0).
// En vertical es gira perquè la nostra porteria quedi a baix.
const CAMP = { L: 1000, A: 620 };
let darreraJugada = null;

// Treure la pilota: el contrari fa un engany amb la pilota, però el cos diu cap on va.
function jugadaTreure(nivell, maxNivell) {
  const elTorn = torn;
  const { rapid } = FUTBOL_NIVELLS[nivell];
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="treure">
      <svg class="escena" viewBox="0 0 600 520">
        <rect class="cel-escena" x="0" y="0" width="600" height="300"/>
        <rect class="terra" x="0" y="300" width="600" height="220"/>
        <g class="rival" transform="translate(300,0)">
          <g class="cames"><path d="M-18,330l-22,95M18,330l22,95"/></g>
          <g class="cos-rival">
            <rect x="-48" y="200" width="96" height="140" rx="30"/>
            <text x="0" y="272">10</text>
            <circle class="cap" cx="0" cy="160" r="40"/>
            <path class="bracos" d="M-46,215l-50,70M46,215l50,70"/>
          </g>
        </g>
        <g class="pilota-escena" transform="translate(300,452)"><circle r="30"/><path d="M-10,-8l10,-7l10,7l-4,12h-12z"/></g>
        <g class="defensor" transform="translate(300,500)"><ellipse rx="70" ry="22"/></g>
      </svg>
      <div class="fletxes" hidden>
        <button data-costat="-1" aria-label="Esquerra">⬅️</button>
        <button data-costat="1" aria-label="Dreta">➡️</button>
      </div>
    </main>`;
  const rival = app.querySelector('.rival');
  const cos = app.querySelector('.cos-rival');
  const pil = app.querySelector('.pilota-escena');
  const def = app.querySelector('.defensor');
  const fletxes = app.querySelector('.fletxes');
  const costat = Math.random() < 0.5 ? -1 : 1; // cap on va de veritat
  const angle = rapid ? 9 : 18;
  let primerIntent = true;
  let ocupat = true;

  const anima = (el, de, a, ms) => new Promise(r => {
    const t0 = performance.now();
    const pas = ara => {
      if (elTorn !== torn) return r();
      const t = Math.min(1, (ara - t0) / ms), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      el.setAttribute('transform', a(de + (1 - de) * e));
      t < 1 ? requestAnimationFrame(pas) : r();
    };
    requestAnimationFrame(pas);
  });

  async function engany() {
    ocupat = true;
    fletxes.hidden = true;
    rival.setAttribute('transform', 'translate(300,0)');
    cos.setAttribute('transform', '');
    pil.setAttribute('transform', 'translate(300,452)');
    def.setAttribute('transform', 'translate(300,500)');
    await espera(400);
    const ms = rapid ? 380 : 650;
    // La pilota va cap a un costat (engany) i el cos s'inclina cap a l'altre.
    await Promise.all([
      anima(pil, 0, t => `translate(${300 - costat * 110 * t},452)`, ms),
      anima(cos, 0, t => `rotate(${costat * angle * t} 0 340)`, ms),
    ]);
    await anima(pil, 0, t => `translate(${300 - costat * 110 * (1 - t)},452)`, ms);
    if (elTorn !== torn) return;
    fletxes.hidden = false;
    ocupat = false;
    Veu.diu('Cap a on anirà? Mira el cos, no la pilota.');
  }

  fletxes.addEventListener('click', async e => {
    const b = e.target.closest('[data-costat]');
    if (!b || ocupat) return;
    ocupat = true;
    fletxes.hidden = true;
    const tria = Number(b.dataset.costat);
    const surt = () => Promise.all([
      anima(rival, 0, t => `translate(${300 + costat * 170 * t},0)`, 500),
      anima(pil, 0, t => `translate(${300 + costat * 190 * t},452)`, 500),
      anima(def, 0, t => `translate(${300 + tria * 170 * t},500)`, 500),
    ]);
    await surt();
    if (elTorn !== torn) return;
    if (tria === costat) {
      So.premi();
      app.querySelector('.escena').classList.add('gol');
      await Veu.seqüencia(["Li has pres la pilota! Has mirat el cos.", felicita()]);
      if (elTorn !== torn) return;
      await apunta('futbol', primerIntent, maxNivell);
      if (elTorn === torn) pantallaFutbol();
    } else {
      primerIntent = false;
      await Veu.diu("T'ha enganyat amb la pilota! Mira el cos.");
      if (elTorn === torn) engany();
    }
  });

  repetir = () => Veu.diu('Mira el cos, no la pilota. Cap a on anirà?');
  Veu.diu('Treu-li la pilota! Fixa\'t en el cos.').then(() => { if (elTorn === torn) engany(); });
}

// Xutar a porteria buida: tocar la porteria on no hi ha el porter.
function jugadaXut(nivell, maxNivell) {
  const elTorn = torn;
  const { rapid: esMou } = FUTBOL_NIVELLS[nivell];
  const P = { x0: 70, x1: 530, y0: 90, y1: 330 }; // pals i travesser
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="treure">
      <svg class="escena xut" viewBox="0 0 600 520">
        <rect class="cel-escena" x="0" y="0" width="600" height="330"/>
        <rect class="terra" x="0" y="330" width="600" height="190"/>
        <rect class="xarxa" x="${P.x0}" y="${P.y0}" width="${P.x1 - P.x0}" height="${P.y1 - P.y0}"/>
        <path class="pals" d="M${P.x0},${P.y1}V${P.y0}H${P.x1}V${P.y1}"/>
        <g class="porter-escena">
          <path class="bracos" d="M-40,175l-48,-45M40,175l48,-45"/>
          <path class="cames" d="M-16,265l-18,62M16,265l18,62"/>
          <rect x="-42" y="160" width="84" height="110" rx="26"/>
          <circle class="cap" cx="0" cy="128" r="32"/>
        </g>
        <g class="pilota-escena" transform="translate(300,460)"><circle r="30"/><path d="M-10,-8l10,-7l10,7l-4,12h-12z"/></g>
      </svg>
    </main>`;
  const escena = app.querySelector('.escena');
  const porter = app.querySelector('.porter-escena');
  const pil = app.querySelector('.pilota-escena');
  let px = Math.random() < 0.5 ? 150 : 450; // on és el porter
  let fase = 0;
  let primerIntent = true;
  let ocupat = false;
  const posaPorter = () => porter.setAttribute('transform', `translate(${px},0)`);
  posaPorter();

  // Al nivell 2 el porter va d'un pal a l'altre.
  let abans = performance.now();
  const passeja = ara => {
    if (elTorn !== torn) return;
    if (esMou && !ocupat) {
      fase += (ara - abans) / 1000 * 1.6;
      px = 300 + Math.sin(fase) * 160;
      posaPorter();
    }
    abans = ara;
    requestAnimationFrame(passeja);
  };
  if (esMou) requestAnimationFrame(passeja);

  const vola = (x, y, ms) => new Promise(r => {
    const t0 = performance.now();
    const pas = ara => {
      if (elTorn !== torn) return r();
      const t = Math.min(1, (ara - t0) / ms);
      const cx = 300 + (x - 300) * t, cy = 460 + (y - 460) * t, s = 1 - 0.45 * t;
      pil.setAttribute('transform', `translate(${cx},${cy}) scale(${s})`);
      t < 1 ? requestAnimationFrame(pas) : r();
    };
    requestAnimationFrame(pas);
  });

  const aEscena = e => {
    const p = escena.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(escena.getScreenCTM().inverse());
  };

  escena.addEventListener('pointerdown', async e => {
    if (ocupat) return;
    const p = aEscena(e);
    if (p.x < P.x0 || p.x > P.x1 || p.y < P.y0 || p.y > P.y1) {
      if (p.y < 400) Veu.diu('Toca dins la porteria!');
      return;
    }
    ocupat = true;
    So.encert();
    await vola(p.x, p.y, 420);
    if (elTorn !== torn) return;
    // El porter hi arriba si la pilota va a prop seu.
    if (Math.abs(p.x - px) < 115) {
      primerIntent = false;
      pil.setAttribute('transform', `translate(${px},${200}) scale(0.55)`);
      await Veu.diu("El porter l'ha aturada! Xuta on no hi ha el porter.");
      if (elTorn !== torn) return;
      pil.setAttribute('transform', 'translate(300,460)');
      ocupat = false;
      return;
    }
    escena.classList.add('gol');
    So.premi();
    await Veu.seqüencia(['Gol! On no hi ha el porter!', felicita()]);
    if (elTorn !== torn) return;
    await apunta('futbol', primerIntent, maxNivell);
    if (elTorn === torn) pantallaFutbol();
  });

  const frase = esMou ? 'El porter es mou. Xuta quan hi hagi un forat!' : 'Xuta a porteria! Toca on no hi ha el porter.';
  repetir = () => Veu.diu(frase);
  Veu.diu(frase);
}

function pantallaFutbol() {
  torn++;
  const elTorn = torn;
  const maxNivell = FUTBOL_NIVELLS.length - 1;
  const nivell = Math.min(D().nivells.futbol, maxNivell);
  const { cercles } = FUTBOL_NIVELLS[nivell];
  const jugada = aleatori(['bandes', 'atac', 'defensa', 'treure', 'desmarcar', 'xut'].filter(j => j !== darreraJugada));
  darreraJugada = jugada;
  if (jugada === 'treure') return jugadaTreure(nivell, maxNivell);
  if (jugada === 'xut') return jugadaXut(nivell, maxNivell);

  app.innerHTML = `${barra({ repetir: true })}<main class="futbol"><svg class="camp"></svg><button class="boto-joga" hidden aria-label="Juga">⚽</button></main>`;
  const svg = app.querySelector('.camp');
  const boto = app.querySelector('.boto-joga');
  const caixa = svg.getBoundingClientRect();
  const vertical = caixa.height > caixa.width;
  const { L, A } = CAMP;
  svg.setAttribute('viewBox', vertical ? `-24 -24 ${A + 48} ${L + 48}` : `-24 -24 ${L + 48} ${A + 48}`);
  const gira = vertical ? ` transform="rotate(90)"` : ''; // perquè els números no surtin de costat

  svg.innerHTML = `
    <g class="mon" ${vertical ? `transform="translate(0,${L}) rotate(-90)"` : ''}>
      <rect class="gespa" x="0" y="0" width="${L}" height="${A}" rx="14"/>
      ${Array.from({ length: 10 }, (_, i) => i % 2 ? `<rect class="franja" x="${i * 100}" y="0" width="100" height="${A}"/>` : '').join('')}
      <g class="linies">
        <rect x="0" y="0" width="${L}" height="${A}" rx="14"/>
        <path d="M${L / 2},0V${A}"/>
        <circle cx="${L / 2}" cy="${A / 2}" r="80"/>
        <rect x="0" y="${A / 2 - 150}" width="150" height="300"/>
        <rect x="${L - 150}" y="${A / 2 - 150}" width="150" height="300"/>
      </g>
      <rect class="porteria nostra" x="-18" y="${A / 2 - 60}" width="18" height="120"/>
      <rect class="porteria seva" x="${L}" y="${A / 2 - 60}" width="18" height="120"/>
      <g class="zones"></g>
      <g class="vermells"></g>
      <g class="blaus"></g>
      <g class="pilota"><circle r="17"/><path d="M-6,-5l6,-4l6,4l-2,7h-8z"/></g>
    </g>`;
  const mon = svg.querySelector('.mon');
  const capaZones = svg.querySelector('.zones');

  const fesJugador = (capa, classe, x, y, num) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `jugador ${classe}`);
    g.innerHTML = `<circle r="34"/><text${gira}>${num}</text>`;
    svg.querySelector(capa).append(g);
    const j = { g, x, y, num };
    posa(j);
    return j;
  };
  const posa = j => j.g.setAttribute('transform', `translate(${j.x},${j.y})`);
  const pilota = { g: svg.querySelector('.pilota'), x: 0, y: 0 };
  // Mou un jugador o la pilota fins a un punt, amb animació.
  const mou = (obj, x, y, ms = 600) => new Promise(resol => {
    const x0 = obj.x, y0 = obj.y, t0 = performance.now();
    const pas = ara => {
      if (elTorn !== torn) return resol();
      const t = Math.min(1, (ara - t0) / ms), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      obj.x = x0 + (x - x0) * e; obj.y = y0 + (y - y0) * e;
      posa(obj);
      t < 1 ? requestAnimationFrame(pas) : resol();
    };
    requestAnimationFrame(pas);
  });

  let acabat = false;
  let primerIntent = true;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  async function gol(frase) {
    acabat = true;
    boto.hidden = true;
    await mou(pilota, L + 10, A / 2 + (Math.random() - 0.5) * 60, 450);
    svg.classList.add('gol');
    So.premi();
    await Veu.seqüencia([frase, felicita()]);
    if (elTorn !== torn) return;
    await apunta('futbol', primerIntent, maxNivell);
    if (elTorn === torn) pantallaFutbol();
  }

  // Porter de cada equip.
  fesJugador('.blaus', 'porter', 40, A / 2, 1);
  fesJugador('.vermells', 'porter', L - 40, A / 2, 1);

  if (jugada === 'bandes') {
    const passador = fesJugador('.blaus', '', 460, A / 2, 8);
    const esquerra = fesJugador('.blaus', 'company', 640, 70, 7);
    const dreta = fesJugador('.blaus', 'company', 640, A - 70, 11);
    const davanter = fesJugador('.blaus', 'company', 720, A / 2, 9);
    [[600, A / 2 - 70], [600, A / 2 + 70], [690, A / 2 - 110], [690, A / 2 + 110], [780, A / 2]].forEach(([x, y], i) => fesJugador('.vermells', '', x, y, i + 2));
    Object.assign(pilota, { x: passador.x + 40, y: passador.y }); posa(pilota);
    const frase = 'Pel mig hi ha molta gent. A qui passes la pilota? Toca un company.';
    repetir = () => Veu.diu(frase);
    let ocupat = false;
    svg.querySelectorAll('.company').forEach(g => g.addEventListener('pointerdown', async () => {
      if (ocupat || acabat) return;
      ocupat = true;
      const j = [esquerra, dreta, davanter].find(j => j.g === g);
      if (j === davanter) {
        primerIntent = false;
        await mou(pilota, 600, A / 2, 500); // un vermell la intercepta
        await Veu.diu("Uf, pel mig ens la prenen! Prova per la banda.");
        await mou(pilota, passador.x + 40, passador.y, 400);
        ocupat = false;
        return;
      }
      await mou(pilota, j.x, j.y, 550);
      const yBanda = j === esquerra ? 90 : A - 90;
      await Promise.all([mou(j, 880, yBanda, 900), mou(pilota, 900, yBanda, 900), mou(davanter, 860, A / 2, 900)]);
      await mou(pilota, davanter.x + 20, davanter.y, 450);
      gol('Gol! Per la banda hi ha més espai!');
    }));
    Veu.diu(frase);
    return;
  }

  if (jugada === 'desmarcar') {
    // Distància d'un punt a la línia de passada.
    const aLinia = (p, a, b) => {
      const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2));
      return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
    };
    const company = fesJugador('.blaus', '', 380, A / 2, 8);
    const jo = fesJugador('.blaus', 'mobil jo', 660, A / 2, 9);
    const vermells = [[600, A / 2], [720, A / 2 + 50], [520, 120], [520, A - 120]].map(([x, y], i) => fesJugador('.vermells', '', x, y, [5, 4, 6, 3][i]));
    Object.assign(pilota, { x: company.x + 40, y: company.y }); posa(pilota);
    const zona = Math.random() < 0.5 ? { x: 720, y: 110 } : { x: 720, y: A - 110 };
    if (cercles) capaZones.innerHTML = `<circle cx="${zona.x}" cy="${zona.y}" r="75"/>`;
    const lliure = () => dist(jo, company) > 150 && vermells.every(v => aLinia(v, pilota, jo) > 55 && dist(v, jo) > 110);
    const frase = cercles
      ? "El teu company té la pilota, però et marquen. Desmarca't! Porta el jugador de l'anell groc al cercle."
      : "El teu company té la pilota, però et marquen. Desmarca't! Busca un lloc on no et tapi ningú.";
    repetir = () => Veu.diu(frase);
    const aMon = e => {
      const p = svg.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      return p.matrixTransform(mon.getScreenCTM().inverse());
    };
    let agafat = null;
    svg.addEventListener('pointerdown', e => {
      if (acabat || dist(jo, aMon(e)) > 70) return;
      svg.setPointerCapture(e.pointerId);
      agafat = e.pointerId;
      jo.g.classList.add('agafat');
    });
    svg.addEventListener('pointermove', e => {
      if (agafat !== e.pointerId) return;
      const p = aMon(e);
      jo.x = Math.max(30, Math.min(L - 30, p.x));
      jo.y = Math.max(30, Math.min(A - 30, p.y));
      posa(jo);
    });
    const deixa = async e => {
      if (agafat !== e.pointerId) return;
      agafat = null;
      jo.g.classList.remove('agafat');
      const bo = cercles ? dist(jo, zona) <= 75 && lliure() : lliure();
      if (!bo) {
        if (!cercles || dist(jo, { x: 660, y: A / 2 }) > 60) {
          primerIntent = false;
          Veu.diu(cercles ? 'Porta-ho al cercle!' : 'Encara et tapen. Busca un lloc on no hi hagi ningú entre tu i la pilota.');
        }
        return;
      }
      acabat = true;
      await mou(pilota, jo.x, jo.y, 550);
      await Promise.all([mou(jo, 880, A / 2 + (jo.y < A / 2 ? -60 : 60), 700), mou(pilota, 900, A / 2 + (jo.y < A / 2 ? -60 : 60), 700)]);
      gol("Gol! Desmarcat, et poden passar la pilota!");
    };
    svg.addEventListener('pointerup', deixa);
    svg.addEventListener('pointercancel', deixa);
    Veu.diu(frase);
    return;
  }

  // Atac i defensa: cal arrossegar els jugadors blaus.
  const atac = jugada === 'atac';
  const inicials = atac
    ? [[330, A / 2 - 60], [370, A / 2 + 30], [300, A / 2 + 80], [400, A / 2 - 10]]
    : [[480, 90], [620, A - 100], [720, 230], [700, A / 2 + 120]];
  const blaus = inicials.map(([x, y], i) => fesJugador('.blaus', 'mobil', x, y, [4, 6, 7, 9][i]));
  if (atac) {
    [[620, A / 2 - 40], [700, A / 2 + 50], [780, A / 2 - 10]].forEach(([x, y], i) => fesJugador('.vermells', '', x, y, i + 2));
    Object.assign(pilota, { x: blaus[3].x + 40, y: blaus[3].y });
  } else {
    [[520, A / 2], [600, 140], [600, A - 140]].forEach(([x, y], i) => fesJugador('.vermells', 'ataca', x, y, [10, 11, 5][i]));
    Object.assign(pilota, { x: 480, y: A / 2 });
  }
  posa(pilota);
  // Els cercles (només al primer nivell).
  const zones = atac
    ? [{ x: 620, y: 80 }, { x: 620, y: A - 80 }, { x: 470, y: A / 2 }, { x: 800, y: A / 2 }]
    : [{ x: 220, y: A / 2, rx: 140, ry: 190 }];
  if (cercles) {
    capaZones.innerHTML = zones.map(z => z.rx
      ? `<ellipse cx="${z.x}" cy="${z.y}" rx="${z.rx}" ry="${z.ry}"/>`
      : `<circle cx="${z.x}" cy="${z.y}" r="75"/>`).join('');
  }
  const frase = atac
    ? (cercles ? 'Ataquem! Quan ataquem, ens separem. Porta cada jugador blau a un cercle.' : 'Ataquem! Quan ataquem, ens separem. Col·loca els blaus i toca la pilota.')
    : (cercles ? 'Defensem! Quan defensem, anem junts. Porta els jugadors blaus al cercle.' : 'Defensem! Quan defensem, anem junts. Col·loca els blaus i toca la pilota.');
  repetir = () => Veu.diu(frase);
  if (!cercles) boto.hidden = false;

  const dinsZona = (j, z) => z.rx ? ((j.x - z.x) / z.rx) ** 2 + ((j.y - z.y) / z.ry) ** 2 <= 1 : dist(j, z) <= 75;
  const benColocats = () => {
    if (cercles) {
      if (!atac) return blaus.every(j => dinsZona(j, zones[0]));
      return zones.every(z => blaus.some(j => dinsZona(j, z)));
    }
    if (atac) {
      const separats = blaus.every((a, i) => blaus.every((b, k) => k === i || dist(a, b) > 170));
      return separats && blaus.some(j => j.y < 150) && blaus.some(j => j.y > A - 150) && blaus.some(j => j.x > 650);
    }
    const cx = blaus.reduce((s, j) => s + j.x, 0) / blaus.length, cy = blaus.reduce((s, j) => s + j.y, 0) / blaus.length;
    return cx < 400 && blaus.every(j => dist(j, { x: cx, y: cy }) < 160);
  };

  async function juga() {
    if (acabat) return;
    if (atac) {
      acabat = true;
      const banda = blaus.reduce((m, j) => (Math.abs(j.y - A / 2) > Math.abs(m.y - A / 2) ? j : m));
      const davanter = blaus.reduce((m, j) => (j !== banda && j.x > m.x ? j : m), blaus.find(j => j !== banda));
      await mou(pilota, banda.x, banda.y, 550);
      await Promise.all([mou(banda, 880, banda.y < A / 2 ? 90 : A - 90, 800), mou(pilota, 900, banda.y < A / 2 ? 90 : A - 90, 800), mou(davanter, 860, A / 2, 800)]);
      await mou(pilota, davanter.x + 20, davanter.y, 400);
      acabat = false;
      return gol('Gol! Separats tenim més espai!');
    }
    acabat = true;
    // El vermell intenta passar i un blau li pren la pilota.
    const lladre = blaus.reduce((m, j) => (j.x > m.x ? m : j));
    await mou(pilota, lladre.x + 30, lladre.y, 700);
    So.encert();
    acabat = false;
    gol('Molt bé! Junts, no ens passen!');
  }

  async function revisa(manual) {
    if (acabat) return;
    if (benColocats()) return juga();
    if (!manual) return;
    primerIntent = false;
    Veu.diu(atac ? 'Encara estan massa junts. Separa\'ls: un a cada banda i un a davant!' : 'Encara estan massa separats. Ajunta\'ls a prop de la porteria!');
  }
  boto.addEventListener('click', () => revisa(true));

  // Arrossegar
  const aMon = e => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(mon.getScreenCTM().inverse());
  };
  let agafat = null;
  svg.addEventListener('pointerdown', e => {
    if (acabat) return;
    const p = aMon(e);
    const j = blaus.reduce((m, j) => (dist(j, p) < dist(m, p) ? j : m));
    if (dist(j, p) > 70) return;
    svg.setPointerCapture(e.pointerId);
    agafat = { j, id: e.pointerId };
    j.g.classList.add('agafat');
  });
  svg.addEventListener('pointermove', e => {
    if (!agafat || agafat.id !== e.pointerId) return;
    const p = aMon(e);
    agafat.j.x = Math.max(30, Math.min(L - 30, p.x));
    agafat.j.y = Math.max(30, Math.min(A - 30, p.y));
    posa(agafat.j);
  });
  const deixa = e => {
    if (!agafat || agafat.id !== e.pointerId) return;
    agafat.j.g.classList.remove('agafat');
    agafat = null;
    if (cercles) revisa(false);
  };
  svg.addEventListener('pointerup', deixa);
  svg.addEventListener('pointercancel', deixa);
  Veu.diu(frase);
}

/* ---------- Mode adult ---------- */
// Nivell més alt de cada joc.
function maxNivells() {
  const p = paraulesDisponibles().length;
  return {
    lletres: actives().length - 1,
    sillabes: Math.max(0, consonantsActives().length - 1),
    paraules: Math.max(0, (p >= 3 ? p : 6) - 3),
    numeros: 7,
    compta: 7,
    uneix: UNEIX_NIVELLS.length - 1,
    globus: GLOBUS_NIVELLS.length - 1,
    parelles: PARELLES_NIVELLS.length - 1,
    laberint: LABERINT_NIVELLS.length - 1,
    futbol: FUTBOL_NIVELLS.length - 1,
  };
}

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
        <h3>Nom</h3>
        <p class="ajuda">La veu el diu quan acaba un joc ("Molt bé, …!"). Només es guarda en aquesta tablet.</p>
        <input class="camp-text" id="nom" maxlength="20" autocomplete="off" value="${(aj.nom || '').replace(/"/g, '&quot;')}" placeholder="Nom">
      </section>

      <section>
        <h3>Nivells</h3>
        <p class="ajuda">Puja o baixa el nivell de cada joc. Puja sol quan l'encerta ${ENCERTS_PER_NIVELL} vegades seguides.</p>
        <div class="nivells">
          ${Object.entries(maxNivells()).map(([joc, max]) => `
            <div class="fila-nivell" data-joc="${joc}">
              <span>${FRASES.menu[joc]}</span>
              <button data-canvi="-1" aria-label="Baixa">−</button>
              <b>${Math.min(n[joc], max) + 1} / ${max + 1}</b>
              <button data-canvi="1" aria-label="Puja">+</button>
            </div>`).join('')}
        </div>
      </section>

      <section>
        <h3>Progrés</h3>
        <p>⭐ ${D().estrelles} estrelles · ${D().adhesius} adhesius</p>
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
  document.getElementById('nom').addEventListener('input', e => { aj.nom = e.target.value.trim(); Estat.desa(); });
  app.querySelector('.nivells').addEventListener('click', e => {
    const b = e.target.closest('[data-canvi]');
    if (!b) return;
    const joc = b.closest('[data-joc]').dataset.joc;
    const max = maxNivells()[joc];
    D().nivells[joc] = Math.max(0, Math.min(max, Math.min(n[joc], max) + Number(b.dataset.canvi)));
    D().seguits[joc] = 0;
    Estat.desa();
    b.parentElement.querySelector('b').textContent = `${D().nivells[joc] + 1} / ${max + 1}`;
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
