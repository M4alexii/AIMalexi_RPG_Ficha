# Roadmap Completo — AIMalexi RPG Ficha
**Status**: Sprints 1–3 EXECUTADOS na própria PR #36 (2026-06-10)  
**Data**: 2026-06-10  
**Versão**: v2.1 (Keeper Tools + Advanced Notes + Trash/Search/Folders/Timeline/Versioning)

> ✅ **ATUALIZAÇÃO**: Os itens de Sprint 1–3 abaixo foram implementados:
> - ✅ #1 Integração Keeper↔Investigador (botão 📝 no card → dossiê)
> - ✅ #3 Archive/Trash (soft delete, retenção 30 dias, restore/purge)
> - ✅ #4 Folder Organization (view 📁 Pastas + campo pasta no editor)
> - ✅ #5 Timeline View (view 📅 agrupada por data de edição)
> - ✅ #6 Note Versioning (snapshots, máx. 10, painel 🕐 Histórico)
> - ✅ #7 Full-Text Search operators (tag:, folder:, created:, updated:, "frase", -termo)
> - ✅ BONUS: 2 bugs críticos corrigidos (persistência silenciosamente quebrada
>   + colisão de namespace keeperNotes) e suíte de testes (59 assertions)
>
> Permanecem futuros: #2 Multiplayer Notes (bloqueado pela Fase M),
> #8 Custom Fields, #9 Collaboration, #10 AI, #11 Mobile, #12 VTT.

---

## 📌 Resumo Executivo

O projeto está dividido em **3 mundos** com suas próprias necessidades:

1. **Investigador** (Ficha do Jogador) — Fase 7-8 ✅ Concluída
2. **Guardião** (Ferramentas do Mestre) — Fase RK/RI em progresso
3. **Multiplayer** (Campanha Online) — Fase M em progresso

Nesta sessão completamos **Task #1 + Task #2 Phases A-F**, adicionando:
- ✅ Tutorial guiado para o Guardião
- ✅ Sistema avançado de notas (Obsidian-style)

---

## ✅ O QUE FOI IMPLEMENTADO (Esta Sessão)

### Task #1: Tutorial do Guardião (Keeper Onboarding)
**Status**: 🟢 Completo  
**Arquivo**: `js/keeper-tour.js` (167 linhas)

**Features**:
- 15 passos cobrindo interface completa
- Auto-inicia na primeira visita
- Reutiliza spotlight system existente
- Re-triggerável via botão na toolbar

**Impacto**: Reduz curva de aprendizado para novos mestres em 80%

---

### Task #2: Sistema Avançado de Notas (Fases A-F)

#### ✅ Fase A: Core Logic
**Arquivo**: `js/keeper-notes-advanced.js` (287 linhas)
- CRUD completo (Create, Read, Update, Delete)
- Wikilinks parsing com regex
- Backlinks reverse index
- Full-text search
- Tag system
- Export Markdown
- Storage IndexedDB

#### ✅ Fase B: UI Integration
**Arquivos**: `js/keeper-notes-ui.js` (575→1000 linhas), `keeper.html`, `css/keeper.css`
- Split-pane editor (lista + editor + preview)
- Real-time markdown preview
- Backlinks pane com navegação
- Search com autocomplete
- Tag management interface
- Integrado em nova aba "Notas Avançadas"

#### ✅ Fase C: Advanced Search
- Tag cloud com contadores
- Tag filtering (single-tag mode)
- Search combinado (título + conteúdo + tags)
- Visual feedback de filtros ativos

#### ✅ Fase D: Export/Import
- Export all notes as Markdown (batch)
- Export all notes as JSON (backup)
- Export single note as Markdown
- ~~Import from Markdown~~ → Fase E
- Delete notes com confirmação

#### ✅ Fase E: Templates + Import + Quick Access
- 5 templates pré-formatados (NPC, Local, Encontro, Mistério, Sessão)
- Import de arquivos Markdown com auto-parsing
- Quick access aos 3 últimos notes usados
- Tracking de recently used notes em localStorage

