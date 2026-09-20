// ==========================================
// Bondhu - Firebase Auth + Firestore
// + Google Sign-in
// ==========================================

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, updateDoc, collection, getDocs,
  query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Signup (email/password)
// ==========================================
export async function signup(email, password, displayName, username) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  await updateProfile(user, { displayName });

  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email.toLowerCase(),
      name: displayName,
      username: username.toLowerCase(),
      bio: "",
      photoURL: "",
      followers: [],
      following: [],
      provider: "password",
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Firestore doc create fail:", e.code, e.message);
    throw new Error("Firestore e user save hoy ni: " + e.message);
  }

  return user;
}

// ==========================================
// Login (email/password)
// ==========================================
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ==========================================
// Google Sign-in (popup)
// ==========================================
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  // Mobile e popup kaj kore na — redirect use koro
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    await signInWithRedirect(auth, provider);
    return null; // redirect, page reload hobe
  }

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // User doc check koro — na thakle create koro
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // Username generate — email er age er part, unique banate suffix
    let baseUsername = (user.email || "").split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 15) || "user";
    if (baseUsername.length < 3) baseUsername = "user" + Math.floor(Math.random() * 999);

    let username = baseUsername;
    // Ensure unique
    let attempt = 0;
    while (attempt < 5) {
      const q = query(collection(db, "users"), where("username", "==", username));
      const res = await getDocs(q);
      if (res.empty) break;
      attempt++;
      username = baseUsername + Math.floor(Math.random() * 999);
    }

    await setDoc(userRef, {
      uid: user.uid,
      email: (user.email || "").toLowerCase(),
      name: user.displayName || "ব্যবহারকারী",
      username: username,
      bio: "",
      photoURL: user.photoURL || "",
      followers: [],
      following: [],
      provider: "google",
      createdAt: serverTimestamp()
    });
  }

  return user;
}

// ==========================================
// Redirect result handle (mobile er jonno)
// ==========================================
export async function handleGoogleRedirect() {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    const user = result.user;
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      let baseUsername = (user.email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15) || "user";
      if (baseUsername.length < 3) baseUsername = "user" + Math.floor(Math.random() * 999);
      let username = baseUsername;
      let attempt = 0;
      while (attempt < 5) {
        const q = query(collection(db, "users"), where("username", "==", username));
        const res = await getDocs(q);
        if (res.empty) break;
        attempt++;
        username = baseUsername + Math.floor(Math.random() * 999);
      }
      await setDoc(userRef, {
        uid: user.uid,
        email: (user.email || "").toLowerCase(),
        name: user.displayName || "ব্যবহারকারী",
        username: username,
        bio: "",
        photoURL: user.photoURL || "",
        followers: [],
        following: [],
        provider: "google",
        createdAt: serverTimestamp()
      });
    }
    return user;
  } catch (e) {
    console.error("Redirect result error:", e);
    return null;
  }
}

// ==========================================
// Logout
// ==========================================
export async function logout() {
  await signOut(auth);
}

// ==========================================
// Current user cache
// ==========================================
let _cachedUser = null;
onAuthStateChanged(auth, (user) => { _cachedUser = user; });

export function getCurrentUser() {
  return _cachedUser;
}

// ==========================================
// User data from Firestore
// ==========================================
export async function getUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserData(uid, updates) {
  await updateDoc(doc(db, "users", uid), updates);
  return { uid, ...updates };
}

// ==========================================
// requireAuth — page protect
// ==========================================
export function requireAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      let data = await getUserData(user.uid);
      if (!data) {
        // Auto-create if missing
        const fallbackUsername = (user.email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15) || ("user" + Math.floor(Math.random() * 999));
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || "ব্যবহারকারী",
          username: fallbackUsername,
          bio: "",
          photoURL: user.photoURL || "",
          followers: [],
          following: [],
          provider: "google",
          createdAt: serverTimestamp()
        });
        data = await getUserData(user.uid);
      }
      callback({ ...user, ...data });
    }
  });
}

// ==========================================
// Redirect if already logged in
// ==========================================
export function redirectIfLoggedIn(to = "index.html") {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = to;
  });
}

// ==========================================
// All users list
// ==========================================
export async function getAllUsersList() {
  const snap = await getDocs(collection(db, "users"));
  const arr = [];
  snap.forEach(d => arr.push(d.data()));
  return arr;
}

export { auth };
