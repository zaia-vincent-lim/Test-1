/**
 * Tabletop News Prototype – Application Logic
 * ------------------------------------------
 * Features:
 *   - Source filter
 *   - Infinite scroll (replaces pagination)
 *   - Live refresh from Google Sheet (via CORS proxy + embedded fallback)
 *
 * Depends on: window.ARTICLES (from article-article-data.js)
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------
  const CONFIG = {
    batchSize: 24,                 // cards loaded per scroll batch
    searchDebounceMs: 200,
    scrollThresholdPx: 400,        // how close to bottom before loading more
    // Public Google Sheet CSV export
    sheetCsvUrl:
      "https://docs.google.com/spreadsheets/d/1Y_5a6znPED6kTf5Kl1yFJC0lEGbT0sDYWH6fVUHtbxA/export?format=csv",
    // CORS proxy (for live refresh). Change or remove if you add your own backend.
    corsProxy: "https://api.allorigins.win/raw?url=",
  };

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const state = {
    allArticles: [],
    filtered: [],
    displayedCount: 0,   // how many cards are currently shown
    isLoadingMore: false,
    isRefreshing: false,
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function parseDate(str) {
    if (!str) return 0;
    const d = new Date(str);
    return isNaN(d) ? 0 : d.getTime();
  }

  function formatDate(str) {
    if (!str) return "Unknown date";
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getSource(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "link";
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Simple CSV parser that handles quoted fields */
  function parseCSV(text) {
    const rows = [];
    let i = 0;
    const len = text.length;

    function parseField() {
      let field = "";
      if (text[i] === '"') {
        i++;
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            field += text[i++];
          }
        }
      } else {
        while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          field += text[i++];
        }
      }
      return field;
    }

    while (i < len) {
      if (text[i] === "\n" || text[i] === "\r") {
        i++;
        continue;
      }
      const row = [];
      while (i < len) {
        row.push(parseField());
        if (text[i] === ",") {
          i++;
        } else {
          while (i < len && (text[i] === "\r" || text[i] === "\n")) i++;
          break;
        }
      }
      if (row.length > 0 && row.some((c) => c.trim())) {
        rows.push(row);
      }
    }
    return rows;
  }

  function csvToArticles(csvText) {
    const rows = parseCSV(csvText);
    if (rows.length < 2) return [];

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const titleIdx = header.findIndex((h) => h.includes("title"));
    const linkIdx = header.findIndex((h) => h.includes("link"));
    const pubIdx = header.findIndex((h) => h.includes("published"));
    const shortIdx = header.findIndex((h) => h.includes("short"));
    const fullIdx = header.findIndex((h) => h.includes("full"));

    return rows
      .slice(1)
      .map((row) => ({
        title: row[titleIdx] || "",
        link: row[linkIdx] || "#",
        published: row[pubIdx] || "",
        short: row[shortIdx] || "",
        full: row[fullIdx] || "",
      }))
      .filter((a) => a.title);
  }

  // ---------------------------------------------------------------------------
  // Source filter population
  // ---------------------------------------------------------------------------
  function populateSourceFilter() {
    const select = document.getElementById("source");
    const current = select.value;

    const sources = [
      ...new Set(state.allArticles.map((a) => getSource(a.link)).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));

    select.innerHTML =
      '<option value="">All sources</option>' +
      sources
        .map(
          (s) =>
            `<option value="${escapeHtml(s)}" ${
              s === current ? "selected" : ""
            }>${escapeHtml(s)}</option>`
        )
        .join("");
  }

  // ---------------------------------------------------------------------------
  // Rendering (infinite scroll style)
  // ---------------------------------------------------------------------------
  function createCardHTML(article, index) {
    return `
      <article class="card" data-index="${index}">
        <a class="card-title" href="${escapeHtml(article.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
          ${escapeHtml(article.title)}
        </a>
        <div class="card-meta">
          <span class="card-date">${formatDate(article.published)}</span>
          <span class="card-source">${escapeHtml(getSource(article.link))}</span>
        </div>
        <p class="card-summary">${escapeHtml(article.short || article.full || "")}</p>
        <div class="card-footer">
          <button class="btn-read" data-index="${index}">Read more</button>
          <a class="btn-link" href="${escapeHtml(article.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
            Visit ↗
          </a>
        </div>
      </article>
    `;
  }

  function updateStats() {
    const stats = document.getElementById("stats");
    const total = state.filtered.length;
    const shown = Math.min(state.displayedCount, total);
    stats.textContent =
      total === 0
        ? "0 articles"
        : shown < total
        ? `Showing ${shown} of ${total}`
        : `${total} article${total !== 1 ? "s" : ""}`;
  }

  function updateScrollStatus() {
    const el = document.getElementById("scroll-status");
    const total = state.filtered.length;
    const shown = state.displayedCount;

    if (total === 0) {
      el.hidden = true;
      return;
    }

    el.hidden = false;
    if (state.isLoadingMore) {
      el.className = "scroll-status loading";
      el.textContent = "Loading more";
    } else if (shown >= total) {
      el.className = "scroll-status";
      el.textContent = "— End of results —";
    } else {
      el.className = "scroll-status";
      el.textContent = "Scroll for more…";
    }
  }

  /** Full re-render (used after filter/sort/refresh) */
  function renderFromStart() {
    const content = document.getElementById("content");

    if (state.filtered.length === 0) {
      content.className = "empty";
      content.textContent = "No articles match your filters.";
      state.displayedCount = 0;
      updateStats();
      updateScrollStatus();
      return;
    }

    state.displayedCount = Math.min(CONFIG.batchSize, state.filtered.length);
    const slice = state.filtered.slice(0, state.displayedCount);

    content.className = "grid";
    content.innerHTML = slice.map((a, i) => createCardHTML(a, i)).join("");

    bindCardEvents(content);
    updateStats();
    updateScrollStatus();
  }

  /** Append next batch (infinite scroll) */
  function loadMore() {
    if (state.isLoadingMore) return;
    if (state.displayedCount >= state.filtered.length) return;

    state.isLoadingMore = true;
    updateScrollStatus();

    // Small delay so the loading indicator is visible
    requestAnimationFrame(() => {
      const content = document.getElementById("content");
      const start = state.displayedCount;
      const end = Math.min(start + CONFIG.batchSize, state.filtered.length);
      const slice = state.filtered.slice(start, end);

      const fragment = document.createDocumentFragment();
      const temp = document.createElement("div");
      temp.innerHTML = slice.map((a, i) => createCardHTML(a, start + i)).join("");
      while (temp.firstChild) fragment.appendChild(temp.firstChild);

      content.appendChild(fragment);
      bindCardEvents(content); // re-bind only new ones is more efficient, but simple is fine

      state.displayedCount = end;
      state.isLoadingMore = false;
      updateStats();
      updateScrollStatus();
    });
  }

  function bindCardEvents(container) {
    container.querySelectorAll(".card").forEach((card) => {
      // Avoid duplicate listeners by cloning or checking – simple approach: replace
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);

      newCard.addEventListener("click", (e) => {
        if (e.target.closest("a") || e.target.closest("button")) return;
        openModal(+newCard.dataset.index);
      });

      const btn = newCard.querySelector(".btn-read");
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          openModal(+btn.dataset.index);
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Modal
  // ---------------------------------------------------------------------------
  function openModal(index) {
    const article = state.filtered[index];
    if (!article) return;

    document.getElementById("modal-title").textContent = article.title;
    document.getElementById("modal-meta").innerHTML = `
      <span class="card-date">${formatDate(article.published)}</span>
      <span>${escapeHtml(getSource(article.link))}</span>
    `;
    document.getElementById("modal-body").textContent =
      article.full || article.short || "No full summary available.";
    document.getElementById("modal-link").href = article.link;

    document.getElementById("modal").classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    document.getElementById("modal").classList.remove("open");
    document.body.style.overflow = "";
  }

  // ---------------------------------------------------------------------------
  // Filtering & Sorting
  // ---------------------------------------------------------------------------
  function applyFilters() {
    const query = document.getElementById("search").value.trim().toLowerCase();
    const sort = document.getElementById("sort").value;
    const source = document.getElementById("source").value;

    state.filtered = state.allArticles.filter((a) => {
      if (source && getSource(a.link) !== source) return false;
      if (!query) return true;
      return (
        (a.title || "").toLowerCase().includes(query) ||
        (a.short || "").toLowerCase().includes(query) ||
        (a.full || "").toLowerCase().includes(query)
      );
    });

    state.filtered.sort((a, b) => {
      if (sort === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      const da = parseDate(a.published);
      const db = parseDate(b.published);
      return sort === "oldest" ? da - db : db - da;
    });

    renderFromStart();
  }

  // ---------------------------------------------------------------------------
  // Live refresh from Google Sheet
  // ---------------------------------------------------------------------------
  async function refreshFromSheet() {
    if (state.isRefreshing) return;

    const btn = document.getElementById("refresh-btn");
    state.isRefreshing = true;
    btn.disabled = true;
    btn.classList.add("loading");
    btn.textContent = "↻ Refreshing…";

    try {
      // Try direct fetch first (works if CORS is allowed), then proxy
      let text = null;
      try {
        const res = await fetch(CONFIG.sheetCsvUrl, { cache: "no-store" });
        if (res.ok) text = await res.text();
      } catch (_) {
        /* CORS blocked – fall through to proxy */
      }

      if (!text) {
        const proxyUrl = CONFIG.corsProxy + encodeURIComponent(CONFIG.sheetCsvUrl);
        const res = await fetch(proxyUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
        text = await res.text();
      }

      const articles = csvToArticles(text);
      if (articles.length === 0) throw new Error("No articles found in sheet");

      state.allArticles = articles;
      populateSourceFilter();
      applyFilters();

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
      // Keep existing data – do not clear
    } finally {
      state.isRefreshing = false;
      btn.disabled = false;
      btn.classList.remove("loading");
    }
  }

  // ---------------------------------------------------------------------------
  // Infinite scroll listener
  // ---------------------------------------------------------------------------
  function onScroll() {
    if (state.isLoadingMore) return;
    if (state.displayedCount >= state.filtered.length) return;

    const scrollBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - CONFIG.scrollThresholdPx;

    if (scrollBottom) {
      loadMore();
    }
  }

  // ---------------------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------------------
  function setupEventListeners() {
    // Modal
    document.getElementById("modal-close").addEventListener("click", closeModal);
    document.getElementById("modal").addEventListener("click", (e) => {
      if (e.target === document.getElementById("modal")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Search (debounced)
    let searchTimeout;
    document.getElementById("search").addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(applyFilters, CONFIG.searchDebounceMs);
    });

    // Sort + Source
    document.getElementById("sort").addEventListener("change", applyFilters);
    document.getElementById("source").addEventListener("change", applyFilters);

    // Refresh
    document.getElementById("refresh-btn").addEventListener("click", refreshFromSheet);

    // Infinite scroll
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function init() {
    if (typeof ARTICLES === "undefined" || !Array.isArray(ARTICLES)) {
      document.getElementById("content").className = "error";
      document.getElementById("content").textContent =
        "Error: Article data failed to load. Make sure article-data.js is present.";
      return;
    }

    state.allArticles = ARTICLES;
    populateSourceFilter();
    setupEventListeners();
    applyFilters();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
