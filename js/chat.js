// ==========================================
// Bondhu - Chat (1-to-1 realtime)
// Firestore realtime listener diye
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, doc, getDoc, setDoc, getDocs,
  query, orderBy, where, serverTimestamp, onSnapshot,
  updateDoc, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// Chat ID — duto uid sorted kore join
// Same chatId duijoner jonno
// ==========================================
export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// ==========================================
// Chat create ba get (jodi already thake)
// ==========================================
export async function getOrCreateChat(otherUser) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");

  const chatId = getChatId(me.uid, otherUser.uid);
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);

  // Amar user data
  const meSnap = await getDoc(doc(db, "users", me.uid));
  const meData = meSnap.exists() ? meSnap.data() : {};

  if (!snap.exists()) {
    // Notun chat create
    await setDoc(chatRef, {
      members: [me.uid, otherUser.uid],
      memberData: {
        [me.uid]: {
          name: meData.name || "User",
          username: meData.username || "unknown",
          photoURL: meData.photoURL || ""
        },
        [otherUser.uid]: {
          name: otherUser.name || "User",
          username: otherUser.username || "unknown",
          photoURL: otherUser.photoURL || ""
        }
      },
      lastMessage: "",
      lastSenderId: "",
      updatedAt: serverTimestamp()
    });
  }

  return chatId;
}

// ==========================================
// Message pathao
// ==========================================
export async function sendMessage(chatId, text) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");
  if (!text.trim()) return;

  await addDoc(collection(db, "chats", chatId, "messages"), {
    from: me.uid,
    text: text.trim(),
    createdAt: serverTimestamp()
  });

  // Chat er last message update
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: text.trim(),
    lastSenderId: me.uid,
    updatedAt: serverTimestamp()
  });
}

// ==========================================
// Messages realtime listen (onSnapshot)
// ==========================================
export function listenMessages(chatId, callback) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200)
  );

  return onSnapshot(q, (snap) => {
    const msgs = [];
    snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
    callback(msgs);
  });
}

// ==========================================
// Amar sob chat list (realtime)
// ==========================================
export function listenMyChats(callback) {
  const me = auth.currentUser;
  if (!me) return () => {};

  const q = query(
    collection(db, "chats"),
    where("members", "array-contains", me.uid),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const chats = [];
    snap.forEach(d => chats.push({ id: d.id, ...d.data() }));
    callback(chats);
  }, (err) => {
    console.error("Chat list error:", err);
    callback([]);
  });
}

// ==========================================
// Chat er onno user er data ber koro
// ==========================================
export function getOtherMember(chat, myUid) {
  const otherUid = chat.members.find(u => u !== myUid);
  return {
    uid: otherUid,
    ...(chat.memberData?.[otherUid] || { name: "User", username: "unknown" })
  };
}

// ==========================================
// Chat delete (optional — sob message soho na, sudhu chat list theke)
// ==========================================
export async function deleteChat(chatId) {
  await updateDoc(doc(db, "chats", chatId), {
    [`deleted_${auth.currentUser.uid}`]: true
  });
}
