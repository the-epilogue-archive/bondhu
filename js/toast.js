// ==========================================
// Bondhu - Toast Notification System
// alert() er bodole sundor non-blocking toast
// ==========================================

(function() {
  // Container create (ekbar e)
  if (!document.getElementById("bondhu-toast-container")) {
    const container = document.createElement("div");
    container.id = "bondhu-toast-container";
    container.style.cssText = `
      position:fixed;
      top:20px;left:50%;
      transform:translateX(-50%);
      z-index:9999;
      display:flex;
      flex-direction:column;
      gap:8px;
      pointer-events:none;
      max-width:min(420px, 90vw);
    `;
    document.body.appendChild(container);
  }
})();

export function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("bondhu-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.style.cssText = `
    background:var(--paper-elev, #fff);
    color:var(--ink, #111);
    border:1px solid var(--rule, #ddd);
    border-left:4px solid ${
      type === "ok" ? "var(--accent, #2d5a3d)" :
      type === "err" ? "#c62828" :
      type === "warn" ? "#f0ad00" :
      "var(--accent, #2d5a3d)"
    };
    padding:12px 18px;
    border-radius:12px;
    box-shadow:0 8px 24px rgba(0,0,0,.15);
    font-family:'Hind Siliguri', system-ui, sans-serif;
    font-size:13.5px;
    line-height:1.5;
    pointer-events:auto;
    display:flex;
    align-items:center;
    gap:10px;
    opacity:0;
    transform:translateY(-14px) scale(.96);
    transition:opacity .3s cubic-bezier(.22,1,.36,1), transform .35s cubic-bezier(.34,1.56,.64,1);
    will-change:transform, opacity;
    max-width:100%;
    word-break:break-word;
  `;

  // Icon
  const icons = {
    ok: "✓",
    err: "✕",
    warn: "!",
    info: "i"
  };
  const iconColors = {
    ok: "var(--accent, #2d5a3d)",
    err: "#c62828",
    warn: "#f0ad00",
    info: "var(--accent, #2d5a3d)"
  };

  toast.innerHTML = `
    <span style="
      display:inline-flex;align-items:center;justify-content:center;
      width:22px;height:22px;border-radius:50%;
      background:${iconColors[type] || iconColors.info};
      color:#fff;font-weight:700;font-size:12px;flex-shrink:0;
    ">${icons[type] || "i"}</span>
    <span style="flex:1;min-width:0">${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0) scale(1)";
    });
  });

  // Auto remove
  const timeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-14px) scale(.96)";
    setTimeout(() => toast.remove(), 350);
  }, duration);

  // Click to dismiss
  toast.addEventListener("click", () => {
    clearTimeout(timeout);
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-14px) scale(.96)";
    setTimeout(() => toast.remove(), 350);
  });
}

// Global access
window.showToast = showToast;

// alert() override (optional) — chaile alert ke toast e convert korte parо
// window.alert = (msg) => showToast(msg, "info");
