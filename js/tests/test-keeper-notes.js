/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/tests/test-keeper-notes.js
   Sistema avançado de notas do Guardião — CRUD, wikilinks, backlinks,
   busca com operadores, lixeira (soft delete) e versionamento.

   Em Node não há localStorage: o módulo usa o cache em memória (_cache),
   que funciona como banco efêmero — perfeito para testes.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var notes = window.CoC.keeperNotes;

  // Limpa o estado entre grupos (purga tudo, inclusive lixeira)
  function wipe() {
    notes.list().forEach(function (n) { notes.purge(n.id); });
    notes.getTrash().forEach(function (n) { notes.purge(n.id); });
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  group('Keeper Notes — CRUD');
  wipe();

  var a = notes.create('Velho Castro', 'Um ancião que conhece os cultos.', 'NPCs', ['npc', 'culto']);
  assert(a && a.id, 'create retorna nota com id');
  assertEq(a.title, 'Velho Castro', 'create preserva título');
  assertEq(a.folder, 'NPCs', 'create preserva pasta');
  assertEq(a.tags.length, 2, 'create preserva tags');

  var read = notes.read(a.id);
  assert(read !== null, 'read encontra nota criada');
  assertEq(read.title, 'Velho Castro', 'read retorna dados corretos');
  assertEq(notes.read('inexistente'), null, 'read de id inexistente retorna null');

  var updated = notes.update(a.id, { title: 'Castro, o Velho' });
  assertEq(updated.title, 'Castro, o Velho', 'update altera título');
  assert(notes.list().length === 1, 'list retorna 1 nota ativa');

  // ── Wikilinks ─────────────────────────────────────────────────────────────
  group('Keeper Notes — wikilinks e backlinks');
  wipe();

  var npc = notes.create('Inspetor Legrasse', 'Investigador da polícia.');
  var caso = notes.create('Caso do Pântano', 'O [[Inspetor Legrasse]] liderou a batida. Ver [[Inexistente|nota fantasma]].');

  var links = notes.extractWikilinks(caso.content);
  assertEq(links.length, 2, 'extractWikilinks acha 2 links');
  assertEq(links[0].target, 'inspetor legrasse', 'target normalizado (lowercase)');
  assertEq(links[1].display, 'nota fantasma', 'display customizado via |');

  var resolved = notes.resolveWikilink('inspetor legrasse');
  assert(resolved && resolved.id === npc.id, 'resolveWikilink acha nota por título (case-insensitive)');
  assertEq(notes.resolveWikilink('inexistente'), null, 'resolveWikilink retorna null para título sem nota');

  var bl = notes.getBacklinks(npc.id);
  assertEq(bl.length, 1, 'getBacklinks acha 1 referência');
  assertEq(bl[0].noteId, caso.id, 'backlink aponta para a nota que referencia');

  var html = notes.processWikilinks(caso.content);
  assert(html.indexOf('data-note-id="' + npc.id + '"') !== -1, 'processWikilinks gera link clicável para nota existente');
  assert(html.indexOf('wikilink-broken') !== -1, 'processWikilinks marca link quebrado');

  // ── Busca com operadores ──────────────────────────────────────────────────
  group('Keeper Notes — busca com operadores');
  wipe();

  notes.create('Mansão Corbitt', 'Casa mal-assombrada em Boston.', 'Ato 1/Locais', ['local', 'assombrada']);
  notes.create('Ritual Profano', 'Um ritual sombrio em Boston envolve sacrifícios.', 'Ato 2', ['misterio']);
  notes.create('Diário de Walter', 'Páginas amareladas sem menção à cidade.', null, ['pista']);

  assertEq(notes.search('boston').length, 2, 'busca por termo livre acha 2');
  assertEq(notes.search('tag:local').length, 1, 'tag: filtra por tag');
  assertEq(notes.search('tag:LOCAL').length, 1, 'tag: é case-insensitive');
  assertEq(notes.search('boston tag:misterio').length, 1, 'termo + tag: combinam (AND)');
  assertEq(notes.search('boston -ritual').length, 1, '-termo exclui resultados');
  assertEq(notes.search('"casa mal-assombrada"').length, 1, '"frase exata" funciona');
  assertEq(notes.search('"casa assombrada"').length, 0, '"frase exata" não casa fora de ordem');
  assertEq(notes.search('folder:ato').length, 2, 'folder: filtra por pasta (substring)');
  assertEq(notes.search('updated:<7d').length, 3, 'updated:<7d acha notas recentes');
  assertEq(notes.search('created:>2020-01-01').length, 3, 'created:> com data absoluta');
  assertEq(notes.search('created:<2020-01-01').length, 0, 'created:< exclui notas novas');

  var parsed = notes.parseSearchQuery('tag:x "a b" -c termo created:>2026-01-01');
  assertEq(parsed.tags[0], 'x', 'parse extrai tag');
  assertEq(parsed.phrases[0], 'a b', 'parse extrai frase');
  assertEq(parsed.excluded[0], 'c', 'parse extrai exclusão');
  assertEq(parsed.terms[0], 'termo', 'parse extrai termo livre');
  assertEq(parsed.created.op, '>', 'parse extrai operador de data');

  // ── Lixeira (soft delete) ─────────────────────────────────────────────────
  group('Keeper Notes — lixeira e restauração');
  wipe();

  var vitima = notes.create('Nota Condenada', 'Conteúdo a remover.');
  var sobrevivente = notes.create('Nota Viva', 'Referencia [[Nota Condenada]].');

  assert(notes.delete(vitima.id), 'delete retorna true');
  assertEq(notes.list().length, 1, 'nota deletada some da lista ativa');
  assertEq(notes.getTrash().length, 1, 'nota deletada aparece na lixeira');
  assertEq(notes.search('remover').length, 0, 'busca ignora notas na lixeira');
  assertEq(notes.resolveWikilink('nota condenada'), null, 'wikilink não resolve nota na lixeira');
  assertEq(notes.getBacklinks(sobrevivente.id).length, 0, 'backlinks ignoram notas na lixeira');

  var devolta = notes.restore(vitima.id);
  assert(devolta && !devolta.deletedAt, 'restore remove deletedAt');
  assertEq(notes.list().length, 2, 'nota restaurada volta à lista');
  assertEq(notes.getTrash().length, 0, 'lixeira esvazia após restore');

  notes.delete(vitima.id);
  assert(notes.purge(vitima.id), 'purge remove definitivamente');
  assertEq(notes.read(vitima.id), null, 'nota purgada não existe mais');
  assertEq(notes.restore(vitima.id), null, 'restore de nota purgada retorna null');

  // purgeExpired: nota deletada há 31 dias deve sumir; recente fica
  var velha = notes.create('Velha na Lixeira', 'x');
  notes.delete(velha.id);
  // Simula deleção antiga manipulando o registro pela API de update direto
  var raw = notes.read(velha.id);
  raw.deletedAt = new Date(Date.now() - 31 * 86400000).toISOString();
  var recente = notes.create('Recente na Lixeira', 'y');
  notes.delete(recente.id);

  var purgadas = notes.purgeExpired();
  assertEq(purgadas, 1, 'purgeExpired remove só as expiradas (>30d)');
  assertEq(notes.getTrash().length, 1, 'nota recente continua na lixeira');

  // ── Versionamento ─────────────────────────────────────────────────────────
  group('Keeper Notes — versionamento');
  wipe();

  var doc = notes.create('Documento Vivo', 'versão 1');
  assertEq(notes.getHistory(doc.id).length, 0, 'sem histórico antes da primeira edição');

  notes.update(doc.id, { content: 'versão 2' });
  notes.update(doc.id, { content: 'versão 3' });
  var hist = notes.getHistory(doc.id);
  assertEq(hist.length, 2, 'duas edições geram dois snapshots');
  assertEq(hist[0].content, 'versão 2', 'histórico mais recente primeiro');
  assertEq(hist[1].content, 'versão 1', 'snapshot mais antigo por último');

  notes.update(doc.id, { title: 'Só Título' });
  assertEq(notes.getHistory(doc.id).length, 2, 'mudar só o título não cria snapshot');

  var restaurada = notes.restoreVersion(doc.id, 1); // restaura "versão 1"
  assertEq(restaurada.content, 'versão 1', 'restoreVersion recupera conteúdo antigo');
  assertEq(notes.getHistory(doc.id)[0].content, 'versão 3', 'versão atual vira snapshot ao restaurar');

  // Limite de histórico (MAX_HISTORY = 10)
  for (var i = 0; i < 15; i++) {
    notes.update(doc.id, { content: 'iteração ' + i });
  }
  assert(notes.getHistory(doc.id).length <= 10, 'histórico limitado a 10 snapshots');

  // ── Campos customizados ───────────────────────────────────────────────────
  group('Keeper Notes — campos customizados');
  wipe();

  var cultista = notes.create('Cultista de Dagon', 'Líder do culto local.', null, ['npc'], { 'PV': '12', 'SAN': '35', 'Ocupação': 'Pescador' });
  notes.create('Taverna do Porto', 'Ponto de encontro.', null, ['local'], { 'Região': 'Innsmouth' });
  notes.create('Sem Campos', 'Nota simples.');

  assertEq(notes.read(cultista.id).fields['PV'], '12', 'create persiste campos');
  assertEq(notes.search('campo:PV').length, 1, 'campo:chave acha nota que tem o campo');
  assertEq(notes.search('campo:pv').length, 1, 'campo:chave é case-insensitive');
  assertEq(notes.search('campo:PV=12').length, 1, 'campo:chave=valor casa valor exato');
  assertEq(notes.search('campo:PV=99').length, 0, 'campo:chave=valor não casa valor errado');
  assertEq(notes.search('field:Região=innsmouth').length, 1, 'alias field: e valor case-insensitive');
  assertEq(notes.search('campo:Inexistente').length, 0, 'campo inexistente não casa');
  assertEq(notes.search('tag:npc campo:SAN').length, 1, 'campo combina com tag (AND)');

  notes.update(cultista.id, { fields: { 'PV': '8' } });
  assertEq(notes.search('campo:PV=8').length, 1, 'update substitui campos');
  assertEq(notes.search('campo:SAN').length, 0, 'campo removido no update some da busca');

  var mdCampos = notes.exportMarkdown(cultista.id);
  assert(mdCampos.indexOf('| PV | 8 |') !== -1, 'export inclui tabela de campos');

  var parsedField = notes.parseSearchQuery('campo:PV=12 field:SAN');
  assertEq(parsedField.fields.length, 2, 'parse extrai dois filtros de campo');
  assertEq(parsedField.fields[0].key, 'pv', 'parse normaliza chave (lowercase)');
  assertEq(parsedField.fields[0].value, '12', 'parse extrai valor');
  assertEq(parsedField.fields[1].value, null, 'campo sem = tem valor null');

  // ── Export ────────────────────────────────────────────────────────────────
  group('Keeper Notes — export Markdown');
  wipe();

  var exp = notes.create('Nota Exportável', 'Conteúdo da nota.', null, ['tag1']);
  notes.create('Referenciadora', 'Veja [[Nota Exportável]].');
  var md = notes.exportMarkdown(exp.id);
  assert(md.indexOf('# Nota Exportável') === 0, 'export começa com título H1');
  assert(md.indexOf('Conteúdo da nota.') !== -1, 'export inclui conteúdo');
  assert(md.indexOf('tag1') !== -1, 'export inclui tags');
  assert(md.indexOf('Referenciadora') !== -1, 'export inclui backlinks');

  wipe();
})();
