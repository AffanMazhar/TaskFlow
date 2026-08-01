/* Shared TaskFlow components: icons, logo, magnetic button, spotlight wrapper. */

const TF_ICONS = {
  check:        '<path d="M5 12l5 5L20 7"/>',
  plus:         '<path d="M12 5v14M5 12h14"/>',
  menu:         '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:        '<path d="M18 6L6 18M6 6l12 12"/>',
  search:       '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chevronLeft:  '<path d="M15 18l-6-6 6-6"/>',
  chevronRight: '<path d="M9 18l6-6-6-6"/>',
  chevronDown:  '<path d="M6 9l6 6 6-6"/>',
  dashboard:    '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  list:         '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.4"/><circle cx="4.5" cy="12" r="1.4"/><circle cx="4.5" cy="18" r="1.4"/>',
  clock:        '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  circleCheck:  '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  calendar:     '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>',
  cog:          '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.04.59.32 1.13.81 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  sun:          '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon:         '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  pencil:       '<path d="M12 20h9M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  trash:        '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  bolt:         '<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>',
  bell:         '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
  sparkles:     '<path d="M12 3v3M12 18v3M5 12H2M22 12h-3M6.5 6.5l-2-2M19.5 19.5l-2-2M19.5 4.5l-2 2M6.5 17.5l-2 2"/><circle cx="12" cy="12" r="3.2"/>',
  user:         '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  arrowRight:   '<path d="M5 12h14M13 6l6 6-6 6"/>',
  layers:       '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/>',
  filter:       '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  command:      '<path d="M15 6a3 3 0 1 1 3 3h-3V6zM9 18a3 3 0 1 1-3-3h3v3zM6 9a3 3 0 1 1 3-3v3H6zM18 15a3 3 0 1 1-3 3v-3h3z"/><rect x="9" y="9" width="6" height="6"/>',
};

function Icon({ name, size = 16, stroke = 1.8, style, className }) {
  const path = TF_ICONS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

function Logo({ size = 28, withText = true, textSize = 15 }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <span className="tf-mark" style={{ width: size, height: size, borderRadius: size * 0.3 }}>
        <Icon name="check" size={size * 0.6} stroke={2.6} />
      </span>
      {withText && (
        <span style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: textSize }}>
          TaskFlow
        </span>
      )}
    </span>
  );
}

/* MagneticButton — element nudges toward the cursor within a radius.
   Wraps a child and applies a transform; pair with .tf-cta or anything. */
function MagneticButton({ children, strength = 0.35, radius = 100, className = "", style, onClick, type = "button" }) {
  const ref = React.useRef(null);
  const reset = React.useRef(null);

  function move(e) {
    const el = ref.current;
    if (!el) return;
    // The magnetic pull is a JS transform, so CSS can't switch it off.
    if (document.body.dataset.reduceMotion === "true") {
      el.style.transform = "translate3d(0,0,0)";
      return;
    }
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius * 1.6) {
      el.style.transform = "translate3d(0,0,0)";
      return;
    }
    el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
  }
  function leave() {
    if (ref.current) ref.current.style.transform = "translate3d(0,0,0)";
  }

  React.useEffect(() => {
    function onMove(e) {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
      } else {
        el.style.transform = "translate3d(0,0,0)";
      }
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [strength, radius]);

  return (
    <button
      ref={ref}
      type={type}
      className={`tf-magnet ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* SpotlightCard — re-emits CSS vars for cursor position. */
function SpotlightCard({ children, className = "", style, as = "div", ...rest }) {
  const ref = React.useRef(null);
  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`tf-spotlight ${className}`}
      style={style}
      onMouseMove={onMove}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* CountUp — animate a number from prev → next. */
function CountUp({ value, duration = 900, format = (v) => Math.round(v).toLocaleString() }) {
  const [display, setDisplay] = React.useState(0);
  const prev = React.useRef(0);
  React.useEffect(() => {
    const from = prev.current;
    const to = value;
    const start = performance.now();
    let raf;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
      else prev.current = to;
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format(display)}</>;
}

/* Sparkline */
function Sparkline({ data, width = 80, height = 36, stroke = "#8b5cf6" }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const path = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const gradId = `spark-${React.useId()}`;
  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${gradId})`} />
      <path d={path} stroke={stroke} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Backgrounds — switchable */
function AnimatedBackground({ kind }) {
  if (kind === "starfield") return <div className="tf-stars" />;
  if (kind === "aurora")    return <div className="tf-aurora" />;
  if (kind === "solid")     return <div className="tf-solid" />;
  return <div className="tf-mesh" />; // default
}

/* Cursor glow — soft glow that follows cursor on landing/onboarding */
function CursorGlow({ intensity = 1, enabled = true }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!enabled) return;
    function onMove(e) {
      const el = ref.current;
      if (!el) return;
      el.style.transform = `translate3d(${e.clientX - 200}px, ${e.clientY - 200}px, 0)`;
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled]);
  if (!enabled) return null;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed", top: 0, left: 0, width: 400, height: 400, pointerEvents: "none",
        background: `radial-gradient(closest-side, rgba(122,108,196,${0.10 * intensity}), transparent 70%)`,
        zIndex: 0, mixBlendMode: "screen",
        willChange: "transform",
      }}
    />
  );
}

Object.assign(window, {
  Icon, Logo, MagneticButton, SpotlightCard, CountUp, Sparkline, AnimatedBackground, CursorGlow,
});
