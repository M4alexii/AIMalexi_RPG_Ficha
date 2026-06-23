# Auditoria Técnica Completa de Código — AIMalexi RPG

> **Data:** 2026-06-16 · **Escopo:** todo o código JS (`js/**`, `data/**`, `sw.js`) — 117 arquivos, ~28k LOC (exclui `js/vendor/`).
> **Método:** varredura forense por subsistema (engine, core, views, shared, campaign/multiplayer+config, orquestrador/keeper/data/SW), com verificação cruzada de imports×exports e declarações×usos. Achados verificados no código; localizações em `arquivo:linha`.
> **Stack:** JavaScript vanilla, sem build/módulos, namespace `window.CoC`. Call of Cthulhu 7e (PT-BR), PWA estático.

> **Atualização 2026-06-23 (Sessão 7):** **C-01 e C-02 RESOLVIDOS.** `PERSIST_ACTIONS` e
> `SACRED` agora são derivados/autoritativos pela `event-ontology` (`persist-middleware.js`
> via `CoC.core.derivePersistActions`; `actions.isSacred()` consulta a ontologia). Adicionado o
> teste-guarda de concordância que faltava em `test-event-ontology.js` e cobertura de
> `runMigrations` em `test-storage-migrations.js` (runner 1144/1144). Itens ainda **abertos**
> desta auditoria: XSS (V-01/V-03/F06/CMP-V1), `Math.random` (F01/RULES-04), STOR-01/02/03,
> coerção NaN (M-02/M-03), autoridade de broadcast (CMP-A1) — ver Parte 3.

---

## Parte 1 — Resumo Executivo

### Contagem por severidade (≈88 achados)

| Severidade | Qtde aprox. |
|---|---|
| 🔴 CRÍTICO | 6 |
| 🟠 ALTO | 18 |
| 🟡 MÉDIO | 29 |
| 🟢 BAIXO | 35 |

### Diagnóstico geral — Nota: **B (saudável, com arestas de segurança e consistência)**

A arquitetura reativa é sólida: reducers em geral puros, normalização defensiva (`schema.js` "nunca lança"), RNG criptográfico, parser RPN sem `eval`, durabilidade event-sourced com RLS server-side robusto no Supabase. A maioria dos campos de usuário é escapada antes de ir ao DOM. **Porém** há um padrão recorrente de **XSS por `innerHTML` em campos não escapados** (ícones de arma/item, vitais e nomes vindos de peers, texto de timeline), agravado pelo fato de personagens serem importáveis por JSON e sincronizados em multiplayer (vetor de XSS armazenado/transferível). Há também **drift entre as listas mantidas à mão** (`actions.js` × `event-ontology.js` × `PERSIST_ACTIONS` × `SACRED`), que produz lacunas de persistência e de classificação "sacred"; **violações pontuais da regra "Zero `Math.random`"** em fallbacks; e **lacunas de autoridade no caminho de broadcast** do multiplayer (a camada durável/RLS é segura, mas o broadcast ao vivo é confiável demais).

### Top 5 mais urgentes

1. **🔴 XSS via `innerHTML` em campos não escapados** — ícones de arma/item no dashboard (`js/views/dashboard.js:176,182`), vitais de peers no painel do Keeper (`js/campaign/keeper-dashboard.js:405-408`), e `e.text` de timeline (`js/keeper-dashboard-summary.js:165`). Personagens importados/sincronizados podem injetar script.
2. **🔴 Lacuna de persistência por drift de catálogo** — `PERSIST_ACTIONS` (`js/core/persist-middleware.js:23`) não inclui ações que mutam o personagem e podem ser disparadas isoladamente (`SET_BODY_SLOT`, `SET_ARMOR`, `RELOAD_WEAPON`, `MARK_SKILL_IMPROVEMENT`, `TOGGLE_SKILL_FAVORITE`). Edições somem no reload.
3. **🔴 Import de JSON pode pular migrações de renomeação de perícias** — o envelope de export carimba `_schemaVersion` no topo, mascarando dados internos de versão antiga (`js/engine/storage.js:368-371,625`). Risco de pontos órfãos/nomes errados.
4. **🟠 Autoridade não verificada no broadcast multiplayer** — qualquer peer pode forjar `CAMPAIGN_ENDED` e expulsar todos, ou falsear o roster (`js/campaign/player-sync.js:255`, `keeper-dashboard.js:210-260`). `hostPeerId` existe mas nunca é usado para validar.
5. **🟠 Violações "Zero `Math.random`"** e **double-roll de dano via substituição `DB`** — fallbacks com `Math.random` (`js/keeper-standard-pack.js:34`, `coc7e-rules.js:339,364`, `dice.js:28`) e `damage: "+5D6 (DB)"` do shoggoth dobra o dano (`data/bestiary.js:320`).

---

## Parte 2 — Achados Detalhados

> IDs prefixados por subsistema: **DICE/RULES/STOR/NAME** (engine), **C/M/L** (core), **SH** (shared), **V** (views), **CMP** (campaign), **TOP** (orquestrador/keeper/data).

### 2.1 — Segurança (XSS / autoridade / brute-force)

