# dylanglatt.com

Personal site built with Flask. Features a pixel NYC skyline hero, work showcase, and a private ops dashboard.

## Stack

- Python / Flask
- Vanilla JS + Canvas API
- Plain CSS

## Running locally

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask run
```

Requires a `.env` file with:

```
SECRET_KEY=
OPS_USERNAME=
OPS_PASSWORD_HASH=
```
