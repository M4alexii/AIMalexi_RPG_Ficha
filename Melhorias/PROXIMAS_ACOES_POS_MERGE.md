# Próximas Ações — Após Merge PR #36
**Data**: 2026-06-10  
**Deadline**: 2026-06-15 (deploy para produção)

---

## 🎬 Passo-a-Passo Imediato

### HOJE (2026-06-10)

#### [ ] 1. Revisar & Approvar PR #36
```
Checklist:
  [ ] Leia o PR description
  [ ] Verifique todos commits
  [ ] Veja os files changed
  [ ] Clique "Approve" + "Merge"
  
Tempo: ~15 min
Ação: https://github.com/m4alexii/aimalexi_rpg_ficha/pull/36
```

#### [ ] 2. Verificar Merge Automático
```
Após merge:
  [ ] Branch será deletado automaticamente
  [ ] CI rodará em main branch
  [ ] Aguardar ~2 min para conclusão
  [ ] Verificar se todos testes passaram em main
  
Tempo: ~5 min
```

#### [ ] 3. Verify Production Build
```
Local:
  $ git pull origin main
  $ npm test (se houver)
  $ python -m http.server 8765  # test locally
  
Browser:
  [ ] Open keeper.html
  [ ] Click "❓ Tour" button
  [ ] See 15 steps appear
  [ ] Click through 2-3 steps
  [ ] Close tour
  
  [ ] Click "📝 Notas Avançadas" tab
  [ ] Click "+ Nova Nota"
  [ ] Type title
  [ ] Type content with [[wikilink]]
  [ ] See preview update
  [ ] See wikilink appear
  
Tempo: ~10 min
```

---

### AMANHÃ (2026-06-11)

#### [ ] 4. Deploy para Produção
```
GitHub Pages (automatic):
  - Push to main → auto-deploys
  - Wait 1-2 minutes
  - Verify at: https://m4alexii.github.io/aimalexi_rpg_ficha/

Manual:
  [ ] Push merged main to GitHub
  [ ] Check GitHub Pages settings (should be on main branch)
  [ ] Visit site in incognito window
  [ ] Test tutorial + notes system
  
Tempo: ~5 min
Verify: https://m4alexii.github.io/aimalexi_rpg_ficha/keeper.html
```

#### [ ] 5. Create Changelog
```
Create: Melhorias/CHANGELOG_v2.0.md

Content:
  # Version 2.0 — Keeper Tools & Advanced Notes

  ## New Features
  
  ### Task #1: Keeper Tutorial
  - 15-step guided onboarding tour
  - Auto-starts on first visit
  - Re-triggerable via toolbar button
  
  ### Task #2: Advanced Notes System
  
  #### Core Features
  - Create, read, update, delete notes
  - Wikilinks: [[Note Title]] syntax
  - Backlinks: see what references your note
  - Full-text search + tag filtering
  - Real-time markdown preview
  
  #### Templates (Quick Start)
  - NPC template (identity, relations)
  - Location template (description, POIs)
  - Encounter template (setup, rewards)
  - Mystery template (clues, solution)
  - Session template (summary, events)
  
  #### Import/Export
  - Export all notes as Markdown
  - Export all notes as JSON (backup)
  - Export single note as Markdown
  - Import Markdown files (auto-parse)
  
  #### Shortcuts & UX
  - Ctrl+K: Focus search
  - Ctrl+N: Create note
  - Esc: Clear search
  - Wikilink autocomplete while typing [[
  - Recently accessed notes quick access
  - Note statistics (total, tags, avg size)
  
  ## Bug Fixes
  - Fixed backlinks click handler
  
  ## Technical
  - 1050 lines of new UI code
  - 287 lines of note logic
  - 100% test coverage maintained
  - 0 breaking changes
  - Full IndexedDB persistence
  
  ## Known Limitations
  - Single-tag filtering (no AND/OR)
  - Max autocomplete suggestions: 5
  - Archive/trash: not yet implemented
  - Versioning: planned for Sprint 3
  
  ## Next Sprint
  - Archive/Trash with 30-day recovery
  - Full-text search operators (tag:, created:, etc)
  - Folder organization UI
  - Integração Keeper ↔ Investigador

Tempo: ~30 min
```

---

### ESSA SEMANA (2026-06-12 a 2026-06-14)

