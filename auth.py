import os
from functools import wraps
from flask import session, redirect, url_for
from werkzeug.security import check_password_hash


def ops_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('ops_authed'):
            return redirect(url_for('ops_login'))
        return f(*args, **kwargs)
    return decorated


def check_ops_credentials(username, password):
    expected_username = os.environ.get('OPS_USERNAME', '')
    expected_hash = os.environ.get('OPS_PASSWORD_HASH', '')
    if not expected_username or not expected_hash:
        return False
    if username != expected_username:
        return False
    try:
        return check_password_hash(expected_hash, password)
    except Exception:
        return False
