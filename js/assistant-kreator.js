(function () {
  var deps = null;
  var state = {
    active: false,
    track: null,
    step: 0,
    awaitingPhoto: false,
    awaitingPhotoPick: false,
    fillMode: null, // "auto" | "manual" | "mode"
    autoPhase: null, // "gender" | "birth" | null
    autoGender: "",
    autoBirth: "",
  };

  function step(label, key, opts) {
    return {
      label: label,
      key: key,
      optional: !!(opts && opts.optional),
      type: (opts && opts.type) || "text",
      choices: (opts && opts.choices) || null,
      hint: (opts && opts.hint) || "",
      defaultValue: (opts && opts.defaultValue) || "",
    };
  }

  // Kolejność jak profiledata: najpierw płeć, potem data urodzenia
  var TRACKS = {
    mdowod: {
      title: "mDowód i dowód osobisty",
      genderKey: "gender",
      birthKey: "birthDate",
      steps: [
        step("Płeć", "gender", {
          type: "choice",
          choices: ["MĘŻCZYZNA", "KOBIETA"],
        }),
        step("Data urodzenia", "birthDate", {
          type: "date",
          hint: "Format: RRRR-MM-DD lub DD.MM.RRRR",
        }),
        step("Imię (imiona)", "name"),
        step("Nazwisko", "surname"),
        step("Obywatelstwo", "nationality", {
          optional: true,
          defaultValue: "POLSKIE",
        }),
        step("PESEL", "pesel", { hint: "11 cyfr" }),
        step("Nazwisko rodowe", "lastName", { optional: true }),
        step("Miejsce urodzenia", "placeOfBirth", { optional: true }),
        step("Imię ojca", "fathername", { optional: true }),
        step("Imię matki", "mothername", { optional: true }),
        step("Nazwisko rodowe ojca", "fatherSurname", { optional: true }),
        step("Nazwisko rodowe matki", "motherSurname", { optional: true }),
        step("Seria i numer mDowodu", "md_idSeries", { optional: true }),
        step("Data wydania mDowodu", "md_issueDate", {
          optional: true,
          type: "date",
        }),
        step("Termin ważności mDowodu", "md_expiryDate", {
          optional: true,
          type: "date",
        }),
        step("Seria i numer dowodu osobistego", "do_idSeries", {
          optional: true,
        }),
        step("Organ wydający (dowód)", "do_issuingAuthority", {
          optional: true,
        }),
        step("Data wydania dowodu", "do_issueDate", {
          optional: true,
          type: "date",
        }),
        step("Termin ważności dowodu", "do_expiryDate", {
          optional: true,
          type: "date",
        }),
        step("Adres zameldowania", "address", { optional: true }),
        step("Kod pocztowy i miejscowość", "postalcode", {
          optional: true,
        }),
        step("Data zameldowania", "registrationDate", {
          optional: true,
          type: "date",
        }),
      ],
      photo: true,
    },
    diia: {
      title: "DIIA.pl",
      genderKey: "gender_diia",
      birthKey: "diia_birthDate",
      steps: [
        step("Płeć (do PESEL)", "gender_diia", {
          type: "choice",
          choices: ["MĘŻCZYZNA", "KOBIETA"],
        }),
        step("Data urodzenia", "diia_birthDate", { type: "date" }),
        step("Imię (imiona)", "diia_name"),
        step("Nazwisko", "diia_surname"),
        step("PESEL", "diia_pesel", { hint: "11 cyfr" }),
        step("Miejsce urodzenia", "diia_placeOfBirth", { optional: true }),
        step("Kraj pochodzenia", "diia_countryOfOrigin", {
          optional: true,
          defaultValue: "UKRAINA",
        }),
        step("Obywatelstwo", "diia_nationality", {
          optional: true,
          defaultValue: "UKRAIŃSKIE",
        }),
      ],
      photo: true,
    },
    legszk: {
      title: "Legitymacja szkolna",
      genderKey: "gender_legszk",
      birthKey: "display-birthDate_legszk",
      steps: [
        step("Płeć", "gender_legszk", {
          type: "choice",
          choices: ["MĘŻCZYZNA", "KOBIETA"],
        }),
        step("Data urodzenia", "display-birthDate_legszk", { type: "date" }),
        step("Imię", "display-name_legszk"),
        step("Nazwisko", "display-surname_legszk"),
        step("PESEL", "display-pesel_legszk"),
        step("Numer legitymacji", "display-cardNumber_legszk", {
          optional: true,
        }),
        step("Data wydania", "display-issueDate_legszk", {
          optional: true,
          type: "date",
        }),
        step("Data ważności", "display-expiryDate_legszk", {
          optional: true,
          type: "date",
        }),
        step("Nazwa szkoły", "display-schoolName_legszk", { optional: true }),
        step("Adres szkoły", "display-schoolAddress_legszk", {
          optional: true,
        }),
        step("Telefon szkoły", "display-schoolPhone_legszk", {
          optional: true,
        }),
        step("Dyrektor szkoły", "display-schoolDirector_legszk", {
          optional: true,
        }),
      ],
      photo: true,
    },
    legstu: {
      title: "Legitymacja studencka",
      genderKey: "gender_legstu",
      birthKey: "display-birthDate_legstu",
      steps: [
        step("Płeć", "gender_legstu", {
          type: "choice",
          choices: ["MĘŻCZYZNA", "KOBIETA"],
        }),
        step("Data urodzenia", "display-birthDate_legstu", { type: "date" }),
        step("Imię", "display-name_legstu"),
        step("Nazwisko", "display-surname_legstu"),
        step("PESEL", "display-pesel_legstu"),
        step("Data wydania", "display-dataWydania_legstu", {
          optional: true,
          type: "date",
        }),
        step("Nazwa uczelni", "display-uczelnia_legstu", { optional: true }),
        step("Numer albumu", "display-albumNumber_legstu", { optional: true }),
      ],
      photo: true,
    },
    prawojazdy: {
      title: "Prawo jazdy",
      genderKey: "gender_prawojazdy",
      birthKey: "display-birthDate_prawojazdy",
      steps: [
        step("Płeć", "gender_prawojazdy", {
          type: "choice",
          choices: ["MĘŻCZYZNA", "KOBIETA"],
        }),
        step("Data urodzenia", "display-birthDate_prawojazdy", {
          type: "date",
        }),
        step("Imię", "display-name_prawojazdy"),
        step("Nazwisko", "display-surname_prawojazdy"),
        step("Miejsce urodzenia", "display-birthPlace_prawojazdy", {
          optional: true,
        }),
        step("PESEL", "display-pesel_prawojazdy"),
        step("Data wydania", "display-issueDate_prawojazdy", {
          optional: true,
          type: "date",
        }),
        step("Numer dokumentu", "display-documentNumber_prawojazdy", {
          optional: true,
        }),
        step("Numer blankietu", "display-blanketNumber_prawojazdy", {
          optional: true,
        }),
        step("Organ wydający", "display-issuingAuthority_prawojazdy", {
          optional: true,
        }),
      ],
      photo: true,
    },
  };

  function up(s) {
    if (s == null) return "";
    try {
      return String(s).trim().toLocaleUpperCase("pl");
    } catch (_) {
      return String(s).trim().toUpperCase();
    }
  }

  function notifyProfileSaved() {
    try {
      window.dispatchEvent(new CustomEvent("app:profile-updated"));
    } catch (_) {}
    try {
      if (typeof scheduleProfileSync === "function") scheduleProfileSync();
    } catch (_) {}
    try {
      if (typeof syncProfileToServer === "function") {
        syncProfileToServer({ force: true, silent: true });
      }
    } catch (_) {}
  }

  function saveField(key, val) {
    var s = String(val == null ? "" : val).trim();
    try {
      if (s) localStorage.setItem(key, s);
      else localStorage.removeItem(key);
    } catch (_) {}
    try {
      if (typeof scheduleProfileSync === "function") scheduleProfileSync();
    } catch (_) {}
  }

  function parseDateInput(raw) {
    var t = String(raw || "").trim();
    if (!t) return "";
    var iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return t;
    var pl = t.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
    if (pl) {
      var d = pl[1].padStart(2, "0");
      var m = pl[2].padStart(2, "0");
      return pl[3] + "-" + m + "-" + d;
    }
    return null;
  }

  function normalizeGender(raw) {
    var t = up(raw);
    if (t === "M" || t === "MEZCZYZNA" || t === "MĘŻCZYZNA") return "MĘŻCZYZNA";
    if (t === "K" || t === "KOBIETA") return "KOBIETA";
    return "";
  }

  function getCurrentStep() {
    if (!state.track || state.track === "menu" || state.fillMode === "mode") {
      return null;
    }
    if (state.fillMode === "auto") return null;
    var track = TRACKS[state.track];
    if (!track) return null;
    return track.steps[state.step] || null;
  }

  function progressText() {
    var track = TRACKS[state.track];
    if (!track) return "";
    return " (" + (state.step + 1) + "/" + track.steps.length + ")";
  }

  function disableOldKreatorButtons() {
    document.querySelectorAll(".asst-kreator-choice-btn").forEach(function (b) {
      b.disabled = true;
    });
  }

  function botSay(html, withTyping, actions) {
    if (!deps) return;
    disableOldKreatorButtons();
    if (withTyping === false) {
      deps.dodajWiadomosc(html, "bot", actions || null);
      return;
    }
    deps.scheduleBotReply(function () {
      deps.dodajWiadomosc(html, "bot", actions || null);
    });
  }

  function menuMessage() {
    return "<strong>Kreator danych</strong> — wybierz zestaw z listy:";
  }

  function menuActions() {
    return appendUtilityActions([
      { label: "1 · mDowód", value: "1" },
      { label: "2 · DIIA", value: "2" },
      { label: "3 · Leg. szkolna", value: "3" },
      { label: "4 · Leg. studencka", value: "4" },
      { label: "5 · Prawo jazdy", value: "5" },
    ]);
  }

  function appendUtilityActions(actions, opts) {
    opts = opts || {};
    var list = actions.slice();
    if (opts.stepMode) {
      list.push({
        label: "Dane losowe",
        value: "__random__",
        utility: true,
        random: true,
      });
    }
    if (opts.optional) {
      list.push({
        label: "Pomiń",
        value: "__skip__",
        ghost: true,
        utility: true,
      });
    }
    list.push({
      label: "Anuluj",
      value: "/anuluj",
      ghost: true,
      utility: true,
    });
    return list;
  }

  function questionMessage(st) {
    var html =
      "<strong>Kreator</strong>" +
      progressText() +
      "<br><strong>" +
      st.label +
      "</strong>";
    if (st.optional && st.type !== "choice") {
      html += ' <span style="opacity:0.75">(opcjonalne)</span>';
    }
    if (st.hint && st.type !== "choice") {
      html += "<br><small>" + st.hint + "</small>";
    }
    if (st.type === "choice") {
      html += "<br><small>Wybierz przycisk poniżej:</small>";
    } else if (st.defaultValue) {
      html +=
        "<br><small>Możesz wpisać własną wartość lub użyć przycisku domyślnego.</small>";
    } else if (st.optional) {
      html +=
        "<br><small>Wpisz wartość, <strong>Dane losowe</strong> lub <strong>Pomiń</strong>.</small>";
    } else {
      html +=
        "<br><small>Wpisz odpowiedź lub użyj <strong>Dane losowe</strong>.</small>";
    }
    return html;
  }

  function getQuestionActions(st) {
    var actions = [];
    if (st.type === "choice" && st.choices) {
      st.choices.forEach(function (c) {
        actions.push({ label: c, value: c });
      });
      return appendUtilityActions(actions, {
        optional: st.optional,
        stepMode: true,
      });
    }
    if (st.defaultValue) {
      actions.push({
        label: st.defaultValue + " (domyślnie)",
        value: st.defaultValue,
      });
    }
    return appendUtilityActions(actions, {
      optional: st.optional,
      stepMode: true,
    });
  }

  function photoMessage() {
    return (
      "<strong>Kreator</strong> — zdjęcie profilowe<br>" +
      "Czy chcesz dodać zdjęcie do dokumentów?"
    );
  }

  function photoActions() {
    return appendUtilityActions([
      { label: "Tak, dodaj zdjęcie", value: "tak" },
      { label: "Nie, bez zdjęcia", value: "nie", ghost: true },
    ]);
  }

  function photoPickActions() {
    return [
      { label: "Wybierz zdjęcie", value: "__pick_photo__" },
      { label: "Pomiń zdjęcie", value: "nie", ghost: true },
      { label: "Anuluj", value: "/anuluj", ghost: true, utility: true },
    ];
  }

  function resetStateFlags() {
    state.awaitingPhoto = false;
    state.awaitingPhotoPick = false;
    state.fillMode = null;
    state.autoPhase = null;
    state.autoGender = "";
    state.autoBirth = "";
  }

  function finishKreator(saved) {
    state.active = false;
    state.track = null;
    state.step = 0;
    resetStateFlags();
    if (deps && deps.setInputPlaceholder) {
      deps.setInputPlaceholder("Wpisz pytanie");
    }
    notifyProfileSaved();
    var msg = saved
      ? "Zapisano dane w aplikacji (jak w Dane osobowe). Możesz je poprawić komendą <code>/dane</code> lub uruchomić kreator ponownie: <code>/kreator</code>."
      : "Kreator zakończony. Dane tekstowe zostały zapisane. Edycja: <code>/dane</code>.";
    botSay(msg);
  }

  function cancelKreator() {
    state.active = false;
    state.track = null;
    state.step = 0;
    resetStateFlags();
    if (deps && deps.setInputPlaceholder) {
      deps.setInputPlaceholder("Wpisz pytanie");
    }
    botSay("Kreator anulowany.", false);
  }

  function startTrack(trackId) {
    state.track = trackId;
    state.step = 0;
    resetStateFlags();
    state.fillMode = "mode";
    var track = TRACKS[trackId];
    deps.scheduleBotReply(function () {
      deps.dodajWiadomosc(
        "Rozpoczynam: <strong>" +
          track.title +
          "</strong>.<br>Jak chcesz wypełnić dane?",
        "bot",
        appendUtilityActions([
          { label: "Autogeneruj dane", value: "__auto__" },
          { label: "Krok po kroku", value: "__manual__" },
        ]),
      );
    });
  }

  function askCurrentQuestion() {
    var st = getCurrentStep();
    if (!st) {
      askPhoto();
      return;
    }
    botSay(questionMessage(st), false, getQuestionActions(st));
  }

  var MALE_NAMES = [
    "JAN", "PIOTR", "KRZYSZTOF", "ANDRZEJ", "TOMASZ", "PAWEŁ", "MARCIN", "MICHAŁ",
    "JAKUB", "MATEUSZ", "ADAM", "ŁUKASZ", "KAMIL", "ROBERT", "MAREK", "WOJCIECH",
    "DANIEL", "SEBASTIAN", "BARTOSZ", "GRZEGORZ",
  ];
  var FEMALE_NAMES = [
    "ANNA", "MARIA", "KATARZYNA", "MAŁGORZATA", "JOANNA", "EWA", "BARBARA",
    "AGNIESZKA", "MAGDALENA", "MONIKA", "KAROLINA", "NATALIA", "ALEKSANDRA",
    "JULIA", "PAULINA", "MARTYNA", "ZOFIA", "WIKTORIA", "ZUZANNA",
  ];
  var MALE_SURNAMES = [
    "NOWAK", "KOWALSKI", "WIŚNIEWSKI", "WÓJCIK", "KOWALCZYK", "KAMIŃSKI",
    "LEWANDOWSKI", "ZIELIŃSKI", "SZYMAŃSKI", "WOŹNIAK", "DĄBROWSKI", "KOZŁOWSKI",
    "JANKOWSKI", "MAZUR", "KWIATKOWSKI", "KRAWCZYK", "KACZMAREK", "PIOTROWSKI",
    "GRABOWSKI", "NOWAKOWSKI",
  ];
  var FEMALE_SURNAMES = [
    "NOWAK", "KOWALSKA", "WIŚNIEWSKA", "WÓJCIK", "KOWALCZYK", "KAMIŃSKA",
    "LEWANDOWSKA", "ZIELIŃSKA", "SZYMAŃSKA", "WOŹNIAK", "DĄBROWSKA", "KOZŁOWSKA",
    "JANKOWSKA", "MAZUR", "KWIATKOWSKA", "KRAWCZYK", "KACZMAREK", "PIOTROWSKA",
    "GRABOWSKA", "NOWAKOWSKA",
  ];
  var UA_MALE_NAMES = [
    "OLEKSANDR", "ANDRIY", "VASYL", "DMYTRO", "IVAN", "MAKSYM", "MYKHAILO",
    "OLEH", "PETRO", "SERHIY", "TARAS", "VIKTOR", "VOLODYMYR", "YURIY", "BOHDAN",
  ];
  var UA_FEMALE_NAMES = [
    "OLENA", "IRYNA", "NATALIA", "TETIANA", "OKSANA", "MARIA", "HANNA",
    "SVITLANA", "YULIA", "VALENTYNA", "VIKTORIA", "KATERYNA", "ANASTASIA",
  ];
  var UA_SURNAMES = [
    "MELNYK", "SHEVCHENKO", "BOIKO", "KOVALENKO", "BONDARENKO", "TKACHENKO",
    "KRAVCHENKO", "KOVALCHUK", "KOVAL", "PETRENKO", "LYTVYN",
  ];
  var CITIES_PL = [
    "WARSZAWA", "KRAKÓW", "POZNAŃ", "WROCŁAW", "GDAŃSK", "ŁÓDŹ", "KATOWICE",
    "SZCZECIN", "LUBLIN", "BYDGOSZCZ",
  ];
  var CITIES_UA = [
    "KYIV", "KHARKIV", "ODESA", "DNIPRO", "LVIV", "ZAPORIZHZHIA", "VINNYTSIA",
  ];
  var STREETS = [
    "GŁÓWNA", "KRÓTKA", "DŁUGA", "POLNA", "SŁONECZNA", "KWIATOWA", "LEŚNA",
    "PARKOWA", "OGRODOWA", "SPACEROWA",
  ];

  function getLS(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch (_) {
      return "";
    }
  }

  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomBool() {
    return Math.random() > 0.5;
  }

  function randomGender() {
    return randomBool() ? "MĘŻCZYZNA" : "KOBIETA";
  }

  function randomBirthDateIso() {
    var today = new Date();
    var d = new Date(today);
    d.setFullYear(d.getFullYear() - 18);
    d.setDate(d.getDate() - (30 + Math.floor(Math.random() * 291)));
    return d.toISOString().split("T")[0];
  }

  function toIsoDate(d) {
    return d.toISOString().split("T")[0];
  }

  function daysAgoIso(minDays, maxDays) {
    var d = new Date();
    d.setDate(d.getDate() - (minDays + Math.floor(Math.random() * (maxDays - minDays + 1))));
    return toIsoDate(d);
  }

  function addYearsIso(iso, years) {
    var d = new Date(iso);
    d.setFullYear(d.getFullYear() + years);
    return toIsoDate(d);
  }

  function generatePeselFromDate(birthDateStr, gender) {
    if (!birthDateStr) return "";
    var g = gender || randomGender();
    var parts = birthDateStr.split("-");
    if (parts.length !== 3) return "";
    var year = parts[0];
    var month = parseInt(parts[1], 10);
    var day = parts[2];
    var yy = year.slice(2);
    var mm = month;
    if (parseInt(year, 10) >= 2000) mm += 20;
    var serial = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    var genderDigit =
      g === "MĘŻCZYZNA"
        ? String(1 + Math.floor(Math.random() * 5) * 2)
        : String(Math.floor(Math.random() * 5) * 2);
    var base = yy + String(mm).padStart(2, "0") + day + serial + genderDigit;
    var weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    var sum = 0;
    for (var i = 0; i < 10; i++) sum += parseInt(base[i], 10) * weights[i];
    return base + String((10 - (sum % 10)) % 10);
  }

  function randomLetters(n) {
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var out = "";
    for (var i = 0; i < n; i++) out += letters[Math.floor(Math.random() * 26)];
    return out;
  }

  function randomMdowodSeries() {
    return randomLetters(4) + String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  }

  function randomDowodSeries() {
    return randomLetters(3) + String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
  }

  function isMaleGender(g) {
    return up(g) === "MĘŻCZYZNA";
  }

  function randomName(isMale, ukrainian) {
    if (ukrainian) {
      return isMale ? randomPick(UA_MALE_NAMES) : randomPick(UA_FEMALE_NAMES);
    }
    return isMale ? randomPick(MALE_NAMES) : randomPick(FEMALE_NAMES);
  }

  function randomSurname(isMale, ukrainian) {
    if (ukrainian) return randomPick(UA_SURNAMES);
    return isMale ? randomPick(MALE_SURNAMES) : randomPick(FEMALE_SURNAMES);
  }

  function trackUsesUkrainian() {
    return state.track === "diia";
  }

  function getCtxGender() {
    if (state.autoGender) return state.autoGender;
    if (state.track === "mdowod") return getLS("gender");
    if (state.track === "diia") return getLS("gender_diia");
    if (state.track === "legszk") return getLS("gender_legszk");
    if (state.track === "legstu") return getLS("gender_legstu");
    if (state.track === "prawojazdy") return getLS("gender_prawojazdy");
    return "";
  }

  function getCtxBirthDate() {
    if (state.autoBirth) return state.autoBirth;
    if (state.track === "mdowod") return getLS("birthDate");
    if (state.track === "diia") return getLS("diia_birthDate");
    if (state.track === "legszk") return getLS("display-birthDate_legszk");
    if (state.track === "legstu") return getLS("display-birthDate_legstu");
    if (state.track === "prawojazdy") return getLS("display-birthDate_prawojazdy");
    return "";
  }

  /** Pełna generacja jak profiledata.html — zapis bezpośrednio do localStorage */
  function generateAllForTrack(trackId, gender, birthDate) {
    var g = gender || randomGender();
    var bd = birthDate || randomBirthDateIso();
    var male = isMaleGender(g);
    var today = new Date();

    if (trackId === "mdowod") {
      var name = randomName(male, false);
      var surname = randomSurname(male, false);
      var city = randomPick(CITIES_PL);
      var doIssue = daysAgoIso(365, 730);
      var mdIssue = daysAgoIso(0, 365);
      var street = randomPick(STREETS);
      var houseNum = Math.floor(Math.random() * 100) + 1;
      var flatNum =
        Math.random() < 0.7 ? "/" + (Math.floor(Math.random() * 50) + 1) : "";
      var birthObj = new Date(bd);
      var end2024 = new Date(2024, 11, 31);
      var regTs =
        birthObj.getTime() +
        Math.random() * Math.max(1, end2024.getTime() - birthObj.getTime());
      saveField("gender", g);
      saveField("birthDate", bd);
      saveField("name", name);
      saveField("surname", surname);
      saveField("lastName", surname);
      saveField("nationality", "POLSKIE");
      saveField("pesel", generatePeselFromDate(bd, g));
      saveField("placeOfBirth", city);
      saveField("fathername", randomName(true, false));
      saveField("mothername", randomName(false, false));
      saveField("fatherSurname", randomSurname(true, false));
      saveField("motherSurname", randomSurname(false, false));
      saveField("md_idSeries", randomMdowodSeries());
      saveField("md_issueDate", mdIssue);
      saveField("md_expiryDate", addYearsIso(mdIssue, 5));
      saveField("do_idSeries", randomDowodSeries());
      saveField("do_issuingAuthority", "PREZYDENT MIASTA " + city);
      saveField("do_issueDate", doIssue);
      saveField("do_expiryDate", addYearsIso(doIssue, 10));
      saveField("address", "UL. " + street + " " + houseNum + flatNum);
      saveField(
        "postalcode",
        String(Math.floor(Math.random() * 100)).padStart(2, "0") +
          "-" +
          String(Math.floor(Math.random() * 1000)).padStart(3, "0") +
          " " +
          city,
      );
      saveField("registrationDate", toIsoDate(new Date(regTs)));
      return;
    }

    if (trackId === "diia") {
      saveField("gender_diia", g);
      saveField("diia_birthDate", bd);
      saveField("diia_name", randomName(male, true));
      saveField("diia_surname", randomSurname(male, true));
      saveField("diia_pesel", generatePeselFromDate(bd, g));
      saveField("diia_placeOfBirth", randomPick(CITIES_UA));
      saveField("diia_countryOfOrigin", "UKRAINA");
      saveField("diia_nationality", "UKRAIŃSKIE");
      return;
    }

    if (trackId === "legszk") {
      var c = randomPick(CITIES_PL);
      var issueToday = toIsoDate(today);
      var exp = new Date(today.getFullYear(), 8, 30);
      if (today > exp) exp.setFullYear(exp.getFullYear() + 1);
      saveField("gender_legszk", g);
      saveField("display-birthDate_legszk", bd);
      saveField("display-name_legszk", randomName(male, false));
      saveField("display-surname_legszk", randomSurname(male, false));
      saveField("display-pesel_legszk", generatePeselFromDate(bd, g));
      saveField(
        "display-cardNumber_legszk",
        String(Math.floor(1000 + Math.random() * 9000)) +
          "/" +
          String(Math.floor(10 + Math.random() * 90)),
      );
      saveField("display-issueDate_legszk", issueToday);
      saveField("display-expiryDate_legszk", toIsoDate(exp));
      saveField(
        "display-schoolName_legszk",
        "SZKOŁA PODSTAWOWA NR " + (Math.floor(Math.random() * 20) + 1),
      );
      saveField(
        "display-schoolAddress_legszk",
        "UL. SZKOLNA " +
          (Math.floor(Math.random() * 50) + 1) +
          ", " +
          String(Math.floor(Math.random() * 90) + 10).padStart(2, "0") +
          "-" +
          String(Math.floor(Math.random() * 1000)).padStart(3, "0") +
          " " +
          c,
      );
      saveField(
        "display-schoolPhone_legszk",
        randomPick(["22", "12", "58", "61", "71"]) +
          " " +
          Math.floor(Math.random() * 900 + 100) +
          " " +
          Math.floor(Math.random() * 90 + 10) +
          " " +
          Math.floor(Math.random() * 90 + 10),
      );
      saveField(
        "display-schoolDirector_legszk",
        randomName(randomBool(), false) + " " + randomSurname(randomBool(), false),
      );
      return;
    }

    if (trackId === "legstu") {
      saveField("gender_legstu", g);
      saveField("display-birthDate_legstu", bd);
      saveField("display-name_legstu", randomName(male, false));
      saveField("display-surname_legstu", randomSurname(male, false));
      saveField("display-pesel_legstu", generatePeselFromDate(bd, g));
      saveField("display-dataWydania_legstu", toIsoDate(today));
      saveField(
        "display-uczelnia_legstu",
        randomPick([
          "UNIWERSYTET WARSZAWSKI",
          "POLITECHNIKA WARSZAWSKA",
          "UNIWERSYTET JAGIELLOŃSKI",
          "AGH",
        ]),
      );
      saveField(
        "display-albumNumber_legstu",
        String(Math.floor(Math.random() * 1000000)).padStart(6, "0"),
      );
      return;
    }

    if (trackId === "prawojazdy") {
      saveField("gender_prawojazdy", g);
      saveField("display-birthDate_prawojazdy", bd);
      saveField("display-name_prawojazdy", randomName(male, false));
      saveField("display-surname_prawojazdy", randomSurname(male, false));
      saveField("display-birthPlace_prawojazdy", randomPick(CITIES_PL));
      saveField("display-pesel_prawojazdy", generatePeselFromDate(bd, g));
      saveField("display-issueDate_prawojazdy", daysAgoIso(30, 2000));
      saveField(
        "display-documentNumber_prawojazdy",
        String(Math.floor(Math.random() * 100000)).padStart(5, "0") +
          "/" +
          String(Math.floor(Math.random() * 100)).padStart(2, "0") +
          "/" +
          String(Math.floor(Math.random() * 10000)).padStart(4, "0"),
      );
      saveField(
        "display-blanketNumber_prawojazdy",
        randomLetters(1) +
          String(Math.floor(Math.random() * 100000000)).padStart(8, "0"),
      );
      saveField(
        "display-issuingAuthority_prawojazdy",
        "Starostwo Powiatowe w " +
          randomPick(["Warszawie", "Lublinie", "Krakowie", "Gdańsku", "Wrocławiu"]),
      );
      saveField("display-expiryDate_prawojazdy", "Bezterminowo");
      saveField("display-blanketStatus_prawojazdy", "Wydany");
      saveField("display-restrictions_prawojazdy", "Brak");
      try {
        localStorage.setItem("pj_generatedAt", String(Date.now()));
      } catch (_) {}
    }
  }

  function generateRandomForStep(st) {
    var key = st.key;
    var ukr = trackUsesUkrainian();
    var g = getCtxGender() || randomGender();
    var male = isMaleGender(g);

    if (st.type === "choice" && st.choices && st.choices.length) {
      return randomPick(st.choices);
    }
    if (key === "name" || key === "diia_name" || key.indexOf("display-name") === 0) {
      return randomName(male, ukr);
    }
    if (
      key === "surname" ||
      key === "diia_surname" ||
      key.indexOf("display-surname") === 0
    ) {
      return randomSurname(male, ukr);
    }
    if (key === "lastName" || key === "fatherSurname" || key === "motherSurname") {
      if (key === "lastName") {
        return getLS("surname") || randomSurname(male, false);
      }
      return randomSurname(key === "motherSurname" ? false : true, false);
    }
    if (key === "fathername") return randomName(true, false);
    if (key === "mothername") return randomName(false, false);
    if (key === "nationality") return "POLSKIE";
    if (key === "diia_countryOfOrigin") return "UKRAINA";
    if (key === "diia_nationality") return "UKRAIŃSKIE";
    if (key.indexOf("gender") === 0) return randomGender();
    if (key === "birthDate" || key === "diia_birthDate" || key.indexOf("birthDate") >= 0) {
      return randomBirthDateIso();
    }
    if (key.indexOf("pesel") >= 0) {
      return generatePeselFromDate(
        getCtxBirthDate() || randomBirthDateIso(),
        getCtxGender() || randomGender(),
      );
    }
    if (key === "md_idSeries") return randomMdowodSeries();
    if (key === "do_idSeries") return randomDowodSeries();
    if (key === "do_issuingAuthority") {
      return "PREZYDENT MIASTA " + randomPick(CITIES_PL);
    }
    if (key === "do_issueDate") return daysAgoIso(365, 730);
    if (key === "md_issueDate") return daysAgoIso(0, 365);
    if (key === "md_expiryDate") {
      return addYearsIso(getLS("md_issueDate") || daysAgoIso(0, 365), 5);
    }
    if (key === "do_expiryDate") {
      return addYearsIso(getLS("do_issueDate") || daysAgoIso(365, 730), 10);
    }
    if (key === "placeOfBirth" || key === "diia_placeOfBirth") {
      return randomPick(ukr ? CITIES_UA : CITIES_PL);
    }
    if (key === "display-birthPlace_prawojazdy") return randomPick(CITIES_PL);
    if (key === "address") {
      var hn = Math.floor(Math.random() * 100) + 1;
      var flat = Math.random() < 0.7 ? "/" + (Math.floor(Math.random() * 50) + 1) : "";
      return "UL. " + randomPick(STREETS) + " " + hn + flat;
    }
    if (key === "postalcode") {
      var city = randomPick(CITIES_PL);
      return (
        String(Math.floor(Math.random() * 100)).padStart(2, "0") +
        "-" +
        String(Math.floor(Math.random() * 1000)).padStart(3, "0") +
        " " +
        city
      );
    }
    if (key === "registrationDate") {
      var bdx = getLS("birthDate") || randomBirthDateIso();
      var birthObj = new Date(bdx);
      var end2024 = new Date(2024, 11, 31);
      var ts =
        birthObj.getTime() +
        Math.random() * Math.max(1, end2024.getTime() - birthObj.getTime());
      return toIsoDate(new Date(ts));
    }
    if (key === "display-issueDate_legszk" || key === "display-dataWydania_legstu") {
      return toIsoDate(new Date());
    }
    if (key === "display-expiryDate_legszk") {
      var t = new Date();
      var exp = new Date(t.getFullYear(), 8, 30);
      if (t > exp) exp.setFullYear(exp.getFullYear() + 1);
      return toIsoDate(exp);
    }
    if (key.indexOf("issueDate") >= 0) return daysAgoIso(30, 2000);
    if (key === "display-cardNumber_legszk") {
      return (
        String(Math.floor(1000 + Math.random() * 9000)) +
        "/" +
        String(Math.floor(10 + Math.random() * 90))
      );
    }
    if (key === "display-schoolName_legszk") {
      return "SZKOŁA PODSTAWOWA NR " + (Math.floor(Math.random() * 20) + 1);
    }
    if (key === "display-schoolAddress_legszk") {
      var c2 = randomPick(CITIES_PL);
      return (
        "UL. SZKOLNA " +
        (Math.floor(Math.random() * 50) + 1) +
        ", " +
        String(Math.floor(Math.random() * 90) + 10).padStart(2, "0") +
        "-" +
        String(Math.floor(Math.random() * 1000)).padStart(3, "0") +
        " " +
        c2
      );
    }
    if (key === "display-schoolPhone_legszk") {
      return (
        randomPick(["22", "12", "58", "61", "71"]) +
        " " +
        Math.floor(Math.random() * 900 + 100) +
        " " +
        Math.floor(Math.random() * 90 + 10) +
        " " +
        Math.floor(Math.random() * 90 + 10)
      );
    }
    if (key === "display-schoolDirector_legszk") {
      return randomName(randomBool(), false) + " " + randomSurname(randomBool(), false);
    }
    if (key === "display-uczelnia_legstu") {
      return randomPick([
        "UNIWERSYTET WARSZAWSKI",
        "POLITECHNIKA WARSZAWSKA",
        "UNIWERSYTET JAGIELLOŃSKI",
        "AGH",
      ]);
    }
    if (key === "display-albumNumber_legstu") {
      return String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    }
    if (key === "display-documentNumber_prawojazdy") {
      return (
        String(Math.floor(Math.random() * 100000)).padStart(5, "0") +
        "/" +
        String(Math.floor(Math.random() * 100)).padStart(2, "0") +
        "/" +
        String(Math.floor(Math.random() * 10000)).padStart(4, "0")
      );
    }
    if (key === "display-blanketNumber_prawojazdy") {
      return (
        randomLetters(1) +
        String(Math.floor(Math.random() * 100000000)).padStart(8, "0")
      );
    }
    if (key === "display-issuingAuthority_prawojazdy") {
      return (
        "Starostwo Powiatowe w " +
        randomPick(["Warszawie", "Lublinie", "Krakowie", "Gdańsku", "Wrocławiu"])
      );
    }
    if (st.defaultValue) return st.defaultValue;
    if (st.type === "date") return randomBirthDateIso();
    return randomPick(MALE_NAMES) + " " + randomPick(MALE_SURNAMES);
  }

  function advanceAfterAnswer() {
    var st = TRACKS[state.track].steps[state.step];
    if (st && st.key === "surname") {
      var sn = getLS("surname");
      if (sn && !getLS("lastName")) saveField("lastName", sn);
    }
    state.step += 1;
    var track = TRACKS[state.track];
    if (state.step >= track.steps.length) {
      askPhoto();
    } else {
      askCurrentQuestion();
    }
  }

  function applyRandomAnswer() {
    var st = getCurrentStep();
    if (!st) return true;
    var value = generateRandomForStep(st);
    if (!value) {
      botSay("Nie udało się wygenerować wartości dla tego pola.", false);
      return true;
    }
    deps.dodajWiadomosc(value, "user");
    var result = validateAndSaveAnswer(value);
    if (!result.ok) {
      botSay(result.error, false);
      return true;
    }
    advanceAfterAnswer();
    return true;
  }

  function applyTrackDefaults(trackId) {
    if (trackId === "prawojazdy") {
      saveField("display-expiryDate_prawojazdy", "Bezterminowo");
      saveField("display-blanketStatus_prawojazdy", "Wydany");
      saveField("display-restrictions_prawojazdy", "Brak");
    }
  }

  function askPhoto() {
    var track = TRACKS[state.track];
    applyTrackDefaults(state.track);
    notifyProfileSaved();
    if (!track || !track.photo) {
      finishKreator(true);
      return;
    }
    state.awaitingPhoto = true;
    state.awaitingPhotoPick = false;
    botSay(photoMessage(), false, photoActions());
  }

  function askAutoGender() {
    state.autoPhase = "gender";
    botSay(
      "<strong>Autogeneracja</strong><br>Najpierw wybierz <strong>płeć</strong> (jak w Dane osobowe):",
      false,
      appendUtilityActions([
        { label: "MĘŻCZYZNA", value: "MĘŻCZYZNA" },
        { label: "KOBIETA", value: "KOBIETA" },
      ]),
    );
  }

  function askAutoBirth() {
    state.autoPhase = "birth";
    botSay(
      "<strong>Autogeneracja</strong><br>Podaj <strong>datę urodzenia</strong> (RRRR-MM-DD / DD.MM.RRRR) albo użyj losowej:",
      false,
      appendUtilityActions([
        { label: "Wylosuj datę (~18 lat)", value: "__random_birth__" },
      ]),
    );
  }

  function runFullAutogen() {
    generateAllForTrack(state.track, state.autoGender, state.autoBirth);
    state.autoPhase = null;
    state.fillMode = "manual";
    state.step = TRACKS[state.track].steps.length;
    botSay(
      "✅ Wygenerowano pełny zestaw danych jak w <strong>profiledata</strong> (płeć + data → reszta pól).",
      false,
    );
    deps.scheduleBotReply(function () {
      askPhoto();
    });
  }

  function handleAutoFlow(text) {
    if (state.autoPhase === "gender") {
      if (text === "__random__") {
        text = randomGender();
        deps.dodajWiadomosc(text, "user");
      }
      var g = normalizeGender(text);
      if (!g) {
        botSay("Wybierz płeć: MĘŻCZYZNA lub KOBIETA.", false);
        askAutoGender();
        return true;
      }
      state.autoGender = g;
      askAutoBirth();
      return true;
    }
    if (state.autoPhase === "birth") {
      var iso;
      if (text === "__random__" || text === "__random_birth__") {
        iso = randomBirthDateIso();
        deps.dodajWiadomosc(iso, "user");
      } else {
        iso = parseDateInput(text);
      }
      if (!iso) {
        botSay("Niepoprawna data. Użyj RRRR-MM-DD lub DD.MM.RRRR.", false);
        return true;
      }
      state.autoBirth = iso;
      runFullAutogen();
      return true;
    }
    return false;
  }

  function validateAndSaveAnswer(raw) {
    var st = getCurrentStep();
    if (!st) return { ok: false, error: "Brak aktywnego pytania." };

    var text = String(raw || "").trim();
    if (!text && st.defaultValue) text = st.defaultValue;
    if (!text && !st.optional) {
      return { ok: false, error: "To pole jest wymagane. Wpisz odpowiedź." };
    }
    if (!text && st.optional) {
      saveField(st.key, "");
      return { ok: true, skipped: true };
    }
    if (st.type === "date") {
      var iso = parseDateInput(text);
      if (!iso) {
        return {
          ok: false,
          error: "Niepoprawna data. Użyj RRRR-MM-DD lub DD.MM.RRRR.",
        };
      }
      saveField(st.key, iso);
      return { ok: true };
    }
    if (st.type === "choice") {
      var g =
        st.choices.indexOf("MĘŻCZYZNA") >= 0 ? normalizeGender(text) : up(text);
      if (st.choices.indexOf(g) < 0) {
        return { ok: false, error: "Wybierz jedną z podanych opcji." };
      }
      saveField(st.key, g);
      return { ok: true };
    }
    if (st.key.indexOf("pesel") >= 0) {
      var digits = text.replace(/\D/g, "");
      if (digits.length !== 11) {
        return { ok: false, error: "PESEL musi mieć 11 cyfr." };
      }
      saveField(st.key, digits);
      return { ok: true };
    }
    saveField(st.key, up(text));
    return { ok: true };
  }

  function handleMenuChoice(text) {
    var n = text.replace(/\s/g, "");
    var map = {
      "1": "mdowod",
      "2": "diia",
      "3": "legszk",
      "4": "legstu",
      "5": "prawojazdy",
    };
    if (map[n]) {
      startTrack(map[n]);
      return true;
    }
    botSay("Wpisz cyfrę od <strong>1</strong> do <strong>5</strong>.", false);
    return true;
  }

  function handleModeChoice(text) {
    if (text === "__auto__" || up(text) === "AUTO" || up(text).indexOf("AUTOGEN") === 0) {
      state.fillMode = "auto";
      askAutoGender();
      return true;
    }
    if (text === "__manual__" || up(text).indexOf("KROK") === 0) {
      state.fillMode = "manual";
      state.step = 0;
      botSay(
        "Tryb krok po kroku. Najpierw <strong>płeć</strong>, potem <strong>data urodzenia</strong>.",
        false,
      );
      deps.scheduleBotReply(function () {
        askCurrentQuestion();
      });
      return true;
    }
    botSay("Wybierz <strong>Autogeneruj dane</strong> albo <strong>Krok po kroku</strong>.", false);
    return true;
  }

  function handlePhotoAnswer(text) {
    if (text === "__pick_photo__") {
      var fileInput = document.getElementById("kreator-photo-input");
      if (fileInput) fileInput.click();
      return true;
    }
    var t = up(text);
    if (t === "NIE" || t === "N") {
      finishKreator(true);
      return true;
    }
    if ((t === "TAK" || t === "T") && state.awaitingPhoto && !state.awaitingPhotoPick) {
      state.awaitingPhoto = false;
      state.awaitingPhotoPick = true;
      botSay("Wybierz zdjęcie z galerii urządzenia:", false, photoPickActions());
      return true;
    }
    if (state.awaitingPhotoPick) {
      botSay("Użyj przycisków poniżej.", false, photoPickActions());
      return true;
    }
    botSay(
      "Wybierz <strong>Tak</strong> lub <strong>Nie, bez zdjęcia</strong>.",
      false,
      photoActions(),
    );
    return true;
  }

  function handleUserMessage(text) {
    if (!state.active) return false;

    var cmd = text.trim().toLowerCase();
    if (cmd === "/anuluj" || cmd === "anuluj") {
      cancelKreator();
      return true;
    }

    if (state.track === "menu") {
      return handleMenuChoice(text);
    }

    if (state.fillMode === "mode") {
      return handleModeChoice(text);
    }

    if (state.fillMode === "auto" && state.autoPhase) {
      return handleAutoFlow(text);
    }

    if (state.awaitingPhoto || state.awaitingPhotoPick) {
      return handlePhotoAnswer(text);
    }

    if (text === "__random__") {
      return applyRandomAnswer();
    }

    if (cmd === "/pomin" || cmd === "pomin" || text === "__skip__") {
      var stSkip = getCurrentStep();
      if (!stSkip || !stSkip.optional) {
        botSay("Tego pytania nie można pominąć — jest wymagane.", false);
        return true;
      }
      saveField(stSkip.key, "");
      state.step += 1;
      askCurrentQuestion();
      return true;
    }

    var result = validateAndSaveAnswer(text);
    if (!result.ok) {
      botSay(result.error, false);
      return true;
    }

    advanceAfterAnswer();
    return true;
  }

  function start() {
    if (!deps) return;
    state.active = true;
    state.track = "menu";
    state.step = 0;
    resetStateFlags();
    if (deps.setInputPlaceholder) {
      deps.setInputPlaceholder("Odpowiedź kreatora… (/anuluj)");
    }
    if (deps.hideSuggestion) deps.hideSuggestion();
    botSay(menuMessage(), undefined, menuActions());
  }

  function initPhotoInput() {
    var input = document.getElementById("kreator-photo-input");
    if (!input || input.dataset.bound === "1") return;
    input.dataset.bound = "1";
    input.addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      input.value = "";
      if (!file || !state.active) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var url = ev.target && ev.target.result;
        if (!url) return;
        if (typeof window.cacheProfileImage === "function") {
          window.cacheProfileImage(url);
        } else {
          try {
            localStorage.setItem("profileImage", url);
          } catch (_) {}
        }
        if (deps) deps.dodajWiadomosc("Zdjęcie zapisane.", "user");
        finishKreator(true);
      };
      reader.readAsDataURL(file);
    });
  }

  window.AssistantKreator = {
    init: function (d) {
      deps = d;
      initPhotoInput();
    },
    isActive: function () {
      return state.active;
    },
    start: start,
    handleUserMessage: handleUserMessage,
  };
})();