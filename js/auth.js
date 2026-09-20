// ==========================================
// Bondhu - Firebase Authentication
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
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Signup — notun user
// ==========================================
export async function signup(email, password, displayName, username) {
  // 1. Auth e user create
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // 2. Display name set
  await updateProfile(user, { displayName });

  // 3. Firestore e user doc create
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: email,
    name: displayName,
    username: username.toLowerCase(),
    bio: "",
    photoURL: "",
    followers: [],
    following: [],
    createdAt: serverTimestamp()
  });

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
// Current user er Firestore data
// ==========================================
export async function getUserData(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ==========================================
// Auth state change — page protect korar jonno
// ==========================================
export function requireAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // Login nei — login page e pathao
      window.location.href = "login.html";
    } else {
      callback(user);
    }
  });
}

// ==========================================
// Jodi already logged in thake — feed e pathao
// ==========================================
export function redirectIfLoggedIn(to = "index.html") {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = to;
    }
  });
}

export { auth };
