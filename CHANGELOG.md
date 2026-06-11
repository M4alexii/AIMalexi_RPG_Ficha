# CHANGELOG

Histórico resumido de mudanças relevantes do AIMalexi RPG Ficha.

Para detalhes históricos de arquitetura e fases antigas, consulte também
`Melhorias/DIRETRIZ_OFICIAL_V1.md`.

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
