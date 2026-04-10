import os
from flask import Flask, render_template, request, redirect, url_for, session, Response

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


@app.route('/work/argus')
def work_argus():
    log_event('pageview', {'page': 'work_argus', 'ip': _client_ip()})
    return render_template('work_argus.html')


@app.route('/work/job-scraper')
def work_job_scanner():
    log_event('pageview', {'page': 'work_job_scanner', 'ip': _client_ip()})
    return render_template('work_job_scanner.html')


@app.route('/about')
def about():
    log_event('pageview', {'page': 'about', 'ip': _client_ip()})
    return render_template('about.html')


@app.route('/contact')
def contact():
    # Contact page removed — redirect to About which has email + LinkedIn.
    return redirect(url_for('about'), 301)


# ── Utility routes ─────────────────────────────────────────────────────────────

@app.route('/robots.txt')
def robots():
    lines = [
        'User-agent: *',
        'Allow: /',
        '',
        'Sitemap: https://dylanglatt.com/sitemap.xml',
    ]
    return Response('\n'.join(lines), mimetype='text/plain')


@app.route('/sitemap.xml')
def sitemap():
    pages = ['/', '/work', '/work/riffd', '/work/argus', '/about']
    urls = ''.join(
        f'  <url><loc>https://dylanglatt.com{p}</loc></url>\n'
        for p in pages
    )
    xml = f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>'
    return Response(xml, mimetype='application/xml')


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
    contacts  = [e for e in events if e.get('type') == 'contact_form']

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


# ── Error handlers ─────────────────────────────────────────────────────────────

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('404.html'), 500


# ── Run ────────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    app.run(debug=True, port=5002)
