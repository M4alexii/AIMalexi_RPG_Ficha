/* ═══════════════════════════════════════════════════════════════════════════
   AIMalexi RPG · js/shared/guided-tour.js
   Tour guiado com spotlight — onboarding passo-a-passo (estilo jogos AAA).

   Uso:
     const tour = CoC.ui.guidedTour({
       id: "keeper-v1",                  // chave de persistência ("já vi")
       steps: [{
         target: "#library-list",       // seletor (null = card centralizado)
         title: "Biblioteca",
         body:  "Texto do passo (HTML seguro — chame escapeHtml você mesmo).",
         before: function () {}         // ex.: trocar de aba antes do passo
       }],
       onFinish: function () {}
     });
     tour.start();        // só roda se ainda não foi visto
     tour.start(true);    // força (botão "rever tour")

   Persistência: CoC.storage.getPref/setPref("tour/"+id) com fallback
   localStorage. Esc pula; ←/→ navegam; backdrop bloqueia interação.
   ═══════════════════════════════════════════════════════════════════════════ */

window.CoC = window.CoC || {};
window.CoC.ui = window.CoC.ui || {};

(function () {
  "use strict";

  var STYLE_ID = "guided-tour-css";

  function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = [
      // Bloqueador de interação (transparente; o escurecimento vem do spotlight)
      ".gt-blocker{position:fixed;inset:0;z-index:9000;}",
      // Spotlight: recorte luminoso que desliza entre os alvos
      ".gt-spot{position:fixed;z-index:9001;pointer-events:none;border-radius:10px;",
      "  box-shadow:0 0 0 200vmax rgba(8,6,5,0.84),0 0 0 2px var(--brass,#b8924f),0 0 28px 4px var(--brass-glow,rgba(184,146,79,0.45));",
      "  transition:top .38s cubic-bezier(.22,.8,.3,1),left .38s cubic-bezier(.22,.8,.3,1),width .38s cubic-bezier(.22,.8,.3,1),height .38s cubic-bezier(.22,.8,.3,1);}",
      ".gt-spot.gt-center{box-shadow:0 0 0 200vmax rgba(8,6,5,0.84);}",
      // Cartão do passo
      ".gt-pop{position:fixed;z-index:9002;max-width:min(380px,calc(100vw - 2rem));",
      "  background:linear-gradient(180deg,var(--bg-card-hi,#241e17),var(--bg-card,#1c1813));",
      "  border:1px solid var(--brass,#b8924f);border-radius:8px;padding:1rem 1.1rem;",
      "  box-shadow:0 10px 40px rgba(0,0,0,.7),inset 0 1px 0 rgba(232,220,196,.06);",
      "  color:var(--ink,#e8dcc4);font-family:var(--font-body,serif);",
      "  animation:gt-pop-in .3s ease-out;}",
      ".gt-pop::before{content:'';position:absolute;top:6px;left:6px;right:6px;height:0;",
      "  border-top:1px solid rgba(184,146,79,.25);}",
      "@keyframes gt-pop-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
      ".gt-title{font-family:var(--font-serif,serif);font-size:1.2rem;font-weight:700;",
      "  color:var(--brass-bright,#d4a960);margin-bottom:.35rem;letter-spacing:.03em;}",
      ".gt-body{font-size:.92rem;line-height:1.55;color:var(--ink-dim,#a89580);}",
      ".gt-body b{color:var(--ink,#e8dcc4);}",
      ".gt-foot{display:flex;align-items:center;gap:.5rem;margin-top:.85rem;}",
      ".gt-count{font-family:var(--font-mono,monospace);font-size:.72rem;color:var(--ink-faded,#6b5d4a);",
      "  letter-spacing:.08em;margin-right:auto;}",
      ".gt-pop button{font-family:var(--font-mono,monospace);font-size:.78rem;text-transform:uppercase;",
      "  letter-spacing:.05em;padding:.4rem .7rem;border-radius:4px;cursor:pointer;",
      "  background:var(--bg-card,#1c1813);color:var(--ink,#e8dcc4);border:1px solid var(--ink-faded,#6b5d4a);}",
      ".gt-pop button:hover{border-color:var(--brass,#b8924f);color:var(--brass-bright,#d4a960);}",
      ".gt-pop button.gt-next{background:linear-gradient(180deg,var(--brass,#b8924f),#8c6e3a);",
      "  border-color:var(--brass-bright,#d4a960);color:var(--bg-deep,#0a0807);font-weight:700;}",
      ".gt-pop button.gt-skip{background:transparent;border-color:transparent;color:var(--ink-faded,#6b5d4a);}",
      "@media (prefers-reduced-motion: reduce){.gt-spot{transition:none}.gt-pop{animation:none}}"
    ].join("\n");
    document.head.appendChild(s);
  }

  function prefKey(id) { return "tour/" + id; }

  function wasSeen(id) {
    var st = window.CoC.storage;
    if (st && st.getPref) return !!st.getPref(prefKey(id), false);
    try { return localStorage.getItem("aimalexi-rpg/" + prefKey(id)) === "1"; } catch (e) { return false; }
  }

  function markSeen(id) {
    var st = window.CoC.storage;
    if (st && st.setPref) { st.setPref(prefKey(id), true); return; }
    try { localStorage.setItem("aimalexi-rpg/" + prefKey(id), "1"); } catch (e) {}
  }

  function guidedTour(opts) {
    var id = opts.id || "tour";
    var steps = Array.isArray(opts.steps) ? opts.steps : [];
    var onFinish = typeof opts.onFinish === "function" ? opts.onFinish : function () {};

    var idx = 0;
    var blocker = null, spot = null, pop = null;
    var active = false;

    function teardown(finished) {
      if (!active) return;
      active = false;
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("keydown", onKey);
      if (blocker) blocker.remove();
      if (spot) spot.remove();
      if (pop) pop.remove();
      blocker = spot = pop = null;
      markSeen(id);
      if (finished) onFinish();
    }

    function onKey(e) {
      if (e.key === "Escape") { teardown(false); }
      else if (e.key === "ArrowRight" || e.key === "Enter") { next(); }
      else if (e.key === "ArrowLeft") { prev(); }
    }

    function currentTarget() {
      var sel = steps[idx] && steps[idx].target;
      if (!sel) return null;
      var el = document.querySelector(sel);
      // Alvo invisível (ex.: painel de outra aba não ativado) = trata como central
      if (!el || el.offsetParent === null && getComputedStyle(el).position !== "fixed") return el && el.getClientRects().length ? el : null;
      return el;
    }

    function reposition() {
      if (!active) return;
      var el = currentTarget();
      var pad = 8;
      if (el) {
        var r = el.getBoundingClientRect();
        spot.classList.remove("gt-center");
        spot.style.top = (r.top - pad) + "px";
        spot.style.left = (r.left - pad) + "px";
        spot.style.width = (r.width + pad * 2) + "px";
        spot.style.height = (r.height + pad * 2) + "px";
      } else {
        // T-15: resetar sincronamente sem animação — evita spotlight fantasma do passo anterior.
        spot.style.transition = "none";
        void spot.offsetWidth; // força reflow
        spot.classList.add("gt-center");
        spot.style.top = "50%"; spot.style.left = "50%";
        spot.style.width = "0px"; spot.style.height = "0px";
        setTimeout(function () { if (spot) spot.style.transition = ""; }, 20);
      }
      positionPop(el);
    }

    function positionPop(el) {
      var vw = window.innerWidth, vh = window.innerHeight;
      var pw = pop.offsetWidth, ph = pop.offsetHeight;
      var top, left;
      // T-17: só ancora se o elemento tem geometria real (visível, não em aba oculta).
      if (el) {
        var r = el.getBoundingClientRect();
        if (r.width > 0 || r.height > 0) {
          if (r.bottom + ph + 24 < vh) top = r.bottom + 16;
          else if (r.top - ph - 24 > 0) top = r.top - ph - 16;
          else top = Math.max(16, (vh - ph) / 2);
          left = Math.min(Math.max(16, r.left), vw - pw - 16);
        } else {
          top = (vh - ph) / 2; left = (vw - pw) / 2;
        }
      } else {
        top = (vh - ph) / 2; left = (vw - pw) / 2;
      }
      pop.style.top = top + "px";
      pop.style.left = left + "px";
    }

    function renderStep() {
      var st = steps[idx];
      if (!st) { teardown(true); return; }
      if (typeof st.before === "function") {
        try { st.before(); } catch (e) { /* tour nunca pode quebrar a página */ }
      }
      var el = currentTarget();
      if (el && el.scrollIntoView) {
        try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { el.scrollIntoView(); }
      }
      var last = idx === steps.length - 1;
      pop.innerHTML =
        '<div class="gt-title">' + (st.title || "") + "</div>" +
        '<div class="gt-body">' + (st.body || "") + "</div>" +
        '<div class="gt-foot">' +
          '<span class="gt-count">' + (idx + 1) + " / " + steps.length + "</span>" +
          '<button type="button" class="gt-skip">Pular</button>' +
          (idx > 0 ? '<button type="button" class="gt-prev">←</button>' : "") +
          '<button type="button" class="gt-next">' + (last ? "Concluir ✓" : "Próximo →") + "</button>" +
        "</div>";
      pop.querySelector(".gt-skip").onclick = function () { teardown(false); };
      var bPrev = pop.querySelector(".gt-prev");
      if (bPrev) bPrev.onclick = prev;
      pop.querySelector(".gt-next").onclick = next;
      // Reposiciona após o scroll suave assentar.
      reposition();
      setTimeout(reposition, 380);
    }

    function next() {
      if (idx >= steps.length - 1) { teardown(true); return; }
      idx++; renderStep();
    }
    function prev() {
      if (idx === 0) return;
      idx--; renderStep();
    }

    function start(force) {
      if (active || !steps.length) return;
      if (!force && wasSeen(id)) return;
      injectCSS();
      active = true;
      idx = 0;
      blocker = document.createElement("div"); blocker.className = "gt-blocker";
      spot = document.createElement("div"); spot.className = "gt-spot gt-center";
      pop = document.createElement("div"); pop.className = "gt-pop";
      pop.setAttribute("role", "dialog");
      pop.setAttribute("aria-label", "Tutorial guiado");
      document.body.appendChild(blocker);
      document.body.appendChild(spot);
      document.body.appendChild(pop);
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);
      document.addEventListener("keydown", onKey);
      renderStep();
    }

    return { start: start, stop: function () { teardown(false); }, get active() { return active; } };
  }

  window.CoC.ui.guidedTour = guidedTour;
})();
