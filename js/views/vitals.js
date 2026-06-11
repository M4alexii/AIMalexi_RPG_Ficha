/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/views/vitals.js
   M3.1 — Fatia: Vitais (PV / PM / SAN / Mitos + derived bar)

   Responsabilidades:
     bind:   [data-derived] buttons → dispatch → store
     render: store.getState() → #derived-bar DOM

   Comunicação via Bus (sem acoplamento ao investigator.js):
     Publica:  "vitals:mitos-changed"  — para recalcDerived + persist
               "roll:logged"           — para append no roll-log do investigator
   Subscreve: "store:dispatch"         — para render/flash em SACRED actions

   Expõe: window.CoC.views.vitals = { init, render }

   Depende de: js/core/{signals,bus,store}.js  js/shared/ui-components.js
               js/engine/dice.js  js/shared/sanity-fx.js (opcional)
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC       = window.CoC       || {};
window.CoC.views = window.CoC.views || {};

(function () {

  const { $, $$, el, escapeHtml, toast, prompt: uiPrompt } = window.CoC.ui;
  const dice        = window.CoC.dice;
  const cocStore    = window.CoC.store;
  const cocExecutor = window.CoC.core.executor;
  const bus         = window.CoC.bus;

  // ── Render ──────────────────────────────────────────────────────────────

  function renderVitals() {
    const bar = $("#derived-bar");
    if (!bar) return;
    bar.innerHTML = "";
    const c = cocStore.getState().character;
    if (!c?.derived) return;

    const order = ["PV", "PM", "SAN", "Mitos", "MOV", "DB", "Build"];
    for (const key of order) {
      const d = c.derived[key];
      if (!d) continue;
      const isTracker = key === "PV" || key === "PM" || key === "SAN";
      const card = el("div", {
        class: "derived-card" + (isTracker ? " tracker " + key.toLowerCase() : ""),
        "data-key": key
      });

      const cur  = d.current ?? d.value;
      const max  = key === "SAN" ? d.max : d.value;
      const fill = (isTracker && max > 0) ? Math.max(0, Math.min(100, (cur / max) * 100)) : 100;
      if (isTracker) {
        card.style.setProperty("--fill", fill + "%");
        // Estado crítico (≤25%): pulso de alerta na barra (CSS .low).
        if (fill <= 25) card.classList.add("low");
      }

      let actions = "";
      if (isTracker) {
        actions = `<div class="derived-actions no-print">
          <button data-derived="${key}" data-op="-1">-1</button>
          <button data-derived="${key}" data-op="+1">+1</button>
          <button data-derived="${key}" data-op="X">-X</button>
        </div>`;
      } else if (key === "Mitos") {
        actions = `<div class="derived-actions no-print">
          <button data-derived="Mitos" data-op="-1">-1</button>
          <button data-derived="Mitos" data-op="+1">+1</button>
        </div>`;
      }

      const valueHTML = isTracker
        ? `<div class="derived-value">${cur}<span class="derived-max"> / ${max}</span></div>`
        : `<div class="derived-value">${d.value}</div>`;

      card.innerHTML = `
        <div class="derived-label">${escapeHtml(d.label || key)}</div>
        ${valueHTML}
        ${actions}
      `;
      bar.appendChild(card);
    }

    // §3.12 — Card de Armadura (absorção de dano). Lê de c.status.armor.
    const armor = Number(c.status && c.status.armor) || 0;
    const armorCard = el("div", { class: "derived-card", "data-key": "Armadura" });
    armorCard.innerHTML = `
      <div class="derived-label">Armadura</div>
      <div class="derived-value">${armor}</div>
      <div class="derived-actions no-print">
        <button data-armor-op="-1" title="Diminuir armadura">-1</button>
        <button data-armor-op="+1" title="Aumentar armadura">+1</button>
      </div>
    `;
    bar.appendChild(armorCard);

    _renderConditions(bar, c);
    _bindButtons();
    _sanityAtmosphere();
    renderSidebarVitals();
  }

  function renderSidebarVitals() {
    const bar = $("#sidebar-vitals");
    if (!bar) return;
    bar.innerHTML = "";
    const c = cocStore.getState().character;
    if (!c) return;

    // §20 — nomes completos (com abreviação como dica/aria para densidade)
    const trackers = [
      { key: "PV",  label: "Pontos de Vida"  },
      { key: "SAN", label: "Sanidade"        },
      { key: "PM",  label: "Pontos de Magia" },
    ];
    for (const { key, label } of trackers) {
      const d = c.derived?.[key];
      if (!d) continue;
      const cur  = d.current ?? d.value;
      const max  = key === "SAN" ? d.max : d.value;
      const fill = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
      const low  = fill <= 25 ? " low" : "";
      const row  = el("div", { class: `svital svital-${key.toLowerCase()}${low}`, "data-svital": key });
      row.innerHTML = `
        <div class="svital-header">
          <span class="svital-label">${label}</span>
          <span class="svital-value">${cur}<span class="svital-max"> / ${max}</span></span>
        </div>
        <div class="svital-track"><div class="svital-fill" style="width:${fill}%"></div></div>`;
      bar.appendChild(row);
    }

    const luck = c.attributes?.Sorte;
    if (luck != null) {
      const row = el("div", { class: "svital svital-luck" });
      row.innerHTML = `
        <div class="svital-header">
          <span class="svital-label">Sorte</span>
          <span class="svital-value">${Number(luck.value) || 0}</span>
        </div>`;
      bar.appendChild(row);
    }
  }

  // §9 — Condições/Status como chips toggle (usa ADD_STATUS/REMOVE_STATUS).
  // As loucuras (tempInsane/indefInsane) também são marcadas auto pela
  // state-machine; aqui o Guardião pode marcá-las/limpá-las manualmente.
  const CONDITIONS = [
    { key: "sangrando",   icon: "🩸", label: "Sangrando" },
    { key: "envenenado",  icon: "☠",  label: "Envenenado" },
    { key: "atordoado",   icon: "💫", label: "Atordoado" },
    { key: "exausto",     icon: "😵", label: "Exausto" },
    { key: "tempInsane",  icon: "🌀", label: "Loucura Temp." },
    { key: "indefInsane", icon: "🌑", label: "Loucura Indef." },
  ];

  function _renderConditions(bar, c) {
    const status = (c && c.status) || {};
    const row = el("div", { class: "conditions-row no-print" });
    row.appendChild(el("span", { class: "conditions-title" }, ["Condições:"]));
    for (const cond of CONDITIONS) {
      const on = !!status[cond.key];
      const chip = el("button", {
        class: "condition-chip" + (on ? " active" : ""),
        "data-condition": cond.key,
        title: (on ? "Remover" : "Aplicar") + " — " + cond.label,
        "aria-pressed": String(on)
      }, [cond.icon + " " + cond.label]);
      row.appendChild(chip);
    }
    bar.appendChild(row);
  }

  function _flashCard(key, sign) {
    const card = $(`#derived-bar .derived-card[data-key="${key}"]`);
    if (!card) return;
    const cls = sign < 0 ? "flash-loss" : "flash-gain";
    card.classList.remove("flash-loss", "flash-gain");
    void card.offsetWidth;   // force reflow for rapid repeat calls
    card.classList.add(cls);
    setTimeout(() => card.classList.remove(cls), 900);
  }

  function _sanityAtmosphere() {
    const fx = window.CoC.sanityFx;
    if (!fx) return;
    const c = cocStore.getState().character;
    if (!c?.derived?.SAN) { fx.clear(); return; }
    fx.apply(Number(c.derived.SAN.current) || 0, Number(c.derived.SAN.max) || 99);
  }

  // ── Bind ────────────────────────────────────────────────────────────────

  async function _applyDelta(key, op) {
    const c = cocStore.getState().character;
    if (!c?.derived?.[key]) return;

    let delta = 0;
    if      (op === "+1") delta =  1;
    else if (op === "-1") delta = -1;
    else if (op === "X") {
      const v = await uiPrompt(
        `Quanto deduzir de ${key}? (aceita números, 1D6, 2D10+3)`,
        { title: `Ajustar ${key}` }
      );
      if (v == null || v.trim() === "") return;
      const trimmed = v.trim();
      let raw;
      if (/^-?\d+$/.test(trimmed)) {
        raw = Math.abs(parseInt(trimmed, 10));
        delta = -raw;
      } else {
        const r = dice.rollNotation(trimmed);
        raw = Math.abs(r.total);
        delta = -raw;
        bus.publish("roll:logged", { skill: `Perda ${key}`, d100: null, level: "fail", dmg: `${trimmed} → ${r.total}` });
      }
      // §3.12 — Armadura absorve dano de PV (não afeta SAN/PM).
      // A absorção real acontece no reducer APPLY_DAMAGE (store.js) para
      // valer em TODOS os caminhos (keeper remoto incluído) — aqui apenas
      // antecipamos o aviso ao jogador.
      if (key === "PV") {
        const armor = Number(c.status && c.status.armor) || 0;
        if (armor > 0) {
          const absorbed = Math.min(armor, raw);
          toast(`🛡️ Armadura absorveu ${absorbed} de ${raw} dano (${raw - absorbed} em PV).`, { type: "info", duration: 4000 });
        }
      }
    }
    if (delta === 0) return;

    if (key === "Mitos") {
      cocExecutor.execute({ type: 'ADD_MYTHOS', payload: { delta } });
      return;
    }

    const amount = Math.abs(delta);
    if (key === "PV") {
      const payload = { amount };
      // ±1 são ajustes manuais de ficha — não passam pela armadura
      if (delta < 0 && op !== "X") payload.ignoreArmor = true;
      cocExecutor.execute({ type: delta < 0 ? "APPLY_DAMAGE" : "HEAL_DAMAGE", payload });
    }
    else if (key === "SAN") cocExecutor.execute({ type: delta < 0 ? "LOSE_SANITY"   : "RECOVER_SANITY", payload: { amount } });
    else if (key === "PM")  cocExecutor.execute({ type: delta < 0 ? "SPEND_MAGIC"   : "RESTORE_MAGIC",  payload: { amount } });
    // Aviso de loucura temporária migrou para o fluxo interativo dirigido
    // pela state-machine (bus "executor:action" → _insanityPrompts).
    // renderVitals() + _flashCard() triggered reactively via bus subscription below
  }

  function _bindButtons() {
    $$("[data-derived]").forEach(btn => {
      btn.onclick = async () => { await _applyDelta(btn.dataset.derived, btn.dataset.op); };
    });
    // Armadura (§3.12)
    $$("[data-armor-op]").forEach(btn => {
      btn.onclick = () => {
        const c = cocStore.getState().character;
        const cur = Number(c?.status?.armor) || 0;
        const next = Math.max(0, cur + (btn.dataset.armorOp === "+1" ? 1 : -1));
        cocExecutor.execute({ type: "SET_ARMOR", payload: { armor: next } });
      };
    });
    // Condições (§9) — toggle
    $$("[data-condition]").forEach(btn => {
      btn.onclick = () => {
        const c = cocStore.getState().character;
        const key = btn.dataset.condition;
        const on = !!(c?.status?.[key]);
        cocExecutor.execute({ type: on ? "REMOVE_STATUS" : "ADD_STATUS", payload: { status: key } });
        renderVitals();
      };
    });
  }

  // ── Init ────────────────────────────────────────────────────────────────

  const FLASH_MAP = {
    APPLY_DAMAGE:   { key: "PV",  sign: -1 },
    HEAL_DAMAGE:    { key: "PV",  sign:  1 },
    LOSE_SANITY:    { key: "SAN", sign: -1 },
    RECOVER_SANITY: { key: "SAN", sign:  1 },
    SPEND_MAGIC:    { key: "PM",  sign: -1 },
    RESTORE_MAGIC:  { key: "PM",  sign:  1 },
    ADD_MYTHOS:     { key: "Mitos", sign: 1 },
  };

  // ── Fluxo interativo de Loucura Temporária (CoC 7e p.161) ────────────────
  // Disparado pela state-machine (regra "Cheque de Loucura Temporária").
  // RAW: perdeu 5+ SAN de uma vez → rola INT; SUCESSO = compreendeu o horror
  // → loucura temporária. Falha = a mente reprime; segue abalado mas funcional.
  function _tempInsanityPrompt() {
    const ui = window.CoC.ui;
    const c  = cocStore.getState().character;
    const intVal = Number(c?.attributes?.INT?.value) || 0;
    if (!ui || typeof ui.modal !== "function") {
      toast(`⚠ Perda brutal de SAN: role INT (≤ ${intVal}). Sucesso = Loucura Temporária!`, { type: "warn", duration: 8000 });
      return;
    }
    const body = ui.el("div", {}, [
      ui.el("p", { style: { marginBottom: "0.6rem" } },
        ["Perda de 5+ pontos de Sanidade de uma vez. Role ", ui.el("b", { text: "INT" }),
         ` (≤ ${intVal}): se compreender o que viu, a mente quebra.`]),
      ui.el("p", { style: { fontSize: "0.82rem", color: "var(--ink-dim)", fontStyle: "italic" } },
        ["Sucesso = Loucura Temporária (1d10 horas). Falha = reprime o horror."]),
    ]);
    ui.modal({
      title: "🌀 Cheque de Loucura Temporária",
      body,
      actions: [
        { label: "Agora não" },
        {
          label: "🎲 Rolar INT", primary: true,
          onClick: function () {
            const r = dice.rollD100();
            const success = r.value <= intVal;
            bus.publish("roll:logged", {
              skill: "INT (Loucura Temporária)", d100: r.value,
              level: success ? "regular" : "fail",
              dmg: success ? "compreendeu o horror" : "reprimiu"
            });
            if (success) {
              cocExecutor.execute({ type: "ADD_STATUS", payload: { status: "tempInsane" } });
              toast(`🎲 ${r.value} ≤ ${intVal} — compreendeu o horror: LOUCURA TEMPORÁRIA (1d10 horas).`, { type: "error", duration: 8000 });
            } else {
              toast(`🎲 ${r.value} > ${intVal} — a mente reprimiu o que viu. Sem loucura (por enquanto).`, { type: "warn", duration: 6000 });
            }
          }
        }
      ]
    });
  }

  function initVitals() {
    bus.subscribe("store:dispatch", function (event) {
      if (!event.changed) return;
      const mapping = FLASH_MAP[event.action.type];
      if (!mapping) return;
      // Render delegado ao render-pipeline (Sprint 6). Flash é efeito local desta view.
      _flashCard(mapping.key, mapping.sign);
    });
    // Transições da state-machine → prompts narrativos (loucura)
    bus.subscribe("executor:action", function (event) {
      if (event.type !== "LOSE_SANITY" || !Array.isArray(event.transitions)) return;
      if (event.transitions.indexOf("Cheque de Loucura Temporária") !== -1) {
        _tempInsanityPrompt();
      }
      if (event.transitions.indexOf("Loucura Indefinida (1/5 no dia)") !== -1) {
        toast("🧠 Perdeu ≥1/5 da Sanidade no dia — LOUCURA INDEFINIDA aplicada.", { type: "error", duration: 8000 });
      }
    });
    // renderVitals() on first paint is called by render-pipeline via SET_CHARACTER
  }

  window.CoC.views.vitals = Object.freeze({ init: initVitals, render: renderVitals, renderSidebarVitals });

})();
