/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/keeper-journal.js
   ETAPA 6 (#14) — Diário avançado do Guardião.

   Substitui a textarea livre por tópicos estruturados:
     { id, category, title, content, date, order }

   Categorias: Sessão, NPCs, Locais, Mistérios, Pistas, Eventos, Cronologia, Observações.
   Persistência local (localStorage, prefixo aimalexi-rpg/). Migra o keeper-journal
   antigo (texto livre) para um tópico de "Observações" na primeira execução.

   Expõe: window.CoC.keeperJournal = { init, render }
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var PREFIX = 'aimalexi-rpg/';
  var KEY    = 'keeper-journal-topics';

  var CATEGORIES = [
    { id: 'sessao',      label: 'Sessão',      icon: '🎬' },
    { id: 'npc',         label: 'NPCs',         icon: '🎭' },
    { id: 'local',       label: 'Locais',       icon: '🗺️' },
    { id: 'misterio',    label: 'Mistérios',    icon: '🔮' },
    { id: 'pista',       label: 'Pistas',       icon: '🔍' },
    { id: 'evento',      label: 'Eventos',      icon: '⚡' },
    { id: 'cronologia',  label: 'Cronologia',   icon: '📅' },
    { id: 'observacao',  label: 'Observações',  icon: '📝' },
  ];

  var _filter = 'all';

  // ── Storage ─────────────────────────────────────────────────────────────────
  function _load() {
    try { var v = localStorage.getItem(PREFIX + KEY); return v ? JSON.parse(v) : null; }
    catch (e) { return null; }
  }
  function _save(topics) {
    try { localStorage.setItem(PREFIX + KEY, JSON.stringify(topics)); } catch (e) {}
  }
  function _uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      var b = crypto.getRandomValues(new Uint8Array(8));
      return 'j-' + Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    }
    return 'j-' + Date.now().toString(36);
  }

  // Migração one-time do diário antigo (texto livre) → tópico de Observações.
  function _getTopics() {
    var topics = _load();
    if (topics != null) return topics;
    topics = [];
    try {
      var oldRaw = localStorage.getItem(PREFIX + 'keeper-journal');
      var old = oldRaw ? JSON.parse(oldRaw) : '';
      if (old && typeof old === 'string' && old.trim()) {
        topics.push({
          id: _uuid(), category: 'observacao',
          title: 'Anotações (importadas)', content: old,
          date: new Date().toISOString().slice(0, 10), order: 0
        });
      }
    } catch (e) {}
    _save(topics);
    return topics;
  }

  function _catMeta(id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
    return { id: id, label: id, icon: '•' };
  }
  function _esc(s) {
    var ui = window.CoC && window.CoC.ui;
    if (ui && ui.escapeHtml) return ui.escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  function render() {
    var container = document.getElementById('journal-topics');
    if (!container) return;
    var topics = _getTopics();

    // Ordena por order, depois data desc
    var sorted = topics.slice().sort(function (a, b) {
      if ((a.order || 0) !== (b.order || 0)) return (a.order || 0) - (b.order || 0);
      return (b.date || '').localeCompare(a.date || '');
    });
    var visible = _filter === 'all' ? sorted : sorted.filter(function (t) { return t.category === _filter; });

    if (visible.length === 0) {
      container.innerHTML = '<p class="journal-empty">Nenhum tópico' +
        (_filter !== 'all' ? ' nesta categoria' : '') +
        '. Clique em <b>+ Novo Tópico</b>.</p>';
      return;
    }

    // Agrupa por pasta (Notion-like): "/" no rótulo sugere subpastas.
    var groups = {}, order = [];
    visible.forEach(function (t) {
      var f = (t.folder || '').trim() || '— Sem pasta —';
      if (!groups[f]) { groups[f] = []; order.push(f); }
      groups[f].push(t);
    });
    order.sort(function (a, b) { return a.localeCompare(b); });

    _releaseImages(container);   // revoga ObjectURLs antigos antes de trocar o HTML
    container.innerHTML = order.map(function (f) {
      return '<details class="journal-folder" open>' +
        '<summary class="journal-folder-head">📁 ' + _esc(f) +
          ' <span class="journal-folder-count">' + groups[f].length + '</span></summary>' +
        '<div class="journal-folder-body">' + groups[f].map(_cardHtml).join('') + '</div>' +
      '</details>';
    }).join('');

    _hydrateImages(container);
  }

  // Revoga as ObjectURLs dos thumbnails atuais (evita vazamento ao re-renderizar
  // via innerHTML, que destrói os elementos sem liberar a URL). render(el, null)
  // chama releaseEl internamente.
  function _releaseImages(container) {
    var mp = window.CoC && window.CoC.mediaPicker;
    if (!mp || !mp.render || !container) return;
    var thumbs = container.querySelectorAll('.journal-thumb[data-journal-img]');
    Array.prototype.forEach.call(thumbs, function (el) { mp.render(el, null); });
  }

  // Lightbox simples para ver a imagem em tamanho cheio (clique no thumbnail).
  function _openLightbox(blobId) {
    var store = window.CoC && window.CoC.storage;
    if (!store || !store.getBlob) return;
    Promise.resolve(store.getBlob(blobId)).then(function (blob) {
      if (!(blob instanceof Blob)) return;
      var url = URL.createObjectURL(blob);
      var ov = document.createElement('div');
      ov.className = 'journal-lightbox';
      ov.innerHTML = '<img alt="Anexo do diário" src="' + url + '" />';
      function close() {
        try { URL.revokeObjectURL(url); } catch (e) {}
        document.removeEventListener('keydown', onKey);
        ov.remove();
      }
      function onKey(e) { if (e.key === 'Escape') close(); }
      ov.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      document.body.appendChild(ov);
    });
  }

  function _cardHtml(t) {
    var cat = _catMeta(t.category);
    var imgs = Array.isArray(t.images) ? t.images : [];
    var imgHtml = imgs.length
      ? '<div class="journal-card-images">' + imgs.map(function (id) {
          return '<button type="button" class="journal-thumb" data-journal-img="' + _esc(id) + '" title="Ver imagem"></button>';
        }).join('') + '</div>'
      : '';
    return '<article class="journal-card" data-id="' + _esc(t.id) + '">' +
      '<div class="journal-card-head">' +
        '<span class="journal-cat-badge">' + cat.icon + ' ' + _esc(cat.label) + '</span>' +
        '<span class="journal-date">' + _esc(t.date || '') + '</span>' +
        '<div class="journal-card-actions">' +
          '<button class="btn-ghost btn-icon" data-journal-edit="' + _esc(t.id) + '" title="Editar">✎</button>' +
          '<button class="btn-danger btn-icon" data-journal-del="' + _esc(t.id) + '" title="Remover">🗑️</button>' +
        '</div>' +
      '</div>' +
      '<h4 class="journal-title">' + _esc(t.title || '(sem título)') + '</h4>' +
      '<div class="journal-content">' + _linkify(t.content) + '</div>' +
      imgHtml +
    '</article>';
  }

  // Popula os thumbnails (lazy, via Blob no IndexedDB) após o innerHTML. O
  // media-picker gerencia o ciclo de vida do ObjectURL por elemento.
  function _hydrateImages(container) {
    var mp = window.CoC && window.CoC.mediaPicker;
    if (!mp || !mp.render) return;
    var thumbs = container.querySelectorAll('.journal-thumb[data-journal-img]');
    Array.prototype.forEach.call(thumbs, function (el) {
      mp.render(el, el.getAttribute('data-journal-img'));
    });
  }

  // Converte [[Título]] em links clicáveis para outros tópicos (escapando o resto).
  function _linkify(raw) {
    raw = String(raw || '');
    var out = '', re = /\[\[([^\]]+)\]\]/g, last = 0, m;
    while ((m = re.exec(raw))) {
      out += _esc(raw.slice(last, m.index)).replace(/\n/g, '<br>');
      var t = m[1].trim();
      out += '<a href="#" class="journal-link" data-journal-link="' + _esc(t) + '">🔗 ' + _esc(t) + '</a>';
      last = re.lastIndex;
    }
    out += _esc(raw.slice(last)).replace(/\n/g, '<br>');
    return out;
  }

  // ── Edição (modal) ──────────────────────────────────────────────────────────
  function _openEditor(topic) {
    var ui = window.CoC && window.CoC.ui;
    if (!ui || !ui.modal) { _openEditorFallback(topic); return; }
    var mp = window.CoC && window.CoC.mediaPicker;
    var store = window.CoC && window.CoC.storage;
    var isNew = !topic;
    var t = topic || {
      id: _uuid(), category: 'sessao', title: '', content: '', folder: '',
      date: new Date().toISOString().slice(0, 10), order: 0, images: []
    };

    // Trabalha numa cópia das imagens: confirma no Salvar, descarta no Cancelar.
    var origImages = Array.isArray(t.images) ? t.images.slice() : [];
    var working    = origImages.slice();
    var saved      = false;

    var body = document.createElement('div');
    body.innerHTML =
      '<div style="display:grid;gap:0.5rem;">' +
        '<div><label>Categoria</label><select id="jt-cat" style="width:100%">' +
          CATEGORIES.map(function (c) {
            return '<option value="' + c.id + '"' + (c.id === t.category ? ' selected' : '') + '>' + c.icon + ' ' + c.label + '</option>';
          }).join('') +
        '</select></div>' +
        '<div><label>Título</label><input id="jt-title" value="' + _esc(t.title) + '" style="width:100%" /></div>' +
        '<div><label>Pasta (use / para subpastas)</label><input id="jt-folder" value="' + _esc(t.folder || '') + '" style="width:100%" placeholder="ex.: Ato 1/Mansão Corbitt" /></div>' +
        '<div><label>Data</label><input id="jt-date" type="date" value="' + _esc(t.date) + '" style="width:100%" /></div>' +
        '<div><label>Conteúdo <span style="color:var(--ink-faded);font-weight:normal">— use [[Título de outro tópico]] para vincular</span></label><textarea id="jt-content" rows="6" style="width:100%">' + _esc(t.content) + '</textarea></div>' +
        '<div><label>Imagens <span style="color:var(--ink-faded);font-weight:normal">— mapas, handouts, retratos</span></label>' +
          '<div id="jt-images" class="jt-images"></div>' +
          '<button type="button" id="jt-add-img" class="btn-ghost btn-sm"' + (mp && mp.pick ? '' : ' disabled title="Armazenamento de imagem indisponível"') + '>🖼 Adicionar imagem</button>' +
        '</div>' +
        '<div><label>Ordem (menor aparece antes)</label><input id="jt-order" type="number" value="' + (t.order || 0) + '" style="width:100%" /></div>' +
      '</div>';

    function _releaseStrip() {
      var strip = body.querySelector('#jt-images');
      if (!strip || !mp || !mp.render) return;
      Array.prototype.forEach.call(strip.querySelectorAll('[data-jt-thumb]'), function (el) { mp.render(el, null); });
    }

    function _drawStrip() {
      var strip = body.querySelector('#jt-images');
      if (!strip) return;
      _releaseStrip();   // revoga URLs antigas antes de repintar
      if (!working.length) {
        strip.innerHTML = '<span class="jt-images-empty">Nenhuma imagem.</span>';
        return;
      }
      strip.innerHTML = working.map(function (id) {
        return '<span class="jt-thumb-wrap">' +
          '<button type="button" class="journal-thumb" data-jt-thumb="' + _esc(id) + '" title="Ver"></button>' +
          '<button type="button" class="jt-thumb-del" data-jt-del="' + _esc(id) + '" title="Remover imagem">✕</button>' +
        '</span>';
      }).join('');
      if (mp && mp.render) {
        Array.prototype.forEach.call(strip.querySelectorAll('[data-jt-thumb]'), function (el) {
          mp.render(el, el.getAttribute('data-jt-thumb'));
        });
      }
    }

    body.addEventListener('click', function (e) {
      var view = e.target.closest('[data-jt-thumb]');
      if (view) { _openLightbox(view.getAttribute('data-jt-thumb')); return; }
      var del = e.target.closest('[data-jt-del]');
      if (del) {
        var id = del.getAttribute('data-jt-del');
        working = working.filter(function (x) { return x !== id; });
        _drawStrip();
      }
    });

    var addBtn = body.querySelector('#jt-add-img');
    if (addBtn && mp && mp.pick) {
      addBtn.addEventListener('click', function () {
        addBtn.disabled = true;
        Promise.resolve(mp.pick({ maxDim: 1280, quality: 0.82 })).then(function (id) {
          if (id) { working.push(id); _drawStrip(); }
        }).catch(function () {}).then(function () { addBtn.disabled = false; });
      });
    }

    _drawStrip();

    ui.modal({
      title: isNew ? 'Novo Tópico' : 'Editar Tópico',
      body: body,
      onClose: function () {
        _releaseStrip();   // revoga as ObjectURLs dos thumbnails do editor
        // Cancelado: descarta blobs recém-adicionados que não foram salvos.
        if (saved || !store || !store.deleteBlob) return;
        working.forEach(function (id) { if (origImages.indexOf(id) === -1) store.deleteBlob(id); });
      },
      actions: [
        { label: 'Cancelar' },
        { label: 'Salvar', primary: true, onClick: function () {
          t.category = document.getElementById('jt-cat').value;
          t.title    = (document.getElementById('jt-title').value || '').trim();
          t.folder   = (document.getElementById('jt-folder').value || '').trim();
          t.date     = document.getElementById('jt-date').value || t.date;
          t.content  = document.getElementById('jt-content').value || '';
          t.order    = parseInt(document.getElementById('jt-order').value, 10) || 0;
          t.images   = working.slice();
          saved      = true;
          // Limpa blobs realmente removidos (estavam no original, saíram agora).
          if (store && store.deleteBlob) {
            origImages.forEach(function (id) { if (working.indexOf(id) === -1) store.deleteBlob(id); });
          }
          var topics = _getTopics();
          var idx = topics.findIndex(function (x) { return x.id === t.id; });
          if (idx >= 0) topics[idx] = t; else topics.push(t);
          _save(topics);
          render();
        }}
      ]
    });
  }

  function _openEditorFallback(topic) {
    // Sem modal disponível — prompt simples
    var title = window.prompt('Título do tópico:', topic ? topic.title : '');
    if (title == null) return;
    var content = window.prompt('Conteúdo:', topic ? topic.content : '');
    var topics = _getTopics();
    var t = topic || { id: _uuid(), category: 'observacao', date: new Date().toISOString().slice(0, 10), order: 0 };
    t.title = title; t.content = content || '';
    var idx = topics.findIndex(function (x) { return x.id === t.id; });
    if (idx >= 0) topics[idx] = t; else topics.push(t);
    _save(topics);
    render();
  }

  // Navega até o tópico cujo título casa com o link [[...]], abrindo a pasta e
  // destacando o card.
  function _gotoByTitle(title) {
    var target = _getTopics().find(function (t) { return (t.title || '').trim() === title; });
    var container = document.getElementById('journal-topics');
    if (!target || !container) return;
    if (_filter !== 'all') {
      _filter = 'all';
      var sel = document.getElementById('journal-filter'); if (sel) sel.value = 'all';
      render();
    }
    var idSel = (window.CSS && CSS.escape) ? CSS.escape(target.id) : target.id;
    var card = container.querySelector('[data-id="' + idSel + '"]');
    if (card) {
      var det = card.closest('details'); if (det) det.open = true;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('journal-flash');
      setTimeout(function () { card.classList.remove('journal-flash'); }, 1500);
    }
  }

  function _deleteTopic(id) {
    var all = _getTopics();
    var gone = all.find(function (t) { return t.id === id; });
    // Libera os blobs das imagens do tópico removido (evita lixo no IndexedDB).
    var store = window.CoC && window.CoC.storage;
    if (gone && Array.isArray(gone.images) && store && store.deleteBlob) {
      gone.images.forEach(function (imgId) { store.deleteBlob(imgId); });
    }
    var topics = all.filter(function (t) { return t.id !== id; });
    _save(topics);
    render();
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    var addBtn = document.getElementById('btn-add-journal-topic');
    if (addBtn) addBtn.onclick = function () { _openEditor(null); };

    var filterSel = document.getElementById('journal-filter');
    if (filterSel) filterSel.onchange = function () { _filter = filterSel.value; render(); };

    var container = document.getElementById('journal-topics');
    if (container && !container._journalDelegated) {
      container._journalDelegated = true;
      container.addEventListener('click', function (e) {
        var thumb = e.target.closest('[data-journal-img]');
        if (thumb) { e.preventDefault(); _openLightbox(thumb.getAttribute('data-journal-img')); return; }
        var link = e.target.closest('[data-journal-link]');
        if (link) { e.preventDefault(); _gotoByTitle(link.dataset.journalLink); return; }
        var ed = e.target.closest('[data-journal-edit]');
        if (ed) {
          var topic = _getTopics().find(function (t) { return t.id === ed.dataset.journalEdit; });
          if (topic) _openEditor(topic);
          return;
        }
        var del = e.target.closest('[data-journal-del]');
        if (del) {
          var ui = window.CoC && window.CoC.ui;
          if (ui && ui.confirm) {
            ui.confirm('Remover este tópico do diário?', { title: 'Remover', danger: true })
              .then(function (ok) { if (ok) _deleteTopic(del.dataset.journalDel); });
          } else if (window.confirm('Remover este tópico?')) {
            _deleteTopic(del.dataset.journalDel);
          }
        }
      });
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.CoC = window.CoC || {};
  window.CoC.keeperJournal = { init: init, render: render };
})();
