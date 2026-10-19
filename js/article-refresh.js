/**
 * Live refresh from Google Sheet (direct fetch → CORS proxy fallback)
 */
(function () {
  "use strict";
  window.TN = window.TN || {};

  TN.refreshFromSheet = async function () {
    if (TN.state.isRefreshing) return;

    const btn = document.getElementById("refresh-btn");
    TN.state.isRefreshing = true;
    btn.disabled = true;
    btn.classList.add("loading");
    btn.textContent = "↻ Refreshing…";

    try {
      let text = null;
      try {
        const res = await fetch(TN.CONFIG.sheetCsvUrl, { cache: "no-store" });
        if (res.ok) text = await res.text();
      } catch (_) {
        /* CORS blocked – fall through to proxy */
      }

      if (!text) {
        const proxyUrl = TN.CONFIG.corsProxy + encodeURIComponent(TN.CONFIG.sheetCsvUrl);
        const res = await fetch(proxyUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
        text = await res.text();
      }

      const articles = TN.csvToArticles(text);
      if (articles.length === 0) throw new Error("No articles found in sheet");

      TN.state.allArticles = articles;
      TN.populateSourceFilter();
      TN.applyFilters();

      btn.textContent = "✓ Updated";
      setTimeout(() => {
        btn.textContent = "↻ Refresh";
      }, 2000);
    } catch (err) {
      console.error("Refresh failed:", err);
      btn.textContent = "✗ Failed";
      setTimeout(() => {
        btn.textContent = "↻ Refresh";
      }, 2500);
    } finally {
      TN.state.isRefreshing = false;
      btn.disabled = false;
      btn.classList.remove("loading");
    }
  };
})();
