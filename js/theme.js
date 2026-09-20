// ==========================================
// Bondhu - Theme + Auto Components
// Ek file — sob page e auto topbar/bottom-nav
// HTML edit korar dorkar nei!
// ==========================================

(function() {

  // ==========================================
  // 1. THEME (instant, before paint)
  // ==========================================
  const THEME_KEY = "bondhu_theme";
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);

  window.toggleBondhuTheme = function() {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(THEME_KEY, next);
  };

  // ==========================================
  // 2. SHARED ICONS
  // ==========================================
  const ICONS = {
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>',
    reels: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M9 8v8l6-4z"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
  };

  const svg = (name, size = 18) =>
    `<svg viewBox="0 0 24 24" style="width:${size}px;height:${size}px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round">${ICONS[name] || ""}</svg>`;

  const THEME_TOGGLE_HTML = `
    <button class="theme-toggle" onclick="toggleBondhuTheme()" aria-label="Theme">
      <svg class="icon-moon" viewBox="0 0 24 24">${ICONS.moon}</svg>
      <svg class="icon-sun" viewBox="0 0 24 24">${ICONS.sun}</svg>
    </button>
  `;

  // ==========================================
  // 3. BOTTOM NAV — EDIT HERE, SOB PAGE UPDATE
  // ==========================================
  const BOTTOM_NAV_ITEMS = [
    { id: "home",    href: "index.html",   label: "হোম",    icon: ICONS.home },
    { id: "search",  href: "search.html",  label: "খুঁজুন",  icon: ICONS.search },
    { id: "upload",  href: "upload.html",  label: "তৈরি",    icon: '<rect x="3" y="3" width="18" height="18" rx="5"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' },
    { id: "reels",   href: "reels.html",   label: "রিল",     icon: ICONS.reels },
    { id: "profile", href: "profile.html", label: "প্রোফাইল", icon: ICONS.user }
  ];

  function renderBottomNavHTML(active) {
    return BOTTOM_NAV_ITEMS.map(item => `
      <a href="${item.href}" class="${item.id === active ? "active" : ""}" aria-label="${item.label}">
        <svg viewBox="0 0 24 24">${item.icon}</svg>
      </a>
    `).join("");
  }

  // ==========================================
  // 4. AUTO REPLACE
  // ==========================================

  // --- helper: extract title from a topbar-brand ---
  function extractTitle(el) {
    const brand = el.querySelector(".topbar-brand");
    if (!brand) return "";
    const clone = brand.cloneNode(true);
    clone.querySelectorAll("a, button, svg").forEach(n => n.remove());
    return (clone.textContent || "").trim();
  }

  // --- helper: replace topbar ---
  function replaceTopbar(el) {
    if (el.dataset.bondhuMounted) return;
    el.dataset.bondhuMounted = "1";

    let title = el.dataset.title || extractTitle(el);
    const hasBack = el.dataset.back === "true" || !!el.querySelector('[onclick*="history.back"]');
    const hasTheme = el.dataset.theme !== "false";
    const wantHome = el.dataset.home !== "false";

    // Collect extra actions (skip home/theme/back, keep others)
    let actions = "";
    if (el.dataset.actions) {
      actions = el.dataset.actions;
    } else {
      el.querySelectorAll(".topbar-actions > a, .topbar-actions > button").forEach(child => {
        // Skip theme toggle
        if (child.classList.contains("theme-toggle")) return;
        // Skip home icon (handled separately)
        const href = child.getAttribute && child.getAttribute("href") || "";
        if (child.tagName === "A" && (href === "index.html" || href === "./index.html")) return;
        // Skip back button
        if (child.getAttribute && (child.getAttribute("onclick") || "").includes("history.back")) return;
        actions += child.outerHTML;
      });
    }

    // Decide home icon
    let hasHome = false;
    el.querySelectorAll(".topbar-actions > a").forEach(a => {
      const h = a.getAttribute("href") || "";
      if (h === "index.html" || h.endsWith("/index.html")) hasHome = true;
    });
    // If data-home attr explicitly set to false → no home
    if (el.dataset.home === "false") hasHome = false;
    // If we want home but couldn't detect → add by default
    if (el.dataset.home !== "false" && !hasHome && !el.dataset.home && !actions.includes("index.html")) {
      // don't auto-add on pages without it
    }

    el.className = "topbar";
    el.innerHTML = `
      <div class="topbar-brand" style="font-size:18px;display:flex;align-items:center;gap:8px">
        ${hasBack ? `
          <button class="icon-btn" onclick="history.back()" aria-label="Back" style="width:32px;height:32px">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        ` : ""}
        ${escapeHtml(title)}
      </div>
      <div class="topbar-actions">
        ${actions}
        ${hasTheme ? THEME_TOGGLE_HTML : ""}
        ${wantHome && hasHome ? `<a href="index.html" class="icon-btn" aria-label="Home">${svg("home", 20)}</a>` : ""}
      </div>
    `;
  }

  // --- helper: replace bottom nav ---
  function replaceBottomNav(el) {
    if (el.dataset.bondhuMounted) return;
    el.dataset.bondhuMounted = "1";

    let active = el.dataset.active || "";
    if (!active) {
      const a = el.querySelector("a.active");
      if (a) {
        const h = a.getAttribute("href") || "";
        if (h.includes("index.html")) active = "home";
        else if (h.includes("search.html")) active = "search";
        else if (h.includes("upload.html")) active = "upload";
        else if (h.includes("reels.html")) active = "reels";
        else if (h.includes("profile.html")) active = "profile";
      }
    }

    el.className = "bottom-nav";
    el.innerHTML = renderBottomNavHTML(active);
  }

  // --- simple html escape ---
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  // --- init: run on DOM ready ---
  function initComponents() {
    // Migrated pages (data-component)
    document.querySelectorAll('[data-component="topbar"]').forEach(replaceTopbar);
    document.querySelectorAll('[data-component="bottom-nav"]').forEach(replaceBottomNav);

    // Un-migrated pages (nav.topbar, nav.bottom-nav)
    document.querySelectorAll('nav.topbar, .topbar').forEach(replaceTopbar);
    document.querySelectorAll('nav.bottom-nav, .bottom-nav').forEach(replaceBottomNav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComponents);
  } else {
    initComponents();
  }

})();
