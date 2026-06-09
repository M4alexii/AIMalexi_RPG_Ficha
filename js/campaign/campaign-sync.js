/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/campaign/campaign-sync.js
   Fase M (live) — Coordenador de PERSISTÊNCIA DURÁVEL da campanha.

   Roda AO LADO do transporte Realtime (broadcast), nunca no lugar dele: o
   broadcast continua sendo o caminho vivo de baixa latência; este módulo é o
   lastro durável (Postgres via Supabase) que faz a mesa SOBREVIVER a um reload
   e permite late-join/reconexão reconstruir o estado a partir do banco.

   Princípio de robustez: NADA aqui pode quebrar a sessão viva. Toda chamada de
   rede é tolerante a falha (catch + log); se o banco está fora, o jogo segue só
   no broadcast. RLS: eventos SAGRADOS só o host grava — não enfileiramos o que o
   servidor vai rejeitar.

   Reúso: supabaseAdapter (client/auth/RPC/contrato), persistence (lógica pura
   testada), outbox (fila offline durável).

   Expõe: window.CoC.campaign.sync = {
     // puras (testáveis sem rede)
     snapshotToInvestigator, formatTraceEntry,
     // coordenador (async, tolerante a falha)
     isEnabled, connect, record, snapshot, rehydrate, disconnect,
     getCampaignId, isLive
   }
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC          = window.CoC          || {};
window.CoC.campaign = window.CoC.campaign || {};

