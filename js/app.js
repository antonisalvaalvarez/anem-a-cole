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
      globus: pantallaGlobus, parelles: pantallaParelles, laberint: pantallaLaberint, futbol: pantallaFutbolMenu,
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

/* ---------- 10. Futbol ---------- */
// Jugades: passar per la banda, atacar separats, defensar junts, treure la pilota
// mirant el cos, desmarcar-se, xutar on no hi ha el porter, córner assajat i passades de l'1 al 5.
// Les primeres vegades de cada jugada, una mà fa la demostració.
const JUGADES = {
  bandes: { emoji: '⚽', retol: 'Passa per la banda' },
  atac: { emoji: '↔️', retol: 'Ataquem separats' },
  defensa: { emoji: '🤝', retol: 'Defensem junts' },
  treure: { emoji: '👀', retol: 'Mira el cos, no la pilota' },
  desmarcar: { emoji: '🏃', retol: "Desmarca't" },
  xut: { emoji: '🥅', retol: 'Xuta on no hi ha el porter' },
  corner: { emoji: '🚩', retol: 'Córner assajat' },
  passades: { emoji: '🔢', retol: "Passa de l'1 al 5" },
};
const DEMOS_PER_JUGADA = 1;
const CAMP = { L: 1000, A: 620 }; // la nostra porteria a x=0
let darreraJugada = null;

function pantallaFutbol(forcada = null, demo = null) {
  torn++;
  const elTorn = torn;
  const maxNivell = FUTBOL_NIVELLS.length - 1;
  const nivell = Math.min(D().nivells.futbol, maxNivell);
  const jugada = forcada || aleatori(Object.keys(JUGADES).filter(j => j !== darreraJugada));
  darreraJugada = jugada;
  D().demos = D().demos || {};
  const vistes = D().demos[jugada] || 0;
  if (demo === null) demo = vistes < DEMOS_PER_JUGADA;
  if (demo) { D().demos[jugada] = vistes + 1; Estat.desa(); }
  const { cercles: ambCercles, rapid } = FUTBOL_NIVELLS[nivell];
  const cercles = demo || ambCercles;
  const J = JUGADES[jugada];

  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="futbol">
      <div class="retol">
        <button class="boto-menu" aria-label="Menú de futbol">☰</button>
        <span class="retol-emoji">${J.emoji}</span><b>${J.retol}</b>
        ${demo ? '<button class="boto-ara-jo">✋ Ara jo!</button>' : '<button class="boto-mira" aria-label="Mira com es fa">👀 Mira</button>'}
      </div>
      <div class="zona-joc"></div>
      ${demo ? '<div class="tapa-demo" aria-label="Toca per jugar"></div>' : ''}
      <div class="ma" hidden>👆</div>
      <div class="indicador" hidden>👇</div>
    </main>`;
  const main = app.querySelector('.futbol');
  const zonaJoc = app.querySelector('.zona-joc');
  const ma = app.querySelector('.ma');
  const indicador = app.querySelector('.indicador');
  app.querySelector('.boto-mira')?.addEventListener('click', () => pantallaFutbol(jugada, true));
  app.querySelector('.boto-menu').addEventListener('click', pantallaFutbolMenu);
  // Durant la demostració, tocar la pantalla l'atura i deixa jugar.
  const araJo = e => { e.preventDefault(); Veu.calla(); pantallaFutbol(jugada, false); };
  app.querySelector('.boto-ara-jo')?.addEventListener('pointerdown', araJo);
  app.querySelector('.tapa-demo')?.addEventListener('pointerdown', araJo);

  // La mà de la demostració i la fletxa d'ajuda (en coordenades de pantalla).
  const relatiu = p => { const r = main.getBoundingClientRect(); return { x: p.x - r.left, y: p.y - r.top }; };
  let maPos = null;
  const posaMa = p => { const q = relatiu(p); ma.hidden = false; ma.style.transform = `translate(${q.x}px, ${q.y}px)`; maPos = p; };
  const mouMa = (p, ms = 600) => new Promise(r => {
    const de = maPos || { x: p.x, y: p.y + 120 }, t0 = performance.now();
    const pas = ara => {
      if (elTorn !== torn) return r();
      const t = Math.min(1, (ara - t0) / ms), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      posaMa({ x: de.x + (p.x - de.x) * e, y: de.y + (p.y - de.y) * e });
      t < 1 ? requestAnimationFrame(pas) : r();
    };
    requestAnimationFrame(pas);
  });
  const tocaMa = async () => { ma.classList.remove('toc'); void ma.offsetWidth; ma.classList.add('toc'); await espera(350); };
  const assenyala = p => {
    if (!p) { indicador.hidden = true; return; }
    const q = relatiu(p);
    indicador.hidden = false;
    indicador.style.transform = `translate(${q.x}px, ${q.y}px)`;
  };
  const centre = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  let primerIntent = true;
  const fallada = () => { primerIntent = false; };
  // S'ha fet bé la jugada.
  async function fet(frase) {
    ma.hidden = true;
    assenyala(null);
    So.premi();
    if (demo) {
      await Veu.seqüencia([frase, 'Ara tu!']);
      if (elTorn === torn) pantallaFutbol(jugada, false);
      return;
    }
    await Veu.seqüencia([frase, felicita()]);
    if (elTorn !== torn) return;
    await apunta('futbol', primerIntent, maxNivell);
    if (elTorn === torn) pantallaFutbol();
  }
  const diu = text => Veu.diu(demo ? `Mira! ${text}` : text);
  const k = { jugada, elTorn, demo, cercles, rapid, zonaJoc, mouMa, tocaMa, assenyala, centre, fet, fallada, diu };
  if (jugada === 'treure') jugadaTreure(k);
  else if (jugada === 'xut') jugadaXut(k);
  else jugadaCamp(k);
}

/* Dibuixa el camp vist des de dalt i torna les eines per posar-hi jugadors i moure'ls.
   La nostra porteria és a x=0; la banda esquerra (on juga el lateral esquerre) és a dalt (y petita). */
function dibuixaCamp(zonaJoc, elTorn, quanPosa = () => {}) {
  const { L, A } = CAMP;
  zonaJoc.innerHTML = '<svg class="camp"></svg>';
  const svg = zonaJoc.querySelector('.camp');
  const caixa = svg.getBoundingClientRect();
  const vertical = caixa.height > caixa.width;
  svg.setAttribute('viewBox', vertical ? `-24 -24 ${A + 48} ${L + 48}` : `-24 -24 ${L + 48} ${A + 48}`);
  const gira = vertical ? ' transform="rotate(90)"' : '';
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
      <rect class="porteria" x="-18" y="${A / 2 - 60}" width="18" height="120"/>
      <rect class="porteria" x="${L}" y="${A / 2 - 60}" width="18" height="120"/>
      <g class="zones"></g>
      <g class="vermells"></g>
      <g class="blaus"></g>
      <g class="pilota"><circle r="17"/><path d="M-6,-5l6,-4l6,4l-2,7h-8z"/></g>
    </g>`;
  const mon = svg.querySelector('.mon');
  const capaZones = svg.querySelector('.zones');
  const aPantalla = (x, y) => { const m = mon.getScreenCTM(); return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; };
  const aMon = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(mon.getScreenCTM().inverse()); };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const posa = j => { j.g.setAttribute('transform', `translate(${j.x},${j.y})`); quanPosa(j); };
  const fesJugador = (capa, classe, x, y, num) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', `jugador ${classe}`);
    g.innerHTML = `<circle r="34"/><text${gira}>${num}</text>`;
    svg.querySelector(capa).append(g);
    const j = { g, x, y, num };
    posa(j);
    return j;
  };
  const pilota = { g: svg.querySelector('.pilota'), x: 0, y: 0 };
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
  return { svg, mon, capaZones, vertical, gira, aPantalla, aMon, dist, posa, fesJugador, pilota, mou };
}

