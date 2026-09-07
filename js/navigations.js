document.addEventListener("DOMContentLoaded", () => {
  try {
    if (window.Theme && typeof window.Theme.apply === "function") {
      window.Theme.apply(window.Theme.getMode());
    }
  } catch (_) {}

  // Dolna nawigacja — <a href> działa natywnie; data-href tylko dla starych divów
  try {
    document.querySelectorAll(".bottom-nav__tab[data-href]").forEach(function (tab) {
      if (tab.tagName === "A" && tab.getAttribute("href")) return;
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        var href = tab.getAttribute("data-href");
        if (href) window.location.href = href;
      });
      tab.style.cursor = "pointer";
      if (!tab.getAttribute("role")) tab.setAttribute("role", "link");
    });
    document.querySelectorAll(".bottom-nav__tab.unfill").forEach(function (tab) {
      if (tab.tagName === "A" && tab.getAttribute("href")) return;
      if (tab.getAttribute("data-href")) return;
      var img = tab.querySelector("img");
      var alt = img && img.getAttribute("alt");
      var onclick = tab.getAttribute("onclick") || "";
      var match = onclick.match(/['"]([^'"]+\.html)['"]/);
      var href = (match && match[1]) || (alt && /\.html$/i.test(alt) ? alt : "");
      if (!href) return;
      tab.removeAttribute("onclick");
      tab.setAttribute("data-href", href);
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = href;
      });
      tab.style.cursor = "pointer";
    });
  } catch (_) {}

  var CLIENT_REV_KEY = "client_cache_rev";
  var CLIENT_REV_URL = "/api/public/client-rev";
  var isRefreshingClient = false;

  function readLocalRev() {
    try {
      return localStorage.getItem(CLIENT_REV_KEY);
    } catch (_) {
      return null;
    }
  }

  function writeLocalRev(rev) {
    try {
      localStorage.setItem(CLIENT_REV_KEY, String(rev));
    } catch (_) {}
  }

  async function clearRuntimeCachesOnly() {
    // Nie rusza cookies (access_hash) ani danych profilu w localStorage.
    if (!("caches" in window)) return;
    try {
      var names = await caches.keys();
      for (var i = 0; i < names.length; i++) {
        if (names[i] === "__client-cache-rev") continue;
        await caches.delete(names[i]);
      }
    } catch (_) {}
  }

  async function softClientRefresh(rev) {
    if (isRefreshingClient) return;
    isRefreshingClient = true;
    if (rev != null) writeLocalRev(rev);
    try {
      await clearRuntimeCachesOnly();
      if ("serviceWorker" in navigator) {
        var regs = await navigator.serviceWorker.getRegistrations();
        for (var i = 0; i < regs.length; i++) {
          try {
            await regs[i].unregister();
          } catch (_) {}
        }
      }
    } catch (_) {}
    // cookies zostają → bez ponownej aktywacji
    window.location.reload();
  }

  async function checkClientRev() {
    if (window.location.protocol === "file:") return;
    try {
      var res = await fetch(CLIENT_REV_URL, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) return;
      var data = await res.json();
      var rev = String((data && data.rev) || "0");
      var local = readLocalRev();
      if (!local) {
        writeLocalRev(rev);
        return;
      }
      if (local !== rev) {
        await softClientRefresh(rev);
      }
    } catch (_) {}
  }

  checkClientRev();
  setInterval(checkClientRev, 30000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      checkClientRev();
      checkSessionPing();
    }
  });
  window.addEventListener("focus", function () {
    checkClientRev();
    checkSessionPing();
  });

  // Natychmiastowa dezaktywacja — long-poll /api/session/watch (+ ping awaryjny)
  var sessionKicked = false;

  function kickToActivate(data) {
    if (sessionKicked) return;
    sessionKicked = true;
    var reason = "blocked";
    if (data && data.error === "KEY_EXPIRED") reason = "expired";
    if (data && data.error === "NO_SESSION") reason = "session";
    if (
      data &&
      (data.error === "KEY_BLOCKED_TIKTOK" ||
        data.block_reason === "tiktok_deleted")
    ) {
      reason = "tiktok";
    }
    window.location.replace(
      "activate.html?reason=" + encodeURIComponent(reason),
    );
  }

  function shouldSkipSessionWatch() {
    if (window.location.protocol === "file:") return true;
    var path = (window.location.pathname || "").toLowerCase();
    return (
      path.indexOf("activate") !== -1 ||
      path.indexOf("panel") !== -1 ||
      path.indexOf("login") !== -1
    );
  }

  function applyLiveFromServer(data) {
    if (window.AppLiveSession && typeof window.AppLiveSession.apply === "function") {
      window.AppLiveSession.apply(data, false);
    }
  }

  async function checkSessionPing() {
    if (sessionKicked || shouldSkipSessionWatch()) return;
    var ctrl =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = null;
    if (ctrl) {
      timer = setTimeout(function () {
        try {
          ctrl.abort();
        } catch (_) {}
      }, 4000);
    }
    try {
      var res = await fetch("/api/session/ping", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: ctrl ? ctrl.signal : undefined,
      });
      var data = null;
      try {
        data = await res.json();
      } catch (_) {}
      if (res.ok && data && data.ok) {
        applyLiveFromServer(data);
        return;
      }
      if (
        res.status === 401 ||
        res.status === 410 ||
        res.status === 423 ||
        (data && data.ok === false)
      ) {
        kickToActivate(data);
      }
    } catch (_) {
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function sessionWatchLoop() {
    if (shouldSkipSessionWatch()) return;
    while (!sessionKicked) {
      var ctrl =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = null;
      if (ctrl) {
        timer = setTimeout(function () {
          try {
            ctrl.abort();
          } catch (_) {}
        }, 25000);
      }
      try {
        var res = await fetch("/api/session/watch", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: ctrl ? ctrl.signal : undefined,
        });
        var data = null;
        try {
          data = await res.json();
        } catch (_) {}
        if (
          res.status === 401 ||
          res.status === 410 ||
          res.status === 423 ||
          (data && data.ok === false)
        ) {
          kickToActivate(data);
          return;
        }
        applyLiveFromServer(data);
        // ok / renew — natychmiast kolejne watch
      } catch (_) {
        await new Promise(function (r) {
          setTimeout(r, 800);
        });
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
  }

  checkSessionPing();
  setInterval(checkSessionPing, 2000);
  sessionWatchLoop();

  if (typeof ensureProfileScopedToSession === "function") {
    ensureProfileScopedToSession();
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", function (event) {
      var data = event.data || {};
      if (data.type === "FORCE_CLIENT_REFRESH") {
        softClientRefresh(data.rev);
      }
    });
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  if (window.location.protocol === "file:") {
    return;
  }

  var hadControllerOnLoad = !!navigator.serviceWorker.controller;
  var isReloadingForUpdate = false;

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js?v=107")
      .then(function (registration) {
        registration.update();
        if (registration.waiting && hadControllerOnLoad) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        try {
          if (registration.active) {
            registration.active.postMessage({ type: "CHECK_CLIENT_REV" });
          }
        } catch (_) {}
      })
      .catch(function () {});

    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadControllerOnLoad || isReloadingForUpdate) return;
      isReloadingForUpdate = true;
      window.location.reload();
    });
  });
});