```
[V-01] | 🔴 CRÍTICO | XSS (innerHTML)
Local: js/views/dashboard.js:176, 182
Problema: w.icon e it.icon (campos livres de arma/item) são concatenados CRUS em root.innerHTML;
  apenas .name passa por _esc.
Impacto: personagem com icon "<img src=x onerror=...>" executa script ao renderizar o dashboard.
  Personagens são importáveis por JSON e sincronizados em multiplayer → XSS armazenado/transferível.
Correção: _esc(w.icon || '⚔ ') e _esc(it.icon || '🎒 ').
```
```
[V-03] | 🔴 CRÍTICO | XSS (innerHTML)
Local: js/views/combat.js:91 (e adjacências — w.shots)
Problema: w.shots é interpolado sem escape no card.innerHTML. Sanitizado no modal, mas import/sync
  pode trazer string arbitrária.
Impacto: XSS via personagem importado/sincronizado. Mesma classe de V-01.
Correção: escHtml(String(w.shots)).
```
```
[CMP-V1] | 🟠 ALTO | XSS (untrusted peer → innerHTML)
Local: js/campaign/keeper-dashboard.js:405-408 (e validação em _onTransportEvent)
Problema: s.hp/s.san/s.mp/s.luck de INVESTIGATOR_STATUS (peer não confiável) entram no innerHTML
  sem _esc nem coerção numérica.
Impacto: peer malicioso no canal injeta XSS no DOM do Keeper via status forjado.
Correção: Number(...)||0 nos vitais; _esc em qualquer string; validar shape do status no recebimento.
```
```
[TOP-F06] | 🟠 ALTO | XSS (innerHTML)
Local: js/keeper-dashboard-summary.js:165
Problema: e.text de timeline é inserido cru (o ramo-irmão e.type É escapado — o autor sabia).
Impacto: texto de timeline derivado de peer (nome de jogador/chat) com markup executa no DOM do Keeper.
Correção: _esc(e.text).
```
```
[SH-S1] | 🔴 CRÍTICO | XSS (contrato frágil)
Local: js/shared/guided-tour.js:172-180
Problema: pop.innerHTML interpola st.title/st.body SEM escape; o "contrato" delega o escape ao chamador.
  Hoje tours são estáticos, mas o módulo é genérico/reutilizável.
Impacto: se um tour receber string de usuário, injeção de markup arbitrário.
Correção: escapar por padrão; exigir opt-in (st.bodyHTML) para conteúdo confiável.
```
```
[SH-S2] | 🟠 ALTO | XSS (canais innerHTML não escapados)
Local: js/shared/ui-components.js:573-577 (emptyStateHTML hint), :309-313 (modal body string)
Problema: hint e modal.body (quando string) vão a innerHTML dependendo da disciplina do chamador.
Impacto: qualquer call-site com string de usuário vira XSS. Risco transversal.
Correção: auditar call-sites; preferir nós DOM; restringir hint a texto.
```
```
[CMP-U1] | 🟢 BAIXO | Injeção em atributo (_esc divergente)
Local: js/campaign/keeper-dashboard.js:515 vs js/campaign/campaign-sync.js:39
Problema: o _esc do keeper NÃO escapa aspas e é usado em data-inv-note="..." (linha 402);
  nome com " quebra o atributo. Há 2 _esc divergentes e 3 _uuid duplicados.
Impacto: injeção de atributo via nome de personagem (mesmo vetor de peer não confiável).
Correção: um único _esc que escape & < > " ' ; util _uuid compartilhado.
```
```
[CMP-A1] | 🟠 ALTO | Autorização (broadcast não verificado)
Local: js/campaign/player-sync.js:250-262; keeper-dashboard.js:210-260; supabase-transport.js:167-209
Problema: eventos inbound (CAMPAIGN_ENDED, INVESTIGATOR_STATUS, HOST_ONLINE) são aceitos sem
  verificar autenticidade. CAMPAIGN_ENDED de QUALQUER peer chama leaveCampaign()+close().
Impacto: qualquer peer no canal expulsa todos os jogadores e/ou falseia o roster/timeline do Keeper.
  (Mitigado: eventos inbound NUNCA tocam o executor/character store — dano limitado à integridade de
  exibição e ao DoS de "encerrar campanha".)
Correção: fixar hostPeerId no 1º HOST_ONLINE e só aceitar eventos host-only quando
  event.peerId === hostPeerId; ignorar INVESTIGATOR_STATUS de peerId desconhecido.
```
```
[CMP-L4] | 🟡 MÉDIO | Estado órfão que deveria autorizar
Local: js/campaign/campaign-store.js:72 (hostPeerId setado, nunca lido)
Problema: hostPeerId é gravado na criação mas nunca consumido — é exatamente o dado necessário
  para corrigir CMP-A1.
Correção: usar hostPeerId para validar eventos host-only.
```
```
[CMP-P1] | 🟠 ALTO | Brute-force (sem rate-limit)
Local: js/campaign/pin-system.js:11-16; supabase/schema.sql join_campaign
Problema: espaço de PIN = 900.000; join_campaign sem rate-limit, lockout, log ou CAPTCHA; anon pode
  chamar ilimitadamente.
Impacto: campanhas ativas são enumeráveis por força bruta; membership expõe snapshots (PII) e permite
  spam de timeline/chat/snapshot.
Correção: rate-limit por auth.uid()/janela; considerar PIN 8 dígitos, expiração/rotação ou aprovação
  do host; logar tentativas.
```
```
[CMP-L1] | 🟡 MÉDIO | Colisão de PIN → cross-tenant
Local: js/campaign/keeper-dashboard.js:145-163; campaign-sync.js:167-168
Problema: em colisão de PIN no create, o insert falha e o fallback chama joinCampaign(pin) — o "host"
  entra como player na campanha de outro; local diz role 'host', DB diz 'player'.
Impacto: sessão quebrada (RLS nega sacred) + leitura de snapshots/eventos de campanha alheia.
Correção: distinguir unique-violation; regenerar PIN e retentar; nunca cair em join no fluxo de create.
```
```
[STOR-10/NAME-01/F01/RULES-04/DICE-02] | 🟠/🟢 | Constituição "Zero Math.random"
Local: js/keeper-standard-pack.js:34 (🟠 — _uuid com Math.random, divergente do resto);
       js/engine/coc7e-rules.js:339,364 (🟠 — fallback de melhoria de perícia/EDU);
       js/engine/dice.js:28 (🟡 — randomFraction catch → Math.random);
       js/engine/storage.js:479 (🟢 genId), js/engine/name-generator.js:13 (🟢 pick)
Problema: uso de Math.random viola a regra constitucional; em F01 há padrão crypto disponível no
  próprio repo que não foi usado.
Impacto: violação literal de regra zero-tolerância; falharia um grep de CI se existir.
Correção: usar o padrão crypto.getRandomValues já adotado em keeper.js:36 etc. Para dados/melhorias,
  exigir window.CoC.dice e lançar erro claro se ausente (decidir explicitamente o fallback offline).
```

