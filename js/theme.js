// ==========================================
// Bondhu - Theme Toggle (Light / Dark)
// ==========================================

(function() {
  // Prottek page load e theme apply koro (age thekei, jate flash na hoy)
  const KEY = "bondhu_theme";
  const saved = localStorage.getItem(KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
})();

// Toggle function
window.toggleBondhuTheme = function() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("bondhu_theme", next);
};

// System change listen (jodi user manually set na kore)
if (!localStorage.getItem("bondhu_theme")) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
  });
}
