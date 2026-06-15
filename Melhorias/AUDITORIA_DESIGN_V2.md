# Auditoria de Produto, UX/UI e Design System — v2 (jun/2026)

Fonte de verdade do **roadmap de polimento de design**. Avalia o produto no eixo
*hobby → profissional → referência de mercado*, dentro das restrições do projeto:
vanilla JS, sem build, tokens em `css/theme.css`, CSP restritiva (assets
self-hosted), 13 temas (arkham é o padrão) e a **identidade temática 1920s como
ativo a sofisticar — não substituir**.

> Este documento acompanha a implementação. A coluna **Status** reflete o estado
> real no código. Atualize-a a cada commit relevante.

---

## Scorecard executivo (linha de base da auditoria)

| Dimensão | Nota base | Diagnóstico |
|---|---|---|
| Primeira impressão | 6 | Atmosfera única; emojis e ausência de screenshot na home |
| Hierarquia visual | 5 | Toolbars com fileiras de retângulos iguais; EXPORTAR invertia a hierarquia |
| Design system | 6 | Tokens existiam em 2 camadas; muitos valores órfãos |
| Qualidade visual | 6 | Boa base; faltava profundidade de superfícies e ritmo |
| UX e fluxos | 6 | Wizard forte; navegação pós-criação densa |
| Componentes | 6 | Nenhum chegava a "profissional"; falha geral em `focus-visible`/`loading` |
| Responsividade | 6 | Sólida; FAB e selects no mobile a polir |
| Acessibilidade | 6 | Base rara (reduced-motion, alto contraste); faltava AA |
| Iconografia/marca | 4 | Emojis como ícones funcionais; sem favicon/OG de marca |
| Microcopy/i18n | 7 | pt-BR forte; pequenos vazamentos |
| Estados e feedback | 6 | Empty-states desiguais |
| Onboarding | 6 | Wizard ótimo; first-run com banco vazio fraco |
| Densidade | 6 | Densa por natureza; gerenciamento parcial |
| PWA | 5 | Manifest presente; ícones/splash/standalone a polir |

**5 itens que mais denunciavam "não é produto comercial":** E1 (emojis como
ícones), E2 (toolbar sem hierarquia / EXPORTAR primário fixo), E13 (headers
consumindo ~200px), E4 (controles nativos sem tema), E3 (home sem screenshot +
grid órfão).

---

## Findings × Status de implementação

Severidade: S0 quebra percepção comercial · S1 denuncia amadorismo · S2 separa
sólido de profissional · S3 separa profissional de referência.

| ID | Sev | Resumo | Status |
|----|-----|--------|--------|
| E1/F-001 | S1 | Emojis como ícones funcionais | ✅ Sprite SVG + favicon de marca; toolbars/abas/feature cards migrados |
| E2 | S1 | Toolbar sem hierarquia; EXPORTAR primário fixo | ✅ `.btn-export` rebaixado a secundário |
| E3/F-005 | S0 | Home sem screenshot + grid órfão | ✅ Grid 2×2; hero redesenhado com copy forte, CTA duplo e trust line |
| E4/F-002 | S1 | Controles nativos sem tema | ✅ `accent-color` global + `<select>` com chevron próprio |
| E5/F-009 | S1 | Vazamento de i18n no editor de NPC | ✅ Verificado: rótulos já pt-BR; só o tipo de ataque vazava → corrigido |
| E6/F-010 | S1 | Bordas tracejadas vermelhas = erro | ✅ Verificado: tracejado é cinza/estrutural — não era defeito |
| E7 | S1 | Vermelho do Guardião = marca e perigo | ✅ `--keeper-accent` oxblood × `--danger` |
| E8 | S1 | Overflow horizontal (swatches, bestiário) | ✅ `flex-wrap` + `overflow-x:hidden` |
| E9 | S1 | Container vazio na aba Personagem | ✅ Moldura do dashboard oculta sem personagem |
| E10 | S1 | Preview de Markdown quebrado | ✅ Preview usa miniMD de verdade |
| E11 | S1 | Painéis com ✕ dentro de abas | ✅ Botões viram "Limpar" com ícone |
| E12 | S1 | Dashboard vazio no topo do Guardião | ✅ Recolhe sem campanha/investigadores |
| E13 | S1 | Headers consumindo espaço | ✅ `app-header` compacto (margem/teto reduzidos) |
| E14 | S2 | Stepper do wizard com baixa affordance | ✅ Dots numerados + chips com seleção clara |
| E15 | S1 | Densidade hostil na aba Perícias | ✅ `density-compact`/`density-roomy` cobrem skills; transições tokenizadas |
| E16 | S1 | Mistura tipográfica sem papéis | ✅ 56 ocorrências convertidas para tokens; `14px`/`16px` → rem; pixels removidos |
| E17 | S1 | Estados vazios desiguais | ✅ `.empty-state` padrão + Diário/Arsenal |
| F-003 | S1 | Foco invisível | ✅ Já existia; tokenizado em `--focus-ring` |
| F-008 | S2 | Tooltips só via `title` | ✅ Rollout completo: swatches de tema (13), `#btn-overflow`, `#btn-copy-log` em ambas as páginas |
| F-019 | S2 | Alvos de toque pequenos | ✅ ≥44px em ponteiro grosso; ✕ do bottom-sheet 44px |
| H-d | S3 | PWA instalável "parece app" | ✅ Ícone de marca 192/512, maskable, screenshots, apple-touch |