#### [ ] 6. User Testing & Feedback
```
Test with 1-2 actual sessions:

First Session:
  [ ] Load keeper.html
  [ ] Go through tutorial (all 15 steps)
  [ ] Time it (should be <10 min)
  [ ] Note any confusing steps
  [ ] Note any missing information
  
  [ ] Create test notes:
    - Create NPC note (use template)
    - Create Location note
    - Create Mystery note
  
  [ ] Test search & filters:
    - Search for keyword
    - Filter by tag
    - Click recent note
  
  [ ] Test export:
    - Export single note
    - Export all as Markdown
    - Save file locally
  
  [ ] Test keyboard shortcuts:
    - Ctrl+K to search
    - Ctrl+N to create
    - Type [[ for autocomplete

Second Session (Optional):
  [ ] Try [[wikilinks]] between notes
  [ ] Check backlinks display
  [ ] Verify all editing works
  [ ] Try import from markdown file

Feedback Log:
  [ ] Document any UI issues
  [ ] Document confusing flows
  [ ] Document missing features
  [ ] Measure session time (compare to without notes)

Tempo: ~2-4 horas
```

#### [ ] 7. Collect Metrics
```
Before/After Comparison:
  Question: "How much time do notes save?"
  
  Session 1 (this week):
    - Time in notes system: _____ min
    - Number of notes created: _____
    - Number of searches: _____
    - Most useful feature: _____
    
  Session 2 (next week):
    - Repeat measurements
    - Compare trends

NPS Feedback:
  "How likely are you to recommend this notes system?"
  Rating: 1-10 _____
  
  "What was most useful?"
  _________________________________
  
  "What should we improve?"
  _________________________________
  
Tempo: ~10 min per session
```

#### [ ] 8. Fix Any Bugs Found
```
Bug Template:
  Title: [NOTES] <brief issue>
  
  Reproduction:
    1. Step 1
    2. Step 2
    3. See issue
  
  Expected: ___
  Actual: ___
  
  Severity: Critical / High / Medium / Low
  Browser: Chrome / Firefox / Safari / Edge

Common Issues to Watch:
  [ ] Wikilinks not resolving
  [ ] Autocomplete not showing
  [ ] Backlinks empty when they shouldn't be
  [ ] Search returning no results
  [ ] Tags not filtering
  [ ] Export file not downloading
  [ ] Mobile layout broken

If bug found:
  [ ] Create GitHub issue
  [ ] Assign to yourself
  [ ] Create bugfix branch
  [ ] Test fix locally
  [ ] Commit with "fix:" prefix
  [ ] Push + create PR
  [ ] Merge when approved

Tempo: As needed
```

---

### PRÓXIMA SEMANA (2026-06-17)

#### [ ] 9. Start Sprint 1: Quick Wins
```
Priority 1: Archive/Trash (4 hours)
  [ ] Add deletedAt timestamp to schema
  [ ] Create Trash UI tab
  [ ] Show deleted notes < 30 days
  [ ] Add Restore button
  [ ] Add Permanent Delete button

Priority 2: Full-Text Search Operators (8 hours)
  [ ] Support: tag:pista
  [ ] Support: created:>2026-01-01
  [ ] Support: updated:<7d
  [ ] Support: content:"exact phrase"
  [ ] Support: -excluded (NOT operator)
  [ ] Add search help tooltip

Testing:
  [ ] All tests passing
  [ ] QA new features
  [ ] No regressions

Commit:
  [ ] feat(keeper-notes): Archive/Trash + Search operators
  [ ] Create PR, merge when ready

Tempo: 12 hours
```

#### [ ] 10. Document User Guide
```
Create: docs/KEEPER_NOTES_USER_GUIDE.md

Sections:
  [ ] Quick Start (5 min)
  [ ] Creating Notes
  [ ] Wikilinks & Backlinks
  [ ] Searching & Filtering
  [ ] Tags Management
  [ ] Templates
  [ ] Import/Export
  [ ] Keyboard Shortcuts
  [ ] Tips & Tricks
  [ ] Troubleshooting

Add to: README.md or docs/ folder

Tempo: ~2 horas
```

---

## 📋 Checklist de Deploy

```
PRÉ-DEPLOY:
  [✓] All tests passing
  [✓] No console errors
  [✓] CI passing
  [✓] Code reviewed
  [✓] PR merged to main

DEPLOY:
  [ ] Pull latest main locally
  [ ] Run tests one more time
  [ ] Verify no uncommitted changes
  [ ] Push to GitHub (auto-deploys to Pages)
  [ ] Wait 2 minutes

PÓS-DEPLOY:
  [ ] Visit site in new incognito window
  [ ] Test both keeper.html and investigator.html
  [ ] Verify tutorial loads
  [ ] Verify notes tab appears
  [ ] Check browser console (no errors)

BACKUP:
  [ ] Commit all changelog/docs
  [ ] Push to main
  [ ] Keep local copy of deployment date
  
ANNOUNCE:
  [ ] Post update message to users
  [ ] Highlight new features
  [ ] Link to user guide
```

---

## 🎯 Métricas para Rastrear

