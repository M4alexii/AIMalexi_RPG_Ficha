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
    var pin  = _pinSys.generate();
    var name = window.prompt('Nome da Campanha:', 'Horror em Arkham') || 'Horror em Arkham';

    _tp.init(pin, 'host');
    _tp.onEvent(_onTransportEvent);
    var peerId = _tp.getPeerId();
    _cs.createCampaign(name, pin, peerId);
    _connectDurable(pin, 'host', name);

    // Broadcast presença do host
    var hostEvent = _ontology
      ? _ontology.make('HOST_ONLINE', { campaignId: pin, pin: pin, campaignName: name })
      : { type: 'HOST_ONLINE', campaignId: pin, pin: pin, campaignName: name };
    _tp.broadcast(hostEvent);

    _renderDashboard(_cs.getState());
    _openCampaignModal();
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

      case 'INVESTIGATOR_STATUS':
        _cs.upsertInvestigator(event.peerId, {
          playerName:    event.playerName    || '?',
          characterName: event.characterName || '?',
          status:        event.status        || {}
        });
        break;

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

  function _renderInvestigatorCards(investigators) {
    var container = $s('#investigators-cards');
    var countEl   = $s('#is-count');
    if (!container) return;

    // Delegação (uma vez): botão 📝 abre/cria a nota do investigador
    if (!container._invNoteDelegated) {
      container._invNoteDelegated = true;
      container.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-inv-note]');
        if (!btn) return;
        e.preventDefault();
        var ui = window.CoC && window.CoC.keeperNotesUI;
        if (ui && ui.openOrCreateByTitle) ui.openOrCreateByTitle(btn.getAttribute('data-inv-note'));
      });
    }

    var online = investigators.filter(function (i) { return i.online; }).length;
    if (countEl) countEl.textContent = online + ' conectado' + (online !== 1 ? 's' : '');

    if (!investigators.length) {
      container.innerHTML = '<div class="inv-card-empty">Aguardando investigadores...</div>';
      return;
    }

    container.innerHTML = investigators.map(function (inv) {
      var s       = inv.status || {};
      var hpMax   = s.hpMax  || 1;
      var sanMax  = s.sanMax || 1;
      var mpMax   = s.mpMax  || 1;
      var hpPct   = Math.max(0, Math.min(100, Math.round((s.hp  || 0) / hpMax  * 100)));
      var sanPct  = Math.max(0, Math.min(100, Math.round((s.san || 0) / sanMax * 100)));
      var mpPct   = Math.max(0, Math.min(100, Math.round((s.mp  || 0) / mpMax  * 100)));

      var armor      = Number(s.armor) || 0;
      var conditions = Array.isArray(s.conditions) ? s.conditions : [];
      var attrsHtml  = _kvGrid(s.attrs,  'inv-attrs');
      var skillsHtml = _kvGrid(s.skills, 'inv-skills', true);

      return '<div class="inv-card ' + (inv.online ? 'online' : 'offline') + '">' +
        '<div class="inv-card-header">' +
          '<span class="inv-avatar" aria-hidden="true">' + _esc(_initials(inv.characterName)) + '</span>' +
          '<span class="inv-card-online-dot"></span>' +
          '<span class="inv-card-name">' + _esc(inv.characterName || '?') + '</span>' +
          '<span class="inv-card-player">' + _esc(inv.playerName || '') + '</span>' +
          '<button type="button" class="inv-note-btn" data-inv-note="' + _esc(inv.characterName || '') + '" title="Abrir/criar nota do Guardião sobre este investigador">📝</button>' +
        '</div>' +
        '<div class="inv-card-stats">' +
          '<div class="inv-stat hp"><span class="inv-stat-label">PV</span><span class="inv-stat-value">' + (s.hp != null ? s.hp : '?') + '</span></div>' +
          '<div class="inv-stat san"><span class="inv-stat-label">SAN</span><span class="inv-stat-value">' + (s.san != null ? s.san : '?') + '</span></div>' +
          '<div class="inv-stat mp"><span class="inv-stat-label">PM</span><span class="inv-stat-value">' + (s.mp != null ? s.mp : '?') + '</span></div>' +
          '<div class="inv-stat luck"><span class="inv-stat-label">SOR</span><span class="inv-stat-value">' + (s.luck != null ? s.luck : '?') + '</span></div>' +
          (armor > 0 ? '<div class="inv-stat armor"><span class="inv-stat-label">ARM</span><span class="inv-stat-value">' + armor + '</span></div>' : '') +
        '</div>' +
        '<div class="inv-card-bars">' +
          '<div class="inv-bar hp"><div class="inv-bar-fill" style="width:' + hpPct + '%"></div></div>' +
          '<div class="inv-bar san"><div class="inv-bar-fill" style="width:' + sanPct + '%"></div></div>' +
          '<div class="inv-bar mp"><div class="inv-bar-fill" style="width:' + mpPct + '%"></div></div>' +
        '</div>' +
        (conditions.length
          ? '<div class="inv-card-conditions">' + conditions.map(function (co) {
              return '<span class="inv-cond-chip">' + _esc(co) + '</span>';
            }).join('') + '</div>'
          : '') +
        ((attrsHtml || skillsHtml)
          ? '<details class="inv-card-detail">' +
              '<summary>Atributos &amp; Perícias</summary>' +
              (attrsHtml  ? '<div class="inv-detail-sec"><h5>Atributos</h5>' + attrsHtml  + '</div>' : '') +
              (skillsHtml ? '<div class="inv-detail-sec"><h5>Perícias</h5>'  + skillsHtml + '</div>' : '') +
            '</details>'
          : '') +
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
