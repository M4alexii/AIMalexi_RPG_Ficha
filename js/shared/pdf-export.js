/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/shared/pdf-export.js
   Gerador de PDF "documento" — puro JS, zero dependência, 100% offline.

   Produz um PDF de verdade (não a impressão da tela) com a ficha resumida do
   investigador: Resumo · Histórico · Informações importantes · (opcional) Notas
   do Guardião. Usa as fontes base-14 (Helvetica/Helvetica-Bold) — sem embutir
   fontes — e codifica acentos PT-BR em WinAnsi.

   API: window.CoC.pdf = { exportInvestigator(character, opts) }
     opts.keeper (bool) — inclui a seção "Notas do Guardião" (segredos/ocultos).
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};

(function () {
  'use strict';

  // ── Página A4 (pt) e margens ────────────────────────────────────────────────
  var PAGE_W = 595.28, PAGE_H = 841.89, MARGIN = 48;
  var CONTENT_W = PAGE_W - MARGIN * 2;

  // Cores (0–1 RGB)
  var INK   = [0.10, 0.09, 0.08];
  var BRASS = [0.62, 0.47, 0.20];
  var DIM   = [0.38, 0.36, 0.32];
  var RULE  = [0.78, 0.74, 0.68];

  // ── WinAnsi: Unicode → byte (0–255) ─────────────────────────────────────────
  var WIN_EXTRA = {
    0x2014: 0x97, 0x2013: 0x96, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2026: 0x85, 0x2022: 0x95,
    0x2122: 0x99, 0x20AC: 0x80
  };
  function winByte(code) {
    if (code <= 0xFF) return code;          // Latin-1 ≈ WinAnsi p/ acentos PT-BR
    if (WIN_EXTRA[code] != null) return WIN_EXTRA[code];
    return null;                             // sem mapeamento → cai p/ '?'
  }
  // Escapa para string literal de conteúdo PDF; devolve string de bytes (≤255).
  function enc(str) {
    str = String(str == null ? '' : str);
    var out = '';
    for (var i = 0; i < str.length; i++) {
      var b = winByte(str.charCodeAt(i));
      if (b == null) b = 0x3F; // '?'
      var ch = String.fromCharCode(b);
      if (ch === '\\' || ch === '(' || ch === ')') out += '\\' + ch;
      else if (b === 0x0A) out += '\\n';
      else if (b === 0x0D) out += '\\r';
      else out += ch;
    }
    return out;
  }

  // ── Largura aproximada do texto (Helvetica) p/ quebra de linha ───────────────
  var NARROW = "iIl|.,;:!'`()[]{}ftjr ", WIDE = "mwMW@%";
  function charW(ch, size) {
    var f = 0.5;
    if (NARROW.indexOf(ch) >= 0) f = 0.3;
    else if (WIDE.indexOf(ch) >= 0) f = 0.84;
    else if (ch >= 'A' && ch <= 'Z') f = 0.66;
    return f * size;
  }
  function strW(str, size) {
    str = String(str == null ? '' : str);
    var w = 0;
    for (var i = 0; i < str.length; i++) w += charW(str[i], size);
    return w;
  }

  // ── Writer ──────────────────────────────────────────────────────────────────
  function Doc() {
    this.pages = [];      // cada: { ops: '' }
    this.page = null;
    this.y = 0;           // distância do topo
    this._newPage();
  }
  Doc.prototype._newPage = function () {
    this.page = { ops: '' };
    this.pages.push(this.page);
    this.y = MARGIN;
  };
  Doc.prototype._op = function (s) { this.page.ops += s; };
  Doc.prototype.ensure = function (h) {
    if (this.y + h > PAGE_H - MARGIN) this._newPage();
  };
  Doc.prototype.gap = function (h) { this.y += (h == null ? 8 : h); };

  // Desenha UMA linha já medida; não quebra. Avança y.
  Doc.prototype._line = function (text, opt) {
    opt = opt || {};
    var size = opt.size || 10;
    var lead = opt.lead || (size * 1.35);
    var color = opt.color || INK;
    var font = opt.bold ? '/F2' : '/F1';
    var x = MARGIN + (opt.indent || 0);
    this.ensure(lead);
    var baseY = PAGE_H - this.y - size;   // baseline
    this._op('q ' + color[0] + ' ' + color[1] + ' ' + color[2] + ' rg BT ' +
             font + ' ' + size + ' Tf 1 0 0 1 ' + x.toFixed(2) + ' ' + baseY.toFixed(2) +
             ' Tm (' + enc(text) + ') Tj ET Q\n');
    this.y += lead;
  };

  // Parágrafo com quebra automática.
  Doc.prototype.paragraph = function (text, opt) {
    opt = opt || {};
    var size = opt.size || 10;
    var indent = opt.indent || 0;
    var maxW = CONTENT_W - indent - (opt.rightPad || 0);
    var words = String(text == null ? '' : text).replace(/\r/g, '').split(/\n/);
    for (var p = 0; p < words.length; p++) {
      var parts = words[p].split(/\s+/);
      var line = '';
      for (var i = 0; i < parts.length; i++) {
        var test = line ? line + ' ' + parts[i] : parts[i];
        if (strW(test, size) > maxW && line) {
          this._line(line, opt);
          line = parts[i];
        } else {
          line = test;
        }
      }
      this._line(line || ' ', opt);
    }
  };

  Doc.prototype.rule = function (color) {
    color = color || RULE;
    this.ensure(6);
    var yy = PAGE_H - this.y;
    this._op('q ' + color[0] + ' ' + color[1] + ' ' + color[2] + ' RG 0.8 w ' +
             MARGIN + ' ' + yy.toFixed(2) + ' m ' + (PAGE_W - MARGIN) + ' ' + yy.toFixed(2) + ' l S Q\n');
    this.y += 6;
  };

  Doc.prototype.heading = function (text) {
    this.gap(10);
    this.ensure(22);
    this._line(text, { size: 13, bold: true, color: BRASS, lead: 16 });
    this.rule();
    this.gap(3);
  };

  Doc.prototype.kv = function (label, value) {
    if (value == null || value === '') return;
    // label em negrito + valor: desenha ambos na mesma linha quando cabe.
    var size = 10;
    var lw = strW(label + '  ', size);
    this.ensure(size * 1.4);
    var baseY = PAGE_H - this.y - size;
    this._op('q ' + INK[0] + ' ' + INK[1] + ' ' + INK[2] + ' rg BT /F2 ' + size +
             ' Tf 1 0 0 1 ' + MARGIN + ' ' + baseY.toFixed(2) + ' Tm (' + enc(label) + ') Tj ET Q\n');
    // valor (pode quebrar): usa paragraph com indent = largura do label
    var savedY = this.y;
    this.paragraph(String(value), { size: size, indent: lw });
    if (this.y === savedY) this.y += size * 1.4;
  };

  Doc.prototype.bullets = function (arr, opt) {
    opt = opt || {};
    (arr || []).forEach(function (it) {
      if (it == null || it === '') return;
      this.paragraph('•  ' + it, { size: opt.size || 10, indent: opt.indent || 6 });
    }, this);
  };

  // ── Montagem do arquivo PDF (bytes) ──────────────────────────────────────────
  Doc.prototype.toBlob = function () {
    var n = this.pages.length;
    var objs = [];   // index 1-based → string corpo do objeto
    // 1 Catalog, 2 Pages, 3 Helvetica, 4 Helvetica-Bold, depois 2 por página.
    var kids = [];
    for (var i = 0; i < n; i++) kids.push((5 + i * 2) + ' 0 R');

    objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objs[2] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>';
    objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    for (i = 0; i < n; i++) {
      var pObj = 5 + i * 2, cObj = 6 + i * 2;
      var stream = this.pages[i].ops;
      objs[pObj] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PAGE_W.toFixed(2) + ' ' + PAGE_H.toFixed(2) +
        '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + cObj + ' 0 R >>';
      objs[cObj] = '<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream';
    }

    var count = objs.length - 1;
    var out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    var offsets = [];
    for (var o = 1; o <= count; o++) {
      offsets[o] = out.length;
      out += o + ' 0 obj\n' + objs[o] + '\nendobj\n';
    }
    var xrefStart = out.length;
    out += 'xref\n0 ' + (count + 1) + '\n0000000000 65535 f\r\n';
    for (o = 1; o <= count; o++) {
      var off = String(offsets[o]); while (off.length < 10) off = '0' + off;
      out += off + ' 00000 n\r\n';
    }
    out += 'trailer\n<< /Size ' + (count + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF';

    // string de bytes (≤255) → Uint8Array
    var bytes = new Uint8Array(out.length);
    for (i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xFF;
    return new Blob([bytes], { type: 'application/pdf' });
  };

  // ── Helpers de domínio ───────────────────────────────────────────────────────
  function asText(v) {
    if (Array.isArray(v)) return v.filter(function (x) { return x != null && x !== ''; }).join(', ');
    return v == null ? '' : String(v);
  }
  function attrLabel(code) {
    return ({ FOR: 'FOR', CON: 'CON', TAM: 'TAM', DES: 'DES', APA: 'APA',
              INT: 'INT', POD: 'POD', EDU: 'EDU', Sorte: 'Sorte' })[code] || code;
  }
  function topSkills(skills, limit) {
    return Object.keys(skills || {})
      .map(function (k) { return { name: k, value: Number(skills[k] && skills[k].value) || 0 }; })
      .filter(function (s) { return s.value > 0 && s.name !== 'Nível de Crédito'; })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, limit || 16);
  }

  // ── Documento do investigador ────────────────────────────────────────────────
  function buildDoc(c, opts) {
    opts = opts || {};
    c = c || {};
    var inv = c.investigator || {};
    var der = c.derived || {};
    var attrs = c.attributes || {};
    var skills = c.skills || {};
    var bg = c.background || {};
    var d = new Doc();

    // ── Cabeçalho / Resumo ──
    d._line(asText(inv.name) || 'Investigador sem nome', { size: 22, bold: true, color: INK, lead: 26 });
    var sub = [asText(inv.occupation), inv.age ? inv.age + ' anos' : '', asText(inv.pronouns), asText(inv.residence)]
      .filter(Boolean).join('  ·  ');
    if (sub) d._line(sub, { size: 10, color: DIM, lead: 14 });
    if (inv.playerName) d._line('Jogador: ' + asText(inv.playerName), { size: 9, color: DIM, lead: 12 });
    if (inv.tagline) { d.gap(2); d.paragraph('“' + asText(inv.tagline) + '”', { size: 10.5, color: BRASS }); }
    d.gap(4); d.rule(BRASS);

    // ── Vitais ──
    function vital(lbl, cur, max) {
      return lbl + ': ' + (cur != null ? cur : '?') + (max != null ? '/' + max : '');
    }
    var pv = der.PV || {}, san = der.SAN || {}, pm = der.PM || {};
    var vitais = [
      vital('PV', pv.current != null ? pv.current : pv.value, pv.value),
      vital('SAN', san.current != null ? san.current : san.value, san.max),
      vital('PM', pm.current != null ? pm.current : pm.value, pm.value),
      'Sorte: ' + (attrs.Sorte ? attrs.Sorte.value : '?'),
      'MOV: ' + (der.MOV ? der.MOV.value : '?'),
      'DB: ' + (der.DB ? der.DB.value : '0')
    ].join('     ');
    d.gap(4); d._line(vitais, { size: 10.5, bold: true, color: INK, lead: 16 });

    // ── Atributos ──
    d.heading('Atributos');
    var order = ['FOR', 'CON', 'TAM', 'DES', 'APA', 'INT', 'POD', 'EDU'];
    var aLine = order.map(function (k) {
      return attrLabel(k) + ' ' + (attrs[k] ? attrs[k].value : '—');
    }).join('     ');
    d._line(aLine, { size: 11, color: INK, lead: 16 });

    // ── Histórico ──
    d.heading('Histórico');
    if (asText(bg.description)) d.paragraph(asText(bg.description), { size: 10 });
    d.gap(4);
    d.kv('Traços:', asText(bg.traits));
    d.kv('Ideologia/Crenças:', asText(bg.ideology));
    d.kv('Convicções:', asText(bg.convictions));
    d.kv('Hobbies:', asText(bg.hobbies));
    d.kv('Pessoas Importantes:', asText(bg.significantPeople));
    d.kv('Locais Significativos:', asText(bg.meaningfulLocations));
    d.kv('Posses Estimadas:', asText(bg.treasuredPossessions));

    // ── Informações importantes ──
    d.heading('Perícias Principais');
    var ts = topSkills(skills, 18);
    if (ts.length) {
      // duas colunas: monta linhas "Nome  N    Nome  N"
      var col = [];
      ts.forEach(function (s) { col.push(s.name + ' ' + s.value + '%'); });
      for (var i = 0; i < col.length; i += 2) {
        var left = col[i], right = col[i + 1] || '';
        d.paragraph(left + (right ? '          ' + right : ''), { size: 10 });
      }
    } else {
      d.paragraph('— sem perícias registradas —', { size: 10, color: DIM });
    }

    var weapons = Array.isArray(c.weapons) ? c.weapons : [];
    if (weapons.length) {
      d.heading('Armas');
      d.bullets(weapons.map(function (w) {
        return [asText(w.name), w.damage ? 'dano ' + asText(w.damage) : '', w.range ? 'alc. ' + asText(w.range) : '', asText(w.skill)]
          .filter(Boolean).join(' · ');
      }));
    }

    // Equipamento / inventário resumido
    var equip = Array.isArray(c.equipment) ? c.equipment.slice() : [];
    var invItems = Array.isArray(c.inventory) ? c.inventory.map(function (it) {
      return asText(it.name) + (it.quantity > 1 ? ' (x' + it.quantity + ')' : '');
    }) : [];
    var allEquip = equip.concat(invItems).filter(Boolean);
    if (allEquip.length) {
      d.heading('Equipamento');
      d.bullets(allEquip.slice(0, 30));
    }

    // Crédito / finanças
    var cr = Number(skills['Nível de Crédito'] && skills['Nível de Crédito'].value) || 0;
    var fin = c.finances || {};
    d.heading('Finanças');
    d.kv('Nível de Crédito:', cr + '%');
    if (fin.cash != null) d.kv('Dinheiro em Mãos:', '$' + fin.cash);
    if (asText(fin.assets)) d.kv('Patrimônio:', asText(fin.assets));

    // ── Notas do Guardião (opcional) ──
    if (opts.keeper) {
      d._newPage();
      d._line('Notas do Guardião', { size: 16, bold: true, color: BRASS, lead: 20 });
      d._line('Seção reservada ao Mestre — informações sensíveis.', { size: 9, color: DIM, lead: 14 });
      d.rule(BRASS); d.gap(4);
      d.kv('Fobias/Manias:', asText(bg.phobiasManias));
      d.kv('Ferimentos/Cicatrizes:', asText(bg.injuriesScars));
      var st = c.status || {};
      if (asText(st.temporaryInsanity))  d.kv('Loucura Temporária:', asText(st.temporaryInsanity));
      if (asText(st.indefiniteInsanity)) d.kv('Loucura Indefinida:', asText(st.indefiniteInsanity));
      d.kv('Tomos:', asText(bg.tomes));
      d.kv('Encontros com o Mythos:', asText(bg.encounters));
      var mitos = der.Mitos || der.Mythos;
      if (mitos) d.kv('Mythos de Cthulhu:', (mitos.value || 0) + '%');
    }

    // Rodapé simples na última página
    d.gap(14);
    d._line('Gerado por AIMalexi RPG · Chamado de Cthulhu 7ª Edição (não oficial)', { size: 8, color: DIM, lead: 10 });

    return d;
  }

  function _download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  function exportInvestigator(character, opts) {
    opts = opts || {};
    var doc = buildDoc(character, opts);
    var name = (character && character.investigator && character.investigator.name) || 'investigador';
    var safe = String(name).replace(/[^\wÀ-ɏ -]/g, '').trim().replace(/\s+/g, '_') || 'investigador';
    _download(doc.toBlob(), safe + (opts.keeper ? '_mestre' : '') + '.pdf');
  }

  window.CoC.pdf = { exportInvestigator: exportInvestigator, _buildDoc: buildDoc };

})();
