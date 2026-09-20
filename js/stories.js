// ==========================================
// Bondhu - Stories (24h expire)
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, doc, getDoc, updateDoc,
  query, where, orderBy, serverTimestamp, arrayUnion, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Notun story create
// ==========================================
export async function createStory(imageUrl, caption) {
  const user = auth.currentUser;
  if (!user) throw new Error("Login koro");

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const userData = userSnap.exists() ? userSnap.data() : {};

  // 24 ghonta por expire
  const now = Date.now();
  const expiresAt = Timestamp.fromMillis(now + 24 * 60 * 60 * 1000);

  const ref = await addDoc(collection(db, "stories"), {
    userId: user.uid,
    username: userData.username || "unknown",
    userName: userData.name || "User",
    userPhoto: userData.photoURL || "",
    imageUrl,
    caption: caption || "",
    viewers: [],
    createdAt: serverTimestamp(),
    expiresAt
  });

  return ref.id;
}

// ==========================================
// Active stories (24h er modhye)
// ==========================================
export async function loadActiveStories() {
  const now = Timestamp.now();

  const q = query(
    collection(db, "stories"),
    where("expiresAt", ">", now),
    orderBy("expiresAt", "desc")
  );

  const snap = await getDocs(q);
  const stories = [];
  snap.forEach(d => stories.push({ id: d.id, ...d.data() }));

  // User onujayi group koro
  const grouped = {};
  stories.forEach(s => {
    if (!grouped[s.userId]) {
      grouped[s.userId] = {
        userId: s.userId,
        username: s.username,
        userName: s.userName,
        userPhoto: s.userPhoto,
        stories: []
      };
    }
    grouped[s.userId].stories.push(s);
  });

  // Prottek user er story gulo time onujayi sort koro (old first)
  Object.values(grouped).forEach(g => {
    g.stories.sort((a, b) => {
      const at = a.createdAt?.seconds || 0;
      const bt = b.createdAt?.seconds || 0;
      return at - bt;
    });
  });

  return Object.values(grouped);
}

// ==========================================
// Ek user er active story
// ==========================================
export async function loadUserStories(uid) {
  const now = Timestamp.now();
  const q = query(
    collection(db, "stories"),
    where("userId", "==", uid),
    where("expiresAt", ">", now),
    orderBy("expiresAt", "desc")
  );
  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  arr.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  return arr;
}

// ==========================================
// Story view mark koro
// ==========================================
export async function markStoryViewed(storyId) {
  const user = auth.currentUser;
  if (!user) return;
  try {
    await updateDoc(doc(db, "stories", storyId), {
      viewers: arrayUnion(user.uid)
    });
  } catch (e) {
    // Silent fail — view tracking optional
    console.warn("View mark fail:", e.message);
  }
}

// ==========================================
// Story delete
// ==========================================
export async function deleteStory(storyId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Login koro");
  const { deleteDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );
  await deleteDoc(doc(db, "stories", storyId));
}
