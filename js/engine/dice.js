/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/engine/dice.js
   Engine de Dados — Chamado de Cthulhu 7E
   Atribui a window.CoC.dice — sem fetch, sem dependências
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {

  // ─── Utilitários básicos ───────────────────────────────────────────────
  const half  = (v) => Math.floor(v / 2);
  const fifth = (v) => Math.floor(v / 5);

  /**
   * Fração aleatória em [0,1) via RNG criptográfico (crypto.getRandomValues).
   * Melhor uniformidade que Math.random e mais resistente a manipulação.
   * Fallback para Math.random em ambientes sem Web Crypto — offline-first:
   * a rolagem nunca pode quebrar.
   * @returns {number}
   */
  function randomFraction() {
    try {
      const a = new Uint32Array(1);
      (self.crypto || self.msCrypto).getRandomValues(a);
      return a[0] / (0xffffffff + 1);
    } catch (e) {
      return Math.random();
    }
  }

  /**
   * Rola 1 dado de N lados (1..sides).
   * @param {number} sides
   * @returns {number}
   */
  function rollDie(sides) {
    return Math.floor(randomFraction() * sides) + 1;
  }

  /**
   * Rola NdS (N dados de S lados). Retorna a soma.
   * @param {number} n
   * @param {number} sides
   * @returns {number}
   */
  function rollDice(n, sides) {
    let total = 0;
    for (let i = 0; i < n; i++) total += rollDie(sides);
    return total;
  }

  /**
   * Rola 1D100 com suporte a Bônus / Penalidade (regra 7E).
   *
   * @param {string|null} bp - null | "bonus" | "penalty"
   *   bonus:    rola 2 dados de dezena, usa o MENOR
   *   penalty:  rola 2 dados de dezena, usa o MAIOR
   *
   * @returns {{ value: number, units: number, tens: number, tensCandidates: number[], bp: string|null }}
   */
  function rollD100(bp = null) {
    const units  = rollDie(10) - 1;          // 0-9
    const tensA  = rollDie(10) - 1;          // 0-9
    let tens, tensCandidates;

    if (bp === "bonus" || bp === "penalty") {
      const tensB = rollDie(10) - 1;
      // Calcular o valor final de cada dezena candidata antes de escolher,
      // respeitando a regra 00+0=100 (dezena 0 com unidade 0 vale 100).
      const valA = (tensA === 0 && units === 0) ? 100 : (tensA * 10 + units);
      const valB = (tensB === 0 && units === 0) ? 100 : (tensB * 10 + units);
      tens = bp === "bonus"
        ? (valA <= valB ? tensA : tensB)   // menor valor final → dezena favorável
        : (valA >= valB ? tensA : tensB);  // maior valor final → dezena desfavorável
      tensCandidates = [tensA, tensB];
    } else {
      tens = tensA;
      tensCandidates = [tensA];
    }

    // 00,0 = 100 (regra clássica do D100)
    const value = (tens === 0 && units === 0) ? 100 : (tens * 10 + units);

    return { value, units, tens, tensCandidates, bp: bp || null };
  }

  /**
   * Classifica o resultado de 1D100 contra um valor de perícia (CoC 7E).
   *
   * Crítico:   d100 === 1
   * Extremo:   d100 ≤ skill/5  (arredondado para baixo)
   * Sólido:    d100 ≤ skill/2
   * Regular:   d100 ≤ skill
   * Falha:     d100 >  skill
   * Fumble:    d100 === 100 (sempre, com skill 50+)
   *            d100 ≥ 96    (com skill < 50)
   *
   * @param {number} d100   - 1..100
   * @param {number} skill  - valor da perícia
   * @returns {"crit"|"extreme"|"hard"|"regular"|"fail"|"fumble"}
   */
  function classifyRoll(d100, skill) {
    if (d100 === 1) return "crit";
    const fumbleAt = skill < 50 ? 96 : 100;
    if (d100 >= fumbleAt) return "fumble";  // fumble tem prioridade sobre extreme/regular abaixo
    if (d100 <= fifth(skill)) return "extreme";
    if (d100 <= half(skill))  return "hard";
    if (d100 <= skill)        return "regular";
    return "fail";
  }

  /**
   * Avalia uma rolagem de d100 considerando a dificuldade escolhida.
   * Ponto de entrada único para toda avaliação de sucesso/falha — as views
   * não devem calcular target ou chamar classifyRoll diretamente.
   *
   * @param {number} d100       - 1..100
   * @param {number} value      - valor da perícia/atributo
   * @param {string} difficulty - "regular" | "hard" | "extreme"
   * @returns {{ level: string, target: number, met: boolean }}
   *   level  = tier natural (crit/extreme/hard/regular/fail/fumble)
   *   target = alvo numérico ajustado pela dificuldade
   *   met    = true se o tier natural satisfaz a dificuldade exigida
   */
  function gradeRoll(d100, value, difficulty) {
    if (difficulty == null) difficulty = "regular";
    const target = difficulty === "hard"    ? half(value)  :
                   difficulty === "extreme" ? fifth(value) : value;
    const level = classifyRoll(d100, value);
    const met   = meetsDifficulty(difficulty, level);
    return { level, target, met };
  }

  /**
   * Compara o resultado contra um nível de dificuldade alvo (escolhido pelo Guardião).
   * Retorna true se o resultado bate a dificuldade.
   *
   * @param {string} level - "regular" | "hard" | "extreme"
   * @param {string} resultLevel - resultado de classifyRoll
   */
  function meetsDifficulty(level, resultLevel) {
    const rank = { crit: 5, extreme: 4, hard: 3, regular: 2, fail: 1, fumble: 0 };
    const needed = { regular: 2, hard: 3, extreme: 4 }[level] || 2;
    return rank[resultLevel] >= needed;
  }

  /**
   * Labels em PT-BR para os níveis de resultado.
   */
  const LEVEL_LABELS = {
    crit:    "CRÍTICO",
    extreme: "EXTREMO",
    hard:    "SÓLIDO",
    regular: "REGULAR",
    fail:    "FALHA",
    fumble:  "FUMBLE"
  };

  /**
   * Parser de notação de dados:
   *   "1D6"       → rola 1d6
   *   "2D6+3"     → rola 2d6, soma 3
   *   "1D10+DB"   → rola 1d10, soma o DB (precisa ser substituído antes)
   *   "4D6"       → rola 4d6
   *   "1D4+2+DB"  → 1d4+2+DB
   *
   * Substitui +DB, -DB, +db etc por uma string fornecida em `dbValue`.
   *
   * @param {string} notation
   * @param {string|number} dbValue - opcional, dano bônus já como string ("+1D4", "-2", "0")
   * @returns {{ total: number, rolls: Array<{n:number, sides:number, result:number, dice:number[]}>, expression: string }}
   */
  function rollNotation(notation, dbValue = "0") {
    if (notation == null) return { total: 0, rolls: [], expression: "" };
    let expr = String(notation).trim().toUpperCase().replace(/\s+/g, "");

    // Substitui +DB / -DB / DB pelo valor passado
    expr = expr.replace(/([+-]?)DB/g, (_, sign) => {
      if (!sign && dbValue.toString().match(/^[+-]/)) return dbValue.toString();
      const v = dbValue.toString().replace(/^[+]/, "");
      return (sign || "+") + v;
    });

    // Captura todos os blocos: NdM, +N, -N
    const tokens = expr.match(/[+-]?\d*D\d+|[+-]?\d+/gi) || [];
    let total = 0;
    const rolls = [];

    for (let tok of tokens) {
      tok = tok.trim();
      if (!tok) continue;
      const sign = tok.startsWith("-") ? -1 : +1;
      tok = tok.replace(/^[+-]/, "");

      if (tok.includes("D")) {
        const [nStr, sStr] = tok.split("D");
        const n = parseInt(nStr || "1", 10);
        const sides = parseInt(sStr, 10);
        if (isNaN(n) || isNaN(sides) || sides < 1) continue;
        const dice = [];
        let subtotal = 0;
        for (let i = 0; i < n; i++) {
          const r = rollDie(sides);
          dice.push(r);
          subtotal += r;
        }
        total += sign * subtotal;
        rolls.push({ n, sides, result: sign * subtotal, dice });
      } else {
        const v = parseInt(tok, 10);
        if (!isNaN(v)) total += sign * v;
      }
    }

    return { total, rolls, expression: expr };
  }

  /**
   * Rola dano de uma arma (atalho de rollNotation com nome de arma).
   * Substitui "+DB" pelo bônus do personagem se fornecido.
   *
   * Empala (PDF Cap. 6, p. 104): dano MÁXIMO da arma + dano MÁXIMO do DB
   * + UMA rolagem extra de dano da arma (sem DB).
   * Ex. do livro: arma 1D4, DB +1D4 → 4 + 4 + 1D4 = faixa 9–12.
   * (A versão anterior parava no máximo — faltava a rolagem extra.)
   */
  function rollDamage(weaponDamageString, db = "0", impale = false, armor = 0) {
    armor = Math.max(0, Number(armor) || 0);

    if (impale) {
      // Parte 1 — máximo de arma + DB: rola a notação só para obter a estrutura
      // (dados + constantes já com o DB substituído) e re-totaliza no máximo.
      const maxPart = rollNotation(weaponDamageString, db);
      let max = 0;
      for (const r of maxPart.rolls) {
        max += (r.n * r.sides) * (r.result < 0 ? -1 : 1);
      }
      // Constantes exatas por diferença (total = soma dos dados + constantes).
      // Cobre DB plano ("-2"), constante inicial sem sinal e dados multi-dígito
      // ("+10D6") — casos em que o regex antigo falhava ou perdia termos.
      const diceSum = maxPart.rolls.reduce((acc, r) => acc + r.result, 0);
      const constants = maxPart.total - diceSum;

      // Parte 2 — rolagem extra da arma (DB zerado: o bônus não rola de novo).
      const extra = rollNotation(weaponDamageString, "0");

      const rawTotal = max + constants + extra.total;
      return {
        total: Math.max(0, rawTotal - armor),
        rolls: extra.rolls,   // dados exibíveis = só a rolagem extra (o resto é máximo fixo)
        expression: "MÁX(" + maxPart.expression + ") + " + extra.expression,
        impale: true,
        maxDamage: max + constants,
        extraRoll: extra.total,
        ...(armor > 0 ? { armor, totalBeforeArmor: rawTotal } : {})
      };
    }

    const result = rollNotation(weaponDamageString, db);
    if (armor > 0) {
      return {
        ...result,
        totalBeforeArmor: result.total,
        total: Math.max(0, result.total - armor),
        armor
      };
    }
    return result;
  }

  /**
   * Atalho: rola 3D6 (atributos comuns) ou 2D6+6 (atributos altos), multiplicado por 5.
   * @param {"3d6x5"|"2d6+6x5"} formula
   * @returns {{ total: number, raw: number[], rawSum: number, formula: string }}
   */
  function rollAttribute(formula) {
    if (formula === "2d6+6x5") {
      const raw = [rollDie(6), rollDie(6)];
      const rawSum = raw[0] + raw[1] + 6;
      return { total: rawSum * 5, raw, rawSum, formula };
    }
    // default: 3d6x5
    const raw = [rollDie(6), rollDie(6), rollDie(6)];
    const rawSum = raw[0] + raw[1] + raw[2];
    return { total: rawSum * 5, raw, rawSum, formula: "3d6x5" };
  }

  // ─── Expor no namespace global ─────────────────────────────────────────
  window.CoC.dice = {
    rollDie,
    rollDice,
    rollD100,
    classifyRoll,
    meetsDifficulty,
    gradeRoll,
    rollNotation,
    rollDamage,
    rollAttribute,
    half,
    fifth,
    LEVEL_LABELS
  };

})();
