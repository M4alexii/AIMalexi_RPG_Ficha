# CHANGELOG

Histórico resumido de mudanças relevantes do AIMalexi RPG Ficha.

Para detalhes históricos de arquitetura e fases antigas, consulte também
`Melhorias/DIRETRIZ_OFICIAL_V1.md`.

## 2026-06-23 - Fonte única de persistência/autoridade (C-01/C-02) + testes

Remedia achados críticos da auditoria de 2026-06-16 derivando da `event-ontology`
em vez de manter listas paralelas à mão (mesma técnica já usada por `RENDER_MAP`).

### Corrigido

- **C-01 (perda silenciosa de edições):** `PERSIST_ACTIONS` agora é **derivado** de
  `eventOntology.CATALOG` (`persists:true && status:'live'`) em
  `js/core/persist-middleware.js` (via `CoC.core.derivePersistActions`, montado no boot;
  lista estática vira fallback). Ações antes omitidas — `SET_ATTRIBUTE`, `SET_BODY_SLOT`,
  `SET_ARMOR`, `RELOAD_WEAPON`, `MARK_SKILL_IMPROVEMENT`, `TOGGLE_SKILL_FAVORITE`,
  `SKILL_IMPROVED`, `ADD_MYTHOS` — agora auto-persistem (não somem no reload).
- **C-02 (autoridade sagrada):** `js/core/actions.js` registra `ADD_MYTHOS`/`RECALC_DERIVED`
  em `TYPES`, inclui `ADD_MYTHOS` em `SACRED`, e `isSacred()` consulta a ontologia
  (fallback estático). `ADD_MYTHOS` passa a ser tratado como sagrado no multiplayer.

### Adicionado

- **Teste-guarda de consistência** em `js/tests/test-event-ontology.js`: trava
  `PERSIST_ACTIONS` × ontologia e `SACRED` × ontologia (com regressões C-01/C-02) — o teste
  que o cabeçalho prometia mas não existia.
- **`js/tests/test-storage-migrations.js`** (novo): cobre `storage.runMigrations` v0→v3
  (rename de perícias em ficha/criatura/armas/occupationSkills, colisão mantém maior,
  `creditRating`→"Nível de Crédito", rótulo Mythos, idempotência). `runner.js` passa a
  carregar `storage.js` (com stub temporário de ambiente browser) e a suíte.

### Manutenção

- Runner: **1144/1144** asserções. Sem mudança em `sw.js`/`PRECACHE_URLS` (só arquivos de
  teste, não servidos).

## 2026-06-18 - Auditoria UX/Design System: remediação F-001…F-016

Aplica os achados abertos/parciais do dossiê de auditoria de Produto/UX/UI/Design
System. Re-baselinado contra o código: itens já resolvidos não foram refeitos
(ex.: mini-md já renderiza headings/parágrafos; barra/chips do wizard já existiam;
bottom-nav mobile e o offset do FAB de rolagem já estavam corretos).

### Adicionado

- **Fundação de tokens** (`theme.css`): `--text-3` agora deriva por `color-mix` do
  texto secundário (piso de contraste WCAG AA ≥3:1 em qualquer tema · F-006);
  escala de elevação `--elev-flat/card/section/hero` reaproveitando as sombras
  existentes (F-012); alias `--font-typewriter → --font-mono` consolidando os
  papéis tipográficos (F-010 · as famílias opcionais do criador de temas seguem
  disponíveis).
- **Ícone `ico-alerta`** no sprite local (único símbolo novo necessário · F-002).
- **OG/Twitter + `description`** em `investigator.html` e `keeper.html`; `og:image`
  passou de SVG para PNG; `theme-color` sincroniza com o tema ativo via JS (F-011).
- **Perícias colapsáveis** (F-009): cada categoria é um accordion (estado em
  `localStorage`, não no Store); o botão de dado se revela no hover/foco e fica
  sempre visível com alvo ≥44px no toque; `hyphens:auto` evita corte no meio da
  palavra.
- **Wizard**: linha de progresso "Passo N de T · etapa" (F-008).
- **Home** (`index.html`): bloco "Primeira vez? Comece aqui" como porta de entrada
  do iniciante (liga F-005); a faixa redundante de ações rápidas saiu.
- **Tour guiado da ficha** (F-005): reaproveita `guided-tour.js` — dispara após a
  criação no assistente (auto-limitado por "já visto") e pode ser revisto em
  "Mais → Tour guiado".

### Alterado

- **Emojis de UI → sprite** em cabeçalhos de painel e botões (F-002): Criar
  Campanha, Pacote Padrão, Encontro, Timeline/Eventos, Log, Chat, Reativar, Copiar
  log, Fechar e Alertas (keeper/investigator + estados vazios em JS). Emojis de
  conteúdo do usuário e os ícones de condição/status (sistema iconográfico à parte)
  foram preservados.
- **Estilos inline → classes** na mobília de log/chat/rodapé (F-001): novas classes
  `.roll-log-title`, `.chat-title`, `.roll-log-actions`, `.roll-log-list` e
  `.app-footer` em `theme.css`.
- **Empty-states universais** (F-016): Inventário, Magias, Tomos e Chat passam a
  usar o componente padrão `CoC.ui.emptyState` (ícone + título + próximo passo).
- **Tracejados estruturais → sólidos** (F-004): divisórias de toolbar, abas,
  cabeçalhos e seções usam `1px solid var(--border-1)`; tracejado fica reservado a
  campos editáveis, drop-zones e placeholders.
- **Tooltips** (F-003): botões de toolbar migraram de `title=` para `data-tooltip`
  (tooltip estilizado em hover e foco).
