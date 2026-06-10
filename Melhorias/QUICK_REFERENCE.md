# Quick Reference — Advanced Notes System
**One-page overview of everything**

---

## 🎯 What Was Built (This Session)

### Task #1: Keeper Tutorial ✅
- **What**: 15-step guided tour for new Keepers
- **Where**: Click "❓ Tour" button in keeper.html toolbar
- **How long**: ~5 minutes to complete
- **Auto-starts**: First time you visit keeper.html

### Task #2: Advanced Notes System ✅
- **What**: Obsidian-style note system with wikilinks, backlinks, search
- **Where**: "📝 Notas Avançadas" tab in keeper.html
- **Features**: 6 phases (A-F) of functionality

---

## 📊 What Each Phase Does

| Phase | What | Files | Status |
|-------|------|-------|--------|
| **A** | Note CRUD + Wikilinks + Backlinks | `keeper-notes-advanced.js` | ✅ |
| **B** | UI Editor + Preview + Search | `keeper-notes-ui.js` | ✅ |
| **C** | Tag cloud + Tag filtering | `keeper-notes-ui.js` | ✅ |
| **D** | Export/Import Markdown | `keeper-notes-ui.js` | ✅ |
| **E** | Templates + Quick access | `keeper-notes-ui.js` | ✅ |
| **F** | Keyboard shortcuts + Autocomplete | `keeper-notes-ui.js` | ✅ |
| **G** | Timeline view | Not yet | ⏳ |
| **H** | Note versioning | Not yet | ⏳ |

---

## 🚀 How to Use (Quick Start)

### Create a Note
```
1. Click "📝 Notas Avançadas" tab
2. Click "+ Nova Nota"
3. Type title
4. Type content (supports markdown: **bold**, *italic*, etc)
5. Auto-saves
```

### Use Templates
```
1. Click "📋 Modelos" dropdown
2. Choose: NPC / Location / Encounter / Mystery / Session
3. Fill in template fields
4. Done!
```

### Link Notes Together
```
In your note, type: [[Other Note Title]]
- Will auto-suggest while typing
- Becomes clickable link
- Shows backlinks in preview pane
```

### Search Notes
```
Ctrl+K (or Cmd+K) → Focus search box
Type keyword → See matching notes
Click tag → Filter by that tag
Esc → Clear search
```

### Export Notes
```
1. Click "💾 Exportar" menu
2. Choose:
   - "📝 MD (todas)" = all notes as Markdown
   - "📦 JSON (backup)" = full backup
3. File downloads
```

### Import Notes from Markdown
```
1. Click "💾 Exportar" → "📂 Importar MD"
2. Select .md file from your computer
3. Notes are created automatically
4. Check success message
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | What it does |
|----------|--------------|
| **Ctrl+K** | Focus search box |
| **Ctrl+N** | Create new note |
| **Esc** | Clear search |
| **[[** | Start wikilink (autocomplete shows) |

---

## 📝 Templates Included

### NPC Template
```
Structure:
  Identity (name, occupation, appearance)
  Relations (allies, enemies, secrets)
  Notes
```

### Location Template
```
Structure:
  Description (name, location, atmosphere)
  Points of Interest (3 key places)
  Dangers
  Secrets
```

### Encounter Template
```
Structure:
  Setup (scenario, participants, objective)
  Development (what happens)
  Rewards (XP, items, info)
```

### Mystery Template
```
Structure:
  Central Question
  Clues (evidence for solution)
  Solution
  Consequences (success/failure)
```

### Session Template
```
Structure:
  Summary
  Key Events (3+)
  Participants
  Revelations
  Next Steps
```

---

## 💾 Storage & Backup

### Where Notes Are Saved
- **Local**: IndexedDB (browser database)
- **Backup**: Export as JSON (button in panel)
- **No internet needed**: Fully offline

### How to Backup
```
1. Click "💾 Exportar"
2. Click "📦 JSON (backup)"
3. File downloads as: notas-aimalexi-{timestamp}.json
4. Save somewhere safe
```

### How to Restore
```
1. Click "💾 Exportar"
2. Click "📂 Importar MD"
3. Select your .json (or .md file)
4. Notes import automatically
```

---

## 🔗 Wikilinks Syntax

```
Simple link:
  [[Note Title]]
  → Shows as: [🔗 Note Title] (clickable)

