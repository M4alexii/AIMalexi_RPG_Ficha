/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/keeper-standard-pack.js
   "Pacote Padrão de Cthulhu" — atalho de partida para o Guardião.

   Carrega de uma vez:
   - As criaturas clássicas do Mythos já presentes em data/bestiary.js (descrições
     originais + fichas mecânicas; nada de texto/arte de obra protegida);
   - Uma ESTRUTURA inicial de campanha (Lore + tópicos-modelo no Diário) — apenas
     prompts/esqueleto genéricos, para o Mestre preencher e editar.

   Idempotente: só preenche campos de Lore vazios e só adiciona tópicos-modelo que
   ainda não existem — nunca sobrescreve o que o Mestre escreveu.

   Expõe: window.CoC.keeperStandardPack = { init, loadPack }
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var PREFIX      = 'aimalexi-rpg/';
  var LORE_KEY    = 'keeper-lore';
  var JOURNAL_KEY = 'keeper-journal-topics';
  var FLAG_KEY    = 'standard-pack-loaded';

  function _get(key, def) {
    try { var v = localStorage.getItem(PREFIX + key); return v == null ? def : JSON.parse(v); }
    catch (e) { return def; }
  }
  function _set(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
  }
  function _uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      var b = crypto.getRandomValues(new Uint8Array(6));
      return 'sp-' + Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    }
    return 'sp-' + Date.now().toString(36) + '-' + (_uuid._seq = (_uuid._seq || 0) + 1);
  }
  function _toast(msg, opts) {
    var ui = window.CoC && window.CoC.ui;
    if (ui && ui.toast) ui.toast(msg, opts || {});
  }

  // Conteúdo ORIGINAL — só estrutura/prompts genéricos (nenhuma obra protegida).
  var LORE_TEMPLATE = {
    faccoes:     '## Culto principal\n- Nome:\n- Objetivo:\n- Líder:\n\n## Autoridades locais\n- \n\n## Possíveis aliados\n- ',
    misterios:   '## Mistério central\n- O que está acontecendo:\n- A verdade oculta:\n\n## Ameaça\n- O que acontece se os investigadores falharem:',
    locais:      '## Cidade-base\n- \n\n## Local da investigação\n- \n\n## Esconderijo / covil\n- ',
    pistas:      '## Pistas principais\n- (pista) → leva a:\n- (pista) → leva a:\n\n## Handouts\n- ',
    personagens: '## Aliados\n- Nome — papel:\n\n## Antagonistas\n- Nome — papel:\n\n## Testemunhas / informantes\n- ',
    cronologia:  '## Antes da campanha\n- \n\n## Durante a investigação\n- \n\n## Clímax\n- '
  };

  var JOURNAL_TEMPLATE = [
    { category: 'sessao',   title: 'Sessão 0 — Gancho inicial', content: 'Como os investigadores se conhecem e por que se envolvem na trama.\n\nGancho:\nLocal de partida:' },
    { category: 'misterio', title: 'Mistério central',          content: 'A verdade:\nO que o antagonista/culto quer:\nConsequência do fracasso:' },
    { category: 'npc',      title: 'NPC — modelo',              content: 'Nome:\nOcupação:\nAparência:\nMotivação:\nSegredo:\nFicha: (use o Bestiário para combatentes)' },
    { category: 'local',    title: 'Local — modelo',            content: 'Nome:\nDescrição:\nO que encontrar aqui:\nPerigos:' },
    { category: 'pista',    title: 'Pista — modelo',            content: 'O que é:\nOnde é encontrada:\nLeva a:' }
  ];

  // Preenche apenas campos de Lore vazios; atualiza o DOM se a textarea existir.
  function _applyLore() {
    var lore = _get(LORE_KEY, {}) || {};
    var changed = false;
    Object.keys(LORE_TEMPLATE).forEach(function (k) {
      var cur = lore[k];
      if (cur == null || String(cur).trim() === '') {
        lore[k] = LORE_TEMPLATE[k];
        changed = true;
        var el = document.getElementById('lore-' + k);
        if (el) el.value = lore[k];
      }
    });
    if (changed) _set(LORE_KEY, lore);
    return changed;
  }

  // Adiciona só os tópicos-modelo que ainda não existem (compara por título).
  function _applyJournal() {
    var topics = _get(JOURNAL_KEY, []) || [];
    var existing = {};
    topics.forEach(function (t) { existing[(t.title || '').trim()] = true; });
    var added = 0;
    JOURNAL_TEMPLATE.forEach(function (tpl, i) {
      if (existing[tpl.title]) return;
      topics.push({
        id: _uuid(), category: tpl.category, title: tpl.title,
        content: tpl.content, date: new Date().toISOString().slice(0, 10), order: i
      });
      added++;
    });
    if (added) {
      _set(JOURNAL_KEY, topics);
      if (window.CoC && window.CoC.keeperJournal && window.CoC.keeperJournal.render) {
        window.CoC.keeperJournal.render();
      }
    }
    return added;
  }

  function loadPack() {
    var creatures = (window.CoCData && window.CoCData.bestiary) ? window.CoCData.bestiary.length : 0;
    var loreChanged = _applyLore();
    var added = _applyJournal();
    _set(FLAG_KEY, true);

    var parts = [creatures + ' criaturas no Bestiário'];
    if (loreChanged) parts.push('estrutura de Lore preenchida');
    if (added)       parts.push(added + ' tópicos-modelo no Diário');
    if (parts.length === 1) parts.push('Lore/Diário já tinham conteúdo (preservado)');
    _toast('🧰 Pacote Padrão — ' + parts.join(' · '), { type: 'success', duration: 4200 });
  }

  function init() {
    var btn = document.getElementById('btn-load-standard-pack');
    if (!btn) return;
    btn.onclick = function () {
      var ui = window.CoC && window.CoC.ui;
      var loaded = _get(FLAG_KEY, false);
      if (loaded && ui && ui.confirm) {
        ui.confirm(
          'O Pacote Padrão já foi carregado. Recarregar só preenche campos vazios e adiciona modelos que faltarem — não sobrescreve o que você escreveu. Continuar?',
          { title: 'Recarregar Pacote Padrão' }
        ).then(function (ok) { if (ok) loadPack(); });
      } else {
        loadPack();
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.CoC = window.CoC || {};
  window.CoC.keeperStandardPack = { init: init, loadPack: loadPack };
})();
