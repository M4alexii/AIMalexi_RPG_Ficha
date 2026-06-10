/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/keeper-tour.js
   Tutorial guiado do Guardião — paridade de onboarding com o Investigador
   (que tem o wizard de criação). Roda UMA vez na primeira visita; pode ser
   revisto pelo botão "❓ Tour" da toolbar.

   Usa CoC.ui.guidedTour (js/shared/guided-tour.js). Os textos são estáticos
   e escritos aqui (HTML controlado pelo app — sem conteúdo de usuário).
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  function showTab(name) {
    return function () {
      var btn = document.querySelector('.keeper-tab[data-ktab="' + name + '"]');
      if (btn) btn.click();
    };
  }

  function buildTour() {
    var tourFactory = window.CoC && window.CoC.ui && window.CoC.ui.guidedTour;
    if (!tourFactory) return null;

    return tourFactory({
      id: "keeper-v1",
      steps: [
        {
          target: null,
          title: "🕯️ Bem-vindo, Guardião",
          body: "Este é o seu <b>Centro de Campanha</b> — bestiário, encontros, " +
                "investigadores conectados, lore e diário, tudo em uma tela. " +
                "Em ~60 segundos você conhece cada mesa de trabalho. " +
                "(Esc pula; ←/→ navegam.)"
        },
        {
          target: "#keeper-overview",
          title: "📊 Visão de 10 segundos",
          body: "O painel executivo mostra a saúde da campanha de relance: " +
                "investigadores <b>vivos</b>, <b>SAN média</b>, alertas críticos " +
                "e os últimos eventos. Se algo está vermelho aqui, merece sua atenção."
        },
        {
          target: "#keeper-tabs",
          title: "🗂️ As 7 mesas de trabalho",
          body: "Cada aba é um contexto: <b>Investigadores</b> (campanha ao vivo), " +
                "<b>Compêndio</b> (regras), <b>NPCs</b> (bestiário), <b>Encontro</b> " +
                "(combate), <b>Timeline</b>, <b>Lore</b> e <b>Diário</b>. " +
                "A última aba aberta é lembrada."
        },
        {
          target: '.ktab-panel[data-ktab="investigadores"]',
          title: "👥 Campanha multiplayer",
          before: showTab("investigadores"),
          body: "Crie uma campanha e compartilhe o <b>PIN de 6 dígitos</b> — os " +
                "jogadores entram pela ficha deles e os vitais aparecem aqui " +
                "<b>em tempo real</b>. Funciona offline; sincroniza quando a rede volta."
        },
        {
          target: "#library-list",
          title: "📚 Biblioteca de criaturas",
          before: showTab("npcs"),
          body: "Bestiário do Mythos pronto + suas criaturas salvas. " +
                "<b>Clique</b> em uma para abri-la na mesa de trabalho ao lado. " +
                "🎲 <b>NPC Aleatório</b> (toolbar) gera um figurante em 1 clique."
        },
        {
          target: "#workspace",
          title: "⚔️ Mesa de trabalho",
          before: showTab("npcs"),
          body: "A criatura aberta vive aqui. No <b>Modo Simples</b>: clique no " +
                "card de um <b>ataque</b> para rolar acerto + dano de uma vez; " +
                "clique num atributo para teste de resistência. O <b>Editor " +
                "Completo</b> libera tudo para customizar."
        },
        {
          target: '.ktab-panel[data-ktab="encontro"]',
          title: "🩸 Encontro",
          before: showTab("encontro"),
          body: "Adicione criaturas ao encontro e gerencie o combate: " +
                "<b>HP editável</b>, contador de <b>rounds</b>, marcação de mortos. " +
                "É o seu tabuleiro mental — sem mapa, sem fricção."
        },
        {
          target: '.ktab-panel[data-ktab="lore"]',
          title: "🗺️ Lore da campanha",
          before: showTab("lore"),
          body: "Facções, mistérios, locais, pistas, personagens e cronologia — " +
                "cada caixa salva sozinha. Sem ideias? O <b>🧰 Pacote Padrão</b> " +
                "preenche a estrutura inicial sem apagar nada seu."
        },
        {
          target: '.ktab-panel[data-ktab="diario"]',
          title: "📔 Diário — seu Obsidian de mesa",
          before: showTab("diario"),
          body: "Tópicos com <b>pastas</b>, <b>imagens</b> e <b>Markdown</b> " +
                "(#títulos, **negrito**, listas, - [ ] checklists). Ligue tópicos " +
                "com <b>[[Nome do Tópico]]</b> — cada tópico mostra quem o menciona " +
                "(<b>backlinks</b>) e a 🔍 busca encontra qualquer coisa."
        },
        {
          target: "#btn-keeper-tour",
          title: "❓ Para rever este tour",
          body: "É só clicar aqui. E o <b>guia de mestre</b> com técnicas de " +
                "horror (regra das 3 pistas, quando NÃO pedir teste) está no " +
                "Guia do Iniciante, seção 15. Boa sessão — e que os dados " +
                "tenham piedade dos seus jogadores. 🐙"
        }
      ]
    });
  }

  function init() {
    var tour = buildTour();
    if (!tour) return;

    // Botão "rever tour" na toolbar.
    var btn = document.getElementById("btn-keeper-tour");
    if (btn) btn.addEventListener("click", function () { tour.start(true); });

    // Primeira visita: espera o storage carregar (prefs) e a tela assentar.
    var st = window.CoC.storage;
    var ready = st && st.ready ? st.ready : Promise.resolve();
    Promise.resolve(ready).then(function () {
      setTimeout(function () { tour.start(false); }, 900);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