Link with custom text:
  [[Note Title|Click me]]
  → Shows as: [🔗 Click me] (clickable)

Backlinks (automatic):
  When you link to [[NPC Name]], that note's
  "🔗 Referências" pane shows this note mentions it
```

---

## 🔍 Search & Filter Tips

### Find Notes
```
Ctrl+K → type keyword
  Searches in title AND content
  Returns matching notes instantly
```

### Filter by Tag
```
1. See tag cloud at top
2. Click #tag button
3. List shows only notes with that tag
4. Click again to unfilter
```

### Combined Search
```
Type in search + click tag
  = show notes matching keyword AND tag
```

---

## 📊 Statistics at Bottom

```
Shows:
  - Total number of notes
  - Total unique tags
  - Average note length (characters)
  
Helps you see collection growing!
```

---

## 🐛 Troubleshooting

### Notes not saving?
```
[ ] Check browser storage (Settings → Storage)
[ ] Try export (backup your data)
[ ] Reload page
[ ] Check browser console (F12)
```

### Wikilinks not working?
```
[ ] Title must match exactly (case-insensitive OK)
[ ] Use [[Title]] format (square brackets)
[ ] Clear browser cache
[ ] Test with simple note names
```

### Search returns nothing?
```
[ ] Check spelling
[ ] Note might be in [[link]] format only
[ ] Try tag search instead
[ ] Make sure note exists
```

### Export file not downloading?
```
[ ] Check browser download settings
[ ] Try different browser
[ ] Check popup blocker
[ ] Try JSON export instead of Markdown
```

---

## 🎯 Common Workflows

### Session Prep
```
1. Open "📝 Notas Avançadas"
2. Click "📋 Modelos" → Choose templates you need
3. Fill in NPC, Encounter, Mystery templates
4. [[Link]] related notes together
5. Export as Markdown for reference
```

### During Session
```
1. Ctrl+K → Search for relevant note
2. Click on note → appears in editor
3. Use backlinks to navigate between notes
4. See wikilinks to related content
5. Quick info without leaving prep
```

### After Session
```
1. Click "+ Nova Nota"
2. Choose "📋 Modelos" → "Session"
3. Fill in session summary
4. [[Link]] to NPCs, Locations, Encounters
5. Export for record-keeping
```

### Organizing Large Collection
```
1. Use tags! (#pista, #npc, #local, #misterio)
2. Click tag to filter
3. Use folders: create notes like "Ato 1/NPC Name"
4. Use [[wikilinks]] to connect everything
5. Use Ctrl+K search for specific content
```

---

## 📈 What's Next? (Sprint 1)

| Feature | When | What it does |
|---------|------|--------------|
| Archive/Trash | ~1 week | Recover deleted notes for 30 days |
| Better Search | ~2 weeks | Search with operators: tag:x, created:>date |
| Folders | ~2 weeks | Better organization UI |
| Keeper↔Investigator | ~2 weeks | Link notes to character sheets |

---

## 📚 More Information

- **Full Roadmap**: See `ROADMAP_COMPLETO_POS_MERGE.md`
- **Implementation Details**: See `STATUS_IMPLEMENTACAO_DETALHADO.md`
- **What to Do Now**: See `PROXIMAS_ACOES_POS_MERGE.md`
- **GitHub PR**: https://github.com/m4alexii/aimalexi_rpg_ficha/pull/36

---

## ✅ Pre-Merge Checklist

- [✓] All tests passing (1000/1000)
- [✓] No breaking changes
- [✓] Tutorial implemented
- [✓] Notes system complete (6 phases)
- [✓] Documentation complete
- [✓] PR ready for merge
- [ ] **→ Awaiting your approval**

**Next Step**: Merge PR #36 to main branch

---

**Version**: 2.0 (Advanced Notes & Keeper Tutorial)  
**Status**: Ready for Production  
**Last Updated**: 2026-06-10
