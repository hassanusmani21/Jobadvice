(function injectJobAdviceAdminJobTools() {
  var sortMenuId = "jobadvice-sortby-menu";
  var liveSyncRefreshStorageKey = "jobadvice-live-admin-refresh-route";

  var state = {
    hasGlobalListeners: false,
    cmsPreSaveGuardAttached: false,
    publishCheckPending: false,
    allowBypassSaveClick: false,
    sortRequestPending: false,
    listSortMode: {
      jobs: "newest",
      blogs: "newest",
    },
    pendingInitialSortRouteKey: "",
    currentSortMenuCollection: "",
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

  function getCollectionRouteKey(collectionName) {
    return collectionName + "|" + (window.location.hash || "");
  }

  function getStoredRefreshAttemptRouteKey() {
    try {
      return window.sessionStorage.getItem(liveSyncRefreshStorageKey) || "";
    } catch {
      return "";
    }
  }

  function markRefreshAttemptForRoute(routeKey) {
    try {
      window.sessionStorage.setItem(liveSyncRefreshStorageKey, routeKey);
    } catch {
      // Ignore sessionStorage failures.
    }
  }

  function clearRefreshAttemptForRoute(routeKey) {
    try {
      if (window.sessionStorage.getItem(liveSyncRefreshStorageKey) === routeKey) {
        window.sessionStorage.removeItem(liveSyncRefreshStorageKey);
      }
    } catch {
      // Ignore sessionStorage failures.
    }
  }

  function maybeRefreshStaleCollectionView(collectionName, orderedSlugs, rows) {
    if (!collectionName || !Array.isArray(orderedSlugs) || !Array.isArray(rows) || rows.length === 0) {
      return false;
    }

    var expectedVisibleSlugs = orderedSlugs.slice(0, rows.length);
    if (expectedVisibleSlugs.length === 0) {
      return false;
    }

    var renderedSlugSet = new Set();
    for (var index = 0; index < rows.length; index += 1) {
      var rowSlug = normalizeText(rows[index] && rows[index].slug);
      if (rowSlug) {
        renderedSlugSet.add(rowSlug);
      }
    }

    var missingVisibleSlugCount = 0;
    for (var slugIndex = 0; slugIndex < expectedVisibleSlugs.length; slugIndex += 1) {
      if (!renderedSlugSet.has(expectedVisibleSlugs[slugIndex])) {
        missingVisibleSlugCount += 1;
      }
    }

    var routeKey = getCollectionRouteKey(collectionName);
    if (missingVisibleSlugCount === 0) {
      clearRefreshAttemptForRoute(routeKey);
      return false;
    }

    if (getStoredRefreshAttemptRouteKey() === routeKey) {
      return false;
    }

    markRefreshAttemptForRoute(routeKey);
    window.setTimeout(function () {
      window.location.reload();
    }, 120);
    return true;
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

  function isSupportedListCollection(collectionName) {
    return collectionName === "jobs" || collectionName === "blogs";
  }

  function isCollectionListRoute(collectionName) {
    if (!isSupportedListCollection(collectionName)) {
      return false;
    }

    var hash = window.location.hash || "";
    if (hash.indexOf("/collections/" + collectionName) < 0) {
      return false;
    }

    return !/\/entries\/|\/new(?:\/|$)/i.test(hash);
  }

  function getActiveListCollection() {
    var collection = getCollectionFromHash();
    return isCollectionListRoute(collection) ? collection : "";
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

  function resolveEntryRootValue(entry, fieldName) {
    if (!entry || !fieldName) {
      return "";
    }

    try {
      if (typeof entry.get === "function") {
        var fromGetter = entry.get(fieldName);
        if (fromGetter !== null && typeof fromGetter !== "undefined") {
          return normalizeText(fromGetter);
        }
      }
    } catch {
      // Ignore immutable getter errors.
    }

    if (entry && Object.prototype.hasOwnProperty.call(entry, fieldName)) {
      return normalizeText(entry[fieldName]);
    }

    return "";
  }

  function resolveEntryDataValue(entry, fieldName) {
    if (!entry || !fieldName) {
      return "";
    }

    try {
      if (typeof entry.getIn === "function") {
        var fromGetIn = entry.getIn(["data", fieldName]);
        if (fromGetIn !== null && typeof fromGetIn !== "undefined") {
          return normalizeText(fromGetIn);
        }
      }
    } catch {
      // Ignore immutable getIn errors.
    }

    try {
      if (typeof entry.get === "function") {
        var dataNode = entry.get("data");
        if (dataNode && typeof dataNode.get === "function") {
          var fromDataNode = dataNode.get(fieldName);
          if (fromDataNode !== null && typeof fromDataNode !== "undefined") {
            return normalizeText(fromDataNode);
          }
        }

        if (
          dataNode &&
          typeof dataNode === "object" &&
          Object.prototype.hasOwnProperty.call(dataNode, fieldName)
        ) {
          return normalizeText(dataNode[fieldName]);
        }
      }
    } catch {
      // Ignore data traversal errors.
    }

    if (
      entry &&
      entry.data &&
      typeof entry.data === "object" &&
      Object.prototype.hasOwnProperty.call(entry.data, fieldName)
    ) {
      return normalizeText(entry.data[fieldName]);
    }

    return "";
  }

  function resolveSlugFromPath(pathValue) {
    var normalizedPath = normalizeText(pathValue);
    if (!normalizedPath) {
      return "";
    }

    var segments = normalizedPath.split("/");
    var fileName = segments.length > 0 ? segments[segments.length - 1] : normalizedPath;
    return normalizeText(fileName.replace(/\.[a-z0-9]+$/i, ""));
  }

  function buildDuplicatePayloadFromEntry(eventPayload) {
    var entry = eventPayload && eventPayload.entry ? eventPayload.entry : null;
    var slugValue =
      resolveEntryRootValue(entry, "slug") ||
      resolveSlugFromPath(resolveEntryRootValue(entry, "path")) ||
      getCurrentJobSlug();

    return {
      title: resolveEntryDataValue(entry, "title") || getFieldValue(["title"]),
      company: resolveEntryDataValue(entry, "company") || getFieldValue(["company"]),
      applyLink:
        resolveEntryDataValue(entry, "applyLink") ||
        resolveEntryDataValue(entry, "applyUrl") ||
        getFieldValue(["applyLink", "applyUrl"]),
      slug: slugValue,
    };
  }

  function resolveCollectionName(eventPayload) {
    if (!eventPayload) {
      return "";
    }

    var collectionValue = eventPayload.collection;
    if (typeof collectionValue === "string") {
      return normalizeLabel(collectionValue);
    }

    if (collectionValue && typeof collectionValue.get === "function") {
      var fromCollectionMap = collectionValue.get("name");
      if (fromCollectionMap) {
        return normalizeLabel(fromCollectionMap);
      }
    }

    if (collectionValue && typeof collectionValue.name === "string") {
      return normalizeLabel(collectionValue.name);
    }

    var entry = eventPayload.entry;
    if (entry && typeof entry.get === "function") {
      var fromEntry = entry.get("collection");
      if (typeof fromEntry === "string") {
        return normalizeLabel(fromEntry);
      }
    }

    return getCollectionFromHash();
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

  function buildDuplicateBlockedAlertMessage(result) {
    var exactMatches = Array.isArray(result.exactMatches) ? result.exactMatches : [];

    var lines = ["This job is already available.", "", "Existing matching jobs:"];

    for (var index = 0; index < Math.min(exactMatches.length, 5); index += 1) {
      lines.push(toMatchSummary(exactMatches[index], false));
    }

    return lines.join("\n");
  }

  function buildDuplicateBlockedErrorMessage(result) {
    var exactMatches = Array.isArray(result.exactMatches) ? result.exactMatches : [];
    if (exactMatches.length === 0) {
      return "This job is already available. Duplicate publish blocked.";
    }

    var firstMatch = exactMatches[0];
    return (
      "This job is already available: " +
      normalizeText(firstMatch.title) +
      " @ " +
      normalizeText(firstMatch.company) +
      " (" +
      normalizeText(firstMatch.date) +
      "). Duplicate publish blocked."
    );
  }

  function buildStrongSimilarBlockedErrorMessage(result) {
    var similarMatches = Array.isArray(result.similarMatches) ? result.similarMatches : [];
    if (similarMatches.length === 0) {
      return "A highly similar job already exists. Please review before publishing.";
    }

    var firstMatch = similarMatches[0];
    return (
      "A highly similar job already exists: " +
      normalizeText(firstMatch.title) +
      " @ " +
      normalizeText(firstMatch.company) +
      " (" +
      String(firstMatch.score || 0) +
      "% match). Publish blocked."
    );
  }

  function buildSimilarWarningMessage(result) {
    var similarMatches = Array.isArray(result.similarMatches) ? result.similarMatches : [];
    if (similarMatches.length === 0) {
      return "";
    }

    var title = result.hasStrongSimilarDuplicate
      ? "A very similar job already exists. Publish anyway?"
      : "Similar jobs were found. Publish anyway?";
    var lines = [title, ""];

    for (var index = 0; index < Math.min(similarMatches.length, 4); index += 1) {
      lines.push(toMatchSummary(similarMatches[index], true));
    }

    return lines.join("\n");
  }

  async function checkDuplicateJobs(payloadOverride) {
    var payload = payloadOverride || buildDuplicatePayload();
    if (!payload.title && !payload.company && !payload.applyLink) {
      return {
        success: true,
        hasExactDuplicate: false,
        hasStrongSimilarDuplicate: false,
        exactMatches: [],
        similarMatches: [],
      };
    }

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

    return result;
  }

  function isSaveOrPublishButton(button) {
    if (!(button instanceof HTMLButtonElement)) {
      return false;
    }

    var textLabel = normalizeLabel(button.textContent || "");
    var ariaLabel = normalizeLabel(button.getAttribute("aria-label") || "");
    var combined = textLabel + " " + ariaLabel;

    return combined.indexOf("publish") >= 0 || combined.indexOf("save") >= 0;
  }

  function lockButtonDuringCheck(button) {
    var previousOpacity = button.style.opacity;
    var previousCursor = button.style.cursor;

    button.style.opacity = "0.7";
    button.style.cursor = "progress";

    return function restoreButton() {
      button.style.opacity = previousOpacity;
      button.style.cursor = previousCursor;
    };
  }

  function resolveRecordsEndpoint(collectionName) {
    if (collectionName === "jobs") {
      return "/api/admin/jobs/records";
    }

    if (collectionName === "blogs") {
      return "/api/admin/blogs/records";
    }

    return "";
  }

  function extractSlugFromHrefForCollection(hrefValue, collectionName) {
    var match = String(hrefValue || "").match(
      new RegExp("collections/" + collectionName + "/entries/([^/?#]+)", "i"),
    );
    if (!match || !match[1]) {
      return "";
    }

    try {
      return decodeURIComponent(match[1]).trim();
    } catch {
      return normalizeText(match[1]);
    }
  }

  function resolveEntryRow(linkNode) {
    var current = linkNode;

    while (current && current !== document.body) {
      if (!(current instanceof HTMLElement)) {
        return linkNode;
      }

      var tagName = (current.tagName || "").toUpperCase();
      if (
        tagName === "LI" ||
        tagName === "TR" ||
        tagName === "ARTICLE" ||
        current.getAttribute("role") === "row"
      ) {
        return current;
      }

      current = current.parentElement;
    }

    return linkNode;
  }

  function getRenderedCollectionRows(collectionName) {
    var selector = 'a[href*="collections/' + collectionName + '/entries/"]';
    var linkNodes = document.querySelectorAll(selector);
    var rows = [];

    for (var index = 0; index < linkNodes.length; index += 1) {
      var linkNode = linkNodes[index];
      if (!(linkNode instanceof HTMLAnchorElement)) {
        continue;
      }

      var slug = extractSlugFromHrefForCollection(
        linkNode.getAttribute("href") || "",
        collectionName,
      );
      if (!slug) {
        continue;
      }

      var rowNode = resolveEntryRow(linkNode);
      var exists = false;

      for (var rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        if (rows[rowIndex].row === rowNode) {
          exists = true;
          break;
        }
      }

      if (exists) {
        continue;
      }

      rows.push({
        slug: slug,
        row: rowNode,
      });
    }

    return rows;
  }

  function reorderRenderedRowsBySlug(rows, orderedSlugs) {
    if (!Array.isArray(rows) || rows.length < 2 || !Array.isArray(orderedSlugs)) {
      return;
    }

    var firstRow = rows[0] && rows[0].row;
    if (!(firstRow instanceof HTMLElement) || !firstRow.parentElement) {
      return;
    }

    var parentNode = firstRow.parentElement;
    for (var rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
      if (!(rows[rowIndex].row instanceof HTMLElement)) {
        continue;
      }

      if (rows[rowIndex].row.parentElement !== parentNode) {
        return;
      }
    }

    var rowBySlug = new Map();
    for (var index = 0; index < rows.length; index += 1) {
      rowBySlug.set(rows[index].slug, rows[index].row);
    }

    var appended = new Set();

    for (var slugIndex = 0; slugIndex < orderedSlugs.length; slugIndex += 1) {
      var slug = orderedSlugs[slugIndex];
      if (appended.has(slug)) {
        continue;
      }

      var row = rowBySlug.get(slug);
      if (!row) {
        continue;
      }

      parentNode.appendChild(row);
      appended.add(slug);
    }

    for (var fallbackIndex = 0; fallbackIndex < rows.length; fallbackIndex += 1) {
      var fallbackSlug = rows[fallbackIndex].slug;
      if (appended.has(fallbackSlug)) {
        continue;
      }

      parentNode.appendChild(rows[fallbackIndex].row);
    }
  }

  async function applyCollectionSort(collectionName, sortMode, options) {
    var opts = options || {};
    if (state.sortRequestPending) {
      return false;
    }

    var endpoint = resolveRecordsEndpoint(collectionName);
    if (!endpoint) {
      return false;
    }

    state.sortRequestPending = true;

    try {
      var response = await fetch(endpoint, {
        method: "GET",
        credentials: "same-origin",
      });
      var result = await readJsonResponse(response);

      if (!response.ok || !result || !result.success) {
        var message = (result && result.error) || "Unable to sort entries.";

        if (message === "SessionRequired" || message === "EmailNotAllowed") {
          window.location.href = "/admin/login?callbackUrl=" + encodeURIComponent("/admin");
          return false;
        }

        if (!opts.silent) {
          alert(message);
        }
        return false;
      }

      var records = Array.isArray(result.records) ? result.records : [];
      var orderedRecords = records.slice();

      if (sortMode === "oldest") {
        orderedRecords.reverse();
      }

      var orderedSlugs = [];
      for (var index = 0; index < orderedRecords.length; index += 1) {
        var slug = normalizeText(orderedRecords[index] && orderedRecords[index].slug);
        if (!slug) {
          continue;
        }

        orderedSlugs.push(slug);
      }

      var rows = getRenderedCollectionRows(collectionName);
      if (rows.length === 0) {
        return false;
      }

      if (maybeRefreshStaleCollectionView(collectionName, orderedSlugs, rows)) {
        return false;
      }

      reorderRenderedRowsBySlug(rows, orderedSlugs);
      state.listSortMode[collectionName] = sortMode === "oldest" ? "oldest" : "newest";
      return true;
    } catch (error) {
      if (!opts.silent) {
        var message =
          error && error.message ? error.message : "Unable to sort entries right now.";
        alert(message);
      }
      return false;
    } finally {
      state.sortRequestPending = false;
    }
  }

  function removeSortMenu() {
    var menu = document.getElementById(sortMenuId);
    if (menu) {
      menu.remove();
    }

    state.currentSortMenuCollection = "";
  }

  function createSortMenuOption(label, mode, collectionName) {
    var option = document.createElement("button");
    option.type = "button";
    option.textContent = label;
    option.style.width = "100%";
    option.style.display = "block";
    option.style.padding = "8px 10px";
    option.style.border = "none";
    option.style.background =
      state.listSortMode[collectionName] === mode ? "#ecfeff" : "#ffffff";
    option.style.color = "#0f172a";
    option.style.textAlign = "left";
    option.style.fontSize = "12px";
    option.style.fontWeight =
      state.listSortMode[collectionName] === mode ? "700" : "600";
    option.style.cursor = "pointer";

    option.addEventListener("click", function () {
      removeSortMenu();
      applyCollectionSort(collectionName, mode, {
        silent: false,
      });
    });

    option.addEventListener("mouseenter", function () {
      option.style.background = "#f1f5f9";
    });

    option.addEventListener("mouseleave", function () {
      option.style.background =
        state.listSortMode[collectionName] === mode ? "#ecfeff" : "#ffffff";
    });

    return option;
  }

  function openSortMenu(anchorElement, collectionName) {
    removeSortMenu();

    var rect = anchorElement.getBoundingClientRect();
    var menuWidth = 190;
    var proposedTop = rect.bottom + 6;
    var proposedLeft = rect.right - menuWidth;
    var clampedTop = Math.max(8, Math.min(proposedTop, window.innerHeight - 110));
    var clampedLeft = Math.max(8, Math.min(proposedLeft, window.innerWidth - menuWidth - 8));

    var menu = document.createElement("div");
    menu.id = sortMenuId;
    menu.setAttribute("data-collection", collectionName);
    menu.style.position = "fixed";
    menu.style.top = clampedTop + "px";
    menu.style.left = clampedLeft + "px";
    menu.style.width = menuWidth + "px";
    menu.style.borderRadius = "10px";
    menu.style.border = "1px solid rgba(148, 163, 184, 0.65)";
    menu.style.background = "#ffffff";
    menu.style.boxShadow = "0 12px 26px rgba(15, 23, 42, 0.16)";
    menu.style.zIndex = "12000";
    menu.style.overflow = "hidden";
    menu.style.fontFamily = "Manrope, sans-serif";

    menu.appendChild(createSortMenuOption("Newest first", "newest", collectionName));
    menu.appendChild(createSortMenuOption("Oldest first", "oldest", collectionName));

    document.body.appendChild(menu);
    state.currentSortMenuCollection = collectionName;
  }

  function isVisibleElement(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    if (element.hidden) {
      return false;
    }

    var style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    var rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findSortByTrigger() {
    var candidates = document.querySelectorAll(
      'button, [role="button"], [aria-label*="sort" i], [title*="sort" i]',
    );
    for (var index = 0; index < candidates.length; index += 1) {
      var element = candidates[index];
      if (!isVisibleElement(element)) {
        continue;
      }

      var label = normalizeLabel(
        (element.textContent || "") +
          " " +
          (element.getAttribute("aria-label") || "") +
          " " +
          (element.getAttribute("title") || ""),
      );
      if (label.indexOf("sort by") >= 0) {
        return element;
      }
    }

    return null;
  }

  function attachSortByEnhancer(collectionName) {
    var sortTrigger = findSortByTrigger();
    if (!(sortTrigger instanceof HTMLElement)) {
      return;
    }

    if (sortTrigger.dataset.jobadviceSortBound === "1") {
      return;
    }

    sortTrigger.dataset.jobadviceSortBound = "1";

    sortTrigger.addEventListener(
      "click",
      function (event) {
        var activeCollection = getActiveListCollection();
        if (!activeCollection) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        var existingMenu = document.getElementById(sortMenuId);
        if (existingMenu && state.currentSortMenuCollection === activeCollection) {
          removeSortMenu();
          return;
        }

        openSortMenu(sortTrigger, activeCollection);
      },
      true,
    );

    var routeKey = collectionName + "|" + (window.location.hash || "");
    state.pendingInitialSortRouteKey = routeKey;
  }

  function registerCmsPreSaveGuard() {
    if (state.cmsPreSaveGuardAttached) {
      return;
    }

    if (!window.CMS || typeof window.CMS.registerEventListener !== "function") {
      return;
    }

    window.CMS.registerEventListener({
      name: "preSave",
      handler: async function (eventPayload) {
        var collectionName = resolveCollectionName(eventPayload);
        if (collectionName !== "jobs") {
          return eventPayload && eventPayload.entry ? eventPayload.entry : eventPayload;
        }

        var payload = buildDuplicatePayloadFromEntry(eventPayload);
        var result = await checkDuplicateJobs(payload);

        if (!result || !result.success) {
          throw new Error("Unable to verify duplicate jobs right now. Please retry.");
        }

        if (result.hasExactDuplicate) {
          throw new Error(buildDuplicateBlockedErrorMessage(result));
        }

        if (result.hasStrongSimilarDuplicate) {
          throw new Error(buildStrongSimilarBlockedErrorMessage(result));
        }

        return eventPayload && eventPayload.entry ? eventPayload.entry : eventPayload;
      },
    });

    state.cmsPreSaveGuardAttached = true;
  }

  function attachGlobalListeners() {
    if (state.hasGlobalListeners) {
      return;
    }

    state.hasGlobalListeners = true;

    document.addEventListener(
      "click",
      function (event) {
        var menuNode = document.getElementById(sortMenuId);
        if (menuNode) {
          var clickedNode = event.target;
          if (!(clickedNode instanceof Node) || !menuNode.contains(clickedNode)) {
            removeSortMenu();
          }
        }
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
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }

        if (!isSaveOrPublishButton(button)) {
          return;
        }

        if (state.allowBypassSaveClick) {
          state.allowBypassSaveClick = false;
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (state.publishCheckPending) {
          return;
        }

        state.publishCheckPending = true;
        var restoreButton = lockButtonDuringCheck(button);

        checkDuplicateJobs()
          .then(function (result) {
            if (!result || !result.success) {
              alert("Unable to verify duplicate jobs. Please try again.");
              return;
            }

            if (result.hasExactDuplicate) {
              alert(buildDuplicateBlockedAlertMessage(result));
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
            state.publishCheckPending = false;
            restoreButton();
          });
      },
      true,
    );
  }

  function runEnhancements() {
    registerCmsPreSaveGuard();

    var activeCollection = getActiveListCollection();
    if (activeCollection) {
      attachSortByEnhancer(activeCollection);

      var routeKey = activeCollection + "|" + (window.location.hash || "");
      if (!state.pendingInitialSortRouteKey) {
        state.pendingInitialSortRouteKey = routeKey;
      }

      if (
        state.pendingInitialSortRouteKey === routeKey &&
        !state.sortRequestPending
      ) {
        applyCollectionSort(activeCollection, state.listSortMode[activeCollection] || "newest", {
          silent: true,
        }).then(function (applied) {
          if (applied) {
            state.pendingInitialSortRouteKey = "";
          }
        });
      }
      return;
    }

    state.pendingInitialSortRouteKey = "";
    removeSortMenu();
  }

  attachGlobalListeners();
  window.setInterval(runEnhancements, 1000);
  window.addEventListener("hashchange", function () {
    state.pendingInitialSortRouteKey = "";
    window.setTimeout(runEnhancements, 120);
  });
  runEnhancements();
})();
