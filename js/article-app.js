/**
 * Application entry point – wires events and boots the app
 * Load order (see article-index.html):
 *   article-data.js → article-config.js → article-helpers.js →
 *   article-render.js → article-filters.js → article-refresh.js →
 *   article-scroll.js → article-app.js
 */
(function () {
  "use strict";

  function setupEventListeners() {
    // Modal
    document.getElementById("modal-close").addEventListener("click", TN.closeModal);
    document.getElementById("modal").addEventListener("click", (e) => {
      if (e.target === document.getElementById("modal")) TN.closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") TN.closeModal();
    });

    // Search (debounced)
    let searchTimeout;
    document.getElementById("search").addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(TN.applyFilters, TN.CONFIG.searchDebounceMs);
    });

    // Sort + Source
    document.getElementById("sort").addEventListener("change", TN.applyFilters);
    document.getElementById("source").addEventListener("change", TN.applyFilters);

    // Refresh
    document.getElementById("refresh-btn").addEventListener("click", TN.refreshFromSheet);

    // Infinite scroll
    window.addEventListener("scroll", TN.onScroll, { passive: true });
  }

  function init() {
    if (typeof ARTICLES === "undefined" || !Array.isArray(ARTICLES)) {
      document.getElementById("content").className = "error";
      document.getElementById("content").textContent =
        "Error: Article data failed to load. Make sure article-data.js is present.";
      return;
    }

    TN.state.allArticles = ARTICLES;
    TN.populateSourceFilter();
    setupEventListeners();
    TN.applyFilters();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
