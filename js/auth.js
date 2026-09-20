// ==========================================
// Bondhu - Simple Auth (localStorage based)
// Pore Firebase Auth e upgrade kora jabe
// ==========================================

const USERS_KEY = "bondhu_users";       // sob user list
const CURRENT_KEY = "bondhu_current";   // current logged in user

// ==========================================
// Helper — sob user list
// ==========================================
function getAllUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ==========================================
// Signup
// ==========================================
export async function signup(email, password, displayName, username) {
  const users = getAllUsers();

  // Email already ache?
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Ei email diye account already ache");
  }

  // Username already ache?
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Ei username already neowa");
  }

  const user = {
    uid: "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
    email: email.toLowerCase(),
    password: password, // ⚠️ plaintext — only for local testing
    name: displayName,
    username: username.toLowerCase(),
    bio: "",
    photoURL: "",
    followers: [],
    following: [],
    createdAt: Date.now()
  };

  users.push(user);
  saveAllUsers(users);

  // Auto login
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
  return user;
}

// ==========================================
// Login
// ==========================================
export async function login(email, password) {
  const users = getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) throw new Error("Ei email diye account nei");
  if (user.password !== password) throw new Error("Password bhul");

  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
  return user;
}

// ==========================================
// Logout
// ==========================================
export async function logout() {
  localStorage.removeItem(CURRENT_KEY);
}

// ==========================================
// Current user
// ==========================================
export function getCurrentUser() {
  const data = localStorage.getItem(CURRENT_KEY);
  return data ? JSON.parse(data) : null;
}

export async function getUserData(uid) {
  const users = getAllUsers();
  return users.find(u => u.uid === uid) || null;
}

// ==========================================
// User data update koro (bio, photo etc.)
// ==========================================
export function updateUserData(uid, updates) {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.uid === uid);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveAllUsers(users);
  localStorage.setItem(CURRENT_KEY, JSON.stringify(users[idx]));
  return users[idx];
}

// ==========================================
// Page protect — login na korle login.html e
// ==========================================
export function requireAuth(callback) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
  } else {
    callback(user);
  }
}

// ==========================================
// Already logged in hole index e
// ==========================================
export function redirectIfLoggedIn(to = "index.html") {
  const user = getCurrentUser();
  if (user) window.location.href = to;
}

// ==========================================
// Sob user (search er jonno)
// ==========================================
export function getAllUsersList() {
  return getAllUsers();
}
