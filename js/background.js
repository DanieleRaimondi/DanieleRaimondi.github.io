/* Interactive constellation — full-page, cursor-reactive node network.
   Fixed background layer behind all content (z-index:-1). Dependency-free,
   theme-aware to the site palette, respects prefers-reduced-motion, and
   pauses when the tab is hidden.

   Tuned parameters live in CONFIG — the single place to adjust the look. */
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Touch devices get no cursor interaction — the animation would only burn
  // battery, so skip it entirely.
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

  const CONFIG = {
    density: 0.95,      // node count factor (scaled by viewport area)
    linkDist: 112,      // node-node link distance (px)
    mouseDist: 250,     // cursor influence radius (px)
    attract: 0.024,     // cursor pull strength
    nodeSize: 0.6,      // base node radius multiplier
    linkOpacity: 0.07,  // node-node link alpha
    speed: 0.75,        // motion speed multiplier
    hotRatio: 0.2,      // share of "hot"-coloured accent nodes
    glow: 1,            // soft halo strength on accent / near-cursor nodes
    cursorGlow: 60,     // cursor halo radius (px)
    mix: true,          // colour each link as the blend of its two endpoints
    depth: true,        // per-node depth → subtle mouse parallax
    colors: {
      nodeA: "#4669b9",       // base (cool) nodes
      nodeB: "#ff2ef8",       // hot accent nodes
      link: "#608cd2",        // fixed link colour (used only when mix = false)
      cursorLink: "#ff5e1a",  // links drawn from cursor to nearby nodes
      cursorGlowCol: "#ffc12e", // cursor halo + node "heating" colour
      pulse: "#ff772e",       // click shockwave ring
    },
  };

  const canvas = document.createElement("canvas");
  canvas.className = "bg-canvas";
  canvas.setAttribute("aria-hidden", "true");
  // Critical layout inline so the effect never depends on stylesheet delivery.
  // z-index:-1 keeps it above the body's gradient backdrop but behind every
  // in-flow element and positive-z-index layer on the page.
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "-1",
    pointerEvents: "none",
  });
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = 1;
  let nodes = [];
  let pulses = [];
  const mouse = { x: -9999, y: -9999, active: false };
  let running = false;
  let rafId = null;

  // Colour helpers — hex parsed once into rgb triplets.
  const hex2rgb = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  const smooth = (t) => t * t * (3 - 2 * t);
  const RGB = {};
  for (const k in CONFIG.colors) RGB[k] = hex2rgb(CONFIG.colors[k]);

  function seed() {
    const target = Math.max(18, Math.min(140, Math.round((W * H) / 17000 * CONFIG.density)));
    nodes = Array.from({ length: target }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 0.8 + Math.random() * 1.2,
      z: 0.5 + Math.random() * 0.9,           // depth: drives size, alpha, parallax
      hot: Math.random() < CONFIG.hotRatio,
    }));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  // depth-based parallax offsets (only when the cursor is on screen)
  const px = (n) => (CONFIG.depth && mouse.active ? (mouse.x - W / 2) * 0.012 * (n.z - 1) : 0);
  const py = (n) => (CONFIG.depth && mouse.active ? (mouse.y - H / 2) * 0.012 * (n.z - 1) : 0);

  function step() {
    ctx.clearRect(0, 0, W, H);
    const LINK = CONFIG.linkDist, MD = CONFIG.mouseDist;

    // physics: cursor attraction, click shockwave, damping, idle jitter
    for (const n of nodes) {
      if (mouse.active) {
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < MD && d > 22) {
          const s = 1 - d / MD;
          n.vx += (dx / d) * CONFIG.attract * s * n.z;
          n.vy += (dy / d) * CONFIG.attract * s * n.z;
        }
      }
      for (const p of pulses) {
        const dx = n.x - p.x, dy = n.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (Math.abs(d - p.age * 3.6) < 26) {
          n.vx += (dx / d) * 0.55;
          n.vy += (dy / d) * 0.55;
        }
      }
      n.vx *= 0.985; n.vy *= 0.985;
      const sp = Math.hypot(n.vx, n.vy);
      if (sp > 1.2) { n.vx = (n.vx / sp) * 1.2; n.vy = (n.vy / sp) * 1.2; }
      if (sp < 0.05) {
        n.vx += (Math.random() - 0.5) * 0.06;
        n.vy += (Math.random() - 0.5) * 0.06;
      }
      n.x += n.vx * CONFIG.speed; n.y += n.vy * CONFIG.speed;
      if (n.x < -30) n.x = W + 30; else if (n.x > W + 30) n.x = -30;
      if (n.y < -30) n.y = H + 30; else if (n.y > H + 30) n.y = -30;
    }

    // node-node links (blended colour when mix is on)
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i], ax = a.x + px(a), ay = a.y + py(a);
      const ca = a.hot ? RGB.nodeB : RGB.nodeA;
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          const s = smooth(1 - Math.sqrt(d2) / LINK);
          let col;
          if (CONFIG.mix) {
            const cb = b.hot ? RGB.nodeB : RGB.nodeA;
            col = mix(ca, cb, 0.5);
          } else col = RGB.link;
          ctx.strokeStyle = rgba(col, CONFIG.linkOpacity * s);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(b.x + px(b), b.y + py(b));
          ctx.stroke();
        }
      }
    }

    // cursor: warm links to nearby nodes + glowing hub
    if (mouse.active) {
      for (const n of nodes) {
        const nx = n.x + px(n), ny = n.y + py(n);
        const d = Math.hypot(nx - mouse.x, ny - mouse.y);
        if (d < MD) {
          const s = smooth(1 - d / MD);
          ctx.strokeStyle = rgba(RGB.cursorLink, 0.4 * s);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(nx, ny);
          ctx.stroke();
        }
      }
      if (CONFIG.cursorGlow > 0) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CONFIG.cursorGlow);
        g.addColorStop(0, rgba(RGB.cursorGlowCol, 0.32));
        g.addColorStop(1, rgba(RGB.cursorGlowCol, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, CONFIG.cursorGlow, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // nodes — heat toward the cursor colour, optional soft halo
    for (const n of nodes) {
      const nx = n.x + px(n), ny = n.y + py(n);
      const base = n.hot ? RGB.nodeB : RGB.nodeA;
      let r = CONFIG.nodeSize * n.r * n.z, a = 0.35 + 0.35 * n.z, col = base;
      if (mouse.active) {
        const d = Math.hypot(nx - mouse.x, ny - mouse.y);
        if (d < MD) {
          const s = smooth(1 - d / MD);
          r *= 1 + 0.8 * s;
          a = Math.min(0.95, a + 0.45 * s);
          col = mix(base, RGB.cursorGlowCol, 0.6 * s);
        }
      }
      if (CONFIG.glow > 0 && (n.hot || r > CONFIG.nodeSize * 1.6)) {
        ctx.fillStyle = rgba(col, 0.12 * CONFIG.glow);
        ctx.beginPath();
        ctx.arc(nx, ny, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = rgba(col, a);
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // click shockwave rings
    if (pulses.length) {
      for (const p of pulses) p.age++;
      pulses = pulses.filter((p) => p.age < 85);
      for (const p of pulses) {
        ctx.strokeStyle = rgba(RGB.pulse, Math.max(0, 0.5 * (1 - p.age / 85)));
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.age * 3.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (running) rafId = requestAnimationFrame(step);
  }

  function start() {
    if (!running) { running = true; rafId = requestAnimationFrame(step); }
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : start()
  );

  // cursor position is viewport-relative — matches the fixed canvas directly
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  }, { passive: true });
  document.addEventListener("mouseleave", () => (mouse.active = false));

  // click pulse anywhere except on interactive elements
  window.addEventListener("click", (e) => {
    if (e.target.closest("a, button, input, textarea, select, label")) return;
    pulses.push({ x: e.clientX, y: e.clientY, age: 0 });
  });

  let rT;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(resize, 150);
  });

  resize();
  start();
})();
