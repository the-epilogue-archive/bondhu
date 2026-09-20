// ==========================================
// Bondhu - Shared Components
// Ek jaygay thakle sob page e auto update
// ==========================================

// ==========================================
// BOTTOM NAV — change korle sob page e update
// ==========================================
const BOTTOM_NAV_ITEMS = [
  { id: "home",    href: "index.html",  label: "হোম",    icon: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' },
  { id: "search",  href: "search.html", label: "খুঁজুন",  icon: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>' },
  { id: "upload",  href: "upload.html", label: "তৈরি",    icon: '<rect x="3" y="3" width="18" height="18" rx="5"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' },
  { id: "reels",   href: "reels.html",  label: "রিল",     icon: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M9 8v8l6-4z"/>' },
  { id: "profile", href: "profile.html",label: "প্রোফাইল", icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>' }
];

export function renderBottomNav(active = "") {
  const el = document.querySelector('[data-component="bottom-nav"]');
  if (!el) return;

  el.className = "bottom-nav";
  el.innerHTML = BOTTOM_NAV_ITEMS.map(item => `
    <a href="${item.href}" class="${item.id === active ? "active" : ""}" aria-label="${item.label}">
      <svg viewBox="0 0 24 24">${item.icon}</svg>
    </a>
  `).join("");
}

// ==========================================
// TOPBAR — change korle sob page e update
// ==========================================
const THEME_TOGGLE_HTML = `
  <button class="theme-toggle" onclick="toggleBondhuTheme()" aria-label="Theme">
    <svg class="icon-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    <svg class="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
  </button>
`;

const HOME_ICON_HTML = `
  <a href="index.html" class="icon-btn" aria-label="Home">
    <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  </a>
`;

export function renderTopbar(options = {}) {
  const el = document.querySelector('[data-component="topbar"]');
  if (!el) return;

  const {
    title = "",
    showTheme = true,
    showBack = false,
    showHome = true,
    actions = ""   // extra HTML
  } = options;

  el.className = "topbar";
  el.innerHTML = `
    <div class="topbar-brand" style="font-size:18px;display:flex;align-items:center;gap:8px">
      ${showBack ? `
        <button class="icon-btn" onclick="history.back()" aria-label="Back" style="width:32px;height:32px">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      ` : ""}
      ${title}
    </div>
    <div class="topbar-actions">
      ${actions}
      ${showTheme ? THEME_TOGGLE_HTML : ""}
      ${showHome ? HOME_ICON_HTML : ""}
    </div>
  `;
}

// ==========================================
// LOADING STATE
// ==========================================
export function renderLoading(message = "লোড হচ্ছে...") {
  return `<div class="loading-wrap"><div class="spinner"></div><div>${message}</div></div>`;
}

// ==========================================
// EMPTY STATE
// ==========================================
export function renderEmpty(opts = {}) {
  const {
    icon = '<circle cx="12" cy="12" r="10"/>',
    title = "কিছু নেই",
    action = "",
    actionHref = "#"
  } = opts;

  return `
    <div class="empty">
      <svg viewBox="0 0 24 24">${icon}</svg>
      <div>${title}</div>
      ${action ? `<a href="${actionHref}" style="color:var(--accent);font-weight:600;display:inline-block;margin-top:12px">${action}</a>` : ""}
    </div>
  `;
}

// ==========================================
// AUTO-MOUNT on page load
// ==========================================
function autoMount() {
  // Topbar
  const topbarEl = document.querySelector('[data-component="topbar"]');
  if (topbarEl && !topbarEl.dataset.mounted) {
    renderTopbar({
      title: topbarEl.dataset.title || "",
      showTheme: topbarEl.dataset.theme !== "false",
      showBack: topbarEl.dataset.back === "true",
      showHome: topbarEl.dataset.home !== "false",
    });
    topbarEl.dataset.mounted = "1";
  }

  // Bottom nav
  const navEl = document.querySelector('[data-component="bottom-nav"]');
  if (navEl && !navEl.dataset.mounted) {
    renderBottomNav(navEl.dataset.active || "");
    navEl.dataset.mounted = "1";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoMount);
} else {
  autoMount();
}

// Expose globally (jodi kono page manually call korte chay)
window.renderTopbar = renderTopbar;
window.renderBottomNav = renderBottomNav;
window.renderLoading = renderLoading;
window.renderEmpty = renderEmpty;
