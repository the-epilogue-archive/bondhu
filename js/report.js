// ==========================================
// Bondhu - Report System
// ==========================================

import { db, auth } from "./firebase-config.js";
import {
  collection, addDoc, doc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Report reasons per type
export const REPORT_REASONS = {
  post: [
    { id: "spam",          label: "স্প্যাম বা অনাকাঙ্ক্ষিত" },
    { id: "inappropriate", label: "অনুপযুক্ত কনটেন্ট" },
    { id: "harassment",    label: "হয়রানি বা বুলিং" },
    { id: "false",         label: "মিথ্যা তথ্য" },
    { id: "copyright",     label: "কপিরাইট লঙ্ঘন" },
    { id: "other",         label: "অন্যান্য" }
  ],
  user: [
    { id: "fake",           label: "ভুয়া অ্যাকাউন্ট" },
    { id: "harassment",     label: "হয়রানি" },
    { id: "spam",           label: "স্প্যাম" },
    { id: "impersonation",  label: "অন্যের পরিচয় ব্যবহার" },
    { id: "other",          label: "অন্যান্য" }
  ],
  reel: [
    { id: "inappropriate", label: "অনুপযুক্ত কনটেন্ট" },
    { id: "spam",          label: "স্প্যাম" },
    { id: "harassment",    label: "হয়রানি" },
    { id: "copyright",     label: "কপিরাইট লঙ্ঘন" },
    { id: "other",         label: "অন্যান্য" }
  ]
};

// Submit report
export async function submitReport({ targetType, targetId, targetUsername = "", reason, extraNote = "" }) {
  const me = auth.currentUser;
  if (!me) throw new Error("লগইন করুন");

  const meSnap = await getDoc(doc(db, "users", me.uid));
  const meData = meSnap.exists() ? meSnap.data() : {};

  await addDoc(collection(db, "reports"), {
    reporterUid: me.uid,
    reporterUsername: meData.username || "unknown",
    targetType,
    targetId,
    targetUsername,
    reason,
    extraNote: extraNote.slice(0, 300),
    status: "pending",
    createdAt: serverTimestamp()
  });
}

// ==========================================
// Report modal renderer
// ==========================================
export function openReportModal({ targetType, targetId, targetUsername = "" }, onSuccess) {
  const modal = document.createElement("div");
  modal.className = "report-modal";
  modal.innerHTML = `
    <div class="report-box">
      <div class="report-header">
        <div class="report-title">রিপোর্ট করুন</div>
        <button class="report-close" aria-label="Close">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="report-sub">কেন এই কনটেন্ট রিপোর্ট করছেন?</div>
      <div class="report-reasons"></div>
      <div class="report-note-wrap" style="display:none">
        <textarea class="report-note" placeholder="বিস্তারিত লিখুন (ঐচ্ছিক)" maxlength="300"></textarea>
      </div>
      <div class="report-actions">
        <button class="report-btn-cancel">বাতিল</button>
        <button class="report-btn-submit" disabled>জমা দিন</button>
      </div>
    </div>
  `;

  const reasons = REPORT_REASONS[targetType] || REPORT_REASONS.post;
  const reasonsEl = modal.querySelector(".report-reasons");
  reasonsEl.innerHTML = reasons.map(r => `
    <label class="report-reason">
      <input type="radio" name="report-reason" value="${r.id}">
      <span>${r.label}</span>
    </label>
  `).join("");

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("show"));

  const submitBtn = modal.querySelector(".report-btn-submit");
  const noteWrap = modal.querySelector(".report-note-wrap");
  const noteEl = modal.querySelector(".report-note");

  reasonsEl.addEventListener("change", (e) => {
    const val = e.target.value;
    submitBtn.disabled = !val;
    if (val === "other") noteWrap.style.display = "block";
    else noteWrap.style.display = "none";
  });

  const close = () => {
    modal.classList.remove("show");
    setTimeout(() => modal.remove(), 250);
  };

  modal.querySelector(".report-close").addEventListener("click", close);
  modal.querySelector(".report-btn-cancel").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  submitBtn.addEventListener("click", async () => {
    const selected = reasonsEl.querySelector('input[name="report-reason"]:checked');
    if (!selected) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "পাঠানো হচ্ছে...";
    try {
      await submitReport({
        targetType,
        targetId,
        targetUsername,
        reason: selected.value,
        extraNote: noteEl.value.trim()
      });
      close();
      if (onSuccess) onSuccess();
    } catch (e) {
      submitBtn.disabled = false;
      submitBtn.textContent = "জমা দিন";
      alert("রিপোর্ট পাঠানো যায়নি: " + e.message);
    }
  });
}
