// ==========================================
// Bondhu - Toast + Confirm System
// alert() and confirm() ke replace kore
// ==========================================

(function() {
  // Container
  if (!document.getElementById("bondhu-toast-container")) {
    const container = document.createElement("div");
    container.id = "bondhu-toast-container";
    container.style.cssText = `
      position:fixed;
      top:16px;left:50%;
      transform:translateX(-50%);
      z-index:9999;
      display:flex;
      flex-direction:column;
      gap:8px;
      pointer-events:none;
      max-width:min(420px, 92vw);
      width:max-content;
    `;
    document.body.appendChild(container);
  }

  // Confirm modal container
  if (!document.getElementById("bondhu-confirm-container")) {
    const confirmC = document.createElement("div");
    confirmC.id = "bondhu-confirm-container";
    confirmC.style.cssText = `
      position:fixed;inset:0;
      background:rgba(0,0,0,.4);
      backdrop-filter:blur(4px);
      -webkit-backdrop-filter:blur(4px);
      z-index:10000;
      display:none;
      align-items:center;justify-content:center;
      padding:20px;
      opacity:0;
      transition:opacity .25s;
    `;
    confirmC.innerHTML = `
      <div id="bondhu-confirm-box" style="
        background:var(--paper-elev, #fff);
        color:var(--ink, #111);
        border:1px solid var(--rule, #ddd);
        border-radius:16px;
        padding:24px;
        max-width:380px;
        width:100%;
        box-shadow:0 20px 60px rgba(0,0,0,.3);
        font-family:'Hind Siliguri', system-ui, sans-serif;
        transform:scale(.94) translateY(10px);
        transition:transform .3s cubic-bezier(.34,1.56,.64,1);
      ">
        <div id="bondhu-confirm-title" style="
          font-family:'Playfair Display', serif;
          font-size:18px;font-weight:700;
          margin-bottom:10px;
          color:var(--ink, #111);
          letter-spacing:-.2px;
        "></div>
        <div id="bondhu-confirm-msg" style="
          font-size:14px;
          color:var(--ink-soft, #333);
          line-height:1.6;
          margin-bottom:20px;
          word-break:break-word;
        "></div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button id="bondhu-confirm-cancel" style="
            padding:10px 20px;
            border-radius:10px;
            background:transparent;
            border:1px solid var(--rule-dark, #999);
            color:var(--ink-soft, #333);
            font-family:inherit;
            font-size:14px;
            font-weight:600;
            cursor:pointer;
            transition:all .2s;
          ">বাতিল</button>
          <button id="bondhu-confirm-ok" style="
            padding:10px 20px;
            border-radius:10px;
            background:var(--accent, #2d5a3d);
            border:none;
            color:var(--accent-text, #fff);
            font-family:inherit;
            font-size:14px;
            font-weight:600;
            cursor:pointer;
            transition:all .2s;
            box-shadow:0 4px 12px var(--accent-glow, rgba(45,90,61,.3));
          ">হ্যাঁ</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmC);
  }
})();

// ==========================================
// TOAST
// ==========================================
export function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("bondhu-toast-container");
  if (!container) return;

  const toast = document.createElement("div");

  const colors = {
    ok: "var(--accent, #2d5a3d)",
    err: "#c62828",
    warn: "#f0ad00",
    info: "var(--accent, #2d5a3d)"
  };

  const icons = {
    ok: "✓",
    err: "✕",
    warn: "!",
    info: "i"
  };

  const accent = colors[type] || colors.info;
  const icon = icons[type] || icons.info;

  toast.style.cssText = `
    background:var(--paper-elev, #fff);
    color:var(--ink, #111);
    border:1px solid var(--rule, #ddd);
    border-left:4px solid ${accent};
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
    cursor:pointer;
  `;

  toast.innerHTML = `
    <span style="
      display:inline-flex;align-items:center;justify-content:center;
      width:22px;height:22px;border-radius:50%;
      background:${accent};
      color:#fff;font-weight:700;font-size:12px;flex-shrink:0;
    ">${icon}</span>
    <span style="flex:1;min-width:0">${message}</span>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0) scale(1)";
    });
  });

  const remove = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-14px) scale(.96)";
    setTimeout(() => toast.remove(), 350);
  };

  const timeout = setTimeout(remove, duration);
  toast.addEventListener("click", () => { clearTimeout(timeout); remove(); });
}

// ==========================================
// CONFIRM MODAL
// ==========================================
export function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    const container = document.getElementById("bondhu-confirm-container");
    const box = document.getElementById("bondhu-confirm-box");
    const titleEl = document.getElementById("bondhu-confirm-title");
    const msgEl = document.getElementById("bondhu-confirm-msg");
    const okBtn = document.getElementById("bondhu-confirm-ok");
    const cancelBtn = document.getElementById("bondhu-confirm-cancel");

    if (!container) { resolve(false); return; }

    titleEl.textContent = options.title || "নিশ্চিত করুন";
    msgEl.textContent = message;
    okBtn.textContent = options.okText || "হ্যাঁ";
    cancelBtn.textContent = options.cancelText || "বাতিল";

    container.style.display = "flex";
    requestAnimationFrame(() => {
      container.style.opacity = "1";
      box.style.transform = "scale(1) translateY(0)";
    });

    const cleanup = () => {
      container.style.opacity = "0";
      box.style.transform = "scale(.94) translateY(10px)";
      setTimeout(() => {
        container.style.display = "none";
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        container.onclick = null;
      }, 250);
    };

    okBtn.onclick = () => { cleanup(); resolve(true); };
    cancelBtn.onclick = () => { cleanup(); resolve(false); };
    container.onclick = (e) => {
      if (e.target === container) { cleanup(); resolve(false); }
    };
  });
}

// ==========================================
// GLOBAL OVERRIDE — alert() automatically toast
// ==========================================
window.showToast = showToast;
window.showConfirm = showConfirm;

const _nativeAlert = window.alert;
window.alert = (msg) => {
  // Type detect koro message theke
  let type = "info";
  if (typeof msg === "string") {
    if (msg.startsWith("✅") || msg.includes("সফল") || msg.includes("হয়ে") || msg.includes("done")) type = "ok";
    else if (msg.startsWith("❌") || msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("error") || msg.includes("যায়নি") || msg.includes("পারিনি")) type = "err";
    else if (msg.includes("শীঘ্রই") || msg.includes("আসছে")) type = "info";
  }
  showToast(msg, type, 3500);
};

// confirm() ke async kora jay na (blocking), tai sob confirm replace koro
// Purono code er sob confirm() kaj korbe না — ei function use koro:
// const ok = await showConfirm("Delete korbe?");
window._nativeConfirm = window.confirm;
// (window.confirm rakho jemon ache — kokhono browser native chaina)
