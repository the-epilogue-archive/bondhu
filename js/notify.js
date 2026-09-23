// ==========================================
// Bondhu - Global Notification System
// Sound + Vibration + Tab Title + Toast
// ==========================================

import { db } from "./firebase-config.js";
import {
  collection, query, onSnapshot, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showToast } from "./toast.js";

// ==========================================
// Audio context
// ==========================================
let audioCtx = null;
let audioEnabled = false;

function getAudioCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("AudioContext fail:", e);
    }
  }
  return audioCtx;
}

function ensureAudioResumed() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

// ==========================================
// Beep — kind: "notif" | "message"
// ==========================================
export function playBeep(kind = "notif") {
  if (!audioEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  ensureAudioResumed();

  const now = ctx.currentTime;
  const notes = kind === "message"
    ? [[880, 0.09], [1200, 0.13]]
    : [[750, 0.07], [1050, 0.11]];

  let offset = 0;
  notes.forEach(([freq, dur]) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur);

      osc.start(now + offset);
      osc.stop(now + offset + dur);
    } catch (e) {}
    offset += dur;
  });
}

// ==========================================
// Vibration (mobile)
// ==========================================
export function vibrate(pattern = [60, 40, 60]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) {}
}

// ==========================================
// Enable on first user interaction
// ==========================================
export function enableAudioOnFirstInteraction() {
  const enable = () => {
    audioEnabled = true;
    ensureAudioResumed();
    // Try a silent beep to unlock
    try {
      const ctx = getAudioCtx();
      if (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0;
        osc.start();
        osc.stop(ctx.currentTime + 0.01);
      }
    } catch (e) {}
    document.removeEventListener("click", enable);
    document.removeEventListener("touchstart", enable);
    document.removeEventListener("keydown", enable);
  };
  document.addEventListener("click", enable, { once: true });
  document.addEventListener("touchstart", enable, { once: true });
  document.addEventListener("keydown", enable, { once: true });

  // Try immediately (in case already interacted)
  setTimeout(() => {
    if (audioCtx && audioCtx.state === "running") audioEnabled = true;
  }, 500);
}

// ==========================================
// Tab title unread count
// ==========================================
const CLEAN_TITLE = document.title.replace(/^\(\d+\)\s*/, "");
let unreadTotal = 0;

function setTabTitle(n) {
  unreadTotal = n;
  if (n > 0) {
    document.title = `(${n}) ${CLEAN_TITLE}`;
  } else {
    document.title = CLEAN_TITLE;
  }
}

// ==========================================
// Notif toast formatter
// ==========================================
function notifText(n) {
  if (n.type === "like") return "❤️ কেউ আপনার পোস্ট পছন্দ করেছে";
  if (n.type === "comment") return "💬 নতুন মন্তব্য এসেছে";
  if (n.type === "follow") return "👤 কেউ আপনাকে অনুসরণ করেছেন";
  if (n.type === "broadcast") return `📢 ${n.title || "বন্ধু টিম"}: ${(n.text || "").slice(0, 60)}`;
  return "🔔 নতুন খবর";
}

// ==========================================
// Start listening to notifications
// ==========================================
let started = false;
let previousCount = null;
let unsub = null;

export function startNotifications(user, opts = {}) {
  if (started || !user) return () => {};
  started = true;

  const { suppressSound = false } = opts;

  const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc"),
    limit(30)
  );

  unsub = onSnapshot(q, (snap) => {
    const unread = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.toUid === user.uid && !data.read) {
        unread.push({ id: d.id, ...data });
      }
    });

    // Update badges everywhere
    updateBadges(unread.length);

    if (previousCount === null) {
      // First load — no sound
      previousCount = unread.length;
      setTabTitle(unread.length);
      return;
    }

    if (unread.length > previousCount) {
      if (!suppressSound) {
        playBeep("notif");
        vibrate([80, 40, 80]);
      }
      const newest = unread[0];
      if (newest) {
        setTimeout(() => showToast(notifText(newest), "info", 4000), 100);
      }
    }

    previousCount = unread.length;
    setTabTitle(unread.length);
  }, (err) => {
    console.warn("Notifications listener:", err.message);
  });

  return () => {
    if (unsub) unsub();
    started = false;
    previousCount = null;
  };
}

// ==========================================
// Update badges across all pages
// ==========================================
function updateBadges(n) {
  const badge = document.getElementById("notifBadge");
  if (badge) {
    if (n > 0) {
      badge.textContent = n > 9 ? "9+" : n;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }
}

// ==========================================
// Manually set unread (for initial load)
// ==========================================
export function setUnreadCount(n) {
  updateBadges(n);
  setTabTitle(n);
}

// ==========================================
// Message sound — called from chat.html
// ==========================================
export function playMessageSound() {
  playBeep("message");
  vibrate([50, 30, 50]);
}
