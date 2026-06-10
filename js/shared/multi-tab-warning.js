/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/shared/multi-tab-warning.js
   Multi-tab detection para sessões locais (BroadcastChannel).

   Em sessões single-player offline, múltiplas abas causam dessincronização:
   cada aba tem seu próprio store em memória. Este módulo avisa o usuário.

   Expõe: window.CoC.multiTabWarning = { init }
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC       = window.CoC       || {};
window.CoC.views = window.CoC.views || {};

(function () {

  const { toast } = window.CoC.ui || { toast: () => {} };

  let channel = null;
  let warningShown = false;

  function init() {
    // BroadcastChannel não está disponível em browsers muito antigos.
    if (!("BroadcastChannel" in window)) return;

    try {
      // Cada aba abre um canal com o mesmo nome. Quem abre primeiro é o "master".
      channel = new BroadcastChannel("aimalexi-rpg-session");

      // Avisa a outras abas que esta está ativa.
      channel.postMessage({ type: "ping" });

      // Escuta mensagens de outras abas.
      channel.onmessage = (event) => {
        if (event.data.type === "ping" && !warningShown) {
          warningShown = true;
          toast(
            "⚠ Múltiplas abas detectadas: em modo offline, os dados podem se desincronizar. Recomenda-se usar apenas uma aba.",
            { type: "warn", duration: 8000 }
          );
        }
      };
    } catch (e) {
      // BroadcastChannel pode não estar disponível ou habilitado.
      console.debug("[MultiTab] BroadcastChannel indisponível:", e);
    }
  }

  window.CoC.multiTabWarning = Object.freeze({ init });

})();
