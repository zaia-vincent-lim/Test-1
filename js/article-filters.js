/**
 * Source filter population + search / sort / source filtering
 */
(function () {
  "use strict";
  window.TN = window.TN || {};

  TN.populateSourceFilter = function () {
    const select = document.getElementById("source");
    const current = select.value;

    const sources = [
      ...new Set(TN.state.allArticles.map((a) => TN.getSource(a.link)).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    select.innerHTML =
      '<option value="">All sources</option>' +
      sources
        .map(
          (s) =>
            `<option value="${TN.escapeHtml(s)}" ${
              s === current ? "selected" : ""
            }>${TN.escapeHtml(s)}</option>`
        )
        .join("");
  };

  TN.applyFilters = function () {
    const query = document.getElementById("search").value.trim().toLowerCase();
    const sort = document.getElementById("sort").value;
    const source = document.getElementById("source").value;

    TN.state.filtered = TN.state.allArticles.filter((a) => {
      if (source && TN.getSource(a.link) !== source) return false;
      if (!query) return true;
      return (
        (a.title || "").toLowerCase().includes(query) ||
        (a.short || "").toLowerCase().includes(query) ||
        (a.full || "").toLowerCase().includes(query)
      );
    });

    TN.state.filtered.sort((a, b) => {
      if (sort === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      const da = TN.parseDate(a.published);
      const db = TN.parseDate(b.published);
      return sort === "oldest" ? da - db : db - da;
    });

    TN.renderFromStart();
  };
})();
