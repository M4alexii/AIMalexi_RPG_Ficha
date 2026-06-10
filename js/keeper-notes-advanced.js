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
  // Todas as notas vivem em IndexedDB via window.CoC.storage
  // Schema: { id, title, content, folder, tags, wikilinks, createdAt, updatedAt }

  var store = window.CoC.storage || null;
  var PREFIX = "keeper-notes/";

  // ─── Wikilink Regex ──────────────────────────────────────────────────────
  // [[target]] ou [[target|display text]]
  var WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  // ─── Note CRUD ───────────────────────────────────────────────────────────

  function generateId() {
    return "note-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  }

  function createNote(title, content, folder, tags) {
    var note = {
      id: generateId(),
      title: title || "Sem título",
      content: content || "",
      folder: folder || null,
      tags: tags || [],
      wikilinks: extractWikilinks(content),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionId: null
    };

    // Persistir em storage se disponível
    if (store && store.setCustomData) {
      store.setCustomData(PREFIX + note.id, note);
    }

    return note;
  }

  function readNote(id) {
    if (!store || !store.getCustomData) return null;
    return store.getCustomData(PREFIX + id);
  }

  function updateNote(id, updates) {
    var note = readNote(id);
    if (!note) return null;

    Object.assign(note, updates, {
      updatedAt: new Date().toISOString(),
      wikilinks: extractWikilinks(updates.content || note.content)
    });

    if (store && store.setCustomData) {
      store.setCustomData(PREFIX + id, note);
    }

    return note;
  }

  function deleteNote(id) {
    if (!store || !store.deleteCustomData) return false;
    store.deleteCustomData(PREFIX + id);
    return true;
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
    // Procura por nota com título match (case-insensitive)
    target = target.toLowerCase().trim();
    if (!store || !store.getAllCustomData) return null;

    var allNotes = [];
    try {
      allNotes = store.getAllCustomData ? store.getAllCustomData() : [];
    } catch (e) {}

    for (var i = 0; i < allNotes.length; i++) {
      var item = allNotes[i];
      if (item && item.key && item.key.indexOf(PREFIX) === 0) {
        var note = item.value;
        if (note && note.title && note.title.toLowerCase() === target) {
          return note;
        }
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
    if (!store || !store.getAllCustomData) return [];

    var currentNote = readNote(noteId);
    if (!currentNote) return [];

    var backlinks = [];
    try {
      var allNotes = store.getAllCustomData ? store.getAllCustomData() : [];
      for (var i = 0; i < allNotes.length; i++) {
        var item = allNotes[i];
        if (item && item.key && item.key.indexOf(PREFIX) === 0) {
          var note = item.value;
          if (note && note.id !== noteId && note.wikilinks) {
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
      }
    } catch (e) {}

    return backlinks;
  }

  // ─── Search ──────────────────────────────────────────────────────────────

  function searchNotes(query) {
    if (!query || !store || !store.getAllCustomData) return [];

    var q = query.toLowerCase();
    var results = [];
    try {
      var allNotes = store.getAllCustomData ? store.getAllCustomData() : [];
      for (var i = 0; i < allNotes.length; i++) {
        var item = allNotes[i];
        if (item && item.key && item.key.indexOf(PREFIX) === 0) {
          var note = item.value;
          if (note && (
            note.title.toLowerCase().indexOf(q) !== -1 ||
            note.content.toLowerCase().indexOf(q) !== -1
          )) {
            results.push(note);
          }
        }
      }
    } catch (e) {}

    return results;
  }

  function searchByTag(tag) {
    if (!store || !store.getAllCustomData) return [];

    var results = [];
    try {
      var allNotes = store.getAllCustomData ? store.getAllCustomData() : [];
      for (var i = 0; i < allNotes.length; i++) {
        var item = allNotes[i];
        if (item && item.key && item.key.indexOf(PREFIX) === 0) {
          var note = item.value;
          if (note && note.tags && note.tags.indexOf(tag) !== -1) {
            results.push(note);
          }
        }
      }
    } catch (e) {}

    return results;
  }

  // ─── Export ──────────────────────────────────────────────────────────────

  function exportMarkdown(noteId) {
    var note = readNote(noteId);
    if (!note) return "";

    var md = "# " + note.title + "\n\n";
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

    // Export
    exportMarkdown: exportMarkdown,

    // Helpers
    escapeHtml: escapeHtml
  };

  console.log("[keeper-notes] Advanced Notes System initialized");

})();