- **Resumo vital dominante** (6B): tiles maiores, eixo de cor canônico
  (`--hp-*`/`--san-*`/`--mp-axis`) e barra temática por faixa (verde→vermelho;
  SAN no eixo frio). A moldura vazia já não renderiza sem investigador.
- **Constituição**: removido o `Math.random` de fallback do d100 inline da home
  (junto com a faixa de ações rápidas).

### Manutenção

- `sw.js`: `CACHE_VERSION` `v113 → v114` (sem novos arquivos; `guided-tour.js` já
  estava no `PRECACHE_URLS`).

---

## 2026-06-15 - Direção "Arquivo de Arkham": preset tipográfico + split quente/frio

### Adicionado

- **Preset de tipografia** (Configurações → Tipografia): alterna entre
  "Clássica (serif 1920s)" — padrão, preserva a identidade — e
  "Moderna (Inter na UI · mono nos dados)", que aplica Inter em toda a interface
  funcional, JetBrains Mono nos números e mantém serif só em títulos/lore.
  Implementado via `body.type-modern` remapeando apenas as famílias de fonte por
  token (nenhum componente muda); números ganham `tabular-nums` no modo moderno.
  Ambas as fontes já vinham no `@import` do tema.

### Corrigido

- **Semântica quente/frio da Sanidade**: a app-bar (`#inv-app-bar`) e a faixa de
  vitais mobile (`#mobile-vitals-strip`) coloriam SAN com latão (quente); agora
  usam o tom frio (`--mist`), consistente com o dashboard. Novo token semântico
  `--sanity: var(--mist)` cascateia para os 13 temas. PV segue sangue, PM musgo;
  vermelho permanece reservado a dano/exclusão.

---

## 2026-06-15 - Correções de regras CoC7e (#8, #12, #15)

### Corrigido

- **#8 — Armadura em `rollDamage`**: parâmetro `armor` opcional em
  `dice.rollDamage(weaponStr, db, impale, armor)`. Quando passado, `total`
  retorna `max(0, dano - armor)` e `totalBeforeArmor` preserva o dano bruto
  (útil para detecção de Ferimento Grave, que usa o dano bruto per CoC7e p.111).
  7 asserções de regressão adicionadas em `test-dice.js`.
- **#12 — `validateCharacter` por atributo**: bounds agora são per-atributo:
  TAM/INT/EDU usam mín 30 (2D6+6×5 com ajuste de idade conservador);
  EDU aceita até 99 (via verificações de melhoria); demais atributos usam mín 5
  (age adj. pode reduzir FOR/CON/DES/APA significativamente).
- **#15 — `rollMods.bp` null**: inicializado como `null` em vez de `""`,
  alinhando com o contrato documentado em `dice.rollD100` (`null | "bonus" | "penalty"`).

---

## 2026-06-15 - Migração tipográfica (E16)

### Corrigido

- **E16 — Mistura tipográfica**: 56 ocorrências de `font-size` com valores literais que
  tinham correspondência exata nos tokens (`0.72rem`→`var(--text-xs)`, `0.78rem`→
  `var(--text-sm)`, `1.1rem`→`var(--text-md)`, `1.25rem`→`var(--text-lg)`,
  `1.5rem`→`var(--text-xl)`) convertidas em `investigator.css`, `keeper.css` e `home.css`.
- `14px`/`16px` em `.sheet-card label`/inputs convertidos para `0.875rem`/`var(--text-base)`
  — agora escalam com a configuração de escala de fonte do usuário.

---

## 2026-06-15 - Tooltips, density skills e motion tokens

### Adicionado / corrigido

- **Tooltip rollout completo (F-008)**: `data-tooltip` + `aria-label` nos últimos botões
  só-ícone: 13 swatches de tema (substituem `title`), `#btn-overflow` e `#btn-copy-log`
  em `investigator.html` e `keeper.html` — tooltips visíveis no teclado e touch.
- **Motion tokens em investigator.css**: todas as 20+ ocorrências de `0.15s` e
  `0.25s ease` hardcoded convertidas para `var(--dur-fast) var(--ease)` e
  `var(--dur-base) var(--ease)`; `transition: all` em `.condition-chip` expandido
  para propriedades explícitas.
- **E15 concluído**: `density-compact` (0.25rem top/bottom) e `density-roomy` (0.55rem)
  cobrem a grade de perícias; combinado com `word-break` e ícone SVG.

---

## 2026-06-15 - Densidade adaptativa + auditoria de temas

### Adicionado

- **Modo Espaçoso (iniciante)**: nova opção `density-roomy` em Configurações → Densidade.
  Aumenta `--gap-lg` para 1.6rem, padding de seção para 1.2rem 1.4rem, altura mínima de
  inputs para 48px e padding de cards/skills/armas para 0.55rem — facilita uso em touch
  e reduz densidade cognitiva para novos jogadores.
- **Auditoria de cascade semântica**: verificado que os temas `arquivo` (claro),
  `obsidian` (aço frio) e `cosmic` (verde eldritch) cascateiam corretamente todos os
  tokens semânticos via `var()` sem necessidade de overrides adicionais.

---

## 2026-06-15 - Polimento de design · conclusão Fases 2 e 3

### Adicionado

- **Welcome state (first-run)**: quando nenhum personagem está carregado na Ficha do
  Investigador, a aba Personagem exibe um painel central com "Criar investigador" e
  "Importar JSON", eliminando a tela vazia confusa.
- **Home: hero com copy forte** — headline "Sua mesa de Chamado de Cthulhu, completa e
  offline." com ênfase dourada/itálica; CTA secundário "Sou o Guardião" (→ keeper.html);
  trust line "100% offline · Exporta PDF · $0 · Open source"; legenda da screenshot.
