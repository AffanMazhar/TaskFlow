/* TaskFlow onboarding flow — 4 steps with animated transitions. */

function Onboarding({ go }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [intent, setIntent] = React.useState("focused");
  const [accent, setAccent] = React.useState("indigo");
  const total = 4;

  function next() { if (step < total - 1) setStep(step + 1); else go("dashboard"); }
  function back() { if (step > 0) setStep(step - 1); }

  return (
    <div className="tf-onboard tf-screen-enter">
      <div className="tf-onboard__card tf-glass-strong">
        {/* progress dots */}
        <div className="tf-step-dots">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`tf-step-dot ${i < step ? "is-done" : ""} ${i === step ? "is-current" : ""}`}
            />
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--fg-4)", marginBottom: 6, letterSpacing: "0.04em" }}>
          Step {step + 1} of {total}
        </div>

        <div key={step} className="tf-screen-enter">
          {step === 0 && <StepWelcome name={name} setName={setName} />}
          {step === 1 && <StepIntent intent={intent} setIntent={setIntent} />}
          {step === 2 && <StepAccent accent={accent} setAccent={setAccent} />}
          {step === 3 && <StepReady name={name} intent={intent} accent={accent} />}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          <button className="tf-nav__link" onClick={back} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
            <Icon name="chevronLeft" size={14} /> Back
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            {step === 0 && (
              <button className="tf-nav__link" onClick={() => go("landing")} style={{ fontSize: 13 }}>
                Cancel
              </button>
            )}
            <MagneticButton className="tf-cta" onClick={next}>
              {step === total - 1 ? "Enter TaskFlow" : "Continue"}
              <Icon name="arrowRight" size={14} />
            </MagneticButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepWelcome({ name, setName }) {
  return (
    <>
      <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em", margin: "8px 0 12px" }}>
        Welcome to <span className="tf-grad-text">TaskFlow</span>.
      </h2>
      <p style={{ color: "var(--fg-2)", fontSize: 16, lineHeight: 1.55, margin: "0 0 32px", maxWidth: 480 }}>
        Let's tune the workspace to you. This takes about a minute — no email
        confirmations, no credit card.
      </p>
      <label className="tf-label">What should we call you?</label>
      <input
        className="tf-input"
        placeholder="Tessa"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        style={{ maxWidth: 320, fontSize: 16, padding: "14px 16px" }}
      />
      <p style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 8 }}>You can change this any time in settings.</p>
    </>
  );
}

