/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/keeper-notes-advanced.js
   Advanced Notes System — Obsidian/Notion style

   Features:
   - Markdown support (via mini-md.js)
   - Wikilinks [[note|label]] com autocomplete
   - Backlinks reverse index
   - Search & filter
   - Nested folders (future)
   - Export (future)

   Phase A: Markdown + Wikilinks parsing/resolution
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};
window.CoC.keeperNotes = window.CoC.keeperNotes || {};

(function () {
  "use strict";

  // ─── Data Store ──────────────────────────────────────────────────────────
  // Todas as notas vivem num único registro localStorage (mesmo padrão de
  // keeper-journal.js: prefixo aimalexi-rpg/). Mapa { id → note }.
  // Schema: { id, title, content, folder, tags, wikilinks, createdAt,
  //           updatedAt, deletedAt?, _history? }

  var LS_KEY = "aimalexi-rpg/keeper-notes-v1";
  var _cache = null;

  function _loadDb() {
    if (_cache) return _cache;
    try {
      var raw = (typeof localStorage !== "undefined") ? localStorage.getItem(LS_KEY) : null;
      _cache = raw ? JSON.parse(raw) : {};
    } catch (e) { _cache = {}; }
    if (!_cache || typeof _cache !== "object") _cache = {};
    return _cache;
  }

  function _saveDb() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(LS_KEY, JSON.stringify(_cache));
      }
    } catch (e) {}
  }

  // ─── Wikilink Regex ──────────────────────────────────────────────────────
  // [[target]] ou [[target|display text]]
  var WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  // ─── Note CRUD ───────────────────────────────────────────────────────────

  function generateId() {
    // crypto, nunca Math.random (constraint do projeto)
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return "note-" + crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      var b = crypto.getRandomValues(new Uint8Array(8));
      var hex = Array.prototype.map.call(b, function (x) {
        return x.toString(16).padStart(2, "0");
      }).join("");
      return "note-" + Date.now() + "-" + hex;
    }
    return "note-" + Date.now();
  }

  function createNote(title, content, folder, tags, fields) {
    var note = {
      id: generateId(),
      title: title || "Sem título",
      content: content || "",
      folder: folder || null,
      tags: tags || [],
      fields: fields || {},   // campos customizados { chave: valor } (ex.: PV: "12")
      wikilinks: extractWikilinks(content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionId: null
    };

    _loadDb()[note.id] = note;
    _saveDb();

    return note;
  }

  function readNote(id) {
    return _loadDb()[id] || null;
  }

  // Versionamento: guarda snapshot do conteúdo anterior quando ele muda.
  // Mantém só os últimos MAX_HISTORY para não estourar o storage.
  var MAX_HISTORY = 10;

  function updateNote(id, updates) {
    var note = readNote(id);
    if (!note) return null;

    // Snapshot apenas quando o conteúdo realmente muda
    if (updates.content !== undefined && updates.content !== note.content) {
      note._history = note._history || [];
      note._history.push({
        content: note.content,
        title: note.title,
        savedAt: note.updatedAt
      });
      if (note._history.length > MAX_HISTORY) {
        note._history = note._history.slice(-MAX_HISTORY);
      }
    }

    Object.assign(note, updates, {
      updatedAt: new Date().toISOString(),
      wikilinks: extractWikilinks(updates.content !== undefined ? updates.content : note.content)
    });

    _loadDb()[id] = note;
    _saveDb();

    return note;
  }

  function getHistory(id) {
    var note = readNote(id);
    return (note && note._history) ? note._history.slice().reverse() : [];
  }

  function restoreVersion(id, historyIndex) {
    var history = getHistory(id);
    var snapshot = history[historyIndex];
    if (!snapshot) return null;
    return updateNote(id, { content: snapshot.content, title: snapshot.title });
  }

  // Soft delete: marca deletedAt; a nota some das listas mas pode ser restaurada
  // por 30 dias. purgeExpired() remove definitivamente as expiradas.
  var TRASH_RETENTION_DAYS = 30;

  function deleteNote(id) {
    var note = readNote(id);
    if (!note) return false;
    note.deletedAt = new Date().toISOString();
    _saveDb();
    return true;
  }

  function restoreNote(id) {
    var note = readNote(id);
    if (!note || !note.deletedAt) return null;
    delete note.deletedAt;
    note.updatedAt = new Date().toISOString();
    _saveDb();
    return note;
  }

  function purgeNote(id) {
    var db = _loadDb();
    if (!db[id]) return false;
    delete db[id];
    _saveDb();
    return true;
  }

  function getTrash() {
    return _allNotes().filter(function (n) { return !!n.deletedAt; });
  }

  function purgeExpired() {
    var cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    var purged = 0;
    getTrash().forEach(function (n) {
      var t = Date.parse(n.deletedAt);
      if (!isNaN(t) && t < cutoff) {
        purgeNote(n.id);
        purged++;
      }
    });
    return purged;
  }

  // Helper interno: todas as notas (incluindo deletadas)
  function _allNotes() {
    var db = _loadDb();
    var out = [];
    for (var id in db) {
      if (Object.prototype.hasOwnProperty.call(db, id) && db[id]) out.push(db[id]);
    }
    return out;
  }

  // Notas ativas (não deletadas) — usado por listas, busca e backlinks
  function listNotes() {
    return _allNotes().filter(function (n) { return !n.deletedAt; });
  }

  // ─── Wikilinks ───────────────────────────────────────────────────────────

  function extractWikilinks(content) {
    var links = [];
    var match;
    while ((match = WIKILINK_PATTERN.exec(content)) !== null) {
      links.push({
        target: match[1].toLowerCase().trim(),
        display: match[2] || match[1]
      });
    }
    return links;
  }

  function resolveWikilink(target) {
    // Procura por nota ativa com título match (case-insensitive)
    target = target.toLowerCase().trim();
    var notes = listNotes();
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].title && notes[i].title.toLowerCase() === target) {
        return notes[i];
      }
    }
    return null;
  }

  function renderWikilink(target, display) {
    var note = resolveWikilink(target);
    if (note) {
      return '<a href="#" class="journal-link" data-note-id="' + note.id + '">' +
             escapeHtml(display) + '</a>';
    } else {
      return '<span class="wikilink-broken">' + escapeHtml(display) + '</span>';
    }
  }

  function processWikilinksInContent(content) {
    return content.replace(WIKILINK_PATTERN, function (match, target, display) {
      return renderWikilink(target, display || target);
    });
  }

  // ─── Backlinks ───────────────────────────────────────────────────────────

  function getBacklinks(noteId) {
    var currentNote = readNote(noteId);
    if (!currentNote) return [];

    var backlinks = [];
    var notes = listNotes();
    for (var i = 0; i < notes.length; i++) {
      var note = notes[i];
      if (note.id !== noteId && note.wikilinks) {
        for (var j = 0; j < note.wikilinks.length; j++) {
          if (note.wikilinks[j].target === currentNote.title.toLowerCase()) {
            backlinks.push({
              noteId: note.id,
              title: note.title,
              display: note.wikilinks[j].display
            });
          }
        }
      }
    }
    return backlinks;
  }

  // ─── Search ──────────────────────────────────────────────────────────────

  // ── Busca com operadores ────────────────────────────────────────────────
  // Suporta: tag:x · folder:x · campo:chave=valor (ou field:) ·
  //          created:>2026-01-01 · updated:<7d ·
  //          "frase exata" · -excluído · termos livres (AND implícito)
  function parseSearchQuery(query) {
    var parsed = { terms: [], phrases: [], excluded: [], tags: [], folders: [], fields: [], created: null, updated: null };
    if (!query) return parsed;

    // Extrai frases exatas primeiro
    var rest = query.replace(/"([^"]+)"/g, function (m, phrase) {
      parsed.phrases.push(phrase.toLowerCase());
      return " ";
    });

    rest.split(/\s+/).forEach(function (tok) {
      if (!tok) return;
      var m;
      if ((m = tok.match(/^tag:(.+)$/i))) { parsed.tags.push(m[1].toLowerCase().replace(/^#/, "")); return; }
      if ((m = tok.match(/^folder:(.+)$/i))) { parsed.folders.push(m[1].toLowerCase()); return; }
      if ((m = tok.match(/^(?:campo|field):([^=]+)(?:=(.+))?$/i))) {
        parsed.fields.push({ key: m[1].toLowerCase(), value: m[2] !== undefined ? m[2].toLowerCase() : null });
        return;
      }
      if ((m = tok.match(/^created:([<>])(.+)$/i))) { parsed.created = { op: m[1], value: m[2] }; return; }
      if ((m = tok.match(/^updated:([<>])(.+)$/i))) { parsed.updated = { op: m[1], value: m[2] }; return; }
      if (tok.charAt(0) === "-" && tok.length > 1) { parsed.excluded.push(tok.slice(1).toLowerCase()); return; }
      parsed.terms.push(tok.toLowerCase());
    });

    return parsed;
  }

  // campo:chave → nota tem o campo; campo:chave=valor → valor contém (substring)
  function _matchFieldFilter(note, filter) {
    var fields = note.fields || {};
    for (var key in fields) {
      if (!Object.prototype.hasOwnProperty.call(fields, key)) continue;
      if (key.toLowerCase() !== filter.key) continue;
      if (filter.value === null) return true;
      return String(fields[key]).toLowerCase().indexOf(filter.value) !== -1;
    }
    return false;
  }

  // Converte valor de filtro de data: "2026-01-01" (absoluto) ou "7d"/"2w"/"1m" (relativo)
  function _dateFilterToTimestamp(value) {
    var rel = value.match(/^(\d+)([dwmy])$/i);
    if (rel) {
      var n = parseInt(rel[1], 10);
      var unitMs = { d: 86400000, w: 604800000, m: 2592000000, y: 31536000000 }[rel[2].toLowerCase()];
      return Date.now() - n * unitMs;
    }
    var abs = Date.parse(value);
    return isNaN(abs) ? null : abs;
  }

  function _matchDateFilter(noteDate, filter) {
    var ts = Date.parse(noteDate);
    if (isNaN(ts)) return false;
    var ref = _dateFilterToTimestamp(filter.value);
    if (ref == null) return true; // filtro inválido: não exclui
    // Para datas relativas (7d), "updated:<7d" significa "nos últimos 7 dias" → ts > ref
    var isRelative = /^\d+[dwmy]$/i.test(filter.value);
    if (isRelative) return filter.op === "<" ? ts >= ref : ts < ref;
    return filter.op === ">" ? ts > ref : ts < ref;
  }

  function searchNotes(query) {
    if (!query) return [];
    var parsed = parseSearchQuery(query);
    var notes = listNotes();

    return notes.filter(function (note) {
      var haystack = ((note.title || "") + "\n" + (note.content || "")).toLowerCase();

      for (var i = 0; i < parsed.terms.length; i++) {
        if (haystack.indexOf(parsed.terms[i]) === -1) return false;
      }
      for (i = 0; i < parsed.phrases.length; i++) {
        if (haystack.indexOf(parsed.phrases[i]) === -1) return false;
      }
      for (i = 0; i < parsed.excluded.length; i++) {
        if (haystack.indexOf(parsed.excluded[i]) !== -1) return false;
      }
      for (i = 0; i < parsed.tags.length; i++) {
        var noteTags = (note.tags || []).map(function (t) { return t.toLowerCase(); });
        if (noteTags.indexOf(parsed.tags[i]) === -1) return false;
      }
      for (i = 0; i < parsed.folders.length; i++) {
        if ((note.folder || "").toLowerCase().indexOf(parsed.folders[i]) === -1) return false;
      }
      for (i = 0; i < parsed.fields.length; i++) {
        if (!_matchFieldFilter(note, parsed.fields[i])) return false;
      }
      if (parsed.created && !_matchDateFilter(note.createdAt, parsed.created)) return false;
      if (parsed.updated && !_matchDateFilter(note.updatedAt, parsed.updated)) return false;

      return true;
    });
  }

  function searchByTag(tag) {
    return listNotes().filter(function (note) {
      return note.tags && note.tags.indexOf(tag) !== -1;
    });
  }

  // ─── Export ──────────────────────────────────────────────────────────────

  function exportMarkdown(noteId) {
    var note = readNote(noteId);
    if (!note) return "";

    var md = "# " + note.title + "\n\n";

    // Campos customizados como tabela
    var fieldKeys = Object.keys(note.fields || {});
    if (fieldKeys.length > 0) {
      md += "| Campo | Valor |\n|---|---|\n";
      fieldKeys.forEach(function (k) {
        md += "| " + k + " | " + note.fields[k] + " |\n";
      });
      md += "\n";
    }

    md += note.content + "\n\n";

    if (note.tags.length > 0) {
      md += "**Tags:** " + note.tags.join(", ") + "\n\n";
    }

    var backlinks = getBacklinks(noteId);
    if (backlinks.length > 0) {
      md += "## Referências\n\n";
      for (var i = 0; i < backlinks.length; i++) {
        md += "- [[" + backlinks[i].title + "]]\n";
      }
    }

    return md;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function escapeHtml(text) {
    var map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  window.CoC.keeperNotes = {
    // CRUD
    create: createNote,
    read: readNote,
    update: updateNote,
    delete: deleteNote,
    list: listNotes,

    // Trash (soft delete)
    restore: restoreNote,
    purge: purgeNote,
    getTrash: getTrash,
    purgeExpired: purgeExpired,

    // Versioning
    getHistory: getHistory,
    restoreVersion: restoreVersion,

    // Wikilinks
    extractWikilinks: extractWikilinks,
    resolveWikilink: resolveWikilink,
    renderWikilink: renderWikilink,
    processWikilinks: processWikilinksInContent,

    // Backlinks
    getBacklinks: getBacklinks,

    // Search
    search: searchNotes,
    searchByTag: searchByTag,
    parseSearchQuery: parseSearchQuery,

    // Export
    exportMarkdown: exportMarkdown,

    // Helpers
    escapeHtml: escapeHtml
  };

  console.log("[keeper-notes] Advanced Notes System initialized");

})();
