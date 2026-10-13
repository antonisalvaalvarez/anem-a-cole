/* Progrés i ajustos. Es guarda només a la tablet (localStorage). */
const Estat = (() => {
  const CLAU = 'anem-a-cole-v1';

  function perDefecte() {
    return {
      estrelles: 0,
      adhesius: 0,
      nivells: { lletres: 0, sillabes: 0, paraules: 0 },
      seguits: { lletres: 0, sillabes: 0, paraules: 0 },
      vistes: [], // lletres que ja s'han presentat
      ajustos: {
        lletres: [...LLETRES_INICIALS],
        tipus: TIPUS_LLETRA_INICIAL,
        velocitat: 0.85,
        veu: null,
      },
    };
  }

  function carrega() {
    const base = perDefecte();
    try {
      const guardat = JSON.parse(localStorage.getItem(CLAU));
      if (guardat) {
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