### 2.2 — Bugs e Lógica (engine / regras / dados)

```
[DICE-01] | 🔴 CRÍTICO | Edge case (crash potencial)
Local: js/engine/dice.js:180-181
Problema: dbValue.toString() quando a notação contém DB e dbValue é null/undefined explícito → TypeError.
  (Default "0" protege o caminho comum.)
Impacto: crash em rolagem de dano com DB quando caller passa null.
Correção: const dbStr = (dbValue == null ? "0" : String(dbValue)); usar dbStr em todo o replace.
```
```
[TOP-F02] | 🟠 ALTO | Dado errado (double-roll de dano)
Local: data/bestiary.js:320 (shoggoth-pequeno: damage "+5D6 (DB)")
Problema: a substituição DB (dice.js:179) injeta o db ("+5D6") no token "(DB)" → "+5D6 (+5D6)";
  o regex de tokens casa "+5D6" DUAS vezes → +10D6.
Impacto: ao rolar pelo atacante do Keeper, dano do shoggoth ~dobra.
Correção: usar damage "+5D6" (ou "DB"), removendo o texto literal "(DB)".
```
```
[V-06] | 🟠 ALTO | Erro engolido (notação inválida → custo 0)
Local: js/views/spells.js:48-50; js/views/tomes.js:46-48
Problema: try/catch espera rollNotation lançar, mas ela NUNCA lança — retorna total:0 para entrada
  inválida ("1Dd6", "five"). Magia com custo digitado errado é conjurada de graça; tomo aplica 0 SAN.
Impacto: custo PM/perda SAN silenciosamente zerados sem aviso.
Correção: detectar total 0 com entrada não-"0" não-vazia e emitir aviso; validar notação ao salvar.
```
```
[V-07] | 🟠 ALTO | Edge case (ammo 0 some)
Local: js/views/combat.js:170-171
Problema: ammo: parseInt(...) || null → magazine vazio (0) vira null; campos de munição e botão de
  recarga desaparecem justamente quando a arma está vazia. Idem ammoMax/shots.
Impacto: arma disparada-até-vazia perde rastreamento de munição.
Correção: Number.isFinite(parseInt(v,10)) ? parseInt(v,10) : null.
```
```
[V-09] | 🟡 MÉDIO | Off-by-one / SAN dupla em tomos
Local: js/views/tomes.js:104,175
Problema: studyProgress sem clamp superior em req; avançar→recuar→avançar cruzando a fronteira de
  conclusão pode reaplicar a perda de SAN.
Impacto: perda de SAN aplicada mais de uma vez para o mesmo tomo.
Correção: clamp Math.min(req||Infinity, Math.max(0, prog+delta)); persistir flag 'completed'.
```
```
[V-13] | 🟡 MÉDIO | Edge case (Math.abs inverte intenção)
Local: js/views/vitals.js:223-225,316-319
Problema: −X de SAN/PV usa Math.abs(r.total); "1D6-10" (intenção ~0) vira dano positivo.
Impacto: notação com total ≤ 0 aplica dano oposto ao pretendido.
Correção: rejeitar notação com total ≤ 0 com aviso, em vez de Math.abs.
```
```
[V-08] | 🟡 MÉDIO | Duplicação divergente (alvo de perícia)
Local: js/views/combat.js:39-53 vs js/views/rolls.js:46-58
Problema: combat._getSkillValue exige direct>0 (cai pra base); rolls._getSkillValue aceita 0. Mesma
  perícia mostra alvo diferente entre abas (o próprio comentário pede "manter em sincronia").
Impacto: ataque e rolagem manual usam números-alvo diferentes para a mesma perícia.
Correção: unificar em um helper compartilhado.
```
```
[C-03] | 🟠 ALTO | Regra (morte imediata inalcançável)
Local: js/core/state-machine.js:107-117
Problema: guarda de morte imediata usa (currentHP - net) < PV_MIN - maxHP; com PV_MIN=-2 e maxHP=12
  exige net>26 (>2× maxHP). RAW: morte imediata = golpe único com dano ≥ maxHP.
Impacto: golpe letal só seta 'dying', nunca 'dead'; status 'dead' praticamente inalcançável.
Correção: _netDamage(action, ctx) >= ctx.maxHP && ctx.maxHP > 0.
```
```
[M-01] | 🟡 MÉDIO | Regra (over-count de SAN/dia)
Local: js/core/store.js:99-102
Problema: SAN.current é clampado em 0, mas sanLossesToday soma o amount pedido (não o aplicado).
Impacto: gatilho de insanidade indefinida dispara mais cedo que o RAW.
Correção: somar a perda efetiva (cur - SAN.current resultante).
```
```
[M-02] | 🟡 MÉDIO | NaN em reducers de vitais
Local: js/core/store.js:73,99,115,129,137,145
Problema: HEAL_DAMAGE/SAN/PM/SPEND_LUCK usam payload.amount cru (≠ APPLY_DAMAGE que faz Number||0);
  amount inválido → vital NaN → serializa como null.
Impacto: payload malformado (caller futuro, import, replay) corrompe PV/SAN/PM/Sorte.
Correção: const amt = Number(action.payload.amount) || 0; em todos os reducers de vitais (e M-09 no state-machine).
```
```
[M-03] | 🟡 MÉDIO | normalizeCharacter ainda deixa NaN
Local: js/core/schema.js:112-130
Problema: PV/PM/SAN.current só têm null-check, sem Number-coerção; "abc"/NaN sobrevivem.
Correção: coerção com Number(...) e fallback quando NaN.
```
```
[TOP-F04] | 🟡 MÉDIO | Lógica (dano no encounter no alvo errado)
Local: js/keeper.js:690-693,1083-1084
Problema: find por sourceId retorna sempre a 1ª criatura quando há duplicatas da mesma fonte
  (ex.: 3 cultistas). Dano/HP vão para a primeira.
Impacto: dano auto-aplicado atinge a criatura errada com duplicatas.
Correção: vincular entradas do encounter pelo _encId único (entry.id), não por sourceId.
```
```
[STOR-01] | 🔴 CRÍTICO | Migração (perda de dados no import)
Local: js/engine/storage.js:368-371,625
Problema: o envelope de export carimba _schemaVersion no topo; no import, runMigrations vê a versão do
  envelope e PULA migrações de renomeação, mesmo com dados internos antigos (v2).
Impacto: import de JSON antigo pula renomeação de perícias → pontos órfãos/nomes errados.
Correção: separar versão do envelope (_format/_exportedAt) da versão dos dados; ou rodar renomeações
  idempotentes no import independentemente de _schemaVersion. (PERGUNTA: confirmar o fluxo de import
  de personagem em investigator.js.)
```
```
[STOR-02] | 🟠 ALTO | Quota de IndexedDB não emite alerta
Local: js/engine/storage.js:126-137,224-225
Problema: ramo localStorage detecta quota (emitError type:"quota"), mas o ramo IndexedDB trata como
  "write" genérico — não distingue QuotaExceededError no backend mais comum.
Impacto: usuário com cota cheia não recebe o aviso "exporte JSON" → perda silenciosa de gravações.
Correção: no catch de idbSet, inspecionar e.name === "QuotaExceededError" e emitir type:"quota".
```
```
[STOR-03] | 🟠 ALTO | Flush não aguardado no exit (IDB)
Local: js/engine/storage.js:256-263
Problema: forceFlush() async sem await em pagehide/beforeunload; transações IDB podem não completar.
Impacto: perda da última edição (~150ms) ao fechar/navegar no backend IDB.
Correção: em visibilitychange:hidden escrever espelho síncrono em localStorage como fallback.
```
```
[STOR-04..07] | 🟡 MÉDIO | nuclearReset/migração/import incompletos
Local: storage.js:724-740 (nuclearReset não limpa prefs/ghost/blobs);
       :318-335 (migração LS→IDB por "lista vazia" deixa órfãos);
       :647-662 (importJSONFromFile sem validar estrutura);
       :445-447 (v2→v3 sem dedup de occupationSkills → freeUsed inflado)
Correção: ver cada bloco — incluir KEY_PREFS/KEY_GHOST/blobs no reset; migrar por chave ausente;
  validar typeof parsed==="object"; [...new Set(...)] na renomeação.
```
```
[B1] | 🟠 ALTO | Edge case (budget negativo/NaN)
Local: js/shared/validators.js:19-38
Problema: budget negativo/NaN não tratado → percent/remaining absurdos ("-150%").
Correção: budget = Math.max(0, Number(budget)||0); tratar budget<=0; Math.abs no label de excedente.
```
```
[B4] | 🟡 MÉDIO | TypeError potencial em validateCharacter
Local: js/shared/validators.js:101-127
Problema: se rules.validateCharacter retornar objeto sem warnings/issues array, .push lança TypeError.
Correção: result.warnings = result.warnings || []; result.issues = result.issues || [];
```
```
[RULES-01/02/05] | 🟡 MÉDIO | Parser RPN (casos de borda improváveis)
Local: coc7e-rules.js:48-66 (números malformados "1.2.3" truncados; "a--b" avaliado errado),
       :313-318 (bestVal=0 inicial descarta fórmulas ≤0)
Impacto: inalcançável pelas fórmulas reais do app (sempre ATTR*int), mas o parser é exposto.
Correção: validar número com /^\d*\.?\d+$/; tratar unário corretamente; bestVal=-Infinity.
```