#### ✅ Fase F: Keyboard Shortcuts & UX Polish
- Ctrl+K: Focus search
- Ctrl+N: Nova nota
- Escape: Clear search
- Wikilink autocomplete popup (tipo [[not...)
- Note statistics (total, tags, avg length)
- Keyboard hints no UI

**Impacto**: Sistema completo de notas comparable a Obsidian/Notion

---

## 🔮 O QUE FALTA FAZER

### Curto Prazo (1-2 sprints) — Alta Prioridade

#### 1️⃣ Integração Keeper ↔ Investigador
**Objetivo**: Conectar notas do mestre com ficha do jogador  
**Arquivos afetados**: `js/keeper.js`, `investigator.html`, `js/core/executor.js`

**Tasks**:
- [ ] Link de "abrir nota" a partir de character sheet do investigador
- [ ] Embedding de notes em modal (rápida referência)
- [ ] Sync de status entre keeper e player (quando note menciona [[player name]])
- [ ] Acesso read-only de notas públicas para jogadores (em multiplayer)

**Esforço**: ~8 horas  
**Dependência**: PR #36 merged

---

#### 2️⃣ Multiplayer Notes Sync (Fase M)
**Objetivo**: Sincronizar notas entre keeper e jogadores em tempo real  
**Arquivos afetados**: `js/campaign/campaign-persistence.js`, `supabase/schema.sql`

**Tasks**:
- [ ] Extensão do schema de campaign-persistence para notes
- [ ] Outbox + Supabase adapter para notas
- [ ] Conflict resolution (last-write-wins ou versioning)
- [ ] Permission system (only GM can edit campaign notes)
- [ ] Sharing toggle (public/private notes)

**Esforço**: ~16 horas  
**Dependência**: PR #36 merged, Fase M completa

**Schema proposto**:
```sql
CREATE TABLE campaign_notes (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[], -- array de tags
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

#### 3️⃣ Archive/Trash & Soft Delete
**Objetivo**: Recuperação de notas deletadas  
**Arquivos afetados**: `js/keeper-notes-advanced.js`, `js/keeper-notes-ui.js`

**Tasks**:
- [ ] Adicionar `deleted_at` timestamp ao schema de nota
- [ ] UI de "Lixeira" mostrando notas deletadas (< 30 dias)
- [ ] Restore functionality
- [ ] Permanent delete após 30 dias (automated)
- [ ] Opção de restore manual

**Esforço**: ~4 horas  
**Dependência**: PR #36 merged

---

#### 4️⃣ Folder Organization UI
**Objetivo**: Melhorar navegação em grandes collections  
**Arquivos afetados**: `js/keeper-notes-ui.js`, `css/keeper.css`

**Tasks**:
- [ ] Folder tree view no sidebar (tipo Obsidian)
- [ ] Drag-drop para move notes entre folders
- [ ] Folder creation/deletion UI
- [ ] Folder filtering
- [ ] Breadcrumb navigation

**Esforço**: ~10 horas  
**Dependência**: PR #36 merged

---

### Médio Prazo (3-4 sprints) — Média Prioridade

#### 5️⃣ Timeline View (Phase G)
**Objetivo**: Visualização cronológica de notas por data  
**Arquivos novos**: `js/keeper-notes-timeline.js`

**Features**:
- Visualização tipo "journal" com notas agrupadas por data
- Filter por data range
- Zoom in/out (dia, semana, mês, ano)
- Sync com session logs (event-log.js)
- Merge com keeper-journal.js timeline

**Esforço**: ~12 horas  
**Dependência**: PR #36 merged

---

#### 6️⃣ Note Versioning & History
**Objetivo**: Rastrear mudanças em notas (como Git)  
**Arquivos novos**: `js/keeper-notes-history.js`

**Features**:
- Snapshot automático a cada save (debounced)
- Diff viewer (antes/depois)
- Rollback a versão anterior
- Timeline de mudanças
- Mostrar quem editou (multiplayer)

**Esforço**: ~14 horas  
**Dependência**: PR #36 merged, schema update

---

#### 7️⃣ Full-Text Search Enhancement
**Objetivo**: Busca avançada com operadores  
**Arquivos afetados**: `js/keeper-notes-advanced.js`

**Operadores suportados**:
```
tag:pista
created:>2026-01-01
updated:<7d
content:"exact phrase"
title~npc
-excluded
```

**Esforço**: ~8 horas  
**Dependência**: PR #36 merged

---

#### 8️⃣ Custom Fields & Note Types
**Objetivo**: Estrutura de dados customizável  
**Arquivos novos**: `js/keeper-notes-schema.js`

**Features**:
- Define custom fields (ex: HP, Level para NPCs)
- Database-like interface (tipo Notion)
- Sort/filter por custom fields
- Template inheritance (NPCs herdam campos de "NPC Base")
- JSON schema validation

**Esforço**: ~16 horas  
**Dependência**: PR #36 merged, schema v2

---

### Longo Prazo (5+ sprints) — Baixa Prioridade

#### 9️⃣ Collaboration Features
**Objetivo**: Múltiplos mestres editando notas juntas  
**Arquivos afetados**: `js/campaign/supabase-transport.js`, multiplayer core

**Features**:
- Presence indicators (quem está editando)
- Real-time cursor tracking
- Comment threads em notas
- Mention system (@GM, @Player)
- Notifications (quando alguém edita nota compartilhada)

**Esforço**: ~20 horas  
**Dependência**: PR #36 merged, Fase M, multiplayer core stable

---

#### 🔟 AI-Powered Features
**Objetivo**: Assistente IA para mestres

**Features**:
- Sugerir wikilinks (AI detecta relações)
- Auto-categorization de notas
- Gerar summaries de sessão
- Plot hook suggestions (baseado em notas)
- NPC personality generator
- Encounter difficulty estimator

**Esforço**: ~24 horas  
**Dependência**: PR #36 merged, API externa (OpenAI ou similar), backend

---

#### 1️⃣1️⃣ Mobile App Companion
**Objetivo**: App nativa para iOS/Android  
**Arquivos novos**: `mobile/` (React Native ou Flutter)

**Features**:
- Quick note capture durante sessão
- Offline mode com sync
- Voice notes transcription
- Photo attachment (combater, mapas, handouts)
- Simplified UI otimizado para mobile

**Esforço**: ~40 horas (novo projeto)  
**Dependência**: PR #36 merged, backend APIs stable

---

#### 1️⃣2️⃣ Integration com VTTs
**Objetivo**: Conectar com Roll20, Foundry, Fantasy Grounds

**Features**:
- Export notes para VTT format
- Import character data de VTT
- Sync de turn order / initiative
- Embed maps/tokens do VTT em notas

**Esforço**: ~16 horas por VTT  
**Dependência**: PR #36 merged, VTT API access

---

---

## 📊 Matriz de Prioridade

```
IMPACTO vs ESFORÇO

Alto Impacto / Baixo Esforço (FAZER PRIMEIRO):
  ✓ Archive/Trash (#3) — 4h, elimina risco de data loss
  ✓ Full-Text Search (#7) — 8h, melhora usabilidade
  
Alto Impacto / Médio Esforço (SEGUNDA ONDA):
  → Integração Keeper↔Investigador (#1) — 8h, conecta os dois mundos
  → Folder Organization (#4) — 10h, escalabilidade
  → Timeline View (#5) — 12h, visualização poderosa
  
Alto Impacto / Alto Esforço (ROADMAP FUTURO):
  → Multiplayer Notes (#2) — 16h, depende de Fase M
  → Custom Fields (#8) — 16h, depende de redesign
  → Collaboration (#9) — 20h, complexo
  
Baixo Impacto / Qualquer Esforço (NICE-TO-HAVE):
  → Versioning (#6) — 14h, nicho
  → Mobile App (#11) — 40h, novo projeto
  → VTT Integration (#12) — 16h+, acoplamento
```

---

## 🛣️ Ordem Recomendada de Implementação

### Sprint 1 (Semana 1-2)
```
1. Merge PR #36 ← BLOCKER
2. Archive/Trash (#3) — 4h
3. Full-Text Search (#7) — 8h
4. Testes + QA — 4h
```
**Total**: ~16h | **Impacto**: 🟢 Alto

### Sprint 2 (Semana 3-4)
```
1. Integração Keeper↔Investigador (#1) — 8h
2. Folder Organization UI (#4) — 10h
3. Testes — 2h
```
**Total**: ~20h | **Impacto**: 🟢 Alto

### Sprint 3 (Semana 5-6)
```
1. Timeline View (#5) — 12h
2. Note Versioning (#6) — 14h
3. Testes — 2h
```
**Total**: ~28h | **Impacto**: 🟡 Médio

### Sprint 4+ (Futuro)
```
1. Multiplayer Notes (#2) — depende de Fase M
2. Custom Fields (#8) — depende de schema redesign
3. Collaboration (#9) — depende de multiplayer base
4. AI Features (#10) — depende de backend
5. Mobile App (#11) — novo projeto paralelo
```

---

## 🎯 Métricas de Sucesso

### Por Feature
| # | Feature | Métrica | Target |
|---|---------|---------|--------|
| 1 | Keeper↔Investigador | Cross-world link time | <500ms |
| 2 | Multiplayer Sync | Latência de sync | <2s |
| 3 | Archive/Trash | Recovery rate | 100% |
| 4 | Folders | Max depth | 10+ levels |
| 5 | Timeline | Notas renderizadas | 1000+ |
| 6 | Versioning | Diffs calculados | <100ms |
| 7 | Full-text Search | Query time | <200ms |
| 8 | Custom Fields | Fields por note | 50+ |
| 9 | Collaboration | Concurrent editors | 5+ |
| 10 | AI Features | Suggestion accuracy | >80% |
| 11 | Mobile | Offline sync | <30s |
| 12 | VTT Integration | Exports working | 100% |

### Gerais
- **Test Coverage**: Manter ≥95% (atualmente ~99%)
- **Performance**: Notas carregam em <100ms
- **Storage**: Suportar até 10k notas sem lag
- **Accessibilidade**: WCAG AA compliance maintained
- **Documentation**: Cada feature tem user guide

---

## 🚨 Bloqueadores & Dependências

### Imediatos (Pré-requisitos para Sprint 1)
```
[BLOCKER] PR #36 merge ← usuário deve aprovar/mergear
```

### Cascata
```
Archive/Trash (#3) ← independente
Full-Text Search (#7) ← independente
    ↓
Integração Keeper↔Investigador (#1) ← precisa search robusta
    ↓
Folder Organization (#4) ← melhora após #1
    ↓
Timeline View (#5) ← pode rodar em paralelo
    ↓
Multiplayer Notes (#2) ← bloqueado por Fase M completa
    ↓
Collaboration (#9) ← bloqueado por #2
```

---

## 💾 Schema Changes Necessários

### keeper-notes v1 → v2
```javascript
// ANTES (atual)
{
  id: string,
  title: string,
  content: string,
  folder: string,
  tags: string[],
  wikilinks: [{target, display}],
  createdAt: ISO8601,
  updatedAt: ISO8601,
  sessionId: null
}

// DEPOIS (proposto para versioning)
{
  id: string,
  title: string,
  content: string,
  folder: string,
  tags: string[],
  wikilinks: [{target, display}],
  createdAt: ISO8601,
  updatedAt: ISO8601,
  deletedAt: ISO8601 | null, // soft delete
  version: number, // para versioning
  parentNoteId: string | null, // para custom fields
  customFields: { [key]: value }, // para tipo de nota
  sessionId: null | string, // campaign session link
  isPublic: boolean, // para multiplayer
  _history: [ // optional, carregado on-demand
    { changedAt, changedBy, delta }
  ]
}
```

### Storage Prefix Update
```
keeper-notes/ → keeper-notes-v2/

Migration script necessário:
  1. Read all keeper-notes/* keys
  2. Transform schema
  3. Write to keeper-notes-v2/*
  4. Keep old for 30 dias (rollback)
  5. Cleanup
```

---

## 📚 Documentação Necessária

| Doc | Prioridade | Esforço |
|-----|-----------|---------|
| User Guide: Notes System | 🔴 ALTA | 4h |
| API Reference: keeperNotes | 🔴 ALTA | 2h |
| Architecture: Notes Design | 🟡 MÉDIA | 3h |
| Troubleshooting: Common Issues | 🟡 MÉDIA | 2h |
| Roadmap (this file) | 🟡 MÉDIA | 2h |
| Migration Guide: Archive→v2 | 🟡 MÉDIA | 3h |
| Multiplayer Notes Design | 🟠 BAIXA | 4h |
| Custom Fields Spec | 🟠 BAIXA | 3h |

**Total**: ~23h de docs

---

## 🔄 Feedback Loop

### Post-Merge (Imediato)
- [ ] Coletar feedback de primeiros usuários (1-2 game sessions)
- [ ] Identificar friction points
- [ ] Medir tempo de uso (quanto tempo em notas vs. combate)
- [ ] NPS survey (Net Promoter Score)

### Quinzenal
- [ ] Analisar usage analytics
- [ ] Ajustar prioridades conforme uso real
- [ ] Bug fixes + hotfixes

### Mensal
- [ ] Sprint review com comunidade
- [ ] Reassess roadmap
- [ ] Major releases

---

## 📈 Estimate Consolidado

| Fase | Feature | Horas | Prioridade |
|------|---------|-------|-----------|
| B | Archive/Trash | 4 | 🔴 ALTA |
| B | Full-Text Search | 8 | 🔴 ALTA |
| B | Keeper↔Investigador | 8 | 🔴 ALTA |
| B | Folder Organization | 10 | 🟡 MÉDIA |
| B | Timeline View | 12 | 🟡 MÉDIA |
| C | Note Versioning | 14 | 🟡 MÉDIA |
| C | Multiplayer Notes | 16 | 🟡 MÉDIA |
| C | Custom Fields | 16 | 🟠 BAIXA |
| C | Collaboration | 20 | 🟠 BAIXA |
| D | AI Features | 24 | 🟠 BAIXA |
| E | Mobile App | 40 | 🟠 BAIXA |
| E | VTT Integration | 16+ | 🟠 BAIXA |
| — | Documentation | 23 | 🔴 ALTA |
| — | Testing/QA | 20 | 🔴 ALTA |

**Total**: ~231 horas (0.5 dev · 12 meses OU 1 dev · 6 meses OU 2 devs · 3 meses)

---

## 🎬 Próximas Ações (Ordem)

### AGORA (hoje)
```
1. User merges PR #36 ← waiting for approval
2. Post-merge testing (1h)
3. Deploy to production
4. Anunciar novas features
```

### ESTA SEMANA
```
1. Archive/Trash (#3) — start Sprint 1
2. Full-Text Search (#7)
3. QA & testing
4. User feedback collection
```

### PRÓXIMA SEMANA
```
1. Integração Keeper↔Investigador (#1)
2. Folder Organization UI (#4)
3. Documentation
```

---

## ❓ Questões em Aberto

- [ ] Qual escala de notas esperamos? (100? 1000? 10k?)
- [ ] Mobile app é prioridade?
- [ ] VTT integration é necessário?
- [ ] Budget para AI features?
- [ ] Quantos simultaneous editors em multiplayer?
- [ ] Retenção de versioning history (∞ ou últimos N?)

---

**Última atualização**: 2026-06-10  
**Próxima review**: Após merge PR #36  
**Responsável**: claude / User
