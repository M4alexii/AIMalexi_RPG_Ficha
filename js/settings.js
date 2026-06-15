/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/settings.js
   ETAPA 8 (#23) — Central de Configurações.

   Preferências GLOBAIS de UI (não por personagem) — persistidas em localStorage
   (aimalexi-rpg/settings). Aplicadas em qualquer página que carregue este módulo
   (investigador, guardião). Abre via botão ⚙️.

   Cobre: Tema · Cor de destaque · Idioma (i18n) · Efeitos visuais (reduzir
   animações, efeitos de rolagem) · Interface (densidade, escala de fonte) ·
   Acessibilidade (alto contraste).

   API: window.CoC.settings = { get, set, open, apply, init }
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {
  'use strict';

  var KEY = 'aimalexi-rpg/settings';

  var THEMES = [
    { id: 'arkham',     label: 'Arkham (Arquivo de Investigador — padrão)' },
    { id: 'classico',   label: 'Clássico (Dourado original)' },
    { id: 'lovecraft',  label: 'Lovecraft (Biblioteca Antiga)' },
    { id: 'cosmic',     label: 'Cosmic (Horror Cósmico)' },
    { id: 'arquivo',    label: 'Arquivo (Claro — Documento Investigativo)' },
    { id: 'miskatonic', label: 'Miskatonic (Acadêmico)' },
    { id: 'sepia',      label: 'Sépia (Documento Histórico)' },
    { id: 'obsidian',   label: 'Obsidian (Escuro/Moderno)' },
    { id: 'eldritch',   label: 'Eldritch (Vazio Púrpura)' },
    { id: 'noir',       label: 'Noir (Preto e Branco)' },
    { id: 'hospital',   label: 'Hospital Psiquiátrico (Claro)' },
    { id: 'agencia',    label: 'Agência Federal (Cinza/Azul)' },
  ];

  var DEFAULTS = {
    theme:        'arkham',
    accent:       '',          // vazio = usa o accent do tema
    language:     'pt',
    fontScale:    1.0,         // 0.85 – 1.3
    density:      'comfortable',
    uiMode:       'investigator', // 'player' = tela limpa p/ iniciantes
    reduceMotion: false,
    highContrast: false,
    rollEffects:  true,
    // Aparência (camada temática — tudo via tokens, nunca quebra legibilidade)
    bgTexture:    'none',      // none|papel|couro|madeira|nebulosa|arquivo
    bgIntensity:  50,          // 0–100% (mapeado p/ opacidade real com teto 0.35)
    cardStyle:    'arcano',    // arcano (visual atual)|moderno|arquivo|maquina
    borderStyle:  'simples',   // nenhuma|simples|vintage|runas|artdeco
    notesStyle:   'caderno',   // caderno|dossie|diario|maquina
    ambient:      'none',      // none|rain|mist|dust|vhs|film
  };

  var BG_TEXTURES = [
    { id: 'none',     label: 'Nenhum (cor sólida)' },
    { id: 'papel',    label: 'Papel envelhecido' },
    { id: 'couro',    label: 'Couro envelhecido' },
    { id: 'madeira',  label: 'Madeira escura' },
    { id: 'nebulosa', label: 'Nebulosa cósmica' },
    { id: 'arquivo',  label: 'Arquivo policial' },
  ];
  var CARD_STYLES = [
    { id: 'arcano',  label: 'Arcano (cantoneiras de latão — padrão)' },
    { id: 'moderno', label: 'Moderno (bordas suaves, sombra leve)' },
    { id: 'arquivo', label: 'Arquivo (borda dupla, papel)' },
    { id: 'maquina', label: 'Máquina de escrever (bordas retas)' },
  ];
  var BORDER_STYLES = [
    { id: 'nenhuma', label: 'Nenhuma' },
    { id: 'simples', label: 'Simples' },
    { id: 'vintage', label: 'Vintage (filete duplo)' },
    { id: 'runas',   label: 'Runas' },
    { id: 'artdeco', label: 'Art Déco (anos 20)' },
  ];
  var NOTES_STYLES = [
    { id: 'caderno', label: 'Caderno (pautas)' },
    { id: 'dossie',  label: 'Dossiê (carimbo)' },
    { id: 'diario',  label: 'Diário (manuscrito)' },
    { id: 'maquina', label: 'Máquina de escrever' },
  ];
  var AMBIENTS = [
    { id: 'none', label: 'Nenhum' },
    { id: 'rain', label: 'Chuva' },
    { id: 'mist', label: 'Névoa' },
    { id: 'dust', label: 'Poeira' },
    { id: 'vhs',  label: 'VHS' },
    { id: 'film', label: 'Filme antigo' },
  ];

  var _settings = null;

  function _load() {
    try { var v = localStorage.getItem(KEY); return v ? Object.assign({}, DEFAULTS, JSON.parse(v)) : Object.assign({}, DEFAULTS); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function _save() {
    try { localStorage.setItem(KEY, JSON.stringify(_settings)); } catch (e) {}
  }

  function get(key) { if (!_settings) _settings = _load(); return key ? _settings[key] : Object.assign({}, _settings); }
  function set(key, val) {
    if (!_settings) _settings = _load();
    _settings[key] = val;
    _save();
    apply();
  }

  // ── Aplica as preferências ao DOM (global) ─────────────────────────────────
  function apply() {
    if (!_settings) _settings = _load();
    var s = _settings;
    var body = document.body;
    if (!body) return;

    // Tema
    body.dataset.theme = s.theme || 'arkham';

    // Cor de destaque (override do --accent do tema)
    if (s.accent) {
      document.documentElement.style.setProperty('--accent', s.accent);
      document.documentElement.style.setProperty('--accent-glow', s.accent + '55');
    } else {
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-glow');
    }

    // Escala de fonte (root font-size base 16px)
    var scale = Math.max(0.85, Math.min(1.3, Number(s.fontScale) || 1));
    document.documentElement.style.fontSize = (16 * scale) + 'px';

    // Densidade / contraste / movimento / efeitos de rolagem → classes no body
    body.classList.toggle('density-compact', s.density === 'compact');
    body.classList.toggle('density-normal',  s.density === 'normal');
    body.classList.toggle('density-roomy',   s.density === 'roomy');

    // Modo da ficha (Jogador = progressive disclosure; CSS em investigator.css)
    body.dataset.uiMode = s.uiMode === 'player' ? 'player' : 'investigator';
    // Se a aba ativa ficou oculta no Modo Jogador, volta para Personagem
    if (s.uiMode === 'player') {
      var activeHidden = document.querySelector(
        '.mobile-tab.active[data-tab="diario"], .mobile-tab.active[data-tab="log"], ' +
        '.desktop-tab.active[data-tab="diario"], .desktop-tab.active[data-tab="log"]');
      if (activeHidden) {
        var home = document.querySelector('.mobile-tab[data-tab="personagem"], .desktop-tab[data-tab="personagem"]');
        if (home) home.click();
      }
    }
    body.classList.toggle('high-contrast',   !!s.highContrast);
    body.classList.toggle('reduce-motion',   !!s.reduceMotion);
    body.classList.toggle('no-roll-fx',      !s.rollEffects);

    // Aparência: textura de fundo (teto de opacidade 0.35 blinda a legibilidade)
    var tex = BG_TEXTURES.some(function (t2) { return t2.id === s.bgTexture; }) ? s.bgTexture : 'none';
    body.dataset.bgTexture = tex;
    var pct = Math.max(0, Math.min(100, Number(s.bgIntensity) || 0));
    document.documentElement.style.setProperty('--bg-texture-opacity', (pct / 100 * 0.35).toFixed(3));

    // Aparência: estilo dos cards, bordas e anotações
    body.dataset.cardStyle   = CARD_STYLES.some(function (c2) { return c2.id === s.cardStyle; }) ? s.cardStyle : 'arcano';
    body.dataset.borderStyle = BORDER_STYLES.some(function (b2) { return b2.id === s.borderStyle; }) ? s.borderStyle : 'simples';
    body.dataset.notesStyle  = NOTES_STYLES.some(function (n2) { return n2.id === s.notesStyle; }) ? s.notesStyle : 'caderno';

    // Aparência: ambiente visual (módulo presente só no investigador)
    var amb = AMBIENTS.some(function (a2) { return a2.id === s.ambient; }) ? s.ambient : 'none';
    if (window.CoC.ambientFx && window.CoC.ambientFx.set) window.CoC.ambientFx.set(amb);
    else body.dataset.ambient = amb;

    // Idioma
    if (window.CoC.i18n) {
      window.CoC.i18n.setLang(s.language || 'pt');
      window.CoC.i18n.applyTranslations(document);
    }
  }

  // ── Modal de configurações ─────────────────────────────────────────────────
  function open() {
    if (!_settings) _settings = _load();
    var ui = window.CoC.ui;
    var i18n = window.CoC.i18n;
    var T = i18n ? i18n.t : function (k) { return k; };
    if (!ui || !ui.modal) { console.warn('[settings] modal indisponível'); return; }

    var s = _settings;
    var body = document.createElement('div');
    body.className = 'settings-form';
    body.innerHTML =
      // Tema
      '<div class="settings-row"><label>' + T('settings.theme') + '</label>' +
        '<select id="set-theme">' + THEMES.map(function (t2) {
          return '<option value="' + t2.id + '"' + (t2.id === s.theme ? ' selected' : '') + '>' + t2.label + '</option>';
        }).join('') + '</select></div>' +
      // Cor de destaque
      '<div class="settings-row"><label>' + T('settings.accent') + '</label>' +
        '<div class="settings-inline">' +
          '<input type="color" id="set-accent" value="' + (s.accent || '#b8924f') + '" />' +
          '<button type="button" id="set-accent-clear" class="btn-ghost btn-sm" title="Voltar à cor do tema">✕</button>' +
        '</div></div>' +
      // Idioma
      '<div class="settings-row"><label>' + T('settings.language') + '</label>' +
        '<select id="set-lang">' +
          '<option value="pt"' + (s.language === 'pt' ? ' selected' : '') + '>Português</option>' +
          '<option value="en"' + (s.language === 'en' ? ' selected' : '') + '>English</option>' +
        '</select></div>' +
      // Escala de fonte
      '<div class="settings-row"><label>' + T('settings.fontScale') + ' (<span id="set-scale-val">' + Math.round(s.fontScale * 100) + '%</span>)</label>' +
        '<input type="range" id="set-scale" min="0.85" max="1.3" step="0.05" value="' + s.fontScale + '" /></div>' +
      // Modo da ficha (Jogador/Investigador)
      '<div class="settings-row"><label>Modo da ficha</label>' +
        '<select id="set-uimode">' +
          '<option value="investigator"' + (s.uiMode !== 'player' ? ' selected' : '') + '>Investigador — ficha completa</option>' +
          '<option value="player"' + (s.uiMode === 'player' ? ' selected' : '') + '>Jogador — tela limpa (iniciante)</option>' +
        '</select></div>' +
      // Densidade
      '<div class="settings-row"><label>' + T('settings.density') + '</label>' +
        '<select id="set-density">' +
          '<option value="roomy"' + (s.density === 'roomy' ? ' selected' : '') + '>Espaçoso (iniciante)</option>' +
          '<option value="comfortable"' + (s.density === 'comfortable' ? ' selected' : '') + '>' + T('settings.density.comfortable') + '</option>' +
          '<option value="normal"' + (s.density === 'normal' ? ' selected' : '') + '>Normal (desktop)</option>' +
          '<option value="compact"' + (s.density === 'compact' ? ' selected' : '') + '>' + T('settings.density.compact') + '</option>' +
        '</select></div>' +
      // ── Aparência (camada temática) ──
      '<div class="settings-section-title">🎨 Aparência</div>' +
      '<div class="settings-row"><label>Textura de fundo</label>' +
        '<select id="set-bgtex">' + BG_TEXTURES.map(function (t2) {
          return '<option value="' + t2.id + '"' + (t2.id === s.bgTexture ? ' selected' : '') + '>' + t2.label + '</option>';
        }).join('') + '</select></div>' +
      '<div class="settings-row"><label>Intensidade da textura (<span id="set-bgint-val">' + (s.bgIntensity || 0) + '%</span>)</label>' +
        '<input type="range" id="set-bgint" min="0" max="100" step="25" value="' + (s.bgIntensity || 0) + '" /></div>' +
      '<div class="settings-row"><label>Estilo dos cards</label>' +
        '<select id="set-cardstyle">' + CARD_STYLES.map(function (c2) {
          return '<option value="' + c2.id + '"' + (c2.id === s.cardStyle ? ' selected' : '') + '>' + c2.label + '</option>';
        }).join('') + '</select></div>' +
      '<div class="settings-row"><label>Bordas dos cards</label>' +
        '<select id="set-borderstyle">' + BORDER_STYLES.map(function (b2) {
          return '<option value="' + b2.id + '"' + (b2.id === s.borderStyle ? ' selected' : '') + '>' + b2.label + '</option>';
        }).join('') + '</select></div>' +
      '<div class="settings-row"><label>Estilo das anotações</label>' +
        '<select id="set-notesstyle">' + NOTES_STYLES.map(function (n2) {
          return '<option value="' + n2.id + '"' + (n2.id === s.notesStyle ? ' selected' : '') + '>' + n2.label + '</option>';
        }).join('') + '</select></div>' +
      '<div class="settings-row"><label>Ambiente visual (sem áudio)</label>' +
        '<select id="set-ambient">' + AMBIENTS.map(function (a2) {
          return '<option value="' + a2.id + '"' + (a2.id === s.ambient ? ' selected' : '') + '>' + a2.label + '</option>';
        }).join('') + '</select></div>' +
      // Toggles
      '<div class="settings-row toggle"><label><input type="checkbox" id="set-motion"' + (s.reduceMotion ? ' checked' : '') + ' /> ' + T('settings.reduceMotion') + '</label></div>' +
      '<div class="settings-row toggle"><label><input type="checkbox" id="set-contrast"' + (s.highContrast ? ' checked' : '') + ' /> ' + T('settings.highContrast') + '</label></div>' +
      '<div class="settings-row toggle"><label><input type="checkbox" id="set-rollfx"' + (s.rollEffects ? ' checked' : '') + ' /> ' + T('settings.rollEffects') + '</label></div>' +
      // Sanity FX Modo Lúcido (safe mode)
      '<div class="settings-row toggle"><label><input type="checkbox" id="set-sanity-lucid" /> 🌀 Modo Lúcido (sem efeitos de insanidade)</label></div>' +
      '<div class="settings-row"><button type="button" id="set-sanity-settings" class="btn-ghost">Configurar Efeitos de Insanidade...</button></div>';

    function $(id) { return body.querySelector('#' + id); }

    // Live preview — cada mudança aplica imediatamente
    $('set-theme').onchange   = function () { set('theme', this.value); };
    $('set-accent').oninput   = function () { set('accent', this.value); };
    $('set-accent-clear').onclick = function () { set('accent', ''); $('set-accent').value = '#b8924f'; };
    $('set-lang').onchange     = function () { set('language', this.value); };
    $('set-scale').oninput     = function () {
      set('fontScale', parseFloat(this.value));
      var lbl = $('set-scale-val'); if (lbl) lbl.textContent = Math.round(parseFloat(this.value) * 100) + '%';
    };
    $('set-density').onchange  = function () { set('density', this.value); };
    $('set-uimode').onchange   = function () { set('uiMode', this.value); };
    $('set-bgtex').onchange    = function () { set('bgTexture', this.value); };
    $('set-bgint').oninput     = function () {
      set('bgIntensity', parseInt(this.value, 10) || 0);
      var lbl = $('set-bgint-val'); if (lbl) lbl.textContent = this.value + '%';
    };
    $('set-cardstyle').onchange   = function () { set('cardStyle', this.value); };
    $('set-borderstyle').onchange = function () { set('borderStyle', this.value); };
    $('set-notesstyle').onchange  = function () { set('notesStyle', this.value); };
    $('set-ambient').onchange     = function () { set('ambient', this.value); };
    $('set-motion').onchange   = function () { set('reduceMotion', this.checked); };
    $('set-contrast').onchange = function () { set('highContrast', this.checked); };
    $('set-rollfx').onchange   = function () { set('rollEffects', this.checked); };

    // Sanity FX Modo Lúcido: se marcado, desativa efeitos; senão abre o modal
    $('set-sanity-lucid').onchange = function () {
      var fx = window.CoC.sanityFx;
      if (!fx) return;
      if (this.checked) {
        fx.setMode('off', true);
      } else {
        fx.setMode('reduced', true);
      }
    };

    // Botão para abrir o modal completo de Sanidade FX
    $('set-sanity-settings').onclick = function () {
      var fx = window.CoC.sanityFx;
      if (fx && fx.openSettings) {
        fx.openSettings();
      }
    };

    // Sincroniza estado do checkbox com o modo atual
    var fx = window.CoC.sanityFx;
    if (fx) {
      var mode = fx.getMode ? fx.getMode() : 'off';
      $('set-sanity-lucid').checked = (mode === 'off');
    }

    ui.modal({
      title: '⚙️ ' + T('settings.title'),
      body: body,
      actions: [
        { label: T('settings.reset'), onClick: function () {
          _settings = Object.assign({}, DEFAULTS);
          _save(); apply();
          // Reabre para refletir o reset
          setTimeout(open, 50);
        } },
        { label: T('settings.close'), primary: true }
      ]
    });
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  function init() {
    _settings = _load();
    apply();
    var btn = document.getElementById('btn-settings');
    if (btn) btn.onclick = open;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.CoC.settings = { get: get, set: set, open: open, apply: apply, init: init };

})();