### 2.3 — Persistência / event-sourcing / concorrência

```
[C-01] | 🔴 CRÍTICO | Lacuna de persistência (drift de catálogo)
Local: js/core/persist-middleware.js:23-37
Problema: PERSIST_ACTIONS não inclui ações que mutam o personagem e são disparáveis isoladamente:
  SET_BODY_SLOT (body-slots.js:152), SET_ARMOR, RELOAD_WEAPON, MARK_SKILL_IMPROVEMENT,
  TOGGLE_SKILL_FAVORITE, SKILL_IMPROVED.
  (Nuance: SET_ATTRIBUTE é provavelmente persistido via o cascade RECALC_DERIVED, que ESTÁ na lista;
  ADD_MYTHOS/ADD_STATUS/REMOVE_STATUS chegam como efeitos de ações já persistidas.)
Impacto: equipar slot/recarregar/marcar-favoritar perícia muda a UI mas NÃO auto-persiste; some no reload
  (salvo se outra ação persistida disparar depois).
Correção: derivar PERSIST_ACTIONS de eventOntology.CATALOG (persists===true && aggregate==='character')
  para nunca divergir.
```
```
[C-02] | 🟠 ALTO | Drift ontologia × actions (SACRED não aplicado)
Local: js/core/event-ontology.js:76 (ADD_MYTHOS sacred:true) vs js/core/actions.js (ausente)
Problema: ADD_MYTHOS tem reducer (store.js:78) e é disparado ao vivo, mas NÃO está em actions.js TYPES,
  então isSacred('ADD_MYTHOS') é false embora a ontologia o marque sacred. RECALC_DERIVED idem ausente.
Impacto: em multiplayer, ganho de Mythos que baixa SAN-máx NÃO é tratado como sacred.
Correção: registrar ADD_MYTHOS/RECALC_DERIVED em actions.js; derivar SACRED da ontologia (fonte única).
```
```
[V-10] | 🟡 MÉDIO | Mutação direta do store (bypass event-sourcing)
Local: js/views/journal.js:227-231; background.js:50/59/67; identity.js:69/82; finances.js:74
Problema: handlers mutam c.investigator/c.background/fin.cash diretamente e publicam persist-requested,
  sem passar por executor/dispatch.
Impacto: edições de identidade/antecedentes/dinheiro não são event-sourced — não fazem replay, não
  sincronizam em multiplayer e ficam fora do log append-only; risco de lost-update.
Correção: rotear por ações próprias (SET_IDENTITY, SET_BACKGROUND…) como finances faz para Crédito.
  (PERGUNTA: _meta.journalCollapsed pode ser carve-out intencional de UI; background/identity/cash não.)
```
```
[M-06] | 🟡 MÉDIO | importSession ignora normalizeCharacter
Local: js/core/session-export.js:137-140
Problema: SET_CHARACTER recebe data.character cru de JSON não confiável, sem normalizeCharacter.
Impacto: personagem não-normalizado/versão antiga entra no store vivo, contornando migração/coerção.
Correção: normalizeCharacter(data.character) antes do dispatch.
```
```
[M-08] | 🟡 MÉDIO | Pureza de reducer (Date.now/_uuid dentro do reducer)
Local: js/core/store.js:105,118,333,360-361,388,416,445
Problema: reducers chamam Date.now()/_uuid() — entradas não determinísticas; o mesmo reducer é usado
  pelo replay-consumer.
Impacto: replay diverge (ids/timestamps regenerados); viola "Reducers PUROS".
Correção: gerar ids/timestamps no action creator/executor; reducer só faz fallback se ausente.
```
```
[M-05] | 🟡 MÉDIO | Persist por-ação dentro do batch (write amplification)
Local: js/core/executor.js:75-84 + persist-middleware.js:68-72 + store.js:567
Problema: persist-middleware faz JSON.stringify(char)+save a CADA ação persistida dentro de um cascade
  (ex.: APPLY_DAMAGE → 2× ADD_STATUS) — múltiplos saves de estados intermediários.
Impacto: saves redundantes e snapshots inconsistentes persistidos por evento de dano/sanidade.
Correção: persistir uma vez no fim da render-transaction (ou coalescer em microtask).
```
```
[L-09] | 🟢 BAIXO | Render/persist redundante em reducers idempotentes
Local: js/core/signals.js:25 + store.js:152-157
Problema: ADD_STATUS/REMOVE_STATUS/SET_ARMOR sempre criam objeto novo mesmo sem mudança → notifica
  renders/persist (amplifica M-05 em cascades).
Correção: early-return state quando o valor não muda.
```
```
[CMP-O1..O3] | 🟠/🟡 | Outbox/seq/drain
Local: campaign-sync.js:174-188 (🟠 seq reinicia em reload pois _peerId é regenerado → numeração
  mista entre outbox e DB num reconnect); campaign-persistence.js:125-139 (🟡 sem lock de concorrência
  no drain); :134-137 (🟡 falha no drain não reenfileira retry — sem listener 'online')
Impacto: reordenação/perda de trace em ciclos offline→reload→reconnect; trabalho duplicado;
  evento preso na outbox até o próximo reconnect.
Correção: persistir _peerId (localStorage) e semear seq de max(DB, outbox, persistido); lock _draining;
  window.addEventListener('online', () => drainOutbox()).
```
```
[CMP-R1..R3] | 🟡 MÉDIO | Leaks de subscription/timer/sessão no leave
Local: player-sync.js:161-167,232-248,103,256-258; keeper-dashboard.js:500-502
Problema: subscribe ao store/bus nunca cancelado; _snapTimer não limpo no leave (snapshot pós-leave);
  sync.disconnect() nunca chamado no leave/end (cross-campaign write na janela de falha).
Correção: guardar handles e limpar no leaveCampaign; clearTimeout(_snapTimer); chamar sync.disconnect().
```
```
[CMP-D2] | 🟡 MÉDIO | Detecção de gap apenas observacional
Local: js/campaign/supabase-transport.js:184-196
Problema: gap de seq só emite _debug (desligado em prod) — sem recuperação; trace perdido some da
  timeline ao vivo.
Correção: em gap, disparar REQUEST_STATUS/fetchEventsSince para backfill.
```
```
[CMP-V2] | 🟡 MÉDIO | Sem validação de schema no recebimento
Local: js/campaign/transport.js:100-109; supabase-transport.js:131-138
Problema: ontology.validate só roda no envio; inbound é totalmente confiado.
Correção: validar no recebimento e descartar inválidos.
```

