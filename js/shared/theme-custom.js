/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/shared/theme-custom.js
   Tema customizável do jogador — cores e fonte da ficha.

   Responsabilidades:
   - Aplica/remove as variáveis CSS do tema "custom" (inline em <body>),
     derivando tons (card-hi, brass-bright, glow) a partir das cores-base.
   - Editor visual (modal) com <input type="color"> + seletor de fonte,
     preview ao vivo e persistência via CoC.storage.getPref/setPref.
   - A escolha do tema em si continua em character._meta.theme ("custom");
     a paleta é preferência do dispositivo (pref "customTheme").

   Depende de: js/shared/ui-components.js (CoC.ui.modal/el), js/engine/storage.js.
   Atribui a window.CoC.themeCustom.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {

  var PREF_KEY = "customTheme";

  var DEFAULTS = {
    bgDeep:    "#1B1A17",   // fundo geral
    bgCard:    "#26231F",   // cards/painéis
    ink:       "#E6E0D5",   // texto principal
    inkDim:    "#B7B0A4",   // texto secundário
    accent:    "#556B2F",   // cor de ação/destaque
    font:      "default",   // fonte de leitura (corpo)
    titleFont: "default"    // fonte temática (títulos/seções)
  };

  // Camada funcional: fontes de LEITURA contínua (corpo)
  var FONTS = {
    "default":    { label: "Crimson Pro (padrão)",       body: "'Crimson Pro', Georgia, serif" },
    "inter":      { label: "Inter (leitura moderna)",     body: "'Inter', system-ui, sans-serif" },
    "atkinson":   { label: "Atkinson Hyperlegible (acessível)", body: "'Atkinson Hyperlegible', system-ui, sans-serif" },
    "courier":    { label: "Courier Prime",               body: "'Courier Prime', monospace" },
    "typewriter": { label: "Máquina de escrever",         body: "'Special Elite', 'Courier New', monospace" },
    "system":     { label: "Sistema (sans-serif)",        body: "system-ui, -apple-system, sans-serif" }
  };

  // Camada temática: fontes de TÍTULOS e seções
  var TITLE_FONTS = {
    "default":     { label: "Cormorant Garamond (padrão)", serif: "'Cormorant Garamond', Georgia, serif" },
    "baskerville": { label: "Libre Baskerville",           serif: "'Libre Baskerville', Georgia, serif" },
    "cinzel":      { label: "Cinzel (Art Déco anos 20)",   serif: "'Cinzel', 'Times New Roman', serif" },
    "imfell":      { label: "IM Fell (oculto)",            serif: "'IM Fell English SC', 'Times New Roman', serif" }
  };

  var store = window.CoC.storage || null;
  var current = null;   // paleta em uso (null = ainda não carregada)

  // ── Helpers de cor ─────────────────────────────────────────────────────
  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(rgb) {
    return "#" + rgb.map(function (c) {
      c = Math.max(0, Math.min(255, Math.round(c)));
      return c.toString(16).padStart(2, "0");
    }).join("");
  }
  // amt > 0 clareia em direção ao branco; amt < 0 escurece em direção ao preto
  function shade(hex, amt) {
    var rgb = hexToRgb(hex);
    if (!rgb) return hex;
    return rgbToHex(rgb.map(function (c) {
      return amt >= 0 ? c + (255 - c) * amt : c * (1 + amt);
    }));
  }
  function luminance(hex) {
    var rgb = hexToRgb(hex);
    if (!rgb) return 0;
    var f = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  }
  function glow(hex, alpha) {
    var rgb = hexToRgb(hex);
    if (!rgb) return "rgba(184, 146, 79, 0.45)";
    return "rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", " + alpha + ")";
  }

  function normalize(palette) {
    var p = Object.assign({}, DEFAULTS, palette || {});
    Object.keys(DEFAULTS).forEach(function (k) {
      if (k === "font")      { if (!FONTS[p.font]) p.font = "default"; return; }
      if (k === "titleFont") { if (!TITLE_FONTS[p.titleFont]) p.titleFont = "default"; return; }
      if (!hexToRgb(p[k])) p[k] = DEFAULTS[k];
    });
    return p;
  }

  // ── Aplicação ──────────────────────────────────────────────────────────
  var VARS = [
    "--bg-deep", "--bg-mid", "--bg-card", "--bg-card-hi", "--bg-overlay",
    "--ink", "--ink-dim", "--ink-faded",
    "--brass", "--brass-bright", "--brass-glow", "--accent", "--accent-glow",
    "--title-ink", "--num-ink", "--num-accent",
    "--font-body", "--font-serif",
    "--body-grad-top", "--body-grad-bottom"
  ];

  function apply(palette) {
    var p = normalize(palette);
    current = p;
    var isLight = luminance(p.bgDeep) > 0.4;
    var s = document.body.style;

    s.setProperty("--bg-deep", p.bgDeep);
    s.setProperty("--bg-mid", shade(p.bgDeep, isLight ? -0.04 : 0.04));
    s.setProperty("--bg-card", p.bgCard);
    s.setProperty("--bg-card-hi", shade(p.bgCard, isLight ? -0.07 : 0.07));
    s.setProperty("--bg-overlay", glow(p.bgDeep, 0.92));
    s.setProperty("--ink", p.ink);
    s.setProperty("--ink-dim", p.inkDim);
    s.setProperty("--ink-faded", shade(p.inkDim, isLight ? 0.35 : -0.45));
    s.setProperty("--brass", p.accent);
    s.setProperty("--brass-bright", shade(p.accent, isLight ? -0.18 : 0.25));
    s.setProperty("--brass-glow", glow(p.accent, isLight ? 0.30 : 0.45));
    s.setProperty("--accent", p.accent);
    s.setProperty("--accent-glow", glow(p.accent, isLight ? 0.30 : 0.45));
    s.setProperty("--title-ink", shade(p.accent, isLight ? -0.15 : 0.30));
    s.setProperty("--num-ink", p.ink);
    s.setProperty("--num-accent", shade(p.accent, isLight ? -0.15 : 0.30));
    s.setProperty("--body-grad-top", glow(p.accent, 0.08));
    s.setProperty("--body-grad-bottom", glow(p.accent, 0.04));

    var font  = FONTS[p.font] || FONTS["default"];
    var title = TITLE_FONTS[p.titleFont] || TITLE_FONTS["default"];
    s.setProperty("--font-body", font.body);
    s.setProperty("--font-serif", title.serif);

    document.body.style.colorScheme = isLight ? "light" : "dark";
  }

  function clear() {
    var s = document.body.style;
    VARS.forEach(function (v) { s.removeProperty(v); });
    document.body.style.colorScheme = "";
    current = null;
  }

  function load() {
    var saved = store && typeof store.getPref === "function" ? store.getPref(PREF_KEY, null) : null;
    return normalize(saved);
  }

  function save(palette) {
    if (store && typeof store.setPref === "function") store.setPref(PREF_KEY, normalize(palette));
  }

  // Chamado pelo orquestrador quando o tema do personagem é "custom".
  function applySaved() { apply(load()); }

  // ── Editor ─────────────────────────────────────────────────────────────
  // onApply(palette) é chamado ao salvar — o orquestrador troca o tema p/ custom.
  function openEditor(onApply) {
    var ui = window.CoC.ui;
    if (!ui || typeof ui.modal !== "function") return;
    var el = ui.el;

    var draft = load();
    var FIELDS = [
      { key: "bgDeep", label: "Fundo geral" },
      { key: "bgCard", label: "Cards e painéis" },
      { key: "ink",    label: "Texto principal" },
      { key: "inkDim", label: "Texto secundário" },
      { key: "accent", label: "Cor de destaque" }
    ];

    var wrap = el("div", {});
    wrap.appendChild(el("p", {
      style: { marginBottom: "0.75rem", color: "var(--ink-dim)", fontStyle: "italic", fontSize: "0.85rem" },
      text: "Monte a sua ficha: as mudanças aparecem ao vivo. Tons intermediários (bordas, brilhos, títulos) são derivados automaticamente das cores escolhidas."
    }));

    var grid = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" } });
    FIELDS.forEach(function (f) {
      var row = el("label", { style: { display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem" } });
      var input = el("input", { type: "color", value: draft[f.key], style: { width: "42px", height: "30px", padding: "0", border: "1px solid var(--ink-faded)", borderRadius: "var(--radius)", background: "transparent", cursor: "pointer" } });
      input.addEventListener("input", function () {
        draft[f.key] = input.value;
        apply(draft);   // preview ao vivo
      });
      row.appendChild(input);
      row.appendChild(el("span", { text: f.label }));
      grid.appendChild(row);
    });

    // Fontes — leitura (corpo) e temática (títulos), separadas
    function _fontRow(labelText, catalog, key) {
      var row = el("label", { style: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", gridColumn: "1 / -1" } });
      var sel = el("select", { style: { flex: "1" } });
      Object.keys(catalog).forEach(function (k) {
        var opt = el("option", { value: k, text: catalog[k].label });
        if (k === draft[key]) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        draft[key] = sel.value;
        apply(draft);
      });
      row.appendChild(el("span", { style: { minWidth: "5.5rem" }, text: labelText }));
      row.appendChild(sel);
      return row;
    }
    grid.appendChild(_fontRow("Leitura:",  FONTS,       "font"));
    grid.appendChild(_fontRow("Títulos:",  TITLE_FONTS, "titleFont"));
    wrap.appendChild(grid);

    var wasApplied = false;
    ui.modal({
      title: "🎨 Ficha Personalizada",
      body: wrap,
      actions: [
        {
          label: "Restaurar padrão",
          onClick: function () {
            draft = normalize(null);
            apply(draft);
            return false;  // mantém o modal aberto (se a API suportar)
          }
        },
        {
          label: "Salvar e aplicar", primary: true,
          onClick: function () {
            save(draft);
            wasApplied = true;
            if (typeof onApply === "function") onApply(draft);
          }
        }
      ],
      onClose: function () {
        // Cancelou sem salvar: re-aplica o que estava antes
        if (!wasApplied) {
          if (document.body.dataset.theme === "custom") applySaved();
          else clear();
        }
      }
    });
  }

  // ── Expor ──────────────────────────────────────────────────────────────
  window.CoC.themeCustom = {
    apply: apply,
    applySaved: applySaved,
    clear: clear,
    openEditor: openEditor,
    load: load,
    save: save,
    DEFAULTS: DEFAULTS,
    FONTS: FONTS,
    TITLE_FONTS: TITLE_FONTS
  };

})();
