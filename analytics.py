import os
import json
import sqlite3
import datetime

# DB lives in the data/ folder next to this file.
# On Render: mount a persistent disk at /data and point DB_PATH there.
# Fallback: if DB can't be initialized, events are silently dropped rather
# than crashing the app.
DB_PATH = os.environ.get(
    'DB_PATH',
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'events.db')
)

_db_ok = False


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    global _db_ok
    try:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        with _get_conn() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS events (
                    id        INTEGER PRIMARY KEY AUTOINCREMENT,
                    type      TEXT    NOT NULL,
                    data      TEXT    NOT NULL DEFAULT '{}',
                    timestamp TEXT    NOT NULL
                )
            ''')
            conn.commit()
        _db_ok = True
    except Exception as e:
        print(f'[analytics] DB init failed ({e}). Events will not be stored.')


_init_db()


def log_event(event_type, data=None):
    if not _db_ok:
        return
    ts = datetime.datetime.utcnow().isoformat() + 'Z'
    payload = json.dumps(data or {})
    try:
        with _get_conn() as conn:
            conn.execute(
                'INSERT INTO events (type, data, timestamp) VALUES (?, ?, ?)',
                (event_type, payload, ts)
            )
            conn.commit()
    except Exception as e:
        print(f'[analytics] log_event error: {e}')


def read_events(limit=200):
    if not _db_ok:
        return []
    try:
        with _get_conn() as conn:
            rows = conn.execute(
                'SELECT type, data, timestamp FROM events ORDER BY id DESC LIMIT ?',
                (limit,)
            ).fetchall()
        result = []
        for row in rows:
            try:
                data = json.loads(row['data'])
            except Exception:
                data = {}
            result.append({
                'type':      row['type'],
                'data':      data,
                'timestamp': row['timestamp'],
            })
        return result
    except Exception as e:
        print(f'[analytics] read_events error: {e}')
        return []
