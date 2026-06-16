# Auditoria Técnica Completa — AIMalexi RPG (CoC 7e)

> **Data:** 2026-06-16 · **Escopo:** projeto inteiro (~28k linhas JS + HTML/CSS/SW) ·
> **Foco:** Bugs/Lógica e Performance · **Tipo:** auditoria forense somente-leitura
> (nenhuma alteração de código aplicada).
>
> Conduzida por varredura sistemática (engine/data, núcleo reativo, multiplayer, views,
> orquestradores/shared, HTML/SW/CSS). **Cada achado de alta severidade foi verificado
> contra o código-fonte** para eliminar falsos positivos — ver seção dedicada de achados
> rejeitados.

---

# Parte 1 — Resumo Executivo

### Contagem por severidade (após filtragem de falsos positivos)

| Severidade | Qtd |
|---|---|
| 🔴 CRÍTICO | 0 |
| 🟠 ALTO | 5 |
| 🟡 MÉDIO | 10 |
| 🟢 BAIXO | 7 |
| ❓ Ambíguo (pergunta, não bug) | 1 |
| ✅ Falsos positivos rejeitados | 5 |

### Diagnóstico geral — Nota: **B (Boa, com dívida de ciclo de vida)**

O código é **maduro e disciplinado**: arquitetura event-driven coerente, constituição
operacional levada a sério (zero `eval`, dado via `crypto`, fallback offline sancionado),
normalização de schema que nunca lança, e bons contra-exemplos (`persist-middleware.js`
faz `init()` idempotente). **Não há vulnerabilidade crítica, `eval`, injeção SQL/comando,
nem segredo de servidor exposto** (a anon key do Supabase é pública por design). O tema
dominante de risco é **gestão de ciclo de vida**: assinaturas de bus/store e listeners de
DOM que não são removidos e re-renders que reconstroem `innerHTML` inteiro — manifestam-se
em sessões longas e re-inits, não no fluxo feliz.

### Top 5 mais urgentes

1. **🟠 Vazamento de listeners/assinaturas em re-init** — `player-sync.js`, `keeper-dashboard.js`,
   `event-log.js` e a maioria das views assinam bus/store ou ligam handlers sem guardar a
   função de unsubscribe nem desligar em re-render. Acúmulo → handlers disparam N vezes.
2. **🟠 Re-render reconstrói `innerHTML` inteiro** — wipa foco/scroll do usuário enquanto
   digita e re-anexa handlers a cada render (`skills.js`, `vitals.js`, `identity.js`, etc.).
3. **🟠 `keeper-tour.js` carregado em duplicidade** — `keeper.html:383` **e** `keeper.html:415`.
4. **🟠 Lacuna em `PERSIST_ACTIONS`** — ações de domínio despachadas que podem não atingir
   nenhum caminho de persistência (a verificar caso a caso).
5. **🟠 `forceFlush()` não é aguardado no unload** — escritas pendentes podem se perder ao
   fechar a aba.

---

# Parte 2 — Achados Detalhados

## 🟠 ALTO

### A1 — Vazamento de assinaturas/listeners em re-init (Performance/Memória)
- **Local:** `js/campaign/player-sync.js` (subscribe de store ~162-166 e bus ~267-308 sem
  unsubscribe); `js/campaign/keeper-dashboard.js:38` (`_cs.subscribe` descartado);
  `js/core/event-log.js:33,83` (dois `bus.subscribe` nunca dispostos); padrão de
  `node.oninput/onclick` re-anexado por render em `js/views/identity.js`,
  `attributes.js`, `spells.js`, `journal.js`, `inventory.js`, `tomes.js`.
- **Categoria:** Performance / Bug (handlers múltiplos).
- **Problema:** As funções de cleanup retornadas por `subscribe()` são descartadas. Em
  re-`init()` (hot-reload, re-entrada de modal/dashboard) ou em cada render, novas
  assinaturas/listeners acumulam; eventos passam a disparar 2×, 3×… (badges duplicados,
  broadcasts redundantes, status re-emitido).
- **Contra-exemplo correto a replicar:** `js/core/persist-middleware.js:67` (`if (_cancel) _cancel()`)
  e o `_skillsDelegated` flag em `js/views/skills.js:476`.
