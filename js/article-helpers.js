/**
 * Pure helper functions (dates, escaping, CSV parsing)
 */
(function () {
  "use strict";
  window.TN = window.TN || {};

  TN.parseDate = function (str) {
    if (!str) return 0;
    const d = new Date(str);
    return isNaN(d) ? 0 : d.getTime();
  };

  TN.formatDate = function (str) {
    if (!str) return "Unknown date";
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  TN.getSource = function (url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "link";
    }
  };

  TN.escapeHtml = function (str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /** Simple CSV parser that handles quoted fields */
  TN.parseCSV = function (text) {
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
  };

  TN.csvToArticles = function (csvText) {
    const rows = TN.parseCSV(csvText);
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
  };
})();
