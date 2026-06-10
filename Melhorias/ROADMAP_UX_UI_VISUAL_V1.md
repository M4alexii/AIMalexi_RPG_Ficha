# Roadmap UX/UI Visual — AIMalexi RPG Ficha
**Versão 1.0 · 2026-06-10 · Escopo: validação de erros visuais, layout, tipografia, cor, desfoque e interações**

---

## Contexto

Este roadmap mapeia **o que precisa ser validado e corrigido** do ponto de vista de UX/UI visual antes que a aplicação atinja maturidade de produto. Está dividido em 7 eixos, cada um com checklist de validação, critério de aceitação e prioridade (P0–P3).

**Como usar:** Para cada item, abrir no dispositivo alvo (mobile Android/iOS em dark mode, tablet, desktop), realizar o passo de teste descrito e marcar `[x]` quando aprovado ou anotar o defeito encontrado.

---

## Eixo 1 — Cor e Contraste

### 1.1 Relação de Contraste WCAG 2.1 AA

| Elemento | Par de Cores | Ratio Alvo | Status | Prioridade |
|---|---|---|---|---|
| `.sattr-value` em card dark | `#d4a960` sobre `#241e17` | ≥ 4.5:1 | **Corrigido (PR #38)** | P1 |
| `.sattr-label` em card dark | `#a89580` sobre `#241e17` | ≥ 3:1 | **Corrigido (PR #38)** | P1 |
| `.svital-label` na sidebar | `#6B5F49` sobre `#E7DABA` | ≥ 4.5:1 | A validar | P2 |
| `.svital-value` na sidebar | `#2B241A` sobre `#E7DABA` | ≥ 7:1 | A validar | P2 |
| Texto de perícia base | `--ink-dim` sobre `--bg-card` | ≥ 3:1 | A validar | P2 |
| Label de `<select>` | `--ink` sobre `--bg-deep` | ≥ 4.5:1 | A validar | P2 |
| Texto em `.skill-mark` ativo | foreground sobre brass | ≥ 4.5:1 | A validar | P2 |
| Texto em botões `.btn-ghost` | `--brass-bright` sobre transparente | ≥ 4.5:1 | A validar | P2 |
| Texto em estado `disabled` | qualquer | ≥ 3:1 | A validar | P3 |

**Ferramenta de teste:** Chrome DevTools → Rendering → "Emulate CSS media feature prefers-color-scheme: dark" + extensão [axe DevTools](https://www.deque.com/axe/).

**Critério de aceite:** Nenhum par abaixo de 4.5:1 em texto normal; 3:1 em texto grande (≥18px bold) e componentes UI.

---

### 1.2 Consistência do Sistema de Cores

- [ ] Verificar se `--bg-deep`, `--bg-mid`, `--bg-card`, `--bg-card-hi` formam hierarquia perceptível (cada nível mais claro que o anterior)
- [ ] `--brass` × `--brass-bright` × `--candle` usados de forma coerente (brass = interativo, candle = destaque passivo)
- [ ] `--blood` × `--burgundy` não trocados em estados críticos (HP baixo vs HP em combate)
- [ ] `--eldritch` reservado exclusivamente para Mythos; sem uso decorativo
- [ ] `--mist` reservado para estados neutros/informativos; nunca em ações destrutivas

---

### 1.3 Dark Mode do Sistema Operacional

| Cenário | Comportamento esperado | Como testar |
|---|---|---|
| Android Chrome dark mode | Sem recoloração automática do browser | Ativar "Forçar dark mode" em chrome://flags |
| iOS Safari dark mode | Sem inversão de parchment para escuro | iPhone → Config → Tela → Escuro |
| Samsung Internet dark mode | Sem fundo branco aparecendo nos cards | Samsung Browser → Dark Mode |
| Desktop Chrome DevTools | prefers-color-scheme: dark sem quebras | DevTools → Rendering |
| PWA instalado em dark mode | Barra de status compatível (#1a1510) | Instalar como PWA e alternar tema do SO |

**Estado atual:** `color-scheme: dark` adicionado em `:root` e em todas as páginas HTML (PR #38). Verificar residuais em cada cenário acima.

---

## Eixo 2 — Tipografia

### 2.1 Carregamento de Fontes

| Fonte | Uso | Fallback | Risco | Validar |
|---|---|---|---|---|
| IM Fell English SC | Títulos Occult (display) | Times New Roman | Peso único, pode falhar em dispositivos sem variante SC | Testar offline (PWA cache) |
| Cormorant Garamond | Headings H2–H4 | Georgia | Demi-bold (600) pode não carregar no iOS | Testar com DevTools → slow 3G |
| Crimson Pro | Corpo | Georgia | italic 400 — verificar no iOS | Inspecionar FOIT |
| Courier Prime | Stats, dados | Courier New | Peso 700 — verificar rendering no Android | monospace comparison |
| Special Elite | Labels typewriter | Courier New | Fonte decorativa — ilegível abaixo de 11px | Testar em zoom 150% |
| Caveat | Anotações (Diário) | Comic Sans | Cursivo — ilegível em low-dpi | Testar em tela de 96dpi |
| JetBrains Mono | Código | monospace | Carregado mas raramente usado | Verificar se pode ser removido |

**Critério de aceite:** Nenhum FOIT visível > 200ms; fallback legível sem FOUC.

**Ação recomendada:** Adicionar `font-display: swap` explícito por família se necessário; revisar se JetBrains Mono pode ser eliminado para economizar ~30KB.

---

### 2.2 Caracteres Unicode Críticos

| Símbolo | Significado | Classes CSS | Risco |
|---|---|---|---|
| `½` (U+00BD) | Metade do atributo | `.sattr-frac-half` | Pode renderizar como `%` em fontes monospace sem suporte |
| `⅕` (U+2155) | Quinto do atributo | `.sattr-frac-fifth` | Geralmente ausente em Courier Prime → fallback genérico |
| `❤` (U+2764) | HP label | `::before` content | Emoji pode ficar colorido quando esperado monocromático |
| `🧠` (U+1F9E0) | SAN label | `::before` content | Emoji não suportado em Android < 8 |
| `🍀` (U+1F340) | Sorte label | `::before` content | Mesmo risco que acima |
| `✦` (U+2726) | MP label | `::before` content | Pode não estar na fonte; fallback é `□` (feio) |

**Ação recomendada:** Substituir `½`/`⅕` por `½`/`1/5` em texto ou usar `<sup>` HTML quando a fonte de fallback não suportar. Para os emojis em `::before`, considerar SVG inline ou `font-family: emoji` explícito.

---

### 2.3 Legibilidade em Escala

- [ ] Texto mínimo legível (`.sattr-fracs`, `--text-xs` = 11.5px) em tela 96dpi com zoom 100%
- [ ] `--text-xs` em `.attr-budget` legível sem esforço — validar em dispositivos de baixa resolução
- [ ] `.roll-entry` no log legível durante rolagem rápida (não apenas estático)
- [ ] `<select>` com lista longa (ocupações): texto não trunca sem tooltip
- [ ] Texto em `.sidebar-name` com nome longo (> 30 chars) quebra corretamente ou trunca com `…`
- [ ] `word-break: break-word` no sidebar-name não produz quebra palavra-do-meio em PT-BR

---

## Eixo 3 — Layout e Responsividade

### 3.1 Breakpoints Cobertos

| Breakpoint | Dispositivo-alvo | O que muda | Status |
|---|---|---|---|
| `≤ 420px` | iPhone SE, Galaxy A03 | wizard e outros layouts | A validar |
| `≤ 600px` | Pequenos Android | ajustes de padding/gap | A validar |
| `≤ 680px` | Phones normais | | A validar |
| `≤ 720px` | Phones grandes | wizard kit/bg | A validar |
| `≤ 767px` | Limite mobile/tablet | sidebar → full-width, bottom nav ativa | **Corrigido atrib. PR #38** |
| `768–1023px` | iPad portrait | layout intermediário | A validar |
| `≥ 901px` | iPad landscape / small desktop | sidebar 2-col | **Corrigido atrib. PR #38** |
| `≥ 1000px` | Desktop médio | | A validar |
| `≥ 1200px` | Desktop largo | sidebar 240px | A validar |
| `≥ 1600px` | Ultra-wide | painel de log 400px | A validar |
| `≥ 1900px` | 4K | | A validar |

**Checklist por breakpoint:**
- [ ] Nenhum conteúdo cortado ou overflow horizontal
- [ ] Textos não se sobrepõem
- [ ] Botões com touch target ≥ 44×44px no mobile
- [ ] Bottom nav não sobrepõe conteúdo (padding `5.5rem` no `.app`)
- [ ] FAB não bloqueia conteúdo interativo na parte inferior

---

### 3.2 Layout do Card de Atributo

| Cenário | Esperado | A validar |
|---|---|---|
| Atributo = 0 (novo personagem) | Mostra "0" em dourado, não vazio | |
| Atributo = 100 (máximo) | Número não estoura o card | |
| Modo Edição ativo no mobile | Steppers ± são tappable (≥44px) | |
| ROLAR TUDO com 9 valores | Todos os cards atualizam sem flash | |
| Toque em valor e edição inline | Keyboard não empurra layout | |

---

### 3.3 Sidebar → Mobile Transition

- [ ] Em exatamente 767px: a sidebar colapsa para full-width sem layout broken
- [ ] `.character-portrait` não distorce aspect-ratio ao colapsar
- [ ] `.sidebar-vitals` mantém proporção de barras no mobile
- [ ] O scroll da `.character-sidebar` no desktop não conflita com o scroll global
- [ ] Safe area (iPhone X+) respeitada no bottom nav (`env(safe-area-inset-bottom)`)

---

## Eixo 4 — Estados Interativos e Micro-interações

### 4.1 Estados de Botão

Cada botão deve ter todos os estados visualmente distintos:

| Estado | Critério | Botões a verificar |
|---|---|---|
| **Default** | Cor base clara | Todos |
| **Hover** | Mudança perceptível sem ser excessiva | `.btn`, `.sattr-row:hover` |
| **Focus-visible** | Outline 2px visível (não outline:none sem alternativa) | Todos os interativos |
| **Active/Pressed** | Feedback visual no toque (scale ou opacity) | Botões de ação rápida |
| **Disabled** | Opacity < 0.5, cursor not-allowed, nenhum evento | Steppers, botões de combate |
| **Loading** | Indicador durante operações async | Salvar, Campanha, Supabase sync |

- [ ] Nenhum `outline: none` sem `:focus-visible` alternativo (acessibilidade de teclado)
- [ ] `:focus-visible` visível em modo de navegação por teclado (Tab)
- [ ] `cursor: pointer` em todos os clicáveis; `cursor: not-allowed` nos desativados

---

### 4.2 Transições e Animações

| Animação | Duração atual | Avaliação |
|---|---|---|
| Hover em `.sattr-row` | 0.15s | OK — rápido, não intrusivo |
| Hover em `.attr-card` | 0.2s | OK |
| `mist-drift` no `body::after` | 30s infinito | A validar: consome GPU em mobile? |
| `.svital-fill` progress | 0.3s | OK |
| Tabs switching | Verificar | Há fade ou é instantâneo? |
| Modal/sheet open | Verificar | `.more-sheet` — há slide-up? |
| Toast/notificação | Verificar | Desaparece suavemente? |
| Roll log entry append | Verificar | Novo item aparece com animação? |

**Ação:** Testar `mist-drift` com DevTools Performance no mobile. Se >3% de CPU idle, desativar em `@media (prefers-reduced-motion: reduce)`.

---

### 4.3 Touch e Gestos Mobile

- [ ] Área de toque das `.mobile-tab` ≥ 44×44px
- [ ] Swipe horizontal entre abas? Se não implementado, documentar como gap UX
- [ ] Botões de `-1 +1 -X` no combate: facilmente apertáveis com polegar sem tocar no vizinho
- [ ] `contenteditable` nos atributos: teclado numérico abre ao tocar (type="number" ou inputmode="numeric"?)
- [ ] Scroll momentum (`-webkit-overflow-scrolling: touch`) nos painéis com overflow

---

## Eixo 5 — Formulários e Inputs

### 5.1 Inputs com Problemas Conhecidos

| Input | Problema potencial | Validar |
|---|---|---|
| Nome/Jogador (text) | Não há `maxlength` → texto estoura layout | Inserir 100+ chars |
| Conceito (text) | Mesmo que acima | |
| Ocupação (`<select>`) | Lista longa (~60 itens) — scroll em iOS | Testar em iOS Safari |
| Idade (`number`) | Sem `min`/`max` no HTML → -999 ou 999 | Testar valores extremos |
| Residência (text) | Sem limite — estoura `.sidebar-identity`? | Inserir 80+ chars |
| Atributos (contenteditable) | `inputmode` não definido — mostra teclado errado | Testar no mobile |
| Inventory textarea | Resize handle interfere com scroll | Testar no mobile |

---

### 5.2 Feedback de Validação

- [ ] Campo obrigatório vazio: feedback visual claro (não só cor vermelha — também ícone/texto)
- [ ] Campo com valor inválido: mensagem em PT-BR, não padrão do browser
- [ ] Feedback de validação não usa apenas cor (acessibilidade para daltonismo)
- [ ] Em iOS: `font-size: 16px` em inputs — sem isso o iOS dá zoom ao focar (já corrigido em `.sheet-card input` com `font-size: 16px`)

---

## Eixo 6 — Renderização e Desempenho Visual

### 6.1 Desfoque e Nitidez

| Elemento | Risco de desfoque | Como testar |
|---|---|---|
| Retrato do personagem | `filter: sepia(0.25) brightness(0.95)` pode desfocar img pequena | Upload de imagem 100×100px |
| `body::before` (noise SVG) | `mix-blend-mode: overlay` pode causar blur composite | Testar em GPU fraca (modo reduzido) |
| `box-shadow` em múltiplos cards | Acúmulo de shadows em listas longas | Testar log com 200+ entradas |
| Emoji em `::before` | Anti-aliasing de emoji pode parecer desfocado em tela non-retina | Testar em monitor 96dpi |
| `text-shadow` em `.sidebar-name` | Excesso de glow pode parecer desfocado | Nome curto vs longo |

---

### 6.2 Repintura e Reflow

- [ ] `.mist-drift` (30s animation em `body::after`) não causa repaints constantes — usar `will-change: transform` se necessário
- [ ] Scroll da lista de perícias (~80 itens) a 60fps no mobile
- [ ] `grid-template-columns: repeat(auto-fill, minmax(...))` não recalcula layout a cada resize (usar `resize observer` ou `debounce`)
- [ ] Transições com `transform` e `opacity` apenas (não `width`, `height`, `top`, `left` que causam reflow)
- [ ] `position: sticky` da sidebar no desktop não causa scroll janking

---

### 6.3 Imagens e Assets

- [ ] Placeholder de retrato (`.character-portrait` sem imagem): dimensão fixa, sem CLS (Cumulative Layout Shift)
- [ ] Banner da campanha: sem CLS ao carregar
- [ ] Ícones de emoji como ♥/🧠/✦: consistência entre plataformas (Android vs iOS vs Windows)
- [ ] `filter: sepia` no retrato: verificar se não cria artefato em PNGs com transparência

---

## Eixo 7 — Testes Cross-browser e Cross-device

### 7.1 Matrix de Validação

| Browser/OS | Versão | Prioridade | Status |
|---|---|---|---|
| Chrome Android (dark mode) | 130+ | P0 | **Em progresso (PR #38)** |
| Safari iOS (dark mode) | 17+ | P0 | A validar |
| Chrome Desktop | 130+ | P1 | A validar |
| Firefox Desktop | 130+ | P1 | A validar |
| Samsung Internet | 24+ | P2 | A validar |
| Safari Desktop (macOS dark) | 17+ | P2 | A validar |
| Edge (Chromium) | 130+ | P3 | A validar |
| Chrome iOS | 130+ | P3 | A validar |

---

### 7.2 Checklist de Validação por Sessão de Teste

Para cada combinação acima, executar:

```
[ ] 1. Abrir investigator.html — nenhum erro de console (F12)
[ ] 2. Verificar que fontes carregaram (não usando fallback visível)
[ ] 3. Verificar que caracteres ½ e ⅕ renderizam corretamente
[ ] 4. Verificar atributos: valor grande + em dourado + legível
[ ] 5. Verificar vitals: HP/SAN/PM com cor de barra correta
[ ] 6. Navegar para todas as 5 abas do mobile: sem overflow horizontal
[ ] 7. Abrir teclado em campo de texto: sem layout shift
[ ] 8. Testar ROLAR TUDO: animação de dados sem flash de fundo branco
[ ] 9. Ativar dark mode do SO: nenhuma inversão inesperada
[ ] 10. Zoom 150% (acessibilidade): nada quebra ou se sobrepõe
[ ] 11. Scroll suave na lista de perícias (~80 itens)
[ ] 12. Abrir keeper.html: mesmas verificações 1–5
```

---

## Resumo Executivo por Eixo

| Eixo | Itens Abertos | Itens Corrigidos | Prioridade Máxima |
|---|---|---|---|
| 1. Cor e Contraste | 15 | 2 | P1 (parcialmente corrigido) |
| 2. Tipografia | 12 | 0 | P2 |
| 3. Layout/Responsividade | 18 | 2 | P1 (parcialmente corrigido) |
| 4. Interações | 14 | 0 | P2 |
| 5. Formulários | 10 | 1 | P2 |
| 6. Renderização | 8 | 0 | P2 |
| 7. Cross-browser | 8 | 0 | P0 (iOS Safari pendente) |

**Total:** 85 itens de validação, 5 confirmados corrigidos no PR #38.

---

## Priorização Sugerida (próximos sprints)

### Sprint Visual S1 — Crítico (≤ 1 semana)
1. Validar `color-scheme: dark` no iOS Safari (P0)
2. Verificar Unicode `½`/`⅕` no Courier Prime em mobile (P1)
3. Adicionar `font-size: 16px` em todos os inputs (evitar zoom iOS) — verificar se já coberto
4. Testar todos os 12 itens do checklist no Chrome Android dark mode

### Sprint Visual S2 — Importante (≤ 2 semanas)
1. Auditoria de contraste WCAG 2.1 AA completa com ferramenta automatizada
2. Medir `mist-drift` animation no mobile — desativar se > 3% CPU
3. Adicionar `inputmode="numeric"` nos contenteditable de atributos
4. Corrigir emojis em `::before` para consistência cross-platform

### Sprint Visual S3 — Refinamento (≤ 1 mês)
1. Swipe entre abas no mobile (UX esperada por usuários mobile-native)
2. Skeleton loading para estados de carregamento (substituir flash de vazio)
3. Revisão de todos os `outline: none` sem `:focus-visible` alternativo
4. Otimizar `will-change` e `contain` para performance de scroll
