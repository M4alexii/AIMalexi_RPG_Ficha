# Personalização & Modos — Spec Consolidada V1
**2026-06-11 · Consolida as 2 specs do proprietário: camadas de personalização + modos simples/avançado**

> Princípio-guia (do proprietário): *"O jogador consegue jogar uma campanha inteira sem abrir
> Excel, PDF, bloco de notas ou livro."* Personalizar aparência **sem permitir quebrar a
> legibilidade** numa sessão de 4–8h.

---

## Status de implementação

### ✅ Já entregue (PRs #38–#40 + esta branch)

| Item da spec | Onde está |
|---|---|
| Tokens de tema (`--background/--card/--border/--text-*/--success/--warning/--danger/--accent`) | `css/theme.css` `:root` — nomenclatura própria (`--bg-*`, `--ink-*`, `--ok/--warn/--err`, `--accent`, `--line`, `--on-accent`) |
| Tema claro/escuro | Tema **Arquivo** (claro) + 8 escuros; `color-scheme` correto por tema |
| Estrutura AIMalexi como padrão | `:root` = paleta da spec (fundo `#1B1A17`, cards `#26231F`, ação `#556B2F`, alerta `#C69C4D`…) |
| Temas prontos de CoC | 10 presets: Arkham (padrão), Clássico (dourado original), Lovecraft, Cosmic, Arquivo, Miskatonic, Sépia, Obsidian, Eldritch, Custom |
| Escolha de fonte (leitura × temática separadas) | Editor 🎨: corpo (Crimson/Inter/Atkinson Hyperlegible/Courier/Special Elite/sistema) + títulos (Cormorant/Libre Baskerville/Cinzel/IM Fell) |
| Escala de elementos 85–130% | ⚙️ Configurações → slider `fontScale` |
| Tamanho da interface (Compacta/Normal/Confortável) | ⚙️ Configurações → densidade (3 níveis) |
| Cor automática da SAN (verde→âmbar→vermelho→**roxo insano**) | `body[data-sanity]` × `--san-state-*` |
| Evolução da loucura na interface (vinheta/grão/cromática/flicker) | `sanity-fx.js` — ativo por padrão, 3 modos de acessibilidade |
| Wizard de criação (Conceito→Personagem→Atributos→Ocupação→Equipamento→História→Resumo) | `js/views/wizard.js` — já cobre os 6 passos da spec |
| Alto contraste / reduzir movimento | ⚙️ Configurações (toggles) |
| Cor de destaque custom | ⚙️ accent override + editor 🎨 completo (5 cores + derivação por luminância) |

### 🔶 Parcial

| Item | O que falta |
|---|---|
| Perícias favoritas | Existe marcação automática p/ evolução (`skill-mark`); falta "favoritar" manual + "Top 10 mais usadas" no topo |
| Busca global | Existe busca de perícias e Ctrl+K nas Notas do Keeper; falta busca global da ficha (perícias+itens+notas+magias) |
| Histórico de SAN | Event-log registra perdas; falta UI narrativa ("−5 SAN · Ao ver o ritual") com motivo capturado no momento da perda |
| Atalhos de veterano | Enter confirma em modais; falta duplo-clique = rolar, Ctrl+K global |

### ✅ Entregues em 2026-06-11 (PRs #41–#47 + branch coc-sheet-design)

1. **Layout adaptativo (Modo Jogador / Investigador)** — PR #42.
2. **Busca global (Ctrl+K)** — PR #43.
3. **Histórico narrativo de SAN** — PR #44.
4. **Favoritos de perícias** — PR #45 (ordenação por uso ainda pendente).
6. **Modo de sessão (Investigação/Combate)** — PR #46.
7. **Modo Imersão** — PR #47.
8. **Fundo customizável com textura + opacidade** — ⚙️ → 🎨 Aparência (teto 0.35 de opacidade).
9. **Estilo dos cards + bordas** — Arcano (padrão atual)/Moderno/Arquivo/Máquina;
   bordas Vintage/Runas/Art Déco via border-image SVG.
10. **Temas extras**: Noir, Hospital Psiquiátrico, Agência Federal.
11. **Molduras de avatar** + token/silhueta (`_meta.avatarFrame/Shape`).
12. **Sistema visual de anotações** (Caderno/Dossiê/Diário/Máquina).
13. **Som ambiente visual** (`js/shared/ambient-fx.js`, off por padrão).

### ⬜ A fazer

5. **Cards reorganizáveis** (drag & drop da ordem das seções, persistido).
14. **Perfil compartilhável** (link público da ficha — depende de decisão de backend/Supabase).
- "Top 10 mais usadas" (ordenação de perícias por contagem de uso).
- *Modo Keeper* como terceiro modo da ficha (hoje coberto pelo keeper.html).

## Diretrizes de implementação

- **Tudo via tokens**: qualquer feature visual nova lê variáveis do tema, nunca cor fixa.
- **Camada funcional ≠ camada temática**: densidade/escala/fonte de leitura ficam em
  ⚙️ Configurações (afetam jogabilidade); cores/fontes temáticas/estilos ficam no editor 🎨.
- **Legibilidade blindada**: presets e o editor custom não podem produzir contraste < 3:1
  em texto de jogo (validação automática de luminância já existe no editor; estender aos
  futuros fundos texturizados via teto de opacidade).
- **Modos não escondem dados, reorganizam**: alternar Jogador↔Investigador nunca pode
  perder informação, apenas re-priorizar (progressive disclosure).
- Varredura de contraste automatizada (Puppeteer) roda a cada mudança de paleta — manter 0
  elementos <3:1 nas 5 páginas.
