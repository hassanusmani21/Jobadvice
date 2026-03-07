(function injectJobAdviceAdminJobTools() {
  var duplicatePanelId = "jobadvice-duplicate-check-panel";
  var duplicateStatusId = "jobadvice-duplicate-check-status";
  var duplicateCheckButtonId = "jobadvice-duplicate-check-button";
  var jobsFilterPanelId = "jobadvice-jobs-date-filter-panel";
  var jobsFilterListId = "jobadvice-jobs-date-filter-list";
  var jobsFilterSummaryId = "jobadvice-jobs-date-filter-summary";
  var jobsFilterQuickRangeId = "jobadvice-jobs-date-filter-quick-range";
  var jobsFilterFromId = "jobadvice-jobs-date-filter-from";
  var jobsFilterToId = "jobadvice-jobs-date-filter-to";

  var state = {
    lastDuplicateFingerprint: "",
    lastDuplicateResult: null,
    duplicateDebounceTimer: 0,
    duplicateCheckPending: false,
    allowBypassSaveClick: false,
    hasGlobalListeners: false,
    jobsFilterRequestPending: false,
  };

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeLabel(value) {
    return normalizeText(value).toLowerCase();
  }

  function getRouteValue() {
    return (window.location.pathname || "") + (window.location.hash || "");
  }

  function getCollectionFromHash() {
    var routeValue = getRouteValue();
    var match = routeValue.match(/collections\/([^/]+)/i);
    return match && match[1] ? match[1].toLowerCase() : "";
  }

  function isJobsCollection() {
    return getCollectionFromHash() === "jobs";
  }

  function isJobsEntryRoute() {
    if (!isJobsCollection()) {
      return false;
    }

    var hash = window.location.hash || "";
    return hash.indexOf("/entries/") >= 0 || hash.indexOf("/new") >= 0;
  }

  function isJobsCollectionListRoute() {
    if (!isJobsCollection()) {
      return false;
    }

    var hash = window.location.hash || "";
    return hash.indexOf("/entries/") < 0 && hash.indexOf("/new") < 0;
  }

  function getEditorRoot() {
    return (
      document.querySelector(".nc-entryEditor") ||
      document.querySelector(".nc-entryEditor-container") ||
      document.getElementById("nc-root") ||
      document.body
    );
  }

  function getCurrentJobSlug() {
    var hash = window.location.hash || "";
    var match = hash.match(/collections\/jobs\/entries\/([^/?]+)/i);
    if (!match || !match[1]) {
      return "";
    }

    try {
      return decodeURIComponent(match[1]).trim();
    } catch {
      return String(match[1] || "").trim();
    }
  }

  function getFieldValue(fieldNames) {
    var root = getEditorRoot() || document;
    for (var index = 0; index < fieldNames.length; index += 1) {
      var name = fieldNames[index];
      var selectors = [
        '[name="' + name + '"]',
        '[name$=".' + name + '"]',
        '[name*="' + name + '"]',
        '[id="' + name + '"]',
        '[id$="-' + name + '"]',
      ];

      for (var selectorIndex = 0; selectorIndex < selectors.length; selectorIndex += 1) {
        var field = root.querySelector(selectors[selectorIndex]);
        if (!field) {
          continue;
        }

        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement ||
          field instanceof HTMLSelectElement
        ) {
          return normalizeText(field.value || "");
        }
      }
    }

    return "";
  }

  function buildDuplicatePayload() {
    return {
      title: getFieldValue(["title"]),
      company: getFieldValue(["company"]),
      applyLink: getFieldValue(["applyLink", "applyUrl"]),
      slug: getCurrentJobSlug(),
    };
  }

  function renderDuplicateStatus(message, tone) {
    var statusNode = document.getElementById(duplicateStatusId);
    if (!statusNode) {
      return;
    }

    var palette = {
      neutral: { background: "#f8fafc", color: "#334155", borderColor: "#cbd5e1" },
      success: { background: "#ecfdf5", color: "#065f46", borderColor: "#86efac" },
      warning: { background: "#fffbeb", color: "#92400e", borderColor: "#fcd34d" },
      danger: { background: "#fef2f2", color: "#991b1b", borderColor: "#fca5a5" },
    };

    var style = palette[tone] || palette.neutral;
    statusNode.textContent = message;
    statusNode.style.background = style.background;
    statusNode.style.color = style.color;
    statusNode.style.borderColor = style.borderColor;
  }

  function toMatchSummary(match, includeScore) {
    var scorePart = includeScore ? " (" + String(match.score || 0) + "%)" : "";
    return (
      "- " +
      normalizeText(match.date) +
      " | " +
      normalizeText(match.title) +
      " @ " +
      normalizeText(match.company) +
      scorePart
    );
  }

  function summarizeDuplicateResult(result) {
    if (!result || !result.success) {
      return {
        tone: "warning",
        message: "Could not verify duplicates right now. Please retry.",
      };
    }

    var exactMatches = Array.isArray(result.exactMatches) ? result.exactMatches : [];
    var similarMatches = Array.isArray(result.similarMatches) ? result.similarMatches : [];
    var previewLines = [];

    if (exactMatches.length > 0) {
      for (var index = 0; index < Math.min(exactMatches.length, 3); index += 1) {
        previewLines.push(toMatchSummary(exactMatches[index], false));
      }

      return {
        tone: "danger",
        message:
          "Duplicate blocked: exact match found.\n" +
          previewLines.join("\n"),
      };
    }

    if (result.hasStrongSimilarDuplicate) {
      for (var similarIndex = 0; similarIndex < Math.min(similarMatches.length, 3); similarIndex += 1) {
        previewLines.push(toMatchSummary(similarMatches[similarIndex], true));
      }

      return {
        tone: "danger",
        message:
          "Publish blocked: highly similar job already exists.\n" +
          previewLines.join("\n"),
      };
    }

    if (similarMatches.length > 0) {
      for (var warningIndex = 0; warningIndex < Math.min(similarMatches.length, 3); warningIndex += 1) {
        previewLines.push(toMatchSummary(similarMatches[warningIndex], true));
      }

      return {
        tone: "warning",
        message:
          "Similar jobs found. Review carefully before publish.\n" +
          previewLines.join("\n"),
      };
    }

    return {
      tone: "success",
      message: "No duplicate job found. Safe to publish.",
    };
  }

  async function readJsonResponse(response) {
    var contentType = String(response.headers.get("content-type") || "").toLowerCase();
    var rawText = await response.text();

    if (!rawText) {
      return {};
    }

    if (contentType.indexOf("application/json") === -1) {
      throw new Error("Server returned a non-JSON response.");
    }

    try {
      return JSON.parse(rawText);
    } catch {
      throw new Error("Invalid JSON response from server.");
    }
  }

  function getDuplicateFingerprint(payload) {
    return [
      normalizeLabel(payload.title),
      normalizeLabel(payload.company),
      normalizeLabel(payload.applyLink),
      normalizeLabel(payload.slug),
    ].join("|");
  }

  async function checkDuplicateJobs(options) {
    var opts = options || {};
    var payload = buildDuplicatePayload();
    var fingerprint = getDuplicateFingerprint(payload);

    if (!payload.title && !payload.company && !payload.applyLink) {
      renderDuplicateStatus(
        "Enter job title/company/apply link to run duplicate check.",
        "neutral",
      );
      return null;
    }

    if (!opts.force && state.lastDuplicateResult && state.lastDuplicateFingerprint === fingerprint) {
      return state.lastDuplicateResult;
    }

    renderDuplicateStatus("Checking duplicates...", "neutral");

    var response = await fetch("/api/admin/jobs/duplicates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
    var result = await readJsonResponse(response);

    if (!response.ok || !result || !result.success) {
      var message = (result && result.error) || "Duplicate check failed.";
      if (message === "SessionRequired" || message === "EmailNotAllowed") {
        window.location.href = "/admin/login?callbackUrl=" + encodeURIComponent("/admin");
        throw new Error("Session expired. Redirecting to login...");
      }

      throw new Error(message);
    }

    state.lastDuplicateFingerprint = fingerprint;
    state.lastDuplicateResult = result;

    var summary = summarizeDuplicateResult(result);
    renderDuplicateStatus(summary.message, summary.tone);

    return result;
  }

  function buildPublishBlockMessage(result) {
    var lines = [
      "Publish blocked to prevent duplicate job posting.",
      "",
    ];

    var exactMatches = Array.isArray(result.exactMatches) ? result.exactMatches : [];
    var similarMatches = Array.isArray(result.similarMatches) ? result.similarMatches : [];

    if (exactMatches.length > 0) {
      lines.push("Exact matches:");
      for (var index = 0; index < Math.min(exactMatches.length, 5); index += 1) {
        lines.push(toMatchSummary(exactMatches[index], false));
      }
      return lines.join("\n");
    }

    lines.push("Highly similar matches:");
    for (var similarIndex = 0; similarIndex < Math.min(similarMatches.length, 5); similarIndex += 1) {
      lines.push(toMatchSummary(similarMatches[similarIndex], true));
    }

    return lines.join("\n");
  }

  function buildSimilarWarningMessage(result) {
    var similarMatches = Array.isArray(result.similarMatches) ? result.similarMatches : [];
    if (similarMatches.length === 0) {
      return "";
    }

    var lines = [
      "Similar jobs were found. Continue publishing anyway?",
      "",
    ];

    for (var index = 0; index < Math.min(similarMatches.length, 4); index += 1) {
      lines.push(toMatchSummary(similarMatches[index], true));
    }

    return lines.join("\n");
  }

  function removeDuplicatePanel() {
    var panel = document.getElementById(duplicatePanelId);
    if (panel) {
      panel.remove();
    }
  }

  function injectDuplicatePanel() {
    if (!isJobsEntryRoute()) {
      removeDuplicatePanel();
      return;
    }

    if (document.getElementById(duplicatePanelId)) {
      return;
    }

    var panel = document.createElement("aside");
    panel.id = duplicatePanelId;
    panel.style.position = "fixed";
    panel.style.right = "14px";
    panel.style.bottom = "272px";
    panel.style.zIndex = "9999";
    panel.style.width = "min(420px, calc(100vw - 20px))";
    panel.style.padding = "12px";
    panel.style.borderRadius = "10px";
    panel.style.border = "1px solid rgba(15, 23, 42, 0.12)";
    panel.style.background = "rgba(255, 255, 255, 0.95)";
    panel.style.boxShadow = "0 10px 24px rgba(15, 23, 42, 0.16)";
    panel.style.fontFamily = "Manrope, sans-serif";

    var heading = document.createElement("p");
    heading.textContent = "Duplicate Guard";
    heading.style.margin = "0 0 8px";
    heading.style.fontSize = "13px";
    heading.style.fontWeight = "700";
    heading.style.color = "#0f172a";

    var status = document.createElement("pre");
    status.id = duplicateStatusId;
    status.style.margin = "0";
    status.style.padding = "8px";
    status.style.borderRadius = "8px";
    status.style.border = "1px solid #cbd5e1";
    status.style.background = "#f8fafc";
    status.style.color = "#334155";
    status.style.fontFamily = "Manrope, sans-serif";
    status.style.fontSize = "12px";
    status.style.lineHeight = "1.45";
    status.style.whiteSpace = "pre-wrap";
    status.textContent = "Enter job details, then run duplicate check.";

    var button = document.createElement("button");
    button.id = duplicateCheckButtonId;
    button.type = "button";
    button.textContent = "Check Duplicates";
    button.style.marginTop = "10px";
    button.style.padding = "9px 12px";
    button.style.borderRadius = "8px";
    button.style.border = "none";
    button.style.background = "#0f766e";
    button.style.color = "#ffffff";
    button.style.fontSize = "13px";
    button.style.fontWeight = "700";
    button.style.cursor = "pointer";

    button.addEventListener("click", function () {
      if (state.duplicateCheckPending) {
        return;
      }

      state.duplicateCheckPending = true;
      button.disabled = true;
      button.textContent = "Checking...";

      checkDuplicateJobs({ force: true })
        .catch(function (error) {
          var message = error && error.message ? error.message : "Duplicate check failed.";
          renderDuplicateStatus(message, "warning");
        })
        .finally(function () {
          state.duplicateCheckPending = false;
          button.disabled = false;
          button.textContent = "Check Duplicates";
        });
    });

    panel.appendChild(heading);
    panel.appendChild(status);
    panel.appendChild(button);
    document.body.appendChild(panel);
  }

  function isDuplicateRelevantField(target) {
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLTextAreaElement) &&
      !(target instanceof HTMLSelectElement)
    ) {
      return false;
    }

    var fieldName = normalizeLabel(target.name || target.id || "");
    return (
      fieldName.indexOf("title") >= 0 ||
      fieldName.indexOf("company") >= 0 ||
      fieldName.indexOf("applylink") >= 0 ||
      fieldName.indexOf("applyurl") >= 0
    );
  }

  function attachGlobalListeners() {
    if (state.hasGlobalListeners) {
      return;
    }

    state.hasGlobalListeners = true;

    document.addEventListener(
      "input",
      function (event) {
        if (!isJobsEntryRoute()) {
          return;
        }

        if (!isDuplicateRelevantField(event.target)) {
          return;
        }

        if (state.duplicateDebounceTimer) {
          window.clearTimeout(state.duplicateDebounceTimer);
        }

        state.duplicateDebounceTimer = window.setTimeout(function () {
          checkDuplicateJobs({ force: false }).catch(function () {
            // Keep silent for background checks; explicit button shows errors.
          });
        }, 700);
      },
      true,
    );

    document.addEventListener(
      "click",
      function (event) {
        if (!isJobsEntryRoute()) {
          return;
        }

        var clickedElement = event.target;
        if (!(clickedElement instanceof Element)) {
          return;
        }

        var button = clickedElement.closest("button");
        if (!button) {
          return;
        }

        if (button.id === duplicateCheckButtonId) {
          return;
        }

        if (state.allowBypassSaveClick) {
          state.allowBypassSaveClick = false;
          return;
        }

        var buttonLabel = normalizeLabel(button.textContent || "");
        var isSaveOrPublish =
          buttonLabel.indexOf("publish") >= 0 ||
          buttonLabel.indexOf("save") >= 0;

        if (!isSaveOrPublish) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (state.duplicateCheckPending) {
          return;
        }

        state.duplicateCheckPending = true;

        checkDuplicateJobs({ force: true })
          .then(function (result) {
            if (!result || !result.success) {
              alert("Unable to verify duplicate jobs. Please try again.");
              return;
            }

            if (result.shouldBlockPublish) {
              alert(buildPublishBlockMessage(result));
              return;
            }

            var similarWarningMessage = buildSimilarWarningMessage(result);
            if (similarWarningMessage) {
              var continuePublish = window.confirm(similarWarningMessage);
              if (!continuePublish) {
                return;
              }
            }

            state.allowBypassSaveClick = true;
            button.click();
          })
          .catch(function (error) {
            var message =
              error && error.message
                ? error.message
                : "Duplicate check failed before publish.";
            alert(message);
          })
          .finally(function () {
            state.duplicateCheckPending = false;
          });
      },
      true,
    );
  }

  function formatIsoDate(dateValue) {
    return dateValue.toISOString().split("T")[0];
  }

  function shiftIsoDate(baseDate, dayDelta) {
    var shiftedDate = new Date(baseDate);
    shiftedDate.setUTCDate(shiftedDate.getUTCDate() + dayDelta);
    return formatIsoDate(shiftedDate);
  }

  function resolveDateFilterValues() {
    var quickRangeInput = document.getElementById(jobsFilterQuickRangeId);
    var fromInput = document.getElementById(jobsFilterFromId);
    var toInput = document.getElementById(jobsFilterToId);

    var quickValue =
      quickRangeInput instanceof HTMLSelectElement ? quickRangeInput.value : "last3";
    var fromDate =
      fromInput instanceof HTMLInputElement ? normalizeText(fromInput.value) : "";
    var toDate = toInput instanceof HTMLInputElement ? normalizeText(toInput.value) : "";
    var today = new Date();
    var todayIso = formatIsoDate(today);

    if (quickValue === "today") {
      return {
        fromDate: todayIso,
        toDate: todayIso,
      };
    }

    if (quickValue === "yesterday") {
      var yesterdayIso = shiftIsoDate(today, -1);
      return {
        fromDate: yesterdayIso,
        toDate: yesterdayIso,
      };
    }

    if (quickValue === "last2") {
      return {
        fromDate: shiftIsoDate(today, -1),
        toDate: todayIso,
      };
    }

    if (quickValue === "last3") {
      return {
        fromDate: shiftIsoDate(today, -2),
        toDate: todayIso,
      };
    }

    if (quickValue === "last7") {
      return {
        fromDate: shiftIsoDate(today, -6),
        toDate: todayIso,
      };
    }

    if (quickValue === "last30") {
      return {
        fromDate: shiftIsoDate(today, -29),
        toDate: todayIso,
      };
    }

    return {
      fromDate: fromDate,
      toDate: toDate,
    };
  }

  function renderJobsFilterSummary(summaryText, tone) {
    var summaryNode = document.getElementById(jobsFilterSummaryId);
    if (!summaryNode) {
      return;
    }

    var tones = {
      neutral: "#334155",
      success: "#065f46",
      warning: "#92400e",
    };

    summaryNode.textContent = summaryText;
    summaryNode.style.color = tones[tone] || tones.neutral;
  }

  function renderJobsFilterResults(records) {
    var listNode = document.getElementById(jobsFilterListId);
    if (!listNode) {
      return;
    }

    while (listNode.firstChild) {
      listNode.removeChild(listNode.firstChild);
    }

    if (!Array.isArray(records) || records.length === 0) {
      var emptyNode = document.createElement("p");
      emptyNode.textContent = "No jobs found for selected date range.";
      emptyNode.style.margin = "0";
      emptyNode.style.fontSize = "12px";
      emptyNode.style.color = "#64748b";
      listNode.appendChild(emptyNode);
      return;
    }

    for (var index = 0; index < records.length; index += 1) {
      var record = records[index];
      var row = document.createElement("div");
      row.style.border = "1px solid rgba(203, 213, 225, 0.75)";
      row.style.borderRadius = "8px";
      row.style.padding = "8px";
      row.style.background = "#ffffff";

      var dateNode = document.createElement("p");
      dateNode.textContent = normalizeText(record.date);
      dateNode.style.margin = "0";
      dateNode.style.fontSize = "11px";
      dateNode.style.color = "#0f766e";
      dateNode.style.fontWeight = "700";

      var titleNode = document.createElement("p");
      titleNode.textContent =
        normalizeText(record.title) + " @ " + normalizeText(record.company);
      titleNode.style.margin = "4px 0 0";
      titleNode.style.fontSize = "12px";
      titleNode.style.color = "#0f172a";
      titleNode.style.fontWeight = "600";
      titleNode.style.lineHeight = "1.35";

      var openLink = document.createElement("a");
      openLink.href =
        "/admin/#/collections/jobs/entries/" + encodeURIComponent(String(record.slug || ""));
      openLink.textContent = "Open";
      openLink.style.display = "inline-block";
      openLink.style.marginTop = "6px";
      openLink.style.fontSize = "11px";
      openLink.style.fontWeight = "700";
      openLink.style.color = "#0f766e";

      row.appendChild(dateNode);
      row.appendChild(titleNode);
      row.appendChild(openLink);
      listNode.appendChild(row);
    }
  }

  async function applyJobsDateFilter() {
    if (state.jobsFilterRequestPending) {
      return;
    }

    var filterValues = resolveDateFilterValues();
    if (!filterValues.fromDate || !filterValues.toDate) {
      renderJobsFilterSummary(
        "Select a quick range or set both From and To dates.",
        "warning",
      );
      return;
    }

    state.jobsFilterRequestPending = true;
    renderJobsFilterSummary("Loading jobs...", "neutral");

    var requestUrl =
      "/api/admin/jobs/records?from=" +
      encodeURIComponent(filterValues.fromDate) +
      "&to=" +
      encodeURIComponent(filterValues.toDate);

    try {
      var response = await fetch(requestUrl, {
        method: "GET",
        credentials: "same-origin",
      });
      var result = await readJsonResponse(response);

      if (!response.ok || !result || !result.success) {
        var message = (result && result.error) || "Unable to load jobs.";
        if (message === "SessionRequired" || message === "EmailNotAllowed") {
          window.location.href = "/admin/login?callbackUrl=" + encodeURIComponent("/admin");
          return;
        }

        renderJobsFilterSummary(message, "warning");
        return;
      }

      var total = Number(result.total || 0);
      renderJobsFilterSummary(
        total +
          " jobs from " +
          normalizeText(result.fromDate) +
          " to " +
          normalizeText(result.toDate),
        "success",
      );
      renderJobsFilterResults(Array.isArray(result.records) ? result.records : []);
    } catch (error) {
      var message =
        error && error.message ? error.message : "Unable to load jobs right now.";
      renderJobsFilterSummary(message, "warning");
    } finally {
      state.jobsFilterRequestPending = false;
    }
  }

  function removeJobsFilterPanel() {
    var panel = document.getElementById(jobsFilterPanelId);
    if (panel) {
      panel.remove();
    }
  }

  function injectJobsFilterPanel() {
    if (!isJobsCollectionListRoute()) {
      removeJobsFilterPanel();
      return;
    }

    if (document.getElementById(jobsFilterPanelId)) {
      return;
    }

    var panel = document.createElement("aside");
    panel.id = jobsFilterPanelId;
    panel.style.position = "fixed";
    panel.style.right = "14px";
    panel.style.bottom = "14px";
    panel.style.zIndex = "9999";
    panel.style.width = "min(420px, calc(100vw - 20px))";
    panel.style.maxHeight = "min(70vh, 640px)";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.padding = "12px";
    panel.style.borderRadius = "10px";
    panel.style.border = "1px solid rgba(15, 23, 42, 0.12)";
    panel.style.background = "rgba(255, 255, 255, 0.95)";
    panel.style.boxShadow = "0 10px 24px rgba(15, 23, 42, 0.16)";
    panel.style.fontFamily = "Manrope, sans-serif";

    var heading = document.createElement("p");
    heading.textContent = "Jobs Date Filter";
    heading.style.margin = "0 0 8px";
    heading.style.fontSize = "13px";
    heading.style.fontWeight = "700";
    heading.style.color = "#0f172a";

    var controls = document.createElement("div");
    controls.style.display = "grid";
    controls.style.gridTemplateColumns = "1fr 1fr";
    controls.style.gap = "8px";

    var quickRange = document.createElement("select");
    quickRange.id = jobsFilterQuickRangeId;
    quickRange.style.gridColumn = "1 / -1";
    quickRange.style.padding = "8px";
    quickRange.style.borderRadius = "8px";
    quickRange.style.border = "1px solid rgba(148, 163, 184, 0.85)";
    quickRange.style.fontSize = "12px";
    quickRange.innerHTML =
      '<option value="last3">Last 3 days</option>' +
      '<option value="today">Today</option>' +
      '<option value="yesterday">Yesterday</option>' +
      '<option value="last2">Last 2 days</option>' +
      '<option value="last7">Last 7 days</option>' +
      '<option value="last30">Last 30 days</option>' +
      '<option value="custom">Custom range</option>';

    var fromInput = document.createElement("input");
    fromInput.id = jobsFilterFromId;
    fromInput.type = "date";
    fromInput.style.padding = "8px";
    fromInput.style.borderRadius = "8px";
    fromInput.style.border = "1px solid rgba(148, 163, 184, 0.85)";
    fromInput.style.fontSize = "12px";

    var toInput = document.createElement("input");
    toInput.id = jobsFilterToId;
    toInput.type = "date";
    toInput.style.padding = "8px";
    toInput.style.borderRadius = "8px";
    toInput.style.border = "1px solid rgba(148, 163, 184, 0.85)";
    toInput.style.fontSize = "12px";

    controls.appendChild(quickRange);
    controls.appendChild(fromInput);
    controls.appendChild(toInput);

    var actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.marginTop = "8px";

    var applyButton = document.createElement("button");
    applyButton.type = "button";
    applyButton.textContent = "Apply Filter";
    applyButton.style.flex = "1";
    applyButton.style.padding = "9px 10px";
    applyButton.style.borderRadius = "8px";
    applyButton.style.border = "none";
    applyButton.style.background = "#0f766e";
    applyButton.style.color = "#ffffff";
    applyButton.style.fontSize = "12px";
    applyButton.style.fontWeight = "700";
    applyButton.style.cursor = "pointer";

    var resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.textContent = "Reset";
    resetButton.style.padding = "9px 10px";
    resetButton.style.borderRadius = "8px";
    resetButton.style.border = "1px solid rgba(148, 163, 184, 0.85)";
    resetButton.style.background = "#ffffff";
    resetButton.style.color = "#0f172a";
    resetButton.style.fontSize = "12px";
    resetButton.style.fontWeight = "700";
    resetButton.style.cursor = "pointer";

    actions.appendChild(applyButton);
    actions.appendChild(resetButton);

    var summary = document.createElement("p");
    summary.id = jobsFilterSummaryId;
    summary.style.margin = "10px 0 8px";
    summary.style.fontSize = "12px";
    summary.style.color = "#334155";
    summary.textContent = "Filter by quick range or custom dates.";

    var list = document.createElement("div");
    list.id = jobsFilterListId;
    list.style.display = "grid";
    list.style.gap = "8px";
    list.style.overflowY = "auto";
    list.style.maxHeight = "42vh";
    list.style.paddingRight = "4px";

    quickRange.addEventListener("change", function () {
      if (quickRange.value !== "custom") {
        fromInput.value = "";
        toInput.value = "";
      }
    });

    applyButton.addEventListener("click", function () {
      applyJobsDateFilter();
    });

    resetButton.addEventListener("click", function () {
      quickRange.value = "last3";
      fromInput.value = "";
      toInput.value = "";
      applyJobsDateFilter();
    });

    panel.appendChild(heading);
    panel.appendChild(controls);
    panel.appendChild(actions);
    panel.appendChild(summary);
    panel.appendChild(list);

    document.body.appendChild(panel);
    applyJobsDateFilter();
  }

  function runPanels() {
    injectDuplicatePanel();
    injectJobsFilterPanel();
  }

  attachGlobalListeners();
  window.setInterval(runPanels, 1200);
  window.addEventListener("hashchange", runPanels);
  runPanels();
})();
