# Plano: Auditoria & Evolução UI/UX — Ficha do Investigador (AIMalexi RPG)

**Created:** 2026-06-16
**Goal:** Elevar a UI/UX da ficha (já funcional) sem redesign, corrigindo legibilidade, contraste multi-tema, navegação e consistência através de uma camada de tokens.
**Repo:** `AIMalexi_RPG_Ficha` · arquivo central `investigator.html` · GitHub Pages
**Onde salvar no repo:** `docs/plans/2026-06-16-ui-ux-ficha-investigador.md`

---

## Sumário Executivo (TL;DR)

A base visual é **forte e coesa** — a direção "arquivo de investigador anos 1920" funciona, a paleta tem personalidade, a hierarquia de títulos serif (Cormorant Garamond) está correta. **Nenhum problema exige redesign.** São quase todos de **calibração**, resolvíveis na camada de tokens.

**Três alavancas, em ordem de retorno:**

1. **[CRÍTICO] Piso de contraste na derivação de cores.** O motor de temas deriva tons intermediários automaticamente, sem garantir legibilidade. Resultado: texto secundário e estados vazios somem em vários dos 13 temas. Uma função `corSegura()` blinda todos os temas **e** o customizador de uma vez. É o maior leverage do projeto.
2. **Escala tipográfica fluida.** Resolve a queixa de "fonte pequena" em qualquer resolução, sem tocar componente a componente.
3. **Anti-uppercase no corpo + escala de spacing.** Recupera legibilidade serif e elimina o desalinhamento "quase certo".

**Princípio-guia:** corrigir na **camada de tokens/derivação**, nunca em valores soltos. Respeita a governança (AGENTS.md), as fontes vendoradas e a paleta SVG existente.

---

## Contexto & Restrições

| Item | Detalhe |
|---|---|
| Tipo de app | PWA offline-first, Call of Cthulhu 7e |
| Superfícies auditadas | Wizard "Criador de Investigadores" (7 etapas) · Ficha (6 tabs: Personagem, Perícias, Combate, Inventário, Diário, Log) · Drawer "Ações" · Motor de Temas (13 swatches) · Modal "Ficha Personalizada" |
| Fontes (vendoradas) | **Crimson Pro** (leitura/corpo) · **Cormorant Garamond** (títulos) — ambas serif |
| Sistema de cor | Tokens base + **derivação automática** de tons intermediários (bordas, brilhos, texto secundário) |
| Governança | Processo formal via AGENTS.md · commits temáticos PT-BR · disciplina de cache |
| Resolução de teste | ~1920px (Full HD) — relevante para o diagnóstico de tipografia |

---

## DESCOBERTAS & ANÁLISES

Consolidado por eixo. Formato: **Observação → Diagnóstico → Impacto**.

### Eixo 1 — Cor, Contraste & Motor de Temas `[CRÍTICO]`

- **Observação:** o modal admite que tons intermediários são derivados das cores-base. Nos prints, temas escuros (azul, roxo, sépia-escuro, verde-escuro) fazem o texto secundário e o estado vazio quase desaparecerem; temas claros (bege) lavam o secundário. Só o verde padrão está equilibrado (calibrado à mão).
- **Diagnóstico:** a derivação não tem **piso de contraste**. Deriva por opacidade/mistura sem medir o resultado contra o fundo. WCAG AA não é garantido em nenhum tema que não foi ajustado manualmente.
- **Impacto:** legibilidade quebra em ~70% dos temas oferecidos. É a causa-raiz que amplifica a queixa de "fonte pequena" — pequeno **+** baixo contraste = texto que some.

### Eixo 2 — Tipografia

- **Observação:** tabs e labels em ~12–13px; uppercase + letter-spacing aplicado de forma ampla, inclusive em texto corrido e itens longos.
- **Diagnóstico:** três fatores combinados. (a) Tamanho base fixo, sem escala responsiva → pequeno em 1920px. (b) Uppercase reduz velocidade de leitura ~10–15% e piora em corpo pequeno. (c) **Cormorant Garamond** em corpo pequeno + uppercase + tracking é o pior caso de legibilidade serif.
- **Impacto:** esforço de leitura elevado nas tabs e labels; a intuição do usuário ("fontes deveriam ser maiores") está correta, mas a causa é composta, não só tamanho.

### Eixo 3 — Layout & Proporção

- **Observação:** uso inconsistente do espaço entre tabs. Perícias e Personagem aproveitam bem; Diário e o Arsenal vazio deixam metade da tela morta.
- **Diagnóstico:** falta de `max-width` consistente e centralizado; estados vazios ocupam cards gigantes.
- **Impacto:** sensação de desequilíbrio e "tela perdida" em telas grandes nas tabs de baixa densidade.

