# dylanglatt.com

Personal site and product hub. Built with Flask.

## Stack

- Python / Flask
- Vanilla JS + Canvas API
- Plain CSS
- SQLite (analytics)

## Running locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in values
flask run
```

## Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Description |
|---|---|
| `SECRET_KEY` | Flask session secret. Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `OPS_USERNAME` | Username for the private ops dashboard |
| `OPS_PASSWORD_HASH` | Bcrypt hash of your ops password. Generate with: `python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('yourpassword'))"` |
| `FLASK_DEBUG` | Set to `true` for local dev, `false` for production |

## Project structure

```
app.py          # routes
auth.py         # ops dashboard auth
config.py       # config from env
analytics.py    # lightweight SQLite event tracking
templates/      # Jinja2 templates
  ops/          # private dashboard views
static/         # CSS, JS, images
data/           # SQLite database (gitignored)
```

## Ops dashboard

A private analytics and admin area at `/ops`. Requires credentials set via `OPS_USERNAME` and `OPS_PASSWORD_HASH` in `.env`. Not accessible without a valid password hash.

## Deployment

Configured for Render / Heroku-style platforms via `Procfile` (`gunicorn app:app`). Set all environment variables in your platform's dashboard. The `data/` directory requires a persistent disk for analytics to survive deploys.
