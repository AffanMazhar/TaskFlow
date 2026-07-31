/* TaskFlow login + register screens. */

function Login({ go }) {
  const [u, setU] = React.useState("");
  const [p, setP] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function submit(e) {
    e.preventDefault();
    if (!u.trim() || !p) { setErr("Username and password are required."); return; }
    setErr(""); setLoading(true);
    try {
      await window.api.login({ username: u.trim(), password: p });
      // Pull the just-signed-in profile so the app reflects real data.
      const me = await window.api.me();
      if (me.display_name) {/* will be picked up by App after refresh */}
      window.location.reload();
    } catch (ex) {
      setLoading(false);
      setErr(ex.message === "invalid_credentials" ? "Wrong username or password." : "Sign in failed. Try again.");
    }
  }

  return (
    <div className="tf-auth-wrap tf-screen-enter">
      <div className="tf-auth-form-side">
        <div className="tf-auth-form" data-comment-anchor="59879fb885-div-17-9">
          <button onClick={() => go("landing")} style={{ marginBottom: 32, fontSize: 13, color: "var(--fg-3)", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="chevronLeft" size={14} /> Back to home
          </button>

          <Logo size={32} textSize={18} />

          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", margin: "32px 0 8px" }}>
            Welcome back.
          </h1>
          <p style={{ color: "var(--fg-3)", margin: "0 0 32px", fontSize: 14 }}>
            Sign in to continue where you left off.
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="tf-label">Username</label>
              <input
                className="tf-input"
                placeholder="tessa"
                value={u}
                onChange={(e) => setU(e.target.value)}
                autoFocus />

            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="tf-label">Password</label>
                <a href="/forgot" style={{ fontSize: 11, color: "var(--acc-2)" }}>Forgot?</a>
              </div>
              <input
                className="tf-input"
                type="password"
                placeholder="••••••••"
                value={p}
                onChange={(e) => setP(e.target.value)} />

            </div>
            {err && (
              <div style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(251,113,133,0.10)", border: "1px solid rgba(251,113,133,0.35)", color: "var(--danger)", fontSize: 12 }}>
                {err}
              </div>
            )}
            <MagneticButton className="tf-cta" type="submit" style={{ marginTop: 8, justifyContent: "center", padding: "13px 16px" }}>
              {loading ?
              <>
                  <span className="tf-skel" style={{ width: 14, height: 14, borderRadius: 999, opacity: 0.5 }} />
                  Signing you in
                </> :

              <>
                  Sign in
                  <Icon name="arrowRight" size={14} />
                </>
              }
            </MagneticButton>
          </form>

          <p style={{ marginTop: 28, fontSize: 13, color: "var(--fg-3)", textAlign: "center" }}>
            Don't have an account?{" "}
            <button onClick={() => go("register")} style={{ color: "var(--acc-2)", fontWeight: 500 }}>Create one</button>
          </p>
        </div>
      </div>

      <div className="tf-auth-art">
        <AuthArt />
      </div>
    </div>);

}

function Register({ go }) {
  const [u, setU] = React.useState("");
  const [e, setE] = React.useState("");
  const [p, setP] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function submit(ev) {
    ev.preventDefault();
    setErr(""); setLoading(true);
    try {
      await window.api.register({ username: u.trim(), email: e.trim(), password: p });
      window.location.reload();
    } catch (ex) {
      setLoading(false);
      const msg = ({
        username_taken:      "That username is already taken.",
        email_taken:         "An account with that email already exists.",
        username_too_short:  "Username must be at least 3 characters.",
        password_too_short:  "Password must be at least 6 characters.",
        missing_fields:      "Fill in every field.",
      })[ex.message] || "Sign-up failed. Try again.";
      setErr(msg);
    }
  }

  return (
    <div className="tf-auth-wrap tf-screen-enter">
      <div className="tf-auth-form-side">
        <div className="tf-auth-form">
          <button onClick={() => go("landing")} style={{ marginBottom: 32, fontSize: 13, color: "var(--fg-3)", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="chevronLeft" size={14} /> Back to home
          </button>

          <Logo size={32} textSize={18} />

          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", margin: "32px 0 8px" }}>
            Create your space.
          </h1>
          <p style={{ color: "var(--fg-3)", margin: "0 0 32px", fontSize: 14 }}>
            Free forever for personal use. No credit card needed.
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="tf-label">Username</label>
              <input className="tf-input" placeholder="tessa" value={u} onChange={(ev) => setU(ev.target.value)} autoFocus />
            </div>
            <div>
              <label className="tf-label">Email</label>
              <input className="tf-input" type="email" placeholder="tessa@workmail.com" value={e} onChange={(ev) => setE(ev.target.value)} />
            </div>
            <div>
              <label className="tf-label">Password</label>
              <input className="tf-input" type="password" placeholder="At least 6 characters" value={p} onChange={(ev) => setP(ev.target.value)} />
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {[0, 1, 2, 3].map((i) =>
                <span key={i} style={{
                  flex: 1, height: 3, borderRadius: 999,
                  background: p.length > i * 2 ? "var(--grad-accent)" : "rgba(255,255,255,0.06)",
                  transition: "background .25s"
                }} />
                )}
              </div>
            </div>
            {err && (
              <div style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(251,113,133,0.10)", border: "1px solid rgba(251,113,133,0.35)", color: "var(--danger)", fontSize: 12 }}>
                {err}
              </div>
            )}
            <MagneticButton className="tf-cta" type="submit" style={{ marginTop: 8, justifyContent: "center", padding: "13px 16px" }}>
              {loading ?
              <>
                  <span className="tf-skel" style={{ width: 14, height: 14, borderRadius: 999, opacity: 0.5 }} />
                  Creating account
                </> :

              <>
                  Create account
                  <Icon name="arrowRight" size={14} />
                </>
              }
            </MagneticButton>
          </form>

          <p style={{ marginTop: 16, fontSize: 11, color: "var(--fg-4)", lineHeight: 1.6 }}>
            By signing up you agree to our terms of service and privacy policy. We
            won't spam you — pinky promise.
          </p>

          <p style={{ marginTop: 28, fontSize: 13, color: "var(--fg-3)", textAlign: "center" }}>
            Already have an account?{" "}
            <button onClick={() => go("login")} style={{ color: "var(--acc-2)", fontWeight: 500 }}>Sign in</button>
          </p>
        </div>
      </div>

      <div className="tf-auth-art">
        <AuthArt />
      </div>
    </div>);

}

/* Auth art — a floating mini-dashboard preview behind the form. */
function AuthArt() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", padding: 60 }}>
      {/* aurora glow */}
      <div style={{
        position: "absolute", top: "20%", left: "10%",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(122,108,196,0.22), transparent 60%)",
        filter: "blur(60px)",
        animation: "tf-aurora-move 18s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "10%",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(79,109,209,0.18), transparent 60%)",
        filter: "blur(60px)",
        animation: "tf-aurora-move 22s ease-in-out infinite reverse"
      }} />

      {/* floating dashboard mock */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%) perspective(1200px) rotateY(-12deg) rotateX(8deg)",
        width: 460,
        background: "rgba(15,15,30,0.85)",
        border: "1px solid var(--line-2)",
        borderRadius: 18,
        padding: 22,
        boxShadow: "0 60px 100px rgba(0,0,0,0.5)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="tf-mark" style={{ width: 22, height: 22 }}>
              <Icon name="check" size={12} stroke={2.6} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>This week</span>
          </div>
          <span className="tf-live">live</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          {[
          { label: "Done", val: "8", grad: "var(--grad-accent)" },
          { label: "Open", val: "12", grad: "linear-gradient(135deg, #06b6d4, #3b82f6)" },
          { label: "Overdue", val: "2", grad: "linear-gradient(135deg, #fb7185, #f43f5e)" }].
          map((s) =>
          <div key={s.label} style={{ padding: 10, background: "rgba(255,255,255,0.04)", border: "1px solid var(--line-1)", borderRadius: 10 }}>
              <div style={{ fontSize: 9, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2, letterSpacing: "-0.03em", background: s.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {s.val}
              </div>
            </div>
          )}
        </div>

        {[
        { title: "Draft Q3 launch announcement", chip: "Work", color: "var(--cat-work)" },
        { title: "30-min river loop run", chip: "Fitness", color: "var(--cat-fitness)" },
        { title: "Submit history essay", chip: "School", color: "var(--cat-school)" }].
        map((t, i) =>
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px",
          border: "1px solid var(--line-1)",
          borderRadius: 10,
          marginBottom: 8,
          background: "rgba(255,255,255,0.025)"
        }}>
            <span style={{ width: 16, height: 16, borderRadius: 5, border: "1.5px solid var(--line-3)" }} />
            <span style={{ fontSize: 13 }}>{t.title}</span>
            <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `color-mix(in oklab, ${t.color} 18%, transparent)`, color: t.color, fontWeight: 500 }}>
              {t.chip}
            </span>
          </div>
        )}
      </div>
    </div>);

}

Object.assign(window, { Login, Register });