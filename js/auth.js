// ==========================================
// Bondhu - Firebase Auth + Firestore + Google
// Robust version with timeout fallback
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
  query, where, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Signup
// ==========================================
export async function signup(email, password, displayName, username) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  await updateProfile(user, { displayName });

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
// Google doc ensure
// ==========================================
async function ensureGoogleUserDoc(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return;

  let baseUsername = (user.email || "").split("@")[0]
    .toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15) || "user";
  if (baseUsername.length < 3) {
    baseUsername = "user" + Math.floor(Math.random() * 999);
  }

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

// ==========================================
// Google login
// ==========================================
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    await signInWithRedirect(auth, provider);
    return { redirect: true };
  }

  try {
    const result = await signInWithPopup(auth, provider);
    await ensureGoogleUserDoc(result.user);
    return { user: result.user };
  } catch (e) {
    if (
      e.code === "auth/popup-blocked" ||
      e.code === "auth/popup-closed-by-user" ||
      e.code === "auth/cancelled-popup-request" ||
      e.code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
      return { redirect: true };
    }
    throw e;
  }
}

export async function handleGoogleRedirect() {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    await ensureGoogleUserDoc(result.user);
    return result.user;
  } catch (e) {
    console.error("Redirect result error:", e);
    throw e;
  }
}

// ==========================================
// Logout
// ==========================================
export async function logout() {
  await signOut(auth);
}

// ==========================================
// Cached user
// ==========================================
let _cachedUser = null;
onAuthStateChanged(auth, (user) => { _cachedUser = user; });
export function getCurrentUser() { return _cachedUser; }

// ==========================================
// User data
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
// Public users list (email stripped)
// ==========================================
export async function getAllUsersList() {
  const snap = await getDocs(collection(db, "users"));
  const arr = [];
  snap.forEach(d => {
    const data = d.data();
    const { email, ...publicData } = data;
    arr.push(publicData);
  });
  return arr;
}

// ==========================================
// Username change with batch update
// ==========================================
export async function changeUsername(uid, newUsername) {
  const cleaned = String(newUsername || "").trim().toLowerCase().replace("@", "");

  if (!/^[a-z0-9_]{3,20}$/.test(cleaned)) {
    throw new Error("ইউজারনেম ৩-২০ অক্ষর, শুধু a-z, 0-9, _");
  }

  const q = query(collection(db, "users"), where("username", "==", cleaned));
  const snap = await getDocs(q);
  const exists = snap.docs.some(d => d.id !== uid);
  if (exists) throw new Error("এই ইউজারনেম আগেই নেওয়া হয়েছে");

  const meSnap = await getDoc(doc(db, "users", uid));
  const meData = meSnap.exists() ? meSnap.data() : {};
  const oldUsername = meData.username;

  if (oldUsername === cleaned) {
    throw new Error("নতুন ইউজারনেম আগের মতোই");
  }

  await updateDoc(doc(db, "users", uid), { username: cleaned });

  try {
    const postsSnap = await getDocs(query(collection(db, "posts"), where("userId", "==", uid)));
    if (postsSnap.size > 0) {
      const b = writeBatch(db);
      postsSnap.forEach(d => b.update(d.ref, { username: cleaned }));
      await b.commit();
    }
  } catch (e) { console.warn("Posts update skip:", e.message); }

  try {
    const reelsSnap = await getDocs(query(collection(db, "reels"), where("userId", "==", uid)));
    if (reelsSnap.size > 0) {
      const b = writeBatch(db);
      reelsSnap.forEach(d => b.update(d.ref, { username: cleaned }));
      await b.commit();
    }
  } catch (e) { console.warn("Reels update skip:", e.message); }

  try {
    const storiesSnap = await getDocs(query(collection(db, "stories"), where("userId", "==", uid)));
    if (storiesSnap.size > 0) {
      const b = writeBatch(db);
      storiesSnap.forEach(d => b.update(d.ref, { username: cleaned }));
      await b.commit();
    }
  } catch (e) { console.warn("Stories update skip:", e.message); }

  try {
    const chatsSnap = await getDocs(collection(db, "chats"));
    const refs = [];
    chatsSnap.forEach(d => {
      const data = d.data();
      if (Array.isArray(data.members) && data.members.includes(uid)) {
        refs.push(d.ref);
      }
    });
    if (refs.length > 0) {
      const b = writeBatch(db);
      refs.forEach(ref => {
        b.update(ref, { [`memberData.${uid}.username`]: cleaned });
      });
      await b.commit();
    }
  } catch (e) { console.warn("Chats update skip:", e.message); }

  return cleaned;
}

// ==========================================
// requireAuth — ROBUST with 8s timeout
// ==========================================
export function requireAuth(callback) {
  let called = false;

  onAuthStateChanged(auth, async (user) => {
    if (called) return;
    called = true;

    const timeout = setTimeout(() => {
      console.warn("⚠️ requireAuth timeout — forcing callback");
      if (user) {
        callback({
          ...user,
          name: user.displayName || "ব্যবহারকারী",
          username: (user.email || "").split("@")[0] || "user",
          bio: "",
          photoURL: user.photoURL || "",
          followers: [],
          following: []
        });
      }
    }, 8000);

    if (!user) {
      clearTimeout(timeout);
      window.location.href = "login.html";
      return;
    }

    try {
      let data = await getUserData(user.uid);

      if (!data) {
        console.warn("⚠️ User doc nei — auto-create korchi");
        const fallbackUsername = (user.email || "").split("@")[0]
          .toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 15)
          || ("user" + Math.floor(Math.random() * 999));

        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            name: user.displayName || "ব্যবহারকারী",
            username: fallbackUsername,
            bio: "",
            photoURL: user.photoURL || "",
            followers: [],
            following: [],
            provider: user.providerData?.[0]?.providerId === "google.com" ? "google" : "password",
            createdAt: serverTimestamp()
          });
          data = await getUserData(user.uid);
        } catch (createErr) {
          console.error("❌ Auto-create fail:", createErr.code, createErr.message);
          data = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || "ব্যবহারকারী",
            username: fallbackUsername,
            bio: "",
            photoURL: user.photoURL || "",
            followers: [],
            following: []
          };
        }
      }

      clearTimeout(timeout);
      callback({ ...user, ...data });
    } catch (e) {
      console.error("❌ requireAuth error:", e.code, e.message);
      clearTimeout(timeout);
      callback({
        ...user,
        name: user.displayName || "ব্যবহারকারী",
        username: (user.email || "").split("@")[0] || "user",
        bio: "",
        photoURL: user.photoURL || "",
        followers: [],
        following: []
      });
    }
  });
}

// ==========================================
// redirectIfLoggedIn
// ==========================================
export function redirectIfLoggedIn(to = "index.html") {
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = to;
  });
}

export { auth };