- **Fix:** Guardar a função de unsubscribe em variável de módulo e chamá-la antes de
  re-assinar; nas views, migrar para **event delegation** no container (padrão de
  `combat.js`) em vez de re-ligar por render.

### A2 — Re-render reconstrói `innerHTML` inteiro (UX/Performance)
- **Local (padrão):** `js/views/skills.js:257`, `vitals.js:36,111`, `combat.js:59`,
  `spells.js:58`, `tomes.js:57`, `journal.js:43`, `inventory.js:46`, `identity.js:79`.
- **Categoria:** Performance / Bug de UX.
- **Problema:** `container.innerHTML = ""` a cada render destrói foco de input em edição,
  reseta scroll e perde estado transitório; além disso recria todos os listeners. Um
  re-render disparado por ação irmã faz o cursor "pular" enquanto o usuário digita.
- **Fix:** Atualização cirúrgica do nó alterado (padrão já existente `updateSkillUI()` em
  `skills.js:449-470`): para inputs, escrever só `.value`; reconstruir apenas a sub-árvore
  que mudou.

### A3 — `keeper-tour.js` carregado duas vezes (Bug)
- **Local:** `keeper.html:383` e `keeper.html:415` (confirmado).
- **Categoria:** Bug / LoadOrder.
- **Problema:** O mesmo script é incluído duas vezes; se o módulo tem IIFE com efeitos
  colaterais (listeners, auto-início de tour), eles ocorrem em dobro.
- **Fix:** Remover a tag duplicada em `keeper.html:415`.

### A4 — Lacuna em `PERSIST_ACTIONS` para ações despachadas (Bug/Persistência — verificar)
- **Local:** `js/core/persist-middleware.js:23-37` vs `js/core/actions.js:48-61`.
- **Categoria:** Bug/Logic.
- **Problema:** Ações que existem em `TYPES` e têm reducer — `SET_ARMOR`, `RELOAD_WEAPON`,
  `MARK_SKILL_IMPROVEMENT`, `SKILL_IMPROVED`, `SET_BODY_SLOT` — **não estão** em
  `PERSIST_ACTIONS`. Se forem despachadas pelo executor e **não** houver um
  `persistCurrent()` manual no caminho, a mudança não é salva (perde-se no reload).
  Edições de atributo/identidade (`SET_ATTRIBUTE`/`SET_IDENTITY`) são intencionalmente
  fora do middleware (comentário em `actions.js:52`: "vai pelo store completo") — essas
  passam pelo caminho de mutação direta + `_persist()` das views, então **não** entram
  aqui.
- **Verificação necessária:** confirmar o caminho de dispatch real de
  `SET_ARMOR/RELOAD_WEAPON/SKILL_IMPROVED/MARK_SKILL_IMPROVEMENT/SET_BODY_SLOT`. Se forem
  despachadas via `store.dispatch`/executor sem persist manual, **adicioná-las** a
  `PERSIST_ACTIONS`.

### A5 — `forceFlush()` não aguardado no unload → perda de escrita (Bug/Dados)
- **Local:** `js/engine/storage.js` (`forceFlush()` ~247; handlers de `pagehide`/`unload` ~257-262).
- **Categoria:** Bug/Logic (durabilidade).
- **Problema:** `forceFlush()` retorna uma Promise de flush assíncrono ao IndexedDB, mas os
  handlers de unload não a aguardam (não há como aguardar de forma confiável no unload).
  Escritas debounced pendentes podem não completar ao fechar a aba.
- **Fix:** No caminho `localStorage` (síncrono), drenar `pendingWrites` sincronicamente
  dentro de `forceFlush()` antes do flush IDB assíncrono; considerar `navigator.sendBeacon`
  apenas se houver backend (não aplicável aqui).

## 🟡 MÉDIO

### M1 — `Math.random` em caminho primário (Consistência/Constituição)
- **Local:** `js/engine/name-generator.js:13`, `js/engine/storage.js:479` (`genId`),
  `js/keeper-standard-pack.js:34`.