/* El camp vist des de dalt (totes les jugades menys treure i xut). */
function jugadaCamp(k) {
  const { jugada, elTorn, demo, cercles, zonaJoc, mouMa, tocaMa, assenyala, centre, fet, fallada, diu } = k;
  const { L, A } = CAMP;
  let seguint = null; // jugador que la mà arrossega a la demostració
  const C = dibuixaCamp(zonaJoc, elTorn, j => { if (j === seguint) mouMa(C.aPantalla(j.x, j.y), 0); });
  const { svg, mon, capaZones, gira, aPantalla, aMon, dist, posa, fesJugador, pilota, mou } = C;
  zonaJoc.insertAdjacentHTML('beforeend', '<button class="boto-joga" hidden aria-label="Juga">⚽</button>');
  const boto = zonaJoc.querySelector('.boto-joga');
  // A la demostració: la mà agafa un jugador i el porta a un lloc.
  const demoArrossega = async (j, x, y) => {
    await mouMa(aPantalla(j.x, j.y), 500);
    seguint = j;
    j.g.classList.add('agafat');
    await mou(j, x, y, 800);
    j.g.classList.remove('agafat');
    seguint = null;
    await espera(150);
  };
  const demoToca = async j => { await mouMa(aPantalla(j.x, j.y), 600); await tocaMa(); };
  const assenyalaJugador = j => assenyala(j ? aPantalla(j.x, j.y) : null);
  const cercle = (z, r = 75) => `<circle cx="${z.x}" cy="${z.y}" r="${r}"/>`;
  let acabat = false;
  // A prop de la porteria, la imatge canvia: xut de cara, com un penal.
  async function gol(frase) {
    acabat = true;
    boto.hidden = true;
    assenyala(null);
    await espera(300);
    if (elTorn !== torn) return;
    await xutFinal(k);
    if (elTorn === torn) fet(frase);
  }

  // Arrossegar jugadors amb el dit (no a la demostració).
  const arrossegables = [];
  let quanDeixa = () => {};
  let agafat = null;
  svg.addEventListener('pointerdown', e => {
    if (demo || acabat || !arrossegables.length) return;
    const p = aMon(e);
    const j = arrossegables.reduce((m, j) => (dist(j, p) < dist(m, p) ? j : m));
    if (dist(j, p) > 70) return;
    svg.setPointerCapture(e.pointerId);
    agafat = { j, id: e.pointerId };
    j.g.classList.add('agafat');
    assenyala(null);
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
    const j = agafat.j;
    j.g.classList.remove('agafat');
    agafat = null;
    quanDeixa(j);
  };
  svg.addEventListener('pointerup', deixa);
  svg.addEventListener('pointercancel', deixa);

  // Tocar un company per passar-li la pilota.
  const tocables = [];
  let quanToca = () => {};
  svg.addEventListener('pointerdown', e => {
    if (demo || acabat || !tocables.length) return;
    const p = aMon(e);
    const j = tocables.find(j => dist(j, p) < 60);
    if (j) quanToca(j);
  });

  // Porters.
  fesJugador('.blaus', 'porter', 40, A / 2, 1);
  fesJugador('.vermells', 'porter', L - 40, A / 2, 1);

  /* --- Per la banda --- */
  if (jugada === 'bandes') {
    const passador = fesJugador('.blaus', '', 460, A / 2, 8);
    const esquerra = fesJugador('.blaus', 'company', 640, 70, 7);
    const dreta = fesJugador('.blaus', 'company', 640, A - 70, 11);
    const davanter = fesJugador('.blaus', 'company', 720, A / 2, 9);
    [[600, A / 2 - 70], [600, A / 2 + 70], [690, A / 2 - 110], [690, A / 2 + 110], [780, A / 2]].forEach(([x, y], i) => fesJugador('.vermells', '', x, y, i + 2));
    Object.assign(pilota, { x: passador.x + 40, y: passador.y }); posa(pilota);
    tocables.push(esquerra, dreta, davanter);
    const frase = 'Pel mig hi ha molta gent. Passa la pilota per la banda: toca un company.';
    repetir = () => Veu.diu(frase);
    let ocupat = false;
    quanToca = async j => {
      if (ocupat) return;
      ocupat = true;
      if (j === davanter) {
        fallada();
        await mou(pilota, 600, A / 2, 500);
        await Veu.diu('Uf, pel mig ens la prenen! Prova per la banda.');
        await mou(pilota, passador.x + 40, passador.y, 400);
        ocupat = false;
        return;
      }
      await mou(pilota, j.x, j.y, 550);
      const yBanda = j === esquerra ? 90 : A - 90;
      await Promise.all([mou(j, 880, yBanda, 900), mou(pilota, 900, yBanda, 900), mou(davanter, 860, A / 2, 900)]);
      await mou(pilota, davanter.x + 20, davanter.y, 450);
      gol('Gol! Per la banda hi ha més espai!');
    };
    if (demo) diu(frase).then(async () => { await demoToca(esquerra); if (elTorn === torn) quanToca(esquerra); });
    else Veu.diu(frase);
    return;
  }

  /* --- Desmarcar-se --- */
  if (jugada === 'desmarcar') {
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
    if (cercles) capaZones.innerHTML = cercle(zona);
    const lliure = () => dist(jo, company) > 150 && vermells.every(v => aLinia(v, pilota, jo) > 55 && dist(v, jo) > 110);
    const frase = cercles
      ? "El teu company té la pilota, però et marquen. Desmarca't: porta el jugador de l'anell groc al cercle."
      : "El teu company té la pilota, però et marquen. Desmarca't: busca un lloc on no et tapi ningú.";
    repetir = () => Veu.diu(frase);
    const prova = async () => {
      const bo = cercles ? dist(jo, zona) <= 75 && lliure() : lliure();
      if (!bo) {
        if (dist(jo, { x: 660, y: A / 2 }) > 60) {
          fallada();
          Veu.diu(cercles ? 'Porta-ho al cercle!' : 'Encara et tapen. Busca un lloc on no hi hagi ningú entre tu i la pilota.');
        }
        if (cercles) assenyalaJugador(jo);
        return;
      }
      acabat = true;
      await mou(pilota, jo.x, jo.y, 550);
      const yFi = A / 2 + (jo.y < A / 2 ? -60 : 60);
      await Promise.all([mou(jo, 880, yFi, 700), mou(pilota, 900, yFi, 700)]);
      gol('Gol! Desmarcat, et poden passar la pilota!');
    };
    arrossegables.push(jo);
    quanDeixa = prova;
    if (demo) diu(frase).then(async () => { await demoArrossega(jo, zona.x, zona.y); if (elTorn === torn) prova(); });
    else { Veu.diu(frase); if (cercles) assenyalaJugador(jo); }
    return;
  }

  /* --- Córner assajat --- */
  if (jugada === 'corner') {
    const yC = Math.random() < 0.5 ? 1 : -1; // córner per dalt o per baix
    const Y = y => (yC === 1 ? y : A - y);
    const llançador = fesJugador('.blaus', '', L - 18, Y(18), 10);
    const set = fesJugador('.blaus', 'mobil', 780, Y(200), 7);
    const nou = fesJugador('.blaus', 'company', 800, Y(380), 9);
    const marcador = fesJugador('.vermells', '', 850, Y(290), 4);
    fesJugador('.vermells', '', 900, Y(470), 5);
    Object.assign(pilota, { x: llançador.x - 26, y: llançador.y + yC * 26 }); posa(pilota);
    const primerPal = { x: 930, y: Y(220) };
    if (cercles) capaZones.innerHTML = cercle(primerPal);
    let pas = 1;
    const frase1 = "Córner assajat! Primer, el set corre al primer pal per endur-se el defensa.";
    const frase2 = "El defensa l'ha seguit! Ara, passa la pilota al que està sol.";
    repetir = () => Veu.diu(pas === 1 ? frase1 : frase2);
    arrossegables.push(set);
    const alPrimerPal = () => (cercles ? dist(set, primerPal) <= 80 : set.x > 880 && Math.abs(set.y - primerPal.y) < 120);
    quanDeixa = async () => {
      if (pas !== 1) return;
      if (!alPrimerPal()) {
        if (dist(set, { x: 780, y: Y(200) }) > 60) { fallada(); Veu.diu('Porta el set a prop del primer pal, al costat de la porteria.'); }
        if (cercles) assenyalaJugador(set);
        return;
      }
      pas = 2;
      arrossegables.length = 0;
      capaZones.innerHTML = '';
      await mou(marcador, set.x - 45, set.y + yC * 35, 600); // el defensa el segueix
      tocables.push(set, nou);
      if (!demo) Veu.diu(frase2);
    };
    let ocupat = false;
    quanToca = async j => {
      if (pas !== 2 || ocupat) return;
      ocupat = true;
      if (j === set) {
        fallada();
        await Veu.diu("El set està marcat! Passa-la al nou, que està sol.");
        ocupat = false;
        return;
      }
      await mou(nou, 880, A / 2 + yC * -10, 500);
      await mou(pilota, nou.x, nou.y, 650);
      gol('Gol de córner! Jugada assajada!');
    };
    if (demo) {
      diu(frase1).then(async () => {
        await demoArrossega(set, primerPal.x, primerPal.y);
        if (elTorn !== torn) return;
        await quanDeixa(set);
        await Veu.diu(`Mira! ${frase2}`);
        await demoToca(nou);
        if (elTorn === torn) { pas = 2; quanToca(nou); }
      });
    } else { Veu.diu(frase1); if (cercles) assenyalaJugador(set); }
    return;
  }

  /* --- Passades de l'1 al 5 --- */
  if (jugada === 'passades') {
    const aLinia = (p, a, b) => {
      const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2));
      return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
    };
    // Aquí només compten els números blaus de l'1 al 5: sense porter blau i contraris sense número.
    svg.querySelector('.blaus .porter').remove();
    const u = fesJugador('.blaus', '', 140, A / 2, 1);
    const inicials = [[260, A / 2 - 70], [280, A / 2 + 60], [330, A / 2 - 10], [230, A / 2 + 140]];
    const companys = inicials.map(([x, y], i) => fesJugador('.blaus', 'mobil', x, y, i + 2));
    const vermells = [[480, A / 2 - 40], [520, A / 2 + 70], [640, A / 2 - 10], [700, A / 2 + 110], [760, A / 2 - 100]]
      .map(([x, y]) => fesJugador('.vermells', '', x, y, ''));
    Object.assign(pilota, { x: u.x + 40, y: u.y }); posa(pilota);
    const dalt = Math.random() < 0.5;
    const ruta = [[330, 120], [560, 70], [760, 95], [870, 230]].map(([x, y]) => ({ x, y: dalt ? y : A - y }));
    if (cercles) capaZones.innerHTML = ruta.map((z, i) => `${cercle(z, 62)}<text class="num-zona" x="${z.x}" y="${z.y}"${gira ? ` transform="rotate(90 ${z.x} ${z.y})"` : ''}>${i + 2}</text>`).join('');
    boto.hidden = false;
    const frase = cercles
      ? "L'u té la pilota. Porta cada jugador al cercle del seu número i toca la pilota. Passarem en ordre fins al cinc!"
      : "L'u té la pilota. Col·loca del dos al cinc per passar en ordre, per la banda, i toca la pilota.";
    repetir = () => Veu.diu(frase);
    arrossegables.push(...companys);
    const següent = () => companys.find((j, i) => dist(j, ruta[i]) > 62);
    quanDeixa = () => { if (cercles) assenyalaJugador(següent()); };
    let ocupat = false;
    async function passa() {
      if (ocupat || acabat) return;
      ocupat = true;
      assenyala(null);
      const ordre = [u, ...companys];
      for (let i = 0; i < 4; i++) {
        const a = ordre[i], b = ordre[i + 1];
        if (dist(a, b) > 430) {
          fallada();
          await Veu.diu(`${a.num === 1 ? "De l'u" : `Del ${NUMEROS[a.num]}`} al ${NUMEROS[b.num]} és massa lluny. Posa'ls més a prop!`);
          break;
        }
        const lladre = vermells.find(v => aLinia(v, a, b) < 50);
        if (lladre) {
          fallada();
          await mou(pilota, lladre.x, lladre.y, 450);
          await Veu.diu('Pel mig te la prenen! Passa per la banda.');
          break;
        }
        await mou(pilota, b.x + 20, b.y, 450);
        Veu.diu(NUMEROS[b.num]);
        if (b.num === 5) {
          if (b.x < 760) {
            fallada();
            await Veu.diu('El cinc és massa lluny de la porteria. Acosta-l\'hi!');
            break;
          }
          return gol("Gol! Hem passat de l'u al cinc!");
        }
      }
      if (elTorn !== torn) return;
      Object.assign(pilota, { x: u.x + 40, y: u.y }); posa(pilota);
      ocupat = false;
      if (cercles) assenyalaJugador(següent());
    }
    boto.addEventListener('click', () => { if (!demo) passa(); });
    if (demo) {
      diu(frase).then(async () => {
        for (let i = 0; i < 4; i++) { if (elTorn !== torn) return; await demoArrossega(companys[i], ruta[i].x, ruta[i].y); }
        await mouMa(centre(boto), 500);
        await tocaMa();
        if (elTorn === torn) passa();
      });
    } else { Veu.diu(frase); if (cercles) assenyalaJugador(companys[0]); }
    return;
  }

  /* --- Atacar separats / defensar junts --- */
  const atac = jugada === 'atac';
  const inicials = atac
    ? [[330, A / 2 - 60], [370, A / 2 + 30], [300, A / 2 + 80], [400, A / 2 - 10]]
    : [[480, 90], [620, A - 100], [720, 230], [700, A / 2 + 120]];
  const blaus = inicials.map(([x, y], i) => fesJugador('.blaus', 'mobil', x, y, [4, 6, 7, 9][i]));
  if (atac) {
    [[620, A / 2 - 40], [700, A / 2 + 50], [780, A / 2 - 10]].forEach(([x, y], i) => fesJugador('.vermells', '', x, y, i + 2));
    Object.assign(pilota, { x: blaus[3].x + 40, y: blaus[3].y });
  } else {
    [[520, A / 2], [600, 140], [600, A - 140]].forEach(([x, y], i) => fesJugador('.vermells', '', x, y, [10, 11, 5][i]));
    Object.assign(pilota, { x: 480, y: A / 2 });
  }
  posa(pilota);
  const zones = atac
    ? [{ x: 620, y: 80 }, { x: 620, y: A - 80 }, { x: 470, y: A / 2 }, { x: 800, y: A / 2 }]
    : [{ x: 220, y: A / 2, rx: 140, ry: 190 }];
  if (cercles) capaZones.innerHTML = zones.map(z => z.rx ? `<ellipse cx="${z.x}" cy="${z.y}" rx="${z.rx}" ry="${z.ry}"/>` : cercle(z)).join('');
  const frase = atac
    ? (cercles ? 'Ataquem! Quan ataquem, ens separem. Porta cada jugador blau a un cercle.' : 'Ataquem! Quan ataquem, ens separem. Col·loca els blaus i toca la pilota.')
    : (cercles ? 'Defensem! Quan defensem, anem junts. Porta els jugadors blaus al cercle.' : 'Defensem! Quan defensem, anem junts. Col·loca els blaus i toca la pilota.');
  repetir = () => Veu.diu(frase);
  if (!cercles) boto.hidden = false;
  const dinsZona = (j, z) => (z.rx ? ((j.x - z.x) / z.rx) ** 2 + ((j.y - z.y) / z.ry) ** 2 <= 1 : dist(j, z) <= 75);
  const benColocats = () => {
    if (cercles) return atac ? zones.every(z => blaus.some(j => dinsZona(j, z))) : blaus.every(j => dinsZona(j, zones[0]));
    if (atac) {
      const separats = blaus.every((a, i) => blaus.every((b, n) => n === i || dist(a, b) > 170));
      return separats && blaus.some(j => j.y < 150) && blaus.some(j => j.y > A - 150) && blaus.some(j => j.x > 650);
    }
    const cx = blaus.reduce((s, j) => s + j.x, 0) / blaus.length, cy = blaus.reduce((s, j) => s + j.y, 0) / blaus.length;
    return cx < 400 && blaus.every(j => dist(j, { x: cx, y: cy }) < 160);
  };
  // La fletxa d'ajuda va al primer jugador que encara no és al seu lloc.
  const següentPerMoure = () => (atac
    ? blaus.find(j => !zones.some(z => dinsZona(j, z)))
    : blaus.find(j => !dinsZona(j, zones[0])));
  async function juga() {
    if (acabat) return;
    acabat = true;
    assenyala(null);
    if (atac) {
      const banda = blaus.reduce((m, j) => (Math.abs(j.y - A / 2) > Math.abs(m.y - A / 2) ? j : m));
      const davanter = blaus.reduce((m, j) => (j !== banda && j.x > m.x ? j : m), blaus.find(j => j !== banda));
      const yB = banda.y < A / 2 ? 90 : A - 90;
      await mou(pilota, banda.x, banda.y, 550);
      await Promise.all([mou(banda, 880, yB, 800), mou(pilota, 900, yB, 800), mou(davanter, 860, A / 2, 800)]);
      await mou(pilota, davanter.x + 20, davanter.y, 400);
      return gol('Gol! Separats tenim més espai!');
    }
    const lladre = blaus.reduce((m, j) => (j.x > m.x ? m : j));
    await mou(pilota, lladre.x + 30, lladre.y, 700);
    So.encert();
    fet('Molt bé! Junts, no ens passen!');
  }
  const revisa = manual => {
    if (acabat) return;
    if (benColocats()) return juga();
    if (cercles) assenyalaJugador(següentPerMoure());
    if (!manual) return;
    fallada();
    Veu.diu(atac ? "Encara estan massa junts. Separa'ls: un a cada banda i un a davant!" : "Encara estan massa separats. Ajunta'ls a prop de la porteria!");
  };
  boto.addEventListener('click', () => revisa(true));
  arrossegables.push(...blaus);
  quanDeixa = () => { if (cercles) revisa(false); };
  if (demo) {
    const offs = [[-50, -60], [50, -60], [-50, 60], [50, 60]];
    diu(frase).then(async () => {
      for (let i = 0; i < blaus.length; i++) {
        if (elTorn !== torn) return;
        const z = atac ? zones[i] : { x: zones[0].x + offs[i][0], y: zones[0].y + offs[i][1] };
        await demoArrossega(blaus[i], z.x, z.y);
      }
      if (elTorn === torn) juga();
    });
  } else { Veu.diu(frase); if (cercles) assenyalaJugador(següentPerMoure()); }
}

