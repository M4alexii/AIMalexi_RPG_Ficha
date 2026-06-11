/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/core/schema.js
   Normalização e validação estrutural do objeto personagem.

   normalizeCharacter(raw) → character com defaults preenchidos + schemaWarnings.
   Nunca lança — degrada graciosamente e documenta desvios em _meta.schemaWarnings.
   Campos desconhecidos são preservados (forward-compat).
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {

  const ATTR_KEYS       = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU', 'Sorte'];
  const ARRAY_SECTIONS  = ['weapons', 'equipment', 'inventory', 'journal', 'spells', 'tomes', 'occupationSkills'];
  const OBJECT_SECTIONS = ['skills', 'pointsAllocation', 'finances', 'background', 'status'];

  // Identidade do investigador — campos textuais que NUNCA devem sumir num import.
  const ID_TEXT_FIELDS  = ['name', 'playerName', 'occupation', 'age', 'sex',
                           'residence', 'birthplace', 'pronouns', 'tagline'];
  // Campos de antecedentes que a UI trata como texto multi-linha, mas que saves
  // antigos guardavam como array (ex.: meaningfulLocations: [..]). Sem coerção, o
  // binding de input mistura vírgulas e corrompe/perde a informação pessoal.
  const BG_TEXT_FIELDS  = ['description', 'ideology', 'significantPeople', 'meaningfulLocations',
                           'treasuredPossessions', 'traits', 'injuriesScars', 'phobiasManias',
                           'tomes', 'encounters', 'hobbies', 'convictions'];

  function _uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /**
   * Normaliza um objeto personagem carregado do storage.
   *
   * Garantias:
   *   - Nunca muta `raw` (clona antes de qualquer operação).
   *   - Preenche defaults para seções ausentes.
   *   - Coerce types incorretos com aviso em _meta.schemaWarnings.
   *   - Preserva campos desconhecidos intactos.
   *
   * @param {object|null} raw
   * @returns {object} personagem normalizado com _meta.schemaWarnings[]
   */
  function normalizeCharacter(raw) {
    const warnings = [];
    const warn = function (msg) { warnings.push(msg); };

    if (raw == null) {
      warn('input null/undefined — returning minimal character');
      raw = {};
    }

    // Clone antes de qualquer mutação
    const c = JSON.parse(JSON.stringify(raw));

    // ── _meta ─────────────────────────────────────────────────────────────
    if (!c._meta || typeof c._meta !== 'object' || Array.isArray(c._meta)) {
      if (c._meta != null) warn('_meta invalid type — reset to {}');
      c._meta = {};
    }
    if (c._meta.createdAt === undefined) c._meta.createdAt = null;
    if (c._meta.updatedAt === undefined) c._meta.updatedAt = null;
    if (!c._meta.version) c._meta.version = '1.0.0';
    // Moldura/forma do retrato (visual, por personagem) — coage a valores válidos
    const VALID_FRAMES = ['', 'investigador', 'ocultista', 'militar', 'academico'];
    const VALID_SHAPES = ['', 'token', 'silhueta'];
    if (c._meta.avatarFrame !== undefined && !VALID_FRAMES.includes(c._meta.avatarFrame)) {
      warn('_meta.avatarFrame "' + c._meta.avatarFrame + '" inválido — reset');
      c._meta.avatarFrame = '';
    }
    if (c._meta.avatarShape !== undefined && !VALID_SHAPES.includes(c._meta.avatarShape)) {
      warn('_meta.avatarShape "' + c._meta.avatarShape + '" inválido — reset');
      c._meta.avatarShape = '';
    }

    // ── attributes ────────────────────────────────────────────────────────
    if (!c.attributes || typeof c.attributes !== 'object' || Array.isArray(c.attributes)) {
      warn('attributes missing or invalid — reset to defaults');
      c.attributes = {};
    }
    for (const key of ATTR_KEYS) {
      if (c.attributes[key] == null) {
        c.attributes[key] = { value: 0 };
      } else if (typeof c.attributes[key] !== 'object' || Array.isArray(c.attributes[key])) {
        warn('attributes.' + key + ' invalid type — reset to { value: 0 }');
        c.attributes[key] = { value: 0 };
      } else {
        const v = Number(c.attributes[key].value);
        if (isNaN(v)) {
          warn('attributes.' + key + '.value "' + c.attributes[key].value + '" coerced to 0');
          c.attributes[key].value = 0;
        } else {
          c.attributes[key].value = v;
        }
      }
    }

    // ── derived ───────────────────────────────────────────────────────────
    if (!c.derived || typeof c.derived !== 'object' || Array.isArray(c.derived)) {
      warn('derived missing or invalid — reset to defaults');
      c.derived = {};
    }

    if (!c.derived.PV || typeof c.derived.PV !== 'object' || Array.isArray(c.derived.PV)) {
      warn('derived.PV missing — reset to { value: 0, current: 0 }');
      c.derived.PV = { value: 0, current: 0 };
    } else {
      c.derived.PV.value   = Number(c.derived.PV.value)   || 0;
      if (c.derived.PV.current == null) c.derived.PV.current = c.derived.PV.value;
    }

    if (!c.derived.PM || typeof c.derived.PM !== 'object' || Array.isArray(c.derived.PM)) {
      warn('derived.PM missing — reset to { value: 0, current: 0 }');
      c.derived.PM = { value: 0, current: 0 };
    } else {
      c.derived.PM.value   = Number(c.derived.PM.value)   || 0;
      if (c.derived.PM.current == null) c.derived.PM.current = c.derived.PM.value;
    }

    if (!c.derived.SAN || typeof c.derived.SAN !== 'object' || Array.isArray(c.derived.SAN)) {
      warn('derived.SAN missing — reset to { value: 0, current: 0, max: 99 }');
      c.derived.SAN = { value: 0, current: 0, max: 99 };
    } else {
      c.derived.SAN.value   = Number(c.derived.SAN.value)   || 0;
      if (c.derived.SAN.current == null) c.derived.SAN.current = c.derived.SAN.value;
      if (c.derived.SAN.max   == null)   c.derived.SAN.max     = 99;
    }

    // ── array sections ────────────────────────────────────────────────────
    for (var i = 0; i < ARRAY_SECTIONS.length; i++) {
      const field = ARRAY_SECTIONS[i];
      if (!Array.isArray(c[field])) {
        if (c[field] != null) warn(field + ' was not an array — reset to []');
        c[field] = [];
      }
    }

    // ── weapons: garantir .id em cada entrada (migration de registros legados) ─
    for (var k = 0; k < c.weapons.length; k++) {
      if (c.weapons[k] && typeof c.weapons[k] === 'object' && !c.weapons[k].id) {
        c.weapons[k].id = _uuid();
        warn('weapons[' + k + '] sem .id — UUID atribuído');
      }
    }

    // ── object sections ───────────────────────────────────────────────────
    for (var j = 0; j < OBJECT_SECTIONS.length; j++) {
      const field2 = OBJECT_SECTIONS[j];
      if (c[field2] == null || typeof c[field2] !== 'object' || Array.isArray(c[field2])) {
        if (c[field2] != null) warn(field2 + ' invalid type — reset to {}');
        c[field2] = {};
      }
    }

    // ── investigator (identidade) ─────────────────────────────────────────────
    // Fora de OBJECT_SECTIONS de propósito: precisa de coerção de campo, não de
    // reset total. Garante objeto + campos textuais como string (sem perder valor).
    if (!c.investigator || typeof c.investigator !== 'object' || Array.isArray(c.investigator)) {
      if (c.investigator != null) warn('investigator invalid type — reset to {}');
      c.investigator = {};
    }
    for (var ti = 0; ti < ID_TEXT_FIELDS.length; ti++) {
      var idf = ID_TEXT_FIELDS[ti];
      var idv = c.investigator[idf];
      if (idv == null) { c.investigator[idf] = ''; }
      else if (typeof idv !== 'string') {
        c.investigator[idf] = String(idv);
        warn('investigator.' + idf + ' coerced to string');
      }
    }

    // ── background: coagir campos texto que podem ter vindo como array ─────────
    // c.background já é objeto (OBJECT_SECTIONS acima). Array → texto multi-linha.
    for (var bi = 0; bi < BG_TEXT_FIELDS.length; bi++) {
      var bf = BG_TEXT_FIELDS[bi];
      var bv = c.background[bf];
      if (bv == null) continue;            // ausente: UI usa '' — não cria warning
      if (Array.isArray(bv)) {
        c.background[bf] = bv
          .filter(function (x) { return x != null && x !== ''; })
          .join('\n');
        warn('background.' + bf + ' era array — convertido para texto multi-linha');
      } else if (typeof bv !== 'string') {
        c.background[bf] = String(bv);
        warn('background.' + bf + ' coerced to string');
      }
    }

    // ── bodySlots (#11) — slots corporais do investigador ────────────────────
    // Estrutura: { slotId: item | item[] | null }
    // Não está em OBJECT_SECTIONS para evitar reset total; defaults pontuais apenas.
    if (!c.bodySlots || typeof c.bodySlots !== 'object' || Array.isArray(c.bodySlots)) {
      c.bodySlots = {};
    }
    // Garantir que acessorios seja sempre array
    if (c.bodySlots.acessorios != null && !Array.isArray(c.bodySlots.acessorios)) {
      c.bodySlots.acessorios = [c.bodySlots.acessorios];
    }

    // ── attach warnings (sempre sobrescreve — lista fresca a cada normalização) ─
    c._meta.schemaWarnings = warnings;

    return c;
  }

  window.CoC.schema = Object.freeze({ normalizeCharacter });

})();
