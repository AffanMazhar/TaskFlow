/* TaskFlow kanban — real drag and drop, create/edit/delete tasks. */

const COLUMNS = [
  { id: "todo",  label: "To do",       hint: "Captured, not yet started" },
  { id: "doing", label: "In progress", hint: "Active focus" },
  { id: "done",  label: "Done",        hint: "Completed this week" },
];

function Tasks({ tasks, setTasks, openCmd, view }) {
  const [filter, setFilter] = React.useState("All");
  const [dragId, setDragId] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);
  const [editing, setEditing] = React.useState(null);  // task or null
  const [creating, setCreating] = React.useState(false);

  const v = view || { view: "board", title: "Board", subtitle: "Pull tasks across columns. Press N to add." };

  // Pre-filter tasks based on the view (Today / Inbox / All)
  const preFiltered = React.useMemo(() => {
    if (v.view === "today") {
      return tasks.filter(t => /today|tonight/i.test(t.due || "") || t.status === "doing");
    }
    if (v.view === "inbox") {
      return tasks.filter(t => !t.due);
    }
    return tasks;
  }, [tasks, v.view]);

  const visible = filter === "All" ? preFiltered : preFiltered.filter(t => t.category === filter);

  // Listen for the global "new task" event from the command palette / N key.
  React.useEffect(() => {
    const open = () => setCreating(true);
    window.addEventListener("tf-new-task", open);
    return () => window.removeEventListener("tf-new-task", open);
  }, []);

  function onDragStart(e, id) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", id); } catch (_) {}
  }
  function onDragEnd() {
    setDragId(null);
    setDragOver(null);
  }
  function onDragOver(e, col) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(col);
  }
  function onDrop(e, col) {
    e.preventDefault();
    const id = dragId || e.dataTransfer.getData("text/plain");
    setDragId(null);
    setDragOver(null);
    const before = tasks;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: col } : t));
    window.api.tasks.update(id, { status: col }).catch(() => setTasks(before));
  }
  function toggleComplete(id) {
    const before = tasks;
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const nextStatus = target.status === "done" ? "doing" : "done";
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    window.api.tasks.update(id, { status: nextStatus }).catch(() => setTasks(before));
  }
  function deleteTask(id) {
    const before = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    window.api.tasks.remove(id).catch(() => setTasks(before));
  }
  async function saveTask(task) {
    if (task.id && tasks.find(t => t.id === task.id)) {
      const before = tasks;
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      try {
        const updated = await window.api.tasks.update(task.id, task);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      } catch (_) { setTasks(before); }
    } else {
      try {
        const created = await window.api.tasks.create(task);
        setTasks(prev => [created, ...prev]);
      } catch (_) { /* leave UI as-is */ }
    }
    setEditing(null);
    setCreating(false);
  }

  const categories = ["All", ...window.CATEGORIES];

  return (
    <div className="tf-screen-enter">
      <div className="tf-topbar">
        <div className="tf-topbar__title">
          <h1>{v.title}</h1>
          <p>{v.subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="tf-search" onClick={openCmd} style={{ minWidth: 220 }}>
            <Icon name="search" size={14} />
            Find a task…
            <kbd>⌘ K</kbd>
          </button>
          <MagneticButton className="tf-cta" onClick={() => setCreating(true)} style={{ padding: "9px 14px", fontSize: 13 }}>
            <Icon name="plus" size={14} />
            New task
          </MagneticButton>
        </div>
      </div>

      {/* category pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
        {categories.map(c => {
          const active = filter === c;
          const color = c === "All" ? "var(--fg-2)" : window.CATEGORY_COLORS[c];
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 12, fontWeight: 500,
                border: `1px solid ${active ? (c === "All" ? "var(--line-3)" : color) : "var(--line-2)"}`,
                background: active && c !== "All" ? `color-mix(in oklab, ${color} 15%, transparent)` : active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                color: active ? (c === "All" ? "var(--fg-1)" : color) : "var(--fg-3)",
                transition: "all .15s var(--ease-out)",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              {c !== "All" && <span className="tf-cat-dot" style={{ background: color, color, width: 6, height: 6 }} />}
              {c}
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--fg-4)" }}>
                {c === "All" ? tasks.length : tasks.filter(t => t.category === c).length}
              </span>
            </button>
          );
        })}
      </div>

      {v.view !== "board" && (
        <TaskListView
          tasks={visible}
          onToggle={toggleComplete}
          onEdit={setEditing}
          onDelete={deleteTask}
        />
      )}

      {v.view === "board" && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {COLUMNS.map(col => {
          const items = visible.filter(t => t.status === col.id);
          const tone = col.id === "done" ? "var(--success)" : col.id === "doing" ? "var(--acc-2)" : "var(--fg-3)";
          return (
            <div
              key={col.id}
              className={`tf-kcol ${dragOver === col.id ? "is-drop-target" : ""}`}
              onDragOver={(e) => onDragOver(e, col.id)}
              onDragLeave={() => setDragOver(prev => prev === col.id ? null : prev)}
              onDrop={(e) => onDrop(e, col.id)}
            >
              <div className="tf-kcol__head">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span className="tf-cat-dot" style={{ background: tone, color: tone }} />
                  {col.label}
                </span>
                <span className="tf-kcol__count">{items.length}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
                {items.length === 0 && <EmptyColumn />}
                {items.map(t => (
                  <KCard
                    key={t.id}
                    task={t}
                    isDragging={dragId === t.id}
                    onDragStart={(e) => onDragStart(e, t.id)}
                    onDragEnd={onDragEnd}
                    onToggle={() => toggleComplete(t.id)}
                    onEdit={() => setEditing(t)}
                    onDelete={() => deleteTask(t.id)}
                  />
                ))}
              </div>

              <button
                onClick={() => { setCreating(true); }}
                style={{
                  marginTop: 4,
                  padding: "8px 10px",
                  fontSize: 12,
                  color: "var(--fg-4)",
                  borderRadius: 10,
                  border: "1px dashed var(--line-2)",
                  background: "transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "color .15s, border-color .15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-2)"; e.currentTarget.style.borderColor = "var(--line-3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-4)"; e.currentTarget.style.borderColor = "var(--line-2)"; }}
              >
                <Icon name="plus" size={12} />
                Add task
              </button>
            </div>
          );
        })}
      </div>
      )}

      {(editing || creating) && (
        <TaskModal
          task={editing}
          onSave={saveTask}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

function KCard({ task, isDragging, onDragStart, onDragEnd, onToggle, onEdit, onDelete }) {
  const isDone = task.status === "done";
  const catColor = window.CATEGORY_COLORS[task.category];
  const priColor = window.PRIORITY_COLORS[task.priority];

  return (
    <div
      className={`tf-kcard ${isDragging ? "is-dragging" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`tf-check ${isDone ? "is-on" : ""}`}
          style={{ cursor: "pointer" }}
        >
          {isDone && <Icon name="check" size={11} stroke={3} style={{ color: "white" }} />}
        </button>
        <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: isDone ? "var(--fg-3)" : "var(--fg-1)", textDecoration: isDone ? "line-through" : "none", fontWeight: 500 }}>
          {task.content}
        </div>
        <div className="tf-kcard__actions" style={{ display: "flex", gap: 4, opacity: 0, transition: "opacity .15s" }}>
          <button onClick={onEdit} title="Edit" style={{ width: 22, height: 22, borderRadius: 6, color: "var(--fg-3)" }}>
            <Icon name="pencil" size={12} />
          </button>
          <button onClick={onDelete} title="Delete" style={{ width: 22, height: 22, borderRadius: 6, color: "var(--fg-3)" }}>
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>
      {task.description && (
        <p style={{ margin: "0 0 10px 28px", fontSize: 12, color: "var(--fg-3)", lineHeight: 1.4 }}>{task.description}</p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 28 }}>
        <span style={{
          fontSize: 10, padding: "2px 8px", borderRadius: 999,
          background: `color-mix(in oklab, ${catColor} 16%, transparent)`,
          color: catColor,
          border: `1px solid color-mix(in oklab, ${catColor} 25%, transparent)`,
          fontWeight: 500, letterSpacing: "0.02em",
        }}>
          {task.category}
        </span>
        <span style={{ fontSize: 11, color: "var(--fg-4)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon name="clock" size={11} />
          {task.due}
        </span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: priColor, boxShadow: `0 0 8px ${priColor}` }} />
        </span>
      </div>
      <style>{`.tf-kcard:hover .tf-kcard__actions { opacity: 1; }`}</style>
    </div>
  );
}

function TaskListView({ tasks, onToggle, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div style={{
        padding: "60px 24px",
        border: "1px dashed var(--line-2)",
        borderRadius: 14,
        background: "rgba(255,255,255,0.01)",
        textAlign: "center",
        color: "var(--fg-4)",
      }}>
        <Icon name="circleCheck" size={24} style={{ opacity: 0.5, marginBottom: 10 }} />
        <div style={{ fontSize: 14, marginBottom: 4, color: "var(--fg-3)" }}>Nothing to show here.</div>
        <div style={{ fontSize: 12 }}>Press <kbd style={{ fontFamily: "var(--font-mono)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--line-2)", fontSize: 11 }}>N</kbd> to add a task.</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {tasks.map(t => {
        const isDone = t.status === "done";
        const catColor = window.CATEGORY_COLORS[t.category];
        const priColor = window.PRIORITY_COLORS[t.priority];
        return (
          <div key={t.id} className="tf-list-row" style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--line-1)",
            borderRadius: 10,
            transition: "background .15s, border-color .15s",
          }}>
            <button onClick={() => onToggle(t.id)} className={`tf-check ${isDone ? "is-on" : ""}`} style={{ cursor: "pointer" }}>
              {isDone && <Icon name="check" size={11} stroke={3} style={{ color: "white" }} />}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: isDone ? "var(--fg-3)" : "var(--fg-1)", textDecoration: isDone ? "line-through" : "none" }}>
                {t.content}
              </div>
              {t.description && (
                <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.description}
                </div>
              )}
            </div>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: `color-mix(in oklab, ${catColor} 16%, transparent)`, color: catColor, border: `1px solid color-mix(in oklab, ${catColor} 25%, transparent)`, fontWeight: 500, letterSpacing: "0.02em" }}>
              {t.category}
            </span>
            <span style={{ fontSize: 12, color: "var(--fg-4)", minWidth: 70, textAlign: "right" }}>{t.due || "—"}</span>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: priColor, boxShadow: `0 0 8px ${priColor}` }} />
            <div className="tf-list-row__actions" style={{ display: "flex", gap: 4, opacity: 0, transition: "opacity .15s" }}>
              <button onClick={() => onEdit(t)} title="Edit" style={{ width: 24, height: 24, borderRadius: 6, color: "var(--fg-3)" }}>
                <Icon name="pencil" size={12} />
              </button>
              <button onClick={() => onDelete(t.id)} title="Delete" style={{ width: 24, height: 24, borderRadius: 6, color: "var(--fg-3)" }}>
                <Icon name="trash" size={12} />
              </button>
            </div>
          </div>
        );
      })}
      <style>{`.tf-list-row:hover .tf-list-row__actions { opacity: 1; }`}</style>
    </div>
  );
}

function EmptyColumn() {
  return (
    <div style={{
      padding: "24px 12px",
      border: "1px dashed var(--line-2)",
      borderRadius: 12,
      background: "rgba(255,255,255,0.01)",
      textAlign: "center",
      fontSize: 12,
      color: "var(--fg-4)",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      alignItems: "center",
    }}>
      <Icon name="layers" size={18} style={{ opacity: 0.6 }} />
      <span>Drop tasks here</span>
    </div>
  );
}

/* Half-hour slots from 12:00 AM to 11:30 PM, e.g. "4:00 PM". */
const TIME_OPTIONS = (() => {
  const out = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const suffix = h < 12 ? "AM" : "PM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      out.push(`${hour12}:${String(m).padStart(2, "0")} ${suffix}`);
    }
  }
  return out;
})();

/* `due` is stored as one free-text label ("Today, 4:00 PM"). Split it back
   into day and time so editing an existing task repopulates both controls.
   Only a trailing segment that matches a real time slot counts as the time —
   otherwise the whole string is the day ("Next week", "Fri, the 3rd"). */
function splitDue(value) {
  const s = (value || "").trim();
  if (!s) return { day: "", time: "" };
  const i = s.lastIndexOf(",");
  if (i === -1) return { day: s, time: "" };
  const tail = s.slice(i + 1).trim();
  return TIME_OPTIONS.includes(tail)
    ? { day: s.slice(0, i).trim(), time: tail }
    : { day: s, time: "" };
}

function joinDue(day, time) {
  return [day.trim(), time].filter(Boolean).join(", ");
}

function TaskModal({ task, onSave, onClose }) {
  const initialDue = splitDue(task?.due ?? "Today");
  const [content, setContent] = React.useState(task?.content || "");
  const [description, setDescription] = React.useState(task?.description || "");
  const [category, setCategory] = React.useState(task?.category || "Personal");
  const [priority, setPriority] = React.useState(task?.priority || "medium");
  const [dueDay, setDueDay] = React.useState(initialDue.day);
  const [dueTime, setDueTime] = React.useState(initialDue.time);

  React.useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function submit() {
    if (!content.trim()) return;
    onSave({
      ...(task || {}),
      content: content.trim(), description: description.trim(),
      category, priority, due: joinDue(dueDay, dueTime),
      status: task?.status || "todo",
    });
  }

  return (
    <div className="tf-cmd-backdrop" onClick={onClose}>
      <div className="tf-cmd" style={{ width: "min(520px, 92vw)", padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line-1)" }}>
          <div style={{ fontSize: 11, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
            {task ? "Edit task" : "New task"}
          </div>
          <input
            className="tf-input"
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What needs to be done?"
            style={{ fontSize: 17, padding: "10px 12px", background: "transparent", border: "0", borderRadius: 0 }}
          />
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <textarea
            className="tf-input"
            placeholder="Notes (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="tf-label">Category</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {window.CATEGORIES.map(c => {
                  const color = window.CATEGORY_COLORS[c];
                  const on = category === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      style={{
                        padding: "5px 10px",
                        fontSize: 11,
                        borderRadius: 999,
                        border: `1px solid ${on ? color : "var(--line-2)"}`,
                        background: on ? `color-mix(in oklab, ${color} 18%, transparent)` : "transparent",
                        color: on ? color : "var(--fg-3)",
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="tf-label">Priority</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["low", "medium", "high"].map(p => {
                  const color = window.PRIORITY_COLORS[p];
                  const on = priority === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        fontSize: 11,
                        borderRadius: 8,
                        border: `1px solid ${on ? color : "var(--line-2)"}`,
                        background: on ? `color-mix(in oklab, ${color} 18%, transparent)` : "transparent",
                        color: on ? color : "var(--fg-3)",
                        textTransform: "capitalize",
                        fontWeight: 500,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
            <div>
              <label className="tf-label">Due</label>
              <input className="tf-input" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Today" />
            </div>
            <div>
              <label className="tf-label">Time</label>
              <select className="tf-input tf-select" value={dueTime} onChange={(e) => setDueTime(e.target.value)}>
                <option value="">No time</option>
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 22px", borderTop: "1px solid var(--line-1)", background: "rgba(0,0,0,0.2)" }}>
          <button className="tf-ghost" onClick={onClose} style={{ padding: "8px 14px", fontSize: 12 }}>
            Cancel
            <kbd style={{ marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 9, padding: "1px 5px", borderRadius: 3, border: "1px solid var(--line-2)", color: "var(--fg-4)" }}>Esc</kbd>
          </button>
          <button className="tf-cta" onClick={submit} style={{ padding: "8px 14px", fontSize: 12 }}>
            {task ? "Save changes" : "Create task"}
            <kbd style={{ marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: 9, padding: "1px 5px", borderRadius: 3, border: "1px solid rgba(255,255,255,0.25)", color: "white" }}>⌘ ↵</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Tasks, TaskModal });