### 2.4 — Performance

```
[SH-P1] | 🟠 ALTO | _collect() reconstrói índice a cada tecla
Local: js/shared/global-search.js:106-110,163
Problema: _render(q) chama _collect() a cada input — varre catálogo+perícias+inventário+magias+journal
  e recria closures a cada tecla.
Impacto: latência por keystroke em personagens grandes; pressão de GC.
Correção: montar o índice uma vez no open() (cache invalidado por dispatch) e filtrar o array pronto.
```
```
[V-12] | 🟡 MÉDIO | _seen do chat cresce sem limite
Local: js/views/chat.js:29,106
Problema: _seen acumula todo msgId pela vida da página (histórico é capado em 200, _seen não).
Correção: capar _seen (evict mais antigo) ou derivar do histórico já trimado.
```
```
[STOR-09] | 🟢 BAIXO | Clone integral do personagem por save (ghost)
Local: js/engine/storage.js:510
Problema: JSON.parse(JSON.stringify(character)) a cada saveCharacter.
Correção: debounce do snapshot do ghost / clonar só no flush.
```
```
[V-15] | 🟢 BAIXO | Re-render total onde update pontual basta
Local: js/views/vitals.js:280
Problema: clique em chip de condição chama renderVitals() completo + ADD/REMOVE_STATUS sacred dispara
  outro render → render duplo.
Correção: alternar a classe do chip localmente; deixar o pipeline fazer o render canônico.
```

