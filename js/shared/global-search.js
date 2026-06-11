/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/shared/global-search.js
   Busca global da ficha (Ctrl+K / Cmd+K) — spec Personalização & Modos V1.

   Pesquisa em: perícias, atributos, armas, inventário, magias, grimórios,
   diário e abas. Selecionar um resultado navega até a aba certa (e, no caso
   de perícia, aplica o termo no filtro da lista). Match ignora acentos.

   Teclado: Ctrl+K abre · ↑↓ navegam · Enter seleciona · Esc fecha.
   Depende de: window.CoC.store. Atribui a window.CoC.globalSearch.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {

  var overlay = null;
  var input   = null;
  var list    = null;
  var results = [];
  var active  = 0;

  function _fold(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function _goTab(tab) {
    var btn = document.querySelector('.desktop-tab[data-tab="' + tab + '"], .mobile-tab[data-tab="' + tab + '"]');
    if (btn) btn.click();
  }

  // ── Fontes de dados ─────────────────────────────────────────────────────
  function _collect() {
    var c = window.CoC.store && window.CoC.store.getState().character;
    var out = [];
    var playerMode = document.body.dataset.uiMode === "player";

    // Abas (atalhos de navegação)
    [["personagem", "Personagem"], ["pericias", "Perícias"], ["combate", "Combate"],
     ["inventario", "Inventário"], ["diario", "Diário"], ["log", "Log"]].forEach(function (t) {
      if (playerMode && (t[0] === "diario" || t[0] === "log")) return;
      out.push({ cat: "Ir para", label: t[1], key: _fold(t[1]), run: function () { _goTab(t[0]); } });
    });
    if (!c) return out;

    // Perícias: catálogo base (data/skills.js) mesclado com os valores do
    // personagem (character.skills guarda apenas as modificadas)
    var charSkills = c.skills || {};
    var seen = {};
    function _pushSkill(name, val) {
      if (seen[name]) return;
      seen[name] = true;
      out.push({
        cat: "Perícia", label: name + " — " + val + "%", key: _fold(name),
        run: function () {
          _goTab("pericias");
          var si = document.getElementById("skill-search-input");
          if (si) { si.value = name; si.dispatchEvent(new Event("input", { bubbles: true })); }
        }
      });
    }
    Object.keys(charSkills).forEach(function (name) {
      var s = charSkills[name];
      _pushSkill(name, Number(s && (s.value != null ? s.value : s.base)) || 0);
    });
    var catalog = (window.CoCData && window.CoCData.skills) || [];
    catalog.forEach(function (s) {
      if (!s || !s.name) return;
      _pushSkill(s.name, Number(s.base) || 0);
    });

    Object.keys(c.attributes || {}).forEach(function (code) {
      var a = c.attributes[code];
      out.push({ cat: "Atributo", label: code + " — " + (Number(a && a.value) || 0), key: _fold(code),
                 run: function () { _goTab("personagem"); } });
    });

    (c.weapons || []).forEach(function (w) {
      var n = w && (w.name || w.nome); if (!n) return;
      out.push({ cat: "Arma", label: n, key: _fold(n), run: function () { _goTab("combate"); } });
    });

    (c.inventory || []).forEach(function (it) {
      var n = typeof it === "string" ? it : it && (it.name || it.nome); if (!n) return;
      out.push({ cat: "Item", label: n, key: _fold(n), run: function () { _goTab("inventario"); } });
    });

    if (!playerMode) {
      (c.spells || []).forEach(function (sp) {
        var n = sp && (sp.name || sp.nome); if (!n) return;
        out.push({ cat: "Magia", label: n, key: _fold(n), run: function () { _goTab("combate"); } });
      });
      (c.tomes || []).forEach(function (t) {
        var n = t && (t.title || t.titulo || t.name); if (!n) return;
        out.push({ cat: "Grimório", label: n, key: _fold(n), run: function () { _goTab("combate"); } });
      });
      (c.journal || []).forEach(function (j) {
        var n = j && (j.title || j.titulo || (j.text || j.texto || "").slice(0, 40)); if (!n) return;
        out.push({ cat: "Diário", label: n, key: _fold(n + " " + (j.text || j.texto || "")), run: function () { _goTab("diario"); } });
      });
    }
    return out;
  }

  // ── UI ──────────────────────────────────────────────────────────────────
  function _render(q) {
    var all = _collect();
    var folded = _fold(q);
    results = !folded ? all.slice(0, 12)
                      : all.filter(function (r) { return r.key.indexOf(folded) !== -1; }).slice(0, 20);
    active = 0;
    list.innerHTML = "";
    if (!results.length) {
      var empty = document.createElement("div");
      empty.className = "gs-empty";
      empty.textContent = "Nada encontrado para “" + q + "”.";
      list.appendChild(empty);
      return;
    }
    results.forEach(function (r, i) {
      var row = document.createElement("button");
      row.type = "button";
      row.className = "gs-item" + (i === active ? " active" : "");
      row.innerHTML = '<span class="gs-cat"></span><span class="gs-label"></span>';
      row.querySelector(".gs-cat").textContent = r.cat;
      row.querySelector(".gs-label").textContent = r.label;
      row.addEventListener("click", function () { _execute(i); });
      list.appendChild(row);
    });
  }

  function _setActive(i) {
    if (!results.length) return;
    active = (i + results.length) % results.length;
    Array.prototype.forEach.call(list.children, function (el, idx) {
      el.classList.toggle("active", idx === active);
    });
    var el = list.children[active];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }

  function _execute(i) {
    var r = results[i];
    close();
    if (r && typeof r.run === "function") r.run();
  }

  function open() {
    if (overlay) { close(); }
    overlay = document.createElement("div");
    overlay.className = "gs-overlay";
    overlay.innerHTML =
      '<div class="gs-box" role="dialog" aria-label="Busca global">' +
        '<input class="gs-input" type="search" placeholder="Buscar perícia, item, arma, magia… (Esc fecha)" autocomplete="off" />' +
        '<div class="gs-results"></div>' +
        '<div class="gs-hint">↑↓ navegar · Enter abrir · Esc fechar</div>' +
      '</div>';
    document.body.appendChild(overlay);
    input = overlay.querySelector(".gs-input");
    list  = overlay.querySelector(".gs-results");

    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) close(); });
    input.addEventListener("input", function () { _render(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape")      { e.preventDefault(); close(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); _setActive(active + 1); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); _setActive(active - 1); }
      else if (e.key === "Enter")     { e.preventDefault(); _execute(active); }
    });
    _render("");
    input.focus();
  }

  function close() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null; input = null; list = null; results = []; active = 0;
  }

  function init() {
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (overlay) close(); else open();
      }
    });
    var btn = document.getElementById("btn-global-search");
    if (btn) btn.addEventListener("click", open);
  }

  window.CoC.globalSearch = { init: init, open: open, close: close };

})();
