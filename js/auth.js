// ==========================================
// Bondhu - Firebase Auth + Firestore
// ==========================================

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Signup — Auth + Firestore duitai
// ==========================================
export async function signup(email, password, displayName, username) {
  // 1. Auth e user create
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // 2. Auth displayName set
  await updateProfile(user, { displayName });

  // 3. Firestore e user doc
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
      createdAt: serverTimestamp()
    });
    console.log("✅ Firestore user doc create hoyeche:", user.uid);
  } catch (e) {
    console.error("❌ Firestore doc create fail:", e.code, e.message);
    throw new Error("Firestore e user save hoy ni: " + e.message);
  }

  return user;
}

// ==========================================
// Login
// ==========================================
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ==========================================
// Logout
// ==========================================
export async function logout() {
  await signOut(auth);
}

// ==========================================
// Current user (sync — cached)
// ==========================================
let _cachedUser = null;
onAuthStateChanged(auth, (user) => {
  _cachedUser = user;
});

export function getCurrentUser() {
  return _cachedUser;
}

// ==========================================
// Firestore theke user data
// ==========================================
export async function getUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ==========================================
// User data update
// ==========================================
export async function updateUserData(uid, updates) {
  await updateDoc(doc(db, "users", uid), updates);
  return { uid, ...updates };
}

// ==========================================
// Page protect — login na korle login.html e
// ==========================================
export function requireAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      // Firestore theke full data load koro
      let data = await getUserData(user.uid);

      // Jodi Firestore e doc na thake, create koro (safety)
      if (!data) {
        console.warn("⚠️ Firestore e user doc nei, create korchi...");
        const fallbackUsername = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || "User",
          username: fallbackUsername,
          bio: "",
          photoURL: "",
          followers: [],
          following: [],
          createdAt: serverTimestamp()
        });
        data = await getUserData(user.uid);
      }

      callback({ ...user, ...data });
    }
  });
}

// ==========================================
// Already logged in hole index e
// ==========================================
export function redirectIfLoggedIn(to = "index.html") {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = to;
  });
}

// ==========================================
// Sob user (search er jonno)
// ==========================================
export async function getAllUsersList() {
  const snap = await getDocs(collection(db, "users"));
  const arr = [];
  snap.forEach(d => arr.push(d.data()));
  return arr;
}

export { auth };
