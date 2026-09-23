// ==========================================
// Bondhu - Chat v3 (1-to-1 + Group)
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, doc, getDoc, setDoc, getDocs,
  query, orderBy, serverTimestamp, onSnapshot,
  updateDoc, deleteDoc, limit, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ==========================================
// 1-to-1 chat ID
// ==========================================
export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

// ==========================================
// 1-to-1 Chat create / get
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
      isGroup: false,
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
// GROUP Chat create
// ==========================================
export async function createGroupChat(name, members, photoURL = "") {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");
  if (!name.trim()) throw new Error("গ্রুপের নাম দিন");
  if (members.length < 2) throw new Error("অন্তত ২ জন সদস্য নির্বাচন করুন");

  // Ensure me is included
  const allUids = [...new Set([me.uid, ...members])];
  const memberData = {};

  // Fetch each member's data
  for (const uid of allUids) {
    if (uid === me.uid) {
      const meSnap = await getDoc(doc(db, "users", me.uid));
      const d = meSnap.exists() ? meSnap.data() : {};
      memberData[uid] = {
        name: d.name || "User",
        username: d.username || "unknown",
        photoURL: d.photoURL || ""
      };
    } else {
      const uSnap = await getDoc(doc(db, "users", uid));
      const d = uSnap.exists() ? uSnap.data() : {};
      memberData[uid] = {
        name: d.name || "User",
        username: d.username || "unknown",
        photoURL: d.photoURL || ""
      };
    }
  }

  const ref = await addDoc(collection(db, "chats"), {
    isGroup: true,
    name: name.trim(),
    photoURL: photoURL,
    members: allUids,
    admins: [me.uid],
    memberData,
    createdBy: me.uid,
    lastMessage: "",
    lastSenderId: "",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });

  return ref.id;
}

// ==========================================
// Group update (name/photo)
// ==========================================
export async function updateGroupInfo(chatId, updates) {
  await updateDoc(doc(db, "chats", chatId), updates);
}

// ==========================================
// Group — add member
// ==========================================
export async function addGroupMember(chatId, uid) {
  const uSnap = await getDoc(doc(db, "users", uid));
  const d = uSnap.exists() ? uSnap.data() : {};
  await updateDoc(doc(db, "chats", chatId), {
    members: arrayUnion(uid),
    [`memberData.${uid}`]: {
      name: d.name || "User",
      username: d.username || "unknown",
      photoURL: d.photoURL || ""
    }
  });
}

// ==========================================
// Group — remove member
// ==========================================
export async function removeGroupMember(chatId, uid) {
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const newMembers = (data.members || []).filter(u => u !== uid);
  const newAdmins = (data.admins || []).filter(u => u !== uid);
  const newMemberData = { ...(data.memberData || {}) };
  delete newMemberData[uid];

  await updateDoc(chatRef, {
    members: newMembers,
    admins: newAdmins,
    memberData: newMemberData
  });
}

// ==========================================
// Group — leave
// ==========================================
export async function leaveGroup(chatId) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");
  await removeGroupMember(chatId, me.uid);
}

// ==========================================
// Send message (text)
// ==========================================
export async function sendMessage(chatId, text, replyTo = null) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");
  if (!text.trim()) return;

  // Get my data for group display
  const meSnap = await getDoc(doc(db, "users", me.uid));
  const meData = meSnap.exists() ? meSnap.data() : {};

  const msgData = {
    from: me.uid,
    fromName: meData.name || "User",
    fromUsername: meData.username || "unknown",
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
    lastSenderName: meData.name || "User",
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

  const meSnap = await getDoc(doc(db, "users", me.uid));
  const meData = meSnap.exists() ? meSnap.data() : {};

  const audioUrl = await uploadVoiceToCloudinary(blob, onProgress);

  await addDoc(collection(db, "chats", chatId, "messages"), {
    from: me.uid,
    fromName: meData.name || "User",
    fromUsername: meData.username || "unknown",
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
    lastSenderName: meData.name || "User",
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
// Messages listen
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
// Single chat listen (for group info changes)
// ==========================================
export function listenChat(chatId, callback) {
  return onSnapshot(doc(db, "chats", chatId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
    else callback(null);
  });
}

// ==========================================
// Delete for me / Unsend
// ==========================================
export async function deleteForMe(chatId, messageId) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    deletedFor: arrayUnion(me.uid)
  });
}

export async function unsendMessage(chatId, messageId) {
  const me = auth.currentUser;
  if (!me) throw new Error("Login koro");
  const snap = await getDoc(doc(db, "chats", chatId, "messages", messageId));
  if (!snap.exists()) throw new Error("বার্তা পাওয়া যায়নি");
  if (snap.data().from !== me.uid) throw new Error("শুধু নিজের বার্তা unsend করা যায়");
  await deleteDoc(doc(db, "chats", chatId, "messages", messageId));
}

// ==========================================
// My chats list
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

// ==========================================
// Get display info for chat (1-to-1 vs group)
// ==========================================
export function getChatDisplay(chat, myUid) {
  if (chat.isGroup) {
    return {
      name: chat.name || "গ্রুপ",
      photoURL: chat.photoURL || "",
      username: "",
      isGroup: true,
      memberCount: (chat.members || []).length
    };
  }
  const otherUid = chat.members.find(u => u !== myUid);
  const other = chat.memberData?.[otherUid] || { name: "User", username: "unknown", photoURL: "" };
  return {
    name: other.name,
    photoURL: other.photoURL,
    username: other.username,
    uid: otherUid,
    isGroup: false
  };
}

// Keep old name for compatibility
export function getOtherMember(chat, myUid) {
  return getChatDisplay(chat, myUid);
}

export async function deleteChat(chatId) {
  await updateDoc(doc(db, "chats", chatId), {
    [`deleted_${auth.currentUser.uid}`]: true
  });
}
