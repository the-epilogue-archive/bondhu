// ==========================================
// Bondhu - Reels (Video)
// Cloudinary te video upload hoy
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { createNotification } from "./notifications.js";

// 👇 Ei 2 ta tomar Cloudinary theke boshaw
const CLOUDINARY_CLOUD_NAME = "kmquukhi";
const CLOUDINARY_UPLOAD_PRESET = "bondhu_reels";

// ==========================================
// Video upload Cloudinary te
// ==========================================
export async function uploadVideoToCloudinary(file, onProgress) {
  if (!file) throw new Error("Kono file nei");
  // Max 50 MB
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("Video 50MB er beshi, chhoto koro");
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

  // Progress tracking er jonno XHR use koro
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch (e) {
          reject(new Error("Response parse fail"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || "Upload fail"));
        } catch (e) {
          reject(new Error("Upload fail (status " + xhr.status + ")"));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "bondhu/reels");

    xhr.send(formData);
  });
}

// ==========================================
// Reel create (Firestore e save)
// ==========================================
export async function createReel(videoUrl, caption) {
  const user = auth.currentUser;
  if (!user) throw new Error("Login koro");

  const snap = await getDoc(doc(db, "users", user.uid));
  const userData = snap.exists() ? snap.data() : {};

  const ref = await addDoc(collection(db, "reels"), {
    userId: user.uid,
    username: userData.username || "unknown",
    userName: userData.name || "User",
    userPhoto: userData.photoURL || "",
    videoUrl,
    caption: caption || "",
    likes: [],
    commentCount: 0,
    createdAt: serverTimestamp()
  });

  return ref.id;
}

// ==========================================
// Sob reel load
// ==========================================
export async function loadReels() {
  const snap = await getDocs(query(collection(db, "reels"), orderBy("createdAt", "desc")));
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  return arr;
}

// ==========================================
// Reel like toggle + notification
// ==========================================
export async function toggleReelLike(reelId, currentLikes) {
  const user = auth.currentUser;
  if (!user) throw new Error("Login koro");
  const ref = doc(db, "reels", reelId);
  const already = currentLikes.includes(user.uid);

  await updateDoc(ref, {
    likes: already ? arrayRemove(user.uid) : arrayUnion(user.uid)
  });

  if (!already) {
    try {
      const snap = await getDoc(ref);
      const data = snap.data();
      if (data?.userId && data.userId !== user.uid) {
        await createNotification(data.userId, "like", reelId, "reel");
      }
    } catch (e) { console.warn(e); }
  }

  return !already;
}

// ==========================================
// Reel delete
// ==========================================
export async function deleteReel(reelId) {
  await deleteDoc(doc(db, "reels", reelId));
}
