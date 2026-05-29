/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/core/signals.js
   Ponte para a reatividade vendada (Preact Signals).

   O vendor é um módulo ES (export { signal, ... }) mas o app é servido com
   <script src> regular. import() dinâmico é a ponte aprovada: expressão válida
   em script clássico, sem bundler. O path é relativo ao DOCUMENTO (raiz do app),
   não ao script — daí "js/vendor/...".

   Enquanto o import resolve, window.CoC.signals fica null e os consumidores
   (store, lifecycle.bindSignal) degradam para fallback não-reativo. Quando
   resolve, window.CoC.signals é preenchido e signals.ready resolve — o store
   reage substituindo seus slices por signals reais.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {

  const VENDOR_PATH = "js/vendor/signals-core.js";

  // Quem precisa do signals real assina aqui; chamado uma vez quando o módulo
  // carrega. Permite ao store "promover" seus slices de fallback para signals.
  const onReadyCbs = [];
  let resolved = false;

  const ready = import(VENDOR_PATH)
    .then(function (m) {
      window.CoC.signals = {
        signal:      m.signal,
        computed:    m.computed,
        effect:      m.effect,
        batch:       m.batch,
        untracked:   m.untracked,
        createModel: m.createModel,
        action:      m.action,
        Computed:    m.Computed,
        Effect:      m.Effect,
        Signal:      m.Signal,
        ready:       null   // preenchido abaixo
      };
      resolved = true;
      for (const cb of onReadyCbs) { try { cb(window.CoC.signals); } catch (e) { console.error("[signals] onReady cb falhou", e); } }
      return window.CoC.signals;
    })
    .catch(function (e) {
      console.warn("[signals] Preact Signals não carregou — store em modo fallback não-reativo.", e);
      return null;
    });

  function onReady(cb) {
    if (typeof cb !== "function") return;
    if (resolved && window.CoC.signals) { try { cb(window.CoC.signals); } catch (e) {} return; }
    onReadyCbs.push(cb);
  }

  // Bootstrap mínimo síncrono: expõe ready/onReady antes do import resolver, sem
  // sobrescrever a API real depois (o then acima substitui o objeto inteiro).
  window.CoC.signals = window.CoC.signals || null;
  window.CoC.signalsBridge = { ready: ready, onReady: onReady, get loaded() { return resolved; } };

  ready.then(function (api) { if (api) api.ready = ready; });

})();
