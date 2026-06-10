/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/keeper-tour.js
   Tour guiado para Mestres — onboarding na Ficha do Mestre.

   O tour roda automaticamente na primeira visita ao keeper.html
   e pode ser re-triggerado via botão "❓ Tour" no toolbar.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};
window.CoC.keeperTour = window.CoC.keeperTour || {};

(function () {
  "use strict";

  var tourId = "keeper-v1";
  var tourSteps = [
    {
      target: null,
      title: "Bem-vindo, Mestre!",
      body: "Esta ferramenta ajuda a gerenciar criaturas, NPCs, inventário " +
            "e combate em tempo real durante suas sessões de Chamado de Cthulhu. " +
            "Vamos fazer um tour rápido de 5 minutos para você dominar a interface."
    },
    {
      target: ".keeper-overview",
      title: "📊 Dashboard Executivo",
      body: "Aqui você vê métricas da campanha: investigadores vivos, sanidade média, " +
            "criaturas em campo, timeline de eventos. Útil para manter tudo sob controle " +
            "sem abrir múltiplos painéis.",
      before: function () {
        document.body.setAttribute("data-tab", "visao-geral");
      }
    },
    {
      target: ".library-list",
      title: "📚 Biblioteca de Criaturas",
      body: "Seu banco de dados de NPCs e criaturas. Clique para carregar uma criatura, " +
            "edite nome/tipo, ou crie novos com o botão +. Busque por nome para encontrar rápido durante o jogo."
    },
    {
      target: ".workspace",
      title: "🎭 Espaço de Trabalho",
      body: "A criatura ativa aparece aqui. <b>Modo Simples</b> mostra HP, ataques, " +
            "perícias essenciais. <b>Clique [Modo Completo]</b> para editar todos os dados."
    },
    {
      target: ".simple-stats",
      title: "⚔️ Modo Simples — Ao Vivo",
      body: "Tudo que você precisa em combate: FOR/AGL/PV/ataques. Sem rolagem, sem confusão. " +
            "Clique em qualquer valor para rolar D100 direto."
    },
    {
      target: ".stat-tile.tracker.pv",
      title: "❤️ Tracker de Pontos de Vida",
      body: "Siga a vida da criatura em tempo real. Clique ± para ajustar. " +
            "Ferimentos graves e morte são <b>detectados automaticamente</b>."
    },
    {
      target: '[data-tab="combate"]',
      title: "⚔️ Aba de Combate",
      body: "Armadura, iniciativa, armas, esquiva. Tudo organizado para combate rápido. " +
            "Marque ferimentos graves, inconsciente, morrendo — tudo sincronizado com a ficha.",
      before: function () {
        var tab = document.querySelector('[data-tab="combate"]');
        if (tab) tab.click();
      }
    },
    {
      target: ".attack-card:first-of-type",
      title: "🗡️ Ataques Rápidos",
      body: "Clique para rolar ataque. Resultado aparece no log. Modificadores aplicam automaticamente."
    },
    {
      target: '[data-tab="diario"]',
      title: "📖 Diário de Sessão",
      body: "Registre eventos, pistas, revelações. Suporta markdown e [[wikilinks]] " +
            "para conectar notas. Tudo searchable e exportável.",
      before: function () {
        var tab = document.querySelector('[data-tab="diario"]');
        if (tab) tab.click();
      }
    },
    {
      target: ".encounter-panel",
      title: "🎲 Rastreador de Encontro",
      body: "Adicione criaturas ao encontro ativo. Mostra round counter e iniciativa. " +
            "Clique uma criatura para colocá-la no topo da ordem de ação."
    },
    {
      target: ".enc-round-bar",
      title: "📍 Contador de Rounds",
      body: "Avança cada turno/round. Mostra quem é a vez e a ordem de ação. " +
            "Reseta após combate terminar."
    },
    {
      target: "#roll-log",
      title: "📜 Log de Sessão",
      body: "Timeline de rolagens, dano, sanidade, eventos. Filtrável por tipo. " +
            "Exportável para relato de campanha ou compartilhamento com players."
    },
    {
      target: "#btn-settings",
      title: "⚙️ Configurações",
      body: "Mude tema, acessibilidade, redução de movimento. Suas preferências salvam automaticamente. " +
            "Também temos efeitos de insanidade visuais — configure aqui!"
    },
    {
      target: ".campaign-badge",
      title: "🔗 Modo Campanha (Multiplayer)",
      body: "Convide investigadores via PIN. Sincroniza em tempo real. " +
            "Mestres sempre têm autoridade final (ações sagradas só de mestre).",
      before: function () {
        document.body.setAttribute("data-tab", "visao-geral");
      }
    },
    {
      target: null,
      title: "✅ Pronto para Mestrar!",
      body: "Você está equipado com tudo que precisa. Dúvidas? " +
            "Abra o <b>Compêndio</b> (→ Guia de Referência) ou releia este tutorial " +
            "clicando em ❓ Tour no toolbar."
    }
  ];

  function initTour() {
    if (!window.CoC.ui || !window.CoC.ui.guidedTour) {
      console.warn("[keeper-tour] guided-tour.js não carregado");
      return;
    }

    var tour = window.CoC.ui.guidedTour({
      id: tourId,
      steps: tourSteps,
      onFinish: function () {
        console.log("[keeper-tour] Tour finalizado");
      }
    });

    // Auto-start na primeira visita
    tour.start();

    // Expor para botão "Rever Tutorial"
    window.CoC.keeperTour.restart = function () {
      tour.start(true);
    };

    // Vincular botão "❓ Tour" no toolbar
    var tourBtn = document.getElementById("btn-keeper-tour");
    if (tourBtn) {
      tourBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.CoC.keeperTour.restart();
      });
    }
  }

  // Tenta inicializar quando DOMContentLoaded ou se já carregado
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTour);
  } else {
    setTimeout(initTour, 100);
  }

  // Expor init
  window.CoC.keeperTour.init = initTour;

})();
