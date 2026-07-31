/* TaskFlow client data — static config + an `api` client that talks
   to the Flask JSON layer at /api/*. */

const CATEGORIES = ["Personal", "Work", "School", "Fitness", "Urgent"];
const CATEGORY_COLORS = {
  Personal: "var(--cat-personal)",
  Work:     "var(--cat-work)",
  School:   "var(--cat-school)",
  Fitness:  "var(--cat-fitness)",
  Urgent:   "var(--cat-urgent)",
};

const PRIORITY_COLORS = {
  low:    "var(--success)",
  medium: "var(--warning)",
  high:   "var(--danger)",
};

const ACCENTS = [
  { id: "indigo",   colors: ["#4f6dd1", "#7a6cc4"] },
  { id: "violet",   colors: ["#7a6cc4", "#a26fcf"] },
  { id: "cyan",     colors: ["#3d8fa6", "#4f6dd1"] },
  { id: "sunset",   colors: ["#c98a45", "#c97075"] },
  { id: "emerald",  colors: ["#3da587", "#3d8fa6"] },
  { id: "rose",     colors: ["#c96f7e", "#b4576e"] },
];

/* ── API client ──────────────────────────────────────────────────
   Every call returns a promise that resolves to parsed JSON.
   On 401 the user is redirected to /login. */

async function request(path, opts) {
  const res = await fetch(path, Object.assign({
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    credentials: "same-origin",
  }, opts || {}));
  if (res.status === 401) {
    let body = {};
    try { body = await res.json(); } catch (_) {}
    if (body.login_url) window.location.href = body.login_url;
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch (_) {}
    throw new Error(body.error || ("http_" + res.status));
  }
  return res.json();
}

const api = {
  me:        ()           => request("/api/me"),
  dashboard: ()           => request("/api/dashboard"),
  activity:  ()           => request("/api/activity"),
  updateSettings: (patch) => request("/api/settings", { method: "PATCH", body: JSON.stringify(patch) }),
  login:    (body)        => request("/api/login",    { method: "POST", body: JSON.stringify(body) }),
  register: (body)        => request("/api/register", { method: "POST", body: JSON.stringify(body) }),
  logout:   ()            => request("/api/logout",   { method: "POST" }),
  resendVerification: ()  => request("/api/auth/resend-verify", { method: "POST" }),
  oauthProviders: ()      => request("/api/oauth/providers"),
  tasks: {
    list:   ()             => request("/api/tasks").then(r => r.tasks),
    create: (task)         => request("/api/tasks", { method: "POST", body: JSON.stringify(task) }).then(r => r.task),
    update: (id, patch)    => request("/api/tasks/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(patch) }).then(r => r.task),
    remove: (id)           => request("/api/tasks/" + encodeURIComponent(id), { method: "DELETE" }),
  },
};

/* SEED_TASKS kept as an empty array so any code that still reads it
   before the first fetch resolves doesn't crash. */
const SEED_TASKS = [];

Object.assign(window, {
  CATEGORIES, CATEGORY_COLORS, PRIORITY_COLORS,
  SEED_TASKS, ACCENTS,
  api,
});
