# TaskFlow

A personal productivity web app built with Flask. Organize tasks by category and
priority, track daily completion streaks, and review your week on a calendar.

**[Live demo →](https://taskflow-55tx.onrender.com/)**

> Hosted on a free tier that sleeps when idle, so the first request may take
> around 30 seconds to wake the server.

---

## Features

- **Accounts** — Registration and sign-in with hashed passwords and server-side sessions
- **Tasks** — Title, notes, category, priority, due date, and completion state
- **Views** — Dashboard, board, calendar, and filtered lists for today and inbox
- **Streaks** — Tracks consecutive days with at least one completed task
- **Search** — Filter by text, category, priority, and status
- **Command palette** — Keyboard-driven navigation and task creation
- **Appearance** — Light, dark, and system themes; six accent colors; compact mode and reduced motion

## Tech stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Backend  | Flask 3, Flask-SQLAlchemy, Werkzeug         |
| Frontend | React 18 (loaded from CDN, compiled in-browser), custom CSS |
| Database | SQLite for local development, PostgreSQL in production |
| Server   | Gunicorn                                    |

No build step or Node toolchain is required.

---

## Getting started

Requires Python 3.9 or newer.

```bash
git clone https://github.com/AffanMazhar/TaskFlow.git
cd TaskFlow

python3 -m venv env
source env/bin/activate        # Windows: .\env\Scripts\Activate.ps1

pip install -r requirements.txt
python app.py
```

Open <http://127.0.0.1:5004> and create an account.

The SQLite database is created automatically at `instance/database.db` on first
launch. New columns are added to existing databases without data loss. To start
over, delete the file and restart the app.

To run on a different port, set `PORT=5005 python app.py`.

---

## Configuration

All configuration is read from environment variables.

| Variable       | Default                  | Purpose                                                |
| -------------- | ------------------------ | ------------------------------------------------------ |
| `SECRET_KEY`   | Development fallback     | Signs session cookies. Required in production.         |
| `DATABASE_URL` | `sqlite:///database.db`  | Database connection string.                            |
| `PORT`         | `5004`                   | Local development port.                                |

### Email

Verification and password-reset messages are written to the server log unless
SMTP credentials are configured:

| Variable        | Notes                          |
| --------------- | ------------------------------ |
| `SMTP_HOST`     | Required to send mail          |
| `SMTP_PORT`     | Defaults to `587`              |
| `SMTP_USER`     | Required to send mail          |
| `SMTP_PASSWORD` | Required to send mail          |
| `SMTP_FROM`     | Defaults to `SMTP_USER`        |
| `SMTP_USE_TLS`  | Defaults to `1` (STARTTLS)     |

---

## Deployment

The repository includes `render.yaml`, which [Render](https://render.com) reads
automatically:

1. Sign in with GitHub and choose **New → Blueprint**
2. Select this repository and click **Apply**

This provisions a web service running Gunicorn and a PostgreSQL database, and
generates `SECRET_KEY` on the first deploy. Subsequent pushes to `main` deploy
automatically.

---

## Project structure

```
.
├── app.py                  Application, models, routes, and schema migration
├── requirements.txt        Python dependencies
├── render.yaml             Deployment configuration
├── instance/               SQLite database (git-ignored)
├── static/
│   └── taskflow/           Single-page React interface
│       ├── TaskFlow.html   Entry point
│       └── app/            Components, styles, and API client
└── templates/              Legacy server-rendered views
```

The application serves the React interface in `static/taskflow/`. The Jinja
templates predate it and are retained for reference.

---

## License

MIT
