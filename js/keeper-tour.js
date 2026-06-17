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

  // Helper: clica a aba correta pelo atributo data-ktab.
  function _goTab(name) {
    var btn = document.querySelector('.keeper-tab[data-ktab="' + name + '"]');
    if (btn) btn.click();
  }

  var tourSteps = [
    {
      target: null,
      title: "Bem-vindo, Mestre!",
      body: "Esta ferramenta ajuda a gerenciar criaturas, NPCs, investigadores " +
            "e combate em tempo real durante suas sessões de Chamado de Cthulhu. " +
            "Vamos fazer um tour rápido para você dominar a interface."
    },
    {
      target: ".keeper-overview",
      title: "📊 Dashboard Executivo",
      body: "Aqui você vê métricas da campanha: investigadores vivos, sanidade média, " +
            "alertas e timeline de eventos. Útil para manter tudo sob controle " +
            "sem abrir múltiplos painéis.",
      before: function () {
        _goTab("investigadores");
      }
    },
    {
      target: "#investigators-kpis",
      title: "🕵️ Painel de Investigadores",
      body: "Status em tempo real de cada investigador: Vida, Sanidade, Magia e Sorte. " +
            "Os KPIs no topo mostram quantos estão vivos, em surto ou mortos. " +
            "Investigue o perigo mais grave primeiro — o painel ordena por risco.",
      before: function () {
        _goTab("investigadores");
      }
    },
    {
      target: "#library-list",
      title: "📚 Biblioteca de Criaturas",
      body: "Seu banco de dados de NPCs e criaturas. Clique para carregar uma criatura, " +
            "edite nome/tipo, ou crie novos com o botão +. Busque por nome para encontrar rápido durante o jogo.",
      before: function () {
        _goTab("npcs");
      }
    },
    {
      target: ".workspace",
      title: "🎭 Espaço de Trabalho",
      body: "A criatura ativa aparece aqui. <b>Modo Simples</b> mostra atributos, ataques " +
            "e perícias essenciais. Clique <b>Editar</b> para o Modo Completo com todos os dados.",
      before: function () {
        _goTab("npcs");
      }
    },
    {
      target: ".encounter-panel",
      title: "⚔️ Rastreador de Encontro",
      body: "Adicione criaturas ao encontro ativo. Mostra contador de rounds e ordem de ação. " +
            "Clique uma criatura para colocá-la no topo da iniciativa.",
      before: function () {
        _goTab("encontro");
      }
    },
    {
      target: ".enc-round-bar",
      title: "📍 Contador de Rounds",
      body: "Avança cada turno/round. <b>Iniciativa</b> ordena automaticamente por DES. " +
            "Reinicia após o combate terminar.",
      before: function () {
        _goTab("encontro");
      }
    },
    {
      target: "#roll-log",
      title: "📜 Log de Sessão",
      body: "Timeline de rolagens, dano, sanidade e eventos manuais. " +
            "Exportável para relato de campanha ou compartilhamento com os jogadores.",
      before: function () {
        _goTab("timeline");
      }
    },
    {
      target: "#btn-overflow",
      title: "⚙️ Ações & Configurações",
      body: "Importe/exporte a biblioteca, gere PDF, acesse o Compêndio de Regras " +
            "e ajuste tema, acessibilidade e efeitos visuais de insanidade.",
      before: function () {
        _goTab("investigadores");
      }
    },
    {
      target: "#btn-campaign",
      title: "🔗 Modo Campanha (Multiplayer)",
      body: "Convide investigadores via PIN. Sincroniza status em tempo real. " +
            "Mestres sempre têm autoridade final sobre ações sagradas.",
      before: function () {
        _goTab("investigadores");
      }
    },
    {
      target: null,
      title: "✅ Pronto para Mestrar!",
      body: "Você está equipado com tudo que precisa. Dúvidas? " +
            "Abra o <b>Compêndio</b> (→ Guia de Referência) ou releia este tutorial " +
            "clicando em <b>Tour</b> no menu de ações."
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
