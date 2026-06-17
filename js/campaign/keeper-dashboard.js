/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/campaign/keeper-dashboard.js
   Orquestra o painel de campanha na página do Guardião.

   Responsabilidades:
   - Botão "Criar Campanha": gera PIN, inicializa transport + store
   - Botão "Gerenciar Campanha": modal com PIN exibido + lista de jogadores
   - Escuta eventos de transport: INVESTIGATOR_STATUS, PLAYER_CONNECTED, etc.
   - Atualiza #investigators-cards e #timeline-list
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};
window.CoC.campaign = window.CoC.campaign || {};

(function () {

  var _cs      = null;
  var _tp      = null;
  var _pinSys  = null;
  var _ontology = null;
  var _invSort = 'perigo';   // 'perigo' | 'nome' | 'online'

  // ── i18n (PT-BR diegético + EN) — registrado já no parse, antes do
  //    settings.apply()/applyTranslations() do boot ───────────────────────────
  (function registerDict() {
    var i18n = window.CoC && window.CoC.i18n;
    if (!i18n || !i18n.addDict) return;
    i18n.addDict('pt', {
      'keeper.inv.title': 'Investigadores',
      'keeper.inv.waiting': 'Aguardando investigadores...',
      'keeper.inv.sort': 'Ordenar',
      'keeper.inv.sortDanger': 'Por perigo',
      'keeper.inv.sortName': 'Por nome',
      'keeper.inv.sortOnline': 'Online primeiro',
      'keeper.inv.vitLife': 'Vida',
      'keeper.inv.vitSanity': 'Sanidade',
      'keeper.inv.vitMagic': 'Magia',
      'keeper.inv.vitLuck': 'Sorte',
      'keeper.inv.statusAlive': 'Vivo',
      'keeper.inv.statusHurt': 'Ferido',
      'keeper.inv.statusInsane': 'Em surto',
      'keeper.inv.statusUnconscious': 'Inconsciente',
      'keeper.inv.statusDead': 'Morto',
      'keeper.inv.seal': '☠ Morto',
      'keeper.inv.online': 'online',
      'keeper.inv.offline': 'offline',
      'keeper.inv.kpiTotal': 'Investigadores',
      'keeper.inv.kpiAlive': 'Vivos',
      'keeper.inv.kpiInsane': 'Em surto',
      'keeper.inv.kpiDead': 'Mortos',
      'keeper.inv.kpiSanAvg': 'Sanidade média',
      'keeper.inv.highlights': 'Destaques',
      'keeper.inv.detail': 'Atributos & Perícias',
      'keeper.inv.attrs': 'Atributos',
      'keeper.inv.skills': 'Perícias',
      'keeper.inv.actOpen': 'Abrir ficha',
      'keeper.inv.actDamage': 'Dano',
      'keeper.inv.actSan': 'Perda SAN',
      'keeper.inv.noteTitle': 'Abrir/criar nota do Guardião sobre este investigador'
    });
    i18n.addDict('en', {
      'keeper.inv.title': 'Investigators',
      'keeper.inv.waiting': 'Awaiting investigators...',
      'keeper.inv.sort': 'Sort',
      'keeper.inv.sortDanger': 'By danger',
      'keeper.inv.sortName': 'By name',
      'keeper.inv.sortOnline': 'Online first',
      'keeper.inv.vitLife': 'Health',
      'keeper.inv.vitSanity': 'Sanity',
      'keeper.inv.vitMagic': 'Magic',
      'keeper.inv.vitLuck': 'Luck',
      'keeper.inv.statusAlive': 'Alive',
      'keeper.inv.statusHurt': 'Hurt',
      'keeper.inv.statusInsane': 'Insane',
      'keeper.inv.statusUnconscious': 'Unconscious',
      'keeper.inv.statusDead': 'Dead',
      'keeper.inv.seal': '☠ Dead',
      'keeper.inv.online': 'online',
      'keeper.inv.offline': 'offline',
      'keeper.inv.kpiTotal': 'Investigators',
      'keeper.inv.kpiAlive': 'Alive',
      'keeper.inv.kpiInsane': 'Insane',
      'keeper.inv.kpiDead': 'Dead',
      'keeper.inv.kpiSanAvg': 'Avg. sanity',
      'keeper.inv.highlights': 'Highlights',
      'keeper.inv.detail': 'Attributes & Skills',
      'keeper.inv.attrs': 'Attributes',
      'keeper.inv.skills': 'Skills',
      'keeper.inv.actOpen': 'Open sheet',
      'keeper.inv.actDamage': 'Damage',
      'keeper.inv.actSan': 'SAN loss',
      'keeper.inv.noteTitle': "Open/create the Keeper's note about this investigator"
    });
  })();

  function _t(key, fallback) {
    var i18n = window.CoC && window.CoC.i18n;
    var v = i18n && i18n.t ? i18n.t(key) : null;
    return (v && v !== key) ? v : (fallback || key);
  }

  function $s(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  // ── Boot ──────────────────────────────────────────────────────────────────
  function init() {
    _cs       = window.CoC.campaign && window.CoC.campaign.store;
    _tp       = window.CoC.campaign && window.CoC.campaign.transport;
    _pinSys   = window.CoC.campaign && window.CoC.campaign.pin;
    _ontology = window.CoC.campaign && window.CoC.campaign.ontology;

    if (!_cs || !_tp || !_pinSys) {
      console.warn('[keeper-dashboard] campaign modules not loaded');
      return;
    }

    _bindButtons();
    _cs.subscribe(_onCampaignChange);

    // On page load the transport channel is always gone. Com persistência durável,
    // reconstruímos a mesa do banco e reativamos sozinhos; sem ela, caímos no
    // fluxo "stale" (botão Reativar) como antes.
    var saved = _cs.getState();
    if (saved.connected && saved.id) {
      var sync = window.CoC.campaign && window.CoC.campaign.sync;
      if (sync && sync.isEnabled() && saved.pin) {
        _rehydrateFromDb(saved);
      } else {
        _cs.markStale();
      }
    }
    _renderDashboard(_cs.getState());
    _mountChat();
  }

  // Best-effort: liga a persistência durável da campanha (host/player).
  function _connectDurable(pin, role, name) {
    var sync = window.CoC.campaign && window.CoC.campaign.sync;
    if (!sync || !sync.isEnabled()) return;
    try { sync.connect({ pin: pin, role: role || 'host', name: name, peerId: _tp.getPeerId() }); } catch (e) {}
  }

  // Reconstrói roster + timeline a partir do banco no reload e reativa a sessão.
  // Qualquer falha recai no fluxo "stale" (não trava o Guardião).
  function _rehydrateFromDb(saved) {
    var sync = window.CoC.campaign.sync;
    _tp.init(saved.pin, saved.role || 'host');
    _tp.onEvent(_onTransportEvent);

    sync.connect({ pin: saved.pin, name: saved.name, role: saved.role || 'host', peerId: _tp.getPeerId() })
      .then(function (res) {
        if (!res) { _cs.markStale(); _renderDashboard(_cs.getState()); return; }
        return sync.rehydrate().then(function (data) {
          (data.snapshots || []).forEach(function (snap) {
            var inv = sync.snapshotToInvestigator(snap);
            if (inv && inv.peerId) {
              _cs.upsertInvestigator(inv.peerId, {
                playerName: inv.playerName, characterName: inv.characterName,
                status: inv.status, online: false
              });
            }
          });
          (data.events || []).forEach(function (row) {
            var p = row.payload || {};
            var fmt = sync.formatTraceEntry({ type: row.type, payload: p }, p._actor || '?');
            _cs.pushTimeline({ type: row.type, text: fmt.text, cls: fmt.cls });
          });
          _cs.markActive();
          // Re-anuncia presença e pede status fresco a quem ainda estiver aberto.
          _tp.broadcast(_ontology
            ? _ontology.make('HOST_ONLINE', { campaignId: saved.pin, pin: saved.pin, campaignName: saved.name })
            : { type: 'HOST_ONLINE', pin: saved.pin });
          _tp.broadcast(_ontology
            ? _ontology.make('REQUEST_STATUS', { pin: saved.pin })
            : { type: 'REQUEST_STATUS', pin: saved.pin });
          _renderDashboard(_cs.getState());
        });
      })
      .catch(function () { _cs.markStale(); _renderDashboard(_cs.getState()); });
  }

  // ── Buttons ───────────────────────────────────────────────────────────────
  function _bindButtons() {
    var btnCreate     = $s('#btn-create-campaign');
    var btnJoin       = $s('#btn-join-campaign');
    var btnManage     = $s('#btn-campaign');
    var btnClose      = $s('#btn-close-campaign-modal');
    var btnClearTL    = $s('#btn-clear-timeline');
    var btnReactivate = $s('#btn-reactivate-campaign');
    var btnDiscard    = $s('#btn-discard-stale');

    if (btnCreate)     btnCreate.onclick     = _createCampaign;
    if (btnJoin)       btnJoin.onclick       = _joinCampaign;
    if (btnManage)     btnManage.onclick     = _openCampaignModal;
    if (btnClose)      btnClose.onclick      = _closeModal;
    if (btnReactivate) btnReactivate.onclick = _reactivateCampaign;
    if (btnDiscard)    btnDiscard.onclick    = function () {
      if (confirm('Descartar sessão anterior e começar do zero?')) {
        _cs.leaveCampaign();
      }
    };
    if (btnClearTL) btnClearTL.onclick = function () {
      if (_cs) _cs.clearTimeline();
      _renderTimeline([]);
    };

    // Entrada manual na timeline (RK-2) — funciona com ou sem campanha ativa.
    var tlInput  = $s('#timeline-input');
    var btnAddTL = $s('#btn-add-timeline');
    function addManualEvent() {
      if (!tlInput || !_cs) return;
      var text = tlInput.value.trim();
      if (!text) return;
      _cs.pushTimeline({ type: 'manual', text: '✍️ ' + _esc(text), cls: 'ev-manual' });
      tlInput.value = '';
      _renderTimeline(_cs.getState().timeline || []);
    }
    if (btnAddTL) btnAddTL.onclick = addManualEvent;
    if (tlInput) tlInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addManualEvent(); }
    });
  }

  // ── Create Campaign ───────────────────────────────────────────────────────
  function _createCampaign() {
    var ui = window.CoC && window.CoC.ui;
    var pin = _pinSys.generate();

    function _launch(name) {
      name = (name || '').trim() || 'Horror em Arkham';
      _tp.init(pin, 'host');
      _tp.onEvent(_onTransportEvent);
      var peerId = _tp.getPeerId();
      _cs.createCampaign(name, pin, peerId);
      _connectDurable(pin, 'host', name);
      var hostEvent = _ontology
        ? _ontology.make('HOST_ONLINE', { campaignId: pin, pin: pin, campaignName: name })
        : { type: 'HOST_ONLINE', campaignId: pin, pin: pin, campaignName: name };
      _tp.broadcast(hostEvent);
      _renderDashboard(_cs.getState());
      _openCampaignModal();
    }

    if (ui && ui.prompt) {
      ui.prompt('Nome da Campanha:', { title: 'Nova Campanha', defaultValue: 'Horror em Arkham' })
        .then(function (name) { if (name !== null) _launch(name); });
    } else {
      // fallback seguro se ui-components ainda não carregou
      _launch(window.prompt('Nome da Campanha:', 'Horror em Arkham') || '');
    }
  }

  // ── Join Campaign ─────────────────────────────────────────────────────────
  function _joinCampaign() {
    var pinEl = $s('#pin-input');
    if (!pinEl) return;
    var pin = pinEl.value.trim();
    if (!_pinSys.validate(pin)) {
      alert('PIN inválido. Digite 6 números.');
      return;
    }
    _cs.joinCampaign(pin, pin, 'player');
    _tp.init(pin, 'player');
    _tp.onEvent(_onTransportEvent);
    _connectDurable(pin, 'player');
    var joinEvent = _ontology
      ? _ontology.make('PLAYER_CONNECTED', { playerName: 'Guardião', pin: pin })
      : { type: 'PLAYER_CONNECTED', playerName: 'Guardião', pin: pin };
    _tp.broadcast(joinEvent);
    _renderDashboard(_cs.getState());
  }

  // ── Reactivate stale session ──────────────────────────────────────────────
  function _reactivateCampaign() {
    var state = _cs.getState();
    if (!state.pin) return;

    _tp.init(state.pin, state.role || 'host');
    _tp.onEvent(_onTransportEvent);
    _cs.markActive();

    // Re-announce host and request fresh status from any investigators still open
    var hostEvt = _ontology
      ? _ontology.make('HOST_ONLINE', { campaignId: state.pin, pin: state.pin, campaignName: state.name })
      : { type: 'HOST_ONLINE', campaignId: state.pin, pin: state.pin, campaignName: state.name };
    _tp.broadcast(hostEvt);

    var reqEvt = _ontology
      ? _ontology.make('REQUEST_STATUS', { pin: state.pin })
      : { type: 'REQUEST_STATUS', pin: state.pin };
    _tp.broadcast(reqEvt);

    _cs.pushTimeline({ type: 'SESSION_RECOVERED', text: 'Sessão reativada.', cls: 'ev-roll' });
    _renderDashboard(_cs.getState());
  }

  // ── Transport events ──────────────────────────────────────────────────────
  function _onTransportEvent(event) {
    if (!event || !event.type) return;

    switch (event.type) {

      case 'INVESTIGATOR_STATUS': {
        // Retrato/ocupação são aditivos e podem não vir em todo tick — carrega
        // adiante o último valor conhecido (retrocompat com clientes antigos).
        var prev = (_cs.getState().investigators || {})[event.peerId] || {};
        var st   = event.status || {};
        var prevSt = prev.status || {};
        if (st.portrait == null && prevSt.portrait != null) st.portrait = prevSt.portrait;
        if (!st.occupation && prevSt.occupation)            st.occupation = prevSt.occupation;
        _cs.upsertInvestigator(event.peerId, {
          playerName:    event.playerName    || '?',
          characterName: event.characterName || '?',
          status:        st
        });
        break;
      }

      case 'PLAYER_CONNECTED':
        _cs.upsertInvestigator(event.peerId, { online: true });
        _cs.pushTimeline({
          type: 'player-connected',
          text: '<b>' + _esc(event.playerName || 'Jogador') + '</b> entrou na campanha.',
          cls:  'ev-roll'
        });
        // Request status from the new player
        var reqEvent = _ontology
          ? _ontology.make('REQUEST_STATUS', { pin: _cs.getState().pin })
          : { type: 'REQUEST_STATUS', pin: _cs.getState().pin };
        _tp.broadcast(reqEvent);
        break;

      case 'PLAYER_DISCONNECTED':
        if (event.peerId) _cs.setInvestigatorOffline(event.peerId);
        _cs.pushTimeline({
          type: 'player-disconnected',
          text: '<b>' + _esc(event.playerName || 'Jogador') + '</b> saiu.',
          cls:  'ev-roll'
        });
        break;

      case 'EXECUTION_TRACE':
        _handleExecutionTrace(event);
        break;
      case 'CHAT_MESSAGE':
        // Encaminha ao chat (cobre o caso de a campanha iniciar APÓS o mount,
        // quando o onEvent interno do chat ainda não estava registrado). O chat
        // deduplica por msgId, então não há mensagem repetida.
        if (window.CoC.views && window.CoC.views.chat && window.CoC.views.chat.receive) {
          window.CoC.views.chat.receive(event);
        }
        return;
    }

    _renderDashboard(_cs.getState());
  }

  function _mountChat() {
    var chat = window.CoC.views && window.CoC.views.chat;
    var listEl = document.getElementById('chat-list');
    if (!chat || !chat.mount || !listEl) return;
    chat.mount({
      listEl:    listEl,
      inputEl:   document.getElementById('chat-input'),
      sendBtnEl: document.getElementById('chat-send'),
      hintEl:    document.getElementById('chat-hint'),
      getAuthor: function () { return 'Guardião'; },
      getRole:   function () { return 'keeper'; }
    });
  }

  function _handleExecutionTrace(event) {
    if (!event.entry) return;
    var entry = event.entry;
    // "Personagem (Jogador)" — o Guardião sabe quem rolou sem decorar nomes.
    var actor = event.characterName || event.playerName || '?';
    if (event.characterName && event.playerName && event.playerName !== event.characterName) {
      actor = event.characterName + ' (' + event.playerName + ')';
    }
    // Fonte única de formatação (compartilhada com o replay durável).
    var sync = window.CoC.campaign && window.CoC.campaign.sync;
    var fmt  = (sync && sync.formatTraceEntry)
      ? sync.formatTraceEntry(entry, actor)
      : { text: '<b>' + _esc(actor) + '</b>: ' + _esc(String(entry.type).toLowerCase().replace(/_/g, ' ')), cls: 'ev-roll' };
    _cs.pushTimeline({ type: entry.type, text: fmt.text, cls: fmt.cls });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function _onCampaignChange(state) {
    _renderDashboard(state);
  }

  function _renderDashboard(state) {
    var setup     = $s('#campaign-setup');
    var stale     = $s('#campaign-stale');
    var dashboard = $s('#campaign-dashboard');
    var badge     = $s('#campaign-badge');
    var cbName    = $s('#cb-name');
    var cbPin     = $s('#cb-pin');
    var cbPlayers = $s('#cb-players');

    var status = state.status || (state.connected ? 'active' : 'disconnected');

    // A timeline vive em qualquer estado (eventos manuais existem sem campanha).
    _renderTimeline(state.timeline || []);

    if (status === 'disconnected' || !state.connected) {
      if (setup)     setup.style.display     = '';
      if (stale)     stale.style.display     = 'none';
      if (dashboard) dashboard.style.display = 'none';
      if (badge)     badge.style.display     = 'none';
      return;
    }

    if (status === 'stale') {
      if (setup)     setup.style.display     = 'none';
      if (dashboard) dashboard.style.display = 'none';
      if (badge)     badge.style.display     = 'none';
      if (stale)     stale.style.display     = '';
      var detail = $s('#stale-detail');
      if (detail) detail.textContent = (state.name || '?') + ' · PIN ' + (state.pin || '——');
      return;
    }

    // status === 'active'
    if (setup)     setup.style.display     = 'none';
    if (stale)     stale.style.display     = 'none';
    if (dashboard) dashboard.style.display = '';
    if (badge)     badge.style.display     = '';

    if (cbName)    cbName.textContent    = state.name || '—';
    if (cbPin)     cbPin.textContent     = state.pin  || '——';

    var invs      = Object.values(state.investigators || {});
    var onlineN   = invs.filter(function (i) { return i.online; }).length;
    if (cbPlayers) cbPlayers.textContent = onlineN + ' conectado' + (onlineN !== 1 ? 's' : '');

    _bindSort();
    _renderKpis(invs);
    _renderInvestigatorCards(invs);
  }

  // Grade chave→valor (atributos/perícias) para o detalhe do investigador.
  function _kvGrid(obj, cls, sortDesc) {
    if (!obj || typeof obj !== 'object') return '';
    var keys = Object.keys(obj);
    if (!keys.length) return '';
    if (sortDesc) keys.sort(function (a, b) { return (obj[b] || 0) - (obj[a] || 0); });
    return '<div class="' + cls + '">' + keys.map(function (k) {
      return '<span class="inv-kv"><span class="inv-kv-k">' + _esc(k) +
             '</span><span class="inv-kv-v">' + _esc(obj[k]) + '</span></span>';
    }).join('') + '</div>';
  }

  // ── Helpers do painel de comando (porte do protótipo, dados reais) ──────────
  // Cor de preenchimento por faixa (eixo de vitais — tokens fixos de tokens.css).
  function _axisFill(pct, kind) {
    var p = Math.max(0, Math.min(1, pct));
    if (kind === 'san') {
      if (p <= 0.15) return 'var(--san-crit)';
      if (p <= 0.35) return 'var(--san-bad)';
      if (p <= 0.60) return 'var(--san-hurt)';
      return 'var(--san-full)';
    }
    if (kind === 'mp') return 'var(--mp-axis)';
    if (p <= 0.15) return 'var(--hp-crit)';
    if (p <= 0.40) return 'var(--hp-bad)';
    if (p <= 0.75) return 'var(--hp-hurt)';
    return 'var(--hp-full)';
  }

  // Status derivado dos valores reais (prioridade conforme o protótipo).
  function _statusOf(inv) {
    var s = inv.status || {};
    var hp = Number(s.hp) || 0, hpMax = Number(s.hpMax) || 1;
    var san = Number(s.san) || 0, sanMax = Number(s.sanMax) || 1;
    var conds = (Array.isArray(s.conditions) ? s.conditions : []).map(function (c) { return String(c).toLowerCase(); });
    var incons = conds.some(function (c) { return c.indexOf('inconsc') >= 0; });
    var ferido = conds.some(function (c) { return c.indexOf('ferid') >= 0; });
    if (hp <= 0) return { k: 'morto', label: _t('keeper.inv.statusDead'), color: 'var(--dead)' };
    if (incons || hp / hpMax <= 0.12) return { k: 'incons', label: _t('keeper.inv.statusUnconscious'), color: 'var(--san-full)' };
    if (san / sanMax <= 0.18) return { k: 'surto', label: _t('keeper.inv.statusInsane'), color: 'var(--myth-bright)' };
    if (hp / hpMax <= 0.40 || ferido) return { k: 'ferido', label: _t('keeper.inv.statusHurt'), color: 'var(--hp-bad)' };
    return { k: 'vivo', label: _t('keeper.inv.statusAlive'), color: 'var(--ok)' };
  }

  // Quanto maior, pior (ordenação "Por perigo").
  function _danger(inv) {
    var s = inv.status || {};
    var hp = Number(s.hp) || 0, hpMax = Number(s.hpMax) || 1;
    var san = Number(s.san) || 0, sanMax = Number(s.sanMax) || 1;
    if (hp <= 0) return 1000;
    return (1 - hp / hpMax) * 100 + (1 - san / sanMax) * 120;
  }

  // Classe de cor do chip de condição (heurística sobre o texto livre da ficha).
  function _condClass(label) {
    var l = String(label).toLowerCase();
    if (l.indexOf('sangr') >= 0) return 'sangrando';
    if (l.indexOf('inconsc') >= 0) return 'incons';
    if (l.indexOf('loucura') >= 0 || l.indexOf('insan') >= 0) return 'loucura';
    if (l.indexOf('fobia') >= 0 || l.indexOf('medo') >= 0) return 'fobia';
    if (l.indexOf('ferid') >= 0) return 'ferido';
    return '';
  }

  // Só aceita data-URL de imagem (hardening: o retrato chega pelo sync).
  function _safePortrait(p) {
    return (typeof p === 'string' &&
            /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/.test(p)) ? p : null;
  }

  function _vit(label, val, max, kind, warn) {
    var v = Math.max(0, Number(val) || 0);
    var mx = Number(max) || 0;
    var pct = mx ? v / mx : 0;
    return '<div class="inv-vit">' +
      '<div class="inv-vit-top">' +
        '<span class="inv-vit-l">' + _esc(label) + (warn ? ' <span class="inv-warn">⚠</span>' : '') + '</span>' +
        '<span class="inv-vit-v">' + v + (mx ? '<span class="mx"> / ' + mx + '</span>' : '') + '</span>' +
      '</div>' +
      '<div class="inv-track"><div class="inv-fill" style="width:' + Math.round(pct * 100) + '%;background:' + _axisFill(pct, kind) + '"></div></div>' +
    '</div>';
  }

  // ── KPIs reativos ───────────────────────────────────────────────────────────
  function _renderKpis(invs) {
    var el = $s('#investigators-kpis');
    if (!el) return;
    var alive = invs.filter(function (i) { return (Number((i.status || {}).hp) || 0) > 0; });
    var total = invs.length;
    var dead  = total - alive.length;
    var insane = alive.filter(function (i) {
      var s = i.status || {}; return (Number(s.san) || 0) / (Number(s.sanMax) || 1) <= 0.18;
    }).length;
    var sanAvg = alive.length
      ? Math.round(alive.reduce(function (a, i) {
          var s = i.status || {}; return a + (Number(s.san) || 0) / (Number(s.sanMax) || 1);
        }, 0) / alive.length * 100)
      : 0;
    function kpi(v, key, cls) {
      return '<div class="inv-kpi' + (cls ? ' ' + cls : '') + '">' +
        '<span class="inv-kpi-v">' + _esc(v) + '</span>' +
        '<span class="inv-kpi-l">' + _esc(_t('keeper.inv.' + key)) + '</span></div>';
    }
    el.innerHTML =
      kpi(total, 'kpiTotal', '') +
      kpi(alive.length + '/' + total, 'kpiAlive', '') +
      kpi(insane, 'kpiInsane', insane ? 'danger' : '') +
      kpi(dead, 'kpiDead', dead ? 'dead' : '') +
      kpi(sanAvg + '%', 'kpiSanAvg', '');
  }

  // ── Ordenação ────────────────────────────────────────────────────────────────
  function _bindSort() {
    var bar = $s('#investigators-sort');
    if (!bar || bar._invSortBound) return;
    bar._invSortBound = true;
    bar.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-sort]');
      if (!chip) return;
      _invSort = chip.getAttribute('data-sort');
      $all('#investigators-sort .inv-sort-chip').forEach(function (c) {
        c.classList.toggle('on', c.getAttribute('data-sort') === _invSort);
      });
      _renderInvestigatorCards(Object.values(_cs.getState().investigators || {}));
    });
  }

  // ── Ações de mesa (delegação única) ──────────────────────────────────────────
  function _bindRoster(container) {
    if (container._invDelegated) return;
    container._invDelegated = true;
    container.addEventListener('click', function (e) {
      var note = e.target.closest('[data-inv-note]');
      if (note) {
        e.preventDefault();
        var ui = window.CoC && window.CoC.keeperNotesUI;
        if (ui && ui.openOrCreateByTitle) ui.openOrCreateByTitle(note.getAttribute('data-inv-note'));
        return;
      }
      var act = e.target.closest('[data-inv-action]');
      if (!act) return;
      e.preventDefault();
      var peerId = act.getAttribute('data-peer');
      var action = act.getAttribute('data-inv-action');
      if (action === 'ficha') {
        var inv = (_cs.getState().investigators || {})[peerId];
        if (inv) _openFichaModal(inv);
      } else if (action === 'dano' || action === 'san') {
        _localAdjust(peerId, action);
      }
    });
  }

  // Dano / Perda SAN: AJUSTE LOCAL/VISUAL no painel do Guardião. Não há canal
  // Guardião→jogador; rolagem por crypto (CoC.dice), nunca Math.random.
  // TODO: propagar ao jogador quando existir um canal de escrita Guardião→jogador.
  function _localAdjust(peerId, kind) {
    var inv = (_cs.getState().investigators || {})[peerId];
    if (!inv) return;
    var s = Object.assign({}, inv.status || {});
    if ((Number(s.hp) || 0) <= 0) return;   // morto não recebe ajuste
    var dice = window.CoC && window.CoC.dice;
    var amt = (dice && dice.rollDie) ? dice.rollDie(kind === 'dano' ? 6 : 8) : 1;
    if (kind === 'dano') s.hp  = Math.max(0, (Number(s.hp)  || 0) - amt);
    else                 s.san = Math.max(0, (Number(s.san) || 0) - amt);
    _cs.upsertInvestigator(peerId, { status: s });   // re-render síncrono via subscribe
    _floatNumber(peerId, kind, '-' + amt);
  }

  function _floatNumber(peerId, kind, txt) {
    var fl = document.getElementById('float-' + peerId);
    if (!fl) return;
    var card = fl.closest('.inv-card');
    fl.textContent = txt;
    fl.className = 'inv-float ' + (kind === 'dano' ? 'dmg' : 'san');
    void fl.offsetWidth;            // reinicia a animação
    fl.classList.add('go');
    if (card) {
      var fc = kind === 'dano' ? 'flash-dmg' : 'flash-san';
      card.classList.add(fc);
      setTimeout(function () { card.classList.remove(fc); }, 500);
    }
    setTimeout(function () { fl.classList.remove('go'); }, 1000);
  }

  // Abrir ficha — visualização READ-ONLY (segura) num modal temático.
  function _openFichaModal(inv) {
    var ui = window.CoC && window.CoC.ui;
    if (!ui || !ui.modal) return;
    var s = inv.status || {};
    var conds = (Array.isArray(s.conditions) ? s.conditions : []);
    var condHtml = conds.length
      ? '<div class="inv-conds" style="margin:0.5rem 0">' + conds.map(function (co) {
          return '<span class="inv-cond ' + _condClass(co) + '">' + _esc(co) + '</span>';
        }).join('') + '</div>'
      : '';
    var html =
      '<div class="inv-occ" style="margin-bottom:0.6rem">' +
        (s.occupation ? _esc(s.occupation) + ' · ' : '') +
        '<span class="player">' + _esc(inv.playerName || '') + '</span>' +
      '</div>' +
      '<div class="inv-vitals" style="margin-bottom:0.6rem">' +
        _vit(_t('keeper.inv.vitLife'),   s.hp,  s.hpMax,  'hp') +
        _vit(_t('keeper.inv.vitSanity'), s.san, s.sanMax, 'san') +
        _vit(_t('keeper.inv.vitMagic'),  s.mp,  s.mpMax,  'mp') +
        _vit(_t('keeper.inv.vitLuck'),   s.luck, 99,      'hp') +
      '</div>' +
      condHtml +
      (s.attrs  ? '<div class="inv-detail-sec"><h5>' + _esc(_t('keeper.inv.attrs'))  + '</h5>' + _kvGrid(s.attrs,  'inv-attrs') + '</div>' : '') +
      (s.skills ? '<div class="inv-detail-sec"><h5>' + _esc(_t('keeper.inv.skills')) + '</h5>' + _kvGrid(s.skills, 'inv-skills', true) + '</div>' : '');
    ui.modal({ title: _esc(inv.characterName || '?'), body: html, dismissible: true });
  }

  function _renderInvestigatorCards(investigators) {
    var container = $s('#investigators-cards');
    var countEl   = $s('#is-count');
    if (!container) return;

    _bindRoster(container);

    var online = investigators.filter(function (i) { return i.online; }).length;
    if (countEl) countEl.textContent = online + ' conectado' + (online !== 1 ? 's' : '');

    if (!investigators.length) {
      container.innerHTML = '<div class="inv-card-empty">' + _esc(_t('keeper.inv.waiting')) + '</div>';
      return;
    }

    // Ordenação selecionada
    var list = investigators.slice();
    if (_invSort === 'nome') {
      list.sort(function (a, b) { return String(a.characterName || '').localeCompare(String(b.characterName || '')); });
    } else if (_invSort === 'online') {
      list.sort(function (a, b) { return ((b.online ? 1 : 0) - (a.online ? 1 : 0)) || (_danger(b) - _danger(a)); });
    } else { // perigo (padrão)
      list.sort(function (a, b) { return _danger(b) - _danger(a); });
    }

    container.innerHTML = list.map(function (inv) {
      var s    = inv.status || {};
      var pid  = inv.peerId || '';
      var st   = _statusOf(inv);
      var dead = (Number(s.hp) || 0) <= 0;
      var sanMax = Number(s.sanMax) || 1;
      var sanWarn = !dead && (Number(s.san) || 0) / sanMax <= 0.35;

      var portrait   = _safePortrait(s.portrait);
      var occupation = s.occupation || '';
      var conditions = Array.isArray(s.conditions) ? s.conditions : [];
      var attrsHtml  = _kvGrid(s.attrs,  'inv-attrs');
      var skillsHtml = _kvGrid(s.skills, 'inv-skills', true);

      var top3 = (s.skills && typeof s.skills === 'object')
        ? Object.keys(s.skills).map(function (k) { return { n: k, v: Number(s.skills[k]) || 0 }; })
            .sort(function (a, b) { return b.v - a.v; }).slice(0, 3)
        : [];

      var portraitInner = portrait
        ? '<div class="inv-photo" style="background-image:url(\'' + portrait + '\')"></div>'
        : '<div class="inv-initial">' + _esc(_initials(inv.characterName)) + '</div>';

      return '<div class="inv-card ' + (inv.online ? 'online' : 'offline') + (dead ? ' dead' : '') +
               '" id="inv-' + _esc(pid) + '" style="--status-color:' + st.color + '">' +
        '<div class="inv-float" id="float-' + _esc(pid) + '"></div>' +
        (dead ? '<div class="inv-dead-seal">' + _esc(_t('keeper.inv.seal')) + '</div>' : '') +
        '<div class="inv-portrait">' +
          '<div class="inv-frame">' + portraitInner +
            '<span class="inv-corner tl"></span><span class="inv-corner tr"></span>' +
            '<span class="inv-corner bl"></span><span class="inv-corner br"></span>' +
          '</div>' +
          '<span class="inv-online ' + (inv.online ? 'live' : '') + '"><span class="inv-dot"></span>' +
            (inv.online ? _esc(_t('keeper.inv.online')) : _esc(_t('keeper.inv.offline'))) + '</span>' +
        '</div>' +
        '<div class="inv-main">' +
          '<div class="inv-top">' +
            '<div>' +
              '<div class="inv-name">' + _esc(inv.characterName || '?') + '</div>' +
              '<div class="inv-occ">' + (occupation ? _esc(occupation) + ' · ' : '') +
                '<span class="player">' + _esc(inv.playerName || '') + '</span></div>' +
            '</div>' +
            '<span class="inv-status">' + _esc(st.label) + '</span>' +
          '</div>' +
          '<div class="inv-vitals">' +
            _vit(_t('keeper.inv.vitLife'),   s.hp,   s.hpMax,  'hp') +
            _vit(_t('keeper.inv.vitSanity'), s.san,  s.sanMax, 'san', sanWarn) +
            _vit(_t('keeper.inv.vitMagic'),  s.mp,   s.mpMax,  'mp') +
            _vit(_t('keeper.inv.vitLuck'),   s.luck, 99,       'hp') +
          '</div>' +
          (conditions.length
            ? '<div class="inv-conds">' + conditions.map(function (co) {
                return '<span class="inv-cond ' + _condClass(co) + '">' + _esc(co) + '</span>';
              }).join('') + '</div>'
            : '') +
          (top3.length
            ? '<div class="inv-skills-line">' + _esc(_t('keeper.inv.highlights')) + ': ' +
                top3.map(function (sk) { return '<span class="sk">' + _esc(sk.n) + '</span> <b>' + sk.v + '%</b>'; }).join(' · ') +
              '</div>'
            : '') +
          ((attrsHtml || skillsHtml)
            ? '<details class="inv-card-detail">' +
                '<summary>' + _esc(_t('keeper.inv.detail')) + '</summary>' +
                (attrsHtml  ? '<div class="inv-detail-sec"><h5>' + _esc(_t('keeper.inv.attrs'))  + '</h5>' + attrsHtml  + '</div>' : '') +
                (skillsHtml ? '<div class="inv-detail-sec"><h5>' + _esc(_t('keeper.inv.skills')) + '</h5>' + skillsHtml + '</div>' : '') +
              '</details>'
            : '') +
          '<div class="inv-acts">' +
            '<button type="button" class="inv-act ficha" data-inv-action="ficha" data-peer="' + _esc(pid) + '">⛶ ' + _esc(_t('keeper.inv.actOpen')) + '</button>' +
            '<button type="button" class="inv-act dano" data-inv-action="dano" data-peer="' + _esc(pid) + '"' + (dead ? ' disabled' : '') + '>🩸 ' + _esc(_t('keeper.inv.actDamage')) + '</button>' +
            '<button type="button" class="inv-act san" data-inv-action="san" data-peer="' + _esc(pid) + '"' + (dead ? ' disabled' : '') + '>🧠 ' + _esc(_t('keeper.inv.actSan')) + '</button>' +
            '<button type="button" class="inv-note-btn" data-inv-note="' + _esc(inv.characterName || '') + '" title="' + _esc(_t('keeper.inv.noteTitle')) + '">📝</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function _renderTimeline(events) {
    var list = $s('#timeline-list');
    if (!list) return;

    var recent = events.slice(-50).reverse();

    if (!recent.length) {
      list.innerHTML = '<li class="tl-empty">Sem eventos ainda.</li>';
      return;
    }

    list.innerHTML = recent.map(function (ev) {
      var time = _fmtTime(ev.ts);
      return '<li class="tl-entry ' + (ev.cls || '') + '">' +
        '<span class="tl-time">' + time + '</span>' +
        '<span class="tl-text">' + (ev.text || ev.type || '') + '</span>' +
      '</li>';
    }).join('');
  }

  // ── Campaign Modal ─────────────────────────────────────────────────────────
  function _openCampaignModal() {
    var modal = $s('#modal-campaign');
    var body  = $s('#campaign-modal-body');
    if (!modal || !body) return;

    var state = _cs.getState();

    if (!state.connected) {
      modal.style.display = 'none';
      return;
    }

    var invs = Object.values(state.investigators || {});
    var playersHtml = invs.length
      ? invs.map(function (inv) {
          return '<div class="cp-entry">' +
            '<span class="cp-dot" style="background:' + (inv.online ? 'var(--ok,#4a8a54)' : 'var(--ink-faded)') + '"></span>' +
            '<span class="cp-name">' + _esc(inv.playerName || '?') + '</span>' +
            '<span class="cp-char">' + _esc(inv.characterName || '—') + '</span>' +
          '</div>';
        }).join('')
      : '<p style="color:var(--ink-faded);font-style:italic;font-size:0.85rem;">Nenhum jogador conectado ainda.</p>';

    body.innerHTML =
      '<div class="campaign-pin-display">' +
        '<div class="campaign-pin-number">' + (state.pin || '——') + '</div>' +
        '<div class="campaign-pin-label">PIN da Campanha · compartilhe com os jogadores</div>' +
      '</div>' +
      '<div>' +
        '<label style="font-family:var(--font-mono);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-faded);">Campanha</label>' +
        '<p style="font-size:1rem;color:var(--ink);margin-top:0.25rem;">' + _esc(state.name || '—') + '</p>' +
      '</div>' +
      '<div>' +
        '<label style="font-family:var(--font-mono);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-faded);margin-bottom:0.4rem;display:block;">Jogadores</label>' +
        '<div class="campaign-players-list">' + playersHtml + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">' +
        '<button id="btn-end-campaign" class="btn-danger" style="flex:1">Encerrar Campanha</button>' +
      '</div>';

    var btnEnd = body.querySelector('#btn-end-campaign');
    if (btnEnd) btnEnd.onclick = function () {
      if (!confirm('Encerrar a campanha? Isso desconecta todos os jogadores.')) return;
      var endEvent = _ontology
        ? _ontology.make('CAMPAIGN_ENDED', { pin: state.pin })
        : { type: 'CAMPAIGN_ENDED', pin: state.pin };
      _tp.broadcast(endEvent);
      _tp.close();
      _cs.leaveCampaign();
      _closeModal();
      _renderDashboard(_cs.getState());
    };

    modal.style.display = 'flex';
  }

  function _closeModal() {
    var modal = $s('#modal-campaign');
    if (modal) modal.style.display = 'none';
  }

  // ── Utils ──────────────────────────────────────────────────────────────────
  function _esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Iniciais do investigador para o avatar do roster (até 2 letras).
  function _initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    var first = parts[0].charAt(0);
    var last  = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  function _fmtTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getHours().toString().padStart(2,'0') + ':' +
           d.getMinutes().toString().padStart(2,'0');
  }

  // ── DOMContentLoaded ───────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CoC.campaign.keeperDashboard = Object.freeze({ init: init });

})();
