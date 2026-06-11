/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/shared/ambient-fx.js
   Som ambiente VISUAL (spec item 12/13 de Personalização) — sem áudio.

   Efeitos atmosféricos sutis em overlay: chuva, névoa, poeira, VHS e filme
   antigo. Irmão do sanity-fx e subordinado a ele: #ambient-fx fica ABAIXO de
   #sanity-fx (a insanidade prevalece visualmente). Desligado por padrão.

   - Toda a aparência mora em css/theme.css via body[data-ambient="..."].
   - Acessibilidade: animações são congeladas por body.reduce-motion e
     prefers-reduced-motion (regras no CSS).
   - Preferência global persistida por js/settings.js (chave "ambient"),
     que chama window.CoC.ambientFx.set() no apply().

   API: window.CoC.ambientFx = { set, get, EFFECTS }
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {
  'use strict';

  var EFFECTS = ['none', 'rain', 'mist', 'dust', 'vhs', 'film'];
  var _current = 'none';

  function _inject() {
    if (document.getElementById('ambient-fx')) return;
    if (!document.body) return;
    var fx = document.createElement('div');
    fx.id = 'ambient-fx';
    fx.setAttribute('aria-hidden', 'true');
    // Três camadas genéricas; cada efeito usa as que precisar via CSS.
    ['amb-a', 'amb-b', 'amb-c'].forEach(function (cls) {
      var layer = document.createElement('div');
      layer.className = cls;
      fx.appendChild(layer);
    });
    document.body.appendChild(fx);
  }

  function set(effect) {
    if (EFFECTS.indexOf(effect) < 0) effect = 'none';
    _current = effect;
    _inject();
    if (document.body) document.body.dataset.ambient = effect;
  }

  function get() { return _current; }

  function init() {
    _inject();
    // Reconcilia com a preferência salva (settings.apply pode ter rodado antes
    // deste módulo carregar — nesse caso só setou body[data-ambient]).
    var pref = (document.body && document.body.dataset.ambient) || 'none';
    var s = window.CoC.settings;
    if (s && s.get) pref = s.get('ambient') || pref;
    set(pref);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.CoC.ambientFx = { set: set, get: get, EFFECTS: EFFECTS };

})();