function StepIntent({ intent, setIntent }) {
  const options = [
    { id: "focused",   icon: "bolt",      title: "Deep focus",     desc: "Few big tasks. Long uninterrupted blocks." },
    { id: "balanced",  icon: "layers",    title: "Balanced day",   desc: "A mix of admin, creative, and personal." },
    { id: "exploring", icon: "sparkles",  title: "Just exploring", desc: "Curious about productivity systems." },
  ];
  return (
    <>
      <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", margin: "8px 0 8px" }}>
        How do your best days look?
      </h2>
      <p style={{ color: "var(--fg-2)", fontSize: 15, margin: "0 0 28px", maxWidth: 480 }}>
        We'll tune defaults — your dashboard layout, suggested categories, and
        notification cadence.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setIntent(o.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 18px",
              borderRadius: 14,
              border: `1px solid ${intent === o.id ? "rgba(139,92,246,0.5)" : "var(--line-2)"}`,
              background: intent === o.id ? "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.06))" : "rgba(255,255,255,0.02)",
              textAlign: "left",
              color: "var(--fg-1)",
              transition: "all .2s var(--ease-out)",
              boxShadow: intent === o.id ? "0 0 0 2px rgba(139,92,246,0.18)" : "none",
            }}
          >
            <span style={{
              width: 40, height: 40, borderRadius: 12,
              background: intent === o.id ? "var(--grad-accent)" : "rgba(255,255,255,0.04)",
              border: "1px solid var(--line-2)",
              display: "grid", placeItems: "center",
              color: intent === o.id ? "white" : "var(--fg-2)",
              boxShadow: intent === o.id ? "0 0 18px rgba(139,92,246,0.4)" : "none",
              flexShrink: 0,
            }}>
              <Icon name={o.icon} size={18} />
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{o.title}</div>
              <div style={{ fontSize: 13, color: "var(--fg-3)" }}>{o.desc}</div>
            </div>
            <span style={{ marginLeft: "auto" }}>
              <span style={{
                width: 18, height: 18, borderRadius: 999,
                border: `1.5px solid ${intent === o.id ? "var(--acc-2)" : "var(--line-3)"}`,
                background: intent === o.id ? "var(--grad-accent)" : "transparent",
                display: "inline-grid", placeItems: "center",
              }}>
                {intent === o.id && <Icon name="check" size={11} stroke={3} style={{ color: "white" }} />}
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function StepAccent({ accent, setAccent }) {
  return (
    <>
      <h2 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", margin: "8px 0 8px" }}>
        Pick an accent.
      </h2>
      <p style={{ color: "var(--fg-2)", fontSize: 15, margin: "0 0 28px", maxWidth: 480 }}>
        Used across buttons, focus rings, and live indicators. Pure decoration —
        change it later from settings.
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {window.ACCENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => setAccent(a.id)}
            aria-label={a.id}
            style={{
              width: 64, height: 64, borderRadius: 18,
              background: `linear-gradient(135deg, ${a.colors[0]}, ${a.colors[1]})`,
              border: accent === a.id ? "2px solid white" : "1px solid var(--line-2)",
              boxShadow: accent === a.id
                ? `0 0 0 4px rgba(255,255,255,0.08), 0 12px 30px ${a.colors[1]}55`
                : `0 6px 18px ${a.colors[1]}33`,
              cursor: "pointer",
              transition: "transform .2s var(--ease-out)",
              position: "relative",
            }}
          >
            {accent === a.id && (
              <span style={{
                position: "absolute", top: 4, right: 4,
                width: 18, height: 18, borderRadius: 999,
                background: "rgba(0,0,0,0.5)",
                display: "grid", placeItems: "center",
                color: "white",
              }}>
                <Icon name="check" size={10} stroke={3} />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Live preview */}
      <div style={{ marginTop: 36, padding: 24, borderRadius: 18, border: "1px solid var(--line-1)", background: "rgba(0,0,0,0.2)" }}>
        <p style={{ fontSize: 11, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Preview</p>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{
            padding: "8px 16px", borderRadius: 999,
            background: `linear-gradient(135deg, ${window.ACCENTS.find(a => a.id === accent).colors[0]}, ${window.ACCENTS.find(a => a.id === accent).colors[1]})`,
            color: "white",
            fontWeight: 600, fontSize: 13,
            boxShadow: `0 8px 22px ${window.ACCENTS.find(a => a.id === accent).colors[1]}55`,
          }}>
            Primary button
          </span>
          <span style={{
            padding: "8px 14px", borderRadius: 8,
            border: `1px solid ${window.ACCENTS.find(a => a.id === accent).colors[1]}66`,
            background: `${window.ACCENTS.find(a => a.id === accent).colors[1]}10`,
            color: window.ACCENTS.find(a => a.id === accent).colors[1],
            fontSize: 12, fontWeight: 500,
          }}>
            Active chip
          </span>
        </div>
      </div>
    </>
  );
}

function StepReady({ name, intent, accent }) {
  const intentLabel = { focused: "Deep focus", balanced: "Balanced day", exploring: "Exploration" }[intent];
  return (
    <>
      <h2 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: "8px 0 8px" }}>
        Ready, {name || "friend"}.
      </h2>
      <p style={{ color: "var(--fg-2)", fontSize: 16, margin: "0 0 32px", maxWidth: 480 }}>
        We've prepped a dashboard with three starter tasks so you can feel how
        things move. Bring your real list over when you're ready.
      </p>

      <div style={{ display: "grid", gap: 10, maxWidth: 480 }}>
        {[
          { label: "Display name",    value: name || "Tessa" },
          { label: "Workflow mode",   value: intentLabel },
          { label: "Accent",          value: accent.charAt(0).toUpperCase() + accent.slice(1) },
        ].map((r) => (
          <div key={r.label} style={{
            display: "flex", justifyContent: "space-between",
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid var(--line-1)",
            fontSize: 14,
          }}>
            <span style={{ color: "var(--fg-3)" }}>{r.label}</span>
            <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{r.value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: "var(--fg-4)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="sparkles" size={12} />
        <span>Tip: press <kbd style={{ fontFamily: "var(--font-mono)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--line-2)" }}>⌘ K</kbd> anywhere to open the command palette.</span>
      </div>
    </>
  );
}

Object.assign(window, { Onboarding });