### 2.5 — Leaks de recursos / listeners

```
[SH-L2] | 🟡 MÉDIO | escHandler órfão no modal
Local: js/shared/ui-components.js:342-347
Problema: o keydown escHandler só é removido ao pressionar Esc; fechar por backdrop/botão deixa o
  listener pendurado em document para sempre.
Impacto: cada modal aberto-e-fechado-sem-Esc deixa um listener residente.
Correção: document.removeEventListener("keydown", escHandler) no close().
```
```
[SH-L1] | 🟠 ALTO | BroadcastChannel sem close
Local: js/shared/multi-tab-warning.js:21-46
Problema: init() cria BroadcastChannel/onmessage e nunca fecha; sem guard de reentrância (re-init vaza
  o canal anterior).
Correção: guard if(channel) return; e pagehide → channel.close().
```
```
[TOP-F08] | 🟢 BAIXO | keydown globais acumulam
Local: js/keeper-notes-ui.js:1090; keeper.js:620; investigator.js:620; keeper-tabs.js:61
Problema: addEventListener("keydown") com handler anônimo nunca removido; se init() rodar 2× (auto+manual)
  os atalhos disparam em dobro.
Correção: flag de idempotência em init() ou registrar listeners uma vez em escopo de módulo.
```
```
[SH-L4] | 🟢 BAIXO | ImageBitmap sem close no caminho de erro
Local: js/shared/media-picker.js:115
Problema: se o ctx 2d falhar, o ImageBitmap nativo não é close()-ado.
Correção: if (bmp.close) bmp.close(); antes de lançar.
```

