// ==========================================
// Bondhu - Feed + Posts (Firestore)
// ==========================================

import { db } from "./firebase-config.js";
import { getCurrentUser, getUserData, getAllUsersList } from "./auth.js";
import {
  collection, addDoc, getDocs, doc, getDoc, setDoc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp,
  arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Notun post create
// ==========================================
export async function createPost(imageUrl, caption) {
  const user = getCurrentUser();
  if (!user) throw new Error("Login koro age");

  const ref = await addDoc(collection(db, "posts"), {
    userId: user.uid,
    username: user.username,
    userName: user.name,
    userPhoto: user.photoURL || "",
    imageUrl,
    caption: caption || "",
    likes: [],
    createdAt: serverTimestamp()
  });

  return ref.id;
}

// ==========================================
// Sob post load (feed er jonno)
// ==========================================
export async function loadFeed() {
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
  const posts = [];
  snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
  return posts;
}

// ==========================================
// Ekta user er sob post
// ==========================================
export async function loadUserPosts(uid) {
  const snap = await getDocs(collection(db, "posts"));
  const posts = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.userId === uid) posts.push({ id: d.id, ...data });
  });
  // newest first
  posts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return posts;
}

// ==========================================
// Like / Unlike toggle
// ==========================================
export async function toggleLike(postId, currentLikes) {
  const user = getCurrentUser();
  if (!user) throw new Error("Login koro");

  const ref = doc(db, "posts", postId);
  const alreadyLiked = currentLikes.includes(user.uid);

  await updateDoc(ref, {
    likes: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
  });

  return !alreadyLiked;
}

// ==========================================
// Post delete
// ==========================================
export async function deletePost(postId) {
  const user = getCurrentUser();
  if (!user) throw new Error("Login koro");
  await deleteDoc(doc(db, "posts", postId));
}

// ==========================================
// Comment add
// ==========================================
export async function addComment(postId, text) {
  const user = getCurrentUser();
  if (!user) throw new Error("Login koro");

  await addDoc(collection(db, "posts", postId, "comments"), {
    userId: user.uid,
    username: user.username,
    userName: user.name,
    text: text,
    createdAt: serverTimestamp()
  });
}

// ==========================================
// Comment load
// ==========================================
export async function loadComments(postId) {
  const snap = await getDocs(collection(db, "posts", postId, "comments"));
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

export { getUserData, getAllUsersList };
