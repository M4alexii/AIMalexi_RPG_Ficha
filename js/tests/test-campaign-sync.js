/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/tests/test-campaign-sync.js
   Fase M (live) — trava o COORDENADOR de persistência durável:
   - mapeamentos puros (snapshot→roster, evento→linha de timeline) usados tanto
     ao vivo quanto no replay do reload;
   - guarda de RLS (evento sagrado de não-host não vai ao banco);
   - resolução de estado (isLive/getCampaignId) sem nunca quebrar a sessão.

   Os mapeamentos puros são o ponto de regressão crítico: o reload do Guardião
   reconstrói roster + histórico a partir DELES.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  group("Campaign Sync — coordenador durável");

  var S = window.CoC.campaign.sync;
  assert(!!S, "campaign.sync presente");

  // ── snapshotToInvestigator — linha do banco → forma do roster ────────────────
  var inv = S.snapshotToInvestigator({
    peer_id: 'p7', player_name: 'Ana', character_name: 'Eleanor',
    vitals: { hp: 9, hpMax: 12, san: 40 }
  });
  assertEq(inv.peerId, 'p7', "snap→inv: peerId");
  assertEq(inv.playerName, 'Ana', "snap→inv: playerName");
  assertEq(inv.characterName, 'Eleanor', "snap→inv: characterName");
  assertEq(inv.status.hp, 9, "snap→inv: vitais viram status");
  assertEq(inv.online, false, "snap→inv: presença começa offline (até retransmitir)");
  assertEq(S.snapshotToInvestigator(null), null, "snap→inv: null seguro");

  // ── formatTraceEntry — evento de domínio → linha de timeline ─────────────────
  var dmg = S.formatTraceEntry({ type: 'APPLY_DAMAGE', payload: { amount: 3 } }, 'Eleanor');
  assertEq(dmg.cls, 'ev-damage', "trace: dano usa classe ev-damage");
  assert(/Eleanor/.test(dmg.text) && /3/.test(dmg.text), "trace: dano cita ator e valor");

  var san = S.formatTraceEntry({ type: 'LOSE_SANITY', payload: { amount: 5 } }, 'Eleanor');
  assertEq(san.cls, 'ev-sanity', "trace: SAN usa classe ev-sanity");

  var roll = S.formatTraceEntry({
    type: 'ROLL_SKILL', payload: { skillName: 'Achar', skillValue: 60, roll: 12, level: 'extreme', met: true }
  }, 'Eleanor');
  assert(/Achar/.test(roll.text), "trace: rolagem cita a perícia");
  assert(/★/.test(roll.text), "trace: nível extremo marca ★");

  var fail = S.formatTraceEntry({ type: 'ROLL_SKILL', payload: { skillName: 'Saltar', roll: 95, level: 'fail', met: false } }, 'X');
  assert(/✗/.test(fail.text), "trace: falha marca ✗");

  // Escape de HTML no nome do ator (segurança contra injeção via nome).
  var esc = S.formatTraceEntry({ type: 'HEAL_DAMAGE', payload: { amount: 1 } }, '<b>x</b>');
  assert(esc.text.indexOf('&lt;b&gt;') !== -1, "trace: nome do ator é escapado");

  // Tipo desconhecido não quebra (fallback legível).
  var unk = S.formatTraceEntry({ type: 'SOMETHING_NEW', payload: {} }, 'Y');
  assert(/something new/.test(unk.text), "trace: tipo desconhecido vira texto legível");
  assertEq(S.formatTraceEntry(null).cls, 'ev-roll', "trace: entry null seguro");

  // ── Estado sem conexão (degradação graciosa) ─────────────────────────────────
  // O runner é síncrono (process.exit no fim), então testamos de forma síncrona:
  // os métodos devolvem Promise e NUNCA lançam quando o coordenador está desligado.
  assertEq(S.isLive(), false, "isLive() falso antes de conectar");
  assertEq(S.getCampaignId(), null, "getCampaignId() null antes de conectar");

  var threw = false, p1, p2, p3;
  try {
    p1 = S.record({ type: 'ROLL_SKILL', payload: {} });
    p2 = S.snapshot({ peerId: 'p1' });
    p3 = S.rehydrate();
  } catch (e) { threw = true; }
  assert(!threw, "coordenador desligado nunca lança (record/snapshot/rehydrate)");
  assert(p1 && typeof p1.then === 'function', "record devolve Promise");
  assert(p2 && typeof p2.then === 'function', "snapshot devolve Promise");
  assert(p3 && typeof p3.then === 'function', "rehydrate devolve Promise");

  // isEnabled() é falso em Node (sem window.supabase) — não tenta rede nos testes.
  assertEq(S.isEnabled(), false, "isEnabled() falso sem SDK (ambiente de teste)");
})();
