/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/keeper-notes-ui.js
   Advanced Notes System — UI Components & Integration

   Phase B: Note editor, backlinks pane, search, folder tree

   Expõe:
   - window.CoC.keeperNotesUI.init() — inicializa o painel de notas
   - window.CoC.keeperNotesUI.openNote(id) — abre nota no editor
   - window.CoC.keeperNotesUI.createNewNote() — nova nota
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};
window.CoC.keeperNotesUI = window.CoC.keeperNotesUI || {};

(function () {
  "use strict";

  var notes = window.CoC.keeperNotes;
  var ui = window.CoC.ui || {};
  var el = ui.el || function (tag, attrs, children) {
    var elem = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") elem.className = attrs[k];
      else if (k === "style") Object.assign(elem.style, attrs[k]);
      else elem.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (child) {
      if (typeof child === "string") elem.appendChild(document.createTextNode(child));
      else if (child) elem.appendChild(child);
    });
    return elem;
  };

  var $ = function (id) { return document.getElementById(id); };
  var currentNoteId = null;

  // ─── Note List Panel ──────────────────────────────────────────────────────

  var _currentSearchQuery = "";
  var _currentTagFilter = null;

  function _getAllNotes() {
    var allNotes = [];
    try {
      var store = window.CoC.storage;
      if (store && store.getAllCustomData) {
        var allData = store.getAllCustomData();
        allData.forEach(function (item) {
          if (item && item.key && item.key.indexOf("keeper-notes/") === 0) {
            allNotes.push(item.value);
          }
        });
      }
    } catch (e) {}
    return allNotes;
  }

  function _getAllTags() {
    var allNotes = _getAllNotes();
    var tagSet = {};
    allNotes.forEach(function (note) {
      (note.tags || []).forEach(function (tag) {
        tagSet[tag] = (tagSet[tag] || 0) + 1;
      });
    });
    return Object.keys(tagSet).sort().map(function (tag) {
      return { tag: tag, count: tagSet[tag] };
    });
  }

  function buildNoteList() {
    var container = $("keeper-notes-list");
    if (!container) return;

    container.innerHTML = "";

    // Search header
    var searchHeader = el("div", { style: { marginBottom: "0.6rem" } });
    var searchBox = el("input", {
      class: "journal-search",
      placeholder: "🔍 Buscar notas...",
      style: { marginBottom: "0.4rem" }
    });

    searchBox.addEventListener("input", function (e) {
      _currentSearchQuery = e.target.value;
      _updateNoteList();
    });

    searchHeader.appendChild(searchBox);

    // Tag filter buttons (Phase C)
    var allTags = _getAllTags();
    if (allTags.length > 0) {
      var tagCloud = el("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.3rem", fontSize: "0.75rem" } });
      allTags.slice(0, 8).forEach(function (t) {
        var btn = el("button", {
          class: "tag-filter-btn",
          style: {
            padding: "0.2rem 0.5rem",
            background: _currentTagFilter === t.tag ? "var(--brass)" : "rgba(184, 146, 79, 0.2)",
            color: _currentTagFilter === t.tag ? "var(--bg-deep)" : "var(--brass)",
            border: "1px solid var(--brass)",
            borderRadius: "0.3rem",
            cursor: "pointer",
            transition: "all 0.15s"
          }
        }, ["#" + t.tag + " (" + t.count + ")"]);

        btn.addEventListener("click", function () {
          _currentTagFilter = _currentTagFilter === t.tag ? null : t.tag;
          _updateNoteList();
        });
        tagCloud.appendChild(btn);
      });
      searchHeader.appendChild(tagCloud);
    }

    container.appendChild(searchHeader);

    // List container
    var listContainer = el("div", { class: "notes-list", style: { flex: "1 1 auto" } });
    container.appendChild(listContainer);

    _updateNoteList();
  }

  function _updateNoteList() {
    var container = document.querySelector("#keeper-notes-list .notes-list");
    if (!container) return;

    var allNotes = _getAllNotes();
    var filtered = allNotes;

    // Apply search filter
    if (_currentSearchQuery) {
      var q = _currentSearchQuery.toLowerCase();
      filtered = filtered.filter(function (note) {
        return (note.title && note.title.toLowerCase().indexOf(q) !== -1) ||
               (note.content && note.content.toLowerCase().indexOf(q) !== -1);
      });
    }

    // Apply tag filter
    if (_currentTagFilter) {
      filtered = filtered.filter(function (note) {
        return note.tags && note.tags.indexOf(_currentTagFilter) !== -1;
      });
    }

    renderNoteListResults(filtered, container);
  }

  function renderNoteListResults(notesList, container) {
    if (!container) {
      container = $("keeper-notes-list").querySelector(".notes-list");
    }
    if (!container) return;

    container.innerHTML = "";

    if (notesList.length === 0) {
      container.appendChild(el("div", {
        class: "notes-list-empty",
        style: { color: "var(--ink-dim)", fontStyle: "italic", padding: "1rem" }
      }, ["Nenhuma nota encontrada. Crie uma nova!"]));
      return;
    }

    notesList.forEach(function (note) {
      var item = el("div", {
        class: "note-item" + (currentNoteId === note.id ? " active" : ""),
        style: {
          padding: "0.6rem 0.8rem",
          borderLeft: currentNoteId === note.id ? "3px solid var(--brass)" : "3px solid transparent",
          background: currentNoteId === note.id ? "var(--bg-card)" : "var(--bg-card-hi)",
          cursor: "pointer",
          marginBottom: "0.4rem",
          borderRadius: "var(--radius)",
          transition: "all 0.15s"
        }
      });

      var title = el("div", {
        style: { fontWeight: "700", color: "var(--ink)", marginBottom: "0.2rem" }
      }, [note.title]);

      var date = el("div", {
        style: { fontSize: "0.7rem", color: "var(--ink-faded)" }
      }, [new Date(note.updatedAt).toLocaleDateString("pt-BR")]);

      var tags = el("div", {
        style: { fontSize: "0.75rem", marginTop: "0.3rem" }
      });

      (note.tags || []).forEach(function (tag) {
        var badge = el("span", {
          style: {
            display: "inline-block",
            background: "rgba(184, 146, 79, 0.2)",
            border: "1px solid var(--brass)",
            color: "var(--brass)",
            padding: "0.1rem 0.4rem",
            borderRadius: "0.3rem",
            marginRight: "0.3rem",
            fontSize: "0.65rem"
          }
        }, ["#" + tag]);
        tags.appendChild(badge);
      });

      item.appendChild(title);
      item.appendChild(date);
      item.appendChild(tags);

      item.addEventListener("click", function () {
        openNote(note.id);
      });

      container.appendChild(item);
    });
  }

  // ─── Export (Phase D) ─────────────────────────────────────────────────────

  function _downloadFile(filename, content, mimeType) {
    mimeType = mimeType || "text/plain";
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    try { URL.revokeObjectURL(url); } catch (e) {}
  }

  function exportAllNotesAsMarkdown() {
    var allNotes = _getAllNotes();
    var content = "# Notas Avançadas — AIMalexi RPG\n\n";
    content += "Exportado em: " + new Date().toLocaleString("pt-BR") + "\n\n";
    content += "---\n\n";

    allNotes.forEach(function (note) {
      content += "## " + (note.title || "(sem título)") + "\n\n";
      if (note.tags && note.tags.length > 0) {
        content += "**Tags:** " + note.tags.join(", ") + "\n\n";
      }
      content += "**Criado:** " + new Date(note.createdAt).toLocaleString("pt-BR") + "\n\n";
      content += note.content || "";
      content += "\n\n---\n\n";
    });

    _downloadFile("notas-aimalexi-" + Date.now() + ".md", content, "text/markdown");
  }

  function exportAllNotesAsJSON() {
    var allNotes = _getAllNotes();
    var data = {
      version: 1,
      exportDate: new Date().toISOString(),
      count: allNotes.length,
      notes: allNotes
    };
    _downloadFile("notas-aimalexi-" + Date.now() + ".json", JSON.stringify(data, null, 2), "application/json");
  }

  function exportCurrentNoteAsMarkdown() {
    if (!currentNoteId) return;
    var note = notes.read(currentNoteId);
    if (!note) return;
    var content = notes.exportMarkdown(currentNoteId);
    _downloadFile(note.title.replace(/[^a-z0-9]/gi, "-") + ".md", content, "text/markdown");
  }

  // ─── Note Editor ──────────────────────────────────────────────────────────

  function openNote(noteId) {
    var note = notes.read(noteId);
    if (!note) return;

    currentNoteId = noteId;

    var editor = $("keeper-notes-editor");
    if (!editor) return;

    editor.innerHTML = "";

    // Header
    var header = el("div", { style: { marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--ink-faded)" } });

    var titleInput = el("input", {
      type: "text",
      value: note.title,
      style: {
        fontSize: "1.3rem",
        fontWeight: "700",
        width: "100%",
        border: "none",
        background: "transparent",
        color: "var(--ink)",
        marginBottom: "0.5rem",
        fontFamily: "var(--font-serif)"
      }
    });

    titleInput.addEventListener("change", function () {
      notes.update(noteId, { title: this.value });
      buildNoteList();
    });

    header.appendChild(titleInput);

    // Action buttons (Phase D)
    var actions = el("div", { style: { display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginBottom: "0.6rem" } });

    var exportBtn = el("button", {
      class: "btn-ghost btn-sm",
      style: { padding: "0.4rem 0.6rem", fontSize: "0.75rem" }
    }, ["📥 Exportar"]);
    exportBtn.addEventListener("click", exportCurrentNoteAsMarkdown);
    actions.appendChild(exportBtn);

    var deleteBtn = el("button", {
      class: "btn-ghost btn-sm",
      style: { padding: "0.4rem 0.6rem", fontSize: "0.75rem", color: "var(--danger)" }
    }, ["🗑️ Remover"]);
    deleteBtn.addEventListener("click", function () {
      if (window.confirm("Remover esta nota?")) {
        notes.delete(noteId);
        currentNoteId = null;
        editor.innerHTML = "<p style='color:var(--ink-faded)'>Nota removida. Selecione outra para continuar.</p>";
        buildNoteList();
      }
    });
    actions.appendChild(deleteBtn);

    header.appendChild(actions);

    // Tags input
    var tagsInput = el("input", {
      type: "text",
      placeholder: "Tags (separadas por vírgula): #clue, #mythos",
      value: (note.tags || []).join(", "),
      style: {
        fontSize: "0.85rem",
        width: "100%",
        padding: "0.4rem",
        border: "1px solid var(--ink-faded)",
        borderRadius: "var(--radius)",
        background: "var(--bg-deep)",
        color: "var(--ink)"
      }
    });

    tagsInput.addEventListener("change", function () {
      var tags = this.value.split(",").map(function (t) { return t.trim().replace(/^#/, ""); }).filter(Boolean);
      notes.update(noteId, { tags: tags });
      buildNoteList();
    });

    header.appendChild(tagsInput);
    editor.appendChild(header);

    // Content editor
    var contentArea = el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", minHeight: "400px" } });

    var editorColumn = el("div");

    var contentLabel = el("label", { style: { display: "block", fontSize: "0.8rem", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-dim)" } }, ["Editor"]);

    var contentInput = el("textarea", {
      value: note.content,
      placeholder: "Conteúdo (suporta markdown e [[wikilinks]])",
      style: {
        width: "100%",
        height: "400px",
        padding: "0.6rem",
        border: "1px solid var(--ink-faded)",
        borderRadius: "var(--radius)",
        background: "var(--bg-deep)",
        color: "var(--ink)",
        fontFamily: "var(--font-mono)",
        fontSize: "0.85rem",
        resize: "vertical"
      }
    });

    contentInput.addEventListener("input", function () {
      notes.update(noteId, { content: this.value });
      renderPreview();
      renderBacklinks();
    });

    editorColumn.appendChild(contentLabel);
    editorColumn.appendChild(contentInput);
    contentArea.appendChild(editorColumn);

    // Preview + Backlinks column
    var previewColumn = el("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" } });

    var previewLabel = el("label", { style: { fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-dim)" } }, ["Preview & Backlinks"]);

    var previewPane = el("div", {
      id: "note-preview",
      style: {
        padding: "0.8rem",
        border: "1px solid var(--ink-faded)",
        borderRadius: "var(--radius)",
        background: "var(--bg-card)",
        minHeight: "200px",
        maxHeight: "200px",
        overflowY: "auto",
        fontSize: "0.85rem",
        lineHeight: "1.5"
      }
    });

    var backlinksPane = el("div", {
      id: "note-backlinks",
      style: {
        padding: "0.8rem",
        border: "1px solid var(--ink-faded)",
        borderRadius: "var(--radius)",
        background: "var(--bg-card)",
        minHeight: "150px",
        maxHeight: "150px",
        overflowY: "auto",
        fontSize: "0.8rem"
      }
    });

    previewColumn.appendChild(previewLabel);
    previewColumn.appendChild(previewPane);

    var backlinksLabel = el("label", { style: { fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-dim)", marginTop: "0.5rem" } }, ["🔗 Referências"]);
    previewColumn.appendChild(backlinksLabel);
    previewColumn.appendChild(backlinksPane);

    contentArea.appendChild(previewColumn);
    editor.appendChild(contentArea);

    function renderPreview() {
      var pane = $("note-preview");
      if (!pane) return;
      var content = contentInput.value;
      // Render markdown (basic) + wikilinks
      content = notes.processWikilinks(content);
      pane.innerHTML = content;
    }

    function renderBacklinks() {
      var pane = $("note-backlinks");
      if (!pane) return;
      var backlinks = notes.getBacklinks(noteId);
      pane.innerHTML = "";
      if (backlinks.length === 0) {
        pane.innerHTML = "<em style='color:var(--ink-faded)'>Nenhuma referência</em>";
        return;
      }
      var list = el("ul", { style: { margin: "0", padding: "0 0 0 1rem" } });
      backlinks.forEach(function (bl) {
        var item = el("li", { style: { cursor: "pointer", color: "var(--brass)", textDecoration: "underline" } }, [bl.display]);
        item.addEventListener("click", function () { openNote(bl.noteId); });
        list.appendChild(item);
      });
      pane.appendChild(list);
    }

    renderPreview();
    renderBacklinks();

    // Update list highlight
    buildNoteList();
  }

  function createNewNote() {
    var note = notes.create("Nova Nota", "Comece a escrever...");
    openNote(note.id);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    var listContainer = $("keeper-notes-list");
    var editorContainer = $("keeper-notes-editor");

    if (!listContainer || !editorContainer) {
      console.warn("[keeper-notes-ui] DOM containers não encontrados (keeper-notes-list, keeper-notes-editor)");
      return;
    }

    // Renderiza a lista de notas
    buildNoteList();

    // Botões de ação (top)
    var actionButtons = el("div", { style: { display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.8rem" } });

    var newBtn = el("button", {
      class: "btn-primary",
      style: { width: "100%" }
    }, ["+ Nova Nota"]);
    newBtn.addEventListener("click", createNewNote);
    actionButtons.appendChild(newBtn);

    // Expandable export menu (Phase D)
    var exportWrapper = el("div", { style: { fontSize: "0.75rem" } });
    var exportToggle = el("button", {
      class: "btn-ghost",
      style: { width: "100%", padding: "0.4rem 0.6rem", marginBottom: "0.3rem" }
    }, ["💾 Exportar"]);

    var exportMenu = el("div", {
      style: {
        display: "none",
        flexDirection: "column",
        gap: "0.3rem",
        paddingLeft: "0.6rem",
        borderLeft: "2px solid var(--ink-faded)"
      }
    });

    var exportMdBtn = el("button", { class: "btn-ghost btn-sm", style: { width: "100%" } }, ["📝 MD (todas)"]);
    exportMdBtn.addEventListener("click", exportAllNotesAsMarkdown);
    exportMenu.appendChild(exportMdBtn);

    var exportJsonBtn = el("button", { class: "btn-ghost btn-sm", style: { width: "100%" } }, ["📦 JSON (backup)"]);
    exportJsonBtn.addEventListener("click", exportAllNotesAsJSON);
    exportMenu.appendChild(exportJsonBtn);

    exportToggle.addEventListener("click", function () {
      var isVisible = exportMenu.style.display !== "none";
      exportMenu.style.display = isVisible ? "none" : "flex";
    });

    exportWrapper.appendChild(exportToggle);
    exportWrapper.appendChild(exportMenu);
    actionButtons.appendChild(exportWrapper);

    listContainer.insertBefore(actionButtons, listContainer.firstChild);

    console.log("[keeper-notes-ui] Inicializado. Notas carregadas.");
  }

  // ─── Initialization ──────────────────────────────────────────────────────

  function onDOMReady() {
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDOMReady);
  } else {
    onDOMReady();
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  window.CoC.keeperNotesUI = {
    init: init,
    openNote: openNote,
    createNewNote: createNewNote,
    buildNoteList: buildNoteList
  };

  console.log("[keeper-notes-ui] UI Components loaded");

})();