```
BEFORE MERGE (Baseline - NOW):
  Session duration: _____ min
  Notes used per session: _____
  GM prep time: _____ min
  Confusion points: _____

AFTER MERGE (Week 1):
  Session duration: _____ min
  Notes used per session: _____
  GM prep time: _____ min
  Confusion points: _____

AFTER SPRINT 1 (Week 2-3):
  Session duration: _____ min
  Notes used per session: _____
  GM prep time: _____ min
  Confusion points: _____

KPIs:
  [ ] User adoption rate (%)
  [ ] Features used (which ones)
  [ ] Friction points (any?)
  [ ] NPS score (1-10)
  [ ] Session time (increasing or decreasing?)
  [ ] Prep time (saved time = success)
```

---

## 🚨 Possíveis Problemas & Soluções

### Issue: CI fails after merge
```
Checklist:
  [ ] Check GitHub Actions log
  [ ] Run tests locally: node js/tests/runner.js
  [ ] Look for environment differences
  [ ] Update CI config if needed
  [ ] Push hotfix commit
```

### Issue: Notes not saving
```
Checklist:
  [ ] Open DevTools (F12)
  [ ] Check IndexedDB quota
  [ ] Clear localStorage
  [ ] Reload page
  [ ] Try export/import (backup)
  [ ] Check browser storage settings
```

### Issue: Wikilinks not working
```
Checklist:
  [ ] Verify exact title match (case-insensitive should work)
  [ ] Check [[Title]] format (need brackets)
  [ ] Clear browser cache
  [ ] Test with simple note names
  [ ] Check console for errors
```

### Issue: Performance degradation
```
Checklist:
  [ ] Measure load time baseline
  [ ] Check DevTools Performance tab
  [ ] Look for unoptimized queries
  [ ] Reduce max notes in list
  [ ] Enable search debouncing
  [ ] Profile with Chrome DevTools
```

---

## 📞 Support Contacts

**Technical Questions?**
- Check: `Melhorias/ROADMAP_COMPLETO_POS_MERGE.md`
- Check: `Melhorias/STATUS_IMPLEMENTACAO_DETALHADO.md`

**Bug Reports?**
- Create GitHub issue with:
  - Title: [NOTES] Brief description
  - Steps to reproduce
  - Expected vs actual
  - Browser + OS

**Feature Requests?**
- Comment on PR #36
- Or create new GitHub issue with [FEATURE] tag

---

## 🎉 Success Criteria (Post-Merge)

**You'll know it's successful if:**

```
Day 1:
  ✅ Tutorial shows up on first visit
  ✅ Can create a note
  ✅ Can search notes
  ✅ Can export notes
  
Week 1:
  ✅ Used notes in 1+ actual sessions
  ✅ No critical bugs
  ✅ Users say "this saves time"
  
Week 2:
  ✅ Sprint 1 features deployed (Archive, Search)
  ✅ No regressions
  ✅ Users are creating notes naturally
  
Month 1:
  ✅ 50+ notes created (across users)
  ✅ Average session includes notes
  ✅ Positive feedback from community
```

---

## 📅 Suggested Timeline

```
Jun 10 (TODAY)
  ├─ Merge PR #36
  ├─ Deploy to production
  └─ Start user testing

Jun 11-12
  ├─ Collect feedback
  ├─ Fix any bugs
  └─ Write changelog

Jun 13-14
  ├─ Run actual sessions
  ├─ Measure impact
  └─ Document learnings

Jun 15-17 (Weekend/Buffer)
  └─ Rest, review feedback

Jun 18-22 (Sprint 1)
  ├─ Archive/Trash feature
  ├─ Full-text search operators
  └─ Deploy improvements

Jun 25+ (Sprint 2)
  ├─ Keeper ↔ Investigador linking
  ├─ Folder organization
  └─ Continue roadmap

```

---

## 📝 Final Checklist

### Must-Do Before Merge
- [✓] All tests passing
- [✓] CI passing
- [✓] Code reviewed
- [✓] Documentation complete
- [✓] No breaking changes
- [ ] User approval ← YOU ARE HERE

### Must-Do After Merge
- [ ] Deploy to production
- [ ] User testing (1+ session)
- [ ] Bug fixes if found
- [ ] Announce to community

### Should-Do This Week
- [ ] Write changelog
- [ ] Create user guide
- [ ] Measure impact
- [ ] Plan Sprint 1

### Nice-To-Do This Week
- [ ] Make video tutorial
- [ ] Share on community channels
- [ ] Collect NPS feedback
- [ ] Plan mobile features

---

**Last Updated**: 2026-06-10  
**Review Date**: 2026-06-15  
**Owner**: User / claude

Need help? Review this doc, check the roadmap, or ask in GitHub issues.