- **App-bar (`#inv-app-bar`, desktop ≥768px)**: sticky 54px mostrando nome, ocupação+local
  e PV/SAN/PM com alerta de nível crítico; "Rolar teste" abre busca global. Header estático
  oculta quando personagem está carregado.
- **Faixa de vitais mobile** (`#mobile-vitals-strip`, ≤767px): PV/SAN/PM sticky no topo do
  conteúdo com mini-barra e pulso de alerta ≤25%.
- **Motion design**: todas as transições em `home.css`, `investigator.css`, `keeper.css` e
  `theme.css` migradas para `--dur-fast/base/slow` + `--ease` (sem valores literais).

---

## 2026-06-15 - Polimento de design · Fase 3 (mobile vitals strip)

### Adicionado

- **Faixa de vitais no mobile** (`#mobile-vitals-strip`): barra sticky compacta com PV,
  SAN e PM (valor atual/máximo + mini-barra de progresso colorida) visível somente em
  ≤767px no topo do painel de conteúdo. Pulsa em vermelho/âmbar quando o nível ≤ 25%.
  Atualiza em tempo real junto com o dashboard executivo. Resolve a falta de vitais
  visíveis ao rolar o conteúdo de Perícias/Combate/Inventário no mobile.

---

## 2026-06-15 - Polimento de design · Fase 1 (fundação) + início da Fase 2

Implementa o roadmap da auditoria de produto/UX/UI/Design System
(`Melhorias/AUDITORIA_DESIGN_V2.md`). Sem rewrite; identidade temática 1920s
preservada.

### Adicionado

- **Fundação de tokens em 3 camadas** (`css/theme.css`): camada semântica
  (`--bg`, `--surface-1/2/3`, `--text-1/2/3`, `--border-1/2`, `--danger`,
  `--success`, `--warning`, `--focus-ring`, raios, sombras, z-index,
  durações/easing, escala 8pt `--space-*`) como aliases dos primitivos —
  cascateia automaticamente para os 13 temas.
- **Sistema de ícones SVG** local (`assets/icons/sprite.svg`, ~33 ícones) +
  favicon de marca (`assets/icons/favicon.svg`); helpers `CoC.ui.icon/iconHTML`.
  Emojis funcionais substituídos nas toolbars, abas e feature cards.
- **Estados vazios padronizados**: `CoC.ui.emptyState` + `.empty-state`.
- **Componentes (Fase 2)**: `<select>` tematizado (chevron próprio), estados de
  input (disabled/aria-invalid), botão `aria-busy` (loading); `accent-color`
  global nos controles nativos.
- **Home**: Open Graph/Twitter meta para compartilhamento.

### Corrigido

- **E2**: `.btn-export` deixa de ser ação primária permanente (verde + glow).
- **E7**: separa a marca do Guardião (`--keeper-accent` oxblood) do vermelho de
  perigo (`--danger`); HP crítico e excluir usam `--danger`.
- **E3**: grid de recursos da home vira 2×2 (sem card órfão).
- **E8**: sem overflow horizontal no theme-picker e na lista do bestiário.
- **E9/E12**: molduras vazias do dashboard do investigador e do Resumo da
  Campanha não aparecem sem dados.
