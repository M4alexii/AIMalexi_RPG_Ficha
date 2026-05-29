/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/core/bus.js
   Event Bus — pub/sub transversal, DESACOPLADO da Store.

   Eventos de domínio (hp:changed, mp:changed, san:changed, status:changed)
   alimentam dashboard, sanity-fx, háptico e session_log sem que esses
   consumidores conheçam a store ou o dispatch. Um handler que lança nunca
   derruba os demais nem o emissor.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {

  const listeners = new Map();   // event → Set<fn>

  function on(event, fn) {
    if (!event || typeof fn !== "function") return function () {};
    let set = listeners.get(event);
    if (!set) { set = new Set(); listeners.set(event, set); }
    set.add(fn);
    return function off() { set.delete(fn); };
  }

  function once(event, fn) {
    const off = on(event, function (payload) { off(); fn(payload); });
    return off;
  }

  function off(event, fn) {
    const set = listeners.get(event);
    if (set) set.delete(fn);
  }

  function emit(event, payload) {
    const set = listeners.get(event);
    if (!set || set.size === 0) return;
    // Itera sobre cópia: um handler pode (des)inscrever durante a emissão.
    for (const fn of Array.from(set)) {
      try { fn(payload); } catch (e) { console.error("[bus] handler de '" + event + "' falhou", e); }
    }
  }

  window.CoC.bus = { on, once, off, emit };

})();