- **Problema:** A constituição manda "Zero `Math.random`" (fallback offline permitido). Estes
  três usam `Math.random` **no caminho primário, sem tentar `crypto` antes** — inconsistente
  com `keeper.js:904`, `investigator.js:832` e `keeper.js:35` que fazem seleção/ID via crypto.
- **NÃO são problema (fallback crypto-first, sancionado por `DIRETRIZ_OFICIAL_V1.md:137`):**
  `dice.js:28`, `coc7e-rules.js:339,364`, `store.js:30` (`_uuid` tenta `crypto.randomUUID`
  primeiro), `schema.js:31`, `index.html:161`.
- **Fix:** Nos três do caminho primário, tentar `crypto.getRandomValues`/`crypto.randomUUID`
  primeiro e cair em `Math.random` só offline (mesmo padrão de `dice.js`).

### M2 — Coerção silenciosa de `NaN`/negativos em reducers (Bug/Edge case)
- **Local:** `js/core/store.js` (padrão `Number(payload.amount) || 0` em APPLY_DAMAGE/HEAL/
  LOSE_SANITY/SET_SKILL etc.); `js/core/state-machine.js:47` (`_netDamage`).
- **Problema:** `Number(NaN) || 0` → `0` (dano/cura "somem" silenciosamente);
  `amount` negativo em HEAL inverte o efeito; `SET_SKILL` com string vira 0 (perda de dado).
- **Fix:** Validar explicitamente: `const a = Number(payload.amount); if (!Number.isFinite(a) || a < 0) { console.warn(...); return state; }`.

### M3 — `QuotaExceededError` engolido em saves de notas (Bug/Resiliência)
- **Local:** `js/keeper-notes-advanced.js` (`_saveDb` ~41-47, catch vazio).
- **Problema:** Se o localStorage estoura cota, o save falha em silêncio mas o `_cache`
  em memória é atualizado → leitura mascara a falha de persistência.
- **Fix:** Capturar `QuotaExceededError` explicitamente, reverter `_cache` e emitir toast.

### M4 — Promises de conexão sem `.catch()` no campaign (Bug/Async)
- **Local:** `js/campaign/player-sync.js` (~63, `sync.connect()` sem catch),
  `js/campaign/keeper-dashboard.js` (~57-61/70).
- **Problema:** Rejeições de `sync.connect()` ficam sem tratamento → falha de conexão
  silenciada (`unhandledrejection`).
- **Fix:** Encadear `.catch(e => console.warn(...))` ou tratar no caminho async.

### M5 — Mutação direta do character contornando o dispatch (Arquitetura/Bug)
- **Local:** `js/views/identity.js:83`, `js/views/background.js:50`, `js/views/finances.js:69`.
- **Problema:** `c.investigator[f] = node.value` muta o estado direto e só depois chama
  `_dirty()/_persist()`, contornando o pipeline do store; pode dessincronizar baseline do
  middleware e o fluxo único de dados.
- **Fix:** Despachar `SET_IDENTITY`/equivalentes e deixar o reducer mutar.

### M6 — Backlinks recomputados O(n²·m) a cada render (Performance)
- **Local:** `js/keeper-notes-advanced.js` (~211-223) e `js/keeper-notes-ui.js` (~195-209, render ~110).
- **Problema:** `_computeBacklinks()` varre todas as notas × todos os wikilinks em cada
  render (filtro/busca). Com 100+ notas degrada visivelmente.
- **Fix:** Memoizar por snapshot de `_getTopics()`; recomputar só quando notas mudam, ou
  indexar wikilinks incrementalmente no update.

### M7 — `_esc()` não escapa aspas (Segurança — fora do foco, registrado)
- **Local:** `js/campaign/keeper-dashboard.js:402` (`_esc`).
- **Problema:** Escapa só `& < >`; se o valor for usado dentro de atributo HTML, um nome
  com `"` permite injeção de atributo. Uso atual via `getAttribute` é seguro, mas o
  helper é frágil para concatenação de atributos.
- **Fix:** Escapar também `"` e `'`, ou usar `element.dataset.x = value`.

### M8 — `media-picker` mascara erro real como "resize indisponível" (Bug)
- **Local:** `js/shared/media-picker.js` (~105-130, `pick`/`resizeToBlob` ~164-165).
- **Problema:** O `catch` trata **qualquer** erro (OOM de canvas, blob corrompido) como
  "usar original", devolvendo silenciosamente o arquivo grande sem feedback.
