(function () {
  var state = {
    configRev: null,
    profileRev: null,
  };

  function applyDocuments(data, force) {
    if (!data || !data.enabled_documents) return;
    var rev = Number(data.config_rev || 0);
    if (
      !force &&
      !data.documents_changed &&
      state.configRev !== null &&
      rev === state.configRev
    ) {
      return;
    }
    state.configRev = rev;
    if (
      window.DocumentsLiveApi &&
      typeof window.DocumentsLiveApi.applyServerDocuments === "function"
    ) {
      window.DocumentsLiveApi.applyServerDocuments(
        data.enabled_documents,
        rev,
        true,
      );
    }
  }

  function notifyProfileUpdated() {
    try {
      window.dispatchEvent(
        new CustomEvent("app:profile-updated", { detail: { ts: Date.now() } }),
      );
    } catch (_) {}
  }

  function applyProfile(data, force) {
    if (!data) return;
    var rev = Number(data.profile_rev || 0);
    if (
      !force &&
      !data.profile_changed &&
      state.profileRev !== null &&
      rev === state.profileRev
    ) {
      return;
    }
    state.profileRev = rev;
    if (typeof loadProfileFromServer !== "function") {
      notifyProfileUpdated();
      return;
    }
    loadProfileFromServer().then(function () {
      notifyProfileUpdated();
    });
  }

  function applyLiveSessionPayload(data, force) {
    if (!data || data.ok === false) return;
    applyDocuments(data, force);
    applyProfile(data, force);
  }

  window.AppLiveSession = {
    apply: applyLiveSessionPayload,
    reset: function () {
      state.configRev = null;
      state.profileRev = null;
    },
    _setProfileRev: function (rev) {
      state.profileRev = Number(rev || 0);
    },
    _setConfigRev: function (rev) {
      state.configRev = Number(rev || 0);
    },
  };
})();