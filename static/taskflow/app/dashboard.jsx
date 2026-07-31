/* TaskFlow dashboard — animated stats, weekly chart, progress ring, recent activity. */

function Dashboard({ go, tasks, openCmd, name }) {
  const [stats, setStats] = React.useState(null);
  const [activity, setActivity] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, a] = await Promise.all([window.api.dashboard(), window.api.activity()]);
        if (cancelled) return;
        setStats(s);
        setActivity(a.activity || []);
      } catch (_) { /* unauth — already redirected */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const done    = tasks.filter(t => t.status === "done").length;
  const total   = tasks.length;
  const pending = tasks.filter(t => t.status !== "done").length;
  const overdue = stats?.overdue ?? 0;
  const pct     = stats?.completion_pct ?? (total ? Math.round((done / total) * 100) : 0);
  const streak  = stats?.streak ?? 0;

  // weekly completed series — server-provided when available, else flat zeros
  const weekSeries = stats?.week || Array.from({ length: 7 }, () => ({ day: "", count: 0 }));
  const week      = weekSeries.map(d => d.count);
  const weekDays  = weekSeries.map(d => (d.day || "").charAt(0));
  const weekMax   = Math.max(1, ...week);

  // animated ring percent
  const [ringPct, setRingPct] = React.useState(0);
  React.useEffect(() => {
    const id = setTimeout(() => setRingPct(pct), 200);
    return () => clearTimeout(id);
  }, [pct]);

  const quote = stats?.quote ? [stats.quote.text, stats.quote.author] : ["", ""];

  return (
    <div className="tf-screen-enter">
      {/* top bar */}
      <div className="tf-topbar">
        <div className="tf-topbar__title">
          <h1>
            Good afternoon, <span className="tf-grad-text">{name || "there"}</span> <span style={{ fontStyle: "normal", filter: "saturate(0.8)" }}>👋</span>
          </h1>
          <p>You have <strong style={{ color: "var(--fg-1)" }}>{pending}</strong> tasks open · {overdue} need attention today.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="tf-search" onClick={openCmd}>
            <Icon name="search" size={14} />
            Search or run a command…
            <kbd>⌘ K</kbd>
          </button>
          <MagneticButton className="tf-ghost" strength={0.25} style={{ padding: "8px 10px" }}>
            <Icon name="bell" size={14} />
            <span className="tf-dot-blink" style={{ position: "absolute", marginLeft: 12, marginTop: -10 }} />
          </MagneticButton>
          <div className="tf-avatar">TS</div>
        </div>
      </div>

      {/* stat cards */}
      <div className="tf-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        <SpotlightCard className="tf-stat">
          <div className="tf-stat__label">Completed today</div>
          <div className="tf-stat__val"><CountUp value={done} /></div>
          <div className="tf-stat__delta">+3 vs yesterday</div>
          <span className="tf-stat__spark">
            <Sparkline data={[2, 3, 2, 4, 6, 5, done]} stroke="#8b5cf6" />
          </span>
        </SpotlightCard>

        <SpotlightCard className="tf-stat">
          <div className="tf-stat__label">In progress</div>
          <div className="tf-stat__val"><CountUp value={pending} /></div>
          <div className="tf-stat__delta" style={{ color: "var(--fg-3)" }}>steady this week</div>
          <span className="tf-stat__spark">
            <Sparkline data={[5, 6, 5, 7, 6, 8, pending]} stroke="#60a5fa" />
          </span>
        </SpotlightCard>

        <SpotlightCard className="tf-stat">
          <div className="tf-stat__label">Overdue</div>
          <div className="tf-stat__val" style={{ color: "var(--danger)" }}><CountUp value={overdue} /></div>
          <div className="tf-stat__delta is-neg">−1 since Monday</div>
          <span className="tf-stat__spark">
            <Sparkline data={[3, 4, 3, 2, 3, 3, overdue]} stroke="#fb7185" />
          </span>
        </SpotlightCard>

        <SpotlightCard className="tf-stat">
          <div className="tf-stat__label">Current streak</div>
          <div className="tf-stat__val" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CountUp value={streak} />
            <span style={{ fontSize: 14, color: "var(--fg-3)", fontWeight: 400 }}>days</span>
          </div>
          <div className="tf-stat__delta">personal best</div>
          <span className="tf-stat__spark">
            <Sparkline data={[2, 4, 6, 8, 9, 11, streak]} stroke="#34d399" />
          </span>
        </SpotlightCard>
      </div>

      {/* main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 22 }}>
        {/* weekly chart */}
        <SpotlightCard className="tf-glass" style={{ padding: 22, borderRadius: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>This week</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--fg-3)" }}>Tasks completed by day</p>
            </div>
            <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--fg-3)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--grad-accent)" }} />
                Completed
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                Target
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", height: 180, gap: 16, padding: "0 8px" }}>
            {week.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", alignItems: "flex-end" }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.04))", borderRadius: 6 }} />
                  <div className="tf-bar" style={{
                    width: "100%",
                    height: `${(v / weekMax) * 100}%`,
                    animationDelay: `${i * 0.08}s`,
                  }} />
                  {/* number on top of bar */}
                  <span style={{
                    position: "absolute",
                    top: `calc(${100 - (v / weekMax) * 100}% - 22px)`,
                    left: "50%", transform: "translateX(-50%)",
                    fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--fg-3)",
                  }}>{v}</span>
                </div>
                <span style={{ fontSize: 11, color: i === 4 ? "var(--acc-2)" : "var(--fg-4)", fontWeight: i === 4 ? 600 : 400 }}>{weekDays[i]}</span>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {/* progress ring */}
        <SpotlightCard className="tf-glass" style={{ padding: 22, borderRadius: 18, display: "flex", flexDirection: "column" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>Today's plan</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--fg-3)" }}>{done} of {total} complete</p>

          <div style={{ display: "grid", placeItems: "center", flex: 1, position: "relative" }}>
            <svg width="180" height="180" className="tf-ring">
              <defs>
                <linearGradient id="tf-grad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
              <circle cx="90" cy="90" r="74" className="tf-ring__bg" strokeWidth="14" />
              <circle
                cx="90" cy="90" r="74"
                className="tf-ring__fg"
                strokeWidth="14"
                strokeDasharray={2 * Math.PI * 74}
                strokeDashoffset={(2 * Math.PI * 74) * (1 - ringPct / 100)}
                style={{ filter: "drop-shadow(0 0 12px rgba(139,92,246,0.5))" }}
              />
            </svg>
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div className="tf-grad-text" style={{ fontSize: 42, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1 }}>
                <CountUp value={pct} format={(v) => Math.round(v) + "%"} />
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>complete</div>
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* recent + activity + quote */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <SpotlightCard className="tf-glass" style={{ padding: 22, borderRadius: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>Recent tasks</h3>
            </div>
            <button onClick={() => go("tasks")} style={{ fontSize: 12, color: "var(--acc-2)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              Open board
              <Icon name="arrowRight" size={12} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.slice(0, 5).map((t) => {
              const isDone = t.status === "done";
              return (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 12px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--line-1)",
                  borderRadius: 10,
                  transition: "background .15s, border-color .15s",
                }}>
                  <span className={`tf-check ${isDone ? "is-on" : ""}`}>
                    {isDone && <Icon name="check" size={11} stroke={3} style={{ color: "white" }} />}
                  </span>
                  <span style={{ fontSize: 14, color: isDone ? "var(--fg-3)" : "var(--fg-1)", textDecoration: isDone ? "line-through" : "none", flex: 1, fontWeight: 500 }}>{t.content}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `color-mix(in oklab, ${window.CATEGORY_COLORS[t.category]} 16%, transparent)`, color: window.CATEGORY_COLORS[t.category], border: `1px solid color-mix(in oklab, ${window.CATEGORY_COLORS[t.category]} 25%, transparent)`, fontWeight: 500, letterSpacing: "0.02em" }}>
                    {t.category}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--fg-4)", minWidth: 70, textAlign: "right" }}>{t.due}</span>
                </div>
              );
            })}
          </div>
        </SpotlightCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Quote card */}
          <SpotlightCard className="tf-glass" style={{ padding: 22, borderRadius: 18 }}>
            <div style={{ fontSize: 32, color: "var(--acc-2)", lineHeight: 0.8, fontFamily: "var(--font-serif)", marginBottom: 6 }}>"</div>
            <p style={{ margin: "0 0 12px", fontSize: 15, fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--fg-1)", lineHeight: 1.4 }}>
              {quote[0]}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--fg-3)" }}>— {quote[1]}</p>
          </SpotlightCard>
        </div>
      </div>

      {/* activity feed */}
      <SpotlightCard className="tf-glass" style={{ padding: 22, borderRadius: 18, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>Activity</h3>
          <span className="tf-live">live</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {activity.map((a) => (
            <div key={a.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 6px",
              borderBottom: "1px solid var(--line-1)",
              fontSize: 13,
              color: "var(--fg-2)",
            }}>
              <div className="tf-avatar" style={{ width: 24, height: 24, fontSize: 10, boxShadow: "none" }}>
                {a.who === "You" ? "TS" : a.who.slice(0, 2).toUpperCase()}
              </div>
              <span><strong style={{ color: "var(--fg-1)", fontWeight: 500 }}>{a.who}</strong> {a.what} <span style={{ color: "var(--fg-1)" }}>"{a.obj}"</span></span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>{a.when}</span>
            </div>
          ))}
        </div>
      </SpotlightCard>
    </div>
  );
}

Object.assign(window, { Dashboard });
