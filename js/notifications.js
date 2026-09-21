// ==========================================
// Bondhu - Notifications
// Index-free version (client-side filter)
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Notification create
// ==========================================
export async function createNotification(toUid, type, postId = "", extra = "") {
  const me = auth.currentUser;
  if (!me || me.uid === toUid) return;

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
// Amar notification list (index-free)
// ==========================================
export async function loadMyNotifications() {
  const me = auth.currentUser;
  if (!me) return [];

  try {
    // Sob fetch koro, client-side filter
    const snap = await getDocs(collection(db, "notifications"));
    const arr = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.toUid === me.uid) {
        arr.push({ id: d.id, ...data });
      }
    });

    // Sort: newest first
    arr.sort((a, b) => {
      const at = a.createdAt?.seconds || 0;
      const bt = b.createdAt?.seconds || 0;
      return bt - at;
    });

    return arr.slice(0, 50);
  } catch (e) {
    console.error("Notifications load fail:", e.message);
    return [];
  }
}

// ==========================================
// Unread count
// ==========================================
export async function getUnreadCount() {
  const me = auth.currentUser;
  if (!me) return 0;
  try {
    const all = await loadMyNotifications();
    return all.filter(n => !n.read).length;
  } catch (e) {
    console.warn("Unread count fail:", e.message);
    return 0;
  }
}

// ==========================================
// Mark read
// ==========================================
export async function markRead(id) {
  try {
    await updateDoc(doc(db, "notifications", id), { read: true });
  } catch (e) {}
}

// ==========================================
// Mark all read
// ==========================================
export async function markAllRead() {
  const me = auth.currentUser;
  if (!me) return;
  try {
    const all = await loadMyNotifications();
    const unread = all.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    await batch.commit();
  } catch (e) {
    console.warn("markAllRead fail:", e.message);
  }
}

// ==========================================
// Delete
// ==========================================
export async function deleteNotification(id) {
  try {
    await deleteDoc(doc(db, "notifications", id));
  } catch (e) {}
}
