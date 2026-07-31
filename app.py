"""TaskFlow — a personal productivity Flask app.

Features: auth (username/password), task CRUD, categories, priorities,
due dates, search & filter, calendar view, dashboard stats, daily-completion
streak, customizable theme/accent/username, motivational quotes.
"""

import os
import random
from datetime import datetime, timezone, date, timedelta
from functools import wraps

from flask import (Flask, render_template, redirect, request, url_for,
                   flash, session, g, abort)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from werkzeug.security import generate_password_hash, check_password_hash


app = Flask(__name__)

# In production SECRET_KEY must come from the environment — it signs the
# session cookies, so a known value lets anyone forge a login. Falling back
# to a fixed dev key keeps local runs zero-config.
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or "dev-only-not-for-production"

# DATABASE_URL lets a host point at Postgres; otherwise SQLite in instance/.
# (SQLAlchemy 2 dropped the legacy "postgres://" scheme some hosts still emit.)
_db_url = os.environ.get("DATABASE_URL", "sqlite:///database.db")
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = _db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def today():
    return date.today()


# ── Allowed values ────────────────────────────────────────────────

ALLOWED_THEMES     = {"light", "dark", "system"}
ALLOWED_ACCENTS    = {"indigo", "blue", "violet", "emerald", "rose", "amber", "slate", "teal"}
ALLOWED_VIEWS      = {"dashboard", "tasks", "inprogress", "calendar"}
ALLOWED_PRIORITIES = {"low", "medium", "high"}
ALLOWED_CATEGORIES = ["Personal", "Work", "School", "Fitness", "Urgent"]

CATEGORY_COLORS = {
    "Personal": "violet",
    "Work":     "blue",
    "School":   "emerald",
    "Fitness":  "amber",
    "Urgent":   "rose",
}

QUOTES = [
    ("The secret of getting ahead is getting started.", "Mark Twain"),
    ("Do the hard jobs first. The easy jobs will take care of themselves.", "Dale Carnegie"),
    ("You don't have to be great to start, but you have to start to be great.", "Zig Ziglar"),
    ("Focus on being productive instead of busy.", "Tim Ferriss"),
    ("Action is the foundational key to all success.", "Pablo Picasso"),
    ("Well done is better than well said.", "Benjamin Franklin"),
    ("Small steps every day.", "Anonymous"),
    ("Discipline is choosing between what you want now and what you want most.", "Abraham Lincoln"),
    ("The way to get started is to quit talking and begin doing.", "Walt Disney"),
    ("Done is better than perfect.", "Sheryl Sandberg"),
]


# ── Models ────────────────────────────────────────────────────────

class User(db.Model):
    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(50),  unique=True, nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created       = db.Column(db.DateTime,    default=utc_now)

    streak_count         = db.Column(db.Integer, default=0)
    last_completion_date = db.Column(db.Date)

    # Email verification
    email_verified         = db.Column(db.Boolean,  default=False)
    email_verify_token     = db.Column(db.String(64))

    # Password reset
    pwreset_token   = db.Column(db.String(64))
    pwreset_expires = db.Column(db.DateTime)

    tasks    = db.relationship("Task", backref="owner", lazy=True,
                               cascade="all, delete-orphan")
    settings = db.relationship("UserSettings", backref="user", uselist=False,
                               cascade="all, delete-orphan")

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    @property
    def display_name(self):
        if self.settings and self.settings.display_name:
            return self.settings.display_name
        return self.username or self.email


class UserSettings(db.Model):
    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey("user.id"),
                             unique=True, nullable=False)
    display_name = db.Column(db.String(80))
    theme        = db.Column(db.String(10),  default="system")
    accent       = db.Column(db.String(20),  default="indigo")
    compact_mode = db.Column(db.Boolean,     default=False)
    default_view = db.Column(db.String(20),  default="dashboard")


ALLOWED_STATUSES = {"todo", "doing", "done"}


