import os
import json
from datetime import datetime, timezone

EVENTS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'events.jsonl')


def log_event(event_type, data=None):
    """Append an event to the JSONL log. Never crashes the app."""
    try:
        os.makedirs(os.path.dirname(EVENTS_FILE), exist_ok=True)
        event = {
            'ts': datetime.now(timezone.utc).isoformat(),
            'type': event_type,
            'data': data or {}
        }
        with open(EVENTS_FILE, 'a') as f:
            f.write(json.dumps(event) + '\n')
    except Exception:
        pass


def read_events(limit=200):
    """Read events from the JSONL log, most recent first."""
    if not os.path.exists(EVENTS_FILE):
        return []
    events = []
    try:
        with open(EVENTS_FILE, 'r') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        events.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
    except Exception:
        return []
    return list(reversed(events))[:limit]
