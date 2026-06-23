/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/core/persist-middleware.js
   Middleware de persistência automática baseado em ações do store.

   Elimina chamadas manuais a persistCurrent() espalhadas pelo orquestrador.
   Usa JSON.stringify diff para evitar saves redundantes quando a ação
   altera referência mas não conteúdo semântico.

   Uso:
     const pm = window.CoC.createPersistMiddleware({ bus, getState, saveCharacter });
     pm.init();
     // chame pm.updateBaseline() após saves manuais fora do fluxo normal
     // chame pm.dispose() ao desmontar (ex: hot-reload em dev)
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};
window.CoC.core = window.CoC.core || {};

(function () {

  // FONTE ÚNICA DE VERDADE: o conjunto de ações que auto-persistem é DERIVADO de
  // js/core/event-ontology.js (campo `persists`), exatamente como RENDER_MAP e
  // BOUNDARY_FIELDS já são. Manter a lista à mão aqui causava drift silencioso —
  // ações persists:true/live (ex.: SET_BODY_SLOT, SET_ARMOR, RELOAD_WEAPON,
  // MARK_SKILL_IMPROVEMENT, TOGGLE_SKILL_FAVORITE, SKILL_IMPROVED, ADD_MYTHOS,
  // SET_ATTRIBUTE) ficavam de fora e suas edições sumiam no reload (bug C-01).
  //
  // O conjunto abaixo é apenas FALLBACK defensivo (usado só se a ontologia ainda
  // não estiver carregada). SET_CHARACTER_ID fica de fora porque persists:false na
  // ontologia (atualiza só o id; incluí-lo causaria loop persist → SET_CHARACTER_ID → persist).
  const FALLBACK_PERSIST_ACTIONS = new Set([
    'SET_CHARACTER',
    'APPLY_DAMAGE',   'HEAL_DAMAGE',
    'LOSE_SANITY',    'RECOVER_SANITY',
    'SPEND_MAGIC',    'RESTORE_MAGIC',
    'SPEND_LUCK',
    'SET_SKILL',      'TOGGLE_OCCUPATION_SKILL', 'ADD_CUSTOM_SKILL',
    'ADD_INVENTORY_ITEM',   'UPDATE_INVENTORY_ITEM',   'REMOVE_INVENTORY_ITEM',
    'ADD_JOURNAL_ENTRY',    'UPDATE_JOURNAL_ENTRY',    'REMOVE_JOURNAL_ENTRY',
    'ADD_SPELL',      'UPDATE_SPELL',    'REMOVE_SPELL',
    'ADD_TOME',       'UPDATE_TOME',     'REMOVE_TOME',
    'ADD_WEAPON',     'UPDATE_WEAPON',   'REMOVE_WEAPON',
    'ATTACK_RESOLVED',
    'RECALC_DERIVED'   // JSON diff guard evita saves redundantes quando nada mudou
  ]);

  /**
   * Deriva o conjunto de ações que devem auto-persistir a partir do CATALOG da
   * ontologia: persists === true && status === 'live'. Pura e testável.
   * @param {object} catalog - window.CoC.core.eventOntology.CATALOG
   * @returns {Set<string>}
   */
  function derivePersistActions(catalog) {
    const set = new Set();
    if (!catalog || typeof catalog !== 'object') return set;
    Object.keys(catalog).forEach(function (type) {
      const e = catalog[type];
      if (e && e.persists === true && e.status === 'live') set.add(type);
    });
    return set;
  }

  // Resolve o conjunto efetivo: ontologia (fonte única) ou fallback estático.
  function _resolvePersistActions() {
    const onto = window.CoC.core && window.CoC.core.eventOntology;
    if (onto && onto.CATALOG) {
      const derived = derivePersistActions(onto.CATALOG);
      if (derived.size > 0) return derived;
    }
    return FALLBACK_PERSIST_ACTIONS;
  }

  /**
   * @param {{ bus: object, getState: function, saveCharacter: function }} opts
   *   bus           — window.CoC.bus (pub/sub)
   *   getState      — () => { character } — retorna estado atual do store
   *   saveCharacter — (character) => void — persiste no storage
   */
  function createPersistMiddleware(opts) {
    const bus          = opts.bus;
    const getState     = opts.getState;
    const saveChar     = opts.saveCharacter;

    let _lastJSON = null;   // snapshot do último character persistido
    let _cancel   = null;   // cleanup do subscribe
    let _persistActions = null;   // conjunto efetivo, resolvido no init()

    function _tryPersist() {
      const char = getState().character;
      if (!char) return;
      const snapshot = JSON.stringify(char);
      if (snapshot === _lastJSON) return;   // sem mudança semântica — skip
      _lastJSON = snapshot;
      try {
        saveChar(char);
      } catch (e) {
        console.error('[persist-middleware]', e);
      }
    }

    function init() {
      if (_cancel) _cancel();   // idempotência: re-init limpa listener anterior
      _persistActions = _resolvePersistActions();   // derivado da ontologia (fonte única)
      _cancel = bus.subscribe('store:dispatch', function (event) {
        if (!event.changed) return;
        if (!_persistActions.has(event.action.type)) return;
        _tryPersist();
      });
    }

    // Sincroniza baseline após save manual (ex: export JSON, persistCurrent explícito)
    // para que o próximo dispatch de mudança real não seja bloqueado pelo diff stale.
    function updateBaseline() {
      const char = getState().character;
      _lastJSON = char ? JSON.stringify(char) : null;
    }

    function dispose() {
      if (_cancel) { _cancel(); _cancel = null; }
    }

    // Introspecção do conjunto efetivo (testes/diagnóstico). Funciona antes do init().
    function getPersistActions() {
      return new Set(_persistActions || _resolvePersistActions());
    }

    return Object.freeze({ init, updateBaseline, dispose, getPersistActions });
  }

  window.CoC.createPersistMiddleware = createPersistMiddleware;
  // Exposto para derivação/teste da fonte única (ontologia → PERSIST_ACTIONS).
  window.CoC.core.derivePersistActions = derivePersistActions;

})();