### Eixo 4 — Componentes & Interação

- **Observação:** controles `-1/+1/-x` e mini-ícones de dado/favorito muito abaixo de 24px. Feedback de input inconsistente no wizard.
- **Diagnóstico:** alvos de toque insuficientes — crítico para PWA/mobile. Estados de input não padronizados.
- **Impacto:** dificuldade de toque no celular; inconsistência visual nos formulários.

### Eixo 5 — Navegação / Drawer "Ações"

- **Observação:** lista vertical plana — todos com o mesmo peso. A paleta de temas estava embutida sob **"EFEITOS"** (a mesma seção de efeitos de insanidade).
- **Diagnóstico:** ausência de agrupamento; nomenclatura confusa — trocar paleta é *aparência/tema*, não *efeito*.
- **Impacto:** navegação mais lenta; risco de colisão semântica com o Sanity Engine.

### Eixo 6 — Customizador (Ficha Personalizada)

- **Observação:** feature forte (5 cores + 2 fontes). Mas: sem aviso de contraste; sem preview dentro do modal.
- **Diagnóstico:** o usuário pode escolher texto cinza sobre fundo cinza e quebrar a própria ficha sem nenhum feedback.
- **Impacto:** feature poderosa que permite produzir resultados ilegíveis silenciosamente.

---

## MATRIZ DE PRIORIDADE

| ID | Item | Eixo | Prioridade | Esforço | Status |
|----|------|------|:---:|:---:|:---:|
| T-01 | Tokens fluidos (--fs-nav, --content-max) + font-size clamp | 2,7 | **P0** | B | ✅ FEITO |
| T-02 | `corSegura()` — piso de contraste na derivação | 1 | **P0** | M | ✅ FEITO |
| T-03 | Remover uppercase de labels ultra-pequenos (<0.72rem) | 2 | **P0** | B | ✅ FEITO |
| T-04 | Subir tabs (--fs-nav fluido) | 2 | **P0** | B | ✅ FEITO |
| T-05 | Alvos de toque ≥24px desktop / ≥44px mobile (derived-actions) | 4 | **P0** | B | ✅ FEITO |
| T-07 | Reagrupar Drawer + separar "Aparência" de "Efeitos" | 5 | **P1** | M | ✅ FEITO |
| T-08 | `--content-max` centralizado | 3 | **P1** | B | ✅ FEITO |
| T-13 | Indicador visual de tab ativa além da cor (border-top) | 4 | **P2** | B | ✅ FEITO |
| T-06 | Badge contraste AA no customizador | 1,6 | **P1** | M | TODO |
| T-09 | Redesenhar estados vazios | 3 | **P1** | B | TODO |
| T-10 | Hex visível + preview no modal | 6 | **P2** | M | TODO |
| T-11 | Rótulo/nome do tema nos swatches | 5 | **P2** | B | TODO |
| T-12 | Aplicar spacing 4/8px de forma consistente | 7 | **P2** | M | TODO |
| T-14 | Badges de dificuldade do wizard mais visíveis | 4 | **P2** | B | TODO |

---

## APÊNDICE A — Escala Tipográfica de Referência

```css
:root {
  font-size: clamp(15px, 0.45vw + 13px, 18px);   /* fluido: 15px@768px → 18px@1400px */
  --fs-nav: clamp(0.82rem, 0.78rem + 0.2vw, 0.95rem);
  --content-max: 1180px;
}
```

**Regra de uppercase:** permitido apenas em `--text-sm` (0.78rem) e acima. Proibido em labels de 0.6–0.65rem.

## APÊNDICE B — Lógica `corSegura()` (implementada em theme-custom.js)

```text
contrast(c1, c2) -> (Lmax + 0.05) / (Lmin + 0.05)

corSegura(bgHex, candidateHex, target = 4.5):
    if contrast(bg, candidate) >= target: return candidate
    dark = luminance(bg) < 0.5
    while contrast(bg, cur) < target and not saturated:
        cur = shade(cur, dark ? +step : -step)
    return cur
```

**Aplicação em apply():**
- `--ink-dim` → `corSegura(bgCard, inkDim, 4.5)` — garante AA texto secundário
- `--ink-faded` → `corSegura(bgCard, rawFaded, 3.0)` — garante 3:1 UI/large

---

## Notas de Governança

- Toda mudança passa pelo fluxo do AGENTS.md.
- Fontes permanecem **vendoradas** — nenhuma dependência externa nova.
- Mudança de CSS exige **bust de cache** do asset (PWA offline) — SW bumped para v110.
- Labels diegéticos novos via **i18n PT-BR**, nunca hardcoded.
