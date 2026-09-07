(function () {
  function initGuard() {
    var blocker = document.getElementById("jsGuard");
    if (!blocker) return;
    var card = blocker.querySelector(".guard-card") || blocker;
    var themeToggle = null;
    var THEME_KEY = "theme-preference";

    function getCurrentTheme() {
      var attr = "";
      try {
        attr = document.documentElement.getAttribute("data-theme") || "";
      } catch (_) {}
      if (attr === "dark" || attr === "light") return attr;
      try {
        var stored = localStorage.getItem(THEME_KEY);
        if (stored === "dark" || stored === "light") return stored;
      } catch (_) {}
      return "light";
    }

    function applyTheme(mode) {
      var resolved = mode === "dark" ? "dark" : "light";
      try {
        document.documentElement.setAttribute("data-theme", resolved);
      } catch (_) {}
      try {
        localStorage.setItem(THEME_KEY, resolved);
      } catch (_) {}
      if (window.Theme && typeof window.Theme.setMode === "function") {
        window.Theme.setMode(resolved);
      }
      updateThemeToggle();
    }

    function syncTheme(mode) {
      var resolved = mode === "dark" ? "dark" : "light";
      if (window.Theme && typeof window.Theme.apply === "function") {
        window.Theme.apply(resolved);
      } else {
        try {
          document.documentElement.setAttribute("data-theme", resolved);
        } catch (_) {}
      }
      updateThemeToggle();
    }

    function updateThemeToggle() {
      if (!themeToggle) return;
      var mode = getCurrentTheme();
      themeToggle.textContent =
        mode === "dark" ? "Tryb: Ciemny" : "Tryb: Jasny";
      themeToggle.setAttribute("aria-pressed", mode === "dark");
    }

    function ensureThemeToggle() {
      if (themeToggle) return;
      themeToggle = document.createElement("button");
      themeToggle.type = "button";
      themeToggle.className = "guard-theme-toggle";
      themeToggle.addEventListener("click", function () {
        var next = getCurrentTheme() === "dark" ? "light" : "dark";
        applyTheme(next);
      });
      blocker.appendChild(themeToggle);
      updateThemeToggle();
    }

    var deferredInstallPrompt = null;

    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredInstallPrompt = event;
      updateInstallUiState();
    });

    window.addEventListener("appinstalled", function () {
      deferredInstallPrompt = null;
      setInstallStatus("Aplikacja zostala zainstalowana.", false);
      updateInstallUiState();
    });

    var templates = {
      pwa:
        '<div class="guard-content">' +
        '<h1 class="guard-title">Zainstaluj aplikacje jako PWA</h1>' +
        '<p class="guard-text">Aplikacja dziala tylko w trybie PWA (standalone).</p>' +
        '<button type="button" class="guard-install-btn" id="guardInstallBtn">Zainstaluj aplikacje</button>' +
        '<p class="guard-install-message" id="guardInstallMessage" role="status" aria-live="polite"></p>' +
        '<details class="guard-help" id="guardInstallHelp">' +
        "<summary>Instrukcja awaryjna (gdy przycisk nie zadziala)</summary>" +
        '<div class="guard-columns">' +
        '<section class="guard-section">' +
        "<h2>iOS (Safari)</h2>" +
        "<ol>" +
        "<li>Otworz strone w Safari.</li>" +
        "<li>Wcisnij przycisk Udostepnij.</li>" +
        '<li>Wybierz "Dodaj do ekranu poczatkowego".</li>' +
        "<li>Potwierdz dodanie.</li>" +
        "</ol>" +
        "</section>" +
        '<section class="guard-section">' +
        "<h2>Android (Chrome)</h2>" +
        "<ol>" +
        "<li>Otworz strone w Chrome.</li>" +
        "<li>Otworz menu (trzy kropki) w prawym gornym rogu.</li>" +
        '<li>Wybierz "Dodaj do ekranu glownego".</li>' +
        "<li>Potwierdz instalacje.</li>" +
        "</ol>" +
        "</section>" +
        "</div>" +
        "</details>" +
        "</div>",
    };

    function setInstallStatus(text, isError) {
      var msg = blocker.querySelector("#guardInstallMessage");
      if (!msg) return;
      msg.textContent = text || "";
      msg.classList.toggle("is-error", !!isError);
    }

    function updateInstallUiState() {
      var installBtn = blocker.querySelector("#guardInstallBtn");
      if (!installBtn) return;
      var disabled = !deferredInstallPrompt;
      installBtn.disabled = disabled;
      installBtn.setAttribute("aria-disabled", disabled ? "true" : "false");
    }

    function expandFallbackHelp() {
      var help = blocker.querySelector("#guardInstallHelp");
      if (!help) return;
      help.open = true;
    }

    function bindInstallActions() {
      var installBtn = blocker.querySelector("#guardInstallBtn");
      if (!installBtn) return;

      installBtn.addEventListener("click", function () {
        if (!deferredInstallPrompt) {
          setInstallStatus(
            "Nie udalo sie uruchomic instalacji. Uzyj instrukcji awaryjnej.",
            true,
          );
          expandFallbackHelp();
          return;
        }

        setInstallStatus(
          "Uruchomiono instalacje. Potwierdz w oknie przegladarki.",
          false,
        );
        var pendingPrompt = deferredInstallPrompt;
        deferredInstallPrompt = null;
        updateInstallUiState();

        pendingPrompt.prompt();
        pendingPrompt.userChoice
          .then(function (choiceResult) {
            if (choiceResult && choiceResult.outcome === "accepted") {
              setInstallStatus("Aplikacja zostala zainstalowana.", false);
              return;
            }
            setInstallStatus(
              "Instalacja anulowana. Mozesz sprobowac ponownie.",
              true,
            );
            expandFallbackHelp();
          })
          .catch(function () {
            setInstallStatus(
              "Nie udalo sie pokazac instalacji. Uzyj instrukcji awaryjnej.",
              true,
            );
            expandFallbackHelp();
          });
      });

      updateInstallUiState();
    }

    function setMode(mode) {
      if (!card) return;
      blocker.classList.add("guard-fullscreen");
      card.innerHTML = templates.pwa;
      bindInstallActions();
    }

    function show(mode) {
      ensureThemeToggle();
      setMode(mode);
      blocker.hidden = false;
      blocker.style.display = "flex";
      if (document.body && document.body.classList) {
        document.body.classList.add("guard-active");
      }
    }

    function hide() {
      blocker.hidden = true;
      blocker.style.display = "none";
      if (document.body && document.body.classList) {
        document.body.classList.remove("guard-active");
      }
    }

    var cachedStandaloneResult = null;

    function isStandalone() {
      if (cachedStandaloneResult !== null) {
        return cachedStandaloneResult;
      }

      try {
        if (window.navigator && window.navigator.standalone === true) {
          cachedStandaloneResult = true;
          return true;
        }

        if (window.matchMedia) {
          var mq = window.matchMedia("(display-mode: standalone)");
          if (mq && mq.matches) {
            cachedStandaloneResult = true;
            return true;
          }
        }

        cachedStandaloneResult = false;
        return false;
      } catch (_) {
        cachedStandaloneResult = true;
        return true;
      }
    }

    function allowBrowser() {
      if (document.documentElement.hasAttribute("data-allow-browser")) {
        return true;
      }

      try {
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("allowbrowser") === "true") {
          return true;
        }
      } catch (_) {}

      return false;
    }

    var updateBlockerInProgress = false;
    var lastUpdateBlockerTime = 0;
    var updateBlockerTimeout = null;

    function updateBlocker() {
      if (updateBlockerInProgress) {
        return;
      }

      var now = Date.now();
      if (now - lastUpdateBlockerTime < 500) {
        if (updateBlockerTimeout) {
          clearTimeout(updateBlockerTimeout);
        }
        updateBlockerTimeout = setTimeout(updateBlocker, 500);
        return;
      }
      lastUpdateBlockerTime = now;

      updateBlockerInProgress = true;

      try {
        if (!allowBrowser() && !isStandalone()) {
          show("pwa");
          return;
        }
        hide();
      } finally {
        updateBlockerInProgress = false;
      }
    }

    window.addEventListener("load", function () {
      updateBlocker();
    });

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        function () {
          setTimeout(updateBlocker, 100);
        },
        { once: true },
      );
    } else {
      setTimeout(updateBlocker, 100);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGuard, { once: true });
  } else {
    initGuard();
  }
})();

(function () {
  document.addEventListener(
    "contextmenu",
    function (e) {
      if (e.target.tagName === "IMG") {
        e.preventDefault();
        return false;
      }
    },
    { passive: false },
  );

  var style = document.createElement("style");
  style.textContent =
    "* { " +
    "-webkit-touch-callout: none !important; " +
    "-webkit-user-select: none !important; " +
    "-moz-user-select: none !important; " +
    "-ms-user-select: none !important; " +
    "user-select: none !important; " +
    "} " +
    "img { " +
    "-webkit-user-drag: none !important; " +
    "} " +
    "input, textarea { " +
    "-webkit-user-select: text !important; " +
    "-moz-user-select: text !important; " +
    "-ms-user-select: text !important; " +
    "user-select: text !important; " +
    "}";
  document.head.appendChild(style);
})();