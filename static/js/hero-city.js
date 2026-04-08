/**
 * hero-city.js — Pixel NYC skyline for hero background
 * Dark buildings with warm amber windows, subtle flicker animation.
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

  function build(canvas) {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx  = canvas.getContext('2d');
    const COLS = Math.ceil(canvas.width  / SZ) + 2;
    const ROWS = Math.ceil(canvas.height / SZ);

    _s = 58291; // reset for determinism on every resize

    // ── Generate buildings ─────────────────────────────────────────────────
    const blds = [];
    let cx = 0;

    while (cx < COLS) {
      const w = 3 + Math.floor(rng() * 7);          // 3–9 cols wide
      const tall = rng() > 0.78;                     // ~22% are tall spikes
      const h = tall
        ? Math.floor(ROWS * (0.60 + rng() * 0.38))  // tall: 60–98% of canvas
        : Math.floor(ROWS * (0.10 + rng() * 0.38)); // short: 10–48%
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

    // ── Render loop ────────────────────────────────────────────────────────
    (function frame(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw building pixels
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const s = grid[y][x];
          if (s >= 0) {
            ctx.fillStyle = BLDG[s];
            ctx.fillRect(x * SZ, y * SZ, SZ, SZ);
          }
        }
      }

      // Draw windows
      for (const w of wins) {
        const flicker = Math.sin(t * w.speed + w.phase) > -0.55;
        ctx.fillStyle = (w.on && flicker) ? w.col : WIN_OFF;
        ctx.fillRect(w.x * SZ, w.y * SZ, SZ, SZ);
      }

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
