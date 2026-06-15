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
  var _recentNotesKey = "keeper-notes-recent";
  var _recentNotesMax = 5;
  var _viewMode = "list"; // "list" | "folders" | "timeline" | "trash"

  function _getAllNotes() {
    // Usa a API do core (exclui notas na lixeira)
    if (notes && notes.list) return notes.list();
    return [];
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

  function _trackRecentNote(noteId) {
    try {
      var recent = JSON.parse(localStorage.getItem(_recentNotesKey) || "[]");
      recent = recent.filter(function (id) { return id !== noteId; });
      recent.unshift(noteId);
      recent = recent.slice(0, _recentNotesMax);
      localStorage.setItem(_recentNotesKey, JSON.stringify(recent));
    } catch (e) {}
  }

  function _getRecentNotes() {
    try {
      var ids = JSON.parse(localStorage.getItem(_recentNotesKey) || "[]");
      var allNotes = _getAllNotes();
      var recentNotes = [];
      ids.forEach(function (id) {
        var note = allNotes.find(function (n) { return n.id === id; });
        if (note) recentNotes.push(note);
      });
      return recentNotes;
    } catch (e) {
      return [];
    }
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

    // View mode selector: lista · pastas · timeline · lixeira
    var viewModes = [
      { id: "list", icon: "📄", label: "Lista" },
      { id: "folders", icon: "📁", label: "Pastas" },
      { id: "timeline", icon: "📅", label: "Timeline" },
      { id: "trash", icon: "🗑️", label: "Lixeira" }
    ];
    var modeBar = el("div", { style: { display: "flex", gap: "0.2rem", marginBottom: "0.5rem" } });
    viewModes.forEach(function (mode) {
      var active = _viewMode === mode.id;
      var btn = el("button", {
        title: mode.label,
        style: {
          flex: "1",
          padding: "0.3rem 0.2rem",
          fontSize: "0.7rem",
          background: active ? "var(--brass)" : "transparent",
          color: active ? "var(--bg-deep)" : "var(--ink-dim)",
          border: "1px solid " + (active ? "var(--brass)" : "var(--ink-faded)"),
          borderRadius: "var(--radius)",
          cursor: "pointer"
        }
      }, [mode.icon]);
      btn.addEventListener("click", function () {
        _viewMode = mode.id;
        buildNoteList();
      });
      modeBar.appendChild(btn);
    });
    searchHeader.appendChild(modeBar);

    // Dica de operadores de busca
    var searchHint = el("div", {
      style: { fontSize: "0.6rem", color: "var(--ink-faded)", marginBottom: "0.4rem" }
    }, ['Operadores: tag:pista · folder:ato1 · campo:PV=12 · created:>2026-01-01 · updated:<7d · "frase" · -termo']);
    searchHeader.appendChild(searchHint);

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

    // Quick Access (Phase E) — Recently viewed notes
    var recentNotes = _getRecentNotes();
    if (recentNotes.length > 0 && !_currentSearchQuery && !_currentTagFilter) {
      var quickAccessDiv = el("div", { style: { marginBottom: "0.8rem", paddingBottom: "0.8rem", borderBottom: "1px solid var(--ink-faded)" } });
      var quickLabel = el("div", { style: { fontSize: "0.7rem", textTransform: "uppercase", color: "var(--ink-dim)", marginBottom: "0.4rem", letterSpacing: "0.05em" } }, ["⚡ Acesso Rápido"]);
      quickAccessDiv.appendChild(quickLabel);

      var quickButtons = el("div", { style: { display: "flex", flexDirection: "column", gap: "0.3rem" } });
      recentNotes.slice(0, 3).forEach(function (note) {
        var btn = el("button", {
          class: "btn-ghost btn-sm",
          style: {
            width: "100%",
            textAlign: "left",
            padding: "0.4rem 0.6rem",
            fontSize: "0.8rem",
            background: "rgba(184, 146, 79, 0.1)"
          }
        }, ["⭐ " + (note.title || "(sem título)")]);
        btn.addEventListener("click", function () { openNote(note.id); });
        quickButtons.appendChild(btn);
      });

      quickAccessDiv.appendChild(quickButtons);
      container.appendChild(quickAccessDiv);
    }

    // List container
    var listContainer = el("div", { class: "notes-list", style: { flex: "1 1 auto" } });
    container.appendChild(listContainer);

    _updateNoteList();
  }

  function _updateNoteList() {
    var container = document.querySelector("#keeper-notes-list .notes-list");
    if (!container) return;

    // Modo lixeira: lista separada com restore/purge
    if (_viewMode === "trash") {
      renderTrashView(container);
      return;
    }

    var filtered = _getAllNotes();

    // Busca com operadores (tag:, created:>, "frase", -excluído) via core
    if (_currentSearchQuery) {
      filtered = notes.search(_currentSearchQuery);
    }

    // Apply tag filter
    if (_currentTagFilter) {
      filtered = filtered.filter(function (note) {
        return note.tags && note.tags.indexOf(_currentTagFilter) !== -1;
      });
    }

    if (_viewMode === "folders") {
      renderFolderView(filtered, container);
    } else if (_viewMode === "timeline") {
      renderTimelineView(filtered, container);
    } else {
      renderNoteListResults(filtered, container);
    }
  }

  // ─── Folder View (Sprint 2) ──────────────────────────────────────────────

  function renderFolderView(notesList, container) {
    container.innerHTML = "";

    if (notesList.length === 0) {
      container.appendChild(el("div", { class: "notes-list-empty" }, ["Nenhuma nota encontrada."]));
      return;
    }

    // Agrupa por pasta ("/" sugere subpastas, como no diário)
    var groups = {}, order = [];
    notesList.forEach(function (note) {
      var f = (note.folder || "").trim() || "— Sem pasta —";
      if (!groups[f]) { groups[f] = []; order.push(f); }
      groups[f].push(note);
    });
    order.sort(function (a, b) { return a.localeCompare(b); });

    order.forEach(function (folderName) {
      var details = document.createElement("details");
      details.open = true;
      details.className = "notes-folder";

      var summary = document.createElement("summary");
      summary.className = "notes-folder-head";
      summary.textContent = "📁 " + folderName + " (" + groups[folderName].length + ")";
      details.appendChild(summary);

      var body = el("div", { style: { paddingLeft: "0.6rem" } });
      groups[folderName].forEach(function (note) {
        body.appendChild(_noteItemEl(note));
      });
      details.appendChild(body);
      container.appendChild(details);
    });
  }

  // ─── Timeline View (Sprint 3) ────────────────────────────────────────────

  function renderTimelineView(notesList, container) {
    container.innerHTML = "";

    if (notesList.length === 0) {
      container.appendChild(el("div", { class: "notes-list-empty" }, ["Nenhuma nota encontrada."]));
      return;
    }

    // Agrupa por data de atualização (YYYY-MM-DD), mais recente primeiro
    var groups = {}, order = [];
    notesList.slice().sort(function (a, b) {
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    }).forEach(function (note) {
      var day = (note.updatedAt || "").slice(0, 10) || "sem data";
      if (!groups[day]) { groups[day] = []; order.push(day); }
      groups[day].push(note);
    });

    order.forEach(function (day) {
      var dayLabel;
      try {
        dayLabel = new Date(day + "T12:00:00").toLocaleDateString("pt-BR", {
          weekday: "short", day: "numeric", month: "short", year: "numeric"
        });
      } catch (e) { dayLabel = day; }

      var header = el("div", {
        style: {
          fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em",
          color: "var(--brass)", padding: "0.5rem 0 0.3rem",
          borderBottom: "1px solid var(--ink-faded)", marginBottom: "0.4rem"
        }
      }, ["📅 " + dayLabel]);
      container.appendChild(header);

      groups[day].forEach(function (note) {
        container.appendChild(_noteItemEl(note));
      });
    });
  }

  // ─── Trash View (Sprint 1) ───────────────────────────────────────────────

  function renderTrashView(container) {
    container.innerHTML = "";

    var trash = notes.getTrash();
    if (trash.length === 0) {
      container.appendChild(el("div", { class: "notes-list-empty" }, ["🗑️ Lixeira vazia."]));
      return;
    }

    var hint = el("div", {
      style: { fontSize: "0.7rem", color: "var(--ink-faded)", marginBottom: "0.6rem" }
    }, ["Notas removidas são apagadas definitivamente após 30 dias."]);
    container.appendChild(hint);

    trash.forEach(function (note) {
      var item = el("div", {
        class: "note-item",
        style: { opacity: "0.75" }
      });

      item.appendChild(el("div", { style: { fontWeight: "700", color: "var(--ink)" } }, [note.title || "(sem título)"]));
      item.appendChild(el("div", { style: { fontSize: "0.7rem", color: "var(--ink-faded)" } },
        ["Removida em " + new Date(note.deletedAt).toLocaleDateString("pt-BR")]));

      var btns = el("div", { style: { display: "flex", gap: "0.4rem", marginTop: "0.4rem" } });

      var restoreBtn = el("button", { class: "btn-ghost btn-sm", style: { fontSize: "0.7rem" } }, ["♻️ Restaurar"]);
      restoreBtn.addEventListener("click", function () {
        notes.restore(note.id);
        buildNoteList();
      });
      btns.appendChild(restoreBtn);

      var purgeBtn = el("button", { class: "btn-ghost btn-sm", style: { fontSize: "0.7rem", color: "var(--danger, #c0392b)" } }, ["✕ Apagar de vez"]);
      purgeBtn.addEventListener("click", function () {
        if (window.confirm("Apagar esta nota DEFINITIVAMENTE? Não há volta.")) {
          notes.purge(note.id);
          buildNoteList();
        }
      });
      btns.appendChild(purgeBtn);

      item.appendChild(btns);
      container.appendChild(item);
    });
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
      container.appendChild(_noteItemEl(note));
    });
  }

  // Item de nota reutilizável (lista, pastas, timeline)
  function _noteItemEl(note) {
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

    return item;
  }

  // ─── Note Templates (Phase E) ────────────────────────────────────────────

  var NOTE_TEMPLATES = {
    npc: {
      title: "Novo PNJ",
      content: "## Identidade\n- **Aparência**: \n\n## Relações\n- Aliados: \n- Inimigos: \n- Segredos: \n\n## Notas\n",
      tags: ["npc"],
      fields: { "PV": "", "SAN": "", "Ocupação": "" }
    },
    local: {
      title: "Novo Local",
      content: "## Descrição\n- **Atmosfera**: \n\n## Pontos de Interesse\n1. \n2. \n3. \n\n## Perigos\n\n## Segredos\n",
      tags: ["local"],
      fields: { "Região": "" }
    },
    encontro: {
      title: "Novo Encontro",
      content: "## Setup\n- **Cenário**: \n- **Participantes**: \n- **Objetivo**: \n\n## Desenvolvimento\n\n## Recompensas\n- Experiência: \n- Itens: \n- Informações: \n",
      tags: ["encontro"],
      fields: { "Dificuldade": "" }
    },
    misterio: {
      title: "Novo Mistério",
      content: "## O Mistério\n**Questão Central**: \n\n## Pistas\n1. \n2. \n3. \n\n## Solução\n\n## Consequências\n- Sucesso: \n- Fracasso: \n",
      tags: ["misterio"],
      fields: {}
    },
    sessao: {
      title: "Notas da Sessão",
      content: "## Resumo Executivo\n\n## Eventos-Chave\n1. \n2. \n3. \n\n## Personagens Envolvidos\n\n## Pistas Reveladas\n\n## Próximos Passos\n",
      tags: ["sessao"],
      fields: { "Data da Sessão": "" }
    }
  };

  function createNoteFromTemplate(templateKey) {
    var template = NOTE_TEMPLATES[templateKey];
    if (!template) return;
    var note = notes.create(template.title, template.content, null, (template.tags || []).slice(),
      JSON.parse(JSON.stringify(template.fields || {})));
    openNote(note.id);
  }

  // ─── Import (Phase E) ─────────────────────────────────────────────────────

  function importNotesFromMarkdown(file) {
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (e) {
      var content = e.target.result;
      var lines = content.split('\n');
      var currentNote = null;
      var count = 0;

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];

        // Detect note boundaries: "## Title" or "---"
        if (line.match(/^#{1,2}\s+(.+)/)) {
          // Save previous note if exists
          if (currentNote && currentNote.title) {
            notes.create(currentNote.title, currentNote.content.trim());
            count++;
          }

          // Start new note
          var titleMatch = line.match(/^#{1,2}\s+(.+)/);
          currentNote = {
            title: titleMatch[1].trim(),
            content: ""
          };
        } else if (line.match(/^---\s*$/)) {
          // Separator: save current note
          if (currentNote && currentNote.title) {
            notes.create(currentNote.title, currentNote.content.trim());
            count++;
            currentNote = null;
          }
        } else if (currentNote) {
          // Add line to current note
          currentNote.content += line + "\n";
        }
      }

      // Save last note
      if (currentNote && currentNote.title) {
        notes.create(currentNote.title, currentNote.content.trim());
        count++;
      }

      alert("✓ Importadas " + count + " notas do arquivo Markdown!");
      buildNoteList();
    };

    reader.readAsText(file);
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
    _trackRecentNote(noteId);

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

    // Histórico de versões (Sprint 3)
    var historyBtn = el("button", {
      class: "btn-ghost btn-sm",
      style: { padding: "0.4rem 0.6rem", fontSize: "0.75rem" }
    }, ["🕐 Histórico"]);
    historyBtn.addEventListener("click", function () { _showHistoryPanel(noteId); });
    actions.appendChild(historyBtn);

    var deleteBtn = el("button", {
      class: "btn-ghost btn-sm",
      style: { padding: "0.4rem 0.6rem", fontSize: "0.75rem", color: "var(--danger)" }
    }, ["🗑️ Remover"]);
    deleteBtn.addEventListener("click", function () {
      if (window.confirm("Mover esta nota para a lixeira? (recuperável por 30 dias)")) {
        notes.delete(noteId);
        currentNoteId = null;
        editor.innerHTML = "<p style='color:var(--ink-faded)'>Nota movida para a 🗑️ Lixeira (recuperável por 30 dias). Selecione outra para continuar.</p>";
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

    // Folder input (Sprint 2 — organização por pastas)
    var folderInput = el("input", {
      type: "text",
      placeholder: "📁 Pasta (use / para subpastas): Ato 1/Mansão",
      value: note.folder || "",
      style: {
        fontSize: "0.85rem",
        width: "100%",
        padding: "0.4rem",
        marginTop: "0.4rem",
        border: "1px solid var(--ink-faded)",
        borderRadius: "var(--radius)",
        background: "var(--bg-deep)",
        color: "var(--ink)"
      }
    });

    folderInput.addEventListener("change", function () {
      notes.update(noteId, { folder: this.value.trim() });
      buildNoteList();
    });

    header.appendChild(folderInput);

    // Campos customizados (Custom Fields, #8): chave=valor por nota
    var fieldsWrap = el("div", { style: { marginTop: "0.6rem" } });
    var fieldsLabel = el("div", {
      style: { fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-dim)", marginBottom: "0.3rem" }
    }, ["🏷️ Campos (busque com campo:chave=valor)"]);
    fieldsWrap.appendChild(fieldsLabel);

    var fieldsRows = el("div", { style: { display: "flex", flexDirection: "column", gap: "0.3rem" } });
    fieldsWrap.appendChild(fieldsRows);

    function saveFields() {
      var updated = {};
      Array.prototype.forEach.call(fieldsRows.querySelectorAll("[data-field-row]"), function (row) {
        var k = row.querySelector("[data-field-key]").value.trim();
        var v = row.querySelector("[data-field-value]").value;
        if (k) updated[k] = v;
      });
      notes.update(noteId, { fields: updated });
    }

    function addFieldRow(key, value) {
      var row = el("div", { "data-field-row": "1", style: { display: "flex", gap: "0.3rem", alignItems: "center" } });

      var inputStyle = {
        padding: "0.3rem 0.4rem",
        border: "1px solid var(--ink-faded)",
        borderRadius: "var(--radius)",
        background: "var(--bg-deep)",
        color: "var(--ink)",
        fontSize: "0.8rem"
      };

      var keyInput = el("input", { type: "text", placeholder: "Chave", value: key || "", "data-field-key": "1", style: Object.assign({ width: "35%" }, inputStyle) });
      var valInput = el("input", { type: "text", placeholder: "Valor", value: value || "", "data-field-value": "1", style: Object.assign({ flex: "1" }, inputStyle) });
      keyInput.addEventListener("change", saveFields);
      valInput.addEventListener("change", saveFields);

      var delBtn = el("button", {
        type: "button",
        title: "Remover campo",
        style: { background: "transparent", border: "none", color: "var(--ink-faded)", cursor: "pointer", fontSize: "0.9rem" }
      }, ["✕"]);
      delBtn.addEventListener("click", function () {
        row.remove();
        saveFields();
      });

      row.appendChild(keyInput);
      row.appendChild(valInput);
      row.appendChild(delBtn);
      fieldsRows.appendChild(row);
    }

    var noteFields = note.fields || {};
    Object.keys(noteFields).forEach(function (k) { addFieldRow(k, noteFields[k]); });

    var addFieldBtn = el("button", {
      type: "button",
      class: "btn-ghost btn-sm",
      style: { marginTop: "0.3rem", fontSize: "0.7rem" }
    }, ["+ Campo"]);
    addFieldBtn.addEventListener("click", function () { addFieldRow("", ""); });
    fieldsWrap.appendChild(addFieldBtn);

    header.appendChild(fieldsWrap);
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

    // Wikilink autocomplete wrapper (Phase F)
    var contentWrapper = el("div", { style: { position: "relative" } });

    contentWrapper.appendChild(contentInput);

    var wikilinkHints = el("div", {
      style: {
        display: "none",
        position: "absolute",
        top: "100%",
        left: "0",
        right: "0",
        background: "var(--bg-deep)",
        border: "1px solid var(--brass)",
        borderTop: "none",
        borderRadius: "0 0 var(--radius) var(--radius)",
        maxHeight: "200px",
        overflowY: "auto",
        zIndex: "10",
        fontSize: "0.8rem"
      }
    });

    contentInput.addEventListener("input", function () {
      var content = this.value;
      var match = content.slice(Math.max(0, this.selectionStart - 50), this.selectionStart).match(/\[\[([^\[\]]*?)$/);

      if (match) {
        var prefix = match[1].toLowerCase();
        var allNotes = _getAllNotes();
        var suggestions = allNotes.filter(function (n) {
          return n.title && n.title.toLowerCase().indexOf(prefix) !== -1;
        }).slice(0, 5);

        if (suggestions.length > 0) {
          wikilinkHints.innerHTML = "";
          wikilinkHints.style.display = "block";

          suggestions.forEach(function (note) {
            var hint = el("button", {
              type: "button",
              style: {
                width: "100%",
                padding: "0.4rem 0.6rem",
                background: "transparent",
                border: "none",
                textAlign: "left",
                color: "var(--brass)",
                cursor: "pointer",
                borderBottom: "1px solid var(--ink-faded)"
              }
            }, ["[[" + (note.title || "(sem título)") + "]]"]);

            hint.addEventListener("click", function (e) {
              e.preventDefault();
              var before = contentInput.value.slice(0, contentInput.selectionStart - match[0].length);
              var after = contentInput.value.slice(contentInput.selectionStart);
              contentInput.value = before + "[[" + note.title + "]]" + after;
              contentInput.dispatchEvent(new Event("input"));
              notes.update(noteId, { content: contentInput.value });
              wikilinkHints.style.display = "none";
              renderPreview();
              renderBacklinks();
            });

            wikilinkHints.appendChild(hint);
          });
        } else {
          wikilinkHints.style.display = "none";
        }
      } else {
        wikilinkHints.style.display = "none";
      }

      notes.update(noteId, { content: this.value });
      renderPreview();
      renderBacklinks();
    });

    contentWrapper.appendChild(wikilinkHints);
    editorColumn.appendChild(contentWrapper);
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
      var raw = contentInput.value;
      // E10: renderizar Markdown de verdade (títulos, quebras de linha, listas)
      // via miniMD, delegando os [[wikilinks]] ao resolvedor já testado das notas.
      if (window.CoC.miniMD && typeof window.CoC.miniMD.render === "function") {
        pane.innerHTML = window.CoC.miniMD.render(raw, {
          wikilink: function (token) {
            // miniMD entrega o miolo cru de [[...]]; reusa processWikilinks
            // (que faz o split alvo|exibição e escapa o resultado).
            return notes.processWikilinks("[[" + token + "]]");
          }
        });
      } else {
        pane.innerHTML = notes.processWikilinks(raw);
      }
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

  // Integração Keeper↔Investigador: abre (ou cria) a nota com este título e
  // troca para a aba de notas. Usado pelo botão 📝 nos cards de investigador.
  function openOrCreateByTitle(title) {
    if (!title) return;
    var existing = notes.resolveWikilink(title);
    var note = existing || notes.create(title, "## Dossiê do Investigador\n\n_Anotações do Guardião sobre [[" + title + "]]._\n", "Investigadores", ["investigador"]);

    // Ativa a aba de notas (mesmo mecanismo do keeper-tabs)
    var tabBtn = document.querySelector('.keeper-tab[data-ktab="notas"]');
    if (tabBtn) tabBtn.click();

    _viewMode = "list";
    openNote(note.id);
  }

  // ─── Version History Panel (Sprint 3) ────────────────────────────────────

  function _showHistoryPanel(noteId) {
    var history = notes.getHistory(noteId);
    var modalUi = window.CoC.ui;

    var body = document.createElement("div");

    if (history.length === 0) {
      body.innerHTML = "<p style='color:var(--ink-faded);font-style:italic'>Nenhuma versão anterior. Snapshots são criados a cada alteração de conteúdo.</p>";
    } else {
      history.forEach(function (snap, idx) {
        var entry = el("div", {
          style: {
            padding: "0.6rem",
            marginBottom: "0.5rem",
            border: "1px solid var(--ink-faded)",
            borderRadius: "var(--radius)",
            background: "var(--bg-deep)"
          }
        });

        var when;
        try { when = new Date(snap.savedAt).toLocaleString("pt-BR"); }
        catch (e) { when = snap.savedAt || "?"; }

        entry.appendChild(el("div", {
          style: { fontSize: "0.75rem", color: "var(--brass)", marginBottom: "0.3rem" }
        }, ["v-" + (history.length - idx) + " · " + when + " · " + (snap.title || "")]));

        var previewText = (snap.content || "").slice(0, 200);
        if ((snap.content || "").length > 200) previewText += "…";
        entry.appendChild(el("div", {
          style: { fontSize: "0.75rem", color: "var(--ink-dim)", whiteSpace: "pre-wrap", maxHeight: "80px", overflow: "hidden" }
        }, [previewText]));

        var restoreBtn = el("button", {
          class: "btn-ghost btn-sm",
          style: { marginTop: "0.4rem", fontSize: "0.7rem" }
        }, ["♻️ Restaurar esta versão"]);
        restoreBtn.addEventListener("click", function () {
          if (window.confirm("Restaurar esta versão? A versão atual vira um snapshot no histórico.")) {
            notes.restoreVersion(noteId, idx);
            // Fecha modal (se houver) e reabre a nota
            var overlay = document.querySelector(".modal-overlay:not([id])");
            if (overlay) overlay.remove();
            openNote(noteId);
          }
        });
        entry.appendChild(restoreBtn);

        body.appendChild(entry);
      });
    }

    if (modalUi && modalUi.modal) {
      modalUi.modal({
        title: "🕐 Histórico de Versões",
        body: body,
        actions: [{ label: "Fechar" }]
      });
    } else {
      // Fallback sem modal: injeta no editor
      var editor = $("keeper-notes-editor");
      if (editor) {
        var panel = el("div", { style: { marginTop: "1rem", borderTop: "2px solid var(--brass)", paddingTop: "1rem" } });
        panel.appendChild(el("h3", {}, ["🕐 Histórico de Versões"]));
        panel.appendChild(body);
        var closeBtn = el("button", { class: "btn-ghost btn-sm" }, ["Fechar"]);
        closeBtn.addEventListener("click", function () { panel.remove(); });
        panel.appendChild(closeBtn);
        editor.appendChild(panel);
      }
    }
  }

  // ─── Keyboard Shortcuts (Phase F) ────────────────────────────────────────

  function _setupKeyboardShortcuts() {
    document.addEventListener("keydown", function (e) {
      // Ctrl+K or Cmd+K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        var searchBox = document.querySelector("#keeper-notes-list .journal-search");
        if (searchBox) searchBox.focus();
      }

      // Ctrl+N or Cmd+N: New note
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        createNewNote();
      }

      // Escape: Clear search (if in search box)
      if (e.key === "Escape") {
        var searchBox = document.querySelector("#keeper-notes-list .journal-search");
        if (document.activeElement === searchBox && searchBox.value) {
          searchBox.value = "";
          searchBox.dispatchEvent(new Event("input"));
        }
      }
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    var listContainer = $("keeper-notes-list");
    var editorContainer = $("keeper-notes-editor");

    if (!listContainer || !editorContainer) {
      console.warn("[keeper-notes-ui] DOM containers não encontrados (keeper-notes-list, keeper-notes-editor)");
      return;
    }

    // Limpeza automática: purga notas na lixeira há mais de 30 dias
    try {
      var purged = notes.purgeExpired();
      if (purged > 0) console.log("[keeper-notes-ui] " + purged + " nota(s) expirada(s) removida(s) da lixeira");
    } catch (e) {}

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

    // Templates (Phase E)
    var templateWrapper = el("div", { style: { fontSize: "0.75rem" } });
    var templateToggle = el("button", {
      class: "btn-ghost",
      style: { width: "100%", padding: "0.4rem 0.6rem", marginBottom: "0.3rem" }
    }, ["📋 Modelos"]);

    var templateMenu = el("div", {
      style: {
        display: "none",
        flexDirection: "column",
        gap: "0.3rem",
        paddingLeft: "0.6rem",
        borderLeft: "2px solid var(--ink-faded)"
      }
    });

    Object.keys(NOTE_TEMPLATES).forEach(function (key) {
      var template = NOTE_TEMPLATES[key];
      var btn = el("button", { class: "btn-ghost btn-sm", style: { width: "100%", textAlign: "left" } }, [template.title]);
      btn.addEventListener("click", function () { createNoteFromTemplate(key); });
      templateMenu.appendChild(btn);
    });

    templateToggle.addEventListener("click", function () {
      var isVisible = templateMenu.style.display !== "none";
      templateMenu.style.display = isVisible ? "none" : "flex";
    });

    templateWrapper.appendChild(templateToggle);
    templateWrapper.appendChild(templateMenu);
    actionButtons.appendChild(templateWrapper);

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

    var importBtn = el("button", { class: "btn-ghost btn-sm", style: { width: "100%" } }, ["📂 Importar MD"]);
    importBtn.addEventListener("click", function () {
      var fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".md,.markdown,.txt";
      fileInput.addEventListener("change", function (e) {
        if (e.target.files.length > 0) {
          importNotesFromMarkdown(e.target.files[0]);
        }
      });
      fileInput.click();
    });
    exportMenu.appendChild(importBtn);

    exportToggle.addEventListener("click", function () {
      var isVisible = exportMenu.style.display !== "none";
      exportMenu.style.display = isVisible ? "none" : "flex";
    });

    exportWrapper.appendChild(exportToggle);
    exportWrapper.appendChild(exportMenu);
    actionButtons.appendChild(exportWrapper);

    listContainer.insertBefore(actionButtons, listContainer.firstChild);

    // Setup keyboard shortcuts
    _setupKeyboardShortcuts();

    // Add keyboard hints
    var hints = el("div", {
      style: {
        fontSize: "0.65rem",
        color: "var(--ink-faded)",
        padding: "0.4rem 0.6rem",
        background: "rgba(0,0,0,0.2)",
        borderRadius: "var(--radius)",
        marginTop: "0.8rem",
        textAlign: "center"
      }
    }, ["⌨️ Ctrl+K (busca) · Ctrl+N (nova) · Esc (limpar)"]);
    listContainer.appendChild(hints);

    // Statistics (Phase F)
    var allNotes = _getAllNotes();
    var stats = el("div", {
      style: {
        fontSize: "0.7rem",
        color: "var(--ink-faded)",
        padding: "0.6rem 0.6rem",
        marginTop: "0.6rem",
        borderTop: "1px solid var(--ink-faded)",
        textAlign: "center"
      }
    });
    var totalNotes = allNotes.length;
    var totalTags = _getAllTags().length;
    var avgContentLength = totalNotes > 0 ? Math.round(allNotes.reduce(function (sum, n) { return sum + (n.content || "").length; }, 0) / totalNotes) : 0;

    stats.appendChild(document.createTextNode(totalNotes + " notas · " + totalTags + " tags · " + avgContentLength + " chars avg"));
    listContainer.appendChild(stats);

    console.log("[keeper-notes-ui] Inicializado. Notas carregadas. Atalhos: Ctrl+K, Ctrl+N, Esc");
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
    buildNoteList: buildNoteList,
    openOrCreateByTitle: openOrCreateByTitle
  };

  console.log("[keeper-notes-ui] UI Components loaded");

})();
