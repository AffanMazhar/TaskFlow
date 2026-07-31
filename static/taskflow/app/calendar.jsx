/* TaskFlow calendar — month grid that highlights days with due tasks. */

function Calendar({ tasks, go }) {
  const now = new Date();
  const [year, setYear]   = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth()); // 0-indexed

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay(); // 0=Sun
  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  function tasksOnDay(day) {
    const monthLabel = first.toLocaleString("en-US", { month: "short" });
    return tasks.filter(t => {
      const due = (t.due || "").toLowerCase();
      const todayDate = new Date();
      if (year === todayDate.getFullYear() && month === todayDate.getMonth()) {
        if (day === todayDate.getDate() && (due.includes("today") || due.includes("tonight"))) return true;
        if (day === todayDate.getDate() + 1 && due.includes("tomorrow")) return true;
      }
      if (due.includes(monthLabel.toLowerCase()) && due.includes(String(day))) return true;
      return false;
    });
  }

  const isToday = (d) => {
    const t = new Date();
    return d && year === t.getFullYear() && month === t.getMonth() && d === t.getDate();
  };

  function shift(delta) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  }

  const monthName = first.toLocaleString("en-US", { month: "long", year: "numeric" });
  const dayHeads = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="tf-screen-enter">
      <div className="tf-topbar">
        <div className="tf-topbar__title">
          <h1>Calendar</h1>
          <p>Tasks with due dates, laid out on a month grid.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="tf-ghost" style={{ padding: "8px 10px" }} onClick={() => shift(-1)} aria-label="Previous month">
            <Icon name="chevronLeft" size={14} />
          </button>
          <span style={{ minWidth: 160, textAlign: "center", fontSize: 14, fontWeight: 500 }}>{monthName}</span>
          <button className="tf-ghost" style={{ padding: "8px 10px" }} onClick={() => shift(1)} aria-label="Next month">
            <Icon name="arrowRight" size={14} />
          </button>
          <button className="tf-ghost" style={{ padding: "8px 14px", fontSize: 12, marginLeft: 8 }} onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}>
            Today
          </button>
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--line-1)",
        borderRadius: 14,
        overflow: "hidden",
      }}>
        {dayHeads.map(d => (
          <div key={d} style={{
            padding: "10px 12px",
            fontSize: 11,
            color: "var(--fg-4)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            borderBottom: "1px solid var(--line-1)",
            background: "rgba(255,255,255,0.02)",
          }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          const today = isToday(d);
          const items = d ? tasksOnDay(d) : [];
          return (
            <div key={i} style={{
              minHeight: 96,
              padding: 8,
              borderRight: (i % 7 === 6) ? "none" : "1px solid var(--line-1)",
              borderBottom: "1px solid var(--line-1)",
              background: d ? "transparent" : "rgba(0,0,0,0.15)",
              position: "relative",
            }}>
              {d && (
                <>
                  <div style={{
                    fontSize: 12,
                    fontWeight: today ? 600 : 400,
                    color: today ? "var(--acc-2)" : "var(--fg-3)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 22, height: 22, borderRadius: 999,
                    background: today ? "color-mix(in oklab, var(--acc-2) 16%, transparent)" : "transparent",
                    marginBottom: 6,
                  }}>{d}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {items.slice(0, 3).map(t => {
                      const color = window.CATEGORY_COLORS[t.category];
                      return (
                        <div key={t.id} title={t.content} style={{
                          fontSize: 11,
                          padding: "3px 6px",
                          borderRadius: 4,
                          background: `color-mix(in oklab, ${color} 12%, transparent)`,
                          color: color,
                          border: `1px solid color-mix(in oklab, ${color} 22%, transparent)`,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {t.content}
                        </div>
                      );
                    })}
                    {items.length > 3 && (
                      <div style={{ fontSize: 10, color: "var(--fg-4)" }}>+{items.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--fg-4)" }}>
        Tip: tasks land on this grid when their due label matches the month and day (e.g. "May 18"). Use "Today", "Tomorrow", and weekday names for relative due dates.
      </p>
    </div>
  );
}

Object.assign(window, { Calendar });
