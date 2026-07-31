/* TaskFlow landing page — cinematic hero + features + footer.
   The hero centerpiece is a 3D floating kanban board with tasks flying in. */

function Landing({ go }) {
  // Tasks that "fly in" — staggered with CSS animation-delay
  const heroCols = [
    {
      label: "Today",
      tone: "var(--cat-work)",
      cards: [
        { title: "Draft Q3 launch announcement", chip: "Work",     chipColor: "var(--cat-work)",     due: "4:00 PM", priority: "high" },
        { title: "Reply to design review",      chip: "Work",     chipColor: "var(--cat-work)",     due: "2:00 PM", priority: "medium" },
        { title: "30-min river loop run",       chip: "Fitness",  chipColor: "var(--cat-fitness)",  due: "Tonight", priority: "low" },
      ],
    },
    {
      label: "In progress",
      tone: "var(--acc-2)",
      cards: [
        { title: "Sync with Maya on roadmap",   chip: "Work",     chipColor: "var(--cat-work)",     due: "Wed",     priority: "medium" },
        { title: "Submit history essay",        chip: "School",   chipColor: "var(--cat-school)",   due: "Tomorrow", priority: "high" },
      ],
    },
    {
      label: "Done",
      tone: "var(--success)",
      cards: [
        { title: "Prep slides for all-hands",   chip: "Work",     chipColor: "var(--cat-work)",     due: "—",       priority: "high" },
        { title: "Yoga class booking",          chip: "Fitness",  chipColor: "var(--cat-fitness)",  due: "—",       priority: "low" },
        { title: "Pick up dry cleaning",        chip: "Personal", chipColor: "var(--cat-personal)", due: "—",       priority: "low" },
      ],
    },
  ];

  // computed delay grid so cards stagger nicely
  let delayIdx = 0;

  return (
    <div className="tf-screen-enter">
      {/* nav */}
      <nav className="tf-nav">
        <div className="tf-nav__brand">
          <Logo size={22} textSize={14} />
        </div>
        <div className="tf-nav__links">
          <a className="tf-nav__link" href="#features">Features</a>
          <a className="tf-nav__link" href="#workflow">Workflow</a>
          <a className="tf-nav__link" href="#changelog">Changelog</a>
        </div>
        <div style={{ display: "flex", gap: 8, paddingLeft: 8, borderLeft: "1px solid var(--line-1)" }}>
          <button className="tf-nav__link" onClick={() => go("login")}>Sign in</button>
          <MagneticButton className="tf-cta" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => go("onboarding")}>
            Get started
            <Icon name="arrowRight" size={14} />
          </MagneticButton>
        </div>
      </nav>

      {/* hero */}
      <section className="tf-hero">
        <div className="tf-eyebrow">
          <span className="tag">NEW</span>
          AI plan-of-the-day · arriving in v3.0
          <Icon name="arrowRight" size={12} />
        </div>
        <h1>
          The calmest way to <em>actually</em><br />
          ship what matters.
        </h1>
        <p>
          TaskFlow is a personal productivity workspace built for focus, not friction.
          Plan your day with elegant boards, animated progress, and a command palette
          that's faster than your inbox.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 18 }}>
          <MagneticButton className="tf-cta" onClick={() => go("onboarding")}>
            Start free
            <Icon name="arrowRight" size={14} />
          </MagneticButton>
          <MagneticButton className="tf-ghost" strength={0.2} onClick={() => go("dashboard")}>
            <Icon name="bolt" size={14} />
            Try demo
          </MagneticButton>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, fontSize: 12, color: "var(--fg-4)" }}>
          <span>No credit card</span>
          <span>·</span>
          <span>Free for personal use</span>
          <span>·</span>
          <span><kbd style={{ fontFamily: "var(--font-mono)", padding: "1px 5px", borderRadius: 4, border: "1px solid var(--line-2)", fontSize: 10 }}>⌘ K</kbd> to begin</span>
        </div>

        {/* 3D floating kanban */}
        <div className="tf-hero-stage" aria-hidden="true">
          <div className="tf-board-glow" />
          <div className="tf-board-3d">
            {/* board frame */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(20,20,40,0.85), rgba(10,10,22,0.92))",
                border: "1px solid var(--line-2)",
                borderRadius: 28,
                boxShadow: "0 60px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            />
            {/* board header */}
            <div
              style={{
                position: "absolute",
                left: 24, right: 24, top: 18,
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingBottom: 16,
                borderBottom: "1px solid var(--line-1)",
              }}
            >
              <span className="tf-mark" style={{ width: 22, height: 22 }}>
                <Icon name="check" size={12} stroke={2.6} />
              </span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>This week</span>
              <span style={{ fontSize: 11, color: "var(--fg-4)" }}>·</span>
              <span style={{ fontSize: 11, color: "var(--fg-3)" }}>Mon, May 18</span>
              <span style={{ flex: 1 }} />
              <span className="tf-live">live</span>
              <span style={{ display: "inline-flex", gap: 4 }}>
                <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--grad-accent)", border: "2px solid #0a0a18" }} />
                <span style={{ width: 20, height: 20, borderRadius: 999, background: "linear-gradient(135deg, #fb7185, #f59e0b)", border: "2px solid #0a0a18", marginLeft: -8 }} />
                <span style={{ width: 20, height: 20, borderRadius: 999, background: "linear-gradient(135deg, #34d399, #06b6d4)", border: "2px solid #0a0a18", marginLeft: -8 }} />
              </span>
            </div>

            <div className="tf-board-cols">
              {heroCols.map((col, ci) => (
                <div key={col.label} className="tf-board-col">
                  <div className="tf-board-col__head">
                    <span className="tf-cat-dot" style={{ background: col.tone, color: col.tone }} />
                    {col.label}
                    <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)" }}>{col.cards.length}</span>
                  </div>
                  {col.cards.map((card, idx) => {
                    const d = (delayIdx++ * 0.12 + 0.6).toFixed(2);
                    return (
                      <div
                        key={idx}
                        className="tf-fly-card"
                        style={{ animationDelay: `${d}s` }}
                      >
                        <div className="tf-fly-card__title">{card.title}</div>
                        <div className="tf-fly-card__meta">
                          <span
                            className="tf-fly-card__chip"
                            style={{
                              background: `color-mix(in oklab, ${card.chipColor} 18%, transparent)`,
                              color: card.chipColor,
                              border: `1px solid color-mix(in oklab, ${card.chipColor} 28%, transparent)`,
                            }}
                          >
                            {card.chip}
                          </span>
                          <span>·</span>
                          <span>{card.due}</span>
                          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: { high: "var(--danger)", medium: "var(--warning)", low: "var(--success)" }[card.priority], boxShadow: `0 0 8px currentColor`, color: { high: "var(--danger)", medium: "var(--warning)", low: "var(--success)" }[card.priority] }} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="tf-divider" />

      {/* logos / trust strip */}
      <section style={{ padding: "60px 32px", maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "var(--fg-4)", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 28 }}>
          Loved by independent makers, students, and small teams
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24, alignItems: "center", opacity: 0.65 }}>
          {["acuity", "lattice", "northwind", "kepler", "axiom"].map(n => (
            <div key={n} style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: 22, color: "var(--fg-3)", letterSpacing: "-0.02em" }}>
              {n}
            </div>
          ))}
        </div>
      </section>

      <hr className="tf-divider" />

      {/* features */}
      <section className="tf-section" id="features">
        <div className="tf-section__eyebrow">Workflow that adapts to you</div>
        <h2 className="tf-section__title">
          Built for the way your <em>mind</em> moves.
        </h2>
        <p className="tf-section__sub">
          Lists that flow into boards. Boards that flow into calendars. Calendars
          that fold back into your daily plan. TaskFlow stays out of the way until
          you need it — and then it's instantly there.
        </p>

        <div className="tf-feature-grid tf-stagger">
          <SpotlightCard className="tf-feature tf-feature--wide">
            <div className="tf-feature__icon">
              <Icon name="layers" size={18} />
            </div>
            <h3>Drag & drop kanban</h3>
            <p>Pull tasks between columns. The board responds in under 100ms with a soft drop shadow and gentle springs — no jank, no surprise re-ordering.</p>
            <div style={{ position: "absolute", right: -20, bottom: -20, opacity: 0.7, transform: "rotate(-8deg)" }}>
              <MiniBoardPreview />
            </div>
          </SpotlightCard>

          <SpotlightCard className="tf-feature tf-feature--narrow">
            <div className="tf-feature__icon">
              <Icon name="sparkles" size={18} />
            </div>
            <h3>AI plan of the day</h3>
            <p>Tell TaskFlow what kind of day you want. It drafts a realistic schedule from your open tasks — energy curves included.</p>
            <div style={{ position: "absolute", left: 24, right: 24, bottom: 16 }}>
              <AISuggestionStub />
            </div>
          </SpotlightCard>

          <SpotlightCard className="tf-feature tf-feature--narrow">
            <div className="tf-feature__icon">
              <Icon name="command" size={18} />
            </div>
            <h3>Command palette</h3>
            <p>Press <kbd style={{ fontFamily: "var(--font-mono)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--line-2)", fontSize: 11 }}>⌘ K</kbd> from anywhere to create, jump, search, or schedule.</p>
            <div style={{
              marginTop: 18, padding: "10px 12px", borderRadius: 8,
              border: "1px solid var(--line-2)", background: "rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--fg-3)",
            }}>
              <Icon name="search" size={14} />
              Schedule "Submit essay" for tomorrow…
              <span style={{ marginLeft: "auto", width: 2, height: 14, background: "var(--acc-2)", animation: "tf-pulse-soft 1s infinite" }} />
            </div>
          </SpotlightCard>

          <SpotlightCard className="tf-feature tf-feature--wide">
            <div className="tf-feature__icon">
              <Icon name="bolt" size={18} />
            </div>
            <h3>Streaks that don't shame you</h3>
            <p>Built-in completion streak with grace days. We celebrate momentum without punishing imperfect weeks.</p>
            <div style={{ marginTop: 24, display: "flex", gap: 6 }}>
              {Array.from({ length: 28 }).map((_, i) => {
                const intensity = [0.1, 0.25, 0.5, 0.75, 1][Math.floor(Math.sin(i * 0.9) * 2.5 + 2.5)] || 0.4;
                return (
                  <span
                    key={i}
                    style={{
                      width: 14, height: 28, borderRadius: 4,
                      background: `linear-gradient(180deg, rgba(139,92,246,${intensity}), rgba(59,130,246,${intensity * 0.7}))`,
                      boxShadow: intensity > 0.6 ? "0 0 10px rgba(139,92,246,0.4)" : "none",
                    }}
                  />
                );
              })}
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-4)" }}>
              <span>4 weeks ago</span>
              <span>Today · <span style={{ color: "var(--acc-2)" }}>12 day streak</span></span>
            </div>
          </SpotlightCard>

          <SpotlightCard className="tf-feature tf-feature--half">
            <div className="tf-feature__icon">
              <Icon name="calendar" size={18} />
            </div>
            <h3>Calendar, integrated</h3>
            <p>Tasks with due dates appear in a monthly grid. Click a day to draft tasks for it — no second app to open.</p>
          </SpotlightCard>

          <SpotlightCard className="tf-feature tf-feature--half">
            <div className="tf-feature__icon">
              <Icon name="bell" size={18} />
            </div>
            <h3>Notifications that respect focus</h3>
            <p>Quiet hours, batched digests, and a single "after this task" notification mode. Your phone will thank you.</p>
          </SpotlightCard>
        </div>
      </section>

      <hr className="tf-divider" />

      {/* workflow / scroll story */}
      <section className="tf-section" id="workflow">
        <div className="tf-section__eyebrow">A day with TaskFlow</div>
        <h2 className="tf-section__title">
          Morning intent. Afternoon flow.<br />
          <em>Evening</em> closure.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 48 }}>
          {[
            { time: "8:14 AM", title: "Draft today",       body: "Open with the dashboard. Your streak, your stats, and a one-line motivational pull from your favourite thinkers." },
            { time: "1:02 PM", title: "Pull a card",       body: "Drag a task into 'In progress'. TaskFlow nudges your focus timer and silences other notifications." },
            { time: "8:48 PM", title: "Close the day",     body: "Tick the last box. The completion pulse spreads across the card — your streak ticks up by one." },
          ].map((s, i) => (
            <SpotlightCard
              key={i}
              className="tf-glass"
              style={{ padding: 24, borderRadius: 20 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span className="tf-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{s.time}</span>
                <span style={{ fontSize: 11, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>0{i + 1}</span>
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--fg-3)", lineHeight: 1.55 }}>{s.body}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <hr className="tf-divider" />

      {/* changelog */}
      <section className="tf-section" id="changelog">
        <div className="tf-section__eyebrow">Changelog</div>
        <h2 className="tf-section__title">What we shipped recently.</h2>
        <p className="tf-section__sub">Versioned, dated, and honest about what didn't quite land.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 40 }}>
          {[
            { v: "v3.0", date: "May 16, 2026", tag: "Major", title: "Calendar + Today + Inbox views", body: "Three new ways to slice your tasks. Calendar lights up days that have deadlines; Today filters to what matters now; Inbox surfaces anything you captured without a date." },
            { v: "v2.8", date: "Apr 30, 2026", tag: "Themes", title: "Light theme + system preference", body: "Toggle in Settings → Appearance, or hit ⌘⇧L from anywhere. The light theme inherits the same accent palette." },
            { v: "v2.6", date: "Apr 04, 2026", tag: "Polish", title: "Smoother drag & better empty states", body: "Drop targets pulse instead of jump, and every list has a friendly empty state with a keyboard hint." },
          ].map((e) => (
            <SpotlightCard key={e.v} className="tf-glass" style={{ padding: 22, borderRadius: 16, display: "grid", gridTemplateColumns: "120px 1fr", gap: 24 }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--acc-2)", fontWeight: 600 }}>{e.v}</div>
                <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 4 }}>{e.date}</div>
                <span style={{ marginTop: 10, display: "inline-block", fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid var(--line-2)", color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{e.tag}</span>
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>{e.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--fg-3)", lineHeight: 1.55 }}>{e.body}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      <hr className="tf-divider" />

      {/* big CTA */}
      <section className="tf-section" style={{ textAlign: "center", paddingTop: 100, paddingBottom: 120 }}>
        <h2 className="tf-section__title" style={{ margin: "0 auto 22px" }}>
          Begin a calmer <em>cadence</em> today.
        </h2>
        <p className="tf-section__sub" style={{ marginLeft: "auto", marginRight: "auto" }}>
          Free forever for personal use. Bring your tasks over in five minutes.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <MagneticButton className="tf-cta" onClick={() => go("onboarding")}>
            Create your account
            <Icon name="arrowRight" size={14} />
          </MagneticButton>
          <MagneticButton className="tf-ghost" strength={0.2} onClick={() => go("dashboard")}>
            Skip — show me the app
          </MagneticButton>
        </div>
      </section>

      {/* footer */}
      <footer style={{ borderTop: "1px solid var(--line-1)", padding: "40px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Logo size={22} textSize={14} />
          <div style={{ display: "flex", gap: 22, fontSize: 13, color: "var(--fg-3)" }}>
            <a href="#features">Features</a>
            <a href="#changelog">Changelog</a>
            <button onClick={() => go("login")} style={{ color: "inherit" }}>Sign in</button>
          </div>
          <span style={{ fontSize: 12, color: "var(--fg-4)" }}>© 2026 TaskFlow Inc.</span>
        </div>
      </footer>
    </div>
  );
}

function MiniBoardPreview() {
  return (
    <div style={{
      width: 260, height: 180,
      background: "rgba(20,20,40,0.7)",
      border: "1px solid var(--line-2)",
      borderRadius: 14,
      padding: 12,
      display: "flex", gap: 8,
      transform: "perspective(800px) rotateX(8deg) rotateY(-12deg)",
      boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
    }}>
      {[2, 3, 1].map((n, ci) => (
        <div key={ci} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.08)", marginBottom: 4 }} />
          {Array.from({ length: n }).map((_, i) => (
            <div key={i} style={{
              padding: 6,
              borderRadius: 6,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--line-1)",
            }}>
              <div style={{ height: 4, width: "80%", background: "rgba(255,255,255,0.18)", borderRadius: 2, marginBottom: 4 }} />
              <div style={{ height: 3, width: "55%", background: "rgba(255,255,255,0.10)", borderRadius: 2 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function AISuggestionStub() {
  return (
    <div style={{
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid rgba(139,92,246,0.3)",
      background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))",
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 12, color: "var(--fg-2)",
    }}>
      <span className="tf-mark" style={{ width: 22, height: 22 }}>
        <Icon name="sparkles" size={11} stroke={2} />
      </span>
      <span>Start with the 30-min run. Easy win.</span>
    </div>
  );
}

Object.assign(window, { Landing });
