/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/tests/test-data-integrity.js
   Regressão de integridade de dados no carregamento/importação (Fase 1, B1).

   Garante que normalizeCharacter NUNCA perde as informações pessoais do
   investigador e que campos de background legados (array) são coagidos para
   texto multi-linha em vez de serem corrompidos pelo binding de input.

   Fixtures inspiradas nos saves reais enviados:
   - "Sem_rosto": background.meaningfulLocations/traits/etc. como ARRAY
   - "janniehendrik": os mesmos campos como STRING vazia
   Ambos devem normalizar para o MESMO formato (string), sem warnings de perda.

   Carregado por runner.js (assert/assertEq/group globais).
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

const _normalize = window.CoC.schema.normalizeCharacter;

// ─────────────────────────────────────────────────────────────────────────────
//  Identidade do investigador nunca some
// ─────────────────────────────────────────────────────────────────────────────
group('data-integrity — identidade do investigador preservada');

const _withIdentity = {
  investigator: {
    name: 'Klein Moretti',
    playerName: 'Malexi',
    occupation: 'Personalizada',
    age: '31',
    sex: 'Masculino',
    residence: 'Tingen, Reino de Loen',
    birthplace: 'Reino de Loen',
    pronouns: 'Ele/Dele',
    tagline: 'A informação é mais valiosa que a força.',
    portraitId: 'mq32yo2p-8841z',
    bannerId: null
  },
  attributes: { FOR: { value: 40 } },
  derived: {
    PV:  { value: 10, current: 10 },
    PM:  { value: 8,  current: 8 },
    SAN: { value: 50, current: 50, max: 99 }
  },
  background: {}
};

const _id = _normalize(_withIdentity);
assertEq(_id.investigator.name,        'Klein Moretti',                       'name preservado');
assertEq(_id.investigator.playerName,  'Malexi',                              'playerName preservado');
assertEq(_id.investigator.age,         '31',                                  'age preservado');
assertEq(_id.investigator.residence,   'Tingen, Reino de Loen',               'residence preservado');
assertEq(_id.investigator.tagline,     'A informação é mais valiosa que a força.', 'tagline preservado');
assertEq(_id.investigator.portraitId,  'mq32yo2p-8841z',                      'portraitId (campo fora da lista) preservado');
assertEq(_id._meta.schemaWarnings.length, 0,                                  'identidade válida → zero warnings');

// ─────────────────────────────────────────────────────────────────────────────
//  Investigator ausente / tipo inválido → objeto com campos string
// ─────────────────────────────────────────────────────────────────────────────
group('data-integrity — investigator ausente/inválido');

const _noInv = _normalize({
  attributes: {},
  derived: { PV: { value: 0, current: 0 }, PM: { value: 0, current: 0 }, SAN: { value: 0, current: 0, max: 99 } },
  background: {}
});
assertEq(typeof _noInv.investigator,        'object', 'investigator ausente → objeto criado');
assertEq(_noInv.investigator.name,          '',       'investigator.name ausente → string vazia');
assertEq(_noInv.investigator.playerName,    '',       'investigator.playerName ausente → string vazia');
assert(_noInv._meta.schemaWarnings.length === 0,      'investigator ausente não gera warning (sem perda)');

const _badInv = _normalize({ investigator: ['lista', 'errada'], attributes: {}, background: {} });
assertEq(typeof _badInv.investigator, 'object',         'investigator array → reset para objeto');
assert(_badInv._meta.schemaWarnings.some(function (w) { return /investigator invalid type/.test(w); }),
       'investigator tipo inválido → warning registrado');

// Campo numérico vira string sem perder o valor
const _numAge = _normalize({ investigator: { age: 42 }, attributes: {}, background: {} });
assertEq(_numAge.investigator.age, '42', 'investigator.age numérico → coagido para string "42"');

// ─────────────────────────────────────────────────────────────────────────────
//  Background como array (legado) → texto multi-linha (sem corrupção)
// ─────────────────────────────────────────────────────────────────────────────
group('data-integrity — background array → texto multi-linha');

const _arrayBg = _normalize({
  investigator: { name: 'Sem Rosto' },
  attributes: {},
  background: {
    description: 'Conceito Central',
    meaningfulLocations: ['Companhia de Segurança Blackthorn', 'Residência dos Moretti', 'Tingen'],
    treasuredPossessions: ['Baralho de Tarô', 'Diário da transmigração', 'Relógio de bolso'],
    traits: ['Racional', 'Observador', 'Curioso', 'Cauteloso'],
    injuriesScars: ['Marca do ferimento causado pela transmigração']
  }
});

assertEq(typeof _arrayBg.background.meaningfulLocations, 'string',
         'meaningfulLocations array → string');
assertEq(_arrayBg.background.meaningfulLocations,
         'Companhia de Segurança Blackthorn\nResidência dos Moretti\nTingen',
         'meaningfulLocations → linhas preservadas (sem vírgulas mescladas)');
assertEq(_arrayBg.background.traits, 'Racional\nObservador\nCurioso\nCauteloso',
         'traits array → string multi-linha');
assertEq(_arrayBg.background.description, 'Conceito Central',
         'description string → intacta');
assert(_arrayBg._meta.schemaWarnings.some(function (w) { return /meaningfulLocations era array/.test(w); }),
       'conversão de array gera warning de auditoria');

// ─────────────────────────────────────────────────────────────────────────────
//  Equivalência: array-form e string-form normalizam para o mesmo shape
// ─────────────────────────────────────────────────────────────────────────────
group('data-integrity — array-form e string-form convergem');

const _strBg = _normalize({
  investigator: { name: 'Jannie' },
  attributes: {},
  background: { meaningfulLocations: '', traits: '' }
});
assertEq(typeof _strBg.background.meaningfulLocations, 'string', 'string-form permanece string');
assertEq(_strBg.background.meaningfulLocations, '',              'string vazia preservada');

// Tipos finais idênticos entre as duas formas (contrato estável de UI)
assertEq(typeof _arrayBg.background.traits, typeof _strBg.background.traits,
         'traits: mesmo tipo final (string) para array-form e string-form');

// ─────────────────────────────────────────────────────────────────────────────
//  Round-trip: normalizar duas vezes é idempotente (estável a reload/reimport)
// ─────────────────────────────────────────────────────────────────────────────
group('data-integrity — idempotência (reload/reimport estável)');

const _once  = _normalize(_arrayBg);
const _twice = _normalize(_once);
assertEq(JSON.stringify(_twice.investigator), JSON.stringify(_once.investigator),
         'investigator idêntico após 2ª normalização');
assertEq(_twice.background.meaningfulLocations, _once.background.meaningfulLocations,
         'background estável após 2ª normalização');
assertEq(_twice._meta.schemaWarnings.length, 0,
         '2ª normalização (já saneado) → zero warnings');
