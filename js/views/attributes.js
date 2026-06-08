/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/views/attributes.js
   View de Atributos Primários — extração do investigator.js (Strangler M3.9)

   Responsabilidades:
   - Renderizar grid de atributos primários (#sidebar-attributes)
   - Modo Edição: edição inline nas PRÓPRIAS cartas (digitar + steppers ±),
     respeitando os caps de criação; badge de orçamento (point-buy) na barra.
   - Disparar RECALC_DERIVED via store após edição; persistir.

   Depende de: window.CoC.store, window.CoC.bus, window.CoC.dice, window.CoC.ui,
   window.CoC.rules (clampAttribute/computeAttributeBudget), window.CoC.validators.
   opts.getEditMode() — callback boolean injetado pelo orquestrador.
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
  // proveniência (ex.: "Edição manual") para não deixar o campo obsoleto.
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

  function _clamp(code, value) {
    var rules = window.CoC.rules || {};
    return rules.clampAttribute ? rules.clampAttribute(code, value)
                                : Math.max(0, Math.min(99, Math.round(value)));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function render() {
    var grid = $s('#sidebar-attributes');
    if (!grid) return;
    grid.innerHTML = '';
    var c = _store ? _store.getState().character : null;
    if (!c || !c.attributes) { _renderBudget(null, false); return; }

    var editMode = _getEditMode();
    var dice     = window.CoC.dice;

    ATTRS.forEach(function(code) {
      var attr = c.attributes[code];
      if (!attr) return;
      var v   = Number(attr.value) || 0;
      var row = _mkEl('div', { class: 'sattr-row' + (editMode ? ' editing' : ''), 'data-attr': code });

      row.appendChild(_mkEl('span', { class: 'sattr-label' }, [_escHtml(code)]));

      if (editMode) {
        row.appendChild(_mkEl('button', {
          type: 'button', class: 'sattr-step', 'data-step': '-5',
          title: 'Diminuir', 'aria-label': 'Diminuir ' + code
        }, ['−']));
      }

      var valNode = _mkEl('span', {
        class: 'sattr-value',
        contenteditable: editMode ? 'true' : 'false',
        title: _escHtml(attr.rolled || '')
      }, [String(v)]);
      row.appendChild(valNode);

      if (editMode) {
        row.appendChild(_mkEl('button', {
          type: 'button', class: 'sattr-step', 'data-step': '5',
          title: 'Aumentar', 'aria-label': 'Aumentar ' + code
        }, ['+']));
      }

      var half  = dice ? dice.half(v)  : Math.floor(v / 2);
      var fifth = dice ? dice.fifth(v) : Math.floor(v / 5);
      row.appendChild(_mkEl('span', { class: 'sattr-fracs' }, [
        _mkEl('span', { class: 'sattr-frac-half',  title: 'Difícil' },  ['½' + half]),
        _mkEl('span', { class: 'sattr-frac-sep'                      },  [' · ']),
        _mkEl('span', { class: 'sattr-frac-fifth', title: 'Extremo' }, ['⅕' + fifth]),
      ]));

      grid.appendChild(row);
    });

    _renderBudget(c, editMode);

    if (editMode) {
      // Steppers ± (respeitam caps de criação)
      grid.querySelectorAll('.sattr-step').forEach(function(btn) {
        btn.onclick = function() {
          var row  = btn.closest('.sattr-row');
          var code = row && row.dataset.attr;
          if (!code) return;
          var char = _store ? _store.getState().character : null;
          if (!char || !char.attributes || !char.attributes[code]) return;
          var cur  = Number(char.attributes[code].value) || 0;
          var next = _clamp(code, cur + (parseInt(btn.dataset.step, 10) || 0));
          if (next === cur) return;
          _applyAttribute(code, next, { rolled: 'Edição manual' });
        };
      });

      // Edição direta (digitar). Vazio/inválido → mantém o valor anterior.
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
          var raw  = String(node.textContent || '').replace(/[^0-9]/g, '');
          // Digitar permite o teto geral 0–99 (override do Guardião); os ± usam os caps.
          var v    = raw === '' ? prev : Math.max(0, Math.min(99, parseInt(raw, 10)));
          if (v === prev) { node.textContent = String(prev); return; }
          _applyAttribute(code, v, { rolled: 'Edição manual' });
        };
      });
    }
  }

  // Badge de orçamento (point-buy CoC 7e) na barra de atributos — só em edição.
  // Base: as 8 características (sem Sorte) somam ~460 pts no método de compra
  // (média ~57,5 cada); informativo, NÃO bloqueia valores.
  function _renderBudget(c, editMode) {
    var el = $s('#attr-budget');
    if (!el) return;
    if (!c || !editMode) { el.setAttribute('hidden', ''); el.textContent = ''; el.className = 'attr-budget'; return; }
    var rules = window.CoC.rules || {};
    var b = rules.computeAttributeBudget ? rules.computeAttributeBudget(c) : null;
    if (!b) { el.setAttribute('hidden', ''); return; }
    var validators = window.CoC.validators || {};
    var badge = validators.pointsBadgeState
      ? validators.pointsBadgeState(b.spent, b.budget)
      : { level: 'under', label: b.spent + ' / ' + b.budget };
    el.removeAttribute('hidden');
    el.className = 'attr-budget ' + badge.level;
    el.textContent = '◆ ' + badge.label;
  }

  function init(store, opts) {
    _store       = store || window.CoC.store;
    _bus         = window.CoC.bus;
    _getEditMode = (opts && typeof opts.getEditMode === 'function') ? opts.getEditMode : function() { return false; };
  }

  window.CoC.views.attributes = Object.freeze({ render: render, init: init });

})();
