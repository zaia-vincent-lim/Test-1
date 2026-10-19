/**
 * Infinite scroll listener
 */
(function () {
  "use strict";
  window.TN = window.TN || {};

  TN.onScroll = function () {
    if (TN.state.isLoadingMore) return;
    if (TN.state.displayedCount >= TN.state.filtered.length) return;

    const scrollBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - TN.CONFIG.scrollThresholdPx;

    if (scrollBottom) {
      TN.loadMore();
    }
  };
})();
