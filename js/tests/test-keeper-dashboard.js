/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/tests/test-keeper-dashboard.js
   Fase D / §15 — trava a matemática PURA dos KPIs executivos do dashboard do
   Guardião: total/online/vivos/enlouquecidos/mortos/SAN crítica. A renderização
   DOM é validada no navegador.

   §15 substituiu as médias genéricas (SAN/PV média) por métricas executivas
   (vivos/enlouquecidos/mortos) — este teste reflete esse contrato atual.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  group("Keeper Dashboard — KPIs executivos (puro)");

  var K = window.CoC.keeperOverview.computeInvestigatorKpis;

  var invs = {
    p1: { characterName: 'A', online: true,  status: { hp: 10, hpMax: 12, san: 60, sanMax: 80, mp: 5 } },
    p2: { characterName: 'B', online: false, status: { hp: 0,  hpMax: 11, san: 10, sanMax: 70, mp: 3 } },
    p3: { characterName: 'C', online: true,  status: { hp: 8,  hpMax: 9,  san: 5,  sanMax: 60, mp: 2 } }
  };
  var k = K(invs);
  assertEq(k.total,  3, "total = 3");
  assertEq(k.online, 2, "online = 2");
  assertEq(k.alive,  2, "vivos = 2 (hp > 0: p1, p3; p2 com hp=0 não)");
  assertEq(k.dead,   1, "mortos = 1 (p2 hp=0)");
  assertEq(k.insane, 0, "enlouquecidos = 0 (nenhum com SAN=0 nem flag)");
  // crítica: san>0 e san <= 20% do sanMax → p2 (10<=14) e p3 (5<=12); p1 (60<=16) não.
  assertEq(k.critical.length, 2, "2 investigadores em SAN crítica");

  // Enlouquecido: SAN == 0 conta como enlouquecido (regra CoC: SAN 0 → loucura)
  var kInsane = K({ z: { online: true, status: { hp: 5, hpMax: 10, san: 0, sanMax: 60 } } });
  assertEq(kInsane.insane, 1, "SAN = 0 → enlouquecido");

  var e = K({});
  assertEq(e.total,  0, "vazio: total 0");
  assertEq(e.online, 0, "vazio: online 0");
  assertEq(e.alive,  0, "vazio: vivos 0");
  assertEq(e.dead,   0, "vazio: mortos 0");
  assertEq(e.critical.length, 0, "vazio: nenhum crítico");

  // tolerante a status ausente: conta no total; não é morto (ausência ≠ morte)
  var k2 = K({ x: { online: true } });
  assertEq(k2.total, 1, "sem status: conta no total");
  assertEq(k2.dead,  0, "sem status: hp ausente não é morte");
})();
