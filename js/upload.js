// ==========================================
// Bondhu - GitHub Image Uploader
// ==========================================

const GITHUB_USERNAME = "the-epilogue-archive";
const GITHUB_REPO = "bondhu-images";

// Token localStorage theke nebo, code e nei
function getToken() {
  return localStorage.getItem("bondhu_gh_token") || "";
}

// Token set korar function (settings page e use hobe)
export function setToken(token) {
  localStorage.setItem("bondhu_gh_token", token.trim());
}

export function clearToken() {
  localStorage.removeItem("bondhu_gh_token");
}

export function hasToken() {
  return !!getToken();
}

// ==========================================
// File → base64
// ==========================================
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==========================================
// GitHub upload → jsDelivr URL
// ==========================================
export async function uploadToGitHub(file, folder = "posts") {
  const token = getToken();
  if (!token) {
    throw new Error("GitHub token set koro age (Settings page)");
  }

  if (!file) throw new Error("Kono file nei");
  if (file.size > 5 * 1024 * 1024) throw new Error("File 5MB er beshi");

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${folder}/${filename}`;

  const base64 = await fileToBase64(file);
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${path}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `upload ${filename}`,
      content: base64,
      branch: "main"
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Upload fail");
  }

  return `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@main/${path}`;
}
