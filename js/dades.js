/*
  DADES DE L'APP — aquest és el fitxer per canviar lletres, paraules i premis.

  - LLETRES: cada lletra amb com s'ha de dir (nom) i una paraula d'exemple.
  - LLETRES_INICIALS: les que estan activades el primer cop que s'obre l'app.
    (Després es canvien des del mode adult.)
  - PARAULES: paraula + dibuix (emoji). L'app només fa servir les paraules
    que tenen totes les lletres activades.
  - TIPUS_LLETRA_INICIAL: 'majuscula' o 'minuscula'.
*/

const TIPUS_LLETRA_INICIAL = 'majuscula';

const LLETRES_INICIALS = ['A', 'E', 'I', 'O', 'U', 'M', 'P', 'L', 'S', 'T'];

// nom: el que diu la veu. exemple: paraula que comença (o conté) la lletra.
const LLETRES = {
  A: { nom: 'a', exemple: 'avió', dibuix: '✈️', vocal: true },
  E: { nom: 'e', exemple: 'elefant', dibuix: '🐘', vocal: true },
  I: { nom: 'i', exemple: 'illa', dibuix: '🏝️', vocal: true },
  O: { nom: 'o', exemple: 'ou', dibuix: '🥚', vocal: true },
  U: { nom: 'u', exemple: 'ull', dibuix: '👁️', vocal: true },
  B: { nom: 'be', exemple: 'balena', dibuix: '🐳' },
  C: { nom: 'ce', exemple: 'casa', dibuix: '🏠' },
  D: { nom: 'de', exemple: 'dau', dibuix: '🎲' },
  F: { nom: 'efa', exemple: 'foc', dibuix: '🔥' },
  G: { nom: 'ge', exemple: 'gat', dibuix: '🐱' },
  J: { nom: 'jota', exemple: 'jaqueta', dibuix: '🧥' },
  L: { nom: 'ela', exemple: 'lluna', dibuix: '🌙' },
  M: { nom: 'ema', exemple: 'mà', dibuix: '✋' },
  N: { nom: 'ena', exemple: 'nas', dibuix: '👃' },
  P: { nom: 'pe', exemple: 'poma', dibuix: '🍎' },
  Q: { nom: 'cu', exemple: 'quadre', dibuix: '🖼️' },
  R: { nom: 'erra', exemple: 'ratolí', dibuix: '🐭' },
  S: { nom: 'essa', exemple: 'sol', dibuix: '☀️' },
  T: { nom: 'te', exemple: 'tren', dibuix: '🚂' },
  V: { nom: 've baixa', exemple: 'vaca', dibuix: '🐄' },
  X: { nom: 'ics', exemple: 'xocolata', dibuix: '🍫' },
  Z: { nom: 'zeta', exemple: 'zebra', dibuix: '🦓' },
};

// Ordenades més o menys de fàcil a difícil.
const PARAULES = [
  { p: 'pa', d: '🍞' },
  { p: 'mà', d: '✋' },
  { p: 'sol', d: '☀️' },
  { p: 'ull', d: '👁️' },
  { p: 'ou', d: '🥚' },
  { p: 'ós', d: '🐻' },
  { p: 'sal', d: '🧂' },
  { p: 'llop', d: '🐺' },
  { p: 'poma', d: '🍎' },
  { p: 'moto', d: '🏍️' },
  { p: 'mapa', d: '🗺️' },
  { p: 'sopa', d: '🍲' },
  { p: 'estel', d: '⭐' },
  { p: 'pastís', d: '🎂' },
  { p: 'patata', d: '🥔' },
  { p: 'tomata', d: '🍅' },
  { p: 'pilota', d: '⚽' },
  { p: 'maleta', d: '🧳' },
  { p: 'gat', d: '🐱' },
  { p: 'gos', d: '🐶' },
  { p: 'nas', d: '👃' },
  { p: 'dau', d: '🎲' },
  { p: 'foc', d: '🔥' },
  { p: 'casa', d: '🏠' },
  { p: 'vaca', d: '🐄' },
  { p: 'bota', d: '👢' },
  { p: 'flor', d: '🌸' },
  { p: 'lluna', d: '🌙' },
  { p: 'cotxe', d: '🚗' },
  { p: 'arbre', d: '🌳' },
  { p: 'conill', d: '🐰' },
  { p: 'cavall', d: '🐴' },
  { p: 'cargol', d: '🐌' },
  { p: 'plàtan', d: '🍌' },
  { p: 'ratolí', d: '🐭' },
  { p: 'balena', d: '🐳' },
  { p: 'zebra', d: '🦓' },
  { p: 'xocolata', d: '🍫' },
];

// Números de l'1 al 10: com els diu la veu.
const NUMEROS = {
  1: 'u', 2: 'dos', 3: 'tres', 4: 'quatre', 5: 'cinc', 6: 'sis', 7: 'set', 8: 'vuit', 9: 'nou', 10: 'deu',
  11: 'onze', 12: 'dotze', 13: 'tretze', 14: 'catorze', 15: 'quinze',
};

// Dibuixos per al joc de comptar.
const COSES_PER_COMPTAR = ['🍎', '🐞', '⭐', '🎈', '🐟', '🌸', '🚗', '🍓', '🐥', '⚽', '🦋', '🍪'];

// Joc d'unir. Per a cada nivell: quants números hi ha i quantes vegades
// es creuarien les línies si s'unissin en recta (cal fer corbes per esquivar-les).
const UNEIX_NIVELLS = [
  { punts: 10, creus: 0 },
  { punts: 10, creus: 1 },
  { punts: 10, creus: 2 },
  { punts: 12, creus: 2 },
  { punts: 12, creus: 3 },
  { punts: 15, creus: 3 },
];

// Adhesius que es guanyen (un cada ESTRELLES_PER_ADHESIU estrelles).
const ADHESIUS = ['🐶', '🐱', '🐰', '🐻', '🐼', '🦊', '🐯', '🦁', '🐸', '🐵',
  '🐧', '🦉', '🐢', '🐬', '🦋', '🐞', '🦄', '🐲', '🦒', '🐘'];
const ESTRELLES_PER_ADHESIU = 10;

// Encerts seguits per passar de nivell.
const ENCERTS_PER_NIVELL = 3;

// Frases de la veu.
const FRASES = {
  benvinguda: 'Hola! Què vols fer avui?',
  menu: {
    lletres: 'Lletres', sillabes: 'Síl·labes', paraules: 'Paraules',
    numeros: 'Números', compta: 'Compta', uneix: 'Uneix els números', premis: 'Els meus premis',
  },
  // Curtes, perquè el joc vagi ràpid.
  encert: ['Molt bé!', 'Genial!', 'Bravo!', 'Sí!', 'Fantàstic!'],
  error: ['Gairebé!', 'Torna-ho a provar!', 'Tu pots!'],
  uneix: 'Uneix els números amb el dit, sense creuar les línies.',
  creuat: "Uf, s'han creuat! Tornem-hi!",
  nivell: 'Has pujat de nivell! Ets un crack!',
  adhesiu: 'Has guanyat un adhesiu nou!',
};