(function () {
  'use strict';

  var _sb         = null;   // SupabaseClient dedicado a DB (auth anônimo)
  var _coord      = null;   // instância de campaign-persistence.create()
  var _campaignId = null;   // UUID da campanha no banco (≠ PIN)
  var _peerId     = null;
  var _role       = null;   // 'host' | 'player'

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // ── PURAS: mapeamento banco → UI (sem rede; cobertas por teste) ──────────────

  // Linha de investigator_snapshots → forma de roster do campaign-store.
  // Presença começa offline: só sabemos que está online quando voltar a transmitir.
  function snapshotToInvestigator(snap) {
    if (!snap) return null;
    return {
      peerId:        snap.peer_id,
      playerName:    snap.player_name    || '?',
      characterName: snap.character_name || '?',
      status:        snap.vitals || {},
      online:        false,
      lastSeen:      0
    };
  }

  // Entrada de trace/evento (type+payload) → linha de timeline { text, cls }.
  // Fonte única de formatação: usada tanto ao vivo (keeper-dashboard) quanto no
  // replay durável (rehydrate), para o histórico ler igual nos dois caminhos.
  function formatTraceEntry(entry, actorName) {
    if (!entry || !entry.type) return { text: '', cls: 'ev-roll' };
    var actor = _esc(actorName || '?');
    var p = entry.payload || {};
    function amt(v) { return v != null ? v : '?'; }
    function lvl(level) {
      return ({ critical: 'Crítico', crit: 'Crítico', extreme: 'Extremo', hard: 'Bom',
                regular: 'Regular', fail: 'Falha', fumble: 'Desastre' })[level] || (level || '—');
    }
    function mark(met, level) {
      if (level === 'critical' || level === 'crit' || level === 'extreme') return '★';
      if (level === 'fumble') return '💀';
      return (met === false || level === 'fail') ? '✗' : '✓';
    }
    function diffTag(d) {
      if (!d || d === 'regular') return '';
      return ' [' + (d === 'hard' ? 'Difícil' : d === 'extreme' ? 'Extremo' : d) + ']';
    }

    switch (entry.type) {
      case 'APPLY_DAMAGE':
        return { text: '<b>' + actor + '</b> sofreu ' + amt(p.amount) + ' de dano.', cls: 'ev-damage' };
      case 'LOSE_SANITY':
        return { text: '<b>' + actor + '</b> perdeu ' + amt(p.amount) + ' SAN.', cls: 'ev-sanity' };
      case 'HEAL_DAMAGE':
        return { text: '<b>' + actor + '</b> recuperou ' + amt(p.amount) + ' PV.', cls: 'ev-roll' };
      case 'RECOVER_SANITY':
        return { text: '<b>' + actor + '</b> recuperou ' + amt(p.amount) + ' SAN.', cls: 'ev-sanity' };
      case 'SPEND_MAGIC':
        return { text: '<b>' + actor + '</b> gastou ' + amt(p.amount) + ' PM.', cls: 'ev-magic' };
      case 'ROLL_SKILL':
        return { text: mark(p.met, p.level) + ' <b>' + actor + '</b> · ' + _esc(p.skillName || 'perícia') +
          ' ' + amt(p.skillValue) + '%' + diffTag(p.difficulty) +
          ' → ' + amt(p.roll) + ' (' + _esc(lvl(p.level)) + ')' + (p.pushed ? ' ⟳ forçada' : ''), cls: 'ev-roll' };
      case 'ROLL_ATTRIBUTE':
        return { text: mark(p.met, p.level) + ' <b>' + actor + '</b> · teste de ' + _esc(p.attribute || 'atributo') +
          ' ' + amt(p.result) + '%' + diffTag(p.difficulty) +
          ' → ' + amt(p.roll) + ' (' + _esc(lvl(p.level)) + ')', cls: 'ev-roll' };
      case 'ATTACK_RESOLVED':
        return { text: '<b>' + actor + '</b> ' + (p.hit ? 'acertou' : 'errou') + ' o ataque' +
          (p.level ? ' (' + _esc(lvl(p.level)) + ')' : '') +
          (p.hit && p.damage != null ? ' · ' + p.damage + ' de dano' : '') + '.', cls: 'ev-combat' };
      default:
        return { text: '<b>' + actor + '</b>: ' + _esc(String(entry.type).toLowerCase().replace(/_/g, ' ')), cls: 'ev-roll' };
    }
  }

  // ── Coordenador async ────────────────────────────────────────────────────────

  function isEnabled() {
    var cfg = window.CoC && window.CoC.config;
    return !!(cfg && cfg.useSupabase &&
      typeof window !== 'undefined' && window.supabase &&
      typeof window.supabase.createClient === 'function' &&
      window.CoC.campaign && window.CoC.campaign.supabaseAdapter &&
      window.CoC.campaign.persistence && window.CoC.campaign.outbox);
  }

  function _ensureClient() {
    if (_sb) return _sb;
    var cfg = window.CoC.config;
    _sb = window.CoC.campaign.supabaseAdapter.createClient({
      supabaseUrl: cfg.supabaseUrl, supabaseKey: cfg.supabaseKey
    });
    return _sb;
  }

  function _isSacred(type) {
    var a = window.CoC && window.CoC.actions;
    return !!(a && typeof a.isSacred === 'function' && a.isSacred(type));
  }

  // Retoma o seq do peer a partir do banco (reconexão) — senão um seq reiniciado
  // colidiria com linhas existentes (UNIQUE) e os eventos novos seriam tratados
  // como duplicata e silenciosamente perdidos.
  function _fetchStartSeq(sb, cid, peerId) {
    return Promise.resolve(
      sb.from('campaign_events').select('peer_seq')
        .eq('campaign_id', cid).eq('peer_id', peerId)
        .order('peer_seq', { ascending: false }).limit(1)
    ).then(function (r) {
      return (r && r.data && r.data[0] && Number(r.data[0].peer_seq)) || 0;
    }).catch(function () { return 0; });
  }

  // Conecta a campanha ao banco: sessão anônima → RPC (create/join) → coordenador.
  // Resolve { campaignId } em sucesso, ou null (degrada para broadcast-only).
  function connect(opts) {
    opts = opts || {};
    if (!isEnabled()) return Promise.resolve(null);

    var adapter = window.CoC.campaign.supabaseAdapter;
    var sb;
    try { sb = _ensureClient(); }
    catch (e) { console.warn('[campaign-sync] sem client:', e && e.message || e); return Promise.resolve(null); }

    _peerId = opts.peerId || _peerId;
    _role   = opts.role   || 'player';

    return Promise.resolve(adapter.ensureSession(sb))
      .then(function () {
        if (_role === 'host') {
          // Host: cria; se o PIN já existe (reconexão), recai para join e recupera o id.
          return Promise.resolve(adapter.createCampaign(sb, opts.name || 'Campanha', opts.pin))
            .catch(function () { return adapter.joinCampaign(sb, opts.pin); });
        }
        return adapter.joinCampaign(sb, opts.pin);
      })
      .then(function (cid) {
        if (!cid) throw new Error('campaign id ausente');
        return _fetchStartSeq(sb, cid, _peerId).then(function (startSeq) {
          var outbox = window.CoC.campaign.outbox.create();
          _coord = window.CoC.campaign.persistence.create({
            client:     adapter.createPersistenceClient(sb),
            storage:    outbox,
            campaignId: cid,
            peerId:     _peerId,
            startSeq:   startSeq,
            isSacred:   _isSacred
          });
          _campaignId = cid;
          return Promise.resolve(outbox.ready())
            .then(function () { return _coord.drainOutbox(); })
            .then(function () { return { campaignId: cid }; });
        });
      })
      .catch(function (err) {
        console.warn('[campaign-sync] connect falhou — seguindo só com broadcast:', err && err.message || err);
        _coord = null; _campaignId = null;
        return null;
      });
  }

  // Grava um evento de domínio (trace) no log durável. Sagrado de não-host é
  // ignorado (RLS rejeitaria; o snapshot já carrega os vitais resultantes).
  function record(entry) {
    if (!_coord || !entry || !entry.type) return Promise.resolve(null);
    if (_isSacred(entry.type) && _role !== 'host') return Promise.resolve({ skipped: 'sacred-non-host' });
    return Promise.resolve(_coord.recordEvent({ type: entry.type, payload: entry.payload || {} }))
      .catch(function (e) { console.warn('[campaign-sync] record:', e && e.message || e); return null; });
  }

  // Upsert do checkpoint do investigador (late-join rápido). vitals = o objeto
  // `status` rico que o painel do Mestre consome.
  function snapshot(snap) {
    if (!_coord || !snap) return Promise.resolve(null);
    return Promise.resolve(_coord.upsertSnapshot(snap))
      .catch(function (e) { console.warn('[campaign-sync] snapshot:', e && e.message || e); return null; });
  }

  // Carrega tudo do banco (snapshots + eventos) para reconstruir a mesa no reload.
  function rehydrate() {
    if (!_coord) return Promise.resolve({ snapshots: [], events: [] });
    return Promise.resolve(_coord.loadSince(0))
      .catch(function (e) { console.warn('[campaign-sync] rehydrate:', e && e.message || e); return { snapshots: [], events: [] }; });
  }

  function disconnect() { _coord = null; _campaignId = null; _role = null; }
  function getCampaignId() { return _campaignId; }
  function isLive() { return !!_coord; }

  window.CoC.campaign.sync = Object.freeze({
    snapshotToInvestigator: snapshotToInvestigator,
    formatTraceEntry:       formatTraceEntry,
    isEnabled:              isEnabled,
    connect:                connect,
    record:                 record,
    snapshot:               snapshot,
    rehydrate:              rehydrate,
    disconnect:             disconnect,
    getCampaignId:          getCampaignId,
    isLive:                 isLive
  });
})();
