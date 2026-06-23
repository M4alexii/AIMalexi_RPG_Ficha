/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/tests/test-storage-migrations.js
   Cobertura de js/engine/storage.js → runMigrations() (v0 → v3).

   runMigrations() é PURA (objeto entra, objeto migrado in-place sai) e exportada
   em window.CoC.storage.runMigrations. Em Node, o backend de storage.js cai para
   "memory" (sem IndexedDB/localStorage), então só exercitamos a migração — sem I/O.

   Trava de regressão para o bug v2→v3 já ocorrido: rename de perícias em
   occupationSkills (perícias livres da ocupação orfanavam → pontos viravam
   Interesse Pessoal). Ver DIRETRIZ_OFICIAL_V1 e AUDITORIA_CODIGO_2026-06-16.

   Carregado por runner.js (assert, assertEq, group como globais).
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

const _storage = window.CoC.storage;
const _rm = _storage.runMigrations;

// ── API e versão ────────────────────────────────────────────────────────────
group('storage migrations — API e versão');
assert(typeof _rm === 'function', 'runMigrations exportado em CoC.storage');
assertEq(_storage.SAVE_SCHEMA_VERSION, 3, 'SAVE_SCHEMA_VERSION === 3');

// ── Entrada não-objeto retorna como recebido (sem lançar) ─────────────────────
group('storage migrations — entrada não-objeto retorna como recebido');
assertEq(_rm(null), null, 'null → null');
assertEq(_rm(undefined), undefined, 'undefined → undefined');
assertEq(_rm(42), 42, 'número → mesmo número');

// ── v0 → carimba versão cumulativa ────────────────────────────────────────────
group('storage migrations — v0 carimba versão até a corrente');
const _v0 = {};
_rm(_v0);
assertEq(_v0._schemaVersion, 3, 'objeto sem versão migra até v3');

const _already = { _schemaVersion: 3, skills: { 'Nadar': { value: 50 } } };
_rm(_already);
assertEq(_already._schemaVersion, 3, 'objeto já em v3 permanece v3');
assert(_already.skills['Nadar'] && _already.skills['Nadar'].value === 50,
  'v3: blocos não re-executam (Nadar preservado, sem rename)');

// ── v1 → v2 cria occupationSkills ─────────────────────────────────────────────
group('storage migrations — v1 → v2 cria occupationSkills');
const _v1 = { _schemaVersion: 1, investigator: { name: 'X' } };
_rm(_v1);
assert(Array.isArray(_v1.occupationSkills), 'investigador ganha occupationSkills []');
assertEq(_v1.occupationSkills.length, 0, 'occupationSkills começa vazio');

const _v1b = { _schemaVersion: 1, investigator: { name: 'Y' }, occupationSkills: ['Furtividade'] };
_rm(_v1b);
assertEq(_v1b.occupationSkills.length, 1, 'occupationSkills existente preservado');
assertEq(_v1b.occupationSkills[0], 'Furtividade', 'conteúdo de occupationSkills preservado');

// ── v2 → v3 rename de perícia (ficha = objeto) ────────────────────────────────
group('storage migrations — v2 → v3 rename de perícia (ficha objeto)');
const _v2 = { _schemaVersion: 2, skills: { 'Nadar': { value: 40 } } };
_rm(_v2);
assert(_v2.skills['Natação'] && _v2.skills['Natação'].value === 40, 'Nadar → Natação (valor preservado)');
assert(!_v2.skills['Nadar'], 'chave antiga "Nadar" removida');

// colisão (dois nomes antigos → mesmo novo): mantém o MAIOR valor
const _col = { _schemaVersion: 2, skills: { 'Pesquisar Bibliotecas': { value: 40 }, 'Usar Bibliotecas': { value: 65 } } };
_rm(_col);
assertEq(_col.skills['Usar Bibliotecas'].value, 65, 'colisão: mantém maior (65 > 40)');
assert(!_col.skills['Pesquisar Bibliotecas'], 'chave antiga removida na colisão');

const _col2 = { _schemaVersion: 2, skills: { 'Pesquisar Bibliotecas': { value: 70 }, 'Usar Bibliotecas': { value: 50 } } };
_rm(_col2);
assertEq(_col2.skills['Usar Bibliotecas'].value, 70, 'colisão inversa: antigo maior vence (70)');

// ── v2 → v3 perícia de criatura (array) e ref de arma ─────────────────────────
group('storage migrations — v2 → v3 criatura (array) e ref de arma');
const _crt = { _schemaVersion: 2, skills: [{ name: 'Nadar', value: 30 }] };
_rm(_crt);
assertEq(_crt.skills[0].name, 'Natação', 'criatura: skill em array renomeado');

const _wpn = { _schemaVersion: 2, weapons: [{ skill: 'Nadar' }] };
_rm(_wpn);
assertEq(_wpn.weapons[0].skill, 'Natação', 'arma: ref de perícia renomeada');

// ── v2 → v3 occupationSkills rename (REGRESSÃO do bug de distribuição) ─────────
group('storage migrations — v2 → v3 occupationSkills rename (regressão)');
const _occ = { _schemaVersion: 2, occupationSkills: ['Nadar', 'Pesquisar Bibliotecas', 'Furtividade'] };
_rm(_occ);
assertEq(_occ.occupationSkills[0], 'Natação', 'occupationSkills[0] Nadar → Natação');
assertEq(_occ.occupationSkills[1], 'Usar Bibliotecas', 'occupationSkills[1] Pesquisar Bibliotecas → Usar Bibliotecas');
assertEq(_occ.occupationSkills[2], 'Furtividade', 'occupationSkills[2] sem rename preservado');

// ── v2 → v3 creditRating → perícia "Nível de Crédito" ─────────────────────────
group('storage migrations — v2 → v3 creditRating vira perícia');
const _cr = { _schemaVersion: 2, finances: { creditRating: 55, cash: 100 }, skills: {} };
_rm(_cr);
assert(_cr.skills['Nível de Crédito'] && _cr.skills['Nível de Crédito'].value === 55,
  'creditRating → perícia "Nível de Crédito" (55)');
assert(_cr.finances.creditRating === undefined, 'creditRating removido de finances');
assertEq(_cr.finances.cash, 100, 'cash (carteira) preservado');

// ── v2 → v3 rótulo do Mythos ──────────────────────────────────────────────────
group('storage migrations — v2 → v3 rótulo do Mythos');
const _myth = { _schemaVersion: 2, derived: { Mitos: { value: 0 } } };
_rm(_myth);
assertEq(_myth.derived.Mitos.label, 'Mythos de Cthulhu', 'rótulo do Mythos normalizado');

// ── Idempotência (rodar 2×) ───────────────────────────────────────────────────
group('storage migrations — idempotência (rodar 2×)');
const _idem = {
  _schemaVersion: 2,
  skills: { 'Nadar': { value: 40 } },
  occupationSkills: ['Nadar'],
  weapons: [{ skill: 'Nadar' }]
};
_rm(_idem);
const _afterFirst = JSON.stringify(_idem);
_rm(_idem);
assertEq(JSON.stringify(_idem), _afterFirst, 'segunda passada é no-op (idempotente)');
assert(_idem.skills['Natação'] && _idem.skills['Natação'].value === 40 && !_idem.skills['Nadar'],
  'estado final de perícias correto após 2×');
assertEq(_idem.occupationSkills[0], 'Natação', 'occupationSkills final correto após 2×');
assertEq(_idem.weapons[0].skill, 'Natação', 'arma final correta após 2×');
