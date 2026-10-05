/*!
 * octubre-rosa.js — Campaña Octubre Rosa · Día Preventivo IAPOS
 * Uso (al final del <body>):
 *   <script src="/js/octubre-rosa.js"
 *           data-publico="afiliado"            // "afiliado" | "profesional"
 *           data-modo="franja,marco,lazo"      // cualquier combinación
 *           data-cta-url="https://diapreventivoiapos.com/turnera"></script>
 * Se activa solo en octubre (hora Argentina).
 * Para probar fuera de octubre: agregar ?octubrerosa=1 a la URL o data-forzar="1".
 */
(function () {
  "use strict";

  var script = document.currentScript || document.querySelector('script[src*="octubre-rosa"]');
  var cfg = {
    publico: (script && script.dataset.publico) || "afiliado",
    modo: ((script && script.dataset.modo) || "franja,marco,lazo").split(",").map(function (s) { return s.trim(); }),
    ctaUrl: (script && script.dataset.ctaUrl) || "",
    forzar: script && script.dataset.forzar === "1"
  };

  // ---------- Activación por fecha (America/Argentina/Buenos_Aires) ----------
  function esOctubre() {
    try {
      var mes = new Intl.DateTimeFormat("es-AR", { month: "numeric", timeZone: "America/Argentina/Buenos_Aires" })
        .format(new Date());
      return Number(mes) === 10;
    } catch (e) {
      return new Date().getMonth() === 9;
    }
  }
  var forzadoPorUrl = /[?&]octubrerosa=1\b/.test(location.search);
  if (!esOctubre() && !cfg.forzar && !forzadoPorUrl) return;
  if (document.getElementById("or-estilos")) return; // evita doble carga

  // ---------- Textos por público ----------
  var TXT = {
    afiliado: {
      franja: "Octubre Rosa, mes de concientización sobre el cáncer de mama.",
      franjaBtn: "Elegí cuidarte",
      titulo: "Elegí cuidarte",
      intro: "Consultá por un control mamario si:",
      items: [
        "Tenés antecedentes familiares.",
        "Cumpliste 40 y nunca te hiciste un control.",
        "Detectaste algún cambio en tus mamas.",
        "Notaste dolor, cambios en la piel o salida de líquido por el pezón."
      ],
      cta: "Incorporá el control mamario a tus chequeos"
    },
    profesional: {
      franja: "Octubre Rosa: revisá que las afiliadas desde los 40 tengan su mamografía al día.",
      franjaBtn: "Ver criterios",
      titulo: "Octubre Rosa",
      intro: "Indicá control mamario si la afiliada:",
      items: [
        "Tiene antecedentes familiares de cáncer de mama.",
        "Tiene 40 años o más y nunca se realizó un control.",
        "Refiere algún cambio en sus mamas.",
        "Refiere dolor, cambios en la piel o secreción por el pezón."
      ],
      cta: "Incorporá el control mamario en cada Día Preventivo"
    }
  };
  var t = TXT[cfg.publico] || TXT.afiliado;

  // ---------- Lazo SVG ----------
  function lazo(size) {
    return '<svg class="or-lazo-svg" width="' + size + '" height="' + Math.round(size * 1.5) +
      '" viewBox="0 0 40 60" aria-hidden="true" focusable="false">' +
      '<path d="M26 8 C32 18 30 26 24 34 L12 56" />' +
      '<path d="M14 8 C16 2 24 2 26 8" />' +
      '<path d="M14 8 C8 18 10 26 16 34 L28 56" />' +
      "</svg>";
  }

  // ---------- Estilos (prefijo or- para no chocar con las apps) ----------
  var css =
    ":root{--or-fondo:#EBC6D3;--or-rosa:#C2546F;--or-bordo:#9E3B54;--or-crema:#FBEFF3;}" +
    ".or-lazo-svg path{fill:none;stroke:var(--or-rosa);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}" +
    // Franja
    ".or-franja{position:fixed;top:0;left:0;right:0;box-sizing:border-box;margin:0;z-index:9998;display:flex;align-items:center;justify-content:center;gap:12px;" +
    "padding:8px 44px 8px 16px;background:var(--or-fondo);color:var(--or-bordo);border-bottom:2px solid var(--or-rosa);" +
    "font:500 14px/1.35 inherit;font-family:inherit;text-align:center;flex-wrap:wrap}" +
    ".or-franja .or-lazo-svg{flex:none}" +
    ".or-franja-btn{background:var(--or-rosa);color:#fff;border:0;border-radius:999px;padding:5px 14px;" +
    "font:600 13px/1.2 inherit;font-family:inherit;cursor:pointer}" +
    ".or-franja-btn:hover{background:var(--or-bordo)}" +
    ".or-cerrar{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:0;" +
    "background:transparent;color:var(--or-bordo);font-size:20px;line-height:1;cursor:pointer;border-radius:50%}" +
    ".or-cerrar:hover{background:rgba(194,84,111,.15)}" +
    // Marco
    ".or-marco{position:fixed;inset:0;pointer-events:none;z-index:9997;border:5px solid var(--or-rosa);" +
    "box-shadow:inset 0 0 0 2px var(--or-fondo)}" +
    // Lazo flotante
    ".or-lazo-flot{position:fixed;right:18px;bottom:18px;z-index:9999;width:56px;height:56px;border-radius:50%;" +
    "background:var(--or-crema);border:2px solid var(--or-rosa);display:grid;place-items:center;cursor:pointer;" +
    "box-shadow:0 4px 14px rgba(158,59,84,.25);padding:0}" +
    ".or-lazo-flot:hover{transform:scale(1.06)}" +
    "@media (prefers-reduced-motion:no-preference){.or-lazo-flot{transition:transform .15s;animation:or-latido 2.4s ease-in-out 1s 2}}" +
    "@keyframes or-latido{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}" +
    // Tarjeta
    ".or-tarjeta{position:fixed;right:18px;bottom:86px;z-index:10000;width:min(330px,calc(100vw - 36px));" +
    "background:var(--or-fondo);color:var(--or-bordo);border-radius:18px;padding:20px 20px 18px;" +
    "box-shadow:0 10px 30px rgba(158,59,84,.3);font-family:inherit;display:none}" +
    ".or-tarjeta.or-abierta{display:block}" +
    ".or-tarjeta h2{margin:0 0 4px;font-size:26px;line-height:1.05;color:var(--or-rosa);font-weight:800;letter-spacing:.5px}" +
    ".or-tarjeta .or-sub{margin:0 0 12px;font-size:12px;opacity:.85}" +
    ".or-tarjeta p.or-intro{margin:0 0 6px;font-weight:600;font-size:14px}" +
    ".or-tarjeta ul{margin:0 0 14px;padding-left:18px;font-size:14px;line-height:1.4}" +
    ".or-tarjeta li{margin-bottom:4px}" +
    ".or-tarjeta li::marker{color:var(--or-rosa)}" +
    ".or-cta{display:block;text-align:center;border:2px solid var(--or-rosa);border-radius:999px;padding:8px 12px;" +
    "color:var(--or-rosa);font-weight:700;font-size:13px;text-decoration:none;background:var(--or-crema)}" +
    "a.or-cta:hover{background:var(--or-rosa);color:#fff}" +
    ".or-tarjeta .or-cerrar{top:16px;transform:none}" +
    ".or-franja-btn:focus-visible,.or-cerrar:focus-visible,.or-lazo-flot:focus-visible,a.or-cta:focus-visible" +
    "{outline:3px solid var(--or-bordo);outline-offset:2px}" +
    "@media (max-width:600px){.or-franja{font-size:13px;gap:8px}.or-marco{border-width:3px}" +
    ".or-lazo-flot{width:48px;height:48px;right:12px;bottom:12px}.or-tarjeta{right:12px;bottom:72px}}" +
    "@media print{.or-franja,.or-marco,.or-lazo-flot,.or-tarjeta{display:none!important}}";

  function iniciar() {
    var style = document.createElement("style");
    style.id = "or-estilos";
    style.textContent = css;
    document.head.appendChild(style);

    var tarjeta = null;

    // Tarjeta (compartida por franja y lazo)
    function crearTarjeta() {
      tarjeta = document.createElement("div");
      tarjeta.className = "or-tarjeta";
      tarjeta.setAttribute("role", "dialog");
      tarjeta.setAttribute("aria-label", "Octubre Rosa");
      var cta = cfg.ctaUrl
        ? '<a class="or-cta" href="' + cfg.ctaUrl + '">' + t.cta + "</a>"
        : '<div class="or-cta">' + t.cta + "</div>";
      tarjeta.innerHTML =
        '<button class="or-cerrar" type="button" aria-label="Cerrar">&times;</button>' +
        "<h2>" + t.titulo + "</h2>" +
        '<p class="or-sub">Octubre Rosa, mes de concientización sobre el cáncer de mama</p>' +
        '<p class="or-intro">' + t.intro + "</p>" +
        "<ul>" + t.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul>" + cta;
      tarjeta.querySelector(".or-cerrar").addEventListener("click", cerrarTarjeta);
      document.body.appendChild(tarjeta);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarTarjeta(); });
    }
    function abrirTarjeta() {
      if (!tarjeta) crearTarjeta();
      tarjeta.classList.toggle("or-abierta");
      if (tarjeta.classList.contains("or-abierta")) tarjeta.querySelector(".or-cerrar").focus();
    }
    function cerrarTarjeta() { if (tarjeta) tarjeta.classList.remove("or-abierta"); }

    // Franja superior (se puede cerrar; vuelve en la próxima sesión)
    var franjaCerrada = false;
    try { franjaCerrada = sessionStorage.getItem("or-franja-cerrada") === "1"; } catch (e) {}
    if (cfg.modo.indexOf("franja") > -1 && !franjaCerrada) {
      var franja = document.createElement("div");
      franja.className = "or-franja";
      franja.setAttribute("role", "note");
      franja.innerHTML = lazo(14) + "<span>" + t.franja + "</span>" +
        '<button class="or-franja-btn" type="button">' + t.franjaBtn + "</button>" +
        '<button class="or-cerrar" type="button" aria-label="Ocultar aviso">&times;</button>';
      document.body.appendChild(franja);

      // La franja es fija: le sumamos al body su altura como padding-top
      // para que no tape el contenido, sea cual sea el layout de la app.
      var paddingOriginal = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
      function ajustarEspacio() {
        document.body.style.paddingTop = (paddingOriginal + franja.offsetHeight) + "px";
      }
      ajustarEspacio();
      window.addEventListener("resize", ajustarEspacio);

      franja.querySelector(".or-franja-btn").addEventListener("click", abrirTarjeta);
      franja.querySelector(".or-cerrar").addEventListener("click", function () {
        franja.remove();
        window.removeEventListener("resize", ajustarEspacio);
        document.body.style.paddingTop = paddingOriginal ? paddingOriginal + "px" : "";
        try { sessionStorage.setItem("or-franja-cerrada", "1"); } catch (e) {}
      });
    }

    // Marco rosado alrededor de la pantalla
    if (cfg.modo.indexOf("marco") > -1) {
      var marco = document.createElement("div");
      marco.className = "or-marco";
      marco.setAttribute("aria-hidden", "true");
      document.body.appendChild(marco);
    }

    // Lazo flotante
    if (cfg.modo.indexOf("lazo") > -1) {
      var btn = document.createElement("button");
      btn.className = "or-lazo-flot";
      btn.type = "button";
      btn.setAttribute("aria-label", "Octubre Rosa: información sobre control mamario");
      btn.title = "Octubre Rosa";
      btn.innerHTML = lazo(22);
      btn.addEventListener("click", abrirTarjeta);
      document.body.appendChild(btn);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();