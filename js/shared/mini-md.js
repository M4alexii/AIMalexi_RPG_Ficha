/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/shared/mini-md.js
   Mini-Markdown SEGURO para anotações (Diário do Mestre, estilo Obsidian).

   Princípios:
   - escapeHtml PRIMEIRO, markup próprio depois — impossível injetar HTML.
   - Zero dependências e zero DOM no carregamento (testável em Node puro).
   - Subconjunto pragmático: títulos (#/##/###), **negrito**, *itálico*,
     ~~tachado~~, `código`, > citação, listas -/1., checklists - [ ]/- [x],
     réguas --- e [[wikilinks]] (render delegado via opts.wikilink).

   API: window.CoC.miniMD.render(texto, { wikilink?: (titulo) => html })
   Contrato do wikilink: recebe o título CRU e é responsável pelo próprio
   escape do que devolver.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {
  "use strict";

  // Cópia local do escape (o módulo precisa rodar em Node nos testes,
  // sem depender de CoC.ui).
  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function defaultWikilink(title) {
    return '<span class="md-wikilink">' + esc(title) + "</span>";
  }

  // Delimitador de placeholder: NUL não existe em texto escapado — zero
  // risco de colisão com conteúdo do usuário.
  var NUL = String.fromCharCode(0);
  var RE_CODE_PLACEHOLDER = new RegExp(NUL + "(\\d+)" + NUL, "g");

  /**
   * Formatação inline sobre texto JÁ ESCAPADO.
   * Ordem importa: código primeiro (protege o miolo das regras seguintes),
   * depois wikilinks, negrito, itálico, tachado.
   */
  function inline(escaped, wikilink) {
    var out = escaped;

    var codes = [];
    out = out.replace(/`([^`\n]+)`/g, function (_, c) {
      codes.push('<code class="md-code">' + c + "</code>");
      return NUL + (codes.length - 1) + NUL;
    });

    // [[wikilink]] — título volta ao texto cru antes de ir ao resolvedor.
    out = out.replace(/\[\[([^\]\n]+)\]\]/g, function (_, t) {
      return wikilink(unescapeEntities(t.trim()));
    });

    out = out.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    out = out.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

    out = out.replace(RE_CODE_PLACEHOLDER, function (_, i) { return codes[Number(i)]; });
    return out;
  }

  // O título do wikilink foi escapado junto com a linha; devolve ao original
  // antes de entregar ao resolvedor (que fará o próprio escape).
  function unescapeEntities(s) {
    return String(s)
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  }

  /**
   * Render principal: raw markdown → HTML seguro.
   * @param {string} raw
   * @param {{ wikilink?: (titulo: string) => string }} [opts]
   * @returns {string} HTML
   */
  function render(raw, opts) {
    opts = opts || {};
    var wikilink = typeof opts.wikilink === "function" ? opts.wikilink : defaultWikilink;
    var lines = String(raw == null ? "" : raw).replace(/\r\n?/g, "\n").split("\n");

    var html = [];
    var para = [];        // parágrafo em montagem
    var list = null;      // { tag: "ul"|"ol", cls: string, items: [] }
    var quote = [];       // linhas de citação em montagem

    function flushPara() {
      if (!para.length) return;
      html.push('<p class="md-p">' + para.join("<br>") + "</p>");
      para = [];
    }
    function flushList() {
      if (!list) return;
      html.push("<" + list.tag + ' class="' + list.cls + '">' + list.items.join("") + "</" + list.tag + ">");
      list = null;
    }
    function flushQuote() {
      if (!quote.length) return;
      html.push('<blockquote class="md-quote">' + quote.join("<br>") + "</blockquote>");
      quote = [];
    }
    function flushAll() { flushPara(); flushList(); flushQuote(); }

    for (var i = 0; i < lines.length; i++) {
      var rawLine = lines[i];
      var m;

      if (/^\s*$/.test(rawLine)) { flushAll(); continue; }

      // Títulos
      if ((m = rawLine.match(/^(#{1,3})\s+(.*)$/))) {
        flushAll();
        var lvl = m[1].length;
        html.push('<div class="md-h md-h' + lvl + '">' + inline(esc(m[2]), wikilink) + "</div>");
        continue;
      }

      // Régua
      if (/^\s*-{3,}\s*$/.test(rawLine)) { flushAll(); html.push('<hr class="md-hr">'); continue; }

      // Citação
      if ((m = rawLine.match(/^>\s?(.*)$/))) {
        flushPara(); flushList();
        quote.push(inline(esc(m[1]), wikilink));
        continue;
      }

      // Checklist (antes da lista comum — "- [ ]" também casa com "- ")
      if ((m = rawLine.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/))) {
        flushPara(); flushQuote();
        if (!list || list.cls !== "md-checklist") { flushList(); list = { tag: "ul", cls: "md-checklist", items: [] }; }
        var done = m[1] !== " ";
        list.items.push('<li class="md-check' + (done ? " done" : "") + '">' +
          '<span class="md-checkbox" aria-hidden="true">' + (done ? "☑" : "☐") + "</span> " +
          inline(esc(m[2]), wikilink) + "</li>");
        continue;
      }

      // Lista não-ordenada
      if ((m = rawLine.match(/^\s*[-*]\s+(.*)$/))) {
        flushPara(); flushQuote();
        if (!list || list.cls !== "md-ul") { flushList(); list = { tag: "ul", cls: "md-ul", items: [] }; }
        list.items.push("<li>" + inline(esc(m[1]), wikilink) + "</li>");
        continue;
      }

      // Lista ordenada
      if ((m = rawLine.match(/^\s*\d+[.)]\s+(.*)$/))) {
        flushPara(); flushQuote();
        if (!list || list.cls !== "md-ol") { flushList(); list = { tag: "ol", cls: "md-ol", items: [] }; }
        list.items.push("<li>" + inline(esc(m[1]), wikilink) + "</li>");
        continue;
      }

      // Parágrafo
      flushList(); flushQuote();
      para.push(inline(esc(rawLine), wikilink));
    }
    flushAll();
    return html.join("");
  }

  window.CoC.miniMD = { render: render, escapeHtml: esc };
})();
