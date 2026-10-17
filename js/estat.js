/* Progrés i ajustos. Es guarda només a la tablet (localStorage). */
const Estat = (() => {
  const CLAU = 'anem-a-cole-v1';

  function perDefecte() {
    return {
      v2: true,
      estrelles: 0,
      adhesius: 0,
      nivells: { lletres: 0, sillabes: 0, paraules: 0, numeros: 0, compta: 0, uneix: 0, globus: 0, parelles: 0, laberint: 0, futbol: 0, lateral: 0 },
      seguits: { lletres: 0, sillabes: 0, paraules: 0, numeros: 0, compta: 0, uneix: 0, globus: 0, parelles: 0, laberint: 0, futbol: 0, lateral: 0 },
      vistes: [], // lletres que ja s'han presentat
      demos: {}, // quantes demostracions de futbol s'han vist
      ajustos: {
        lletres: [...LLETRES_INICIALS],
        tipus: TIPUS_LLETRA_INICIAL,
        velocitat: 1,
        veu: null,
        nom: '', // nom del nen: només es guarda a la tablet
      },
    };
  }

  function carrega() {
    const base = perDefecte();
    try {
      const guardat = JSON.parse(localStorage.getItem(CLAU));
      if (guardat) {
        // Versió 2: la veu va més ràpida.
        if (!guardat.v2) { guardat.v2 = true; if (guardat.ajustos) guardat.ajustos.velocitat = 1; }
        return {
          ...base, ...guardat,
          nivells: { ...base.nivells, ...guardat.nivells },
          seguits: { ...base.seguits, ...guardat.seguits },
          ajustos: { ...base.ajustos, ...guardat.ajustos },
        };
      }
    } catch (e) {}
    return base;
  }

  const estat = { dades: carrega() };

  estat.desa = () => {
    try { localStorage.setItem(CLAU, JSON.stringify(estat.dades)); } catch (e) {}
  };

  estat.reinicia = () => {
    const ajustos = estat.dades.ajustos;
    estat.dades = perDefecte();
    estat.dades.ajustos = ajustos;
    estat.desa();
  };

  // Demana a la tablet que no esborri les dades.
  navigator.storage?.persist?.().catch(() => {});

  return estat;
})();
