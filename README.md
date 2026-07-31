# TaskFlow

A polished personal-productivity web app built with Flask. Plan your day, organize tasks by category, track daily completion streaks, and keep momentum with a dashboard that feels like a real product — not a school project.

> Built with Flask 3 + SQLAlchemy + Tailwind CSS · no build step required.

---

## Features

- **Accounts** — Username/email/password register & login, sessions, password hashing
- **Tasks** — Title, notes, category, priority, due date, completion toggle
- **Categories** — Personal, Work, School, Fitness, Urgent (color-coded chips)
- **Priorities** — Low / Medium / High
- **Dashboard** — Personalized greeting, stats (total/in-progress/completed/overdue), daily progress bar, motivational quote
- **Streaks** — Counts consecutive days you completed at least one task
- **Search & filter** — by text, category, priority, and status
- **Calendar view** — Month grid showing tasks on their due dates
- **Settings** — Display name, theme (light / dark / system), accent color (8 options), default landing page, compact mode
- **Modern UI** — Inter font, soft gradients, hover lifts, staggered list entrance, page fade-in, toast notifications, custom delete confirmation modal, animated checkboxes
- **Responsive** — works on mobile, tablet, and desktop
- **Dark & light mode** — applied before paint to prevent flashes

---

## Quick start

### 1. Make sure Python 3.9+ is installed

```bash
python3 --version
```

### 2. From inside the project folder, create & activate a virtual environment

```bash
cd My_Flask_App

# macOS / Linux
python3 -m venv env
source env/bin/activate

# Windows (PowerShell)
python -m venv env
.\env\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the app

```bash
python app.py
```

The server will start at **<http://127.0.0.1:5001>**.

> The database file (`instance/database.db`) is created automatically on first launch. Schema upgrades to existing databases are applied automatically (new columns are added without losing data).

### 5. Sign up & start using it

1. Open <http://127.0.0.1:5001> in your browser.
2. Click **Create an account** and register.
3. You're in — start adding tasks!

---

## Troubleshooting

### "Address already in use" / port 5001 busy

Another process is using port 5001. Either stop that process, or change the port on the last line of `app.py`:

```python
app.run(debug=True, host="127.0.0.1", port=5002)
```

### `ModuleNotFoundError: No module named 'flask'`

The virtual environment isn't activated, or dependencies weren't installed. Re-run:

```bash
source env/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

### Page won't load styles or JavaScript

Hard-refresh the browser (Cmd/Ctrl + Shift + R). TaskFlow loads Tailwind from a CDN, so an internet connection is required on first load.

### Resetting the database

If you want to wipe all data and start fresh, delete `instance/database.db`. A new empty database will be created the next time you launch the app.

---

## Project structure

```
My_Flask_App/
├── app.py                     # Flask app, models, routes, schema migration
├── requirements.txt           # Python dependencies (Flask, Flask-SQLAlchemy)
├── README.md
├── instance/
│   └── database.db            # SQLite (auto-created)
├── static/
│   ├── css/style.css          # Design tokens, animations, components
│   └── js/script.js           # Theme, sidebar, toasts, delete modal, micro-animations
└── templates/
    ├── base.html              # Global layout (sidebar + main, public auth shell)
    ├── login.html
    ├── register.html
    ├── dashboard.html         # Greeting, stats, quote, streak, recent tasks
    ├── tasks.html             # List + search/filter
    ├── task_form.html         # Create / edit task
    ├── task_detail.html
    ├── calendar.html          # Monthly grid view
    ├── settings.html          # Theme / accent / username / default view
    ├── 404.html
    └── partials/
        ├── _flash.html        # Flash messages → toasts
        ├── _quick_add.html    # One-line add task form
        ├── _sidebar.html      # Nav with categories
        └── _task_card.html    # Reusable task row
```

---

## Tech stack

- **Backend** — Flask 3, Flask-SQLAlchemy, SQLite, Werkzeug (password hashing)
- **Frontend** — Tailwind CSS (CDN), Inter font, vanilla JS, custom CSS for animations & components
- **Storage** — SQLite (file-based, zero config)

---

## License

MIT — feel free to fork it, learn from it, and put it on your resume.