/* Treure la pilota: el contrari fa un engany amb la pilota, però el cos diu cap on va. */
function jugadaTreure(k) {
  const { elTorn, demo, rapid, zonaJoc, mouMa, tocaMa, centre, fet, fallada, diu } = k;
  // Grada amb públic (punts de colors).
  const colorsPublic = ['#FF7A6B', '#FFBE3D', '#2EC4A6', '#8C7BFF', '#4AA8FF', '#FFFFFF', '#F06FB0'];
  let public_ = '';
  for (let fila = 0; fila < 4; fila++) {
    for (let x = 8 + (fila % 2) * 9; x < 600; x += 18) {
      public_ += `<circle cx="${x}" cy="${150 + fila * 22}" r="7" fill="${aleatori(colorsPublic)}"/>`;
    }
  }
  // Gespa amb franges que s'eixamplen cap a baix (fa profunditat).
  const franges = [250, 272, 298, 330, 368, 412, 462, 520];
  let gespa = '';
  for (let n = 0; n < franges.length - 1; n++) {
    gespa += `<rect x="0" y="${franges[n]}" width="600" height="${franges[n + 1] - franges[n]}" fill="${n % 2 ? '#4FB06C' : '#45A262'}"/>`;
  }
  const cama = c => `
    <path class="pell" d="M${c * 18},330 L${c * 25},375" stroke-width="20"/>
    <path class="mitja" d="M${c * 25},368 L${c * 28},396" stroke-width="22"/>
    <ellipse class="bota" cx="${c * 33}" cy="402" rx="19" ry="9"/>`;
  zonaJoc.innerHTML = `
    <svg class="escena driblar" viewBox="0 0 600 520">
      <defs>
        <linearGradient id="cel-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD3FF"/><stop offset="1" stop-color="#E6F4FF"/></linearGradient>
      </defs>
      <rect x="0" y="0" width="600" height="250" fill="url(#cel-grad)"/>
      <rect x="0" y="128" width="600" height="104" fill="#5B6785"/>
      <g opacity="0.85">${public_}</g>
      <rect x="0" y="228" width="600" height="22" fill="#DCE3EE"/>
      ${gespa}
      <path class="linia-area" d="M0,300H600"/>
      <g class="rival" transform="translate(300,0)">
        <ellipse class="ombra" cx="0" cy="404" rx="62" ry="12"/>
        <g class="cames">${cama(-1)}${cama(1)}</g>
        <path class="pantalo" d="M-44,296 L44,296 L46,334 Q24,340 4,334 L0,322 L-4,334 Q-24,340 -46,334 Z"/>
        <g class="cos-rival">
          <path class="pell" d="M-58,226 Q-74,252 -72,280" stroke-width="16"/>
          <path class="pell" d="M58,226 Q74,252 72,280" stroke-width="16"/>
          <circle class="ma-rival" cx="-72" cy="284" r="10"/>
          <circle class="ma-rival" cx="72" cy="284" r="10"/>
          <rect class="pell-fons" x="-10" y="164" width="20" height="26" rx="6"/>
          <path class="samarreta" d="M-38,186 Q0,196 38,186 L64,212 L52,234 L46,226 L48,300 Q0,308 -48,300 L-46,226 L-52,234 L-64,212 Z"/>
          <path class="coll" d="M-14,187 Q0,201 14,187"/>
          <text class="dorsal" x="0" y="252">10</text>
          <circle class="pell-fons" cx="0" cy="140" r="34"/>
          <path class="cabell" d="M-35,140 Q-38,98 0,100 Q38,98 35,140 Q30,120 14,118 Q0,126 -16,118 Q-30,120 -35,140 Z"/>
          <circle class="ull" cx="-12" cy="144" r="3.6"/>
          <circle class="ull" cx="12" cy="144" r="3.6"/>
          <path class="boca" d="M-9,157 Q0,163 9,157"/>
        </g>
      </g>
      <g class="pilota-escena" transform="translate(300,392)">
        <circle class="pilota-fons" r="24"/>
        <path class="pilota-taca" d="M0,-9 L8.5,-2.8 L5.3,7.3 L-5.3,7.3 L-8.5,-2.8 Z"/>
        <path class="pilota-ratlla" d="M0,-9V-23M8.5,-2.8L21,-7M5.3,7.3L13,19M-5.3,7.3L-13,19M-8.5,-2.8L-21,-7"/>
      </g>
      <g class="defensor" transform="translate(300,56)">
        <path class="pell" d="M-104,520 Q-120,470 -96,452" stroke-width="22"/>
        <path class="pell" d="M104,520 Q120,470 96,452" stroke-width="22"/>
        <path class="samarreta-blava" d="M-112,530 Q-112,470 -62,452 Q0,440 62,452 Q112,470 112,530 Z"/>
        <text class="dorsal" x="0" y="505">4</text>
        <circle class="pell-fons" cx="-40" cy="430" r="9"/>
        <circle class="pell-fons" cx="40" cy="430" r="9"/>
        <circle class="cabell" cx="0" cy="424" r="40"/>
      </g>
    </svg>
    <div class="fletxes" hidden>
      <button data-costat="-1" aria-label="Esquerra">⬅️</button>
      <button data-costat="1" aria-label="Dreta">➡️</button>
    </div>`;
  const rival = zonaJoc.querySelector('.rival');
  const cos = zonaJoc.querySelector('.cos-rival');
  const pil = zonaJoc.querySelector('.pilota-escena');
  const def = zonaJoc.querySelector('.defensor');
  const fletxes = zonaJoc.querySelector('.fletxes');
  const costat = Math.random() < 0.5 ? -1 : 1;
  const angle = rapid && !demo ? 9 : 18;
  let ocupat = true;
  const anima = (el, f, ms) => new Promise(r => {
    const t0 = performance.now();
    const pas = ara => {
      if (elTorn !== torn) return r();
      const t = Math.min(1, (ara - t0) / ms), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      el.setAttribute('transform', f(e));
      t < 1 ? requestAnimationFrame(pas) : r();
    };
    requestAnimationFrame(pas);
  });
  async function engany() {
    ocupat = true;
    fletxes.hidden = true;
    rival.setAttribute('transform', 'translate(300,0)');
    cos.setAttribute('transform', '');
    pil.setAttribute('transform', 'translate(300,392)');
    def.setAttribute('transform', 'translate(300,56)');
    await espera(400);
    const ms = rapid && !demo ? 380 : 650;
    await Promise.all([
      anima(pil, t => `translate(${300 - costat * 110 * t},392) rotate(${-costat * 200 * t})`, ms),
      anima(cos, t => `rotate(${costat * angle * t} 0 300)`, ms),
      anima(rival, t => `translate(${300 + costat * 14 * t},0)`, ms),
    ]);
    await anima(pil, t => `translate(${300 - costat * 110 * (1 - t)},392) rotate(${-costat * 200 * (1 - t)})`, ms);
    if (elTorn !== torn) return;
    fletxes.hidden = false;
    ocupat = false;
  }
  async function tria(c) {
    ocupat = true;
    fletxes.hidden = true;
    await Promise.all([
      anima(rival, t => `translate(${300 + costat * (14 + 156 * t)},0)`, 500),
      anima(pil, t => `translate(${300 + costat * 180 * t},${392 + 40 * t}) rotate(${costat * 360 * t})`, 500),
      anima(def, t => `translate(${300 + c * 150 * t},56)`, 500),
    ]);
    if (elTorn !== torn) return;
    if (c === costat) return fet('Li has pres la pilota! Has mirat el cos.');
    fallada();
    await Veu.diu("T'ha enganyat amb la pilota! Mira el cos.");
    if (elTorn === torn) { await engany(); Veu.diu('Cap a on anirà? Mira el cos.'); }
  }
  fletxes.addEventListener('click', e => {
    const b = e.target.closest('[data-costat]');
    if (!b || ocupat || demo) return;
    tria(Number(b.dataset.costat));
  });
  repetir = () => Veu.diu('Mira el cos, no la pilota. Cap a on anirà?');
  diu("Treu-li la pilota! La pilota t'enganya; el cos diu cap on va.").then(async () => {
    if (elTorn !== torn) return;
    await engany();
    if (elTorn !== torn) return;
    if (!demo) return Veu.diu('Cap a on anirà? Mira el cos, no la pilota.');
    await Veu.diu(costat < 0 ? "El cos s'inclina cap aquí. Anirà cap aquí!" : "El cos s'inclina cap aquí. Anirà cap aquí!");
    await mouMa(centre(fletxes.querySelector(`[data-costat="${costat}"]`)), 600);
    await tocaMa();
    if (elTorn === torn) tria(costat);
  });
}

