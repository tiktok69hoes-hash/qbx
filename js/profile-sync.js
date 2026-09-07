(function () {
  var PROFILE_KEYS = [
    "name",
    "surname",
    "nationality",
    "birthDate",
    "pesel",
    "lastName",
    "gender",
    "fatherSurname",
    "motherSurname",
    "placeOfBirth",
    "address",
    "postalcode",
    "registrationDate",
    "md_idSeries",
    "md_expiryDate",
    "md_issueDate",
    "do_idSeries",
    "do_issuingAuthority",
    "do_expiryDate",
    "do_issueDate",
    "fathername",
    "mothername",
    "diia_name",
    "diia_surname",
    "diia_birthDate",
    "diia_pesel",
    "diia_placeOfBirth",
    "diia_countryOfOrigin",
    "diia_nationality",
    "display-name_legszk",
    "display-surname_legszk",
    "display-birthDate_legszk",
    "display-pesel_legszk",
    "display-cardNumber_legszk",
    "display-issueDate_legszk",
    "display-expiryDate_legszk",
    "display-schoolName_legszk",
    "display-schoolAddress_legszk",
    "display-schoolPhone_legszk",
    "display-schoolDirector_legszk",
    "display-name_legstu",
    "display-surname_legstu",
    "display-birthDate_legstu",
    "display-pesel_legstu",
    "display-dataWydania_legstu",
    "display-uczelnia_legstu",
    "display-albumNumber_legstu",
    "display-name_prawojazdy",
    "display-surname_prawojazdy",
    "display-birthDate_prawojazdy",
    "display-birthPlace_prawojazdy",
    "display-pesel_prawojazdy",
    "display-category_prawojazdy",
    "display-expiryDate_prawojazdy",
    "display-issueDate_prawojazdy",
    "display-blanketStatus_prawojazdy",
    "display-documentNumber_prawojazdy",
    "display-blanketNumber_prawojazdy",
    "display-issuingAuthority_prawojazdy",
    "display-restrictions_prawojazdy",
    "profileImage",
    "pj_generatedAt",
  ];

  /** Limit serwera ~2.5MB; trzymamy zapas pod localStorage */
  var PROFILE_IMAGE_MAX_BYTES = 700000;
  var PROFILE_IMAGE_MAX_SIDE = 720;

  function loadImageElement(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(new Error("IMAGE_LOAD_FAILED"));
      };
      img.src = src;
    });
  }

  function canvasToJpegDataUrl(canvas, quality) {
    try {
      return canvas.toDataURL("image/jpeg", quality);
    } catch (_) {
      return "";
    }
  }

  /**
   * Kompresuje dataURL zdjęcia do JPEG mieszczącego się w limicie.
   */
  function compressProfileImage(dataUrl, options) {
    options = options || {};
    var maxBytes = options.maxBytes || PROFILE_IMAGE_MAX_BYTES;
    var maxSide = options.maxSide || PROFILE_IMAGE_MAX_SIDE;
    var input = String(dataUrl || "");
    if (!input || input.indexOf("data:") !== 0) {
      return Promise.resolve(input);
    }
    if (input.length <= maxBytes) {
      return Promise.resolve(input);
    }
    return loadImageElement(input)
      .then(function (img) {
        var w = img.naturalWidth || img.width || 1;
        var h = img.naturalHeight || img.height || 1;
        var scale = Math.min(1, maxSide / Math.max(w, h));
        var tw = Math.max(1, Math.round(w * scale));
        var th = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = tw;
        canvas.height = th;
        var ctx = canvas.getContext("2d");
        if (!ctx) return input;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tw, th);
        ctx.drawImage(img, 0, 0, tw, th);

        var qualities = [0.72, 0.6, 0.48, 0.36, 0.28, 0.22];
        var best = canvasToJpegDataUrl(canvas, qualities[0]) || input;
        for (var i = 0; i < qualities.length; i++) {
          var out = canvasToJpegDataUrl(canvas, qualities[i]);
          if (!out) continue;
          best = out;
          if (out.length <= maxBytes) break;
          if (i >= 3 && out.length > maxBytes) {
            tw = Math.max(160, Math.round(tw * 0.75));
            th = Math.max(160, Math.round(th * 0.75));
            canvas.width = tw;
            canvas.height = th;
            ctx = canvas.getContext("2d");
            if (!ctx) break;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, tw, th);
            ctx.drawImage(img, 0, 0, tw, th);
          }
        }
        return best;
      })
      .catch(function () {
        return input;
      });
  }

  function collectProfileFields() {
    var fields = {};
    for (var i = 0; i < PROFILE_KEYS.length; i++) {
      var key = PROFILE_KEYS[i];
      try {
        var val = localStorage.getItem(key);
        if (val != null && String(val).trim() !== "") {
          fields[key] = String(val);
        }
      } catch (_) {}
    }
    return fields;
  }

  function collectProfileFieldsForSync() {
    var fields = collectProfileFields();
    var img = fields.profileImage;
    if (!img) return Promise.resolve(fields);
    return compressProfileImage(img).then(function (compressed) {
      if (compressed) {
        fields.profileImage = compressed;
        try {
          localStorage.setItem("profileImage", compressed);
        } catch (_) {}
      }
      if (
        fields.profileImage &&
        fields.profileImage.length > PROFILE_IMAGE_MAX_BYTES * 1.2
      ) {
        delete fields.profileImage;
      }
      return fields;
    });
  }

  function clearProfileFields() {
    for (var i = 0; i < PROFILE_KEYS.length; i++) {
      try {
        localStorage.removeItem(PROFILE_KEYS[i]);
      } catch (_) {}
    }
    try {
      localStorage.removeItem("photo");
    } catch (_) {}
  }

  function applyProfileFields(fields) {
    clearProfileFields();
    if (!fields || typeof fields !== "object") return;
    var keys = Object.keys(fields);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var val = fields[key];
      if (val == null) continue;
      try {
        localStorage.setItem(key, String(val));
      } catch (_) {}
    }
  }

  function loadProfileFromServer() {
    return fetch("/api/profile/fields", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok && d && d.ok, data: d };
        });
      })
      .then(function (res) {
        if (!res.ok || !res.data) return res;
        applyProfileFields(res.data.fields || {});
        if (res.data.token) {
          try {
            localStorage.setItem("profile_sync_token", String(res.data.token));
          } catch (_) {}
        }
        if (
          res.data.profile_rev != null &&
          window.AppLiveSession &&
          window.AppLiveSession._setProfileRev
        ) {
          window.AppLiveSession._setProfileRev(res.data.profile_rev);
        }
        lastSyncJson = JSON.stringify(collectProfileFields());
        try {
          window.dispatchEvent(
            new CustomEvent("app:profile-updated", {
              detail: { source: "server-load", ts: Date.now() },
            }),
          );
        } catch (_) {}
        return res;
      })
      .catch(function () {
        return { ok: false };
      });
  }

  function ensureProfileScopedToSession() {
    return fetch("/api/profile/me", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.ok || !data.profile || !data.profile.token) {
          return { ok: true, skipped: true };
        }
        var serverToken = String(data.profile.token);
        var localToken = "";
        try {
          localToken = localStorage.getItem("profile_sync_token") || "";
        } catch (_) {}
        if (serverToken !== localToken) {
          return loadProfileFromServer();
        }
        return { ok: true, skipped: true };
      })
      .catch(function () {
        return { ok: false };
      });
  }

  var syncTimer = null;
  var lastSyncJson = "";

  function syncProfileToServer(options) {
    var silent = options && options.silent;
    return collectProfileFieldsForSync()
      .then(function (fields) {
        var json = JSON.stringify(fields);
        if (json === lastSyncJson && !(options && options.force)) {
          return { ok: true, skipped: true };
        }
        return fetch("/api/profile/sync", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: fields }),
        })
          .then(function (r) {
            return r.json().then(function (d) {
              return {
                ok: r.ok && d && d.ok,
                data: d,
                status: r.status,
                json: json,
              };
            });
          })
          .then(function (res) {
            if (res.ok && res.data && res.data.token) {
              lastSyncJson = res.json || json;
              try {
                localStorage.setItem(
                  "profile_sync_token",
                  String(res.data.token),
                );
              } catch (_) {}
              try {
                window.dispatchEvent(
                  new CustomEvent("app:profile-updated", {
                    detail: { source: "sync", ts: Date.now() },
                  }),
                );
              } catch (_) {}
            }
            return res;
          });
      })
      .catch(function (err) {
        if (!silent) console.warn("profile sync failed", err);
        return { ok: false, error: err };
      });
  }

  function scheduleProfileSync() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      syncProfileToServer({ silent: true });
    }, 1800);
  }

  window.PROFILE_STORAGE_KEYS = PROFILE_KEYS;
  window.clearProfileFields = clearProfileFields;
  window.collectProfileFields = collectProfileFields;
  window.applyProfileFields = applyProfileFields;
  window.compressProfileImage = compressProfileImage;
  window.loadProfileFromServer = loadProfileFromServer;
  window.ensureProfileScopedToSession = ensureProfileScopedToSession;
  window.syncProfileToServer = syncProfileToServer;
  window.scheduleProfileSync = scheduleProfileSync;
})();