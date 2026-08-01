/* TaskFlow root app shell — routes between screens, owns task state,
   wires the command palette and tweaks panel. */

const SCREENS_WITH_CHROME = ["dashboard", "tasks", "today", "inbox", "all-tasks", "calendar", "settings"];
const TASK_VIEWS = {
  "tasks":      { view: "board",  title: "Board",      subtitle: "Pull tasks across columns. Press N to add." },
  "all-tasks":  { view: "all",    title: "All tasks",  subtitle: "Every task you're tracking, newest first." },
  "today":      { view: "today",  title: "Today",      subtitle: "What's due today, plus anything in progress." },
  "inbox":      { view: "inbox",  title: "Inbox",      subtitle: "Captured tasks without a category or schedule." },
};

function App() {
  const [screen, setScreen] = React.useState("landing"); // landing | onboarding | login | register | dashboard | tasks | settings
  const [tasks, setTasks] = React.useState([]);
  const [tasksLoaded, setTasksLoaded] = React.useState(false);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  // Empty until /api/me resolves — the dashboard greets "there" meanwhile.
  // A hardcoded default here greeted every new user by the wrong name.
  const [name, setName] = React.useState("");
  const [accent, setAccent] = React.useState("indigo");
  const [theme, setTheme] = React.useState("dark"); // "dark" | "light" | "system"
  const [me, setMe] = React.useState(null);
  // Display preferences. Kept in localStorage rather than the database: they
  // describe this device (screen size, motion sensitivity), and adding a
  // column would require a migration against the live database.
  const [compact, setCompact] = React.useState(() => localStorage.getItem("tf-compact") === "1");
  const [reduceMotion, setReduceMotion] = React.useState(() => localStorage.getItem("tf-reduce-motion") === "1");

  // apply theme to body so CSS variables can switch
  React.useEffect(() => {
    const resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : theme;
    document.body.setAttribute("data-theme", resolved);
  }, [theme]);

  React.useEffect(() => {
    document.body.setAttribute("data-compact", compact ? "true" : "false");
    localStorage.setItem("tf-compact", compact ? "1" : "0");
  }, [compact]);

  React.useEffect(() => {
    document.body.setAttribute("data-reduce-motion", reduceMotion ? "true" : "false");
    localStorage.setItem("tf-reduce-motion", reduceMotion ? "1" : "0");
  }, [reduceMotion]);

  // global ⌘⇧L: toggle theme
  React.useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setTheme(t => t === "light" ? "dark" : "light");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // On mount: load the current user (if signed in) and their tasks.
  // Anonymous users see the landing/onboarding/login screens of the
  // prototype itself — no protected calls are fired for them.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await window.api.me();
        if (cancelled) return;
        setMe(profile);
        if (!profile.authenticated) return;
        // Fall back to the username so the greeting is still personal for
        // accounts that never set a display name.
        setName((profile.display_name || profile.username || "").split(" ")[0]);
        if (profile.accent) setAccent(profile.accent);
        if (profile.theme) setTheme(profile.theme);
        // Authenticated users never want the marketing landing — drop them
        // straight into the app. This is what fires after login/register
        // (which reload the page).
        setScreen(curr => curr === "landing" || curr === "login" || curr === "register" ? "dashboard" : curr);
        const list = await window.api.tasks.list();
        if (cancelled) return;
        setTasks(list);
      } catch (_) {
        /* network error — leave defaults in place */
      } finally {
        if (!cancelled) setTasksLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // tweaks
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "bg": "mesh",
    "motion": "full"
  }/*EDITMODE-END*/;
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  // apply motion intensity to CSS var
  React.useEffect(() => {
    const scale = tweaks.motion === "off" ? 0 : tweaks.motion === "subtle" ? 0.5 : 1;
    document.documentElement.style.setProperty("--motion-scale", String(scale));
  }, [tweaks.motion]);

  // apply accent: change the gradient CSS variables
  React.useEffect(() => {
    const a = window.ACCENTS.find(x => x.id === accent) || window.ACCENTS[0];
    const root = document.documentElement.style;
    root.setProperty("--acc-1", a.colors[0]);
    root.setProperty("--acc-2", a.colors[1]);
    root.setProperty("--grad-accent", `linear-gradient(135deg, ${a.colors[0]} 0%, ${a.colors[1]} 100%)`);
    root.setProperty("--grad-accent-soft", `linear-gradient(135deg, ${a.colors[0]}33, ${a.colors[1]}33)`);
  }, [accent]);

  // Global shortcuts. Single keys rather than "G then D" chords — easier to
  // remember and to implement correctly. Plain letters only fire inside the
  // app chrome, and never while typing in a field.
  React.useEffect(() => {
    function onKey(e) {
      const key = e.key.toLowerCase();
      const mod = e.metaKey || e.ctrlKey;

      if (mod && key === "k") {
        e.preventDefault();
        setCmdOpen(o => !o);
        return;
      }
      if (e.key === "Escape") { setCmdOpen(false); return; }

      // Everything below is unmodified typing-adjacent input.
      if (mod || e.altKey || cmdOpen) return;
      if (!SCREENS_WITH_CHROME.includes(screen)) return;
      if (isTypingTarget(e.target)) return;
      // A dialog is open (task editor, confirm) — navigating away from it
      // would silently discard whatever the user was doing.
      if (document.querySelector(".tf-cmd-backdrop")) return;

      if (key === "/") {
        // The search control opens the palette, so "/" does too.
        e.preventDefault();
        setCmdOpen(true);
      } else if (key === "n") {
        // Works from any app screen, not just the board.
        e.preventDefault();
        if (screen === "tasks") {
          window.dispatchEvent(new CustomEvent("tf-new-task"));
        } else {
          go("tasks");
          setTimeout(() => window.dispatchEvent(new CustomEvent("tf-new-task")), 250);
        }
      } else if (key === "d") {
        e.preventDefault(); go("dashboard");
      } else if (key === "t") {
        e.preventDefault(); go("tasks");
      } else if (key === "c") {
        e.preventDefault(); go("calendar");
      } else if (key === "s") {
        e.preventDefault(); go("settings");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cmdOpen, screen]);

  function go(target) {
    setScreen(target);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // make screen label live for review
  React.useEffect(() => {
    document.body.setAttribute("data-screen-label", screen);
  }, [screen]);

  const hasChrome = SCREENS_WITH_CHROME.includes(screen);

  return (
    <>
      <AnimatedBackground kind={tweaks.bg} />
      {(screen === "landing" || screen === "onboarding") && tweaks.motion !== "off" && !reduceMotion && (
        <CursorGlow enabled />
      )}

      {hasChrome ? (
        <div className="tf-app">
          <Sidebar screen={screen} go={go} openCmd={() => setCmdOpen(true)} me={me} name={name} />
          <main className="tf-main">
            {screen === "dashboard" && <Dashboard go={go} tasks={tasks} name={name} openCmd={() => setCmdOpen(true)} />}
            {(screen === "tasks" || screen === "all-tasks" || screen === "today" || screen === "inbox") &&
              <Tasks tasks={tasks} setTasks={setTasks} view={TASK_VIEWS[screen]} openCmd={() => setCmdOpen(true)} />}
            {screen === "calendar" && <Calendar tasks={tasks} go={go} />}
            {screen === "settings" && <Settings accent={accent} setAccent={setAccent} name={name} setName={setName} theme={theme} setTheme={setTheme}
              me={me} compact={compact} setCompact={setCompact} reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} />}
          </main>
        </div>
      ) : (
        <>
          {screen === "landing"     && <Landing     go={go} />}
          {screen === "onboarding"  && <Onboarding  go={go} />}
          {screen === "login"       && <Login       go={go} />}
          {screen === "register"    && <Register    go={go} />}
        </>
      )}

      {cmdOpen && (
        <CommandPalette
          go={(s) => { setCmdOpen(false); go(s); }}
          close={() => setCmdOpen(false)}
          tasks={tasks}
        />
      )}

      {/* Tweaks */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Background">
            <window.TweakRadio
              label="Style"
              value={tweaks.bg}
              options={[
                { value: "mesh", label: "Mesh" },
                { value: "aurora", label: "Aurora" },
                { value: "starfield", label: "Stars" },
                { value: "solid", label: "Solid" },
              ]}
              onChange={(v) => setTweak("bg", v)}
            />
          </window.TweakSection>
          <window.TweakSection title="Motion">
            <window.TweakRadio
              label="Intensity"
              value={tweaks.motion}
              options={[
                { value: "full", label: "Full" },
                { value: "subtle", label: "Subtle" },
                { value: "off", label: "Off" },
              ]}
              onChange={(v) => setTweak("motion", v)}
            />
          </window.TweakSection>
          <window.TweakSection title="Jump to">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {["landing", "onboarding", "login", "register", "dashboard", "tasks", "settings"].map(s => (
                <button
                  key={s}
                  onClick={() => go(s)}
                  style={{
                    padding: "6px 10px", fontSize: 11, borderRadius: 6,
                    background: screen === s ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
                    border: "1px solid var(--line-2)",
                    color: screen === s ? "white" : "var(--fg-2)",
                    textTransform: "capitalize",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

function isTypingTarget(el) {
  if (!el) return false;
  const tag = (el.tagName || "").toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/* Sidebar — left rail of the app chrome */
function Sidebar({ screen, go, openCmd, me, name }) {
  // Real account details rather than placeholder text. Falls back gracefully
  // while /api/me is still in flight.
  const label = me?.display_name || name || me?.username || "Your account";
  const initials = (label.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2) || "?").toUpperCase();

  const groups = [
    {
      label: "Workspace",
      items: [
        { id: "dashboard",  label: "Dashboard", icon: "dashboard", kbd: "D" },
        { id: "tasks",      label: "Board",     icon: "layers",    kbd: "T" },
        { id: "all-tasks",  label: "All tasks", icon: "list" },
        { id: "calendar",   label: "Calendar",  icon: "calendar" },
      ],
    },
    {
      label: "Personal",
      items: [
        { id: "today", label: "Today",  icon: "clock" },
        { id: "inbox", label: "Inbox",  icon: "circleCheck" },
      ],
    },
  ];

  return (
    <aside className="tf-side">
      <div className="tf-side__brand">
        <Logo size={24} textSize={15} />
        <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--font-mono)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--line-2)", color: "var(--fg-4)" }}>v3.0</span>
      </div>

      <button
        className="tf-cta"
        onClick={openCmd}
        style={{ width: "100%", justifyContent: "center", padding: "9px 14px", fontSize: 13, marginBottom: 12 }}
      >
        <Icon name="plus" size={13} />
        Quick add
        <kbd style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, padding: "1px 5px", borderRadius: 3, background: "rgba(0,0,0,0.25)", color: "white" }}>⌘ K</kbd>
      </button>

      {groups.map((g, gi) => (
        <React.Fragment key={gi}>
          <div className="tf-side__group">{g.label}</div>
          {g.items.map((it, ii) => {
            const active = screen === it.id;
            return (
              <button
                key={`${gi}-${ii}`}
                className={`tf-side__item ${active ? "is-active" : ""}`}
                onClick={() => go(it.id)}
              >
                <Icon name={it.icon} size={14} />
                {it.label}
                {it.kbd && <span className="tf-side__kbd">{it.kbd}</span>}
              </button>
            );
          })}
        </React.Fragment>
      ))}

      <div style={{ flex: 1 }} />

      <div className="tf-side__group" style={{ marginTop: 0 }}>Account</div>
      <button
        className={`tf-side__item ${screen === "settings" ? "is-active" : ""}`}
        onClick={() => go("settings")}
      >
        <Icon name="cog" size={14} />
        Settings
      </button>
      <button className="tf-side__item" onClick={async () => {
        try { await window.api.logout(); } catch (_) {}
        // "/" re-enters the app at the landing page. A full reload (rather
        // than go("landing")) also clears the signed-in task state.
        window.location.href = "/";
      }}>
        <Icon name="arrowRight" size={14} style={{ transform: "rotate(180deg)" }} />
        Sign out
      </button>

      {/* mini profile */}
      <div style={{
        marginTop: 10,
        padding: 10,
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--line-1)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div className="tf-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
          <div style={{ fontSize: 10, color: "var(--fg-4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {me?.email || ""}
          </div>
        </div>
      </div>
    </aside>
  );
}

/* Command palette */
function CommandPalette({ go, close, tasks }) {
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const baseCommands = [
    { id: "go-dashboard", label: "Go to dashboard", icon: "dashboard", kbd: "D", run: () => go("dashboard") },
    { id: "go-tasks",     label: "Go to board",     icon: "layers",    kbd: "T", run: () => go("tasks") },
    { id: "go-calendar",  label: "Go to calendar",  icon: "calendar",  kbd: "C", run: () => go("calendar") },
    { id: "go-settings",  label: "Go to settings",  icon: "cog",       kbd: "S", run: () => go("settings") },
    { id: "new-task",     label: "Create new task", icon: "plus",      kbd: "N",   run: () => { go("tasks"); setTimeout(() => window.dispatchEvent(new CustomEvent("tf-new-task")), 250); } },
    { id: "go-landing",   label: "Open landing page", icon: "arrowRight", run: () => go("landing") },
    { id: "sign-out",     label: "Sign out",        icon: "user",      run: async () => {
      // Previously this only navigated, leaving the session signed in.
      try { await window.api.logout(); } catch (_) {}
      window.location.href = "/";
    } },
  ];

  const taskMatches = q.trim()
    ? tasks.filter(t => t.content.toLowerCase().includes(q.toLowerCase())).slice(0, 5).map(t => ({
        id: "task-" + t.id, label: t.content, icon: "circleCheck", run: () => go("tasks"),
        meta: t.category,
      }))
    : [];

  const cmdMatches = q.trim()
    ? baseCommands.filter(c => c.label.toLowerCase().includes(q.toLowerCase()))
    : baseCommands;

  const items = [...cmdMatches, ...taskMatches];

  React.useEffect(() => { setSelected(0); }, [q]);

  function onKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); items[selected]?.run(); }
  }

  return (
    <div className="tf-cmd-backdrop" onClick={close}>
      <div className="tf-cmd" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 22px", borderBottom: "1px solid var(--line-1)" }}>
          <Icon name="search" size={16} style={{ color: "var(--fg-3)" }} />
          <input
            ref={inputRef}
            className="tf-cmd__input"
            placeholder="Search tasks or run a command…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            style={{ padding: "18px 0" }}
          />
          <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "2px 6px", borderRadius: 4, border: "1px solid var(--line-2)", color: "var(--fg-3)" }}>Esc</kbd>
        </div>
        <div className="tf-cmd__list">
          {items.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--fg-4)", fontSize: 13 }}>
              No matches for "{q}"
            </div>
          )}
          {items.map((it, i) => (
            <div
              key={it.id}
              className={`tf-cmd__item ${selected === i ? "is-active" : ""}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => it.run()}
            >
              <Icon name={it.icon} size={14} />
              <span>{it.label}</span>
              {it.meta && <span style={{ fontSize: 11, color: "var(--fg-4)", marginLeft: 8 }}>{it.meta}</span>}
              {it.kbd && <span className="kbd">{it.kbd}</span>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 22px", borderTop: "1px solid var(--line-1)", fontSize: 11, color: "var(--fg-4)", background: "rgba(0,0,0,0.2)" }}>
          <span>Type to search, ↵ to select</span>
          <span>{items.length} result{items.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { App, Sidebar, CommandPalette });
