// ==========================================
// Bondhu - Feed + Posts + Comments + Search + Follow
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { createNotification } from "./notifications.js";

// Post create
export async function createPost(imageUrl, caption) {
  const user = auth.currentUser;
  if (!user) throw new Error("Login koro age");
  const snap = await getDoc(doc(db, "users", user.uid));
  const userData = snap.exists() ? snap.data() : {};
  const ref = await addDoc(collection(db, "posts"), {
    userId: user.uid,
    username: userData.username || "unknown",
    userName: userData.name || "User",
    userPhoto: userData.photoURL || "",
    imageUrl,
    caption: caption || "",
    likes: [],
    commentCount: 0,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

// Feed load
export async function loadFeed() {
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
  const posts = [];
  snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
  return posts;
}

// User er post
export async function loadUserPosts(uid) {
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
  const posts = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.userId === uid) posts.push({ id: d.id, ...data });
  });
  return posts;
}

// Like toggle + notification
export async function toggleLike(postId, currentLikes) {
  const user = auth.currentUser;
  if (!user) throw new Error("Login koro");
  const ref = doc(db, "posts", postId);
  const alreadyLiked = currentLikes.includes(user.uid);

  await updateDoc(ref, {
    likes: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
  });

  // Notify post owner (jodi notun like hoy)
  if (!alreadyLiked) {
    try {
      const postSnap = await getDoc(ref);
      const postData = postSnap.data();
      if (postData && postData.userId && postData.userId !== user.uid) {
        await createNotification(postData.userId, "like", postId);
      }
    } catch (e) { console.warn("Like notif fail:", e); }
  }

  return !alreadyLiked;
}

// Delete post
export async function deletePost(postId) {
  await deleteDoc(doc(db, "posts", postId));
}

// Comment add + notification
export async function addComment(postId, text) {
  const user = auth.currentUser;
  if (!user) throw new Error("Login koro");
  const userSnap = await getDoc(doc(db, "users", user.uid));
  const userData = userSnap.exists() ? userSnap.data() : {};

  await addDoc(collection(db, "posts", postId, "comments"), {
    userId: user.uid,
    username: userData.username || "unknown",
    userName: userData.name || "User",
    text: text,
    createdAt: serverTimestamp()
  });

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const cur = postSnap.data().commentCount || 0;
    await updateDoc(postRef, { commentCount: cur + 1 });

    // Notify post owner
    const postData = postSnap.data();
    if (postData.userId && postData.userId !== user.uid) {
      await createNotification(postData.userId, "comment", postId, text.slice(0, 60));
    }
  }
}

// Comments load
export async function loadComments(postId) {
  const snap = await getDocs(query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  ));
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

// User search
export async function searchUsers(term) {
  const t = term.toLowerCase().trim();
  if (!t) return [];
  const snap = await getDocs(collection(db, "users"));
  const arr = [];
  snap.forEach(d => {
    const u = d.data();
    if ((u.username || "").toLowerCase().includes(t) ||
        (u.name || "").toLowerCase().includes(t)) {
      // 🔒 Email strip
      const { email, ...publicData } = u;
      arr.push(publicData);
    }
  });
  return arr.slice(0, 20);
}

// Follow toggle + notification
export async function toggleFollow(targetUid) {
  const user = auth.currentUser;
  if (!user) throw new Error("Login koro");
  if (user.uid === targetUid) throw new Error("Nijeke follow korte parba na");

  const meRef = doc(db, "users", user.uid);
  const targetRef = doc(db, "users", targetUid);
  const meSnap = await getDoc(meRef);
  const alreadyFollowing = (meSnap.data().following || []).includes(targetUid);

  if (alreadyFollowing) {
    await updateDoc(meRef, { following: arrayRemove(targetUid) });
    await updateDoc(targetRef, { followers: arrayRemove(user.uid) });
    return false;
  } else {
    await updateDoc(meRef, { following: arrayUnion(targetUid) });
    await updateDoc(targetRef, { followers: arrayUnion(user.uid) });
    // Notify
    await createNotification(targetUid, "follow");
    return true;
  }
}