/* Xut a porteria, com un penal: direcció, alçada i força. Acaba quan entra. */
function xutFinal(k) {
  const { elTorn, demo, rapid, zonaJoc, mouMa, tocaMa, centre, fallada } = k;
  const P = { x0: 70, x1: 530, y0: 90, y1: 330 };
  const velocitat = rapid && !demo ? 2.4 : 1.5;
  zonaJoc.innerHTML = `
    <div class="penal">
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
        <line class="mira-v" y1="60" y2="360"/>
        <line class="mira-h" x1="40" x2="560" style="display:none"/>
        <circle class="diana" r="22" style="display:none"/>
        <g class="pilota-escena" transform="translate(300,460)"><circle r="30"/><path d="M-10,-8l10,-7l10,7l-4,12h-12z"/></g>
      </svg>
      <div class="forca" hidden><div class="forca-bona"></div><div class="forca-nivell"></div></div>
    </div>`;
  const escena = zonaJoc.querySelector('.escena');
  const porter = zonaJoc.querySelector('.porter-escena');
  const pil = zonaJoc.querySelector('.pilota-escena');
  const miraV = zonaJoc.querySelector('.mira-v');
  const miraH = zonaJoc.querySelector('.mira-h');
  const diana = zonaJoc.querySelector('.diana');
  const forca = zonaJoc.querySelector('.forca');
  const nivellForca = zonaJoc.querySelector('.forca-nivell');
  const BONA = [0.45, 0.8]; // força bona
  const vis = (el, si) => { el.style.display = si ? '' : 'none'; };
  const px = Math.random() < 0.5 ? 160 : 440; // el porter, a un costat
  porter.setAttribute('transform', `translate(${px},0)`);

  return new Promise(resol => {
    let pas = 0; // 0: direcció, 1: alçada, 2: força, 3: xutant
    let t = Math.random() * 6;
    let x = 300, y = 210, f = 0;
    let abans = performance.now();
    const posa = () => {
      miraV.setAttribute('x1', x); miraV.setAttribute('x2', x);
      miraH.setAttribute('y1', y); miraH.setAttribute('y2', y);
      diana.setAttribute('cx', x); diana.setAttribute('cy', y);
      nivellForca.style.height = `${f * 100}%`;
      nivellForca.classList.toggle('bona', f >= BONA[0] && f <= BONA[1]);
    };
    const comença = () => {
      pas = 0;
      pil.setAttribute('transform', 'translate(300,460)');
      vis(miraV, true); vis(miraH, false); vis(diana, false); forca.hidden = true;
      Veu.diu(demo ? 'Mira! Primer, cap a on xutes.' : 'Atura la fletxa on vols xutar.');
    };
    const roda = ara => {
      if (elTorn !== torn) return;
      t += (ara - abans) / 1000 * velocitat;
      abans = ara;
      if (pas === 0) x = 300 + Math.sin(t) * 250;
      if (pas === 1) y = 210 + Math.sin(t) * 140;
      if (pas === 2) f = (1 - Math.cos(t * 1.3)) / 2;
      posa();
      if (demo) provaDemo();
      requestAnimationFrame(roda);
    };
    // A la demostració, la mà toca quan la fletxa és a un bon lloc.
    let esperantMa = false;
    const objectiu = { x: px < 300 ? 440 : 160, y: 170, f: 0.62 };
    const provaDemo = async () => {
      if (esperantMa || pas > 2) return;
      const prou = pas === 0 ? Math.abs(x - objectiu.x) < 14 : pas === 1 ? Math.abs(y - objectiu.y) < 10 : Math.abs(f - objectiu.f) < 0.04;
      if (!prou) return;
      esperantMa = true;
      atura();
      await tocaMa();
      esperantMa = false;
    };
    async function atura() {
      if (pas === 0) { pas = 1; vis(miraH, true); vis(diana, true); Veu.diu(demo ? 'Ara, a quina alçada.' : 'Ara, a quina alçada?'); return; }
      if (pas === 1) { pas = 2; vis(miraV, false); vis(miraH, false); forca.hidden = false; t = 0; Veu.diu(demo ? 'I la força: a la zona verda.' : 'I ara la força! Ni poc ni massa.'); return; }
      if (pas !== 2) return;
      pas = 3;
      const fluix = f < BONA[0], fort = f > BONA[1];
      const fi = { x, y: fort ? P.y0 - 70 : y };
      const durada = fluix ? 900 : 420;
      const t0 = performance.now();
      await new Promise(r => {
        const vola = ara => {
          if (elTorn !== torn) return r();
          const s = Math.min(1, (ara - t0) / durada);
          pil.setAttribute('transform', `translate(${300 + (fi.x - 300) * s},${460 + (fi.y - 460) * s}) scale(${1 - 0.45 * s})`);
          s < 1 ? requestAnimationFrame(vola) : r();
        };
        requestAnimationFrame(vola);
      });
      if (elTorn !== torn) return;
      const fora = x < P.x0 + 12 || x > P.x1 - 12 || y < P.y0 + 12;
      const aturada = fluix || Math.abs(x - px) < 110;
      let avis = null;
      if (fort) avis = "Massa fort! Se n'ha anat per dalt.";
      else if (fora) avis = 'Per poc! Ha anat fora. Xuta dins la porteria.';
      else if (aturada) avis = fluix ? "Massa fluix! El porter l'ha agafada." : "El porter l'ha aturada! Xuta on no hi ha el porter.";
      if (avis) {
        fallada();
        if (aturada && !fort && !fora) pil.setAttribute('transform', `translate(${px},210) scale(0.55)`);
        await Veu.diu(avis);
        if (elTorn === torn) comença();
        return;
      }
      escena.classList.add('gol');
      resol();
    }
    escena.addEventListener('pointerdown', () => { if (!demo && pas <= 2) atura(); });
    forca.addEventListener('pointerdown', () => { if (!demo && pas === 2) atura(); });
    comença();
    if (demo) mouMa(centre(escena), 500);
    requestAnimationFrame(roda);
  });
}

