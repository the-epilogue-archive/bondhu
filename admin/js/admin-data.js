// ==========================================
// Bondhu Admin - Data Queries + Actions
// ==========================================

import { db } from "../../js/firebase-config.js";
import {
  collection, getDocs, getCountFromServer, query, orderBy, limit,
  doc, updateDoc, deleteDoc, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Stats
// ==========================================
export async function getStats() {
  const results = { users: 0, posts: 0, reels: 0, stories: 0, reports: 0 };
  async function count(coll) {
    try {
      const snap = await getCountFromServer(collection(db, coll));
      return snap.data().count;
    } catch (e) {
      const snap = await getDocs(collection(db, coll));
      return snap.size;
    }
  }
  try { results.users = await count("users"); } catch (e) {}
  try { results.posts = await count("posts"); } catch (e) {}
  try { results.reels = await count("reels"); } catch (e) {}
  try { results.stories = await count("stories"); } catch (e) {}
  try { results.reports = await count("reports"); } catch (e) {}
  return results;
}

// ==========================================
// Recent
// ==========================================
export async function getRecentUsers(n = 5) {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

export async function getRecentPosts(n = 5) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

export async function getRecentReels(n = 5) {
  const q = query(collection(db, "reels"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

// ==========================================
// USERS - List all
// ==========================================
export async function getAllUsers(n = 200) {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

// ==========================================
// BAN / UNBAN user
// ==========================================
export async function setUserBanned(uid, banned) {
  await updateDoc(doc(db, "users", uid), {
    banned: !!banned,
    bannedAt: banned ? serverTimestamp() : null
  });
}

// ==========================================
// DELETE user + all content
// ==========================================
export async function deleteUserCompletely(uid) {
  // Delete user's posts
  try {
    const postsSnap = await getDocs(query(collection(db, "posts"), where("userId", "==", uid)));
    for (const d of postsSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (e) { console.warn("posts delete:", e.message); }

  // Delete user's reels
  try {
    const reelsSnap = await getDocs(query(collection(db, "reels"), where("userId", "==", uid)));
    for (const d of reelsSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (e) { console.warn("reels delete:", e.message); }

  // Delete user's stories
  try {
    const storiesSnap = await getDocs(query(collection(db, "stories"), where("userId", "==", uid)));
    for (const d of storiesSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (e) { console.warn("stories delete:", e.message); }

  // Delete user doc
  await deleteDoc(doc(db, "users", uid));
}

// ==========================================
// Get single user by uid
// ==========================================
export async function getUserByUid(uid) {
  const snap = await getDocs(query(collection(db, "users"), where("uid", "==", uid), limit(1)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// ==========================================
// Get user's posts
// ==========================================
export async function getUserPosts(uid) {
  const snap = await getDocs(query(collection(db, "posts"), where("userId", "==", uid)));
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

// ==========================================
// POSTS - List + actions
// ==========================================
export async function getAllPosts(n = 200) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

export async function deletePostById(postId) {
  await deleteDoc(doc(db, "posts", postId));
}

// ==========================================
// REELS
// ==========================================
export async function getAllReels(n = 100) {
  const q = query(collection(db, "reels"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

export async function deleteReelById(reelId) {
  await deleteDoc(doc(db, "reels", reelId));
}

// ==========================================
// STORIES
// ==========================================
export async function getAllStories(n = 100) {
  const q = query(collection(db, "stories"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

export async function deleteStoryById(storyId) {
  await deleteDoc(doc(db, "stories", storyId));
}