- **Fix:** Distinguir "API indisponível" de erro real; validar tamanho após fallback.

### M9 — Datas sem validação antes de `Date.parse`/comparação (Bug)
- **Local:** `js/keeper-notes-advanced.js` (`purgeExpired` ~171-181, ok com `isNaN`, mas
  formatos divergentes entre módulos: `keeper-journal.js` usa `slice(0,10)` vs ISO completo).
- **Problema:** Comparações por `localeCompare` assumem formato consistente; mistura de
  `toISOString()` completo e `slice(0,10)` pode falhar em filtros de intervalo.
- **Fix:** Padronizar ISO-8601 completo e validar na carga.

### M10 — Busca linear no encounter tracker por dano (Performance)
- **Local:** `js/keeper.js` (`updateEncounterHP` ~1081-1090, chamado por roll de dano).
- **Problema:** `filter`+`find` O(n) por golpe; colisão de `sourceId` em criaturas
  duplicadas pode atualizar a entrada errada.
- **Fix:** Indexar `state.encounter` por `sourceId`; validar unicidade no add.

## 🟢 BAIXO

- **B1 — Arquivos esqueleto órfãos** (`js/core/dispatch.js`, `js/core/lifecycle.js`,
  `js/sync/*`, `js/vendor/supabase.js` placeholder): não carregados, marcados WIP, mas
  poluem o repo e confundem o que é vivo. Documentar/arquivar. (`lifecycle.js` está
  **completo porém não plugado** — candidato natural a resolver A1/A2.)
- **B2 — `deepClone` via JSON** (`store.js:23`, `schema.js:58`): descarta funções/`undefined`/
  `Date`/`Map`/`Set`. Risco baixo (store não deve conter funções); documentar.
- **B3 — Action creators ausentes** para `SET_ARMOR/RELOAD_WEAPON/MARK_SKILL_IMPROVEMENT/
  SKILL_IMPROVED/SET_BODY_SLOT` (`actions.js`): API incompleta, **mas nenhum código as
  chama** (grep vazio) → inofensivo hoje. Adicionar por completude se forem usadas.
- **B4 — Variáveis/parâmetros mortos:** `pdf-export.js` (`savedY` ~156-158 sem efeito),
  `ui-components.js` (`icon()` ignora `opts` ~562-567).
- **B5 — Export órfão:** `openOrCreateByTitle()` em `keeper-notes-ui.js` (~998) nunca chamado.
- **B6 — Magic strings/inconsistência de helpers:** nomes de atributos/categorias
  hardcoded em várias views; mistura de `$s()` próprio vs `window.CoC.ui.$` destructurado.
- **B7 — `renderView` engole exceção sem stack** (`render-pipeline.js:40-46`): aceitável
  como fail-safe, mas logar `e.stack` ajuda o debug.

## ❓ Ambíguo (pergunta, não bug)

- **Q1 — Limiar de Loucura Indefinida** (`state-machine.js:54`,
  `_isIndefInsanityThreshold(totalLostToday, currentSAN)`): foi sugerido usar
  `currentSAN - amount`. A regra CoC 7e (p.157/161) usa a SAN **antes** das perdas do dia,
  e o significado exato de `ctx.currentSAN` (antes ou depois da perda atual) depende de
  `buildContext()` e de como `sanLossToday` é mantido. **Não confirmado como bug** —
  requer rastrear o valor de `ctx.currentSAN`. Pergunta para o time de regras.

---

## ✅ Falsos positivos rejeitados (verificados contra o código)

1. **`calcMOV` off-by-one** (alegado em `coc7e-rules.js:209-211`): **FALSO.** O `else`
   cobre corretamente `des===tam`/`forca===tam` → MOV 8, conforme a regra. Código correto.
2. **"8 action creators faltando = falha crítica silenciosa"**: **FALSO em severidade.**
   3 dos 8 (`ADD_MYTHOS`, `RECALC_DERIVED`, `TOGGLE_SKILL_FAVORITE`) **nem existem em
   `TYPES`**; os 5 reais **não são chamados em lugar nenhum** (grep vazio) →
   lacuna de API inofensiva, não bug. (Rebaixado para B3.)
