import os
import json
from flask import Flask, render_template, request, redirect, url_for, session

from config import Config
from auth import ops_required, check_ops_credentials
from analytics import log_event, read_events

app = Flask(__name__)
app.config.from_object(Config)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _client_ip():
    return request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip()


# ── Public routes ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    log_event('pageview', {'page': 'home', 'ip': _client_ip()})
    return render_template('index.html')


@app.route('/work')
def work():
    log_event('pageview', {'page': 'work', 'ip': _client_ip()})
    return render_template('work.html')


@app.route('/work/riffd')
def work_riffd():
    log_event('pageview', {'page': 'work_riffd', 'ip': _client_ip()})
    return render_template('work_riffd.html')


@app.route('/about')
def about():
    log_event('pageview', {'page': 'about', 'ip': _client_ip()})
    return render_template('about.html')


@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        message = request.form.get('message', '').strip()
        if name and email and message:
            log_event('contact_form', {
                'name': name,
                'email': email,
                'message': message,
                'ip': _client_ip()
            })
            return render_template('contact.html', submitted=True)
        return render_template('contact.html', error=True,
                               name=name, email=email, message=message)
    return render_template('contact.html')


# ── Ops routes ─────────────────────────────────────────────────────────────────

@app.route('/ops/login', methods=['GET', 'POST'])
def ops_login():
    if session.get('ops_authed'):
        return redirect(url_for('ops_dashboard'))
    error = False
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        if check_ops_credentials(username, password):
            session['ops_authed'] = True
            session.permanent = False
            return redirect(url_for('ops_dashboard'))
        error = True
    return render_template('ops/login.html', error=error)


@app.route('/ops/logout')
def ops_logout():
    session.pop('ops_authed', None)
    return redirect(url_for('index'))


@app.route('/ops')
@ops_required
def ops_dashboard():
    events = read_events(limit=500)
    pageviews = [e for e in events if e.get('type') == 'pageview']
    contacts = [e for e in events if e.get('type') == 'contact_form']

    page_counts = {}
    for e in pageviews:
        page = e.get('data', {}).get('page', 'unknown')
        page_counts[page] = page_counts.get(page, 0) + 1

    return render_template('ops/dashboard.html',
        recent_events=events[:15],
        total_pageviews=len(pageviews),
        total_contacts=len(contacts),
        total_events=len(events),
        page_counts=sorted(page_counts.items(), key=lambda x: x[1], reverse=True)
    )


@app.route('/ops/site')
@ops_required
def ops_site():
    events = read_events(limit=500)
    pageviews = [e for e in events if e.get('type') == 'pageview']

    # Group by page
    page_counts = {}
    for e in pageviews:
        page = e.get('data', {}).get('page', 'unknown')
        page_counts[page] = page_counts.get(page, 0) + 1

    return render_template('ops/site.html',
        pageviews=pageviews[:100],
        page_counts=sorted(page_counts.items(), key=lambda x: x[1], reverse=True)
    )


@app.route('/ops/events')
@ops_required
def ops_events():
    events = read_events(limit=200)
    return render_template('ops/events.html', events=events)


# ── Run ────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(debug=True, port=5002)
