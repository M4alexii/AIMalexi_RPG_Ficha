# Auditoria Residual — 2026-06-10

> Subordinado a [`DIRETRIZ_OFICIAL_V1.md`](DIRETRIZ_OFICIAL_V1.md).
> Verificação feita contra `main@4f9be40`. Contexto: uma auditoria full stack
> externa foi conduzida sobre uma base antiga (`7c90dd7`, 2026-05-29); a maior
> parte dos achados daquela época **já tinha sido resolvida** pela evolução do
> projeto (M1 reativo vivo, suíte de 21 testes no CI, multiplayer Supabase,
> validação no boot/persist). Este documento registra apenas o **resíduo
> verificado** — o que ainda era verdadeiro em `4f9be40` — e o que foi feito.

## Corrigido no PR desta auditoria

| # | Achado verificado em `4f9be40` | Arquivo | Correção |
|---|---|---|---|
| 1 | **Empala incompleto**: `rollDamage` parava no dano máximo; faltava a rolagem extra da arma (PDF Cap. 6, p. 104). O regex de constantes ainda perdia DB plano (`-2`) e errava dados multi-dígito (`+10D6`) | `js/engine/dice.js` | Máx(arma+DB) + rolagem extra (sem DB); constantes por diferença exata. Faixa 9–12 do exemplo do livro confirmada em teste |
| 2 | **XSS no roll log**: `e.target`, `e.d100` e `e.level` interpolados em `innerHTML` sem `escapeHtml` | `js/shared/ui-components.js` (`appendRoll`) | Tudo escapado; o span intencional de "insuf." é anexado APÓS o escape do texto-base |
| 3 | **`validateCharacter` não validava fichas**: só aceitava skills em array (criaturas). A ficha usa objeto — o cap 75/90 não rodava nem com o wiring do BUG-01 | `js/engine/coc7e-rules.js` | Normaliza as duas formas; Nível de Crédito com teto próprio (99); atributos 0 (não rolados) sem ruído |
| 4 | **Boot IDB sequencial**: `await idbGet` por chave = 1 round-trip por entrada | `js/engine/storage.js` (`loadAllFromIDB`) | `Promise.all` — ordem e semântica de erro preservadas |

Cobertura adicionada: empala em `js/tests/test-dice.js` (4 cenários de faixa
exata), `validateCharacter` em `js/tests/test-rules.js` (objeto/array/Crédito/
zeros/null). Suíte: **971 asserções verdes**.

CI ganhou o job `integrity` (sintaxe de todos os .js, manifest, precache do SW,
referências dos HTML — anti-regressão direta do bug do banner `cc75117`).

## Verificado e AINDA em aberto (não bloqueante)

1. **Ícone do PWA é emoji em data-URI** (`manifest.json`). Alguns Android
   geram ícone ruim ou recusam instalar. Fix: gerar PNG 512×512 + 192×192
   reais (asset binário — fazer em mudança própria).
2. **Sem Content-Security-Policy** nos HTML. Com Supabase em produção
   (`js/config.js`), uma meta CSP com `default-src 'self'` + allowlist do
   host Supabase reduziria a superfície. Medir o que quebra antes (CDN do
   Supabase SDK, data-URIs de imagem).
3. **Duas abas locais com o mesmo personagem** ainda se sobrescrevem
   (last-write-wins silencioso). O BroadcastChannel existente
   (`js/campaign/transport.js`) é da campanha, não resolve o caso local
   single-player. Mínimo viável: detectar segunda aba e avisar.
4. **`flushPending` em `pagehide`** segue best-effort no IDB (janela ≤150ms
   de perda em kill do processo). Conhecido/aceito; reavaliar com dados.
5. Backlog de regras de jogo: segue em [`TODO_AUDIT_CoC7e.md`](TODO_AUDIT_CoC7e.md)
   (itens 4–17 — dano→HP, iniciativa, munição, armadura, range bands etc.).

## Lições registradas (por que os achados sobreviveram tanto tempo)

- **"Wired ≠ funcionando"**: o BUG-01 conectou `validateCharacter` ao
  boot/persist, mas a função não suportava a forma de dados da ficha — o check
  passou a "rodar" sem validar nada. Teste de comportamento (não de wiring) é
  o que pega isso; agora existe.
- **"Commit diz que corrigiu ≠ corrigiu"**: o empala foi dado como corrigido
  em `e1e4f36` ("faltava a rolagem extra"), mas o código não rolava a extra.
  Regra prática: fix de regra de jogo entra com teste que trava a FAIXA de
  valores do exemplo do livro.
- **Interpolação de HTML é vulnerabilidade dormente**: inofensiva no
  single-player, vira vetor entre usuários no momento em que a campanha
  multiplayer liga. Escapar sempre, desde o primeiro dia.
