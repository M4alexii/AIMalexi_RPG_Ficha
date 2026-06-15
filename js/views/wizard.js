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
    { id: 'ocupacao',  label: 'Ocupação',  tip: 'Sua ocupação define onde você foi treinado — e quantos pontos você terá para gastar em perícias. Ela já marca as perícias profissionais e a faixa de Crédito para você.' },
    { id: 'arsenal',   label: 'Equipamento', tip: 'Não precisa ser perfeito agora — pegue o kit base da sua ocupação e ajuste depois com seu Guardião. Itens entram no Inventário da ficha.' },
    { id: 'background', label: 'História',  tip: 'Agora que o personagem ganhou forma, responda em poucas palavras. Esses ganchos são o que o Guardião usa para te puxar para a trama.' },
    { id: 'resumo',    label: 'Resumo',    tip: 'Confira e finalize. Na ficha você distribui os pontos de perícia (Ocupação + Interesse), que já vêm calculados aqui.' }
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
      atributos:  attrs,
      ocupacao:   { nome: '' },
      arsenal:    { incluir: true },
      background: { medo: '', pessoa: '', lugar: '', posse: '', evento: '' }
    };
  }

  // Kit inicial por palavra-chave da ocupação/arquétipo (base p/ todos + extras).
  var BASE_KIT = ['Caderno de anotações', 'Caneta tinteiro', 'Lanterna', 'Caixa de fósforos', 'Carteira'];
  var KIT_RULES = [
    { re: /m[ée]dic|enfermeir|cirurgi/i,        items: ['Bolsa médica', 'Estetoscópio', 'Kit de primeiros socorros'] },
    { re: /pol[íi]c|detetive|investigador|lei/i, items: ['Revólver .38', 'Algemas', 'Distintivo'] },
    { re: /jornal|rep[óo]rter|escritor/i,        items: ['Câmera fotográfica', 'Gravador portátil', 'Bloco de repórter'] },
    { re: /professor|acad[êe]mic|antiqu[áa]r|bibliotec|cientista|engenheir/i, items: ['Livros de referência', 'Óculos de leitura'] },
    { re: /soldado|militar|fuzileiro|mercen[áa]r/i, items: ['Faca de combate', 'Cantil', 'Kit de campanha'] },
    { re: /criminos|ladr[ãa]o|contraband|gangster/i, items: ['Gazuas', 'Pé-de-cabra', 'Faca'] },
    { re: /artista|m[úu]sic|ator|atriz|pintor/i, items: ['Material de arte', 'Caderno de esboços'] }
  ];
  function suggestKit(occName, arquetipoLabel) {
    var key = (occName || '') + ' ' + (arquetipoLabel || '');
    var extras = [];
    KIT_RULES.forEach(function (r) { if (r.re.test(key)) extras = extras.concat(r.items); });
    return BASE_KIT.concat(extras);
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
        var sel = d[key] === id;
        var on = sel ? ' on' : '';
        var diff = withDiff && it.diff ? '<span class="wz-diff" title="Dificuldade de interpretar">' + '★'.repeat(it.diff) + '</span>' : '';
        var icon = it.icon ? '<span class="wz-card-ico">' + it.icon + '</span>' : '';
        var desc = it.desc ? '<span class="wz-card-desc">' + _esc(it.desc) + '</span>' : '';
        return '<button type="button" class="wz-card' + on + '" aria-pressed="' + (sel ? 'true' : 'false') + '" data-grp="' + key + '" data-val="' + _esc(id) + '">' +
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
        '<button type="button" class="wz-roll-luck btn-sm"><svg class="icon" aria-hidden="true"><use href="assets/icons/sprite.svg#ico-dado"></use></svg> Rolar</button>' +
      '</div>' +
      '<h4 class="wz-dv-title">Derivados (atualizam ao vivo)</h4>' + derived;
  }

  function _occPoints(occ) {
    var r = _rules(), n = _numAttrs();
    var occRaw = r.calcOccupationPoints ? r.calcOccupationPoints(occ.pointsFormula, n) : null;
    var occPts = occRaw && occRaw.points != null ? occRaw.points : (occRaw || 0);
    var piRaw  = r.calcPersonalInterestPoints ? r.calcPersonalInterestPoints(n.INT) : (n.INT * 2);
    var piPts  = (piRaw && typeof piRaw === 'object') ? (piRaw.points || 0) : piRaw;
    return { occ: occPts, pi: piPts };
  }

  function _renderOcupacao() {
    var occs = (window.CoCData && window.CoCData.occupations) || [];
    var arq = ARQUETIPOS.filter(function (x) { return x.id === W.conceito.arquetipo; })[0];
    var suggested = arq && arq.occ ? arq.occ : '';
    var sel = W.ocupacao.nome || '';

    var options = '<option value="">— escolha uma ocupação —</option>' + occs.map(function (o) {
      return '<option value="' + _esc(o.name) + '"' + (o.name === sel ? ' selected' : '') + '>' + _esc(o.name) + '</option>';
    }).join('');

    var details = '';
    var occ = sel && window.CoCData.findOccupation ? window.CoCData.findOccupation(sel) : null;
    if (occ) {
      var pts = _occPoints(occ);
      var cred = occ.credit ? (occ.credit[0] + '–' + occ.credit[1] + '%') : '—';
      details = '<div class="wz-occ-card">' +
        (occ.description ? '<p class="wz-occ-desc">' + _esc(occ.description) + '</p>' : '') +
        '<div class="wz-occ-meta">' +
          '<span>💰 Crédito <b>' + cred + '</b></span>' +
          '<span>🎯 Pts. Ocupação <b>' + pts.occ + '</b> <small>(' + _esc(occ.pointsFormula) + ')</small></span>' +
          '<span>🧠 Pts. Interesse <b>' + pts.pi + '</b> <small>(INT×2)</small></span>' +
        '</div>' +
        '<div class="wz-occ-skills"><b>Perícias da ocupação:</b> ' +
          (occ.skills || []).map(_esc).join(' · ') +
          (occ.anySkillsCount ? ' <i>+ ' + occ.anySkillsCount + ' livre(s)</i>' : '') +
        '</div>' +
      '</div>';
    }

    return (suggested
        ? '<p class="wz-occ-sugg">Combina com <b>' + _esc(arq.label) + '</b>: ' +
          '<button type="button" class="wz-occ-pick" data-occ="' + _esc(suggested) + '">' + _esc(suggested) + '</button></p>'
        : '') +
      '<label class="wz-field"><span>Ocupação</span><select class="wz-occ-select"><!---->' + options + '</select></label>' +
      details;
  }

  function _arqLabel() {
    var arq = ARQUETIPOS.filter(function (x) { return x.id === W.conceito.arquetipo; })[0];
    return arq ? arq.label : '';
  }

  function _renderArsenal() {
    var kit = suggestKit(W.ocupacao.nome, _arqLabel());
    var on = W.arsenal.incluir;
    return '<p class="wz-q">Kit inicial sugerido' + (W.ocupacao.nome ? ' para <b>' + _esc(W.ocupacao.nome) + '</b>' : '') + '</p>' +
      '<label class="wz-kit-toggle"><input type="checkbox" class="wz-kit-check"' + (on ? ' checked' : '') + ' /> Incluir este kit no inventário</label>' +
      '<ul class="wz-kit-list' + (on ? '' : ' off') + '">' + kit.map(function (it) { return '<li>📦 ' + _esc(it) + '</li>'; }).join('') + '</ul>' +
      '<p class="wz-age-note">Você ajusta itens e formaliza armas (dano/alcance) na ficha depois.</p>';
  }

  function _renderBackground() {
    var b = W.background;
    function q(lbl, key, ph) {
      return '<label class="wz-field"><span>' + lbl + '</span>' +
        '<input type="text" data-bg="' + key + '" value="' + _esc(b[key]) + '" placeholder="' + _esc(ph) + '" /></label>';
    }
    return '<div class="wz-bg-grid">' +
      q('Qual seu maior medo?', 'medo', 'ex.: o escuro, perder a razão…') +
      q('Quem é a pessoa mais importante?', 'pessoa', 'ex.: minha irmã Clara') +
      q('Qual lugar te marca?', 'lugar', 'ex.: a velha biblioteca da cidade') +
      q('O que você não larga?', 'posse', 'ex.: o relógio do meu pai') +
      q('Qual evento mudou sua vida?', 'evento', 'ex.: o desaparecimento em 1918') +
    '</div>' +
    '<p class="wz-age-note">Pode pular — nada aqui é obrigatório. Vira o texto de antecedentes na ficha.</p>';
  }

  function _renderResumo() {
    var i = W.identidade, a = W.atributos, dv = _derived(_numAttrs());
    var arq = ARQUETIPOS.filter(function (x) { return x.id === W.conceito.arquetipo; })[0];
    var attrLine = POOL.map(function (c) { return c + ' ' + a[c]; }).join(' · ') + ' · Sorte ' + a.Sorte;
    var occName = W.ocupacao.nome || '';
    var occ = occName && window.CoCData.findOccupation ? window.CoCData.findOccupation(occName) : null;
    var pts = occ ? _occPoints(occ) : null;
    var kitCount = (W.arsenal && W.arsenal.incluir) ? suggestKit(occName, _arqLabel()).length : 0;
    var bgFilled = ['medo', 'pessoa', 'lugar', 'posse', 'evento'].filter(function (k) { return W.background && W.background[k]; }).length;
    return '<div class="wz-summary">' +
      '<div class="wz-sum-row"><b>' + (_esc(i.nome) || '(sem nome)') + '</b>' + (i.idade ? ' · ' + _esc(i.idade) + ' anos' : '') + (arq ? ' · ' + arq.icon + ' ' + _esc(arq.label) : '') + '</div>' +
      (W.conceito.traco || W.conceito.motivacao ? '<div class="wz-sum-row dim">' + _esc(W.conceito.traco) + (W.conceito.motivacao ? ' · busca ' + _esc(W.conceito.motivacao) : '') + '</div>' : '') +
      (occName ? '<div class="wz-sum-row">💼 <b>' + _esc(occName) + '</b>' + (occ && occ.credit ? ' · Crédito ' + occ.credit[0] + '–' + occ.credit[1] + '%' : '') + '</div>' : '<div class="wz-sum-row dim">Sem ocupação — escolha no passo anterior ou depois na ficha.</div>') +
      '<div class="wz-sum-row mono">' + attrLine + '</div>' +
      '<div class="wz-sum-row">Vida ' + dv.pv + ' · Sanidade ' + dv.san + ' · Magia ' + dv.pm + ' · Esquiva ' + dv.esquiva + '%</div>' +
      (kitCount ? '<div class="wz-sum-row dim">📦 ' + kitCount + ' itens de equipamento vão para o inventário</div>' : '') +
      (bgFilled ? '<div class="wz-sum-row dim">📖 ' + bgFilled + ' gancho(s) de história preenchido(s)</div>' : '') +
      (pts ? '<p class="wz-sum-next">Ao concluir, a ficha já vem com a ocupação e as perícias marcadas. Você distribui <b>' + pts.occ + '</b> pontos de Ocupação + <b>' + pts.pi + '</b> de Interesse na aba <b>Perícias</b>.</p>'
           : '<p class="wz-sum-next">Ao concluir, você completa Ocupação, Perícias e Equipamento na ficha.</p>') +
    '</div>';
  }

  function _renderStep() {
    switch (STEPS[W.step].id) {
      case 'conceito':  return _renderConceito();
      case 'pessoa':    return _renderPessoa();
      case 'atributos': return _renderAtributos();
      case 'ocupacao':  return _renderOcupacao();
      case 'arsenal':   return _renderArsenal();
      case 'background': return _renderBackground();
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
      var mark = i < W.step ? '✓' : (i + 1);
      var cur = i === W.step ? ' aria-current="step"' : '';
      return '<button type="button" class="wz-step-dot ' + cls + '" data-goto="' + i + '"' + cur + '><i>' + mark + '</i><span class="wz-step-label">' + _esc(s.label) + '</span></button>';
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
    // Ocupação: select + sugestão
    var occSel = $('.wz-occ-select');
    if (occSel) occSel.onchange = function () { W.ocupacao.nome = occSel.value; _saveResume(); _render(); };
    var occPick = $('.wz-occ-pick');
    if (occPick) occPick.onclick = function () { W.ocupacao.nome = occPick.dataset.occ; _saveResume(); _render(); };

    var luck = $('.wz-roll-luck');
    if (luck) luck.onclick = function () {
      var d = window.CoC.dice;
      if (d && d.rollAttribute) { W.atributos.Sorte = d.rollAttribute('3d6x5').total; _saveResume(); _render(); }
    };

    // Equipamento: incluir kit (toggle só repinta a lista)
    var kitChk = $('.wz-kit-check');
    if (kitChk) kitChk.onchange = function () {
      W.arsenal.incluir = !!kitChk.checked;
      var list = $('.wz-kit-list');
      if (list) list.classList.toggle('off', !W.arsenal.incluir);
      _saveResume();
    };

    // História: ganchos de background (texto livre, sem repintar a cada tecla)
    $$('[data-bg]').forEach(function (inp) {
      inp.oninput = function () { W.background[inp.dataset.bg] = inp.value; };
    });
  }

  function _advance(skip) {
    _saveResume();
    if (W.step < STEPS.length - 1) { W.step++; _render(); return; }
    _finish();
  }

  function _finish() {
    var data = {
      conceito:   W.conceito,
      identidade: W.identidade,
      atributos:  _numAttrs(),
      ocupacao:   W.ocupacao,
      arsenal:    { incluir: !!(W.arsenal && W.arsenal.incluir), kit: suggestKit(W.ocupacao.nome, _arqLabel()) },
      background: W.background
    };
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
    // Compat: progresso salvo antes de arsenal/background ainda precisa desses campos.
    if (!W.arsenal)    W.arsenal    = { incluir: true };
    if (!W.background) W.background = { medo: '', pessoa: '', lugar: '', posse: '', evento: '' };
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
