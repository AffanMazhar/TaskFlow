/* TaskFlow settings — profile, theme, accent, density, notifications. */

function Settings({ accent, setAccent, name, setName, theme, setTheme }) {
  const [compact, setCompact] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [quietHours, setQuietHours] = React.useState(true);
  const [emailDigest, setEmailDigest] = React.useState(false);
  const [defaultView, setDefaultView] = React.useState("dashboard");
  const [savedAt, setSavedAt] = React.useState(null);

  // Persist accent / theme / display_name to the server when they change
  const firstRun = React.useRef(true);
  React.useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const id = setTimeout(() => {
      window.api.updateSettings({ accent, theme, display_name: name })
        .then(() => setSavedAt(Date.now()))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(id);
  }, [accent, theme, name]);

  return (
    <div className="tf-screen-enter">
      <div className="tf-topbar">
        <div className="tf-topbar__title">
          <h1>Settings</h1>
          <p>Tune your workspace. Saved automatically.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
        {/* settings nav */}
        <nav style={{ position: "sticky", top: 20, alignSelf: "start", display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { id: "profile",   label: "Profile",       icon: "user" },
            { id: "appearance", label: "Appearance",   icon: "sparkles" },
            { id: "workflow",  label: "Workflow",      icon: "layers" },
            { id: "notifications", label: "Notifications", icon: "bell" },
            { id: "shortcuts", label: "Shortcuts",     icon: "command" },
            { id: "danger",    label: "Danger zone",   icon: "trash" },
          ].map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                color: i === 0 ? "var(--fg-1)" : "var(--fg-3)",
                background: i === 0 ? "rgba(255,255,255,0.05)" : "transparent",
                fontWeight: 500,
                transition: "background .15s, color .15s",
              }}
            >
              <Icon name={s.icon} size={14} />
              {s.label}
            </a>
          ))}
        </nav>

        <div className="tf-stagger" style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          {/* profile */}
          <SpotlightCard id="profile" className="tf-glass tf-set-card">
            <SectionTitle title="Profile" sub="Your name as it appears across TaskFlow." />
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
              <div className="tf-avatar" style={{ width: 64, height: 64, fontSize: 22, boxShadow: "0 0 0 4px var(--bg-app), 0 0 0 5px rgba(139,92,246,0.4), 0 0 30px rgba(139,92,246,0.3)" }}>
                {(name || "Tessa").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <MagneticButton className="tf-ghost" strength={0.25} style={{ padding: "8px 14px", fontSize: 12 }}>
                  Upload photo
                </MagneticButton>
                <p style={{ fontSize: 11, color: "var(--fg-4)", margin: "8px 0 0" }}>PNG or JPG, up to 2MB.</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label className="tf-label">Display name</label>
                <input className="tf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tessa" />
              </div>
              <div>
                <label className="tf-label">Email</label>
                <input className="tf-input" defaultValue="tessa@workmail.com" />
              </div>
            </div>
          </SpotlightCard>

          {/* appearance */}
          <SpotlightCard id="appearance" className="tf-glass tf-set-card">
            <SectionTitle title="Appearance" sub="Choose how TaskFlow looks. Live preview below." />

            <div style={{ marginBottom: 24 }}>
              <label className="tf-label">Accent</label>
              <div className="tf-swatch-row">
                {window.ACCENTS.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setAccent(a.id)}
                    aria-label={a.id}
                    className={`tf-swatch ${accent === a.id ? "is-on" : ""}`}
                    style={{ background: `linear-gradient(135deg, ${a.colors[0]}, ${a.colors[1]})` }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="tf-label">Theme</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { id: "dark",  label: "Dark",  icon: "moon" },
                  { id: "light", label: "Light", icon: "sun" },
                  { id: "system", label: "System", icon: "cog" },
                ].map(t => {
                  const on = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: `1px solid ${on ? "rgba(139,92,246,0.5)" : "var(--line-2)"}`,
                        background: on ? "linear-gradient(135deg, rgba(139,92,246,0.10), rgba(59,130,246,0.06))" : "rgba(255,255,255,0.02)",
                        color: "var(--fg-1)",
                        textAlign: "left",
                        display: "flex", alignItems: "center", gap: 10,
                        transition: "all .15s",
                      }}
                    >
                      <Icon name={t.icon} size={16} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: "var(--fg-4)", margin: "10px 0 0" }}>
                {savedAt ? "Saved." : "Use ⌘⇧L to toggle from anywhere."}
              </p>
            </div>

            <Toggle
              label="Compact mode"
              hint="Tighter spacing across boards and lists."
              on={compact} onChange={setCompact}
            />
            <Toggle
              label="Reduce motion"
              hint="Disable parallax, hover physics, and bar/ring animations."
              on={reduceMotion} onChange={setReduceMotion}
            />
          </SpotlightCard>

          {/* workflow */}
          <SpotlightCard id="workflow" className="tf-glass tf-set-card">
            <SectionTitle title="Workflow" sub="Default view, week start, and shortcuts." />
            <div>
              <label className="tf-label">Open to</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[
                  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
                  { id: "tasks",     label: "Board",     icon: "layers" },
                  { id: "calendar",  label: "Calendar",  icon: "calendar" },
                ].map(v => {
                  const on = defaultView === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setDefaultView(v.id)}
                      style={{
                        padding: 12, borderRadius: 10,
                        border: `1px solid ${on ? "rgba(139,92,246,0.5)" : "var(--line-2)"}`,
                        background: on ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
                        color: "var(--fg-1)",
                        display: "inline-flex", alignItems: "center", gap: 8,
                        fontSize: 13, fontWeight: 500,
                      }}
                    >
                      <Icon name={v.icon} size={14} />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </SpotlightCard>

          {/* notifications */}
          <SpotlightCard id="notifications" className="tf-glass tf-set-card">
            <SectionTitle title="Notifications" sub="When TaskFlow can interrupt you." />
            <Toggle
              label="Quiet hours"
              hint="No alerts between 9pm – 7am."
              on={quietHours} onChange={setQuietHours}
            />
            <Toggle
              label="Daily email digest"
              hint="A morning summary, 7:30am local."
              on={emailDigest} onChange={setEmailDigest}
            />
          </SpotlightCard>

          {/* shortcuts */}
          <SpotlightCard id="shortcuts" className="tf-glass tf-set-card">
            <SectionTitle title="Shortcuts" sub="Keyboard-first navigation." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Open command palette", "⌘ K"],
                ["New task",             "N"],
                ["Go to dashboard",      "G then D"],
                ["Go to board",          "G then T"],
                ["Search",               "/"],
                ["Toggle theme",         "⌘ ⇧ L"],
              ].map(([label, keys]) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--line-1)",
                }}>
                  <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{label}</span>
                  <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", padding: "3px 8px", borderRadius: 4, border: "1px solid var(--line-2)", background: "rgba(255,255,255,0.04)" }}>{keys}</kbd>
                </div>
              ))}
            </div>
          </SpotlightCard>

          {/* danger */}
          <SpotlightCard id="danger" className="tf-glass tf-set-card" style={{ borderColor: "rgba(251,113,133,0.25)" }}>
            <SectionTitle title="Danger zone" sub="These actions can't be undone." color="var(--danger)" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "1px solid var(--line-1)" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>Export your data</div>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fg-3)" }}>Download all tasks as JSON.</p>
              </div>
              <button className="tf-ghost" style={{ fontSize: 12 }} onClick={async () => {
                const tasks = await window.api.tasks.list();
                const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), tasks }, null, 2)], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `taskflow-export-${new Date().toISOString().slice(0,10)}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}>Export</button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "1px solid var(--line-1)" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--danger)" }}>Delete account</div>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fg-3)" }}>Permanently remove your account and tasks.</p>
              </div>
              <button style={{
                padding: "8px 14px", borderRadius: 999,
                background: "rgba(251,113,133,0.12)",
                border: "1px solid rgba(251,113,133,0.4)",
                color: "var(--danger)",
                fontSize: 12, fontWeight: 500,
              }}>Delete account</button>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, sub, color }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: color || "var(--fg-1)" }}>{title}</h2>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>{sub}</p>
    </div>
  );
}

function Toggle({ label, hint, on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 0",
        borderTop: "1px solid var(--line-1)",
        cursor: "pointer",
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fg-3)" }}>{hint}</p>
      </div>
      <span className={`tf-toggle ${on ? "is-on" : ""}`} />
    </div>
  );
}

Object.assign(window, { Settings });
