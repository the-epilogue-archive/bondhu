// ==========================================
// Bondhu Admin - Authentication
// Google login + email whitelist + PIN
// ==========================================

import { auth } from "../js/firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const SESSION_KEY = "bondhu_admin_session";

// ==========================================
// Check if email is admin
// ==========================================
export function isAdminEmail(email) {
  if (!email) return false;
  const list = (window.ADMIN_CONFIG.ADMIN_EMAILS || []).map(e => e.toLowerCase());
  return list.includes(email.toLowerCase());
}

// ==========================================
// Sign in with Google
// ==========================================
export async function signInAdmin() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    await signInWithRedirect(auth, provider);
    return { redirect: true };
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return { user: result.user };
  } catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, provider);
      return { redirect: true };
    }
    throw e;
  }
}

export async function handleAdminRedirect() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (e) {
    console.error("Admin redirect error:", e);
    return null;
  }
}

// ==========================================
// Sign out
// ==========================================
export async function signOutAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
  try { await signOut(auth); } catch (e) {}
}

// ==========================================
// PIN verify
// ==========================================
export function verifyPIN(pin) {
  const correct = String(window.ADMIN_CONFIG.ADMIN_PIN || "");
  return String(pin).trim() === correct;
}

// ==========================================
// Session create / get
// ==========================================
export function createSession(user) {
  const data = {
    uid: user.uid,
    email: user.email,
    name: user.displayName || "Admin",
    photoURL: user.photoURL || "",
    verifiedAt: Date.now(),
    expires: Date.now() + ((window.ADMIN_CONFIG.SESSION_HOURS || 12) * 60 * 60 * 1000)
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  return data;
}

export function getSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    if (!s) return null;
    if (Date.now() > s.expires) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

// ==========================================
// requireAdmin — admin page protect
// ==========================================
export function requireAdmin(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    if (!isAdminEmail(user.email)) {
      await signOutAdmin();
      window.location.href = "index.html";
      return;
    }

    const session = getSession();
    if (!session || session.uid !== user.uid) {
      window.location.href = "index.html";
      return;
    }

    callback({ ...user, session });
  });
}

// ==========================================
// Already logged in admin hole dashboard e
// ==========================================
export function redirectIfAdminLoggedIn(to = "dashboard.html") {
  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    if (!isAdminEmail(user.email)) return;
    const session = getSession();
    if (session && session.uid === user.uid) {
      window.location.href = to;
    }
  });
}

export { auth };