### 2.6 — Erros engolidos / promises

```
[SH-E1] | 🟡 MÉDIO | saveBlob falho confundido com cancelamento
Local: js/shared/media-picker.js:171-177
Problema: store.saveBlob falsy → return null (igual a "cancelado"), sem toast de erro.
Correção: distinguir id ausente de cancelamento; toast se !id.
```
```
[TOP-F07] | 🟢 BAIXO | escapeHtml sem coerção de string
Local: js/keeper-notes-advanced.js:412-421
Problema: text.replace sem String(...); valor de campo numérico/objeto lança TypeError no export/wikilink.
Correção: String(text==null?'':text).replace(...).
```
```
[TOP-F09] | 🟢 BAIXO | Promise sem catch no lightbox
Local: js/keeper-journal.js:154
Problema: getBlob().then(...) sem .catch → unhandled rejection em falha de IndexedDB.
Correção: .catch(...) com toast/ignore.
```
```
[L-06] | 🟢 BAIXO | bus.publish aborta demais subscribers se um lança
Local: js/core/bus.js:17-21
Problema: forEach sem try/catch; subscriber que lança impede os seguintes (ex.: erro de render bloqueia
  persistência).
Correção: try/catch por listener, logando e continuando.
```
```
[L-11] | 🟢 BAIXO | executor:payload-warning sem subscriber
Local: js/core/executor.js:44-50
Problema: aviso de validação publicado mas ninguém escuta → degradação "graciosa" vira swallow silencioso.
Correção: console.warn em dev no !validation.valid, ou subscriber padrão que loga.
```

### 2.7 — Dados / consistência / código morto

```
[TOP-F10] | 🟢 BAIXO | Nome de perícia obsoleto "Nadar"
Local: data/occupations.js:224 (Soldado: "Escalar | Nadar")
Problema: renomeação canônica Nadar→Natação; ocupação ainda referencia "Nadar" (sem base resolvível).
Correção: "Escalar | Natação".
```
```
[TOP-F12] | 🟢 BAIXO | type "firearm" some no editor Full
Local: js/keeper.js:20,553 + bestiary/npc-archetypes
Problema: ATK_TYPE_LABELS só mapeia melee/ranged/special; abrir criatura com firearm no editor Full
  reseta o tipo para melee ao salvar.
Correção: adicionar firearm: "Arma de fogo" (e normalizar dados).
```
```
[TOP-F03] | 🟡 MÉDIO | DB sem sinal em parte do bestiário
Local: data/bestiary.js:441,464,487,510,533,555,578,647
Problema: derived.db ora "1D4" ora "+1D4"; tiles/compêndio mostram o valor verbatim → inconsistência.
Correção: normalizar todos para a convenção sinalizada ("+1D4", "+12D6").
```
```
[TOP-F05/V-14/V-16/L-02] | 🟢 BAIXO | Código morto/órfão
Local: investigator.js:469-485,449,1186 (getSkillValue/rollAttribute/refreshSkillBadges/applyMobileTab
  nunca chamados); views/skills.js:564 (_toggleOccupationSkill nunca chamado); views/wizard.js:110-114
  (parâmetro sel sombreado/inerte); core/actions.js:65-66,141-142 (ADD_ITEM/REMOVE_ITEM sem reducer/ontologia)
Correção: remover símbolos/parâmetros mortos ou documentar como deprecados.
```
```
[TOP-F11/L-05] | 🟢 BAIXO | Floor de PV inconsistente / magic numbers
Local: js/keeper.js:638,700,1050,1058 (HP floor -10) vs js/investigator.js:31 (PV_MIN=-2);
  caps 75/90 espalhados (coc7e-rules, validators, ui-components)
Problema: comportamento de HP negativo difere entre Keeper e investigador; sem constante única.
Correção: extrair HP_FLOOR/caps de regra para constantes compartilhadas.
```
```
[SH-B3] | 🟡 MÉDIO | Dead branch em ratioToLevel
Local: js/shared/sanity-fx.js:97-103
Problema: após garantir ratio<0.5, o último limiar (max:0.50) sempre casa → o return "lucid" final é
  inalcançável.
Correção: remover o return morto ou ajustar o guard.
```

> **Verificado limpo (não-achados):** `sw.js` PRECACHE_URLS 100% em sincronia com os 91 arquivos referenciados (e `skipWaiting` ausente é intencional); sem IDs/nomes duplicados em bestiary/skills/occupations/weapons/npc; `damage-bonus-table.js` contíguo e correto; `mini-md.js` seguro contra XSS (escape-primeiro consistente em todos os call-sites); precedência do Shunting-Yard para `+ - * /` correta; regra D100 00,0=100 correta; chave Supabase é **publishable** (pública por design) e RLS server-side é robusta; eventos de peer **nunca** alcançam o executor (limita o raio de CMP-A1). `dispatch.js`/`lifecycle.js` são stubs intencionais.

> **Perguntas abertas (sinalizadas, não erros):** fluxo de import de personagem em `investigator.js` decide a severidade real de STOR-01; `_meta.journalCollapsed` pode ser carve-out intencional de UI (V-10); confirmar se exports `getDomain/isKnown/getTypes` (campaign-ontology) têm uso só em testes antes de remover.

