// ==========================================
// Bondhu Admin - Auto Sidebar + Back Button
// Sob admin page e auto-inject hoy
// ==========================================

(function() {

  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    posts: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    reels: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M9 8v8l6-4z"/>',
    stories: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    reports: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    broadcast: '<path d="M4 4l16 8-16 8v-6l10-2-10-2z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    app: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>'
  };

  const svg = (name) => `<svg viewBox="0 0 24 24">${ICONS[name] || ""}</svg>`;

  const MENU = [
    { id: "dashboard", href: "dashboard.html", label: "ড্যাশবোর্ড", icon: "dashboard" },
    { id: "users",     href: "users.html",     label: "ব্যবহারকারী", icon: "users" },
    { id: "posts",     href: "posts.html",     label: "পোস্ট",       icon: "posts" },
    { id: "reels",     href: "reels.html",     label: "রিল",         icon: "reels" },
    { id: "stories",   href: "stories.html",   label: "স্টোরি",      icon: "stories" },
    { id: "reports",   href: "reports.html",   label: "রিপোর্ট",     icon: "reports" },
    { id: "broadcast", href: "broadcast.html", label: "ব্রডকাস্ট",   icon: "broadcast" },
    { id: "settings",  href: "settings.html",  label: "সেটিংস",      icon: "settings" }
  ];

  function getCurrentPage() {
    const path = window.location.pathname;
    const file = path.split("/").pop() || "dashboard.html";
    return file.replace(".html", "");
  }

  // ==========================================
  // SIDEBAR render
  // ==========================================
  function renderSidebar() {
    const el = document.getElementById("adminSidebar");
    if (!el) return;

    const current = getCurrentPage();

    el.className = "admin-side";
    el.id = "adminSidebarInner";
    el.innerHTML = `
      <div class="admin-side-brand">
        বন্ধু<em>.</em>
        <span style="margin-left:auto;font-size:9px;letter-spacing:2px;color:var(--accent);font-family:'Hind Siliguri',sans-serif;font-weight:700">ADMIN</span>
      </div>
      <nav class="admin-side-nav">
        ${MENU.map(m => `
          <a href="${m.href}" class="${m.id === current ? "active" : ""}">
            ${svg(m.icon)}
            ${m.label}
          </a>
        `).join("")}

        <div style="height:1px;background:var(--rule);margin:12px 8px"></div>

        <!-- MAIN APP LINK -->
        <a href="../index.html" style="color:var(--accent);font-weight:700;background:var(--accent-soft);border:1px solid var(--accent-border)">
          ${svg("app")}
          অ্যাপে ফিরে যান
        </a>

        <a href="#" id="adminLogoutBtn" style="color:#c62828">
          ${svg("logout")}
          প্রস্থান
        </a>
      </nav>
    `;

    // Logout
    document.getElementById("adminLogoutBtn").addEventListener("click", async (e) => {
      e.preventDefault();
      const ok = confirm("অ্যাডমিন থেকে প্রস্থান করবেন?");
      if (!ok) return;
      const mod = await import("./admin-auth.js");
      await mod.signOutAdmin();
      window.location.href = "index.html";
    });

    // Mobile overlay close
    document.addEventListener("click", (e) => {
      const side = document.getElementById("adminSidebarInner");
      const menuBtn = document.getElementById("adminMenuBtn");
      if (!side || !menuBtn) return;
      if (side.classList.contains("open") &&
          !side.contains(e.target) &&
          !menuBtn.contains(e.target)) {
        side.classList.remove("open");
      }
    });
  }

  // ==========================================
  // Inject mobile menu + BACK button in topbar
  // ==========================================
  function injectTopbarButtons() {
    const topbar = document.getElementById("adminTopbar");
    if (!topbar) return;

    // Mobile menu button
    if (!topbar.querySelector(".admin-menu-btn")) {
      const btn = document.createElement("button");
      btn.className = "admin-menu-btn";
      btn.id = "adminMenuBtn";
      btn.setAttribute("aria-label", "Menu");
      btn.innerHTML = svg("menu");
      btn.addEventListener("click", () => {
        document.getElementById("adminSidebarInner")?.classList.toggle("open");
      });

      const brand = topbar.querySelector(".admin-topbar-brand");
      if (brand) {
        brand.parentNode.insertBefore(btn, brand);
      } else {
        topbar.insertBefore(btn, topbar.firstChild);
      }
    }

    // Back / Dashboard button
    if (!topbar.querySelector(".admin-back-btn")) {
      const backBtn = document.createElement("a");
      backBtn.className = "admin-back-btn";
      backBtn.href = "dashboard.html";
      backBtn.setAttribute("aria-label", "Dashboard");
      backBtn.title = "ড্যাশবোর্ডে ফিরুন";
      backBtn.innerHTML = svg("back");
      backBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--paper-2);
        color: var(--ink-soft);
        border: 1px solid var(--rule);
        margin-right: 6px;
        transition: all .3s cubic-bezier(.34,1.56,.64,1);
        text-decoration: none;
        flex-shrink: 0;
      `;
      backBtn.addEventListener("mouseenter", () => {
        backBtn.style.background = "var(--accent-soft)";
        backBtn.style.borderColor = "var(--accent-border)";
        backBtn.style.color = "var(--accent)";
        backBtn.style.transform = "translateX(-2px)";
      });
      backBtn.addEventListener("mouseleave", () => {
        backBtn.style.background = "var(--paper-2)";
        backBtn.style.borderColor = "var(--rule)";
        backBtn.style.color = "var(--ink-soft)";
        backBtn.style.transform = "translateX(0)";
      });

      const actions = topbar.querySelector(".admin-topbar-actions");
      if (actions) {
        actions.insertBefore(backBtn, actions.firstChild);
      } else {
        // Create actions div if not exists
        const div = document.createElement("div");
        div.className = "admin-topbar-actions";
        div.appendChild(backBtn);
        topbar.appendChild(div);
      }

      // Dashboard page e back button na dekhাও
      const currentPage = getCurrentPage();
      if (currentPage === "dashboard" || currentPage === "") {
        backBtn.style.display = "none";
      }
    }
  }

  // ==========================================
  // Init
  // ==========================================
  function init() {
    renderSidebar();
    injectTopbarButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