/* Xutar on no hi ha el porter. */
async function jugadaXut(k) {
  repetir = () => Veu.diu('Xuta on no hi ha el porter!');
  await k.diu('Xuta on no hi ha el porter!');
  if (k.elTorn !== torn) return;
  await xutFinal(k);
  if (k.elTorn === torn) k.fet('Gol! On no hi ha el porter!');
}

/* ---------- Futbol: menú i minijocs del lateral esquerre ---------- */
const MINIJOCS = {
  rebre: { emoji: '🦶', nom: 'Rep la pilota', diu: 'Rep la pilota' },
  banda: { emoji: '🏃', nom: 'Puja per la banda', diu: 'Puja per la banda' },
  pressio: { emoji: '😰', nom: 'Et pressionen', diu: 'Et pressionen' },
  pressiona: { emoji: '🛡️', nom: 'Pressiona!', diu: 'Pressiona' },
};
const RONDES_MINIJOC = 5;

function pantallaFutbolMenu() {
  torn++;
  Veu.calla();
  repetir = () => Veu.diu('Tria un joc de futbol. Tu ets el lateral esquerre, el número tres.');
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="menu-futbol">
      <button class="targeta t-futbol gran" data-anar="jugades"><span class="dibuix">⚽</span><span class="nom">Jugades</span></button>
      ${Object.entries(MINIJOCS).map(([id, m]) => `
        <button class="targeta t-lateral" data-anar="${id}"><span class="dibuix">${m.emoji}</span><span class="nom">${m.nom}</span></button>`).join('')}
    </main>`;
  app.querySelector('.menu-futbol').addEventListener('click', e => {
    const t = e.target.closest('[data-anar]');
    if (!t) return;
    const on = t.dataset.anar;
    if (on === 'jugades') { Veu.diu('Jugades'); return pantallaFutbol(); }
    Veu.diu(MINIJOCS[on].diu);
    pantallaLateral(on);
  });
  Veu.diu('Tria un joc de futbol.');
}

function pantallaLateral(joc, ronda = 0, fallades = 0) {
  torn++;
  const elTorn = torn;
  const M = MINIJOCS[joc];
  const nivell = Math.min(D().nivells.lateral || 0, 2);
  const vel = 1 + nivell * 0.3 + ronda * 0.12;
  app.innerHTML = `
    ${barra({ repetir: true })}
    <main class="futbol">
      <div class="retol">
        <button class="boto-menu" aria-label="Menú de futbol">☰</button>
        <span class="retol-emoji">${M.emoji}</span><b>${M.nom}</b>
        <span class="punts">${Array.from({ length: RONDES_MINIJOC }, (_, i) => `<i class="${i < ronda ? 'fet' : ''}"></i>`).join('')}</span>
      </div>
      <div class="zona-joc"></div>
      <div class="indicador" hidden>👇</div>
    </main>`;
  app.querySelector('.boto-menu').addEventListener('click', pantallaFutbolMenu);
  const main = app.querySelector('.futbol');
  const zonaJoc = app.querySelector('.zona-joc');
  const indicador = app.querySelector('.indicador');
  const C = dibuixaCamp(zonaJoc, elTorn);
  const assenyala = j => {
    if (!j) { indicador.hidden = true; return; }
    const p = C.aPantalla(j.x, j.y), r = main.getBoundingClientRect();
    indicador.hidden = false;
    indicador.style.transform = `translate(${p.x - r.left}px, ${p.y - r.top}px)`;
  };
  let acabat = false;
  const m = {
    ...C, elTorn, vel, nivell, assenyala,
    viu: () => elTorn === torn && !acabat,
    async encert(frase) {
      if (acabat) return;
      acabat = true;
      assenyala(null);
      So.encert();
      await Veu.diu(frase);
      if (elTorn !== torn) return;
      if (ronda + 1 < RONDES_MINIJOC) return pantallaLateral(joc, ronda + 1, fallades);
      So.premi();
      await celebra('🏆', `${felicita()} Ets un gran lateral!`);
      if (elTorn !== torn) return;
      await apunta('lateral', fallades <= 1, 2);
      if (elTorn === torn) pantallaFutbolMenu();
    },
    async fallo(frase) {
      if (acabat) return;
      acabat = true;
      assenyala(null);
      await Veu.diu(frase);
      if (elTorn === torn) pantallaLateral(joc, ronda, fallades + 1);
    },
  };
  ({ rebre: miniRebre, banda: miniBanda, pressio: miniPressio, pressiona: miniPressiona })[joc](m);
}

// Arrossegar un jugador amb el dit dins un minijoc.
function arrossegable(m, j, quanMou) {
  const { svg, aMon, dist, posa } = m;
  const { L, A } = CAMP;
  let agafat = null;
  svg.addEventListener('pointerdown', e => {
    if (!m.viu() || dist(j, aMon(e)) > 85) return;
    svg.setPointerCapture(e.pointerId);
    agafat = e.pointerId;
    j.g.classList.add('agafat');
    m.assenyala(null);
  });
  svg.addEventListener('pointermove', e => {
    if (agafat !== e.pointerId || !m.viu()) return;
    const p = aMon(e);
    const abans = { x: j.x, y: j.y };
    j.x = Math.max(20, Math.min(L - 20, p.x));
    j.y = Math.max(-30, Math.min(A - 20, p.y));
    posa(j);
    quanMou(abans, j);
  });
  const deixa = e => { if (agafat === e.pointerId) { agafat = null; j.g.classList.remove('agafat'); } };
  svg.addEventListener('pointerup', deixa);
  svg.addEventListener('pointercancel', deixa);
}

// Distància d'un punt a un segment.
const aSegment = (p, a, b) => {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
};

/* 1. Rep la pilota: mirar abans de rebre i controlar cap a l'espai lliure. */
function miniRebre(m) {
  const { fesJugador, pilota, posa, mou, aMon, dist, capaZones, svg } = m;
  const central = fesJugador('.blaus', '', 150, 300, 4);
  const jo = fesJugador('.blaus', 'jo', 230, 80, 3);
  const extrem = fesJugador('.blaus', '', 560, 60, 11);
  const pivot = fesJugador('.blaus', '', 380, 360, 6);
  const endavant = { x: 340, y: 60 }, dins = { x: 300, y: 220 };
  const perDins = Math.random() < 0.5; // on és el contrari
  fesJugador('.vermells', '', perDins ? 360 : 420, perDins ? 250 : 70, 7);
  capaZones.innerHTML = `<circle class="opcio-zona" cx="${endavant.x}" cy="${endavant.y}" r="62"/><circle class="opcio-zona" cx="${dins.x}" cy="${dins.y}" r="62"/>`;
  Object.assign(pilota, { x: central.x + 30, y: central.y }); posa(pilota);
  repetir = () => Veu.diu("Mira on és el vermell. Toca on vols controlar la pilota, abans que t'arribi.");
  let tria = null;
  svg.addEventListener('pointerdown', e => {
    if (!m.viu() || tria) return;
    const p = aMon(e);
    tria = dist(p, endavant) < 80 ? endavant : dist(p, dins) < 80 ? dins : null;
    if (tria) capaZones.querySelectorAll('circle')[tria === endavant ? 0 : 1].classList.add('triada');
  });
  (async () => {
    await Veu.diu('Mira on és el vermell! Toca cap a on controles.');
    if (!m.viu()) return;
    await mou(pilota, jo.x + 10, jo.y + 25, 1900 / m.vel);
    if (!m.viu()) return;
    if (!tria) return m.fallo("Decideix abans que t'arribi la pilota!");
    const bo = perDins ? tria === endavant : tria === dins;
    if (!bo) return m.fallo("Allà hi ha el contrari! Controla cap a l'espai lliure.");
    await Promise.all([mou(jo, tria.x, tria.y, 450), mou(pilota, tria.x + 25, tria.y + 10, 450)]);
    const company = tria === endavant ? extrem : pivot;
    await mou(pilota, company.x, company.y, 450);
    m.encert('Molt bé! Has mirat abans de rebre.');
  })();
}

/* 2. Puja per la banda, en primera persona: ell corre vora la línia de banda,
   li vénen contraris de cara i ha de buscar l'espai (normalment, la banda). */
function miniBanda(m) {
  const zona = m.svg.parentElement;
  zona.innerHTML = `
    <div class="pp">
      <canvas class="pp-canvas"></canvas>
      <button class="pp-fletxa esq" aria-label="Esquerra">⬅️</button>
      <button class="pp-fletxa dre" aria-label="Dreta">➡️</button>
      <button class="pp-centra" hidden>⚽ Centra!</button>
    </div>`;
  const canvas = zona.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const botoCentra = zona.querySelector('.pp-centra');
  const CARRILS = [1.6, 4.6, 7.6]; // metres des de la línia de banda (0 = banda)
  const ajuda = m.nivell === 0;
  let carril = 1, x = CARRILS[1], camX = x; // comença una mica per dins
  let recorregut = 0; // metres correguts
  const velocitat = 7 * m.vel; // m/s
  const onades = 3 + Math.min(3, Math.floor(m.vel * 1.5));
  const rivals = [];
  // Cada onada: 1 o 2 contraris de cara; gairebé sempre deixen lliure la banda.
  for (let n = 0; n < onades; n++) {
    const z = 30 + n * 26;
    // Normalment et vénen de cara pel mig i l'espai és la banda; a vegades la banda està tapada i l'espai és per dins.
    const bandaLliure = n === 0 || Math.random() < 0.85;
    const ocupats = bandaLliure ? (Math.random() < 0.5 ? [1] : [1, 2]) : [0, 1];
    ocupats.forEach(c => rivals.push({ z, x: CARRILS[c] + (Math.random() - 0.5) * 0.6, c, fase: Math.random() * 6 }));
  }
  const final = 30 + onades * 26;
  let fase = 'corre', avisat = new Set(), t = 0;
  const nou = { x: 26.5, z: 15 }; // el davanter a l'àrea
  // Públic de la grada (punts fixos).
  const public_ = Array.from({ length: 160 }, () => ({ u: Math.random(), v: Math.random(), c: aleatori(['#FF7A6B', '#FFBE3D', '#2EC4A6', '#8C7BFF', '#4AA8FF', '#FFFFFF', '#F06FB0']) }));

  const mida = () => {
    const r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
    return { W: canvas.width, H: canvas.height };
  };

  function dibuixa() {
    const { W, H } = mida();
    const hor = H * 0.36, f = Math.min(W, H * 1.4) * 0.9, alt = 1.5;
    const P = (px, z) => ({ x: W / 2 + (px - camX) * f / z, y: hor + alt * f / z });
    // Cel i grada
    const cel = ctx.createLinearGradient(0, 0, 0, hor);
    cel.addColorStop(0, '#8FCBFF'); cel.addColorStop(1, '#DDF0FF');
    ctx.fillStyle = cel; ctx.fillRect(0, 0, W, hor);
    ctx.fillStyle = '#5B6785'; ctx.fillRect(0, hor - H * 0.13, W, H * 0.13);
    for (const p of public_) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.u * W, hor - H * 0.12 + p.v * H * 0.1, Math.max(2, H * 0.006), 0, 7); ctx.fill(); }
    // Gespa amb franges que s'acosten mentre corre
    ctx.fillStyle = '#46A262'; ctx.fillRect(0, hor, W, H - hor);
    const pas = 5, despl = recorregut % (pas * 2);
    for (let z = pas * 2 - despl; z < 120; z += pas * 2) {
      const a = Math.max(0.6, z), b = z + pas;
      const ya = hor + alt * f / a, yb = hor + alt * f / b;
      ctx.fillStyle = '#4FB06C'; ctx.fillRect(0, yb, W, ya - yb);
    }
    // Fora del camp (a l'esquerra de la línia): pista i tanca
    const quad = (pts, color) => { ctx.fillStyle = color; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill(); };
    const n1 = P(0, 0.6), n2 = P(0, 150), e1 = P(-30, 0.6), e2 = P(-30, 150);
    quad([n1, n2, e2, e1], '#C9B38A');
    // Tanca baixa (sense anuncis) una mica més enllà de la línia.
    const a = P(-7, 6), b = P(-7, 150), ha = 0.8 * f / 6, hb = 0.8 * f / 150;
    quad([a, b, { x: b.x, y: b.y - hb }, { x: a.x, y: a.y - ha }], '#3B6FD8');
    // Línia de banda
    const l1 = P(-0.06, 0.6), l2 = P(-0.06, 150), l3 = P(0.06, 150), l4 = P(0.06, 0.6);
    quad([l1, l2, l3, l4], '#FFFFFF');
    // Ajuda: carril lliure il·luminat
    if (ajuda && fase === 'corre') {
      const prop = rivals.filter(r => r.z - recorregut > 3 && r.z - recorregut < 28);
      if (prop.length) {
        const lliure = [0, 1, 2].find(c => !prop.some(r => r.c === c));
        if (lliure !== undefined && lliure !== carril) {
          const zA = Math.max(1, prop[0].z - recorregut - 6), zB = prop[0].z - recorregut + 3;
          const cx = CARRILS[lliure];
          quad([P(cx - 1.3, zA), P(cx - 1.3, zB), P(cx + 1.3, zB), P(cx + 1.3, zA)], 'rgba(255, 226, 154, 0.55)');
        }
      }
    }
    // Àrea i porteria al final
    const zArea = final - recorregut;
    if (zArea < 120) {
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = Math.max(2, W * 0.003);
      const linia = (ax, az, bx, bz) => { if (az < 0.7 || bz < 0.7) return; const a = P(ax, az), b = P(bx, bz); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
      linia(13, zArea, 40, zArea); linia(13, zArea, 13, zArea + 16); linia(40, zArea, 40, zArea + 16);
      linia(0, zArea + 16, 60, zArea + 16);
      if (zArea + 16 > 1) {
        const pa = P(23, zArea + 16), pb = P(30.3, zArea + 16), h = 2.44 * f / (zArea + 16);
        ctx.lineWidth = Math.max(3, W * 0.006);
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pa.x, pa.y - h); ctx.lineTo(pb.x, pb.y - h); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      }
    }
    // Jugadors (els de lluny primer)
    const figures = rivals.map(r => ({ ...r, zr: r.z - recorregut, color: '#E5484D' })).filter(r => r.zr > 0.8);
    if (fase !== 'corre') figures.push({ x: nou.x, zr: nou.z, color: '#2F6FED', fase: t * 3, num: 9 });
    figures.sort((a, b) => b.zr - a.zr).forEach(r => jugador(P, f, r));
    if (fase === 'centra') {
      const c = P(26.5, nou.z), rx = 2.2 * f / nou.z, ry = rx * 0.25;
      ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = Math.max(3, W * 0.005); ctx.setLineDash([12, 8]);
      ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    // La meva pilota, a baix
    if (fase === 'xut' || fase === 'fi') return;
    const bota = Math.abs(Math.sin(t * 9)) * H * 0.012;
    const rp = Math.min(W, H) * 0.05;
    const pb = { x: W / 2 + (x - camX) * W * 0.08, y: H - rp * 2.2 };
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(pb.x, pb.y + rp * 0.9, rp, rp * 0.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2B2D42'; ctx.lineWidth = rp * 0.08;
    ctx.beginPath(); ctx.arc(pb.x, pb.y - bota, rp, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2B2D42'; ctx.beginPath();
    for (let i = 0; i < 5; i++) { const a = t * 6 + i * 1.2566; const px = pb.x + Math.cos(a) * rp * 0.35, py = pb.y - bota + Math.sin(a) * rp * 0.35; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.fill();
  }

  // Un jugador dibuixat en perspectiva (alçada 1,8 m).
  function jugador(P, f, r) {
    const peu = P(r.x, r.zr), s = f / r.zr, h = 1.8 * s;
    const cama = Math.sin((r.fase || 0) + t * 10) * h * 0.06;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(peu.x, peu.y, h * 0.2, h * 0.05, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2B2D42'; ctx.lineCap = 'round'; ctx.lineWidth = h * 0.07;
    ctx.beginPath(); ctx.moveTo(peu.x - h * 0.06, peu.y - h * 0.45); ctx.lineTo(peu.x - h * 0.07 + cama, peu.y);
    ctx.moveTo(peu.x + h * 0.06, peu.y - h * 0.45); ctx.lineTo(peu.x + h * 0.07 - cama, peu.y); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(peu.x - h * 0.13, peu.y - h * 0.52, h * 0.26, h * 0.12);
    ctx.fillStyle = r.color;
    ctx.beginPath(); ctx.roundRect(peu.x - h * 0.15, peu.y - h * 0.82, h * 0.3, h * 0.33, h * 0.06); ctx.fill();
    ctx.strokeStyle = '#F2C7A5'; ctx.lineWidth = h * 0.055;
    ctx.beginPath(); ctx.moveTo(peu.x - h * 0.15, peu.y - h * 0.78); ctx.lineTo(peu.x - h * 0.24 - cama * 0.5, peu.y - h * 0.58);
    ctx.moveTo(peu.x + h * 0.15, peu.y - h * 0.78); ctx.lineTo(peu.x + h * 0.24 + cama * 0.5, peu.y - h * 0.58); ctx.stroke();
    ctx.fillStyle = '#F2C7A5'; ctx.beginPath(); ctx.arc(peu.x, peu.y - h * 0.9, h * 0.09, 0, 7); ctx.fill();
    ctx.fillStyle = '#5A3A22'; ctx.beginPath(); ctx.arc(peu.x, peu.y - h * 0.93, h * 0.09, Math.PI, 0); ctx.fill();
    if (r.num) { ctx.fillStyle = '#fff'; ctx.font = `800 ${h * 0.15}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(r.num, peu.x, peu.y - h * 0.66); }
  }

  const canvia = d => {
    if (fase !== 'corre' || !m.viu()) return;
    if (carril + d < 0) { fase = 'fi'; return m.fallo('Fora de banda! Corre per dins de la línia.'); }
    if (carril + d > 2) return;
    carril += d;
  };
  zona.querySelector('.esq').addEventListener('pointerdown', e => { e.stopPropagation(); canvia(-1); });
  zona.querySelector('.dre').addEventListener('pointerdown', e => { e.stopPropagation(); canvia(1); });
  canvas.addEventListener('pointerdown', e => {
    if (fase === 'centra') return centra();
    const r = canvas.getBoundingClientRect();
    canvia(e.clientX - r.left < r.width / 2 ? -1 : 1);
  });
  botoCentra.addEventListener('pointerdown', e => { e.stopPropagation(); centra(); });

  async function centra() {
    if (fase !== 'centra' || !m.viu()) return;
    fase = 'xut';
    botoCentra.hidden = true;
    const bo = Math.abs(nou.x - 26.5) < 2.2;
    if (!bo) return m.fallo("Ara no! Espera que el nou sigui al cercle.");
    m.encert('Gol! Quina centrada!');
  }

  let abans = performance.now();
  function roda(ara) {
    if (!m.viu()) return;
    const dt = Math.min(0.05, (ara - abans) / 1000);
    abans = ara;
    t += dt;
    x += (CARRILS[carril] - x) * Math.min(1, dt * 10);
    // A l'hora de centrar, mira cap a l'àrea.
    const mira = fase === 'corre' ? x : 22;
    camX += (mira - camX) * Math.min(1, dt * (fase === 'corre' ? 6 : 2.5));
    if (fase === 'corre') {
      recorregut += velocitat * dt;
      for (const r of rivals) {
        r.z -= 1.5 * dt; // també vénen cap a tu
        const zr = r.z - recorregut;
        if (zr < 1.6 && zr > 0.4 && Math.abs(r.x - x) < 1.3) { fase = 'fi'; dibuixa(); return m.fallo("T'ha pres la pilota! Busca l'espai lliure."); }
        if (ajuda && zr < 22 && zr > 10 && !avisat.has(r) && Math.abs(r.x - x) < 1.3) {
          avisat.add(r);
          const lliure = [0, 1, 2].find(c => !rivals.some(o => Math.abs(o.z - r.z) < 4 && o.c === c));
          Veu.diu(lliure === 0 ? 'Espai per la banda!' : 'Busca l\'espai!');
        }
      }
      if (recorregut > final - 14) {
        fase = 'centra';
        botoCentra.hidden = false;
        zona.querySelectorAll('.pp-fletxa').forEach(b => { b.hidden = true; });
        Veu.diu('Centra! Toca quan el nou sigui al cercle.');
      }
    }
    if (fase === 'centra') nou.x = 26.5 + Math.sin(t * 2 * m.vel) * 5;
    dibuixa();
    requestAnimationFrame(roda);
  }
  repetir = () => Veu.diu(fase === 'centra' ? 'Centra! Toca quan el nou sigui al cercle.' : "Corre per la banda! Si et ve un contrari de cara, busca l'espai amb les fletxes.");
  Veu.diu("Corre per la banda! Busca l'espai.");
  requestAnimationFrame(roda);
}