Legenda: ✅ feito · 🟡 parcial · ⏳ pendente.

---

## Fundação de design tokens (3 camadas) — IMPLEMENTADA

Em `css/theme.css`: primitivos (existentes) → **semânticos** (`--bg`,
`--surface-1/2/3`, `--text-1/2/3`, `--border-1/2`, `--accent`/`--accent-hover`,
`--danger`/`--success`/`--warning`, `--focus-ring`) → componente (specs). Mais
`--radius-sm/md`, `--shadow-1/2/3`, `--z-*`, `--dur-*`/`--ease`, `--space-1..12`,
`--icon-size`, `--select-chevron` e `accent-color: var(--accent)` global.

Os semânticos são **aliases via `var()`** dos primitivos — como os 13 temas
sobrescrevem os primitivos, a camada semântica cascateia sem blocos por tema.

---

## Roadmap de polimento em 3 fases

### Fase 1 — De amador para sólido (fundação) — ✅ concluída (PR #49)
Tokens, ícones SVG, hierarquia de ação, estados vazios padronizados, separação
marca×perigo, e correção dos bugs visuais E8/E9/E10/E12/E3.
Critério de aceite: `node js/tests/runner.js` verde; CI verde.

### Fase 2 — De sólido para profissional (refinamento) — ✅ concluída (PR #50)
- ✅ Selects tematizados + matriz de estados de input/botão (loading/disabled/invalid).
- ✅ Componente de tooltip `[data-tooltip]` (F-008) — rollout incremental restante.
- ✅ Headers de página compactos (E13).
- ✅ Stepper do wizard + chips de traço (E14).
- ✅ Painéis ✕ → "Limpar" (E11); ✅ alvos de toque ≥44px (F-019).
- ✅ Densidade da aba Perícias (E15) — `density-compact`/`density-roomy` + transições tokenizadas.
- ✅ Onboarding/first-run: `#welcome-state` na aba Personagem quando banco vazio —
  "Criar investigador" e "Importar JSON" delegam para os botões do toolbar.
- ✅ Tokens de motion (`--dur-*`/`--ease`) em `home.css`, `investigator.css`,
  `keeper.css`, `theme.css` — sem valores literais de `0.2s`/`all X`.
- ✅ Rollout de `data-tooltip` concluído: swatches de tema, `#btn-overflow`, `#btn-copy-log`.
- ✅ Todas as transições `0.15s`/`0.25s ease` em `investigator.css` e `theme.css` migradas para `var(--dur-fast/base) var(--ease)`.

### Fase 3 — De profissional para referência (acabamento) — ✅ concluída (PR #50)
- ✅ PWA instalável: ícone de marca 192/512 (any+maskable), screenshots,
  apple-touch-icon. (Splash deriva de ícone+background_color.)
- ✅ Identidade: favicon/OG de marca; redesign do hero da home com screenshot (E3).
- ✅ Motion design intencional (tokens de duração/easing; reduced-motion já global).
- ✅ Densidade adaptativa (modo iniciante/veterano) — `body.density-roomy` em `theme.css`; opção "Espaçoso (iniciante)" em `settings.js`.
- ✅ Nomenclatura consistente (H-f) — shortcut manifest e feature card corrigidos.
- ✅ Faixa de vitais compacta no mobile (`#mobile-vitals-strip`): PV/SAN/PM sticky no topo
  do conteúdo em ≤767px, com mini-barra de progresso e alerta de nível crítico.
- ✅ **App-bar compacta** (`#inv-app-bar`, ≥768px): substitui o header estático quando um
  personagem está carregado — exibe nome (serif), ocupação+residência (mono, uppercase) e
  PV/SAN/PM em colunas bordadas + botão "Rolar teste" que abre a busca global. Resolve
  E9/E13 no desktop: 200px de header estático → 54px de HUD dinâmico.

---

## Ativos a proteger (não achatar no redesign)
Identidade 1920s; estratégia "dois mundos" (investigador × Guardião); wizard com
arquétipos + dificuldade em estrelas e dica contextual lateral; microcopy de tom
("Crie uma PESSOA antes dos números"); base de acessibilidade já presente
(`prefers-reduced-motion`, alto contraste, densidade); empty-states de
Encontro/Arsenal; chips de condição e a animação `roll-stamp-slam`.
