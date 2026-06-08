/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/views/attributes.js
   View de Atributos Primários — extração do investigator.js (Strangler M3.9)

   Responsabilidades:
   - Renderizar grid de atributos primários (#sidebar-attributes)
   - Suportar modo edição (contenteditable) com clamp 0–99
   - Disparar RECALC_DERIVED via store após edição manual
   - Publicar identity:persist-requested para persistência

   Depende de:
   - window.CoC.store   (dispatch RECALC_DERIVED + getState)
   - window.CoC.bus     (publish persist-requested)
   - window.CoC.dice    (half, fifth — para frações)
   - window.CoC.ui      (el, escapeHtml)
   - opts.getEditMode() — callback que retorna boolean (injetado pelo orquestrador)

   Nota: editMode vive em state do investigator.js. Enquanto o orquestrador não for
   migrado para store, o acesso se dá via callback para evitar acoplamento direto.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC       = window.CoC       || {};
window.CoC.views = window.CoC.views || {};

(function () {

  var _store      = null;
  var _bus        = null;
  var _getEditMode = function() { return false; };

  var ATTRS = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU', 'Sorte'];

  function $s(sel)    { return document.querySelector(sel); }
  function _persist() { if (_bus) _bus.publish('identity:persist-requested', {}); }
  function _recalc()  { if (_store) _store.dispatch({ type: 'RECALC_DERIVED' }); }

  // Aplica uma característica pelo write-path oficial (VIEW → executor → store),
  // recalcula derivados, re-renderiza e persiste. `opts.rolled` registra a
  // proveniência (ex.: "Distribuição manual") para não deixar o campo obsoleto.
  function _applyAttribute(code, value, opts) {
    var exec = window.CoC.core && window.CoC.core.executor;
    var payload = { code: code, value: value };
    if (opts && opts.rolled !== undefined) payload.rolled = opts.rolled;
    if (exec && exec.execute) exec.execute({ type: 'SET_ATTRIBUTE', payload: payload });
    _recalc();
    render();
    if (window.CoC.views.vitals && window.CoC.views.vitals.render) window.CoC.views.vitals.render();
    if (window.CoC.views.skills && window.CoC.views.skills.render) window.CoC.views.skills.render();
    _persist();
  }

  function _escHtml(s) {
    var ui = window.CoC.ui || {};
    if (ui.escapeHtml) return ui.escapeHtml(s);
    return String(s).replace(/[&<>"']/g, function(c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function _mkEl(tag, attrs, children) {
    var ui = window.CoC.ui || {};
    if (ui.el) return ui.el(tag, attrs, children);
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function(k) {
      if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function(ch) {
      if (typeof ch === 'string') e.appendChild(document.createTextNode(ch));
      else if (ch) e.appendChild(ch);
    });
    return e;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function render() {
    var grid = $s('#sidebar-attributes');
    if (!grid) return;
    grid.innerHTML = '';
    var c = _store ? _store.getState().character : null;
    if (!c || !c.attributes) return;

    var editMode = _getEditMode();
    var dice     = window.CoC.dice;

    ATTRS.forEach(function(code) {
      var attr = c.attributes[code];
      if (!attr) return;
      var v   = Number(attr.value) || 0;
      var row = _mkEl('div', { class: 'sattr-row', 'data-attr': code });

      var valNode = _mkEl('span', {
        class: 'sattr-value',
        contenteditable: editMode ? 'true' : 'false',
        title: _escHtml(attr.rolled || '')
      }, [String(v)]);

      var half  = dice ? dice.half(v)  : Math.floor(v / 2);
      var fifth = dice ? dice.fifth(v) : Math.floor(v / 5);

      var fracsEl = _mkEl('span', { class: 'sattr-fracs' }, [
        _mkEl('span', { class: 'sattr-frac-half',  title: 'Difícil' },  ['½' + half]),
        _mkEl('span', { class: 'sattr-frac-sep'                      },  [' · ']),
        _mkEl('span', { class: 'sattr-frac-fifth', title: 'Extremo' }, ['⅕' + fifth]),
      ]);

      row.appendChild(_mkEl('span', { class: 'sattr-label' }, [_escHtml(code)]));
      row.appendChild(valNode);
      row.appendChild(fracsEl);
      grid.appendChild(row);
    });

    _renderDistPanel();

    if (editMode) {
      grid.querySelectorAll('.sattr-value').forEach(function(node) {
        node.onkeydown = function(e) {
          if (e.key === 'Enter')  { e.preventDefault(); node.blur(); }
          if (e.key === 'Escape') {
            e.preventDefault();
            var row  = node.closest('.sattr-row');
            var code = row && row.dataset.attr;
            var char = _store ? _store.getState().character : null;
            if (code && char && char.attributes && char.attributes[code]) {
              node.textContent = String(char.attributes[code].value);
            }
            node.blur();
          }
        };
        node.onblur = function() {
          var row  = node.closest('.sattr-row');
          var code = row && row.dataset.attr;
          if (!code) return;
          var char = _store ? _store.getState().character : null;
          if (!char || !char.attributes || !char.attributes[code]) return;
          var prev = Number(char.attributes[code].value) || 0;
          // Sanitiza: só dígitos. Campo vazio/inválido → mantém o valor anterior (não zera).
          var raw = String(node.textContent || '').replace(/[^0-9]/g, '');
          var v   = raw === '' ? prev : Math.max(0, Math.min(99, parseInt(raw, 10)));
          if (v === prev) { node.textContent = String(prev); return; }
          // Edição manual marca a proveniência para não deixar `rolled` obsoleto.
          _applyAttribute(code, v, { rolled: 'Distribuição manual' });
        };
      });
    }
  }

  // ── Painel de distribuição de pontos (point-buy, estilo perícias) ────────────
  // Visível só no Modo Editar. Mostra um badge de orçamento (gasto/total) e
  // steppers ± por característica, respeitando os caps de criação. Escreve pelo
  // mesmo write-path das perícias (executor → SET_ATTRIBUTE) + recálculo de derivados.
  function _stepRow(c, code, caps) {
    var v   = Number(c.attributes[code] && c.attributes[code].value) || 0;
    var cap = caps[code];
    var capHint = cap ? (cap.min + '–' + cap.max) : '0–99';
    return '<div class="adist-row" data-attr="' + code + '">' +
             '<span class="adist-label">' + _escHtml(code) + '</span>' +
             '<button type="button" class="adist-step" data-step="-5" aria-label="Diminuir ' + code + '">−</button>' +
             '<span class="adist-val">' + v + '</span>' +
             '<button type="button" class="adist-step" data-step="5" aria-label="Aumentar ' + code + '">+</button>' +
             '<span class="adist-cap" title="Limites de criação (CoC 7e)">' + capHint + '</span>' +
           '</div>';
  }

  function _renderDistPanel() {
    var panel = $s('#attr-dist-panel');
    if (!panel) return;
    var c = _store ? _store.getState().character : null;
    if (!c || !c.attributes || !_getEditMode()) {
      panel.setAttribute('hidden', '');
      panel.innerHTML = '';
      return;
    }
    panel.removeAttribute('hidden');

    var rules      = window.CoC.rules || {};
    var validators = window.CoC.validators || {};
    var pool = rules.ATTRIBUTE_POOL || ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'];
    var caps = rules.ATTRIBUTE_CAPS || {};
    var budget = rules.computeAttributeBudget
      ? rules.computeAttributeBudget(c)
      : { spent: 0, budget: 0, remaining: 0 };
    var badge = validators.pointsBadgeState
      ? validators.pointsBadgeState(budget.spent, budget.budget)
      : { level: 'under', label: budget.spent + ' pts' };

    var rows = '';
    pool.forEach(function(code) { if (c.attributes[code]) rows += _stepRow(c, code, caps); });

    panel.innerHTML =
      '<div class="adist-head">' +
        '<span class="adist-title">Distribuir Pontos</span>' +
        '<span class="adist-badge ' + _escHtml(badge.level) + '">' + _escHtml(badge.label) + '</span>' +
      '</div>' +
      '<div class="adist-rows">' + rows + '</div>' +
      (c.attributes.Sorte
        ? '<div class="adist-rows adist-luck">' + _stepRow(c, 'Sorte', caps) + '</div>' +
          '<div class="adist-note">Sorte é rolada à parte (fora do orçamento).</div>'
        : '') +
      '<div class="adist-note">Pool das 8 características ≈ ' + budget.budget + ' pts (CoC 7e).</div>';

    panel.querySelectorAll('.adist-step').forEach(function(btn) {
      btn.onclick = function() {
        var row  = btn.closest('.adist-row');
        var code = row && row.dataset.attr;
        if (!code) return;
        var char = _store ? _store.getState().character : null;
        if (!char || !char.attributes || !char.attributes[code]) return;
        var cur  = Number(char.attributes[code].value) || 0;
        var step = parseInt(btn.dataset.step, 10) || 0;
        var next = rules.clampAttribute
          ? rules.clampAttribute(code, cur + step)
          : Math.max(0, Math.min(99, cur + step));
        if (next === cur) return;
        _applyAttribute(code, next, { rolled: 'Distribuição manual' });
      };
    });
  }

  // ── Painel retrátil de rolagem de atributo ───────────────────────────────────
  // Reusa a engine das perícias (window.CoC.views.rolls.rollAttribute) — um único
  // painel retrátil, sem botões por atributo. Wire idempotente (init roda uma vez).
  var LABELS = {
    FOR: 'Força', CON: 'Constituição', TAM: 'Tamanho', DES: 'Destreza',
    APA: 'Aparência', INT: 'Inteligência', POD: 'Poder', EDU: 'Educação', Sorte: 'Sorte'
  };

  function _wireRollPanel() {
    var toggle = $s('#btn-roll-attr');
    var panel  = $s('#attr-roll-panel');
    var which  = $s('#attr-roll-which');
    var diff   = $s('#attr-roll-diff');
    var go     = $s('#attr-roll-go');
    if (!toggle || !panel || !which || !go) return;

    if (!which.options.length) {
      ATTRS.forEach(function(code) {
        var o = document.createElement('option');
        o.value = code;
        o.textContent = code + (LABELS[code] ? ' — ' + LABELS[code] : '');
        which.appendChild(o);
      });
    }

    toggle.onclick = function() {
      var willOpen = panel.hasAttribute('hidden');
      if (willOpen) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', String(willOpen));
    };

    go.onclick = function() {
      var rolls = window.CoC.views && window.CoC.views.rolls;
      if (!rolls || typeof rolls.rollAttribute !== 'function') return;
      rolls.rollAttribute(which.value, { difficulty: diff ? diff.value : 'regular' });
    };
  }

  function init(store, opts) {
    _store       = store || window.CoC.store;
    _bus         = window.CoC.bus;
    _getEditMode = (opts && typeof opts.getEditMode === 'function') ? opts.getEditMode : function() { return false; };
    _wireRollPanel();
  }

  window.CoC.views.attributes = Object.freeze({ render: render, init: init });

})();