/* 3. Et pressionen: passar-la ràpid a un company lliure. */
function miniPressio(m) {
  const { fesJugador, pilota, posa, mou, aMon, dist, svg } = m;
  const jo = fesJugador('.blaus', 'jo', 110, 70, 3);
  const companys = [fesJugador('.blaus', 'company', 150, 320, 4), fesJugador('.blaus', 'company', 360, 300, 6), fesJugador('.blaus', 'company', 430, 70, 11)];
  const marcats = barreja(companys).slice(0, 1 + Math.floor(Math.random() * 2));
  const marcadors = marcats.map(c => ({ c, r: fesJugador('.vermells', '', c.x + 40, c.y - 30, '') }));
  const pressor = fesJugador('.vermells', '', 380, 170, 9);
  Object.assign(pilota, { x: jo.x + 28, y: jo.y + 14 }); posa(pilota);
  repetir = () => Veu.diu('Et pressionen! Passa-la ràpid a un company que estigui sol.');
  let fet = false;
  svg.addEventListener('pointerdown', async e => {
    if (!m.viu() || fet) return;
    const p = aMon(e);
    const c = companys.find(c => dist(c, p) < 65);
    if (!c) return;
    fet = true;
    const marcador = marcadors.find(x => x.c === c);
    if (marcador) {
      await mou(pilota, marcador.r.x, marcador.r.y, 420);
      return m.fallo("Estava marcat! Busca el que està sol.");
    }
    await mou(pilota, c.x, c.y, 420);
    m.encert('Molt bé! Passada ràpida.');
  });
  Veu.diu('Et pressionen! Passa-la ràpid!');
  (async () => {
    await espera(500);
    if (!m.viu()) return;
    await mou(pressor, jo.x + 45, jo.y + 20, 2700 / m.vel);
    if (m.viu() && !fet) { fet = true; m.fallo("T'ha pres la pilota! Passa-la més ràpid."); }
  })();
}

