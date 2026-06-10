# CHANGELOG

Histórico resumido de mudanças relevantes do AIMalexi RPG Ficha.

Para detalhes históricos de arquitetura e fases antigas, consulte também
`Melhorias/DIRETRIZ_OFICIAL_V1.md`.

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
