# Plano de Melhorias UX #3 + Aesthetic MMO #4

**Status**: Em desenvolvimento  
**Fase**: 8 da redesign imersiva  
**Foco**: Polish visual estilo MMO (Warcraft/Baldur's Gate) + UX refinements para Investigador

---

## #4 — MMO Aesthetic Polish

### Objetivo
Elevar o visual da ficha do investigador para nível de game profissional, com profundidade, brilho e presença visual comparável a MMORPGs como World of Warcraft e CRPGs como Baldur's Gate 3.

### Estratégia Visual

#### 1. **Depth & Shadow Enhancement**
- Aumentar sombras em cards e panels
- Adicionar drop-shadows mais pronunciados (0 8px 24px → 0 12px 32px)
- Criar efeito de "levitação" com inset shadows
- Usar layered shadows para efeito 3D

#### 2. **Glow & Luminosity**
- Adicionar text-shadow a títulos importante (serif titles get subtle glow)
- Glow sutil em accents (brass, blood, mist colors)
- Highlight com gradientes luminosos em hover
- Box-shadow glow em elementos ativos

#### 3. **Border & Frame Definition**
- Bordas mais definidas com frame-line colors
- Efeito de "entalhe" duplo (inset + normal borders)
- Gradient borders em cards importantes
- Beveled edges em alguns elementos

#### 4. **Hover & Interaction States**
- Lift effect em hover (translateY(-2px) + shadow boost)
- Color transitions mais suaves
- Backdrop blur effects em overlays
- Scale transforms sutis em clickables

#### 5. **Texture & Pattern Overlay**
- Subtle noise/grain texture no background parchment
- Ink bleed effects nas bordas de cards
- Pattern repeating em backgrounds (canvas, linen)
- Semi-transparent pattern overlays

### Implementation Areas

```
Priority 1 — Core Panels:
□ Character sidebar: enhance depth, add glow to vitals
□ Attribute cards: depth, lift on hover, border glow
□ Skill cards: layered shadows, scroll area styling
□ Combat panel: blood accent glow, border emphasis
□ Roll log: glass morphism or card depth treatment

Priority 2 — Interactive Elements:
□ Buttons: gradient backgrounds, text glow, active states
□ Input fields: focus glow, border animation
□ Tabs: active tab glow, smooth transitions
□ Modals: backdrop blur, centered prominence

Priority 3 — Visual Details:
□ Dividers: gradient or patterned lines
□ Icons: glow on hover, color transitions
□ Text: careful text-shadow on important headings
□ Status indicators: pulsing glow for alerts
```

---

## #3 — UX Improvements (Investigador Layout)

### Objetivo
Refinar organização, hierarquia, affordances e fluxo de trabalho para melhor usabilidade em sessão de jogo.

### Painpoints Identificados

1. **Quick Actions Access**
   - Rolagem de perícia requer navegar para aba
   - Roll modifiers não são visíveis do sidebar
   - Falta macro buttons para ações rápidas

2. **Information Density**
   - Sidebar compacto demais; difícil ler valores rápido
   - Algumas informações derivadas não estão visíveis simultaneamente
   - Organização vertical poderia ser melhor

3. **Visual Hierarchy**
   - Não está 100% claro qual é a ação primária em cada seção
   - Emphasis inconsistente em valores importantes
   - Derived stats (AP, DB, etc) poderiam ser mais proeminentes

4. **Mobile Experience**
   - Sidebar vira problema em mobile (% de real estate)
   - Skill list muito longa, scroll fatigante
   - Tabs deveriam ser mais touch-friendly

### Soluções Propostas

#### A. Expanded Sidebar (Desktop Only)
```
Current: 220px narrow sidebar
Proposed: 260px with better spacing
- More breathing room for vitals
- Clearer attribute display
- Quick-roll buttons inline with attrs
- Expanded portrait area
```

#### B. Skill Quick-Access
```
New Section: "Quick Roll Favorites"
- Pinned 5-6 top skills at sidebar top
- Icons + names + values visible
- Click to roll directly
- Re-orderable drag-drop
```

#### C. Derived Stats Mini-Panel
```
New Compact Card Below Vitals:
- AP, DB, Effective Armor
- Movement speed
- Initiative modifier
- All important combats mods in one place
```

#### D. Action Buttons Reorganization
```
Toolbar buttons: fewer, more spaced
- New → Clear labeling
- Settings/Sanity → merge into unified config
- Most-used actions: Session Export, PDF Print
- Secondary actions collapse into menu (existing)
```

#### E. Mobile: Floating Action Bar
```
New: Sticky bottom action bar on mobile
- "Roll Skill" floating button
- Quick access to tabs
- Settings icon
- Reduces need to scroll back to toolbar
```

#### F. Tab Organization
```
Current tabs might benefit from grouping:
- Character (identity) · Attributes · Skills
- Combat (weapons, armor, initiative)
- Resources (inventory, journals, spells)
- Session (roll log, notes)

Visual separation via tab group styling
```

#### G. Cards Spacing & Sizing
```
Skill cards: currently auto-sized
Proposed: consistent heights, better card grid
- Better visual rhythm
- Easier scanning
- More professional appearance
- Responsive column count
```

#### H. Status & Conditions Display
```
New prominent section: Character Conditions
- Major Wound indicator (big, red, obvious)
- Unconscious/Dying/Dying state
- Temporary insanity status
- Armor damage tracker
All in sidebar for at-a-glance visibility
```

---

## Implementation Sequence

### Phase 1: Visual Polish (MMO Aesthetic)
1. Enhanced shadows & depth
2. Glow effects on key elements
3. Hover state animations
4. Gradient accents

### Phase 2: UX Restructuring (Investigator)
1. Sidebar expansion (desktop responsiveness)
2. Derived stats mini-panel
3. Quick roll favorites section
4. Mobile action bar

### Phase 3: Refinement
1. Testing & feedback
2. Animation tweaking
3. Color & contrast fine-tuning
4. Mobile polish

---

## Success Metrics

- [ ] Visual impression "matches or exceeds" Warcraft/BG3 character sheet quality
- [ ] Key information visible without scrolling (sidebar)
- [ ] Common actions accessible in 1-2 clicks
- [ ] Mobile layout functional without desktop sidebar
- [ ] All animations smooth 60fps
- [ ] No accessibility regressions (contrast, motion)
- [ ] Loading performance unchanged

---

## Files to Modify

1. **css/investigator.css** (majority of work)
   - Shadows, depth, glows
   - Layout adjustments
   - Responsive breakpoints

2. **investigator.html** (minor)
   - New sections (derived stats, quick-roll favorites, conditions)
   - Rearrange toolbar/buttons

3. **css/theme.css** (if needed)
   - New color tokens for enhanced glow effects
   - Backdrop blur support

4. **js/views/** (if needed)
   - Quick-roll favorites state management
   - Drag-drop reordering

---

## Notes

- All changes must maintain backward compatibility
- Sanity FX effects stay independent (already working well)
- Two-world hierarchy (parchment ↔ charcoal) preserved
- No new fonts needed (already have full set)
- No breaking changes to game mechanics
