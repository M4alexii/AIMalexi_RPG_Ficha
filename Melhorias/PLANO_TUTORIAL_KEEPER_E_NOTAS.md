# Plano: Tutorial do Guardião (#1) + Sistema de Notas Obsidian/Notion (#2)

**Responsáveis**: Claude Code  
**Status**: Em planejamento  
**Prioridade**: Alta (UX crítica para novos mestres)  
**Timeframe**: Fase 9-10

---

## Task #1 — Tutorial do Guardião (Guided Tour)

### Objetivo
Criar tour onboarding equivalente ao "Guia do Iniciante" (guia-iniciante.html), mas focado em ensinar um novo mestre a usar a Ficha do Mestre sem ler documentação externa.

### Context Atual
- ✅ guided-tour.js existe e funciona (spotlight effect, persistência, teclado)
- ✅ keeper.html já carrega guided-tour.js
- ❌ Nenhum tour definido ainda para keeper
- ❌ Botão "Rever tutorial" não existe no toolbar

### Escopo: Tour Structure

```
Tour ID: "keeper-v1"
Persistência: localStorage["aimalexi-rpg/tour/keeper-v1"]
Force-start: botão no toolbar (🎓 ou ❓)
```

### Steps Propostos (12-15 passos)

#### 1. Welcome (Centered Card)
```
Title: "Bem-vindo, Mestre!"
Body: "Esta ferramenta ajuda a gerenciar criaturas, NPCs, 
       inventário e combate em tempo real durante sessões.
       Vamos fazer um tour de 5 minutos."
```

#### 2. Dashboard (Overview)
```
Target: #keeper-overview
Title: "Dashboard Executivo"
Body: "Aqui você vê KPIs da campanha: investigadores vivos, 
       sanidade média, recursos em campo, timeline de eventos.
       Útil para manter controle sem abrir múltiplos painéis."
```

#### 3. Library (NPC/Creature Management)
```
Target: #library-list
Title: "Biblioteca de NPCs e Criaturas"
Body: "Seu banco de dados de personagens. Clique para carregar,
       edite nome/tipo, ou crie novos com +. Busque por nome
       para encontrar rápido durante jogo."
```

#### 4. Workspace (Creature Display)
```
Target: .workspace
Title: "Espaço de Trabalho (Modo Simples)"
Body: "A criatura ativa aparece aqui. Modo Simples mostra
       HP/ataques/perícias essenciais. Clique [Modo Completo]
       para editar todos os dados."
```

#### 5. Simple Mode (Stats at a Glance)
```
Target: .simple-stats
Title: "Modo Simples — Ao Vivo"
Body: "Tudo que você precisa em combate: FOR/AGL/PV/ataques.
       Sem rolagem, sem confusão. Clique [Modo Completo]
       quando precisar editar."
```

#### 6. Combat Tab
```
Target: [data-tab="combate"]
Title: "Aba de Combate"
Body: "Armadura, iniciativa, armas, esquiva. Organizado
       para combate rápido. Ferimentos graves/morte auto-detectados."
```

#### 7. NPCs Tab (Advanced)
```
Target: [data-tab="npcs"]
Title: "Gestão de NPCs (em desenvolvimento)"
Body: "Relacionamentos, fações, motivações dos NPCs.
       Estrutura tipo Obsidian para conectar NPCs ao plot."
```

#### 8. Journal Tab (Advanced)
```
Target: [data-tab="diario"]
Title: "Diário de Sessão (Markdown + Backlinks)"
Body: "Registre eventos, clues, revelações. Suporta markdown
       e [[wikilinks]] para conectar pistas. Searchable."
```

#### 9. Encounter Tracker (Right Panel)
```
Target: .encounter-panel
Title: "Rastreador de Encontro"
Body: "Adicione criaturas ao encontro. Preenche o round counter.
       Clique um NPC para colocá-lo em combate ativo."
```

#### 10. Round Counter
```
Target: .enc-round-bar
Title: "Contador de Rounds"
Body: "Avança cada turno/round. Mostra iniciativa e ordem.
       Reseta após combate terminar."
```

#### 11. Quick Roll
```
Target: .simple-stats [button="Rolar"]
Title: "Rolagens Rápidas"
Body: "Clique em qualquer atributo/ataque para rolar D100.
       Resultado aparece no log em tempo real."
```

#### 12. Session Log (Left Panel)
```
Target: #roll-log
Title: "Log de Sessão"
Body: "Timeline de rolagens, dano, sanidade. Filtrável
       por tipo. Exportável para relato de campanha."
```

