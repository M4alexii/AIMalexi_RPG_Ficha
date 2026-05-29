/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/core/store.js
   Store reativo por SLICE — o runtime local soberano (a UI lê daqui).

   Granularidade no nível de SLICE, não de microcampo:
     character  — investigador ativo (atributos, derivados, perícias…)
     rollMods   — modificadores de rolagem (difficulty, bp)
     rollLog    — histórico de rolagens
     ui         — estado de UI que sobrevive a reload (mobileTab, editMode…)

   Anti store-inflation: efêmeros de componente (hover, modal aberto) NÃO
   entram aqui — ficam no estado local da view.

   Reatividade vs. referência estável:
   o investigator.js legado guarda e muta seu próprio `state.character` IN-PLACE.
   Para conviver com isso sem quebrar identidade de referência, cada slice é
   guardado num ENVELOPE { data, rev }. Reducers mutam `data` (mantendo a
   referência viva) e bump() incrementa `rev` — o que é uma nova referência de
   topo e dispara o signal/shim, enquanto `data` continua o mesmo objeto.

   Cada slice é um Preact Signal quando disponível; senão, um shim com a mesma
   superfície (.value + .subscribe). Shims são promovidos a signals reais quando
   o vendor carrega async, preservando valor e assinantes.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {

  function makeShim(initialEnvelope) {
    let value = initialEnvelope;
    const subs = new Set();
    return {
      __shim: true,
      get value() { return value; },
      set value(v) {
        if (Object.is(v, value)) return;
        value = v;
        for (const cb of Array.from(subs)) { try { cb(value); } catch (e) {} }
      },
      peek() { return value; },
      subscribe(cb) {
        if (typeof cb !== "function") return function () {};
        subs.add(cb);
        try { cb(value); } catch (e) {}
        return function () { subs.delete(cb); };
      },
      __drain() { return { value: value, subs: subs }; }
    };
  }

  const SLICE_NAMES = ["character", "rollMods", "rollLog", "ui"];

  const initialData = {
    character: null,
    rollMods: { difficulty: "regular", bp: "" },
    rollLog: [],
    ui: { mobileTab: "personagem", editMode: false, skillFilter: "all", skillSearch: "" }
  };

  function envelope(data, rev) { return { data: data, rev: rev || 0 }; }

  const slices = {};
  function buildSlices(S) {
    for (const name of SLICE_NAMES) {
      const env = envelope(initialData[name], 0);
      slices[name] = (S && typeof S.signal === "function") ? S.signal(env) : makeShim(env);
    }
  }
  buildSlices(window.CoC.signals);

  if (window.CoC.signalsBridge && typeof window.CoC.signalsBridge.onReady === "function") {
    window.CoC.signalsBridge.onReady(function (S) {
      if (!S || typeof S.signal !== "function") return;
      for (const name of SLICE_NAMES) {
        const old = slices[name];
        if (old && old.__shim) {
          const drained = old.__drain();
          const sig = S.signal(drained.value);
          for (const cb of drained.subs) { try { sig.subscribe(cb); } catch (e) {} }
          slices[name] = sig;
        }
      }
    });
  }

  function getSlice(name) { return slices[name]; }

  // Lê o DADO do slice (desembrulhado do envelope).
  function get(name) {
    const s = slices[name];
    return s ? s.value.data : undefined;
  }

  // Troca o dado do slice por um novo (nova referência) e dispara reatividade.
  function setSlice(name, data) {
    const s = slices[name];
    if (!s) return;
    s.value = envelope(data, s.value.rev + 1);
  }

  // Reemite o slice SEM trocar a referência do dado (usado após mutação in-place
  // feita por reducers que precisam preservar a identidade de state.character).
  function bump(name) {
    const s = slices[name];
    if (!s) return;
    s.value = envelope(s.value.data, s.value.rev + 1);
  }

  function getState() {
    const out = {};
    for (const name of SLICE_NAMES) out[name] = slices[name] ? slices[name].value.data : undefined;
    return out;
  }

  // Assina o DADO do slice. cb recebe o dado desembrulhado a cada emissão.
  function subscribe(name, cb) {
    const s = slices[name];
    if (!s || typeof s.subscribe !== "function" || typeof cb !== "function") return function () {};
    return s.subscribe(function (env) { cb(env ? env.data : undefined); });
  }

  window.CoC.store = {
    SLICE_NAMES: SLICE_NAMES.slice(),
    getSlice,
    get,
    getState,
    setSlice,
    bump,
    subscribe
  };

})();
