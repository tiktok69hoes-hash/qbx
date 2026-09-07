(function () {
  var deps = null;

  var SECTIONS = [
    {
      id: "mdowod",
      title: "mDowód i dowód osobisty",
      fields: [
        { label: "Imię", key: "name" },
        { label: "Nazwisko", key: "surname" },
        { label: "Obywatelstwo", key: "nationality" },
        { label: "Data urodzenia", key: "birthDate" },
        { label: "Płeć", key: "gender" },
        { label: "PESEL", key: "pesel" },
        { label: "Nazwisko rodowe", key: "lastName" },
        { label: "Miejsce urodzenia", key: "placeOfBirth" },
        { label: "Seria mDowód", key: "md_idSeries" },
        { label: "Seria dowód osobisty", key: "do_idSeries" },
        { label: "Adres", key: "address" },
        { label: "Kod pocztowy", key: "postalcode" },
      ],
    },
    {
      id: "diia",
      title: "DIIA.pl",
      fields: [
        { label: "Imię", key: "diia_name" },
        { label: "Nazwisko", key: "diia_surname" },
        { label: "Data urodzenia", key: "diia_birthDate" },
        { label: "PESEL", key: "diia_pesel" },
        { label: "Miejsce urodzenia", key: "diia_placeOfBirth" },
        { label: "Kraj pochodzenia", key: "diia_countryOfOrigin" },
        { label: "Obywatelstwo", key: "diia_nationality" },
      ],
    },
    {
      id: "legszk",
      title: "Legitymacja szkolna",
      fields: [
        { label: "Imię", key: "display-name_legszk" },
        { label: "Nazwisko", key: "display-surname_legszk" },
        { label: "Data urodzenia", key: "display-birthDate_legszk" },
        { label: "PESEL", key: "display-pesel_legszk" },
        { label: "Numer legitymacji", key: "display-cardNumber_legszk" },
        { label: "Nazwa szkoły", key: "display-schoolName_legszk" },
      ],
    },
    {
      id: "legstu",
      title: "Legitymacja studencka",
      fields: [
        { label: "Imię", key: "display-name_legstu" },
        { label: "Nazwisko", key: "display-surname_legstu" },
        { label: "Data urodzenia", key: "display-birthDate_legstu" },
        { label: "PESEL", key: "display-pesel_legstu" },
        { label: "Uczelnia", key: "display-uczelnia_legstu" },
        { label: "Numer albumu", key: "display-albumNumber_legstu" },
      ],
    },
    {
      id: "prawojazdy",
      title: "Prawo jazdy",
      fields: [
        { label: "Imię", key: "display-name_prawojazdy" },
        { label: "Nazwisko", key: "display-surname_prawojazdy" },
        { label: "Data urodzenia", key: "display-birthDate_prawojazdy" },
        { label: "Miejsce urodzenia", key: "display-birthPlace_prawojazdy" },
        { label: "PESEL", key: "display-pesel_prawojazdy" },
        { label: "Numer dokumentu", key: "display-documentNumber_prawojazdy" },
      ],
    },
  ];

  /** Pary [klucz_źródło, klucz_cel] */
  var COPY_PRESETS = {
    mdowod_legstu: [
      ["name", "display-name_legstu"],
      ["surname", "display-surname_legstu"],
      ["birthDate", "display-birthDate_legstu"],
      ["pesel", "display-pesel_legstu"],
      ["gender", "gender_legstu"],
    ],
    mdowod_legszk: [
      ["name", "display-name_legszk"],
      ["surname", "display-surname_legszk"],
      ["birthDate", "display-birthDate_legszk"],
      ["pesel", "display-pesel_legszk"],
      ["gender", "gender_legszk"],
    ],
    mdowod_prawojazdy: [
      ["name", "display-name_prawojazdy"],
      ["surname", "display-surname_prawojazdy"],
      ["birthDate", "display-birthDate_prawojazdy"],
      ["pesel", "display-pesel_prawojazdy"],
      ["placeOfBirth", "display-birthPlace_prawojazdy"],
      ["gender", "gender_prawojazdy"],
    ],
    mdowod_diia: [
      ["name", "diia_name"],
      ["surname", "diia_surname"],
      ["birthDate", "diia_birthDate"],
      ["pesel", "diia_pesel"],
      ["placeOfBirth", "diia_placeOfBirth"],
    ],
    diia_mdowod: [
      ["diia_name", "name"],
      ["diia_surname", "surname"],
      ["diia_birthDate", "birthDate"],
      ["diia_pesel", "pesel"],
      ["diia_placeOfBirth", "placeOfBirth"],
    ],
    legstu_legszk: [
      ["display-name_legstu", "display-name_legszk"],
      ["display-surname_legstu", "display-surname_legszk"],
      ["display-birthDate_legstu", "display-birthDate_legszk"],
      ["display-pesel_legstu", "display-pesel_legszk"],
      ["gender_legstu", "gender_legszk"],
    ],
    legstu_prawojazdy: [
      ["display-name_legstu", "display-name_prawojazdy"],
      ["display-surname_legstu", "display-surname_prawojazdy"],
      ["display-birthDate_legstu", "display-birthDate_prawojazdy"],
      ["display-pesel_legstu", "display-pesel_prawojazdy"],
    ],
    legszk_legstu: [
      ["display-name_legszk", "display-name_legstu"],
      ["display-surname_legszk", "display-surname_legstu"],
      ["display-birthDate_legszk", "display-birthDate_legstu"],
      ["display-pesel_legszk", "display-pesel_legstu"],
      ["gender_legszk", "gender_legstu"],
    ],
  };

  var COPY_OPTIONS = [
    { preset: "mdowod_legstu", label: "mDowód → Leg. studencka" },
    { preset: "mdowod_legszk", label: "mDowód → Leg. szkolna" },
    { preset: "mdowod_prawojazdy", label: "mDowód → Prawo jazdy" },
    { preset: "mdowod_diia", label: "mDowód → DIIA" },
    { preset: "diia_mdowod", label: "DIIA → mDowód" },
    { preset: "legstu_legszk", label: "Leg. studencka → Leg. szkolna" },
    { preset: "legstu_prawojazdy", label: "Leg. studencka → Prawo jazdy" },
    { preset: "legszk_legstu", label: "Leg. szkolna → Leg. studencka" },
  ];

  function getLS(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch (_) {
      return "";
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function copyPreset(presetId) {
    var pairs = COPY_PRESETS[presetId];
    if (!pairs) return { ok: false, count: 0 };
    var count = 0;
    pairs.forEach(function (pair) {
      var val = getLS(pair[0]);
      if (!val) return;
      try {
        localStorage.setItem(pair[1], val);
        count += 1;
      } catch (_) {}
    });
    return { ok: count > 0, count: count };
  }

  function renderDataList() {
    var host = document.getElementById("pokaz-sheet-list");
    if (!host) return;
    host.innerHTML = "";
    var hasAny = false;

    SECTIONS.forEach(function (section) {
      var items = section.fields.filter(function (f) {
        return getLS(f.key);
      });
      if (!items.length) return;
      hasAny = true;

      var block = document.createElement("section");
      block.className = "pokaz-data-block";
      block.innerHTML = "<h3 class=\"pokaz-data-block__title\">" + escapeHtml(section.title) + "</h3>";
      var ul = document.createElement("ul");
      ul.className = "pokaz-data-list";
      items.forEach(function (f) {
        var li = document.createElement("li");
        li.className = "pokaz-data-list__item";
        li.innerHTML =
          "<span class=\"pokaz-data-list__label\">" +
          escapeHtml(f.label) +
          "</span>" +
          "<span class=\"pokaz-data-list__value\">" +
          escapeHtml(getLS(f.key)) +
          "</span>" +
          "<button type=\"button\" class=\"pokaz-copy-field-btn\" data-copy-value=\"" +
          escapeHtml(getLS(f.key)) +
          "\">Kopiuj</button>";
        ul.appendChild(li);
      });
      block.appendChild(ul);
      host.appendChild(block);
    });

    if (!hasAny) {
      host.innerHTML =
        '<p class="pokaz-data-empty">Brak zapisanych danych. Uzupełnij je komendą <strong>/dane</strong> lub <strong>/kreator</strong>.</p>';
    }

    host.querySelectorAll(".pokaz-copy-field-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var val = btn.getAttribute("data-copy-value") || "";
        if (!val) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).then(function () {
            btn.textContent = "Skopiowano!";
            setTimeout(function () {
              btn.textContent = "Kopiuj";
            }, 1500);
          });
        }
      });
    });
  }

  function renderCopyButtons() {
    var host = document.getElementById("pokaz-copy-targets");
    if (!host) return;
    host.innerHTML = "";
    COPY_OPTIONS.forEach(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pokaz-copy-preset-btn";
      btn.textContent = opt.label;
      btn.addEventListener("click", function () {
        var result = copyPreset(opt.preset);
        var msg = result.ok
          ? "Skopiowano " +
            result.count +
            " pól (" +
            opt.label +
            "). Możesz je poprawić w <code>/dane</code>."
          : "Brak danych do skopiowania — uzupełnij najpierw kartę źródłową.";
        if (deps && deps.onNotify) deps.onNotify(msg);
        renderDataList();
      });
      host.appendChild(btn);
    });
  }

  function open() {
    var overlay = document.getElementById("pokaz-sheet-overlay");
    if (!overlay) return;
    renderCopyButtons();
    renderDataList();
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("pokaz-sheet-active");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("is-open");
      });
    });
  }

  function close(event) {
    if (event && event.target && event.target.closest) {
      if (event.target.closest(".pokaz-sheet-panel") && !event.target.closest("[data-close]")) {
        return;
      }
    }
    var overlay = document.getElementById("pokaz-sheet-overlay");
    if (!overlay) return;
    var panel = overlay.querySelector(".pokaz-sheet-panel");
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      overlay.classList.remove("is-visible");
      document.body.classList.remove("pokaz-sheet-active");
    };
    if (panel) {
      var onEnd = function (e) {
        if (e.propertyName !== "transform") return;
        panel.removeEventListener("transitionend", onEnd);
        finish();
      };
      panel.addEventListener("transitionend", onEnd);
      setTimeout(finish, 420);
    } else {
      finish();
    }
  }

  window.AssistantPokaz = {
    init: function (d) {
      deps = d;
    },
    open: open,
    close: close,
  };

  window.closePokazSheet = close;
  window.openPokazSheet = open;
})();