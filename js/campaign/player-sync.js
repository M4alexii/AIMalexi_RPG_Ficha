/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/campaign/player-sync.js
   Sincroniza o estado do investigador com a campanha via transport.

   Carregado em investigator.html.
   Escuta o store de personagem e transmite status + trace events ao Keeper.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};
window.CoC.campaign = window.CoC.campaign || {};

(function () {

  var _tp         = null;
  var _cs         = null;
  var _str        = null;
  var _playerName = '';
  var _seqNo      = 0;   // monotonic per-session counter for EXECUTION_TRACE ordering
  var _snapTimer  = null;

  var _ATTR_ORDER = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU', 'Sorte'];

  // Retrato miniaturizado para o painel do Mestre (aditivo, retrocompat).
  // Computado uma vez e cacheado; refeito apenas quando portraitId mudar.
  var _portraitCache   = { id: null, data: null };
  var _portraitFetching = false;

  function _downscaleDataURI(dataURI, maxDim, cb) {
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h || (w <= maxDim && h <= maxDim)) { cb(dataURI); return; }
      var ratio = Math.min(maxDim / w, maxDim / h);
      var nw = Math.round(w * ratio), nh = Math.round(h * ratio);
      var canvas = document.createElement('canvas');
      canvas.width = nw; canvas.height = nh;
      var ctx = canvas.getContext('2d');
      if (!ctx) { cb(dataURI); return; }
      ctx.drawImage(img, 0, 0, nw, nh);
      try { cb(canvas.toDataURL('image/jpeg', 0.75)); } catch (e) { cb(dataURI); }
    };
    img.onerror = function () { cb(null); };
    img.src = dataURI;
  }

  function _schedulePortraitFetch(portraitId) {
    if (_portraitFetching) return;
    _portraitFetching = true;
    var mp = window.CoC && window.CoC.mediaPicker;
    if (!mp || !mp.blobIdToDataURI) { _portraitFetching = false; return; }
    mp.blobIdToDataURI(portraitId).then(function (dataURI) {
      if (!dataURI) {
        _portraitFetching = false;
        _portraitCache = { id: portraitId, data: null };
        return;
      }
      _downscaleDataURI(dataURI, 128, function (mini) {
        _portraitFetching = false;
        _portraitCache = { id: portraitId, data: mini };
        _broadcastStatus(); // rebroadcast agora que o retrato está pronto
      });
    }).catch(function () {
      _portraitFetching = false;
      _portraitCache = { id: portraitId, data: null };
    });
  }

  // Flags booleanas de condição em c.status → rótulos para o painel do Mestre.
  var _CONDITION_FLAGS = {
    majorWound:  'Ferimento Grave',
    unconscious: 'Inconsciente',
    dying:       'Morrendo',
    dead:        'Morto',
    sangrando:   'Sangrando',
    envenenado:  'Envenenado',
    atordoado:   'Atordoado',
    exausto:     'Exausto'
  };

  function $s(sel) { return document.querySelector(sel); }

  function init() {
    _tp  = window.CoC.campaign && window.CoC.campaign.transport;
    _cs  = window.CoC.campaign && window.CoC.campaign.store;
    _str = window.CoC && window.CoC.store;

    if (!_tp || !_cs || !_str) return;

    _bindPlayerUI();
    _listenStore();
    _listenBus();

    // Auto-restore session on page refresh. Players reconnect silently.
    var saved = _cs.getState();
    if (saved.connected && saved.id) {
      _tp.init(saved.id, saved.role);
      _tp.onEvent(_onTransportEvent);
      _cs.markActive();
      _connectDurable(saved.pin || saved.id, saved.role || 'player');
      _broadcastStatus();
    }
  }

  // Liga (best-effort) a persistência durável: o broadcast já cobre a sessão
  // viva; o banco é o lastro p/ reload/late-join. Falha aqui não afeta o jogo.
  function _connectDurable(pin, role) {
    var sync = window.CoC.campaign && window.CoC.campaign.sync;
    if (!sync || !sync.isEnabled()) return;
    try { sync.connect({ pin: pin, role: role || 'player', peerId: _tp.getPeerId() }); } catch (e) {}
  }

  function _bindPlayerUI() {
    // Adicionar painel de campanha no investigador (se houver #toolbar)
    var toolbar = document.querySelector('.toolbar');
    if (!toolbar) return;

    // Injetar botão de campanha na toolbar do investigador
    var btnCampaign = document.createElement('button');
    btnCampaign.id = 'btn-player-campaign';
    btnCampaign.className = 'btn-ghost';
    btnCampaign.title = 'Entrar em campanha com PIN';
    btnCampaign.textContent = '🌐 Campanha';

    // Inserir antes do spacer
    var spacer = toolbar.querySelector('.toolbar-spacer');
    if (spacer) {
      toolbar.insertBefore(btnCampaign, spacer);
    } else {
      toolbar.appendChild(btnCampaign);
    }

    btnCampaign.onclick = _openPlayerCampaignModal;

    // Painel flutuante de status (quando em campanha)
    _renderPlayerCampaignBadge();
  }

  function _openPlayerCampaignModal() {
    var state = _cs.getState();
    if (state.connected) {
      var leave = confirm('Você está na campanha "' + state.name + '" (PIN: ' + state.pin + ').\n\nSair da campanha?');
      if (leave) {
        var ontologyLeave = window.CoC.campaign && window.CoC.campaign.ontology;
        var discEvt = ontologyLeave
          ? ontologyLeave.make('PLAYER_DISCONNECTED', { playerName: _playerName })
          : { type: 'PLAYER_DISCONNECTED', playerName: _playerName };
        _tp.broadcast(discEvt);
        _tp.close();
        _cs.leaveCampaign();
        _renderPlayerCampaignBadge();
      }
      return;
    }

    var pin = window.prompt('Digite o PIN da campanha (6 dígitos):');
    if (!pin) return;

    var pinSys = window.CoC.campaign && window.CoC.campaign.pin;
    if (!pinSys || !pinSys.validate(pin.trim())) {
      alert('PIN inválido.');
      return;
    }

    _playerName = window.prompt('Seu nome de jogador:', '') || 'Jogador';

    _cs.joinCampaign(pin.trim(), pin.trim(), 'player');
    _tp.init(pin.trim(), 'player');
    _tp.onEvent(_onTransportEvent);
    _connectDurable(pin.trim(), 'player');

    var ontology = window.CoC.campaign && window.CoC.campaign.ontology;
    _broadcastStatus();
    var connEvt = ontology
      ? ontology.make('PLAYER_CONNECTED', { playerName: _playerName })
      : { type: 'PLAYER_CONNECTED', playerName: _playerName };
    _tp.broadcast(connEvt);
    _renderPlayerCampaignBadge();
  }

  function _renderPlayerCampaignBadge() {
    var existing = document.querySelector('.player-campaign-badge');
    if (existing) existing.remove();

    var state = _cs.getState();
    if (!state.connected) return;

    var badge = document.createElement('div');
    badge.className = 'player-campaign-badge';
    badge.innerHTML =
      '<span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--ink-faded);">CAMPANHA</span> ' +
      '<strong style="color:var(--brass-bright);">' + (state.name || '?') + '</strong> ' +
      '<span style="color:var(--ink-faded);">PIN: <b style="color:var(--ink);">' + state.pin + '</b></span>';
    badge.style.cssText = [
      'position:fixed', 'bottom:1rem', 'right:1rem',
      'background:var(--bg-card)', 'border:1px solid var(--brass)',
      'border-radius:var(--radius-lg)', 'padding:0.45rem 0.85rem',
      'z-index:100', 'font-size:0.82rem', 'cursor:pointer',
      'box-shadow:0 4px 18px rgba(0,0,0,0.5)'
    ].join(';');
    badge.title = 'Clique para sair da campanha';
    badge.onclick = _openPlayerCampaignModal;

    document.body.appendChild(badge);
  }

  // ── Store listener ──────────────────────────────────────────────────────────
  function _listenStore() {
    if (!_str.subscribe) return;
    _str.subscribe(function () {
      var state = _cs.getState();
      if (state.connected) _broadcastStatus();
    });
  }

  function _broadcastStatus() {
    if (!_tp || !_str) return;
    var campaignState = _cs.getState();
    if (!campaignState.connected) return;

    var charState = _str.getState();
    if (!charState || !charState.character) return;

    var c = charState.character;
    var inv = c.investigator || {};
    var der = c.derived     || {};
    var st  = c.status      || {};
    var attrs  = c.attributes || {};
    var skills = c.skills     || {};

    // Condições ativas → rótulos legíveis (o Mestre vê o estado da mesa de relance).
    var conditions = [];
    Object.keys(_CONDITION_FLAGS).forEach(function (k) {
      if (st[k]) conditions.push(_CONDITION_FLAGS[k]);
    });
    if (st.temporaryInsanity)  conditions.push('Loucura Temporária');
    if (st.indefiniteInsanity) conditions.push('Loucura Indefinida');

    // Atributos (compactos) → painel de visão geral.
    var attrsOut = {};
    _ATTR_ORDER.forEach(function (code) { if (attrs[code]) attrsOut[code] = Number(attrs[code].value) || 0; });

    // TODAS as perícias do catálogo com o valor EFETIVO (alocado, senão a base),
    // para o Guardião ver a ficha completa em "Abrir Ficha" — não só as com pontos.
    var skillsOut = {};
    var rules   = window.CoC && window.CoC.rules;
    var catalog = (window.CoCData && window.CoCData.skills) || [];
    catalog.forEach(function (def) {
      var sk = skills[def.name];
      var v  = (sk && sk.value != null)
        ? Number(sk.value)
        : (rules && rules.calcSkillBase ? rules.calcSkillBase(def.name, attrs) : (Number(def.base) || 0));
      skillsOut[def.name] = Number(v) || 0;
    });
    // Perícias customizadas / especializações fora do catálogo (ex.: "Ciência (Biologia)").
    Object.keys(skills).forEach(function (name) {
      if (skillsOut[name] == null) {
        var v = skills[name] && skills[name].value;
        if (v != null) skillsOut[name] = Number(v) || 0;
      }
    });

    // Retrato: envia o miniatura cacheada quando disponível; dispara fetch se portraitId mudou.
    var portraitId = inv.portraitId || null;
    if (portraitId && _portraitCache.id !== portraitId) {
      _schedulePortraitFetch(portraitId);
    }

    var ontology = window.CoC.campaign && window.CoC.campaign.ontology;
    var statusPayload = {
      // Prefere o nome ATUAL da ficha (vivo) sobre o _playerName capturado no join
      // (que ficava obsoleto ao trocar de personagem). Prompt do join = fallback.
      playerName:    inv.playerName || _playerName || 'Jogador',
      characterName: inv.name || '?',
      seqNo:         _seqNo,
      status: {
        hp:     der.PV  ? (der.PV.current  != null ? der.PV.current  : der.PV.value  || 0) : 0,
        hpMax:  der.PV  ? (der.PV.value    || 1) : 1,
        san:    der.SAN ? (der.SAN.current != null ? der.SAN.current : der.SAN.value || 0) : 0,
        sanMax: der.SAN ? (der.SAN.max     || 1) : 1,
        mp:     der.PM  ? (der.PM.current  != null ? der.PM.current  : der.PM.value  || 0) : 0,
        mpMax:  der.PM  ? (der.PM.value    || 1) : 1,
        luck:   attrs.Sorte ? (attrs.Sorte.value || 0) : 0,
        armor:      Number(st.armor) || 0,
        conditions: conditions,
        attrs:      attrsOut,
        skills:     skillsOut,
        // Campos aditivos (clientes antigos os omitem → keeper cai no fallback).
        occupation: inv.occupation || '',
        portrait:   (portraitId && _portraitCache.id === portraitId) ? _portraitCache.data : null
      }
    };
    var statusEvt = ontology
      ? ontology.make('INVESTIGATOR_STATUS', statusPayload)
      : Object.assign({ type: 'INVESTIGATOR_STATUS' }, statusPayload);
    _tp.broadcast(statusEvt);

    _persistSnapshot(statusPayload);
  }

  // Checkpoint durável do investigador (debounced — não martela o banco a cada
  // tecla; o broadcast já dá o tempo-real). vitals = o `status` rico do roster.
  function _persistSnapshot(statusPayload) {
    var sync = window.CoC.campaign && window.CoC.campaign.sync;
    if (!sync || !sync.isLive()) return;
    if (_snapTimer) clearTimeout(_snapTimer);
    _snapTimer = setTimeout(function () {
      try {
        sync.snapshot({
          peerId:        _tp.getPeerId(),
          playerName:    statusPayload.playerName,
          characterName: statusPayload.characterName,
          character:     {},
          vitals:        statusPayload.status || {},
          lastSeq:       _seqNo
        });
      } catch (e) {}
    }, 1500);
  }

  function _onTransportEvent(event) {
    if (!event) return;
    // Mensagem do Guardião → log do jogador. O receptor interno do chat
    // (chat.mount → transport.onEvent) é apagado por todo transport.init()
    // (que reseta _handlers); só _onTransportEvent é re-registrado. Encaminhamos
    // aqui — espelha keeper-dashboard.js. O chat deduplica por msgId.
    if (event.type === 'CHAT_MESSAGE') {
      if (window.CoC.views && window.CoC.views.chat && window.CoC.views.chat.receive) {
        window.CoC.views.chat.receive(event);
      }
      return;
    }
    if (event.type === 'REQUEST_STATUS') {
      _broadcastStatus();
    }
    if (event.type === 'CAMPAIGN_ENDED') {
      _cs.leaveCampaign();
      _tp.close();
      _renderPlayerCampaignBadge();
      var ui = window.CoC && window.CoC.ui;
      if (ui && ui.toast) ui.toast('A campanha foi encerrada pelo Guardião.', { type: 'info', duration: 5000 });
    }
    // Ajuste de vital enviado pelo Guardião: aplica na ficha do jogador.
    if (event.type === 'KEEPER_VITALS_ADJUST' && event.targetPeerId === _tp.getPeerId()) {
      var executor = window.CoC && window.CoC.core && window.CoC.core.executor;
      var actions  = window.CoC && window.CoC.actions;
      if (!executor || !actions) return;
      var amt = Number(event.amount) || 0;
      if (amt <= 0) return;
      if (event.kind === 'dano') {
        executor.execute(actions.applyDamage(amt, 'keeper'));
      } else if (event.kind === 'san') {
        executor.execute(actions.loseSanity(amt, 'keeper'));
      }
    }
  }

  // ── Bus listener para broadcast de trace events ─────────────────────────────
  // Subscribes to executor:action published by js/core/executor.js on every
  // successful dispatch. No monkey-patching needed — executor is frozen.
  function _listenBus() {
    var bus = window.CoC && window.CoC.bus;
    if (!bus || !bus.subscribe) return;

    bus.subscribe('executor:action', function (data) {
      if (!_cs || !_tp) return;
      var cState = _cs.getState();
      if (!cState.connected) return;

      var charState = _str ? _str.getState() : null;
      if (!charState || !charState.character) return;

      var inv      = charState.character.investigator || {};
      var ontology = window.CoC.campaign && window.CoC.campaign.ontology;

      var seq = ++_seqNo;
      var tracePayload = {
        characterName: inv.name    || '?',
        playerName:    inv.playerName || _playerName || '?',
        entry:         { type: data.type, payload: data.payload },
        seqNo:         seq,
        eventId:       (_tp.getPeerId() || '?') + ':' + seq
      };
      var traceEvt = ontology
        ? ontology.make('EXECUTION_TRACE', tracePayload)
        : Object.assign({ type: 'EXECUTION_TRACE' }, tracePayload);

      _tp.broadcast(traceEvt);

      // Lastro durável: grava o evento de domínio (type+payload) com o ator
      // embutido, para o replay no reload reconstruir a timeline sem o vivo.
      var sync = window.CoC.campaign && window.CoC.campaign.sync;
      if (sync && sync.isLive()) {
        var actorName = inv.name || _playerName || '?';
        var actorPlayer = inv.playerName || _playerName || '';
        if (inv.name && actorPlayer && actorPlayer !== inv.name) {
          actorName = inv.name + ' (' + actorPlayer + ')';
        }
        var durablePayload = Object.assign({ _actor: actorName }, data.payload || {});
        sync.record({ type: data.type, payload: durablePayload });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CoC.campaign.playerSync = Object.freeze({ init: init });

})();
