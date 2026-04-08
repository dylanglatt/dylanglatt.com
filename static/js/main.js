// dylanglatt.com — minimal JS
// No frameworks. No dependencies. Just what's needed.

(function () {
  'use strict';

  // ── Mobile nav toggle ────────────────────────────────────────────────────────
  var hamburger = document.getElementById('nav-hamburger');
  var navLinks  = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close menu when a nav link is clicked
    navLinks.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ── Nav scroll state ─────────────────────────────────────────────────────────
  var nav = document.querySelector('.nav');
  if (nav) {
    var hasHero = !!document.querySelector('.hero');
    function updateNav() {
      nav.classList.toggle('scrolled', !hasHero || window.scrollY > 20);
    }
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
  }

  // ── Hero timestamp clock ─────────────────────────────────────────────────────
  var clockEl = document.getElementById('hero-clock');

  if (clockEl) {
    function updateClock() {
      var now = new Date();
      var time = now.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      clockEl.textContent = time + ' ET';
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ── Scroll fade-up animations ─────────────────────────────────────────────────
  var fadeEls = document.querySelectorAll('.fade-up');

  if (fadeEls.length && 'IntersectionObserver' in window) {
    var fadeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    fadeEls.forEach(function (el) { fadeObserver.observe(el); });
  } else {
    // Fallback: just show everything if IntersectionObserver not supported
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }

  // ── Stagger work grid cards ───────────────────────────────────────────────────
  document.querySelectorAll('.work-grid .card').forEach(function (card, i) {
    card.setAttribute('data-delay', i);
  });

})();
