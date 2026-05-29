/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/core/dispatch.js
   Dispatcher + cadeia de middleware — FIXA e pequena (anti middleware-inflation).

   Cadeia (única, na ordem): trace → validate → reduce → persist → sync → log → notify
     trace    — console.groupCollapsed em dev
     validate — checagem de payload básica (NÃO bloqueia; loga e segue)
     reduce   — reducers PUROS-de-domínio por action.type (único ponto de mutação)
     persist  — grava o character via window.CoC.storage para actions de domínio
     sync     — no-op (entra no M5)
     log      — emite no event bus os eventos de domínio (hp:changed, ...)
     notify   — bump() do slice tocado para disparar a reatividade

   Reducers do M1: só os vitais que já tinham lógica em applyDerivedDelta.
   Mutam IN-PLACE o character do store (a mesma referência que o investigator.js
   legado segura), preservando identidade. O notify faz o bump().

   Atribui a window.CoC.dispatch (função) com .reducers/.chain para inspeção.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {

  const TYPES = window.CoC.actions ? window.CoC.actions.TYPES : {};
  const store = window.CoC.store;
  const bus = window.CoC.bus;

  const PV_MIN = -2;
  const DEV = (function () {
    try { return /localhost|127\.0\.0\.1|^file:|[?&]dev/.test(location.href); } catch (e) { return false; }
  })();

  function num(v) { return Number(v) || 0; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ─── Reducers ──────────────────────────────────────────────────────────
  // Cada reducer muta o character IN-PLACE e retorna um descritor de efeito
  // { slice, events:[{name, payload}] } consumido por persist/log/notify.
  // Retorna null quando não há mudança aplicável (sem character / sem derived).

  function ensureDerived(c, key) {
    return (c && c.derived && c.derived[key]) ? c.derived[key] : null;
  }

  const reducers = {
    [TYPES.APPLY_DAMAGE]: function (c, p) {
      const d = ensureDerived(c, "PV"); if (!d) return null;
      const before = num(d.current ?? d.value);
      const after = clamp(before - Math.abs(num(p.amount)), PV_MIN, num(d.value));
      d.current = after;
      return { slice: "character", events: [{ name: "hp:changed", payload: { before, after, delta: after - before } }] };
    },
    [TYPES.HEAL_DAMAGE]: function (c, p) {
      const d = ensureDerived(c, "PV"); if (!d) return null;
      const before = num(d.current ?? d.value);
      const after = clamp(before + Math.abs(num(p.amount)), PV_MIN, num(d.value));
      d.current = after;
      return { slice: "character", events: [{ name: "hp:changed", payload: { before, after, delta: after - before } }] };
    },
    [TYPES.SPEND_MAGIC]: function (c, p) {
      const d = ensureDerived(c, "PM"); if (!d) return null;
      const before = num(d.current ?? d.value);
      const after = clamp(before - Math.abs(num(p.amount)), 0, num(d.value));
      d.current = after;
      return { slice: "character", events: [{ name: "mp:changed", payload: { before, after, delta: after - before } }] };
    },
    [TYPES.RESTORE_MAGIC]: function (c, p) {
      const d = ensureDerived(c, "PM"); if (!d) return null;
      const before = num(d.current ?? d.value);
      const after = clamp(before + Math.abs(num(p.amount)), 0, num(d.value));
      d.current = after;
      return { slice: "character", events: [{ name: "mp:changed", payload: { before, after, delta: after - before } }] };
    },
    [TYPES.LOSE_SANITY]: function (c, p) {
      const d = ensureDerived(c, "SAN"); if (!d) return null;
      const before = num(d.current ?? d.value);
      const lost = Math.abs(num(p.amount));
      const after = clamp(before - lost, 0, num(d.max));
      d.current = after;
      const events = [{ name: "san:changed", payload: { before, after, delta: after - before, reason: p.reason || null } }];
      // CoC 7e: perda > 4 num único choque dispara teste de loucura temporária.
      if (lost > 4) {
        c.status = c.status || {};
        c.status.sanLossesToday = (c.status.sanLossesToday || 0) + lost;
        events.push({ name: "status:changed", payload: { status: "temporaryInsanityCheck", added: true, loss: lost } });
      }
      return { slice: "character", events: events };
    },
    [TYPES.RECOVER_SANITY]: function (c, p) {
      const d = ensureDerived(c, "SAN"); if (!d) return null;
      const before = num(d.current ?? d.value);
      const after = clamp(before + Math.abs(num(p.amount)), 0, num(d.max));
      d.current = after;
      return { slice: "character", events: [{ name: "san:changed", payload: { before, after, delta: after - before, reason: p.reason || null } }] };
    },
    [TYPES.SPEND_LUCK]: function (c, p) {
      if (!c || !c.attributes || !c.attributes.Sorte) return null;
      const before = num(c.attributes.Sorte.value);
      const after = Math.max(0, before - Math.abs(num(p.amount)));
      c.attributes.Sorte.value = after;
      return { slice: "character", events: [{ name: "luck:changed", payload: { before, after, delta: after - before, rollId: p.rollId || null } }] };
    }
  };

  const DOMAIN_TYPES = new Set(Object.keys(reducers));

  // ─── Middlewares (cadeia fixa) ───────────────────────────────────────────
  // ctx: { action, effect, dev }. Cada mw chama next() para prosseguir.

  function mwTrace(ctx, next) {
    if (DEV) {
      try {
        console.groupCollapsed("%cdispatch %c" + ctx.action.type, "color:#888", "color:#c9a227;font-weight:bold");
        console.log("payload", ctx.action.payload);
      } catch (e) {}
    }
    try { next(); }
    finally { if (DEV) { try { console.groupEnd(); } catch (e) {} } }
  }

  function mwValidate(ctx, next) {
    const a = ctx.action;
    if (!a || typeof a.type !== "string") { console.warn("[dispatch] action sem type", a); return; }
    if (a.payload != null && typeof a.payload !== "object") {
      console.warn("[dispatch] payload inválido (não-objeto) em " + a.type, a.payload);
      a.payload = {};   // normaliza e segue (validate não bloqueia)
    }
    next();
  }

  function mwReduce(ctx, next) {
    const r = reducers[ctx.action.type];
    if (typeof r !== "function") { next(); return; }   // type sem reducer no M1: passa adiante (futuro)
    const c = store.get("character");
    if (!c) { if (DEV) console.warn("[dispatch] sem character ativo; " + ctx.action.type + " ignorado"); return; }
    ctx.effect = r(c, ctx.action.payload || {});
    next();
  }

  function mwPersist(ctx, next) {
    if (ctx.effect && DOMAIN_TYPES.has(ctx.action.type) && window.CoC.storage) {
      try {
        const c = store.get("character");
        const id = window.CoC.storage.saveCharacter(c);
        if (c && id) c.id = id;
      } catch (e) { console.error("[dispatch] persist falhou", e); }
    }
    next();
  }

  function mwSync(ctx, next) { next(); }   // no-op até o M5

  function mwLog(ctx, next) {
    if (ctx.effect && ctx.effect.events && bus) {
      for (const ev of ctx.effect.events) bus.emit(ev.name, ev.payload);
      bus.emit("action", { type: ctx.action.type, payload: ctx.action.payload, ts: ctx.action.ts });
    }
    next();
  }

  function mwNotify(ctx, next) {
    if (ctx.effect && ctx.effect.slice) store.bump(ctx.effect.slice);
    next();
  }

  const chain = [mwTrace, mwValidate, mwReduce, mwPersist, mwSync, mwLog, mwNotify];

  function dispatch(action) {
    if (!action || typeof action.type !== "string") { console.warn("[dispatch] action inválida", action); return action; }
    const ctx = { action: action, effect: null, dev: DEV };
    let i = 0;
    function next() {
      const mw = chain[i++];
      if (mw) mw(ctx, next);
    }
    next();
    return action;
  }

  dispatch.reducers = reducers;
  dispatch.chain = chain;

  window.CoC.dispatch = dispatch;

})();
