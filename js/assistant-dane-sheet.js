(function () {
  var loadPromise = null;

  function getHost() {
    return document.getElementById("dane-sheet-host");
  }

  function ensureDaneSheetContent() {
    var host = getHost();
    if (!host) return Promise.resolve();
    if (host.dataset.loaded === "1") return Promise.resolve();

    if (loadPromise) return loadPromise;

    loadPromise = fetch("profiledata.html", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var container = doc.querySelector(".container");
        if (!container) throw new Error("Brak edytora w profiledata.html");
        host.innerHTML = container.innerHTML;
        host.dataset.loaded = "1";
        host.classList.add("dane-sheet-host--ready");

        if (typeof window.initProfileDataEditor === "function") {
          window.initProfileDataEditor();
        }
        if (typeof window.bindProfilePhotoPicker === "function") {
          window.bindProfilePhotoPicker();
        }
        if (typeof window.loadCachedProfileImage === "function") {
          window.loadCachedProfileImage();
        }
        if (typeof window.switchTab === "function") {
          window.switchTab("mdowod");
        }
      })
      .catch(function () {
        host.innerHTML =
          '<p class="dane-sheet-error">Nie udało się załadować edytora. Otwórz stronę ponownie.</p>';
        loadPromise = null;
      });

    return loadPromise;
  }

  window.ensureDaneSheetContent = ensureDaneSheetContent;
})();