class Task(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    user_id     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    content     = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    complete    = db.Column(db.Integer,   default=0)
    priority    = db.Column(db.String(10), default="medium")
    category    = db.Column(db.String(20), default="Personal")
    due_date    = db.Column(db.DateTime)
    due_label   = db.Column(db.String(60))
    status      = db.Column(db.String(10), default="todo")
    created     = db.Column(db.DateTime,  default=utc_now)
    completed_at = db.Column(db.DateTime)

    @property
    def is_overdue(self):
        if self.due_date and not self.complete:
            return utc_now() > self.due_date
        return False

    @property
    def category_color(self):
        return CATEGORY_COLORS.get(self.category, "slate")


# ── Schema migration (additive only, SQLite-friendly) ─────────────

def _ensure_schema():
    """Add new columns to existing tables if they're missing.

    Keeps any data in `instance/database.db` intact across feature additions.
    """
    inspector = db.inspect(db.engine)
    if not inspector.has_table("task"):
        # Fresh DB — create_all() will handle everything.
        return

    def cols(table):
        return {c["name"] for c in inspector.get_columns(table)}

    statements = []
    task_cols = cols("task")
    if "category" not in task_cols:
        statements.append("ALTER TABLE task ADD COLUMN category VARCHAR(20) DEFAULT 'Personal'")
    if "status" not in task_cols:
        statements.append("ALTER TABLE task ADD COLUMN status VARCHAR(10) DEFAULT 'todo'")
    if "due_label" not in task_cols:
        statements.append("ALTER TABLE task ADD COLUMN due_label VARCHAR(60)")
    if "completed_at" not in task_cols:
        statements.append("ALTER TABLE task ADD COLUMN completed_at DATETIME")

    user_cols = cols("user")
    if "streak_count" not in user_cols:
        statements.append("ALTER TABLE user ADD COLUMN streak_count INTEGER DEFAULT 0")
    if "last_completion_date" not in user_cols:
        statements.append("ALTER TABLE user ADD COLUMN last_completion_date DATE")
    if "email_verified" not in user_cols:
        statements.append("ALTER TABLE user ADD COLUMN email_verified BOOLEAN DEFAULT 0")
    if "email_verify_token" not in user_cols:
        statements.append("ALTER TABLE user ADD COLUMN email_verify_token VARCHAR(64)")
    if "pwreset_token" not in user_cols:
        statements.append("ALTER TABLE user ADD COLUMN pwreset_token VARCHAR(64)")
    if "pwreset_expires" not in user_cols:
        statements.append("ALTER TABLE user ADD COLUMN pwreset_expires DATETIME")

    if statements:
        with db.engine.begin() as conn:
            for s in statements:
                conn.execute(text(s))
            # Backfill status from the legacy `complete` flag for any rows
            # added before the column existed.
            conn.execute(text(
                "UPDATE task SET status = CASE WHEN complete = 1 THEN 'done' "
                "ELSE 'todo' END WHERE status IS NULL"
            ))


# ── Auth helpers ──────────────────────────────────────────────────

@app.before_request
def load_current_user():
    user_id = session.get("user_id")
    g.user = db.session.get(User, user_id) if user_id else None
    if g.user is not None and g.user.settings is None:
        g.user.settings = UserSettings()
        db.session.commit()


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if g.user is None:
            return redirect(url_for("login", next=request.path))
        return view(*args, **kwargs)
    return wrapped


def get_owned_task_or_404(task_id):
    task = db.session.get(Task, task_id)
    if task is None or task.user_id != g.user.id:
        abort(404)
    return task


def parse_due(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M")
    except ValueError:
        return None


def update_streak(user):
    """Bump the streak when a task is completed.

    Rules: completing one or more tasks on consecutive calendar days extends
    the streak. A skipped day resets it to 1 on the next completion.
    """
    t = today()
    last = user.last_completion_date

    if last == t:
        return  # already counted today
    if last == t - timedelta(days=1):
        user.streak_count = (user.streak_count or 0) + 1
    else:
        user.streak_count = 1
    user.last_completion_date = t


@app.context_processor
def inject_globals():
    return {
        "current_user":  g.user,
        "user_settings": g.user.settings if g.user else None,
        "current_year":  datetime.now().year,
        "categories":    ALLOWED_CATEGORIES,
        "category_colors": CATEGORY_COLORS,
    }


# ── Public / auth routes ──────────────────────────────────────────

@app.route("/")
@app.route("/design")
def index():
    # The new TaskFlow UI handles its own routing (landing → login → dashboard);
    # the old Jinja dashboard is kept at /old-dashboard for reference.
    return redirect(url_for("static", filename="taskflow/TaskFlow.html"))


def _to_new_ui():
    """All legacy Jinja-rendered screens redirect to the new TaskFlow UI."""
    return redirect(url_for("index"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if g.user:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session["user_id"] = user.id
            flash(f"Welcome back, {user.display_name}!", "success")
            return redirect(request.args.get("next") or url_for("index"))
        flash("Wrong username or password.", "error")
    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if g.user:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email    = request.form.get("email", "").strip()
        password = request.form.get("password", "")

        if not username or not email or not password:
            flash("All fields are required.", "error")
        elif len(username) < 3:
            flash("Username must be at least 3 characters.", "error")
        elif len(password) < 6:
            flash("Password must be at least 6 characters.", "error")
        elif User.query.filter_by(username=username).first():
            flash("That username is already taken.", "error")
        elif User.query.filter_by(email=email).first():
            flash("An account with that email already exists.", "error")
        else:
            user = User(username=username, email=email)
            user.set_password(password)
            user.settings = UserSettings()
            db.session.add(user)
            db.session.commit()
            session["user_id"] = user.id
            flash(f"Welcome to TaskFlow, {username}!", "success")
            return redirect(url_for("dashboard"))
    return render_template("register.html")


@app.route("/logout")
def logout():
    session.pop("user_id", None)
    flash("You've been signed out.", "info")
    return redirect(url_for("login"))


# ── Dashboard ─────────────────────────────────────────────────────

@app.route("/dashboard")
def dashboard():
    return _to_new_ui()


# ── Task list views ───────────────────────────────────────────────

@app.route("/tasks")
def tasks():
    return _to_new_ui()


@app.route("/tasks/inprogress")
def inprogress():
    return _to_new_ui()


@app.route("/tasks/completed")
def completed():
    return _to_new_ui()


# ── Calendar view ─────────────────────────────────────────────────

@app.route("/calendar")
def calendar():
    return _to_new_ui()


# ── Legacy task form / detail / toggle routes ─────────────────────
# All redirect to the new UI; mutations go through /api/tasks.

@app.route("/tasks/new", methods=["GET", "POST"])
def new_task():
    return _to_new_ui()


@app.route("/tasks/<int:id>")
def task_detail(id):
    return _to_new_ui()


@app.route("/tasks/<int:id>/edit", methods=["GET", "POST"])
def edit_task(id):
    return _to_new_ui()


@app.route("/tasks/<int:id>/delete", methods=["POST"])
def delete_task(id):
    return _to_new_ui()


@app.route("/tasks/<int:id>/toggle", methods=["POST"])
def toggle_task(id):
    return _to_new_ui()


# ── Settings ──────────────────────────────────────────────────────

@app.route("/settings", methods=["GET", "POST"])
def settings_page():
    return _to_new_ui()


# ── JSON API for the React prototype at /design ───────────────────
#
# All endpoints below return JSON. Auth-required routes return
# {"error": "unauthorized", "login_url": "/login"} with a 401 when
# there's no session — the client uses login_url to redirect.

from flask import jsonify


def api_login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if g.user is None:
            return jsonify(error="unauthorized", login_url=url_for("login")), 401
        return view(*args, **kwargs)
    return wrapped


def _humanize_due(dt):
    """Render a datetime as the prototype-style 'Today, 4:00 PM' label."""
    if dt is None:
        return ""
    d = dt.date()
    t = today()
    delta_days = (d - t).days
    time_str = dt.strftime("%-I:%M %p") if (dt.hour or dt.minute) else ""
    if delta_days == 0:
        return f"Today, {time_str}" if time_str else "Today"
    if delta_days == 1:
        return f"Tomorrow, {time_str}" if time_str else "Tomorrow"
    if delta_days == -1:
        return "Yesterday"
    if 1 < delta_days < 7:
        return dt.strftime("%a")
    return dt.strftime("%b %-d")


def _task_to_json(t):
    return {
        "id":          f"t{t.id}",
        "content":     t.content,
        "description": t.description or "",
        "status":      t.status or ("done" if t.complete else "todo"),
        "priority":    t.priority or "medium",
        "category":    t.category or "Personal",
        "due":         t.due_label or _humanize_due(t.due_date),
    }


def _id_from_client(raw):
    """The prototype prefixes ids with 't' (e.g. 't42'). Strip and int-cast."""
    if raw is None:
        return None
    s = str(raw)
    if s.startswith("t"):
        s = s[1:]
    try:
        return int(s)
    except ValueError:
        return None


@app.route("/api/me")
def api_me():
    # Always returns 200 — the prototype's landing page should be visitable
    # by anonymous users without being bounced to /login.
    if g.user is None:
        return jsonify(authenticated=False, login_url=url_for("login"))
    s = g.user.settings
    return jsonify(
        authenticated=True,
        id=g.user.id,
        username=g.user.username,
        display_name=g.user.display_name,
        email=g.user.email,
        accent=(s.accent if s else "indigo"),
        theme=(s.theme if s else "dark"),
        email_verified=bool(g.user.email_verified),
    )


@app.route("/api/settings", methods=["PATCH"])
@api_login_required
def api_settings_update():
    data = request.get_json(silent=True) or {}
    s = g.user.settings
    if s is None:
        s = UserSettings(user_id=g.user.id)
        db.session.add(s)

    if "accent" in data and data["accent"] in ALLOWED_ACCENTS:
        s.accent = data["accent"]
    if "theme" in data and data["theme"] in ALLOWED_THEMES:
        s.theme = data["theme"]
    if "default_view" in data and data["default_view"] in ALLOWED_VIEWS:
        s.default_view = data["default_view"]
    if "compact_mode" in data:
        s.compact_mode = bool(data["compact_mode"])
    if "display_name" in data:
        s.display_name = (data["display_name"] or "").strip() or None
    db.session.commit()
    return jsonify(ok=True, accent=s.accent, theme=s.theme, display_name=g.user.display_name)


# ── JSON auth (login / register / logout for the React prototype) ─

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        return jsonify(error="invalid_credentials"), 400
    session["user_id"] = user.id
    return jsonify(ok=True)


@app.route("/api/register", methods=["POST"])
def api_register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email    = (data.get("email")    or "").strip()
    password =  data.get("password") or ""

    if not username or not email or not password:
        return jsonify(error="missing_fields"), 400
    if len(username) < 3:
        return jsonify(error="username_too_short"), 400
    if len(password) < 6:
        return jsonify(error="password_too_short"), 400
    if User.query.filter_by(username=username).first():
        return jsonify(error="username_taken"), 400
    if User.query.filter_by(email=email).first():
        return jsonify(error="email_taken"), 400

    user = User(username=username, email=email)
    user.set_password(password)
    user.settings = UserSettings()
    db.session.add(user)
    db.session.commit()
    session["user_id"] = user.id
    return jsonify(ok=True)


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.pop("user_id", None)
    return jsonify(ok=True)


# ── OAuth scaffolding (Google + GitHub) ──────────────────────────
#
# Set these env vars to enable:
#   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
#   GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET
# Redirect URI to register with each provider:
#   <YOUR_HOST>/login/google/callback
#   <YOUR_HOST>/login/github/callback

import os
import secrets as _secrets
import urllib.parse as _urlparse
import urllib.request as _urlreq
import json as _json


OAUTH_PROVIDERS = {
    "google": {
        "label":     "Google",
        "client_id_env":     "GOOGLE_OAUTH_CLIENT_ID",
        "client_secret_env": "GOOGLE_OAUTH_CLIENT_SECRET",
        "auth_url":  "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "user_url":  "https://openidconnect.googleapis.com/v1/userinfo",
        "scope":     "openid email profile",
        "email_key": "email",
        "name_key":  "name",
    },
    "github": {
        "label":     "GitHub",
        "client_id_env":     "GITHUB_OAUTH_CLIENT_ID",
        "client_secret_env": "GITHUB_OAUTH_CLIENT_SECRET",
        "auth_url":  "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "user_url":  "https://api.github.com/user",
        "scope":     "read:user user:email",
        "email_key": "email",
        "name_key":  "name",
    },
}


def _oauth_enabled(provider):
    p = OAUTH_PROVIDERS.get(provider)
    if not p:
        return False
    return bool(os.environ.get(p["client_id_env"]) and
                os.environ.get(p["client_secret_env"]))


@app.route("/api/oauth/providers")
def api_oauth_providers():
    return jsonify(providers={
        name: {"label": p["label"], "enabled": _oauth_enabled(name),
               "start_url": url_for("oauth_start", provider=name)}
        for name, p in OAUTH_PROVIDERS.items()
    })


@app.route("/login/<provider>")
def oauth_start(provider):
    p = OAUTH_PROVIDERS.get(provider)
    if p is None:
        abort(404)
    if not _oauth_enabled(provider):
        return render_template_string(_OAUTH_SETUP_PAGE, provider=provider,
            label=p["label"],
            client_id_env=p["client_id_env"],
            client_secret_env=p["client_secret_env"],
            redirect_uri=url_for("oauth_callback", provider=provider, _external=True))

    state = _secrets.token_urlsafe(24)
    session[f"oauth_state_{provider}"] = state
    params = {
        "client_id":     os.environ[p["client_id_env"]],
        "redirect_uri":  url_for("oauth_callback", provider=provider, _external=True),
        "scope":         p["scope"],
        "state":         state,
        "response_type": "code",
    }
    return redirect(f"{p['auth_url']}?{_urlparse.urlencode(params)}")


@app.route("/login/<provider>/callback")
def oauth_callback(provider):
    p = OAUTH_PROVIDERS.get(provider)
    if p is None:
        abort(404)
    if not _oauth_enabled(provider):
        flash(f"{p['label']} sign-in isn't configured.", "error")
        return redirect(url_for("login"))

    expected = session.pop(f"oauth_state_{provider}", None)
    if not expected or request.args.get("state") != expected:
        flash("OAuth state mismatch — please try again.", "error")
        return redirect(url_for("login"))

    code = request.args.get("code")
    if not code:
        flash("OAuth was cancelled.", "info")
        return redirect(url_for("login"))

    # Exchange code for access token.
    token_data = _urlparse.urlencode({
        "client_id":     os.environ[p["client_id_env"]],
        "client_secret": os.environ[p["client_secret_env"]],
        "code":          code,
        "redirect_uri":  url_for("oauth_callback", provider=provider, _external=True),
        "grant_type":    "authorization_code",
    }).encode()
    req = _urlreq.Request(p["token_url"], data=token_data,
                          headers={"Accept": "application/json"})
    try:
        with _urlreq.urlopen(req, timeout=10) as r:
            token_resp = _json.loads(r.read().decode())
    except Exception:
        flash(f"{p['label']} sign-in failed at token exchange.", "error")
        return redirect(url_for("login"))

    access_token = token_resp.get("access_token")
    if not access_token:
        flash(f"{p['label']} did not return an access token.", "error")
        return redirect(url_for("login"))

    # Fetch the user profile.
    req = _urlreq.Request(p["user_url"], headers={
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
        "User-Agent": "TaskFlow",
    })
    try:
        with _urlreq.urlopen(req, timeout=10) as r:
            profile = _json.loads(r.read().decode())
    except Exception:
        flash(f"{p['label']} sign-in failed at profile lookup.", "error")
        return redirect(url_for("login"))

    email = profile.get(p["email_key"])
    name  = profile.get(p["name_key"]) or (email.split("@")[0] if email else None)
    if not email:
        flash(f"{p['label']} did not return an email address — can't sign you in.", "error")
        return redirect(url_for("login"))

    user = User.query.filter_by(email=email).first()
    if user is None:
        base = (name or email.split("@")[0]).replace(" ", "_").lower()[:40] or "user"
        username = base
        suffix = 1
        while User.query.filter_by(username=username).first():
            suffix += 1
            username = f"{base}{suffix}"
        user = User(username=username, email=email)
        user.set_password(_secrets.token_urlsafe(24))
        user.settings = UserSettings(display_name=name or None)
        db.session.add(user)
        db.session.commit()

    session["user_id"] = user.id
    flash(f"Signed in with {p['label']}.", "success")
    return redirect(url_for("dashboard"))


_OAUTH_SETUP_PAGE = """\
<!doctype html><html><head><title>{{ label }} sign-in — setup</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; background: #050510; color: #eee; padding: 40px; line-height: 1.6; }
  .card { max-width: 640px; margin: 0 auto; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 32px; }
  h1 { margin-top: 0; }
  code { background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, "JetBrains Mono", monospace; font-size: 13px; }
  ol li { margin-bottom: 10px; }
  a { color: #a78bfa; }
</style></head><body><div class="card">
<h1>{{ label }} sign-in isn't configured yet</h1>
<p>Set up an OAuth app, then export the credentials before starting Flask:</p>
<ol>
  <li>Register a new OAuth application with {{ label }}.</li>
  <li>Set its <strong>authorized redirect URI</strong> to: <code>{{ redirect_uri }}</code></li>
  <li>Export the client ID + secret in your shell:
    <pre><code>export {{ client_id_env }}=...
export {{ client_secret_env }}=...</code></pre>
  </li>
  <li>Restart the Flask server.</li>
</ol>
<p><a href="/login">← Back to sign in</a></p>
</div></body></html>
"""

# Late import so the template-string route works without bringing it up top
from flask import render_template_string


@app.route("/api/tasks")
@api_login_required
def api_tasks_list():
    items = (Task.query.filter_by(user_id=g.user.id)
             .order_by(Task.created.desc()).all())
    return jsonify(tasks=[_task_to_json(t) for t in items])


@app.route("/api/tasks", methods=["POST"])
@api_login_required
def api_tasks_create():
    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify(error="content_required"), 400

    category = data.get("category", "Personal")
    if category not in ALLOWED_CATEGORIES:
        category = "Personal"
    priority = data.get("priority", "medium")
    if priority not in ALLOWED_PRIORITIES:
        priority = "medium"
    status = data.get("status", "todo")
    if status not in ALLOWED_STATUSES:
        status = "todo"

    t = Task(
        user_id=g.user.id,
        content=content,
        description=(data.get("description") or "").strip(),
        category=category,
        priority=priority,
        status=status,
        complete=1 if status == "done" else 0,
        due_label=(data.get("due") or "").strip() or None,
        completed_at=utc_now() if status == "done" else None,
    )
    db.session.add(t)
    if status == "done":
        update_streak(g.user)
    db.session.commit()
    return jsonify(task=_task_to_json(t)), 201


@app.route("/api/tasks/<task_id>", methods=["PATCH"])
@api_login_required
def api_tasks_update(task_id):
    pk = _id_from_client(task_id)
    if pk is None:
        abort(404)
    t = get_owned_task_or_404(pk)
    data = request.get_json(silent=True) or {}

    if "content" in data:
        c = (data["content"] or "").strip()
        if not c:
            return jsonify(error="content_required"), 400
        t.content = c
    if "description" in data:
        t.description = (data["description"] or "").strip()
    if "category" in data and data["category"] in ALLOWED_CATEGORIES:
        t.category = data["category"]
    if "priority" in data and data["priority"] in ALLOWED_PRIORITIES:
        t.priority = data["priority"]
    if "due" in data:
        t.due_label = (data["due"] or "").strip() or None
    if "status" in data and data["status"] in ALLOWED_STATUSES:
        was_done = (t.status == "done")
        t.status = data["status"]
        becoming_done = (t.status == "done")
        t.complete = 1 if becoming_done else 0
        if becoming_done and not was_done:
            t.completed_at = utc_now()
            update_streak(g.user)
        elif was_done and not becoming_done:
            t.completed_at = None

    db.session.commit()
    return jsonify(task=_task_to_json(t))


@app.route("/api/tasks/<task_id>", methods=["DELETE"])
@api_login_required
def api_tasks_delete(task_id):
    pk = _id_from_client(task_id)
    if pk is None:
        abort(404)
    t = get_owned_task_or_404(pk)
    db.session.delete(t)
    db.session.commit()
    return jsonify(ok=True)


@app.route("/api/dashboard")
@api_login_required
def api_dashboard():
    base    = Task.query.filter_by(user_id=g.user.id)
    total   = base.count()
    done    = base.filter_by(complete=1).count()
    pending = base.filter_by(complete=0).count()
    overdue = base.filter(
        Task.complete == 0,
        Task.due_date != None,
        Task.due_date < utc_now(),
    ).count()
    pct = int(round((done / total) * 100)) if total else 0

    streak = g.user.streak_count or 0
    last = g.user.last_completion_date
    if last is None or last < today() - timedelta(days=1):
        streak = 0

    # Per-day completed counts for the last 7 days (oldest → newest).
    week = []
    for offset in range(6, -1, -1):
        day = today() - timedelta(days=offset)
        start = datetime.combine(day, datetime.min.time())
        end   = start + timedelta(days=1)
        count = (Task.query.filter_by(user_id=g.user.id)
                 .filter(Task.completed_at != None,
                         Task.completed_at >= start,
                         Task.completed_at <  end)
                 .count())
        week.append({"day": day.strftime("%a"), "count": count})

    quote_text, quote_author = random.choice(QUOTES)
    return jsonify(
        total=total, done=done, pending=pending, overdue=overdue,
        completion_pct=pct, streak=streak, week=week,
        quote={"text": quote_text, "author": quote_author},
    )


def _relative_time(dt):
    if dt is None:
        return ""
    delta = utc_now() - dt
    secs = int(delta.total_seconds())
    if secs < 60:    return f"{secs}s ago"
    if secs < 3600:  return f"{secs // 60}m ago"
    if secs < 86400: return f"{secs // 3600}h ago"
    return f"{secs // 86400}d ago"


@app.route("/api/activity")
@api_login_required
def api_activity():
    """Synthetic activity feed: recent created + completed task events."""
    user_label = g.user.display_name or "You"
    events = []
    recent_created = (Task.query.filter_by(user_id=g.user.id)
                      .order_by(Task.created.desc()).limit(5).all())
    for t in recent_created:
        events.append({
            "id":   f"c{t.id}",
            "who":  user_label,
            "what": "created",
            "obj":  t.content,
            "when": _relative_time(t.created),
            "_ts":  t.created,
        })
    recent_done = (Task.query.filter_by(user_id=g.user.id, complete=1)
                   .filter(Task.completed_at != None)
                   .order_by(Task.completed_at.desc()).limit(5).all())
    for t in recent_done:
        events.append({
            "id":   f"d{t.id}",
            "who":  user_label,
            "what": "completed",
            "obj":  t.content,
            "when": _relative_time(t.completed_at),
            "_ts":  t.completed_at,
        })
    events.sort(key=lambda e: e["_ts"] or datetime.min, reverse=True)
    for e in events:
        e.pop("_ts", None)
    return jsonify(activity=events[:6])


# ── Email verification + password reset ──────────────────────────
#
# SMTP config via env vars. If any are missing, emails are logged to
# stdout instead of sent (so dev still works without credentials).
#   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
#   SMTP_FROM   (defaults to SMTP_USER)
#   SMTP_USE_TLS  (default: "1" — uses STARTTLS)

import smtplib
from email.message import EmailMessage


def _smtp_configured():
    return bool(os.environ.get("SMTP_HOST") and
                os.environ.get("SMTP_USER") and
                os.environ.get("SMTP_PASSWORD"))


def send_email(to_addr, subject, body):
    """Send a plain-text email. Logs to stdout if SMTP isn't configured."""
    sender = os.environ.get("SMTP_FROM") or os.environ.get("SMTP_USER") or "no-reply@taskflow.local"
    if not _smtp_configured():
        print("─" * 60)
        print(f"[DEV EMAIL] would send to {to_addr}")
        print(f"[DEV EMAIL] subject:     {subject}")
        print(f"[DEV EMAIL] from:        {sender}")
        print(f"[DEV EMAIL] body:")
        print(body)
        print("─" * 60)
        return True

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"]    = sender
    msg["To"]      = to_addr
    msg.set_content(body)

    host = os.environ["SMTP_HOST"]
    port = int(os.environ.get("SMTP_PORT", 587))
    use_tls = os.environ.get("SMTP_USE_TLS", "1") not in ("0", "false", "False")
    try:
        with smtplib.SMTP(host, port, timeout=15) as s:
            if use_tls:
                s.starttls()
            s.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
            s.send_message(msg)
        return True
    except Exception as e:
        print(f"[EMAIL] send failed: {e}")
        return False


def _issue_verify_token(user):
    user.email_verify_token = _secrets.token_urlsafe(32)
    db.session.commit()
    return user.email_verify_token


def _issue_pwreset_token(user):
    user.pwreset_token = _secrets.token_urlsafe(32)
    user.pwreset_expires = utc_now() + timedelta(hours=1)
    db.session.commit()
    return user.pwreset_token


def _send_verification_email(user):
    token = _issue_verify_token(user)
    link = url_for("verify_email", token=token, _external=True)
    body = (
        f"Hi {user.display_name},\n\n"
        f"Welcome to TaskFlow! Please confirm your email address by opening this link:\n\n"
        f"  {link}\n\n"
        f"If you didn't sign up, you can ignore this email.\n\n"
        f"— TaskFlow"
    )
    return send_email(user.email, "Confirm your TaskFlow email", body)


def _send_pwreset_email(user):
    token = _issue_pwreset_token(user)
    link = url_for("reset_password", token=token, _external=True)
    body = (
        f"Hi {user.display_name},\n\n"
        f"We received a request to reset your TaskFlow password.\n"
        f"Click the link below within the next hour to choose a new one:\n\n"
        f"  {link}\n\n"
        f"If you didn't request this, ignore this email — your password stays the same.\n\n"
        f"— TaskFlow"
    )
    return send_email(user.email, "Reset your TaskFlow password", body)


@app.route("/verify/<token>")
def verify_email(token):
    user = User.query.filter_by(email_verify_token=token).first()
    if user is None:
        return render_template_string(_VERIFY_RESULT_PAGE,
            ok=False, message="That verification link is invalid or has already been used."), 400
    user.email_verified = True
    user.email_verify_token = None
    db.session.commit()
    return render_template_string(_VERIFY_RESULT_PAGE,
        ok=True, message=f"Email confirmed — welcome, {user.display_name}!")


@app.route("/forgot", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = (request.form.get("email") or "").strip().lower()
        # Always show the same confirmation, even if no account exists,
        # to avoid leaking which emails are registered.
        user = User.query.filter(db.func.lower(User.email) == email).first()
        if user:
            _send_pwreset_email(user)
        flash("If that email is registered, a reset link is on the way.", "success")
        return redirect(url_for("forgot_password"))
    return render_template_string(_FORGOT_PAGE)


@app.route("/reset/<token>", methods=["GET", "POST"])
def reset_password(token):
    user = User.query.filter_by(pwreset_token=token).first()
    if user is None or user.pwreset_expires is None or user.pwreset_expires < utc_now():
        return render_template_string(_RESET_PAGE,
            ok=False, token=token,
            message="This reset link is invalid or has expired. Request a new one."), 400

    if request.method == "POST":
        pw1 = request.form.get("password", "")
        pw2 = request.form.get("password_confirm", "")
        if len(pw1) < 6:
            return render_template_string(_RESET_PAGE,
                ok=False, token=token,
                message="Password must be at least 6 characters."), 400
        if pw1 != pw2:
            return render_template_string(_RESET_PAGE,
                ok=False, token=token,
                message="Passwords don't match."), 400
        user.set_password(pw1)
        user.pwreset_token = None
        user.pwreset_expires = None
        db.session.commit()
        flash("Password updated. Sign in with your new password.", "success")
        return redirect(url_for("login"))

    return render_template_string(_RESET_PAGE, ok=True, token=token, message=None)


@app.route("/api/auth/resend-verify", methods=["POST"])
@api_login_required
def api_resend_verification():
    if g.user.email_verified:
        return jsonify(ok=True, already_verified=True)
    _send_verification_email(g.user)
    return jsonify(ok=True)


# Hook into the existing register flows to send the verification email
# whenever a brand-new user is created.
def _register_with_verification_wrapper(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        before = User.query.count()
        resp = view(*args, **kwargs)
        # If a user was added by this request, send them the verify email.
        if User.query.count() > before:
            new_user = User.query.order_by(User.id.desc()).first()
            if new_user and not new_user.email_verified:
                _send_verification_email(new_user)
        return resp
    return wrapped


# Replace the bound view functions on the URL map so the wrapper runs.
# (Flask resolves endpoints by name to the wrapped callable.)
app.view_functions["api_register"] = _register_with_verification_wrapper(api_register)
app.view_functions["register"]     = _register_with_verification_wrapper(register)


_FORGOT_PAGE = """\
<!doctype html><html><head><title>Reset your password</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; background: #050510; color: #eee; min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 40px; }
  .card { width: 100%; max-width: 420px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 36px; }
  h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: -0.02em; }
  p  { color: rgba(255,255,255,0.55); margin: 0 0 22px; font-size: 14px; line-height: 1.5; }
  label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
  input[type=email] { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 14px; box-sizing: border-box; }
  input[type=email]:focus { outline: none; border-color: rgba(139,92,246,0.5); }
  button { width: 100%; margin-top: 18px; padding: 13px 16px; border: 0; border-radius: 999px; background: linear-gradient(135deg, #4f6dd1, #7a6cc4, #a26fcf); color: white; font-size: 14px; font-weight: 500; cursor: pointer; }
  .flash { padding: 10px 14px; background: rgba(74,222,128,0.10); border: 1px solid rgba(74,222,128,0.35); border-radius: 10px; color: #86efac; font-size: 13px; margin-bottom: 18px; }
  a { color: #a78bfa; text-decoration: none; font-size: 13px; }
</style></head><body><div class="card">
<h1>Reset your password</h1>
<p>Enter the email you signed up with. We'll send you a one-time link to choose a new password.</p>
{% with messages = get_flashed_messages(with_categories=true) %}
  {% for cat, msg in messages %}<div class="flash">{{ msg }}</div>{% endfor %}
{% endwith %}
<form method="post">
  <label>Email</label>
  <input type="email" name="email" placeholder="you@example.com" required autofocus>
  <button type="submit">Send reset link</button>
</form>
<p style="margin: 22px 0 0; text-align: center;"><a href="/login">← Back to sign in</a></p>
</div></body></html>
"""


_RESET_PAGE = """\
<!doctype html><html><head><title>Choose a new password</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; background: #050510; color: #eee; min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 40px; }
  .card { width: 100%; max-width: 420px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 36px; }
  h1 { margin: 0 0 8px; font-size: 24px; letter-spacing: -0.02em; }
  p  { color: rgba(255,255,255,0.55); margin: 0 0 22px; font-size: 14px; line-height: 1.5; }
  label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); margin-bottom: 8px; margin-top: 14px; }
  input { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: #fff; font-size: 14px; box-sizing: border-box; }
  input:focus { outline: none; border-color: rgba(139,92,246,0.5); }
  button { width: 100%; margin-top: 22px; padding: 13px 16px; border: 0; border-radius: 999px; background: linear-gradient(135deg, #4f6dd1, #7a6cc4, #a26fcf); color: white; font-size: 14px; font-weight: 500; cursor: pointer; }
  .err { padding: 10px 14px; background: rgba(251,113,133,0.10); border: 1px solid rgba(251,113,133,0.35); border-radius: 10px; color: #fda4af; font-size: 13px; margin-bottom: 18px; }
  a { color: #a78bfa; text-decoration: none; font-size: 13px; }
</style></head><body><div class="card">
<h1>{{ "Choose a new password" if ok else "Reset link unavailable" }}</h1>
{% if message %}<div class="err">{{ message }}</div>{% endif %}
{% if ok %}
<form method="post">
  <label>New password</label>
  <input type="password" name="password" minlength="6" placeholder="At least 6 characters" required autofocus>
  <label>Confirm password</label>
  <input type="password" name="password_confirm" minlength="6" required>
  <button type="submit">Update password</button>
</form>
{% else %}
<p><a href="/forgot">← Request a new reset link</a></p>
{% endif %}
</div></body></html>
"""


_VERIFY_RESULT_PAGE = """\
<!doctype html><html><head><title>Email verification</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; background: #050510; color: #eee; min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 40px; text-align: center; }
  .card { max-width: 480px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 18px; padding: 40px; }
  h1 { margin: 0 0 12px; font-size: 24px; letter-spacing: -0.02em; }
  p  { color: rgba(255,255,255,0.6); margin: 0 0 22px; line-height: 1.5; }
  a.btn { display: inline-block; padding: 11px 20px; border-radius: 999px; background: linear-gradient(135deg, #4f6dd1, #7a6cc4, #a26fcf); color: white; text-decoration: none; font-size: 14px; font-weight: 500; }
  .icon { font-size: 36px; margin-bottom: 18px; }
</style></head><body><div class="card">
<div class="icon">{{ "✓" if ok else "✕" }}</div>
<h1>{{ "Email confirmed" if ok else "Verification failed" }}</h1>
<p>{{ message }}</p>
<a class="btn" href="/">Open TaskFlow</a>
</div></body></html>
"""


# ── 404 ───────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(_):
    return render_template("404.html"), 404


# ── Entrypoint ────────────────────────────────────────────────────

# Runs on import, not just under `python app.py`, so that a WSGI server
# (gunicorn) also gets its tables created and schema migrated on boot.
with app.app_context():
    db.create_all()
    _ensure_schema()


if __name__ == "__main__":
    # Local development only. In production gunicorn imports `app` directly
    # and this block never runs — so debug can never be on in the deployment.
    app.run(debug=True, host="127.0.0.1", port=int(os.environ.get("PORT", 5004)))
