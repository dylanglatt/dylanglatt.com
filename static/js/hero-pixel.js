/**
 * Hero pixel art — inspired by The Fool (Eric Clapton's SG)
 * Procedurally generated: dark sky, celestial orb, angel silhouette,
 * gold stars (twinkling), diagonal rainbow bands, green landscape, flames.
 */

(function () {
  const PIXEL = 10;
  const COLS  = 144;
  const ROWS  = 52;

  // ── Palette ──────────────────────────────────────────────────────────────
  const C = {
    void:      '#04061c',
    space1:    '#07103a',
    space2:    '#0c1a56',
    space3:    '#122272',
    blue1:     '#1a3090',
    blue2:     '#2240ae',
    moonCore:  '#090f28',
    moonMid:   '#0f1a48',
    moonRim:   '#192c78',
    moonEdge:  '#2240ae',
    gold:      '#c08808',
    goldMid:   '#e0aa18',
    goldBrt:   '#f4cc38',
    starWht:   '#fff6d8',
    orng1:     '#c03808',
    orng2:     '#e05018',
    orng3:     '#f07030',
    orng4:     '#f09848',
    amber:     '#e8b820',
    red:       '#c01010',
    flame1:    '#e02000',
    flame2:    '#f04810',
    grn1:      '#185228',
    grn2:      '#24703a',
    grn3:      '#389050',
    grn4:      '#58b468',
    yel1:      '#c0a808',
    yel2:      '#dcc018',
    violet:    '#2818a8',
    purple:    '#5818c0',
    magenta:   '#c01898',
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const dist = (x1, y1, x2, y2) =>
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  let _seed = 31337;
  const rand = () => {
    _seed = (_seed * 1664525 + 1013904223) & 0x7fffffff;
    return _seed / 0x7fffffff;
  };

  // ── Grid ──────────────────────────────────────────────────────────────────
  const grid  = Array.from({ length: ROWS }, () => new Array(COLS).fill(C.void));
  const stars = []; // animated

  const set = (x, y, color) => {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) grid[y][x] = color;
  };

  // ── Sky gradient ──────────────────────────────────────────────────────────
  const skyRows = Math.floor(ROWS * 0.72);
  for (let y = 0; y < skyRows; y++) {
    const t = y / skyRows;
    let color;
    if      (t < 0.12) color = C.void;
    else if (t < 0.28) color = C.space1;
    else if (t < 0.44) color = C.space2;
    else if (t < 0.60) color = C.space3;
    else if (t < 0.78) color = C.blue1;
    else               color = C.blue2;
    for (let x = 0; x < COLS; x++) grid[y][x] = color;
  }

  // ── Moon / orb (upper-left quadrant) ─────────────────────────────────────
  const mx = 36, my = 22, mr = 18;
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const d = dist(x, y, mx, my);
      if (d < mr) {
        const t = d / mr;
        if      (t < 0.20) set(x, y, C.moonCore);
        else if (t < 0.45) set(x, y, C.moonMid);
        else if (t < 0.72) set(x, y, C.moonRim);
        else               set(x, y, C.moonEdge);
      }
    }
  }

  // ── Stars ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < 220; i++) {
    const x = Math.floor(rand() * COLS);
    const y = Math.floor(rand() * skyRows);
    if (dist(x, y, mx, my) > mr + 1) {
      const r   = rand();
      const col = r > 0.75 ? C.starWht : r > 0.45 ? C.goldBrt : C.goldMid;
      const alt = rand() > 0.5 ? C.void : C.space1;
      set(x, y, col);
      stars.push({ x, y, col, alt, phase: rand() * Math.PI * 2 });
    }
  }

  // 4-pointed gold stars (The Fool style) scattered through sky
  const bigStars = [
    [10,6],[24,16],[52,5],[68,13],[98,8],[112,21],
    [130,6],[14,38],[46,33],[88,36],[126,38],[58,46],[138,28],[80,10],[20,28],
  ];
  for (const [sx, sy] of bigStars) {
    set(sx,   sy,   C.goldBrt);
    set(sx+1, sy,   C.goldMid);
    set(sx-1, sy,   C.goldMid);
    set(sx,   sy+1, C.goldMid);
    set(sx,   sy-1, C.goldMid);
  }

  // ── Rainbow diagonal bands (right half, middle rows) ─────────────────────
  const bands = [C.red, C.orng3, C.goldBrt, C.grn3, C.blue2, C.violet, C.purple, C.magenta];
  for (let y = 18; y < 46; y++) {
    for (let x = 58; x < COLS; x++) {
      const inZone = y > 22 && y < 44 && x > 62;
      if (!inZone) continue;
      const idx = Math.floor(((x - y * 0.6) % (bands.length * 5) + bands.length * 5) / 5) % bands.length;
      set(x, y, bands[idx]);
    }
  }

  // ── Angel silhouette (center, overlapping moon edge and bands) ────────────
  const ax = 74, ay = 26;

  // Body
  for (let y = ay; y < ay + 13; y++) {
    for (let x = ax - 2; x <= ax + 2; x++) {
      const t = (y - ay) / 13;
      set(x, y, t < 0.3 ? C.orng4 : t < 0.65 ? C.orng3 : C.orng2);
    }
  }

  // Head
  for (let dy = -5; dy <= 0; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dist(dx, dy, 0, -2) < 3.8) set(ax + dx, ay + dy, C.orng4);
    }
  }

  // Halo
  for (let dx = -5; dx <= 5; dx++) {
    set(ax + dx, ay - 6, C.goldBrt);
    set(ax + dx, ay - 7, C.goldMid);
  }
  for (let dy = -6; dy < ay - ay; dy++) {
    set(ax - 5, ay + dy, C.goldBrt);
    set(ax + 5, ay + dy, C.goldBrt);
  }

  // Wings
  for (let i = 0; i < 22; i++) {
    const wy  = ay + 2 + Math.floor(i * 0.35);
    const col = i < 7 ? C.amber : i < 14 ? C.goldMid : C.goldBrt;
    const top = i < 10 ? C.orng4 : C.goldBrt;
    set(ax - 3 - i, wy,     col);
    set(ax - 3 - i, wy - 1, top);
    set(ax + 3 + i, wy,     col);
    set(ax + 3 + i, wy - 1, top);
  }
  // Wing tips
  for (let i = 16; i < 22; i++) {
    set(ax - 3 - i, ay + 3 + Math.floor((i - 15) * 0.7), C.goldMid);
    set(ax + 3 + i, ay + 3 + Math.floor((i - 15) * 0.7), C.goldMid);
  }

  // ── Landscape ─────────────────────────────────────────────────────────────
  const hillY = (x) => Math.floor(
    ROWS * 0.73
    + Math.sin(x * 0.07) * 3
    + Math.sin(x * 0.17 + 1.4) * 2
    + Math.sin(x * 0.04 + 0.9) * 1.5
  );

  for (let x = 0; x < COLS; x++) {
    const base = hillY(x);
    for (let y = base; y < ROWS; y++) {
      const d = y - base;
      if      (d === 0) set(x, y, C.grn4);
      else if (d < 2)   set(x, y, C.grn3);
      else if (d < 5)   set(x, y, C.grn2);
      else              set(x, y, C.grn1);
    }
    // Gold field patches (right portion)
    if (x > 82 && (x % 4) < 2) {
      set(x, base,     C.yel2);
      set(x, base + 1, C.yel1);
    }
  }

  // ── Flames ────────────────────────────────────────────────────────────────
  for (let x = 0; x < COLS; x++) {
    const base  = hillY(x);
    const fh    = Math.floor(2 + Math.sin(x * 0.28) * 1.5 + Math.sin(x * 0.43 + 1.2) * 1);
    const patch = (x + Math.floor(Math.abs(Math.sin(x * 0.31)) * 4)) % 6 < 4;
    if (!patch) continue;
    for (let fy = base - fh; fy < base; fy++) {
      const t = (fy - (base - fh)) / fh;
      set(x, fy, t < 0.3 ? C.goldBrt : t < 0.6 ? C.orng3 : C.flame2);
    }
  }

  // ── Render loop ───────────────────────────────────────────────────────────
  function init(canvasEl) {
    canvasEl.width  = COLS * PIXEL;
    canvasEl.height = ROWS * PIXEL;
    const ctx = canvasEl.getContext('2d');

    (function frame(t) {
      // Twinkle stars
      for (const s of stars) {
        const v = Math.sin(t * 0.0012 + s.phase);
        grid[s.y][s.x] = v > 0.35 ? C.starWht : v > -0.15 ? s.col : s.alt;
      }

      // Draw
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          ctx.fillStyle = grid[y][x];
          ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
        }
      }

      requestAnimationFrame(frame);
    })(0);
  }

  window.HeroPixel = { init };
})();
