/**
 * Rendering: cards, stats, scroll status, modal UI
 */
(function () {
  "use strict";
  window.TN = window.TN || {};

  TN.createCardHTML = function (article, index) {
    return `
      <article class="card" data-index="${index}">
        <a class="card-title" href="${TN.escapeHtml(article.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
          ${TN.escapeHtml(article.title)}
        </a>
        <div class="card-meta">
          <span class="card-date">${TN.formatDate(article.published)}</span>
          <span class="card-source">${TN.escapeHtml(TN.getSource(article.link))}</span>
        </div>
        <p class="card-summary">${TN.escapeHtml(article.short || article.full || "")}</p>
        <div class="card-footer">
          <button class="btn-read" data-index="${index}">Read more</button>
          <a class="btn-link" href="${TN.escapeHtml(article.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
            Visit ↗
          </a>
        </div>
      </article>
    `;
  };

  TN.updateStats = function () {
    const stats = document.getElementById("stats");
    const total = TN.state.filtered.length;
    const shown = Math.min(TN.state.displayedCount, total);
    stats.textContent =
      total === 0
        ? "0 articles"
        : shown < total
        ? `Showing ${shown} of ${total}`
        : `${total} article${total !== 1 ? "s" : ""}`;
  };

  TN.updateScrollStatus = function () {
    const el = document.getElementById("scroll-status");
    const total = TN.state.filtered.length;
    const shown = TN.state.displayedCount;

    if (total === 0) {
      el.hidden = true;
      return;
    }

    el.hidden = false;
    if (TN.state.isLoadingMore) {
      el.className = "scroll-status loading";
      el.textContent = "Loading more";
    } else if (shown >= total) {
      el.className = "scroll-status";
      el.textContent = "— End of results —";
    } else {
      el.className = "scroll-status";
      el.textContent = "Scroll for more…";
    }
  };

  TN.bindCardEvents = function (container) {
    container.querySelectorAll(".card").forEach((card) => {
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);

      newCard.addEventListener("click", (e) => {
        if (e.target.closest("a") || e.target.closest("button")) return;
        TN.openModal(+newCard.dataset.index);
      });

      const btn = newCard.querySelector(".btn-read");
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          TN.openModal(+btn.dataset.index);
        });
      }
    });
  };

  /** Full re-render (after filter / sort / refresh) */
  TN.renderFromStart = function () {
    const content = document.getElementById("content");

    if (TN.state.filtered.length === 0) {
      content.className = "empty";
      content.textContent = "No articles match your filters.";
      TN.state.displayedCount = 0;
      TN.updateStats();
      TN.updateScrollStatus();
      return;
    }

    TN.state.displayedCount = Math.min(TN.CONFIG.batchSize, TN.state.filtered.length);
    const slice = TN.state.filtered.slice(0, TN.state.displayedCount);

    content.className = "grid";
    content.innerHTML = slice.map((a, i) => TN.createCardHTML(a, i)).join("");

    TN.bindCardEvents(content);
    TN.updateStats();
    TN.updateScrollStatus();
  };

  /** Append next batch (infinite scroll) */
  TN.loadMore = function () {
    if (TN.state.isLoadingMore) return;
    if (TN.state.displayedCount >= TN.state.filtered.length) return;

    TN.state.isLoadingMore = true;
    TN.updateScrollStatus();

    requestAnimationFrame(() => {
      const content = document.getElementById("content");
      const start = TN.state.displayedCount;
      const end = Math.min(start + TN.CONFIG.batchSize, TN.state.filtered.length);
      const slice = TN.state.filtered.slice(start, end);

      const fragment = document.createDocumentFragment();
      const temp = document.createElement("div");
      temp.innerHTML = slice.map((a, i) => TN.createCardHTML(a, start + i)).join("");
      while (temp.firstChild) fragment.appendChild(temp.firstChild);

      content.appendChild(fragment);
      TN.bindCardEvents(content);

      TN.state.displayedCount = end;
      TN.state.isLoadingMore = false;
      TN.updateStats();
      TN.updateScrollStatus();
    });
  };

  // Modal
  TN.openModal = function (index) {
    const article = TN.state.filtered[index];
    if (!article) return;

    document.getElementById("modal-title").textContent = article.title;
    document.getElementById("modal-meta").innerHTML = `
      <span class="card-date">${TN.formatDate(article.published)}</span>
      <span>${TN.escapeHtml(TN.getSource(article.link))}</span>
    `;
    document.getElementById("modal-body").textContent =
      article.full || article.short || "No full summary available.";
    document.getElementById("modal-link").href = article.link;

    document.getElementById("modal").classList.add("open");
    document.body.style.overflow = "hidden";
  };

  TN.closeModal = function () {
    document.getElementById("modal").classList.remove("open");
    document.body.style.overflow = "";
  };
})();
