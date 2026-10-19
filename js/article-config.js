/**
 * Configuration + shared state
 * Attaches to window.TN namespace
 */
(function () {
  "use strict";
  window.TN = window.TN || {};

  TN.CONFIG = {
    batchSize: 24,
    searchDebounceMs: 200,
    scrollThresholdPx: 400,
    sheetCsvUrl:
      "https://docs.google.com/spreadsheets/d/1Y_5a6znPED6kTf5Kl1yFJC0lEGbT0sDYWH6fVUHtbxA/export?format=csv",
    corsProxy: "https://api.allorigins.win/raw?url=",
  };

  TN.state = {
    allArticles: [],
    filtered: [],
    displayedCount: 0,
    isLoadingMore: false,
    isRefreshing: false,
  };
})();