/* 4. Pressiona: treure la pilota a l'extrem tancant-lo per dins. */
function miniPressiona(m) {
  const { fesJugador, pilota, posa, dist, capaZones } = m;
  const rival = fesJugador('.vermells', '', 760, 70, 7);
  const jo = fesJugador('.blaus', 'jo', 300, 280, 3);
  fesJugador('.blaus', '', 140, 330, 4);
  const ajuda = m.nivell === 0;
  if (ajuda) capaZones.innerHTML = '<circle class="opcio-zona" r="48"/>';
  const cercleAjuda = capaZones.querySelector('circle');
  const enganxa = () => { pilota.x = rival.x - 28; pilota.y = rival.y + 12; posa(pilota); };
  enganxa();
  repetir = () => Veu.diu("Pressiona! Treu-li la pilota, però tanca'l per dins: posa't entre ell i el mig del camp.");
  let robat = false;
  arrossegable(m, jo, () => {});
  if (ajuda) m.assenyala(jo);
  let abans = performance.now(), t = 0;
  const roda = async ara => {
    if (!m.viu() || robat) return;
    const dt = (ara - abans) / 1000;
    abans = ara;
    t += dt;
    rival.x -= 95 * m.vel * dt;
    rival.y = 75 + Math.sin(t * 2) * 25;
    posa(rival); enganxa();
    if (ajuda) { cercleAjuda.setAttribute('cx', rival.x - 40); cercleAjuda.setAttribute('cy', rival.y + 80); }
    if (dist(jo, rival) < 62) {
      robat = true;
      if (jo.y > rival.y + 15) {
        pilota.x = jo.x + 20; pilota.y = jo.y; posa(pilota);
        return m.encert("Robada! L'has tancat per dins.");
      }
      await Promise.all([m.mou(rival, rival.x - 140, rival.y + 210, 600), m.mou(pilota, rival.x - 170, rival.y + 220, 600)]);
      return m.fallo("Per fora no! Tanca-li el camí de dins.");
    }
    if (rival.x < 170) { robat = true; return m.fallo("S'ha escapat! Surt a pressionar abans."); }
    requestAnimationFrame(roda);
  };
  Veu.diu('Pressiona! Tanca-li el camí de dins.');
  setTimeout(() => requestAnimationFrame(ara => { abans = ara; roda(ara); }), 700);
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
    lateral: 2,
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
