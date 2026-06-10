# Guia do Usuário — Notas Avançadas do Guardião

O sistema de notas da aba **📝 Notas Avançadas** (em `keeper.html`) é um
caderno estilo Obsidian/Notion para o Mestre: wikilinks, backlinks, busca com
operadores, pastas, timeline, lixeira, versionamento e campos customizados.
Tudo funciona **offline** — os dados ficam no seu navegador.

---

## Começando em 1 minuto

1. Abra o **Centro de Campanha** (`keeper.html`) → aba **📝 Notas Avançadas**.
2. Clique em **+ Nova Nota** (ou `Ctrl+N`).
3. Digite o título e o conteúdo. Tudo salva automaticamente.
4. Para ligar duas notas, digite `[[` no conteúdo — um autocomplete sugere
   as notas existentes.

## Modelos prontos

Clique em **📋 Modelos** para criar notas pré-estruturadas, já com tags e
campos:

| Modelo | Tags | Campos prontos |
|---|---|---|
| PNJ | `#npc` | PV, SAN, Ocupação |
| Local | `#local` | Região |
| Encontro | `#encontro` | Dificuldade |
| Mistério | `#misterio` | — |
| Sessão | `#sessao` | Data da Sessão |

## Wikilinks e Backlinks

- `[[Velho Castro]]` → vira um link clicável para a nota com esse título.
- `[[Velho Castro|o ancião]]` → mesmo link, com texto customizado.
- O painel **🔗 Referências** mostra automaticamente quais notas mencionam a
  nota aberta (backlinks).
- Link para nota inexistente aparece marcado como quebrado.

## Busca com operadores

Use a caixa de busca (`Ctrl+K`) com qualquer combinação (E lógico implícito):

```
tag:pista                  → notas com a tag #pista
folder:ato1                → notas em pastas contendo "ato1"
campo:PV                   → notas que têm o campo PV
campo:PV=12                → notas cujo campo PV contém "12"
created:>2026-01-01        → criadas depois dessa data
updated:<7d                → editadas nos últimos 7 dias (d/w/m/y)
"casa mal-assombrada"      → frase exata
-ritual                    → exclui notas contendo "ritual"
boston tag:misterio -culto → combinação livre
```

## Modos de visualização

Os 4 botões acima da lista trocam a visualização:

- **📄 Lista** — todas as notas, com tags e data.
- **📁 Pastas** — agrupadas pelo campo *Pasta* (use `/` para subpastas, ex.:
  `Ato 1/Mansão Corbitt`).
- **📅 Timeline** — agrupadas por dia de edição, mais recente primeiro.
- **🗑️ Lixeira** — notas removidas (veja abaixo).

## Campos customizados

Cada nota pode ter pares **chave = valor** (seção *Campos* no editor):
PV, SAN, Dificuldade, Região… o que quiser. Use **+ Campo** para adicionar e
**✕** para remover. Eles aparecem na busca (`campo:chave=valor`) e na
tabela do export Markdown.

## Lixeira (30 dias)

- **🗑️ Remover** manda a nota para a Lixeira — ela some das listas, da busca
  e dos wikilinks, mas pode ser **restaurada por 30 dias**.
- Na view 🗑️: **♻️ Restaurar** ou **✕ Apagar de vez** (irreversível).
- Notas com mais de 30 dias na lixeira são apagadas automaticamente.

## Histórico de versões

Toda edição de conteúdo guarda um snapshot (até 10 por nota). Clique em
**🕐 Histórico** no editor para ver versões anteriores e **restaurar**
qualquer uma — a versão atual vira snapshot, então nada se perde.

## Acesso rápido e atalhos

- **⚡ Acesso Rápido** — as 3 últimas notas abertas ficam no topo da lista.
- `Ctrl+K` / `Cmd+K` — focar a busca
- `Ctrl+N` / `Cmd+N` — nova nota
- `Esc` — limpar a busca

## Integração com o Dashboard

No painel de **Investigadores**, cada card tem um botão **📝** que abre (ou
cria) o dossiê do Guardião sobre aquele personagem — já na pasta
`Investigadores`, com a tag `#investigador`.

## Export, backup e import

No menu **💾 Exportar** da lista:

- **📝 MD (todas)** — todas as notas num único arquivo Markdown.
- **📦 JSON (backup)** — backup completo (recomendado periodicamente).
- **📂 Importar MD** — importa um arquivo `.md`: títulos `#`/`##` viram
  notas separadas; `---` também separa notas.

No editor, **📥 Exportar** baixa só a nota aberta (com campos e backlinks).

## Onde os dados ficam? (e limites)

- Armazenamento local do navegador (`localStorage`, chave
  `aimalexi-rpg/keeper-notes-v1`). Não há sincronização entre dispositivos
  (planejada para a fase de multiplayer durável).
- Limpar os dados do site no navegador **apaga as notas** — faça backup JSON
  antes de qualquer limpeza.

## Solução de problemas

| Sintoma | O que verificar |
|---|---|
| Wikilink não vira link | O título precisa bater com uma nota existente (maiúsculas/minúsculas não importam) |
| Busca não acha nada | Confira a grafia; notas na lixeira não aparecem |
| Autocomplete não abre | Digite `[[` seguido de pelo menos 1 letra de um título existente |
| Notas sumiram | Veja a 🗑️ Lixeira; se limpou os dados do navegador, restaure de um backup JSON |
