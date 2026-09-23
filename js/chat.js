// ==========================================
// Bondhu - Chat v2
// Delete for me + Unsend + Polish
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, doc, getDoc, setDoc, getDocs,
  query, orderBy, serverTimestamp, onSnapshot,
  updateDoc, deleteDoc, limit, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// ==========================================
// Chat create / get
// ==========================================
export async function getOrCreateChat(otherUser) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");

  const chatId = getChatId(me.uid, otherUser.uid);
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);

  const meSnap = await getDoc(doc(db, "users", me.uid));
  const meData = meSnap.exists() ? meSnap.data() : {};

  if (!snap.exists()) {
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
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
  }

  return chatId;
}

// ==========================================
// Text message
// ==========================================
export async function sendMessage(chatId, text, replyTo = null) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");
  if (!text.trim()) return;

  const msgData = {
    from: me.uid,
    text: text.trim(),
    type: "text",
    deletedFor: [],
    createdAt: serverTimestamp()
  };

  if (replyTo) {
    msgData.replyTo = {
      id: replyTo.id,
      text: replyTo.text,
      from: replyTo.from,
      username: replyTo.username || "?"
    };
  }

  await addDoc(collection(db, "chats", chatId, "messages"), msgData);

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: text.trim(),
    lastMessageType: "text",
    lastSenderId: me.uid,
    updatedAt: serverTimestamp()
  });
}

// ==========================================
// Voice message
// ==========================================
const CLOUDINARY_CLOUD_NAME = "kmquukhi";
const CLOUDINARY_VOICE_PRESET = "bondhu_reels";

export async function sendVoiceMessage(chatId, blob, durationSec, onProgress) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");

  const audioUrl = await uploadVoiceToCloudinary(blob, onProgress);

  await addDoc(collection(db, "chats", chatId, "messages"), {
    from: me.uid,
    type: "voice",
    audioUrl: audioUrl,
    duration: Math.round(durationSec || 0),
    deletedFor: [],
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: "🎤 ভয়েস বার্তা",
    lastMessageType: "voice",
    lastSenderId: me.uid,
    updatedAt: serverTimestamp()
  });

  return audioUrl;
}

function uploadVoiceToCloudinary(blob, onProgress) {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch (err) { reject(new Error("Response parse fail")); }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || "Voice upload fail"));
        } catch (err) { reject(new Error("Upload fail (" + xhr.status + ")")); }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", CLOUDINARY_VOICE_PRESET);
    formData.append("folder", "bondhu/voice");

    xhr.send(formData);
  });
}

// ==========================================
// Messages listen — deletedFor filter
// ==========================================
export function listenMessages(chatId, callback) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    const me = auth.currentUser;
    const msgs = [];
    snap.forEach(d => {
      const data = d.data();
      // Filter: jodi current user er jonno delete kora hoy
      if (Array.isArray(data.deletedFor) && me && data.deletedFor.includes(me.uid)) {
        return;
      }
      msgs.push({ id: d.id, ...data });
    });
    callback(msgs);
  }, (err) => {
    console.error("Messages listen error:", err);
    callback([]);
  });
}

// ==========================================
// Delete for me (current user er jonno hide)
// ==========================================
export async function deleteForMe(chatId, messageId) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");
  try {
    await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
      deletedFor: arrayUnion(me.uid)
    });
  } catch (e) {
    console.error("deleteForMe fail:", e.message);
    throw new Error("মুছে ফেলা যায়নি: " + e.message);
  }
}

// ==========================================
// Unsend — sob theke muche felo (only own)
// ==========================================
export async function unsendMessage(chatId, messageId) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");
  try {
    // Verify owner
    const snap = await getDoc(doc(db, "chats", chatId, "messages", messageId));
    if (!snap.exists()) throw new Error("বার্তা পাওয়া যায়নি");
    if (snap.data().from !== me.uid) throw new Error("শুধু নিজের বার্তা unsend করা যায়");
    await deleteDoc(doc(db, "chats", chatId, "messages", messageId));
  } catch (e) {
    console.error("unsend fail:", e.message);
    throw new Error(e.message);
  }
}

// ==========================================
// My chats
// ==========================================
export function listenMyChats(uid, callback) {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, "chats"));
  return onSnapshot(q, (snap) => {
    const chats = [];
    snap.forEach(d => {
      const data = d.data();
      if (Array.isArray(data.members) && data.members.includes(uid)) {
        chats.push({ id: d.id, ...data });
      }
    });
    chats.sort((a, b) => {
      const at = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const bt = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return bt - at;
    });
    callback(chats);
  }, (err) => {
    console.error("Chat list error:", err);
    callback([]);
  });
}

export function getOtherMember(chat, myUid) {
  const otherUid = chat.members.find(u => u !== myUid);
  return {
    uid: otherUid,
    ...(chat.memberData?.[otherUid] || { name: "User", username: "unknown", photoURL: "" })
  };
}

export async function deleteChat(chatId) {
  await updateDoc(doc(db, "chats", chatId), {
    [`deleted_${auth.currentUser.uid}`]: true
  });
}
