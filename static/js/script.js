/* TaskFlow client — theme, sidebar, toasts, delete modal, micro-animations.
   No build step; plain ES6 module-less script. */

// ── Theme: apply on load, react to system changes when "system" is selected.
(function applyTheme() {
  const html = document.documentElement;
  const theme = html.getAttribute("data-theme") || "system";
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  function update() {
    const dark = theme === "dark" || (theme === "system" && mql.matches);
    html.classList.toggle("dark", dark);
  }
  update();
  if (theme === "system") mql.addEventListener("change", update);
})();

document.addEventListener("DOMContentLoaded", () => {
  initSidebar();
  initToasts();
  initFlashAsToasts();
  initDeleteModal();
  initTaskRowAnimations();
  initFilterAutoSubmit();
});

/* ── Mobile sidebar drawer ─────────────────────────────────────── */
function initSidebar() {
  const sidebar  = document.getElementById("sidebar");
  const openBtn  = document.getElementById("sidebar-open");
  const closeBtn = document.getElementById("sidebar-close");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (!sidebar) return;

  const open = () => {
    sidebar.classList.remove("-translate-x-full");
    backdrop && backdrop.classList.remove("hidden");
  };
  const close = () => {
    sidebar.classList.add("-translate-x-full");
    backdrop && backdrop.classList.add("hidden");
  };
  openBtn  && openBtn.addEventListener("click", open);
  closeBtn && closeBtn.addEventListener("click", close);
  backdrop && backdrop.addEventListener("click", close);
}

/* ── Toast stack ───────────────────────────────────────────────── */
function ensureToastStack() {
  let stack = document.getElementById("toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = "info", timeout = 3500) {
  const stack = ensureToastStack();
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  const iconChar = type === "success" ? "✓" : type === "error" ? "!" : "i";
  el.innerHTML = `<span class="toast-icon">${iconChar}</span><div>${message}</div>`;
  stack.appendChild(el);

  const remove = () => {
    el.classList.add("leaving");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  };
  setTimeout(remove, timeout);
  el.addEventListener("click", remove);
}

// Expose for inline calls if ever needed.
window.taskflowToast = showToast;

function initToasts() { ensureToastStack(); }

/* Convert server-rendered flash messages into toasts. */
function initFlashAsToasts() {
  const flashes = document.querySelectorAll("[data-flash]");
  flashes.forEach((el) => {
    const type = el.dataset.flashType || "info";
    const msg = el.textContent.trim();
    if (msg) showToast(msg, type);
    el.remove();
  });
}

/* ── Delete confirmation modal ─────────────────────────────────── */
function initDeleteModal() {
  // Any form with [data-confirm] triggers a custom modal instead of confirm().
  document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (form.dataset.confirmed === "1") return; // user already confirmed
      e.preventDefault();
      const msg = form.dataset.confirm || "Are you sure?";
      openConfirm(msg, () => {
        form.dataset.confirmed = "1";
        // Slide the row out before submit if it's a task row delete.
        const row = form.closest(".task-row");
        if (row) {
          row.classList.add("leaving");
          row.addEventListener("animationend", () => form.submit(), { once: true });
        } else {
          form.submit();
        }
      });
    });
  });
}

function openConfirm(message, onConfirm) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <h2 class="text-base font-semibold">Confirm</h2>
      <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">${message}</p>
      <div class="mt-5 flex items-center justify-end gap-2">
        <button type="button" data-cancel
                class="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          Cancel
        </button>
        <button type="button" data-ok
                class="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700">
          Delete
        </button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("[data-cancel]").addEventListener("click", close);
  backdrop.querySelector("[data-ok]").addEventListener("click", () => { close(); onConfirm(); });
  document.addEventListener("keydown", function esc(e) {
    if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
  });
}

/* ── Task row micro-animations ─────────────────────────────────── */
function initTaskRowAnimations() {
  // When user toggles a task complete via the checkbox form, briefly flash
  // the row before navigation completes. The form submits normally; the
  // animation runs in the small window before the new page paints.
  document.querySelectorAll(".task-row form[data-toggle]").forEach((form) => {
    form.addEventListener("submit", () => {
      const row = form.closest(".task-row");
      if (row) row.classList.add("just-completed");
    });
  });
}

/* ── Auto-submit filter form when select/search changes ────────── */
function initFilterAutoSubmit() {
  const form = document.querySelector("form[data-filter]");
  if (!form) return;
  form.querySelectorAll("select").forEach((s) => {
    s.addEventListener("change", () => form.submit());
  });
}