3. **Reversão de índice no histórico de notas** (`keeper-notes-advanced.js` getHistory/
   restoreVersion): **FALSO.** Tanto a UI quanto `restoreVersion` usam o **mesmo**
   `getHistory()` revertido → os índices casam; restauração correta.
4. **Gap detection do `supabase-transport` com `NaN`/falso positivo no 1º evento**
   (`supabase-transport.js:185-196`): **FALSO.** Protegido por `last != null` e indexado
   por peer (`_lastSeqByPeer[data.peerId]`); primeiro evento não dispara gap.
5. **`Math.random` "CRÍTICO" generalizado:** **FALSO em severidade.** A maioria são
   fallbacks crypto-first **sancionados** pela constituição (ver M1). Só 3 usos primários
   são realmente problemáticos.

---

## O que NÃO foi possível avaliar

- **Comportamento em runtime do sync** (ordenação de mensagens, reconexão prolongada,
  partição de rede do Supabase Realtime) — requer execução/rede real.
- **Esquema/RLS do Supabase** (`supabase/schema.sql`): unicidade do PIN, constraints de
  idempotência (`campaign_id, peer_id, peer_seq`), e se RLS bloqueia jogador de inserir
  ações SACRED. **Recomendo auditar `supabase/schema.sql` separadamente.**
- **i18n** (`i18n.js`): não foi verificado se todas as chaves existem para todas as strings.
- **Comportamento sob carga** (100+ criaturas, 500+ notas, log de rolagens muito grande).
- **CSS/recalc de layout** e acessibilidade (WCAG) — fora do foco (Bugs/Perf).
- **Caminho de dispatch real de A4** — precisa confirmação em código vivo das views/executor.

---

# Parte 3 — Plano de Ação Priorizado

| Prio | Achado | Esforço | Impacto | Tipo |
|---|---|---|---|---|
| 1 | **A3** Remover `keeper-tour.js` duplicado (`keeper.html:415`) | Baixo | Médio | Quick win |
| 2 | **A1** Guardar/chamar unsubscribe em player-sync, keeper-dashboard, event-log | Médio | Alto | Pontual |
| 3 | **A4** Confirmar e fechar lacuna de `PERSIST_ACTIONS` | Baixo | Alto | Quick win (após verificar) |
| 4 | **M2** Validar `NaN`/negativos nos reducers sagrados | Baixo | Alto | Quick win |
| 5 | **M1** crypto-first nos 3 `Math.random` primários | Baixo | Médio | Quick win |
| 6 | **A5** Flush síncrono de localStorage no unload | Médio | Alto | Pontual |
| 7 | **A2** Render cirúrgico (preservar foco/scroll) nas views | Alto | Alto | Estrutural |
| 8 | **A1/views** Migrar views para event delegation | Alto | Alto | Estrutural |
| 9 | **M3** Tratar `QuotaExceededError` em saves de notas | Baixo | Médio | Quick win |
| 10 | **M4** `.catch()` nas conexões de campaign | Baixo | Médio | Quick win |
| 11 | **M6** Memoizar backlinks | Médio | Médio | Pontual |
| 12 | **M5** Despachar em vez de mutar nas views | Médio | Médio | Estrutural |
| 13 | **M7–M10, B1–B7** | Baixo–Médio | Baixo–Médio | Higiene |

**Quick wins (alto impacto, baixo esforço):** A3, A4 (após verificar), M2, M1, M3, M10.
**Mudanças estruturais (planejar):** A2, A1-em-views (render/delegation) — candidatos a
usar `js/core/lifecycle.js` (já implementado, não plugado) para gerir cleanup.

---

## Como conferir os achados confirmados

- `keeper.html` linhas 383 e 415 → duplicidade de `keeper-tour.js`.
- `git grep -n "Math.random"` → confirmar fallback-crypto-first vs caminho primário.
- `js/core/persist-middleware.js:23-37` vs reducers em `js/core/store.js` → mapear A4.
- `node js/tests/runner.js` → suíte atual deve continuar verde (auditoria não altera código).