---

## Parte 3 — Plano de Ação Priorizado

### Quick wins (alto impacto, baixo esforço) ⭐

| Prio | Achado | Esforço | Impacto |
|---|---|---|---|
| 1 ⭐ | **V-01/V-03/F06/CMP-V1** — escapar ícones/`shots`/`e.text`/vitais de peer (`_esc`/`Number`) | Baixo | Crítico (fecha XSS) |
| 2 ⭐ | **C-01** — adicionar ações faltantes a `PERSIST_ACTIONS` (ou derivar da ontologia) | Baixo | Crítico (perda de edições) |
| 3 ⭐ | **C-02** — registrar `ADD_MYTHOS`/`RECALC_DERIVED` em `actions.js` + `SACRED` | Baixo | Alto (autoridade sacred) |
| 4 ⭐ | **F02** — corrigir `damage` do shoggoth `"+5D6 (DB)"`→`"+5D6"`; **F10** `Nadar`→`Natação` | Baixo | Alto (dano 2×) / Baixo |
| 5 ⭐ | **F01/RULES-04** — remover fallbacks `Math.random` (usar padrão crypto do repo) | Baixo | Alto (constituição) |
| 6 ⭐ | **DICE-01** — normalizar `dbValue` em `rollNotation`; **V-07** — `ammo:0`; **V-06** — aviso de notação inválida | Baixo | Alto |
| 7 ⭐ | **SH-L2/SH-L1** — remover `escHandler`/fechar `BroadcastChannel` | Baixo | Médio (leaks) |
| 8 ⭐ | **M-02/M-03** — coerção `Number(...)||0` nos reducers de vitais + `schema.js` | Baixo | Médio (corrupção NaN) |
| 9 ⭐ | **B4** — guardas `result.warnings/issues = ... || []` | Baixo | Médio (TypeError) |
| 10 ⭐ | **SH-P1** — montar índice de busca uma vez no `open()` | Baixo | Alto (perf por tecla) |

### Correções pontuais (esforço médio)

| Prio | Achado | Esforço | Impacto |
|---|---|---|---|
| 11 | **CMP-A1/CMP-L4** — usar `hostPeerId` para validar eventos host-only | Médio | Alto (DoS/integridade) |
| 12 | **CMP-P1** — rate-limit em `join_campaign` | Médio | Alto (brute-force) |
| 13 | **C-03** — corrigir limiar de morte imediata (`net ≥ maxHP`) | Médio | Alto (regra) |
| 14 | **V-07/V-08** — unificar `_getSkillValue`; **V-09/V-13** — clamp/Math.abs em tomos/vitais | Médio | Médio |
| 15 | **STOR-02/03** — quota IDB → `type:"quota"`; flush síncrono no exit | Médio | Alto (perda de dados) |
| 16 | **CMP-R1..R3/O2/O3** — limpar subscriptions/timer/sessão no leave; lock+retry de drain | Médio | Médio |
| 17 | **TOP-F04** — encounter por `_encId` em vez de `sourceId` | Médio | Médio |
| 18 | **V-12/F08** — capar `_seen`; idempotência de `init()` | Baixo | Médio (leaks) |

### Mudanças estruturais (esforço alto, dívida de fundo)

| Prio | Achado | Esforço | Impacto |
|---|---|---|---|
| 19 | **C-01/C-02/L-01..L-03** — fonte única: derivar `PERSIST_ACTIONS`/`SACRED`/`RENDER_MAP` da ontologia | Alto | Alto (elimina toda a classe de drift) |
| 20 | **V-10/M-06** — rotear identidade/antecedentes/dinheiro por ações event-sourced | Alto | Médio (integridade do log/sync) |
| 21 | **M-05/M-08/L-09** — persistir 1×/transação; gerar ids/timestamps fora do reducer; early-return idempotente | Alto | Médio (perf + replay determinístico) |
| 22 | **STOR-01** — separar versão de envelope vs dados no import/export | Alto | Crítico (perda de dados) |
| 23 | **F03/F11 + magic numbers** — centralizar constantes de regra (caps, HP_FLOOR, DB) | Médio | Médio (consistência) |

---

## O que NÃO foi avaliado (e por quê)

- **HTML/CSS** (`*.html`, `css/*`) — fora do escopo JS desta varredura; recomenda-se auditar CSP/inline handlers e os pontos de `innerHTML` nas próprias páginas.
- **`js/vendor/`** (signals-core, supabase) — código vendorizado, "nunca editar"; não auditado por contrato.
- **Configuração Supabase fora do repo** — "Anonymous sign-ins", políticas de projeto e rate-limits de plataforma não são verificáveis pelo código; a segurança de CMP-P1/CMP-A1 depende parcialmente disso.
- **Testes** (`js/tests/*`) — não auditados quanto a cobertura linha-a-linha; recomenda-se medir cobertura nos caminhos críticos (reducers de vitais, migrações de `storage.js`, parser RPN).
- **Comportamento runtime** — auditoria estática; bugs dependentes de timing (CMP-O1..O3, STOR-03) precisam de reprodução em browser para confirmação definitiva.