- **E10**: preview de Notas Avançadas renderiza Markdown de verdade (miniMD).
- **i18n**: tipo de ataque de NPC exibido em pt-BR ("Corpo a corpo"/"À
  distância"); E5/E6 da auditoria não se confirmaram no código.

## 2026-06-11 - Fase RK-2: combate e timeline do Guardião

### Adicionado (diretriz §8, etapa RK-2)

- **Iniciativa no Encontro**: botão **⚡ Iniciativa** ordena o tracker em
  ordem de DES decrescente (CoC 7e), mortos no fim; chip ⚡ DES em cada
  criatura (capturado do bestiário ao adicionar).
- **Munição no Encontro**: botão 🔫 define a munição inicial e gasta 1 por
  clique; chip mostra o restante e avisa **"vazio"** ao zerar (re-clique
  redefine). Valor vazio remove o controle.
- **Ferimento Grave visível**: dano único ≥ metade do PV máximo marca o chip
  **🩸 Fer. Grave** na criatura (antes era só um toast passageiro).
- **Timeline manual**: campo "✍️ + Evento" na aba Timeline — o Guardião anota
  eventos narrativos na linha do tempo **mesmo sem campanha ativa** (Enter
  também envia).
- **Avatar nas cartas dos investigadores**: círculo com iniciais no roster da
  campanha (retrato leve, sem tráfego de imagem).
- **Ambiente visual no Guardião**: `ambient-fx.js` agora carrega no
  keeper.html — chuva/névoa/poeira/VHS/filme funcionam via ⚙️ Configurações.

### Corrigido

- **Ferimento Grave com PV ímpar**: o teste usava `floor(PV máx / 2)` e
  marcava ferimento com 1 ponto a menos que a regra (ex.: 5 de dano com
  PV 11); agora compara com a metade exata (≥ 5.5 ⇒ 6+).
- SW: `CACHE_VERSION` v91.

## 2026-06-11 - Personalização visual (itens 8–13) + correções críticas

### Corrigido

- **Abas/drawer sumiam com SAN baixa**: o `filter`/`animation` dos efeitos
  de insanidade em `.app` virava containing block e soltava a barra de abas,
  o drawer ☰ e os backdrops (`position:fixed`) da viewport a partir de
  SAN <50%. A graduação de cor agora vive na camada `.sfx-tone` do overlay
  (`backdrop-filter`) e o tremor em `.app-shell`.
- **Checkboxes desalinhados** na Central de Configurações (o reset global de
  `input` aplicava `width:100%` + padding a checkbox/radio).
- **Identificação nas rolagens da campanha**: timeline do Guardião e chat
  agora mostram **"Personagem (Jogador)"** em vez de só um dos nomes.

### Adicionado (spec `Melhorias/PERSONALIZACAO_E_MODOS_V1.md`, itens 8–13)

- **Temas extras**: Noir (P&B), Hospital Psiquiátrico (claro) e Agência
  Federal (cinza/azul) — total de 13 presets + custom.
- **Fundo com textura + opacidade** (⚙️ → 🎨 Aparência): papel, couro,
  madeira, nebulosa e arquivo policial, intensidade 0–100% com teto real de
  opacidade 0.35 (legibilidade blindada). 100% CSS/SVG inline, offline.
- **Estilo dos cards**: Arcano (cantoneiras atuais — padrão), Moderno,
  Arquivo e Máquina de escrever; **bordas** Nenhuma/Simples/Vintage/Runas/
  Art Déco via border-image SVG com fallback sólido.
- **Sistema visual de anotações**: Caderno/Dossiê/Diário/Máquina aplicado ao
  Diário de Campanha (pele puramente visual).
- **Molduras de avatar** por personagem (Investigador/Ocultista/Militar/
  Acadêmico) + formas token redondo e silhueta (`_meta.avatarFrame/Shape`,
  normalizado no schema; botão 🖼️ sob o retrato).
- **Som ambiente visual** (sem áudio): chuva, névoa, poeira, VHS e filme
  antigo em overlay próprio (`js/shared/ambient-fx.js`), desligado por
  padrão e subordinado ao sanity-fx; respeita reduce-motion.
- SW: `CACHE_VERSION` v90; `ambient-fx.js` no precache.

## 2026-06-11 - Modo Imersão (🕯️)

### Adicionado

- **Modo Imersão** na toolbar (🕯️): silencia o aparato mecânico para
  sessões de interpretação — frações ½⅕, orçamentos de pontos, stats
  secundários (MOV/DB/Build/Mythos), marcadores de evolução e metas de
  seção somem; vitais viram barras com números discretos; o log de
  rolagem esmaece (volta no hover); diário e identidade ganham respiro.
  Tudo CSS (`body.immersion`) — nada é perdido. Estado em sessionStorage.
  Item nº 7 (último do ciclo) do roadmap de
  `Melhorias/PERSONALIZACAO_E_MODOS_V1.md`.

## 2026-06-11 - Modo de sessão (🎬 cena: investigação/combate)

### Adicionado

- **Modo de sessão** na toolbar: o botão 🎬 alterna neutro → 🔎 Investigação
  → ⚔️ Combate. Ao ativar, a ficha navega para a aba da cena e as perícias
  relevantes sobem dentro de cada grupo (abaixo das favoritas ★):
  investigação prioriza Encontrar/Escutar/Usar Bibliotecas/Psicologia/
  Ocultismo/…; combate prioriza Esquivar/Lutar/Armas de Fogo/Primeiros
  Socorros/…. Estado de cena vive em `sessionStorage` (não é dado de
  ficha — conforme a regra de camadas de estado). Item nº 6 do roadmap
  de `Melhorias/PERSONALIZACAO_E_MODOS_V1.md`.

## 2026-06-11 - Favoritos de perícias (★)

### Adicionado

- **Favoritar perícias**: estrela ☆/★ em cada linha de perícia (catálogo e
  específicas). Favoritas sobem para o topo do grupo e ganham o filtro
  "★ Favoritas" ao lado de Todas/Ocupação/Com pontos. Persistido na ficha
  (`skills[nome].fav`) via nova ação `TOGGLE_SKILL_FAVORITE` (registrada
  na ontologia de eventos). Item nº 4 do roadmap de
  `Melhorias/PERSONALIZACAO_E_MODOS_V1.md`.

## 2026-06-11 - Histórico narrativo de Sanidade

### Adicionado

- **Perda de SAN com motivo**: o botão −X do card de SAN abre um modal
  único com quantidade (aceita 1D6/1D10…) e motivo opcional ("Ao ver o
  ritual de invocação") — sem passo extra para quem não quer narrar.
- **Timeline de Sanidade** (botão ≡ no card de SAN): histórico persistido
  de perdas e recuperações com motivo e horário ("−5 · Ao ver o ritual ·
  11/06 09:12"). Guardado em `status.sanHistory` (cap 50), sobrevive a
  reload e viaja com o export JSON.
  Item nº 3 do roadmap de `Melhorias/PERSONALIZACAO_E_MODOS_V1.md`.

## 2026-06-11 - Busca global Ctrl+K

### Adicionado

- **Busca global da ficha** (`js/shared/global-search.js`): Ctrl+K/Cmd+K
  ou botão 🔍 na toolbar. Pesquisa perícias (catálogo + valores do
  personagem), atributos, armas, inventário, magias, grimórios, diário e
  abas — ignorando acentos ("revolver" acha "Revólver"). Selecionar uma
  perícia navega até a aba e aplica o filtro; demais resultados navegam
  para a aba correspondente. ↑↓ navegam, Enter abre, Esc fecha. No Modo
  Jogador, os resultados de seções ocultas não aparecem.
  Item nº 2 do roadmap de `Melhorias/PERSONALIZACAO_E_MODOS_V1.md`.

## 2026-06-11 - Modo Jogador (progressive disclosure)

### Adicionado

- **Modo da ficha** em ⚙️ Configurações: **Investigador** (ficha completa,
  padrão) ou **Jogador** (tela limpa p/ iniciantes). O Modo Jogador esconde
  as seções avançadas — Magias e Rituais, Grimórios, Diário, Log, Finanças
  e Slots de Corpo — sem perder dado algum (alternar de volta restaura).
  Se a aba ativa ficar oculta, volta para Personagem automaticamente.
  Persistido por dispositivo (`uiMode` em `aimalexi-rpg/settings`).
  Item nº 1 do roadmap de `Melhorias/PERSONALIZACAO_E_MODOS_V1.md`.

## 2026-06-11 - Regras: armadura absorve dano (QA-001) + loucura automática/interativa (QA-003)

### Corrigido

- **P0 — Armadura não subtraía dano** (`APPLY_DAMAGE`): a absorção agora
  acontece no reducer (`js/core/store.js`), valendo para TODOS os caminhos —
  inclusive dano remoto do Guardião via campanha. `payload.ignoreArmor`
  preserva ajustes manuais (±1) com dano integral. Os guards da
  state-machine (Major Wound, Inconsciente, Morrendo, Morte) avaliam o
  dano LÍQUIDO (CoC 7e p.109-112), com `armor` exposto no contexto.
- **P1 — Loucura indefinida por 1/5 no dia agora é automática** (RAW p.162):
  a regra aplica `ADD_STATUS{indefInsane}` direto, com aviso ao jogador.
- **P1 — Loucura temporária ganhou fluxo interativo** (RAW p.161): perda de
  5+ SAN de uma vez abre o cheque de INT (🎲 no modal); sucesso =
  compreendeu o horror → status `tempInsane` aplicado; falha = reprimiu.
  Disparado pela state-machine via novo campo `transitions` no evento
  `executor:action` (labels das regras), então funciona também quando a
  perda vem do Guardião.
- +9 asserções novas (armadura no reducer e nos guards; indef automática;
  `armor` no buildContext). Suíte: 1084/1084.

## 2026-06-11 - Estrutura AIMalexi vira o padrão + camada funcional de personalização

### Mudado

- **Paleta padrão do site inteiro** agora é a "Estrutura AIMalexi" (arquivo
  antigo de investigador): fundo `#1B1A17`, cards `#26231F`, ação verde-oliva
  `#556B2F`, alerta `#C69C4D`, sucesso/falha dessaturados (`#4F7A4F`/`#8A3B3B`).
  Aplica a portal, guia, compêndio e keeper (que não têm seletor de tema).
  O dourado original vive no novo tema **Clássico**.
- Novo token `--on-accent` (texto sobre a cor de ação) — claro sobre oliva,
  escuro sobre o dourado do Clássico; aplicado a `.btn-primary`, `.btn-export`,
  CTA do portal e fluxograma do guia.
- `--ink-faded` recalibrado p/ texto terciário ≥3:1; bordas puras da spec em
  `--line: #3D3831`. Textos que usavam `--brass` elevados a `--brass-bright`
  (96 substituições nos 6 CSS).

### Adicionado

- **Fontes da camada funcional** no editor 🎨, separadas em **Leitura**
  (Crimson, Inter, Atkinson Hyperlegible, Courier, máquina de escrever,
  sistema) e **Títulos** (Cormorant, Libre Baskerville, Cinzel, IM Fell).
- **Densidade "Normal"** (3 níveis: Confortável/Normal/Compacta) em ⚙️.
- **SAN com 4 estados**: verde → âmbar (instável) → vermelho (crítica) →
  **roxo (insano)** na barra, via `body[data-sanity]`.
- Lista de temas do ⚙️ sincronizada com os 9 presets.
- `Melhorias/PERSONALIZACAO_E_MODOS_V1.md`: spec consolidada das duas
  propostas do proprietário (camadas de personalização + modos
  Jogador/Investigador/Keeper) com status e prioridades.
- Varreduras de contraste pós-mudança: **0 elementos <3:1 nas 5 páginas**
  (incluindo botões antes não-mensuráveis por gradiente).

## 2026-06-11 - Sidebar do investigador volta ao modelo escuro (parchment segue o tema)

### Corrigido

- **Área do retrato/atributos bege em temas escuros** (feedback do usuário):
  as variáveis do "parchment world" (`--parchment`/`--ink-doc`…) eram fixas
  em bege independente do tema. Agora são *aliases* do tema ativo — em temas
  escuros a sidebar é escura (modelo clássico da ficha); o papel bege real
  só existe no tema claro **Arquivo**. Consequência: o editor de tema custom
  (🎨) e todos os presets agora controlam também a sidebar/dossiês.
- `.sidebar-name`: sombra branca difusa (assumia papel claro) trocada por
  sombra de recorte escura.
- Varreduras de regressão: 0 elementos <2.5:1 no tema escuro e <3:1 no claro.

## 2026-06-10 - Novos temas (claro/escuro), tema custom do jogador e SAN com cor de estado

### Adicionado

- **4 temas novos** (`css/theme.css`, paletas dessaturadas p/ sessões longas):
  - **Dossiê** — arquivo de investigador (neutros quentes, verde-oliva,
    dourado de alerta) — a estrutura recomendada do AIMalexi;
  - **Lovecraft** — biblioteca antiga (bronze envelhecido, verde antigo);
  - **Cosmic** — horror cósmico (verde eldritch, turquesa sombrio);
  - **Arquivo** — **primeiro tema CLARO** (papel #F4EFD8, tinta #2A2522,
    marrom/vermelho escuros) — documento investigativo p/ leitura de 4-6h.
- **Tema personalizado do jogador** (`js/shared/theme-custom.js`): editor
  visual (🎨 no seletor de temas) com 5 cores (fundo, cards, texto, texto
  secundário, destaque) + 5 fontes, preview ao vivo, tons intermediários
  derivados automaticamente (claro/escuro detectado por luminância).
  Paleta salva como preferência do dispositivo; escolha do tema continua
  em `character._meta.theme`.
- **Barra de SAN com cor de estado** ("Sanidade em Colapso"): verde-sálvia
  (normal) → âmbar (abalada) → vermelho (em colapso), dirigida pelo
  `body[data-sanity]` que o sanity-fx já mantém.
- Variáveis tema-conscientes `--title-ink`/`--num-ink`/`--num-accent`
  substituem cores fixas de títulos e números (necessário p/ tema claro).
- Varredura de contraste no tema claro: 0 elementos <3:1 nas 5 abas
  (`--ink-faded` e botão de gasto ajustados).

## 2026-06-10 - Efeitos de insanidade ativos por padrão + contraste no site inteiro + Notas no mobile

### Corrigido

- **Efeitos visuais de insanidade nunca disparavam**: `resolveInitialMode()`
  em `js/shared/sanity-fx.js` retornava `"off"` por padrão (contradizendo a
  documentação do módulo, que prometia COMPLETO). Agora o padrão é `full`
  (auto-reduzido para `reduced` se o SO sinaliza `prefers-reduced-motion`);
  quem já escolheu um modo em "🧠 Efeitos" mantém a preferência.
  Validado: SAN 50→10 aplica `body[data-sanity="fraying"]` (vinheta, grão,
  aberração cromática).
- **Notas Avançadas inutilizáveis no celular**: o split-pane lista|editor era
  um grid inline `280px 1fr` em `keeper.html` — numa tela de 375px o editor
  ficava com ~60px (texto quebrando letra a letra). Movido para
  `css/keeper.css` com breakpoint ≤900px que empilha lista (máx. 45vh) e
  editor em coluna única.
- **Contraste no site inteiro** (varredura automatizada em index, keeper,
  compendium e guia): 7 textos com `--ink-faded`/`--blood` sobre fundo escuro
  abaixo de 3:1 — `.sheet-title`/`.cs-hint`/`.cs-divider` (keeper),
  `.arc-derived` (compêndio), `.callout.danger .callout-title` e
  `.section-time` (guia). Todos elevados para `--ink-dim` ou tom claro.
  Pós-fix: 0 elementos abaixo de 3:1 nas 4 páginas + 6 abas do investigador.

## 2026-06-10 - Títulos e estatísticas derivadas legíveis + destaque nítido nos números

### Corrigido

- **Títulos de seção invisíveis em todas as abas** ("Identidade", "Perícias",
  "Estatísticas Derivadas"…): `.app-shell .section-title` usava `--ink-doc`
  (tinta de papel) sobre o fundo escuro de `.section` — contraste 1.3:1.
  Agora `--candle-bright` com sombra de recorte nítida.
- **Valores das Estatísticas Derivadas invisíveis** (aba Combate): PV/PM/SAN/
  Movimento/Bônus de Dano/Corpo/Armadura em `.derived-card` usavam tinta de
  documento sobre card escuro. Agora creme claro com sombra nítida.
- **Botão "Editar Investigador" ilegível**: brass claro sobre parchment claro
  (1.57:1). Agora tinta de documento, com hover âmbar translúcido.

### Melhorado

- **Destaque nítido em números e títulos**: text-shadows tipo "glow" difuso
  (que davam aparência desfocada/apagada) substituídos por sombras de recorte
  (`0 1px 2px`) e cores mais brilhantes (`--candle-bright`, `#f5ecd8`) em
  atributos, vitais, estatísticas derivadas e títulos de seção.
- Varredura automatizada de contraste (Puppeteer, 6 abas, 375px): 0 elementos
  abaixo de 2.5:1 após as correções.
- `CACHE_VERSION` v80 → v81.

## 2026-06-10 - Correção de visibilidade dos atributos no mobile + dark mode do SO

### Corrigido

- **Valores de atributo invisíveis na sidebar** (mobile ≤767px e desktop
  ≥901px): `.sattr-value` usava tinta de documento (`--ink-doc`, quase preta)
  sobre o fundo escuro `--bg-card-hi` dos cards compactos — texto ilegível.
  Agora usa `--brass-bright` nesses contextos (`css/investigator.css`).
- **Dark mode do sistema operacional recolorindo o tema**: nenhuma página
  declarava `color-scheme`, então o "Force Dark Mode" do Chrome/Android
  aplicava inversões parciais sobre o tema próprio. Adicionado
  `color-scheme: dark` em `:root` (`css/theme.css`) e
  `<meta name="color-scheme" content="dark">` nas 5 páginas HTML.
- `CACHE_VERSION` do service worker: v79 → v80 (entrega das correções de CSS
  a clientes com cache antigo).

### Documentação

- `Melhorias/AUDITORIA_QA_CAMPANHA_V1.md`: auditoria QA completa simulando
  campanha real de CoC 7e (score 70/100, 29 problemas QA-001–QA-029).
- `Melhorias/ROADMAP_UX_UI_VISUAL_V1.md`: roadmap de validação visual UX/UI
  (85 itens em 7 eixos: contraste, tipografia, responsividade, interações,
  formulários, renderização e cross-browser).

## 2026-06-10 - Notas Avançadas do Guardião: lixeira, busca com operadores, pastas, timeline e versionamento

### Adicionado

- **Aba "📝 Notas Avançadas" no Guardião** (`js/keeper-notes-advanced.js` +
  `js/keeper-notes-ui.js`): sistema de notas estilo Obsidian com editor
  split-pane (lista → editor + preview + backlinks), wikilinks `[[Título]]`
  com autocomplete ao digitar `[[`, backlinks automáticos, tags com tag-cloud
  clicável, 5 modelos prontos (PNJ, Local, Encontro, Mistério, Sessão),
  acesso rápido às 3 últimas notas e atalhos (Ctrl+K busca, Ctrl+N nova).
- **Lixeira com retenção de 30 dias** (soft delete): remover uma nota a manda
  para a lixeira (view 🗑️); pode ser restaurada ou apagada de vez. Notas
  expiradas (>30 dias) são purgadas automaticamente ao abrir o painel.
- **Busca com operadores**: `tag:pista`, `folder:ato1`,
  `created:>2026-01-01`, `updated:<7d` (janelas relativas d/w/m/y),
  `"frase exata"` e `-termo` (exclusão), combináveis com AND implícito.
- **Modos de visualização da lista**: Lista, Pastas (agrupa por `folder`,
  com `/` para subpastas), Timeline (agrupa por data de edição) e Lixeira.
- **Versionamento de notas**: cada edição de conteúdo guarda um snapshot
  (máx. 10); botão "🕐 Histórico" permite ver e restaurar versões anteriores
  (a versão atual vira snapshot ao restaurar).
- **Export/Import**: exporta nota atual ou todas em Markdown, backup completo
  em JSON e importa arquivos `.md` (títulos `#`/`##` viram notas).
- **Campos customizados por nota** (chave=valor, ex.: PV, SAN, Região):
  seção "Campos" no editor com adicionar/remover; operador de busca
  `campo:chave=valor` (alias `field:`); incluídos como tabela no export
  Markdown; modelos já vêm com campos típicos (PNJ → PV/SAN/Ocupação).
- **Guia do usuário** das Notas Avançadas: `docs/GUIA_NOTAS_AVANCADAS.md`.
- **Suíte de testes nova** (`js/tests/test-keeper-notes.js`, 75 assertions):
  CRUD, wikilinks/backlinks, operadores de busca, campos customizados,
  lixeira e versionamento.

### Corrigido

- **Persistência das notas avançadas**: o módulo gravava via API inexistente
  (`storage.setCustomData`) e falhava em silêncio — nada era salvo. Agora
  persiste em localStorage (`aimalexi-rpg/keeper-notes-v1`), mesmo padrão do
  diário do Guardião.
- **Colisão de namespace** `window.CoC.keeperNotes`: o módulo legado de Lore
  (`js/keeper-notes.js`) sobrescrevia a API do sistema avançado por carregar
  depois; renomeado para `window.CoC.keeperLore`.
- **IDs de nota via `crypto`** em vez de `Math.random` (constraint do
  projeto).
- `sw.js`: precache de `keeper-notes-advanced.js` e `keeper-notes-ui.js`
  (faltavam — quebraria offline); `CACHE_VERSION` v78 → v79.

## 2026-06-10 - Loop de combate do Guardião e endurecimento do PWA

### Adicionado

- **Loop de combate fechado no Guardião** (`rollAttack` em `js/keeper.js`):
  após um acerto, o dano é aplicado automaticamente ao PV da criatura no
  tracker de encontro (match por `sourceId`). A **armadura absorve** dano
  (`líquido = max(0, dano − armadura)`, com toast informativo), **Ferimento
  Grave** é detectado quando o dano bruto ≥ metade do PV máximo (toast de
  aviso) e a criatura é marcada como morta automaticamente ao chegar a 0 PV.
  Antes, o ataque só logava o roll e o Guardião aplicava tudo à mão.
- **Detecção de múltiplas abas** (`js/shared/multi-tab-warning.js`): em modo
  local, abas duplicadas do investigador/guardião dessincronizam o store em
  memória — agora um aviso é exibido via BroadcastChannel.

### Alterado

- **Ícone PWA real**: `manifest.json` deixou o emoji data-URI e passou a usar
  `assets/icon-512.png` (512×512, `purpose` any + maskable) — instalação como
  app passa a ter ícone válido em todas as plataformas.
- **Content-Security-Policy** via `<meta>` nas 5 páginas HTML: `default-src
  'self'`, imagens/mídia locais + `blob:`/`data:`, scripts locais +
  `cdn.jsdelivr.net` (SDK Supabase interino), `object-src 'none'`,
  `frame-ancestors 'none'`. `'unsafe-inline'` permanece necessário pelos
  scripts inline de registro do SW.
- `sw.js`: precache de `multi-tab-warning.js`; `CACHE_VERSION` v77 → v78.

## 2026-06-10 - UX Grimório: tutorial do Guardião, diário Obsidian e UI game-style

### Adicionado

- **Tutorial guiado do Guardião** (paridade de onboarding com o wizard do
  Investigador): tour com spotlight em 10 passos cobrindo as 7 mesas de
  trabalho, dashboard, encontro e diário. Roda uma vez na primeira visita;
  botão "❓ Tour" na toolbar para rever. Componente reutilizável em
  `js/shared/guided-tour.js` (Esc pula, ←/→ navegam, respeita
  `prefers-reduced-motion`, persistido em prefs).
- **Diário estilo Obsidian**: conteúdo dos tópicos agora renderiza
  **Markdown seguro** (títulos, negrito/itálico, listas, checklists `- [ ]`,
  citações, código, réguas) via novo `js/shared/mini-md.js` — escape SEMPRE
  antes do markup, à prova de XSS e coberto por 28 asserções de teste
  (`js/tests/test-minimd.js`). **Backlinks**: cada tópico mostra "↩ Mencionado
  em" com links navegáveis. **Busca global** (`#journal-search`) por título,
  conteúdo e pasta, debounced.

### Alterado

- **Camada visual "Grimório"** (inspiração Baldur's Gate 3/WoW sobre a
  identidade Cthulhu): painéis com cantoneiras de latão e relevo, botões
  cinzelados com letterpress, foco de inputs com anel de latão (`theme.css`).
- **Vitais do Investigador como barras de jogo**: PV/PM/SAN com gradiente
  vítreo, glow por recurso e **pulso de alerta quando ≤25%** (classe `.low`
  aplicada por `vitals.js`); cards de derivados com "vidro de poção".
- **Refresh do Guardião** (estava visualmente atrás): abas com cara de jogo
  (serif, painel ativo com brilho de sangue), biblioteca com hover de
  inventário, cabeçalho de criatura como placa de boss, KPIs como placas
  gravadas, pastas do diário como fichário.
- `sw.js`: precache dos 3 arquivos novos; `CACHE_VERSION` v76 → v77.

## 2026-06-10 - Auditoria residual: empala, XSS no log, validação de ficha, boot IDB

### Corrigido

- **Empala fiel ao PDF (Cap. 6, p. 104)** em `dice.rollDamage`: dano máximo de
  arma+DB **mais uma rolagem extra da arma** (sem DB). A versão anterior parava
  no máximo. Constantes agora calculadas por diferença exata em vez de regex —
  cobre DB plano (`-2`) e dados multi-dígito (`+10D6`). Validado contra o
  exemplo do livro (1D4 + DB 1D4 → faixa 9–12).
- **XSS no roll log** (`ui-components.appendRoll`): `target`, `d100` e `level`
  agora passam por `escapeHtml` como os demais campos. Relevante porque nomes
  de arma/criatura são controláveis pelo usuário — e em campanha, por outros
  participantes.
- **`validateCharacter` agora valida fichas de verdade**: só aceitava skills
  em array (criaturas); a ficha usa objeto `{ "Nome": { value } }`, então o
  check de cap (75/90) silenciosamente não rodava mesmo após o BUG-01 wiring.
  Aceita as duas formas; Nível de Crédito tem teto próprio (99); atributos
  zerados (não rolados) não geram ruído de aviso.

### Alterado

- **Boot do IndexedDB em paralelo** (`storage.loadAllFromIDB`): `Promise.all`
  no lugar de `await` sequencial por chave (era 1 round-trip por entrada).
- `sw.js`: `CACHE_VERSION` v75 → v76.

### Adicionado

- Testes de regressão: empala (4 cenários de faixa exata) em `test-dice.js` e
  `validateCharacter` (formas objeto/array, Crédito, zeros, null) em
  `test-rules.js` — suíte em 971 asserções.
- Job `integrity` no CI: `node --check` em todos os .js, manifest válido,
  `PRECACHE_URLS` do SW e referências locais dos HTML apontando para arquivos
  existentes (anti-regressão do bug do banner, cc75117).
- `Melhorias/AUDITORIA_RESIDUAL_2026-06-10.md` com o registro do que foi
  verificado, corrigido e do que permanece em aberto.

## 2026-06-07 - Auditoria clean code, testes e PWA

### Adicionado

- `docs/AUDITORIA_CLEAN_CODE.md` com nota de arquitetura, pontos fortes,
  riscos, gargalos, bugs corrigidos e plano recomendado.

### Alterado

- README revisado com acentos, links úteis, tom temático e status atualizado da
  auditoria.
- `docs/ROADMAP.md`, `AGENTS.md` e `CLAUDE.md` alinhados ao estado atual dos
  testes e do service worker.
- `manifest.json` deixou de prometer offline completo e agora descreve suporte
  offline parcial.
- `sw.js` passou a cachear `manifest.json`, `js/core/replay-consumer.js` e
  `js/core/session-export.js`; `CACHE_VERSION` foi atualizado para `v51`.

### Corrigido

- Suíte Node voltou a passar: `889/889`.
- Proveniência de perícias agora possui fallback seguro para bases essenciais
  quando `data/skills.js` não está carregado no runner Node.
- Ontologia de eventos foi alinhada ao estado real das ações `SET_ATTRIBUTE`,
  `ROLL_SKILL` e `PUSH_ROLL`.
- View de atributos deixou de escrever direto no store para ações de atributo,
  usando o executor como caminho principal.
- KPIs do dashboard do Guardião agora calculam médias de HP/SAN e contagem de
  investigadores vivos com regras mais explícitas.

### Observado

- Links locais principais entre HTMLs e assets foram auditados sem quebra.
- O PWA segue parcial porque o SDK Supabase ainda é carregado por CDN em fluxos
  de multiplayer.
- Não houve remoção de dead code nesta etapa; itens duvidosos foram
  documentados para refatoração futura.

## 2026-06-07 - Documentação de estado real

### Adicionado

- `docs/ROADMAP.md` com prioridades realistas e estado operacional do projeto.
- `AGENTS.md` com instruções para futuros agentes de IA.
- `CHANGELOG.md` inicial.
- Prints e GIF de preview em `assets/screenshots/`.

### Alterado

- `README.md` reescrito para refletir o estado real do projeto.
- README agora separa funcionalidades prontas, em desenvolvimento, planejadas e
  limitações conhecidas.
- README documenta execução local, GitHub Pages, estrutura de pastas,
  backup/exportação/importação, PWA/offline parcial, contribuição e aviso legal.
- README agora inclui uma seção `Preview` com tour visual das telas principais.

### Observado

- Links locais principais entre HTMLs e assets foram auditados sem quebra
  aparente.
- A suíte `node js/tests/runner.js` falhava antes das mudanças de documentação:
  `873/889 passed`, com 16 falhas preexistentes em proveniência de perícias,
  ontologia/arquitetura e KPIs do dashboard.

### Não alterado

- Nenhuma regra de jogo, cálculo, dado mecânico ou comportamento de ficha foi
  alterado nesta etapa.
