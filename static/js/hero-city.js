/**
 * hero-city.js — Pixel NYC skyline for hero background
 * Dark buildings with warm amber windows, twinkling stars, shooting stars, and moving cars.
 */
(function () {
  const SZ = 5; // px per grid cell

  // Building shades — very dark, barely above pure black
  const BLDG = ['#0d0d0d', '#101010', '#141414', '#171717', '#1b1b1b'];

  // Window colors — warm amber/gold
  const WIN_LIT = ['#f5c842', '#e8b428', '#fdd55a', '#d9a018'];
  const WIN_OFF = '#131109';

  // Seeded RNG for a deterministic, consistent skyline
  let _s = 58291;
  const rng = () => {
    _s = (Math.imul(_s, 1664525) + 1013904223) | 0;
    return (_s >>> 0) / 0x100000000;
  };

  // Unseeded RNG for dynamic elements (stars, cars)
  const rand = Math.random.bind(Math);

  function build(canvas) {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx  = canvas.getContext('2d');
    const COLS = Math.ceil(canvas.width  / SZ) + 2;
    const ROWS = Math.ceil(canvas.height / SZ);
    // Buildings are anchored to the bottom 48% — same visual zone as before
    const BLDG_ROWS = Math.ceil(canvas.height * 0.48 / SZ);

    _s = 58291; // reset for determinism on every resize

    // ── Generate buildings ─────────────────────────────────────────────────
    const blds = [];
    let cx = 0;

    while (cx < COLS) {
      const w = 3 + Math.floor(rng() * 7);              // 3–9 cols wide
      const tall = rng() > 0.78;                         // ~22% are tall spikes
      const h = tall
        ? Math.floor(BLDG_ROWS * (0.60 + rng() * 0.38)) // tall: 60–98% of building zone
        : Math.floor(BLDG_ROWS * (0.10 + rng() * 0.38)); // short: 10–48%
      const shade = Math.floor(rng() * BLDG.length);
      blds.push({ x: cx, w, h, shade });
      cx += w + (rng() > 0.72 ? 1 : 0);             // occasional 1-cell gap
    }

    // ── Fill pixel grid ────────────────────────────────────────────────────
    // -1 = sky (transparent), 0–4 = building shade index
    const grid = Array.from({ length: ROWS }, () => new Int8Array(COLS).fill(-1));
    for (const b of blds) {
      const top = ROWS - b.h;
      for (let y = top; y < ROWS; y++) {
        for (let x = b.x; x < b.x + b.w && x < COLS; x++) {
          grid[y][x] = b.shade;
        }
      }
    }

    // ── Generate windows ───────────────────────────────────────────────────
    const wins = [];
    _s = 58291;
    for (const b of blds) {
      if (b.w < 4) continue; // too narrow
      const top = ROWS - b.h;
      for (let wy = top + 1; wy < ROWS - 1; wy += 2) {
        for (let wx = b.x + 1; wx < b.x + b.w - 1; wx += 2) {
          wins.push({
            x: wx,
            y: wy,
            col: WIN_LIT[Math.floor(rng() * WIN_LIT.length)],
            on:  rng() > 0.38,                        // ~62% lit
            phase: rng() * Math.PI * 2,
            speed: 0.00012 + rng() * 0.00016,         // very slow flicker
          });
        }
      }
    }

    // ── Generate stars ─────────────────────────────────────────────────────
    // Cover the full canvas — buildings drawn on top mask stars naturally
    const SKY_LIMIT = canvas.height;
    const starCount = Math.floor((canvas.width * SKY_LIMIT) / 520);
    const stars = [];
    for (let i = 0; i < starCount; i++) {
      const size = rand() > 0.85 ? 2 : 1;
      stars.push({
        x: rand() * canvas.width,
        y: rand() * SKY_LIMIT,
        size,
        phase: rand() * Math.PI * 2,
        speed: 0.00025 + rand() * 0.0006,
        baseAlpha: 0.55 + rand() * 0.45,
      });
    }

    // ── Shooting star state ────────────────────────────────────────────────
    let shootingStar = null;
    let nextShoot = 10000 + rand() * 18000; // first one between 10–28s in
    let lastTime = 0;

    function spawnShootingStar() {
      const startX = rand() * canvas.width * 0.65;
      const startY = rand() * SKY_LIMIT * 0.7;
      const trailLen = 18 + Math.floor(rand() * 14);
      shootingStar = {
        x: startX,
        y: startY,
        dx: 5.5 + rand() * 3.5,
        dy: 1.8 + rand() * 2.2,
        trail: [],
        maxTrail: trailLen,
      };
    }


    // ── Render loop ────────────────────────────────────────────────────────
    (function frame(t) {
      const dt = t - lastTime;
      lastTime = t;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ── Stars (drawn first, buildings layer on top naturally) ───────────
      for (const s of stars) {
        const alpha = s.baseAlpha * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#e8eeff';
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
      ctx.globalAlpha = 1;

      // ── Buildings ───────────────────────────────────────────────────────
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const s = grid[y][x];
          if (s >= 0) {
            ctx.fillStyle = BLDG[s];
            ctx.fillRect(x * SZ, y * SZ, SZ, SZ);
          }
        }
      }

      // ── Windows ─────────────────────────────────────────────────────────
      for (const w of wins) {
        const flicker = Math.sin(t * w.speed + w.phase) > -0.55;
        ctx.fillStyle = (w.on && flicker) ? w.col : WIN_OFF;
        ctx.fillRect(w.x * SZ, w.y * SZ, SZ, SZ);
      }

      // ── Shooting star ───────────────────────────────────────────────────
      nextShoot -= dt;
      if (nextShoot <= 0 && !shootingStar) {
        spawnShootingStar();
        nextShoot = 18000 + rand() * 22000; // next: 18–40s later
      }

      if (shootingStar) {
        const ss = shootingStar;
        ss.trail.push({ x: ss.x, y: ss.y });
        if (ss.trail.length > ss.maxTrail) ss.trail.shift();
        ss.x += ss.dx;
        ss.y += ss.dy;

        // Fading trail
        for (let i = 0; i < ss.trail.length; i++) {
          const a = (i / ss.trail.length) * 0.75;
          ctx.globalAlpha = a;
          ctx.fillStyle = '#ffffff';
          const sz = i > ss.trail.length - 3 ? 2 : 1;
          ctx.fillRect(ss.trail[i].x, ss.trail[i].y, sz, sz);
        }
        // Bright head
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ss.x - 1, ss.y - 1, 3, 3);
        ctx.globalAlpha = 1;

        if (ss.x > canvas.width + 20 || ss.y > canvas.height) {
          shootingStar = null;
        }
      }
      ctx.globalAlpha = 1;


      requestAnimationFrame(frame);
    })(0);
  }

  function init(el) {
    build(el);
    let timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => build(el), 150);
    });
  }

  window.HeroCity = { init };
})();
