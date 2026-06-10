/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/tests/test-minimd.js
   Suíte do mini-md (js/shared/mini-md.js) — renderizador Markdown SEGURO
   usado nas anotações do Diário do Guardião (estilo Obsidian).

   Invariante de segurança: NENHUM HTML do usuário sobrevive cru — tudo
   passa por escape antes do markup próprio.
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

const md = window.CoC.miniMD;

group('mini-md — segurança (escape SEMPRE, sem exceção)');

(function () {
  const xss = md.render('<script>alert(1)</script> <img src=x onerror=alert(2)>');
  assert(xss.indexOf('<script>') === -1, 'tag <script> não sobrevive crua');
  assert(xss.indexOf('<img') === -1, 'tag <img> não sobrevive crua');
  assert(xss.indexOf('&lt;script&gt;') !== -1, 'script aparece escapado');

  // Payload dentro de formatação inline também escapa.
  const inline = md.render('**<b>x</b>** e `<i>y</i>` e > <u>z</u>');
  assert(inline.indexOf('<b>') === -1 && inline.indexOf('<i>') === -1 && inline.indexOf('<u>') === -1,
    'HTML dentro de negrito/código/citação escapa');

  // Wikilink com payload: o resolvedor padrão escapa o título.
  const wl = md.render('[[<script>evil</script>]]');
  assert(wl.indexOf('<script>') === -1, 'título de wikilink malicioso escapa no resolvedor padrão');

  assertEq(md.render(null), '', 'null → string vazia (não lança)');
  assertEq(md.render(''), '', 'vazio → vazio');
})();

group('mini-md — blocos (títulos, listas, citação, régua, checklist)');

(function () {
  assertEq(md.render('# Olá'), '<div class="md-h md-h1">Olá</div>', 'h1');
  assertEq(md.render('## Sub'), '<div class="md-h md-h2">Sub</div>', 'h2');
  assertEq(md.render('### Mini'), '<div class="md-h md-h3">Mini</div>', 'h3');
  assert(md.render('#SemEspaço').indexOf('md-h1') === -1, '# sem espaço NÃO é título');

  assertEq(md.render('---'), '<hr class="md-hr">', 'régua ---');

  const ul = md.render('- um\n- dois');
  assertEq(ul, '<ul class="md-ul"><li>um</li><li>dois</li></ul>', 'lista não-ordenada agrupa itens');

  const ol = md.render('1. um\n2. dois');
  assertEq(ol, '<ol class="md-ol"><li>um</li><li>dois</li></ol>', 'lista ordenada');

  const chk = md.render('- [x] feito\n- [ ] pendente');
  assert(chk.indexOf('md-checklist') !== -1, 'checklist tem classe própria');
  assert(chk.indexOf('md-check done') !== -1, '[x] marca done');
  assert(chk.indexOf('"md-check"') !== -1, '[ ] fica pendente');

  const q = md.render('> linha 1\n> linha 2');
  assertEq(q, '<blockquote class="md-quote">linha 1<br>linha 2</blockquote>', 'citação multi-linha agrupa');

  const p = md.render('linha A\nlinha B\n\nlinha C');
  assertEq(p, '<p class="md-p">linha A<br>linha B</p><p class="md-p">linha C</p>',
    'parágrafos: \\n vira <br>, linha em branco separa');
})();

group('mini-md — inline (negrito, itálico, tachado, código)');

(function () {
  assert(md.render('**forte**').indexOf('<strong>forte</strong>') !== -1, 'negrito');
  assert(md.render('*leve*').indexOf('<em>leve</em>') !== -1, 'itálico');
  assert(md.render('~~não~~').indexOf('<del>não</del>') !== -1, 'tachado');
  assert(md.render('`x = 1`').indexOf('<code class="md-code">x = 1</code>') !== -1, 'código inline');

  // Código protege o miolo: ** dentro de ` ` não vira negrito.
  const prot = md.render('`a ** b` e **c**');
  assert(prot.indexOf('<code class="md-code">a ** b</code>') !== -1, 'asteriscos dentro de código preservados');
  assert(prot.indexOf('<strong>c</strong>') !== -1, 'negrito fora do código funciona');

  // Regressão do placeholder: dígitos soltos no texto não viram código.
  const digits = md.render('tem 3 dados e `um código`');
  assert(digits.indexOf('tem 3 dados') !== -1, 'dígitos do texto intactos (placeholder NUL não colide)');
})();

group('mini-md — wikilinks [[...]]');

(function () {
  const def = md.render('veja [[Mansão Corbitt]]');
  assert(def.indexOf('<span class="md-wikilink">Mansão Corbitt</span>') !== -1,
    'resolvedor padrão: span .md-wikilink');

  // Resolvedor customizado recebe o título CRU (sem entidades).
  let received = null;
  md.render('[[A & B]]', { wikilink: function (t) { received = t; return 'X'; } });
  assertEq(received, 'A & B', 'resolvedor recebe título sem escape (& cru, não &amp;)');

  const multi = md.render('[[Um]] e [[Dois]]');
  assert(multi.indexOf('Um') !== -1 && multi.indexOf('Dois') !== -1, 'múltiplos wikilinks na linha');
})();
