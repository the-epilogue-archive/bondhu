// ==========================================
// Bondhu - Notifications
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Notification create
// type: "like" | "comment" | "follow"
// ==========================================
export async function createNotification(toUid, type, postId = "", extra = "") {
  const me = auth.currentUser;
  if (!me || me.uid === toUid) return; // nijer ke notification na

  try {
    await addDoc(collection(db, "notifications"), {
      toUid,
      fromUid: me.uid,
      type,
      postId,
      extra,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn("Notification create fail:", e.message);
  }
}

// ==========================================
// Amar notification list
// ==========================================
export async function loadMyNotifications() {
  const me = auth.currentUser;
  if (!me) return [];

  const q = query(
    collection(db, "notifications"),
    where("toUid", "==", me.uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const snap = await getDocs(q);
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

// ==========================================
// Unread count
// ==========================================
export async function getUnreadCount() {
  const me = auth.currentUser;
  if (!me) return 0;
  const all = await loadMyNotifications();
  return all.filter(n => !n.read).length;
}

// ==========================================
// Ekta notification read mark
// ==========================================
export async function markRead(id) {
  try {
    await updateDoc(doc(db, "notifications", id), { read: true });
  } catch (e) {}
}

// ==========================================
// Sob read mark
// ==========================================
export async function markAllRead() {
  const me = auth.currentUser;
  if (!me) return;
  const all = await loadMyNotifications();
  const batch = writeBatch(db);
  all.forEach(n => {
    if (!n.read) batch.update(doc(db, "notifications", n.id), { read: true });
  });
  await batch.commit();
}

// ==========================================
// Notification delete
// ==========================================
export async function deleteNotification(id) {
  await deleteDoc(doc(db, "notifications", id));
}