#### 13. Settings
```
Target: #btn-settings
Title: "Configurações & Temas"
Body: "Mude tema, acessibilidade, redução de movimento.
       Suas preferências salvam automaticamente."
```

#### 14. Campaign Mode (Optional)
```
Target: .campaign-setup
Title: "Modo Campanha (Multiplayer)"
Body: "Convide investigadores via PIN. Sincroniza em tempo
       real. Mestres sempre têm autoridade final."
```

#### 15. Finish (Centered)
```
Title: "Pronto para mestrar!"
Body: "Você está equipado. Leia o /docs para mecânicas avançadas.
       Esc skips any step. Enjoy!"
```

### Implementation Steps

1. **Define steps** em `js/keeper.js` ou novo `js/keeper-tour.js`
2. **Add "Rever Tutorial" button** ao toolbar
3. **Auto-start** na primeira visita (não force)
4. **Keyboard & mobile** support
5. **i18n** (Portuguese first, English ready)
6. **Test** em diferentes resoluções

### Success Criteria

- ✅ Tour appears on first keeper.html visit
- ✅ Can be re-triggered via button
- ✅ All major features covered
- ✅ Takes <5 minutes
- ✅ Mobile responsive
- ✅ Accessible (focus, reduced-motion)

---

## Task #2 — Advanced Notes System (Obsidian/Notion Style)

