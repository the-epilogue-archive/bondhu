// ==========================================
// Bondhu Admin - Data Queries
// ==========================================

import { db } from "../../js/firebase-config.js";
import {
  collection, getDocs, getCountFromServer, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Get counts for dashboard
// ==========================================
export async function getStats() {
  const results = { users: 0, posts: 0, reels: 0, stories: 0, reports: 0 };

  async function count(coll) {
    try {
      const snap = await getCountFromServer(collection(db, coll));
      return snap.data().count;
    } catch (e) {
      // fallback
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
// Recent users
// ==========================================
export async function getRecentUsers(n = 5) {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

// ==========================================
// Recent posts
// ==========================================
export async function getRecentPosts(n = 5) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

// ==========================================
// Recent reels
// ==========================================
export async function getRecentReels(n = 5) {
  const q = query(collection(db, "reels"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}
