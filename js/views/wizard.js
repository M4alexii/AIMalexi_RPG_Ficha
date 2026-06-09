/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/views/wizard.js
   Assistente de Criação de Investigador (onboarding guiado — CoC 7e).

   Fatia 1 (MVP): overlay com stepper macro + painel de tutorial lateral fixo +
   navegação (Voltar/Pular/Avançar/Concluir). Passos: Conceito · Personagem
   (identidade + idade) · Atributos (point-buy com derivados AO VIVO) · Resumo.
   Ao concluir, monta um personagem no SCHEMA REAL (preset "empty") e entrega ao
   orquestrador via opts.onFinish — nada de JSON paralelo.

   API: window.CoC.views.wizard.open({ onFinish, onCancel })
   Reusa: window.CoC.rules (clamp/derivados), window.CoC.validators (badge),
          window.CoCData.occupations (sugestão guardada p/ a fatia 2).
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC       = window.CoC       || {};
window.CoC.views = window.CoC.views || {};

(function () {
  'use strict';

  var POOL = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'];
  var ATTR_LABEL = {
    FOR: 'Força', CON: 'Constituição', TAM: 'Tamanho', DES: 'Destreza',
    APA: 'Aparência', INT: 'Inteligência', POD: 'Poder', EDU: 'Educação', Sorte: 'Sorte'
  };
  var ARQUETIPOS = [
    { id: 'professor',  label: 'Professor',  icon: '📚', diff: 1, occ: 'Professor',          desc: 'Erudito que investiga com conhecimento.' },
    { id: 'detetive',   label: 'Detetive',   icon: '🔍', diff: 2, occ: 'Detetive de Polícia', desc: 'Observa, deduz e persegue pistas.' },
    { id: 'jornalista', label: 'Jornalista', icon: '📰', diff: 1, occ: 'Jornalista',          desc: 'Faro para histórias e contatos.' },
    { id: 'medico',     label: 'Médico',     icon: '⚕️', diff: 1, occ: 'Médico',              desc: 'Cura e ciência — fácil de jogar.' },
    { id: 'militar',    label: 'Militar',    icon: '🎖️', diff: 2, occ: 'Soldado',             desc: 'Treino de combate e disciplina.' },
    { id: 'criminoso',  label: 'Criminoso',  icon: '🎭', diff: 3, occ: 'Criminoso',           desc: 'Vive nas sombras da lei.' },
    { id: 'artista',    label: 'Artista',    icon: '🎨', diff: 2, occ: 'Artista',             desc: 'Percepção aguçada e expressão.' },
    { id: 'outro',      label: 'Outro',      icon: '✨', diff: 2, occ: '',                    desc: 'Defina livremente depois.' }
  ];
  var TRACOS = ['Corajoso', 'Curioso', 'Cético', 'Religioso', 'Ambicioso', 'Impulsivo'];
  var MOTIVS = ['Conhecimento', 'Dinheiro', 'Vingança', 'Justiça', 'Poder', 'Sobrevivência'];

  var STEPS = [
    { id: 'conceito',  label: 'Conceito',  tip: 'Crie uma PESSOA antes dos números. Essas escolhas não travam nada — só dão sentido ao personagem e vão sugerir a ocupação depois.' },
    { id: 'pessoa',    label: 'Personagem', tip: 'Quem é o investigador. A IDADE tem efeito mecânico: jovens são mais sortudos mas menos preparados; mais velhos sabem mais, mas o corpo cobra o preço.' },
    { id: 'atributos', label: 'Atributos', tip: 'Valores são percentuais (0–99). Distribua os pontos — repare os DERIVADOS (Vida, Sanidade, Magia) mudando ao vivo: é CON+TAM que te dá Vida, e POD que te dá Sanidade.' },
    { id: 'resumo',    label: 'Resumo',    tip: 'Confira e finalize. Você cai na ficha completa para escolher Ocupação, Perícias e Equipamento (próxima fatia do assistente).' }
  ];

  var _opts = null, _root = null, W = null;

  function _rules()      { return window.CoC.rules || {}; }
  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function _clamp(code, v) {
    var r = _rules();
    return r.clampAttribute ? r.clampAttribute(code, v) : Math.max(0, Math.min(99, Math.round(v)));
  }

  function _defaultData() {
    var attrs = {};
    POOL.forEach(function (c) { attrs[c] = 50; });
    attrs.Sorte = 50;
    return {
      conceito:   { arquetipo: '', traco: '', motivacao: '' },
      identidade: { nome: '', jogador: '', idade: 28, pronomes: '', residencia: '', nascimento: '' },
      atributos:  attrs
    };
  }

  // ── Derivados ao vivo (só exibição) ──────────────────────────────────────────
  function _derived(a) {
    var r = _rules();
    var pv  = r.calcHP        ? r.calcHP(a.CON, a.TAM)   : Math.floor((a.CON + a.TAM) / 10);
    var pm  = r.calcMP        ? r.calcMP(a.POD)          : Math.floor(a.POD / 5);
    var san = r.calcSANInit   ? r.calcSANInit(a.POD)     : a.POD;
    var esq = r.calcDodgeBase ? r.calcDodgeBase(a.DES)   : Math.floor(a.DES / 2);
    var mov = r.calcMOV       ? r.calcMOV(a.FOR, a.DES, a.TAM, W.identidade.idade) : 8;
    var dbObj = r.calcDB ? r.calcDB(a.FOR, a.TAM) : { db: '0', build: 0 };
    return { pv: pv, pm: pm, san: san, esquiva: esq, mov: mov, db: (dbObj && dbObj.db != null ? dbObj.db : '0') };
  }

  // ── Render de cada passo ─────────────────────────────────────────────────────
  function _renderConceito() {
    var d = W.conceito;
    function cards(list, sel, key, withDiff) {
      return list.map(function (it) {
        var id = it.id || it, lab = it.label || it;
        var on = d[key] === id ? ' on' : '';
        var diff = withDiff && it.diff ? '<span class="wz-diff" title="Dificuldade de interpretar">' + '⭐'.repeat(it.diff) + '</span>' : '';
        var icon = it.icon ? '<span class="wz-card-ico">' + it.icon + '</span>' : '';
        var desc = it.desc ? '<span class="wz-card-desc">' + _esc(it.desc) + '</span>' : '';
        return '<button type="button" class="wz-card' + on + '" data-grp="' + key + '" data-val="' + _esc(id) + '">' +
          icon + '<span class="wz-card-t">' + _esc(lab) + '</span>' + diff + desc + '</button>';
      }).join('');
    }
    return '<h3 class="wz-q">Quem é você?</h3><div class="wz-cards wz-cards-arq">' + cards(ARQUETIPOS, d.arquetipo, 'arquetipo', true) + '</div>' +
           '<h3 class="wz-q">Como ele é?</h3><div class="wz-cards wz-chips">' + cards(TRACOS, d.traco, 'traco') + '</div>' +
           '<h3 class="wz-q">O que ele busca?</h3><div class="wz-cards wz-chips">' + cards(MOTIVS, d.motivacao, 'motivacao') + '</div>';
  }

  function _renderPessoa() {
    var i = W.identidade;
    function field(lbl, key, type, ph) {
      return '<label class="wz-field"><span>' + lbl + '</span>' +
        '<input type="' + (type || 'text') + '" data-id="' + key + '" value="' + _esc(i[key]) + '" placeholder="' + _esc(ph || '') + '" /></label>';
    }
    return '<div class="wz-grid2">' +
      field('Nome do investigador', 'nome', 'text', 'ex.: Eleanor Vance') +
      field('Seu nome (jogador)', 'jogador', 'text', '') +
      '<label class="wz-field"><span>Idade <span class="wz-callout-trigger" title="A idade ajusta seus atributos automaticamente">ⓘ</span></span>' +
        '<input type="number" data-id="idade" min="15" max="89" value="' + _esc(i.idade) + '" /></label>' +
      field('Pronomes', 'pronomes', 'text', 'ex.: ela/dela') +
      field('Residência', 'residencia', 'text', 'cidade atual') +
      field('Local de nascimento', 'nascimento', 'text', '') +
    '</div>' +
    '<p class="wz-age-note">A idade afeta os atributos (jovens 15–19 e mais velhos têm ajustes). Por ora o assistente usa a idade como referência; os ajustes finos de idade você confirma na ficha.</p>';
  }

  function _renderAtributos() {
    var a = W.atributos, r = _rules();
    var budget = r.computeAttributeBudget ? r.computeAttributeBudget({ attributes: _attrObj() }) : { spent: 0, budget: 460, remaining: 0 };
    var vd = window.CoC.validators || {};
    var badge = vd.pointsBadgeState ? vd.pointsBadgeState(budget.spent, budget.budget) : { level: 'under', label: budget.spent + ' / ' + budget.budget };
    var caps = r.ATTRIBUTE_CAPS || {};

    var rows = POOL.map(function (code) {
      var cap = caps[code] ? (caps[code].min + '–' + caps[code].max) : '15–90';
      return '<div class="wz-attr" data-attr="' + code + '">' +
        '<span class="wz-attr-name">' + code + ' <small>' + ATTR_LABEL[code] + '</small></span>' +
        '<button type="button" class="wz-step" data-step="-5" aria-label="−">−</button>' +
        '<span class="wz-attr-val">' + a[code] + '</span>' +
        '<button type="button" class="wz-step" data-step="5" aria-label="+">+</button>' +
        '<span class="wz-attr-cap">' + cap + '</span>' +
      '</div>';
    }).join('');

    var dv = _derived(_numAttrs());
    var derived =
      '<div class="wz-derived">' +
        '<div class="wz-dv"><b>' + dv.pv + '</b><span>Vida</span></div>' +
        '<div class="wz-dv"><b>' + dv.san + '</b><span>Sanidade</span></div>' +
        '<div class="wz-dv"><b>' + dv.pm + '</b><span>Magia</span></div>' +
        '<div class="wz-dv"><b>' + dv.esquiva + '</b><span>Esquiva</span></div>' +
        '<div class="wz-dv"><b>' + dv.db + '</b><span>Bônus Dano</span></div>' +
        '<div class="wz-dv"><b>' + dv.mov + '</b><span>Mov.</span></div>' +
      '</div>';

    return '<div class="wz-budget"><span>Pontos das 8 características</span><span class="wz-budget-badge ' + badge.level + '">' + _esc(badge.label) + '</span></div>' +
      '<div class="wz-attrs">' + rows + '</div>' +
      '<div class="wz-attr wz-attr-luck" data-attr="Sorte">' +
        '<span class="wz-attr-name">Sorte <small>rolada à parte</small></span>' +
        '<button type="button" class="wz-step" data-step="-5" aria-label="−">−</button>' +
        '<span class="wz-attr-val">' + a.Sorte + '</span>' +
        '<button type="button" class="wz-step" data-step="5" aria-label="+">+</button>' +
        '<button type="button" class="wz-roll-luck btn-sm">🎲 Rolar</button>' +
      '</div>' +
      '<h4 class="wz-dv-title">Derivados (atualizam ao vivo)</h4>' + derived;
  }

  function _renderResumo() {
    var i = W.identidade, a = W.atributos, dv = _derived(_numAttrs());
    var arq = ARQUETIPOS.filter(function (x) { return x.id === W.conceito.arquetipo; })[0];
    var attrLine = POOL.map(function (c) { return c + ' ' + a[c]; }).join(' · ') + ' · Sorte ' + a.Sorte;
    return '<div class="wz-summary">' +
      '<div class="wz-sum-row"><b>' + (_esc(i.nome) || '(sem nome)') + '</b>' + (i.idade ? ' · ' + _esc(i.idade) + ' anos' : '') + (arq ? ' · ' + arq.icon + ' ' + _esc(arq.label) : '') + '</div>' +
      (W.conceito.traco || W.conceito.motivacao ? '<div class="wz-sum-row dim">' + _esc(W.conceito.traco) + (W.conceito.motivacao ? ' · busca ' + _esc(W.conceito.motivacao) : '') + '</div>' : '') +
      '<div class="wz-sum-row mono">' + attrLine + '</div>' +
      '<div class="wz-sum-row">Vida ' + dv.pv + ' · Sanidade ' + dv.san + ' · Magia ' + dv.pm + ' · Esquiva ' + dv.esquiva + '%</div>' +
      '<p class="wz-sum-next">Ao concluir, você cai na ficha completa para escolher <b>Ocupação</b>, <b>Perícias</b> e <b>Equipamento</b>.</p>' +
    '</div>';
  }

  function _renderStep() {
    switch (STEPS[W.step].id) {
      case 'conceito':  return _renderConceito();
      case 'pessoa':    return _renderPessoa();
      case 'atributos': return _renderAtributos();
      case 'resumo':    return _renderResumo();
    }
    return '';
  }

  function _numAttrs() {
    var o = {}; POOL.forEach(function (c) { o[c] = Number(W.atributos[c]) || 0; }); o.Sorte = Number(W.atributos.Sorte) || 0; return o;
  }
  function _attrObj() {
    var o = {}; var n = _numAttrs(); Object.keys(n).forEach(function (k) { o[k] = { value: n[k] }; }); return o;
  }

  // ── Shell ────────────────────────────────────────────────────────────────────
  function _render() {
    var stepper = STEPS.map(function (s, i) {
      var cls = i === W.step ? 'on' : (i < W.step ? 'done' : '');
      return '<button type="button" class="wz-step-dot ' + cls + '" data-goto="' + i + '"><i></i>' + _esc(s.label) + '</button>';
    }).join('');
    var pct = Math.round(((W.step + 1) / STEPS.length) * 100);
    var last = W.step === STEPS.length - 1;

    _root.innerHTML =
      '<div class="wz-backdrop"></div>' +
      '<div class="wz-panel" role="dialog" aria-modal="true" aria-label="Assistente de criação">' +
        '<header class="wz-head">' +
          '<div class="wz-title">🧭 Criador de Investigadores</div>' +
          '<button type="button" class="wz-exit" title="Ir para a ficha completa">Ficha completa →</button>' +
        '</header>' +
        '<div class="wz-progress"><div class="wz-progress-bar" style="width:' + pct + '%"></div></div>' +
        '<div class="wz-stepper">' + stepper + '</div>' +
        '<div class="wz-body">' +
          '<main class="wz-main">' + _renderStep() + '</main>' +
          '<aside class="wz-tip"><div class="wz-tip-h">💡 Dica</div><p>' + _esc(STEPS[W.step].tip) + '</p></aside>' +
        '</div>' +
        '<footer class="wz-nav">' +
          '<button type="button" class="wz-prev btn-ghost"' + (W.step === 0 ? ' disabled' : '') + '>← Voltar</button>' +
          '<button type="button" class="wz-skip btn-ghost">Pular</button>' +
          '<button type="button" class="wz-next btn-primary">' + (last ? '✓ Concluir' : 'Avançar →') + '</button>' +
        '</footer>' +
      '</div>';

    _wire();
  }

  function _wire() {
    var $ = function (s) { return _root.querySelector(s); };
    var $$ = function (s) { return Array.prototype.slice.call(_root.querySelectorAll(s)); };

    $('.wz-exit').onclick = function () { _close(); if (_opts && _opts.onCancel) _opts.onCancel(); };
    $('.wz-prev').onclick = function () { if (W.step > 0) { W.step--; _render(); } };
    $('.wz-skip').onclick = function () { _advance(true); };
    $('.wz-next').onclick = function () { _advance(false); };
    $$('.wz-step-dot').forEach(function (b) {
      b.onclick = function () { var i = parseInt(b.dataset.goto, 10); if (i <= W.step) { W.step = i; _render(); } };
    });

    // Conceito: cards
    $$('.wz-card').forEach(function (b) {
      b.onclick = function () { W.conceito[b.dataset.grp] = (W.conceito[b.dataset.grp] === b.dataset.val ? '' : b.dataset.val); _render(); };
    });
    // Personagem: inputs
    $$('[data-id]').forEach(function (inp) {
      inp.oninput = function () { W.identidade[inp.dataset.id] = inp.dataset.id === 'idade' ? (parseInt(inp.value, 10) || 0) : inp.value; };
    });
    // Atributos: steppers + rolar sorte
    $$('.wz-step').forEach(function (btn) {
      btn.onclick = function () {
        var code = btn.closest('[data-attr]').dataset.attr;
        var step = parseInt(btn.dataset.step, 10) || 0;
        var cur = Number(W.atributos[code]) || 0;
        W.atributos[code] = (code === 'Sorte') ? Math.max(0, Math.min(99, cur + step)) : _clamp(code, cur + step);
        _saveResume(); _render();
      };
    });
    var luck = $('.wz-roll-luck');
    if (luck) luck.onclick = function () {
      var d = window.CoC.dice;
      if (d && d.rollAttribute) { W.atributos.Sorte = d.rollAttribute('3d6x5').total; _saveResume(); _render(); }
    };
  }

  function _advance(skip) {
    _saveResume();
    if (W.step < STEPS.length - 1) { W.step++; _render(); return; }
    _finish();
  }

  function _finish() {
    var data = { conceito: W.conceito, identidade: W.identidade, atributos: _numAttrs() };
    _clearResume();
    _close();
    if (_opts && _opts.onFinish) _opts.onFinish(data);
  }

  // ── Salvar / retomar (anti-abandono) ─────────────────────────────────────────
  var RESUME_KEY = 'aimalexi-rpg/wizard-progress';
  function _saveResume() { try { localStorage.setItem(RESUME_KEY, JSON.stringify(W)); } catch (e) {} }
  function _loadResume() { try { var v = localStorage.getItem(RESUME_KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function _clearResume() { try { localStorage.removeItem(RESUME_KEY); } catch (e) {} }

  // ── Abertura / fechamento ────────────────────────────────────────────────────
  function open(opts) {
    _opts = opts || {};
    var resumed = _loadResume();
    W = resumed && resumed.identidade ? resumed : _defaultData();
    if (W.step == null) W.step = 0;
    _root = document.getElementById('wizard-root');
    if (!_root) { _root = document.createElement('div'); _root.id = 'wizard-root'; document.body.appendChild(_root); }
    _root.hidden = false;
    document.body.style.overflow = 'hidden';
    _render();
    document.addEventListener('keydown', _onKey);
  }
  function _onKey(e) { if (e.key === 'Escape') { _close(); if (_opts && _opts.onCancel) _opts.onCancel(); } }
  function _close() {
    document.removeEventListener('keydown', _onKey);
    if (_root) { _root.innerHTML = ''; _root.hidden = true; }
    document.body.style.overflow = '';
  }

  window.CoC.views.wizard = { open: open };

})();