### Goal
Transform the existing journal/notes system (currently simple textarea) into a powerful note-taking tool with:
- **Markdown support** (bold, italic, lists, code, links)
- **Wikilinks** `[[creature|display text]]` para backlinks
- **Nested folders** (dossiers, scenes, NPCs, etc.)
- **Search & tagging** (#clues, #npcs, #important)
- **Backlinks pane** (what links to this note)
- **Timeline view** (notes por session/date)
- **Export** (Markdown, HTML, PDF)

### Current State

**Existing:**
- `js/keeper-journal.js` — básico (add/edit/delete topics)
- `.journal-card` — visual card display
- `.journal-content` — rendered markdown (via mini-md.js)
- No backlinks, no search, no nesting

**What's Missing:**
- Folder structure (flat list only)
- Wikilink recognition & resolution
- Backlinks reverse index
- Advanced search (by tag, date, content)
- Note templates
- Export functions

### Architecture

#### New Module: `js/keeper-notes-advanced.js`

```javascript
window.CoC.keeperNotes = {
  // Note CRUD
  create(title, content, folder, tags),
  read(id),
  update(id, title, content, tags),
  delete(id),
  
  // Organization
  createFolder(name),
  moveNote(noteId, folderId),
  
  // Wikilinks & Backlinks
  extractWikilinks(content),     // [[x]] → [x]
  resolveWikilink(target),        // find note by name
  getBacklinks(noteId),           // what notes link to this
  
  // Search & Filter
  search(query),                  // full text
  searchByTag(tag),               // #clues, #npcs
  searchByFolder(folderId),       // nested
  getTimeline(),                  // by session/date
  
  // Export
  exportMarkdown(noteId),
  exportHTML(noteId),
  exportAll(),
  
  // UI Helpers
  formatNote(id),                 // → HTML with backlinks
  renderFolderTree(),             // sidebar tree
  renderSearchResults(query),
  renderTimeline(),
}
```

#### Data Model

```javascript
// Note
{
  id: "uuid",
  title: "Ritual de Summoning",
  content: "# Ritual\n\nUsado por [[The Cult]]...",
  folder: "folder-id-or-null",
  tags: ["ritual", "mythos", "dangerous"],
  createdAt: ISO8601,
  updatedAt: ISO8601,
  sessionId: "current-session-id",  // track session notes
  wikilinks: ["the-cult", "innsmouth"],  // parsed
}

// Folder
{
  id: "uuid",
  name: "Dossier — The Cult",
  parentFolder: null,  // for nesting
  createdAt: ISO8601,
}
```

#### UI Components

**1. Notes Sidebar (Replaces Journal List)**
```
📁 [+] Folders
 ├─ 📂 Dossiers
 │  ├─ 📄 The Cult
 │  ├─ 📄 Innsmouth Secrets
 │  └─ 📄 Ritual Notes
 ├─ 📂 Session 1
 │  ├─ 📄 2026-06-10 Events
 │  └─ 📄 2026-06-10 Clues
 └─ 📂 Characters
    ├─ 📄 Detective Smith (NPC)
    └─ 📄 Protagonist Fear
```

**2. Note Editor (Advanced)**
```
Title: ____________
Content: [rich markdown editor with preview]
Tags: [#clue, #mythos, #important]
Folder: [Dossier ▼]

Preview pane (right):
- Rendered markdown
- Wikilink suggestions [[]]
- Backlinks pane
```

**3. Backlinks Pane**
```
Backlinks to "The Cult" (3):
- [[Ritual Notes]]: "performed by The Cult"
- [[Session Notes]]: "Detective mentioned The Cult"
- [[Detective Smith]]: "member of The Cult"
```

**4. Search Panel**
```
Search: _______ [Filter by tag ▼] [Timeline ▼]

Results:
- "The Cult" in "Ritual Notes"
- "The Cult" in "Detective Smith"
- #clues in "2026-06-10 Events"
```

**5. Timeline View (Optional)**
```
Session 1 (2026-06-10)
├─ 09:00 — Detective receives letter (event log entry)
├─ 09:15 — Discovers ritual in library
└─ 09:30 — Meets The Cult member

Session 2 (2026-06-17)
├─ Event A
├─ Event B
└─ Note: "The ritual is connected to..."
```

### Implementation Phases

#### Phase A: Markdown + Wikilinks (Week 1)
- ✅ Markdown editor (copy existing mini-md.js support)
- ✅ Wikilink parsing `[[note|label]]`
- ✅ Wikilink resolution (find & link to notes)
- ✅ Auto-complete on `[[` typing

#### Phase B: Backlinks & Organization (Week 2)
- ✅ Build backlinks index
- ✅ Render backlinks pane
- ✅ Folder creation & nesting
- ✅ Move notes between folders
- ✅ Note templates (creature, clue, session-recap)

#### Phase C: Search & Timeline (Week 3)
- ✅ Full-text search
- ✅ Tag filtering
- ✅ Date-based organization
- ✅ Timeline view
- ✅ Session-scoped notes

#### Phase D: Export & Polish (Week 4)
- ✅ Markdown export (individual + bulk)
- ✅ HTML export (styled)
- ✅ PDF export (via print stylesheet)
- ✅ Import from markdown file
- ✅ Accessibility audit

### Success Criteria

- ✅ Wikilinks resolve correctly
- ✅ Backlinks pane accurate
- ✅ Search finds all matching notes
- ✅ Folders nest & reorganize smoothly
- ✅ Markdown renders correctly
- ✅ Export creates valid Markdown/HTML/PDF
- ✅ Performance: <100ms for search (1000 notes)
- ✅ Mobile: editable and viewable on tablet
- ✅ Accessible: WCAG AA, keyboard nav, screen reader support

### Migration Path

**Existing Notes → New System:**
1. Read all notes from storage
2. Parse for topics (use title as folder hint)
3. Auto-generate folder structure
4. Extract wikilinks from content
5. Build backlinks index
6. Validate & present to user

---

## Integration Points

### With Keeper Dashboard
- Quick-link to related notes
- Notes icon on NPC cards
- "Create note" context menu

### With Session Log
- Drag-drop events into notes
- Auto-create session-recap note
- Timestamp integration

### With Campaign Mode
- Shared notes (GM + players optional)
- Note history/revisions
- Collaborative editing (optional future)

---

## Priority & Timeline

**Priority Order:**
1. **Tutorial (Task #1)** — fast win (1 day)
   - Simple guided-tour.js wrapper
   - High UX impact

2. **Notes Phase A+B (Task #2)** — core features (1 week)
   - Markdown, wikilinks, backlinks, folders
   - Covers 80% of use cases

3. **Notes Phase C** — advanced search (3-4 days)
   - Timeline, tagging, filtering

4. **Notes Phase D** — export & polish (2-3 days)
   - Export, import, final UX pass

**Estimated Total:** ~2 weeks

---

## Success Metrics

### Task #1 (Tutorial)
- [ ] >50% of new keeper users trigger tutorial
- [ ] Tutorial completion rate >80%
- [ ] "Rever tutorial" button used <5% (sign of good UX)

### Task #2 (Notes)
- [ ] >80% of keeper sessions have ≥1 note
- [ ] Wikilink usage in >60% of notes
- [ ] Average session note count >5
- [ ] Search feature used in >70% of sessions
- [ ] User satisfaction: 4.5+/5 (survey)

---

## Next Steps

1. **Confirm scope** — which features are priority?
2. **Design mockups** — UI for note editor, backlinks pane
3. **Define note schema** — finalize data structure
4. **Create test data** — sample notes with wikilinks
5. **Implement Phase A** — start with markdown + wikilinks
