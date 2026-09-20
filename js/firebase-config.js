// ==========================================
// Bondhu - Firebase Configuration
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// 👇 Tomar Firebase config ekhane paste koro
const firebaseConfig = {
  apiKey: "AIzaSyBZX10Lkww_AmXiuaBpy6RDl3muutMLlyc",
  authDomain: "bondhu-app-d3f6c.firebaseapp.com",
  databaseURL: "https://bondhu-app-d3f6c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bondhu-app-d3f6c",
  storageBucket: "bondhu-app-d3f6c.firebasestorage.app",
  messagingSenderId: "201775182970",
  appId: "1:201775182970:web:cf5a60eb38b1f0d764b7c3"
};

// Firebase initialize
const app = initializeApp(firebaseConfig);

// Services export koro
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export default app;
