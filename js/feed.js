// ==========================================
// Bondhu - Feed (Ban-aware)
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { createNotification } from "./notifications.js";

async function ensureNotBanned() {
  const me = auth.currentUser;
  if (!me) throw new Error("লগইন করুন");
  const snap = await getDoc(doc(db, "users", me.uid));
  if (snap.exists() && snap.data().banned) {
    throw new Error("আপনার অ্যাকাউন্ট নিষিদ্ধ");
  }
  return me;
}

export async function createPost(imageUrl, caption) {
  const user = await ensureNotBanned();
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

export async function loadFeed() {
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
  const posts = [];
  snap.forEach(d => posts.push({ id: d.id, ...d.data() }));
  return posts;
}

export async function loadUserPosts(uid) {
  const snap = await getDocs(query(collection(db, "posts"), orderBy("createdAt", "desc")));
  const posts = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.userId === uid) posts.push({ id: d.id, ...data });
  });
  return posts;
}

export async function toggleLike(postId, currentLikes) {
  const user = await ensureNotBanned();
  const ref = doc(db, "posts", postId);
  const alreadyLiked = currentLikes.includes(user.uid);
  await updateDoc(ref, {
    likes: alreadyLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
  });
  if (!alreadyLiked) {
    try {
      const postSnap = await getDoc(ref);
      const postData = postSnap.data();
      if (postData && postData.userId && postData.userId !== user.uid) {
        await createNotification(postData.userId, "like", postId);
      }
    } catch (e) {}
  }
  return !alreadyLiked;
}

export async function deletePost(postId) {
  await ensureNotBanned();
  await deleteDoc(doc(db, "posts", postId));
}

export async function addComment(postId, text) {
  const user = await ensureNotBanned();
  const userSnap = await getDoc(doc(db, "users", user.uid));
  const userData = userSnap.exists() ? userSnap.data() : {};

  await addDoc(collection(db, "posts", postId, "comments"), {
    userId: user.uid,
    username: userData.username || "unknown",
    userName: userData.name || "User",
    text,
    createdAt: serverTimestamp()
  });

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const cur = postSnap.data().commentCount || 0;
    await updateDoc(postRef, { commentCount: cur + 1 });
    const postData = postSnap.data();
    if (postData.userId && postData.userId !== user.uid) {
      await createNotification(postData.userId, "comment", postId, text.slice(0, 60));
    }
  }
}

export async function loadComments(postId) {
  const snap = await getDocs(query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  ));
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

export async function searchUsers(term) {
  const t = term.toLowerCase().trim();
  if (!t) return [];
  const snap = await getDocs(collection(db, "users"));
  const arr = [];
  snap.forEach(d => {
    const u = d.data();
    if ((u.username || "").toLowerCase().includes(t) ||
        (u.name || "").toLowerCase().includes(t)) {
      const { email, ...publicData } = u;
      arr.push(publicData);
    }
  });
  return arr.slice(0, 20);
}

export async function toggleFollow(targetUid) {
  const user = await ensureNotBanned();
  if (user.uid === targetUid) throw new Error("নিজেকে অনুসরণ করা যাবে না");

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
    await createNotification(targetUid, "follow");
    return true;
  }
}
