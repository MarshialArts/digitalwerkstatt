// ============================================================================
// digitalwerkstatt — Main Application Logic (js/app.js)
// ============================================================================

// 1. Auto Day/Night Theme (Day: Bright Milky iOS, Night: Thick Graphite Gray)
let isDark = false;

function initTheme() {
  const h = new Date().getHours();
  isDark = (h < 7 || h >= 19);
  applyTheme();
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark);
  const themeText = document.getElementById('themeText');
  const themeDot = document.getElementById('themeDot');
  if (themeText) themeText.textContent = isDark ? 'NACHT' : 'TAG';
  if (themeDot) themeDot.style.backgroundColor = isDark ? '#D4AF37' : '#B68D40';
}

function toggleTheme() {
  isDark = !isDark;
  applyTheme();
}

// 2. SLOWER Mini Drones Flying Out of the 'dw' Circle on Top-Left Hover
let lastSwarmTime = 0;

function spawnLogoDrones(e) {
  const now = Date.now();
  if (now - lastSwarmTime < 1400) return;
  lastSwarmTime = now;

  const circle = document.getElementById('dwCircle');
  if (!circle) return;

  const rect = circle.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  const droneCount = 6;
  for (let i = 0; i < droneCount; i++) {
    const drone = document.createElement('div');
    drone.className = 'swarm-drone';
    drone.style.left = startX + 'px';
    drone.style.top = startY + 'px';

    // Crisp Black & Gold Quadcopter SVG (28x28px for clear visibility)
    drone.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M6 6L22 22M22 6L6 22" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
        <circle cx="14" cy="14" r="3.6" fill="#111113" stroke="#D4AF37" stroke-width="1.6"/>
        <circle cx="6" cy="6" r="4" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 2"/>
        <circle cx="22" cy="6" r="4" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 2"/>
        <circle cx="6" cy="22" r="4" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 2"/>
        <circle cx="22" cy="22" r="4" stroke="#D4AF37" stroke-width="1.4" stroke-dasharray="2 2"/>
      </svg>
    `;
    document.body.appendChild(drone);

    // Smooth, slow trajectory so every drone is clearly recognizable
    const angle = (Math.PI * 0.06) + (i / (droneCount - 1)) * (Math.PI * 0.72) + (Math.random() * 0.14 - 0.07);
    const distance = 200 + Math.random() * 260;
    const midX = Math.cos(angle - 0.2) * (distance * 0.5);
    const midY = Math.sin(angle - 0.2) * (distance * 0.5) - 20;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;
    const tilt = (Math.random() * 36 - 18);

    const anim = drone.animate([
      { transform: 'translate(-50%, -50%) scale(0.4) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${midX * 0.5}px), calc(-50% + ${midY * 0.5}px)) scale(1.1) rotate(${tilt * 0.5}deg)`, opacity: 1, offset: 0.25 },
      { transform: `translate(calc(-50% + ${midX}px), calc(-50% + ${midY}px)) scale(1.15) rotate(${tilt}deg)`, opacity: 0.95, offset: 0.65 },
      { transform: `translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)) scale(0.75) rotate(${tilt * 1.3}deg)`, opacity: 0 }
    ], {
      duration: 3400 + Math.random() * 1200, // 3.4s - 4.6s slow & graceful flight
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
    });

    anim.onfinish = () => drone.remove();
  }
}

// 3. AMBIENT BACKGROUND EFFECT BEHIND THE 3 MAIN CARDS
const bgCanvas = document.getElementById('ambientBgCanvas');
const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
let activeEffect = null; // 'neural' | 'milestones' | 'digital3d' | null
let effectOrigin = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let spreadRadius = 0;
let effectAlpha = 0;
let isHoveringCard = false;
let bgTime = 0;

// Pre-generate nodes for smooth animations
const neuralNodes = Array.from({ length: 44 }, () => ({
  x: Math.random(),
  y: Math.random(),
  vx: (Math.random() - 0.5) * 0.0005,
  vy: (Math.random() - 0.5) * 0.0005,
  r: 2 + Math.random() * 2.5
}));

const milestoneTracks = [
  { yRatio: 0.24, label: 'M1 // KONZEPT & CAD', phase: 0.1 },
  { yRatio: 0.42, label: 'M2 // DMU & FREIGABE', phase: 0.35 },
  { yRatio: 0.60, label: 'M3 // PROTOTYP & TOOLING', phase: 0.6 },
  { yRatio: 0.78, label: 'SOP // SERIENANLAUF', phase: 0.82 }
];

const digitalItems = Array.from({ length: 18 }, (_, idx) => ({
  x: (idx % 6 + 0.5) / 6 + (Math.random() * 0.08 - 0.04),
  y: (Math.floor(idx / 6) + 0.5) / 3 + (Math.random() * 0.1 - 0.05),
  type: idx % 3, // 0: 3D cube, 1: IT symbol, 2: 3D axis
  sym: ['</>', '{ }', '[3D]', 'UAV', 'AI', 'CAD'][idx % 6],
  speed: 0.6 + Math.random() * 0.6,
  offset: Math.random() * Math.PI * 2
}));

function resizeBgCanvas() {
  if (!bgCanvas) return;
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeBgCanvas);

function activateCardBgEffect(type, cardEl) {
  if (!cardEl) return;
  const rect = cardEl.getBoundingClientRect();
  effectOrigin = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
  if (activeEffect !== type) {
    spreadRadius = 60; // Start right behind the hovered card
  }
  activeEffect = type;
  isHoveringCard = true;
}

function deactivateCardBgEffect() {
  isHoveringCard = false;
}

function renderAmbientBg() {
  if (!bgCanvas || !bgCtx) return;

  const w = bgCanvas.width;
  const h = bgCanvas.height;
  bgCtx.clearRect(0, 0, w, h);

  const maxDiag = Math.hypot(w, h);
  if (isHoveringCard) {
    spreadRadius = Math.min(maxDiag, spreadRadius + 14); // Slow, elegant expansion across the page
    effectAlpha = Math.min(1, effectAlpha + 0.035);
  } else {
    effectAlpha = Math.max(0, effectAlpha - 0.03);
    if (effectAlpha <= 0.01) activeEffect = null;
  }

  if (activeEffect && effectAlpha > 0.01) {
    bgTime += 0.016;
    const goldRGB = isDark ? '212, 175, 55' : '182, 141, 64';
    const secRGB = isDark ? '245, 245, 247' : '40, 40, 45';

    bgCtx.save();

    // Soft radial glow expanding from behind the hovered card
    const maskGrad = bgCtx.createRadialGradient(
      effectOrigin.x, effectOrigin.y, 10,
      effectOrigin.x, effectOrigin.y, Math.max(120, spreadRadius)
    );
    maskGrad.addColorStop(0, `rgba(${goldRGB}, ${0.12 * effectAlpha})`);
    maskGrad.addColorStop(0.6, `rgba(${goldRGB}, ${0.05 * effectAlpha})`);
    maskGrad.addColorStop(1, 'rgba(0,0,0,0)');
    bgCtx.fillStyle = maskGrad;
    bgCtx.fillRect(0, 0, w, h);

    // Clip drawing region to the expanding circle
    bgCtx.beginPath();
    bgCtx.arc(effectOrigin.x, effectOrigin.y, spreadRadius, 0, Math.PI * 2);
    bgCtx.clip();

    // EFFECT 1: CONSULTING -> NEURAL NETWORK
    if (activeEffect === 'neural') {
      for (let i = 0; i < neuralNodes.length; i++) {
        const n = neuralNodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0.04 || n.x > 0.96) n.vx *= -1;
        if (n.y < 0.06 || n.y > 0.94) n.vy *= -1;

        const px = n.x * w;
        const py = n.y * h;

        for (let j = i + 1; j < neuralNodes.length; j++) {
          const m = neuralNodes[j];
          const qx = m.x * w;
          const qy = m.y * h;
          const dist = Math.hypot(px - qx, py - qy);
          if (dist < 210) {
            const lineAlpha = (1 - dist / 210) * 0.26 * effectAlpha;
            bgCtx.strokeStyle = `rgba(${goldRGB}, ${lineAlpha})`;
            bgCtx.lineWidth = 1.1;
            bgCtx.beginPath();
            bgCtx.moveTo(px, py);
            bgCtx.lineTo(qx, qy);
            bgCtx.stroke();

            // Synaptic pulse along connection
            if ((i + j) % 5 === 0) {
              const t = (bgTime * 0.45 + i * 0.17) % 1;
              const sx = px + (qx - px) * t;
              const sy = py + (qy - py) * t;
              bgCtx.fillStyle = `rgba(${goldRGB}, ${0.65 * effectAlpha})`;
              bgCtx.beginPath();
              bgCtx.arc(sx, sy, 2.2, 0, Math.PI * 2);
              bgCtx.fill();
            }
          }
        }

        bgCtx.fillStyle = `rgba(${goldRGB}, ${0.45 * effectAlpha})`;
        bgCtx.beginPath();
        bgCtx.arc(px, py, n.r, 0, Math.PI * 2);
        bgCtx.fill();
      }
    }

    // EFFECT 2: PROJEKTLEITUNG -> MILESTONES & PROJECT PLANNING
    if (activeEffect === 'milestones') {
      bgCtx.font = '500 10px monospace';
      milestoneTracks.forEach((track, idx) => {
        const y = track.yRatio * h;
        const startX = w * 0.08;
        const endX = w * 0.92;

        // Timeline baseline
        bgCtx.strokeStyle = `rgba(${goldRGB}, ${0.22 * effectAlpha})`;
        bgCtx.lineWidth = 1;
        bgCtx.setLineDash([6, 6]);
        bgCtx.beginPath();
        bgCtx.moveTo(startX, y);
        bgCtx.lineTo(endX, y);
        bgCtx.stroke();
        bgCtx.setLineDash([]);

        // Gantt bar segment
        const barStart = startX + (endX - startX) * (0.08 + idx * 0.18);
        const barWidth = (endX - startX) * (0.22 + Math.sin(bgTime * 0.8 + idx) * 0.03);
        bgCtx.fillStyle = `rgba(${goldRGB}, ${0.14 * effectAlpha})`;
        bgCtx.strokeStyle = `rgba(${goldRGB}, ${0.45 * effectAlpha})`;
        bgCtx.lineWidth = 1.2;
        bgCtx.beginPath();
        if (bgCtx.roundRect) {
          bgCtx.roundRect(barStart, y - 10, barWidth, 20, 6);
        } else {
          bgCtx.rect(barStart, y - 10, barWidth, 20);
        }
        bgCtx.fill();
        bgCtx.stroke();

        // Milestone Diamond Gate
        const gateX = barStart + barWidth;
        bgCtx.save();
        bgCtx.translate(gateX, y);
        bgCtx.rotate(Math.PI / 4);
        bgCtx.fillStyle = `rgba(${goldRGB}, ${0.8 * effectAlpha})`;
        bgCtx.fillRect(-5, -5, 10, 10);
        bgCtx.restore();

        // Label
        bgCtx.fillStyle = `rgba(${secRGB}, ${0.45 * effectAlpha})`;
        bgCtx.fillText(track.label, barStart + 10, y + 3.5);

        // Dependency connector to next track
        if (idx < milestoneTracks.length - 1) {
          const nextY = milestoneTracks[idx + 1].yRatio * h;
          const nextStart = startX + (endX - startX) * (0.08 + (idx + 1) * 0.18);
          bgCtx.strokeStyle = `rgba(${goldRGB}, ${0.28 * effectAlpha})`;
          bgCtx.beginPath();
          bgCtx.moveTo(gateX, y + 7);
          bgCtx.lineTo(gateX, (y + nextY) / 2);
          bgCtx.lineTo(nextStart, (y + nextY) / 2);
          bgCtx.lineTo(nextStart, nextY - 10);
          bgCtx.stroke();
        }
      });
    }

    // EFFECT 3: DIGITALISIERUNG -> 3D WIREFRAMES & IT SYMBOLS
    if (activeEffect === 'digital3d') {
      bgCtx.font = '600 12px monospace';
      digitalItems.forEach((item) => {
        const cx = item.x * w;
        const cy = item.y * h + Math.sin(bgTime * item.speed + item.offset) * 12;
        const a = bgTime * 0.7 * item.speed + item.offset;

        if (item.type === 0) {
          // Rotating 3D isometric wireframe cube
          const size = 22;
          const pts3D = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
          ].map(([x, y, z]) => {
            const rx = x * Math.cos(a) - z * Math.sin(a);
            const rz = z * Math.cos(a) + x * Math.sin(a);
            const ry = y * Math.cos(0.5) - rz * Math.sin(0.5);
            return [cx + rx * size, cy + ry * size];
          });

          const edges = [
            [0,1],[1,2],[2,3],[3,0],
            [4,5],[5,6],[6,7],[7,4],
            [0,4],[1,5],[2,6],[3,7]
          ];
          bgCtx.strokeStyle = `rgba(${goldRGB}, ${0.38 * effectAlpha})`;
          bgCtx.lineWidth = 1.1;
          bgCtx.beginPath();
          edges.forEach(([u, v]) => {
            bgCtx.moveTo(pts3D[u][0], pts3D[u][1]);
            bgCtx.lineTo(pts3D[v][0], pts3D[v][1]);
          });
          bgCtx.stroke();
        } else if (item.type === 1) {
          // IT / Code Symbol Badge
          bgCtx.fillStyle = `rgba(${goldRGB}, ${0.42 * effectAlpha})`;
          bgCtx.fillText(item.sym, cx - 14, cy);
          bgCtx.strokeStyle = `rgba(${goldRGB}, ${0.22 * effectAlpha})`;
          bgCtx.strokeRect(cx - 22, cy - 14, 44, 20);
        } else {
          // 3D Coordinate Axis Crosshair
          const len = 20;
          bgCtx.strokeStyle = `rgba(${goldRGB}, ${0.35 * effectAlpha})`;
          bgCtx.beginPath();
          bgCtx.moveTo(cx, cy); bgCtx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.5);
          bgCtx.moveTo(cx, cy); bgCtx.lineTo(cx, cy - len);
          bgCtx.moveTo(cx, cy); bgCtx.lineTo(cx - Math.sin(a) * len, cy + Math.cos(a) * len * 0.5);
          bgCtx.stroke();
          bgCtx.fillStyle = `rgba(${goldRGB}, ${0.5 * effectAlpha})`;
          bgCtx.beginPath();
          bgCtx.arc(cx, cy, 2.5, 0, Math.PI * 2);
          bgCtx.fill();
        }
      });
    }

    bgCtx.restore();
  }

  requestAnimationFrame(renderAmbientBg);
}

// 3b. Intro: 3D-Neuronalnetz, Kamera fliegt hindurch, Iris-Übergang gibt die Seite frei (Einstellungen: INTRO_MS)
const INTRO_MS = 2100;
function runIntro() {
  const cv = document.getElementById('introNet');
  if (!cv) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { cv.remove(); return; }
  const g = cv.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  document.body.classList.add('intro-pre');

  const small = W < 640;
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  // Schichten entlang z; Kamera startet davor und fliegt hindurch
  const LAYERS = 10, GAP = 150, ZLEN = (LAYERS - 1) * GAP;
  const nodes = [], layerIdx = [];
  for (let l = 0; l < LAYERS; l++) {
    const n = (small ? 9 : 15) + Math.floor(rnd() * 6);
    const R = 150 + Math.sin(l / (LAYERS - 1) * Math.PI) * 170;
    layerIdx.push([]);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * R;
      nodes.push({ x: Math.cos(a) * r * 1.25, y: Math.sin(a) * r * 0.8, z: -l * GAP + (rnd() - 0.5) * 50, l, out: [] });
      layerIdx[l].push(nodes.length - 1);
    }
  }
  const edges = [];
  layerIdx.forEach((ids, l) => {
    if (l === LAYERS - 1) return;
    ids.forEach(i => {
      const near = layerIdx[l + 1].map(j => [j, Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)])
        .sort((p, q) => p[1] - q[1]).slice(0, small ? 2 : 3);
      near.forEach(([j]) => { edges.push({ a: i, b: j }); nodes[i].out.push(edges.length - 1); });
    });
  });

  // Glow-Sprite
  const spr = document.createElement('canvas'); spr.width = spr.height = 64;
  const sg = spr.getContext('2d');
  const grd = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,244,200,1)');
  grd.addColorStop(0.25, 'rgba(240,200,80,0.75)');
  grd.addColorStop(1, 'rgba(212,175,55,0)');
  sg.fillStyle = grd; sg.fillRect(0, 0, 64, 64);

  // Signale, die über die Kanten laufen
  const pulses = [];
  const fire = (ei, delay) => pulses.push({ e: ei, p: -(delay || 0), v: 0.9 + rnd() * 0.9 });
  for (let i = 0; i < (small ? 14 : 28); i++) fire(Math.floor(rnd() * edges.length), rnd() * 0.9);

  const ease = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
  const cl = v => Math.max(0, Math.min(1, v));
  const F = Math.min(W, H) * 0.95;
  const cy0 = -ZLEN / 2;
  const t0 = performance.now();
  let last = t0, done = false;

  function finish() {
    if (done) return; done = true;
    document.body.classList.remove('intro-pre');
    cv.remove();
  }
  cv.addEventListener('click', finish);

  function frame(now) {
    if (done) return;
    const t = now - t0, dt = Math.min(0.05, (now - last) / 1000); last = now;
    const u = t / INTRO_MS;
    const dolly = ease((u - 0.25) / 0.65);                    // ab ~25 %: Kamera fliegt hindurch
    const camZ = 520 - (520 + ZLEN + 160) * (dolly * dolly * 0.55 + dolly * 0.45);
    const yaw = (1 - ease(u / 0.55)) * 0.7 - 0.12;             // Einschwenken aus seitlichem Blick
    const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
    const boot = ease(u / 0.3);                                 // Schichten blenden von der Mitte aus auf

    g.globalCompositeOperation = 'source-over';
    const bg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
    bg.addColorStop(0, '#15120a'); bg.addColorStop(1, '#050506');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);

    // Projektion
    const P = nodes.map(n => {
      const dx = n.x, dz = n.z - cy0;
      const x1 = dx * cyaw - dz * syaw, z1 = dz * cyaw + dx * syaw + cy0;
      const d = camZ - z1;
      const s = F / Math.max(d, 1);
      return { px: W / 2 + x1 * s, py: H / 2 + n.y * s, d, s, vis: d > 40 };
    });
    const fog = d => cl(1 - (d - 200) / 1500);

    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    edges.forEach((e, i) => {
      const A = P[e.a], B = P[e.b];
      if (!A.vis || !B.vis) return;
      const lb = cl(boot * 1.6 - Math.abs(nodes[e.a].l - 4.5) / 6);
      const al = 0.38 * Math.min(fog(A.d), fog(B.d)) * lb;
      if (al < 0.01) return;
      g.strokeStyle = 'rgba(212,175,55,' + al + ')';
      g.lineWidth = Math.max(0.5, 1.1 * (A.s + B.s) * 0.5 * 1.5);
      g.beginPath(); g.moveTo(A.px, A.py); g.lineTo(B.px, B.py); g.stroke();
    });

    nodes.forEach((n, i) => {
      const q = P[i];
      if (!q.vis) return;
      const lb = cl(boot * 1.6 - Math.abs(n.l - 4.5) / 6);
      const al = fog(q.d) * lb;
      if (al < 0.02) return;
      const sz = Math.min(120, 16 * q.s * 2.2 + 3);
      g.globalAlpha = Math.min(1, al * 1.3);
      g.drawImage(spr, q.px - sz / 2, q.py - sz / 2, sz, sz);
    });

    // Signale
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pl = pulses[i];
      pl.p += dt * pl.v * 1.6;
      if (pl.p < 0) continue;
      if (pl.p >= 1) {
        const nx = nodes[edges[pl.e].b].out;
        pulses.splice(i, 1);
        if (nx.length && pulses.length < (small ? 40 : 90)) nx.forEach(k => { if (rnd() < 0.7) fire(k, 0); });
        else if (pulses.length < (small ? 14 : 28)) fire(Math.floor(rnd() * edges.length), 0);
        continue;
      }
      const A = P[edges[pl.e].a], B = P[edges[pl.e].b];
      if (!A.vis || !B.vis) continue;
      const x = A.px + (B.px - A.px) * pl.p, y = A.py + (B.py - A.py) * pl.p;
      const d = A.d + (B.d - A.d) * pl.p;
      const sz = Math.min(90, 40 * (F / Math.max(d, 1)) * 0.5 + 6);
      g.globalAlpha = Math.min(1, fog(d) * 1.4);
      g.drawImage(spr, x - sz / 2, y - sz / 2, sz, sz);
    }
    g.globalAlpha = 1;

    // heller Blitz kurz vor dem Durchbruch
    const flash = cl(1 - Math.abs(u - 0.78) / 0.14) * 0.5;
    if (flash > 0) {
      g.globalCompositeOperation = 'lighter';
      const fg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
      fg.addColorStop(0, 'rgba(255,236,170,' + flash + ')'); fg.addColorStop(1, 'rgba(255,236,170,0)');
      g.fillStyle = fg; g.fillRect(0, 0, W, H);
    }

    // Iris: ein Loch wächst aus der Mitte, dahinter erscheint die Seite
    const irisK = ease((u - 0.62) / 0.38);
    const diag = Math.hypot(W, H) / 2;
    cv.style.setProperty('--r', (-100 + irisK * (diag + 220)) + 'px');
    if (u > 0.5 && document.body.classList.contains('intro-pre')) document.body.classList.remove('intro-pre');

    if (u < 1) requestAnimationFrame(frame); else finish();
  }
  requestAnimationFrame(frame);
}

// 4. SPA Router & Direct Project Inquiry Helper
// Routing: jede Ansicht hat eine URL (#beratung etc.), Zurück-Button bleibt auf der Seite
const ROUTES = {
  home: '',
  consulting: 'beratung',
  medien: 'digitale-medien',
  projektleitung: 'digitalisierung-projektleitung',
  founder: 'ueber-mich',
  impressum: 'impressum',
  datenschutz: 'datenschutz'
};
const VIEW_TITLES = {
  consulting: 'KI-Beratung',
  medien: 'Digitale Medien',
  projektleitung: 'Digitalisierung & Projektleitung',
  founder: 'Über mich & Kontakt',
  impressum: 'Impressum',
  datenschutz: 'Datenschutz'
};
const BASE_TITLE = document.title;

function viewFromHash() {
  const slug = decodeURIComponent(location.hash.replace(/^#\/?/, '')).toLowerCase();
  if (!slug) return 'home';
  const ALIASES = { digitalisierung: 'projektleitung', projektleitung: 'projektleitung' };
  const hit = Object.keys(ROUTES).find(k => ROUTES[k] === slug || k === slug) || ALIASES[slug];
  return hit || 'home';
}

function navigateTo(viewId) {
  if (!(viewId in ROUTES)) viewId = 'home';
  if (viewFromHash() !== viewId) {
    history.pushState(null, '', ROUTES[viewId] ? '#' + ROUTES[viewId] : location.pathname + location.search);
  }
  showView(viewId);
}

window.addEventListener('popstate', () => showView(viewFromHash()));
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

function showView(viewId) {
  document.title = VIEW_TITLES[viewId] ? VIEW_TITLES[viewId] + ' | digitalwerkstatt Hübner' : BASE_TITLE;
  const loader = document.getElementById('topLoader');
  if (loader) loader.style.opacity = '1';
  deactivateCardBgEffect();

  setTimeout(() => {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-pill').forEach(btn => {
      if (btn.getAttribute('data-nav') === viewId) {
        btn.className = 'nav-pill px-4 py-1.5 rounded-full text-xs font-semibold btn-gold';
      } else {
        btn.className = 'nav-pill px-4 py-1.5 rounded-full text-xs font-medium text-sec hover:text-current transition-all';
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (viewId === 'projektleitung') ScanFlow.resize();
    requestCardFocusUpdate();
    setTimeout(() => {
      if (loader) loader.style.opacity = '0';
    }, 200);
  }, 90);
}

function openDirectProjectInquiry() {
  navigateTo('founder');
  setTimeout(() => {
    const selectEl = document.getElementById('contactTopicSelect');
    if (selectEl) selectEl.value = 'projektanfrage';
    const nameInput = document.getElementById('contactName');
    if (nameInput) nameInput.focus();
  }, 220);
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('hidden');
}

// 5. Subpage 01: Beratung
const SCOPE_ON = 'scope-btn scope-on';
const SCOPE_OFF = 'scope-btn';

// 6. Subpage 02: Projektleitung (Rohbau inkl. Großguss, Gesamtfahrzeug inkl. DMU & Schnittstellen, Drohnen inkl. C-UAS)
const amgData = {
  rohbau: {
    tag: 'SCHWERPUNKT // KAROSSERIEROHBAU',
    heading: 'Rohbau & Spezialität Großguss',
    copy: 'Technische Projektleitung im Karosserierohbau (Body-in-White) mit ausgewiesener Spezialität im Bereich Großguss (Mega-/Giga-Casting) sowie komplexer Unterboden- und Heckwagenstrukturen – von der Konzeptphase über die internationale Lieferantensteuerung bis zur Serienreife.',
    s1: 'Rohbau & Großguss',
    s2: 'Audi, VW, Rivian u.a.',
    img: 'img/caxray_v1.jpg?v=1',
    cap: 'KI-generierte Illustration',
    sub: 'Karosserierohbau & Heckwagenstruktur'
  },
  overall: {
    tag: 'SCHWERPUNKT // GESAMTFAHRZEUG',
    heading: 'Schnittstellenmanagement & Digital Mockup (DMU)',
    copy: 'Baugruppenübergreifende Steuerung im Gesamtfahrzeug: Technisches Schnittstellenmanagement, Digital Mockup (DMU) und geometrische Absicherung, Reifegradmanagement sowie internationale Erprobungs- und Anlaufkoordination.',
    s1: 'Schnittstellen & DMU',
    s2: 'OEM-Reifegradsteuerung',
    img: 'img/gesamtfahrzeug_v1.jpg?v=1',
    cap: 'Gesamtfahrzeug-Entwicklung',
    sub: 'KI-generierte Illustration'
  },
  uav: {
    tag: 'SCHWERPUNKT // DROHNEN & C-UAS',
    heading: 'UAV-Projekte & C-UAS (Counter-UAS)',
    copy: 'Projektsteuerung und Produktmanagement für kommerzielle Drohnen-Befliegungen sowie C-UAS-Systeme (Counter-UAS / Drohnenabwehr und Luftraumsicherheit) – von der technischen Konzeption über die Systemintegration bis zur operativen Durchführung.',
    s1: 'UAV & C-UAS Erfahrung',
    s2: '7+ Jahre Flugpraxis',
    img: 'img/cuas.jpg',
    cap: 'C-UAS · Drohnenabwehr',
    sub: 'KI-generierte Illustration'
  }
};

function setAmgScope(key) {
  ['rohbau', 'overall', 'uav'].forEach(k => {
    const btn = document.getElementById('amg-btn-' + k);
    if (btn) {
      btn.className = (k === key)
        ? SCOPE_ON
        : SCOPE_OFF;
    }
  });
  const d = amgData[key];
  if (!d) return;

  const tagEl = document.getElementById('amgScopeTag');
  const headEl = document.getElementById('amgScopeHeading');
  const copyEl = document.getElementById('amgScopeCopy');
  const s1El = document.getElementById('amgStat1');
  const s2El = document.getElementById('amgStat2');

  if (tagEl) tagEl.textContent = d.tag;
  if (headEl) headEl.textContent = d.heading;
  if (copyEl) copyEl.textContent = d.copy;
  if (s1El) s1El.textContent = d.s1;
  if (s2El) s2El.textContent = d.s2;

  const photoEl = document.getElementById('amgPhoto');
  const capEl = document.getElementById('amgCaption');
  const subEl = document.getElementById('amgSubCaption');
  if (photoEl) {
    if (d.img) photoEl.src = d.img;
    photoEl.style.opacity = d.img ? '1' : '0';
  }
  if (capEl) {
    capEl.textContent = d.cap;
    capEl.style.display = d.cap ? '' : 'none';
  }
  if (subEl) subEl.textContent = d.sub;
}

// 7b. Animation: Drohnenscan -> Punktwolke -> Mesh -> 3D-Objekt -> Marketing-Asset
const ScanFlow = (() => {
  const el = document.getElementById('scanFlowCanvas');
  if (!el) return { resize() {}, start() {} };
  const c = el.getContext('2d');
  const LOOP = 20;
  const STAGES = [
    { t: 0, label: '01 // DROHNENSCAN' },
    { t: 5, label: '02 // PUNKTWOLKE' },
    { t: 7, label: '03 // 3D-MESH' },
    { t: 10, label: '04 // 3D-OBJEKT' },
    { t: 12, label: '05 // ASSET FÜR WEB & MARKETING' }
  ];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };

  // Objekt: Werkhalle mit Anbau und zwei Silos (y negativ = oben, Boden bei y = 40)
  const WALL = [154, 160, 170], ROOF = [212, 175, 55], ANNEX = [111, 119, 130], SILO = [195, 199, 206];
  const faces = [];
  const addFace = (v, col) => faces.push({ v, col });
  const box = (x0, x1, y0, y1, z0, z1, col, top = true) => {
    addFace([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], col);
    addFace([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], col);
    addFace([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], col);
    addFace([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], col);
    if (top) addFace([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], col);
  };
  box(-95, 95, -20, 40, -48, 48, WALL, false);
  addFace([[-95, -20, -52], [95, -20, -52], [95, -45, 0], [-95, -45, 0]], ROOF);
  addFace([[-95, -20, 52], [95, -20, 52], [95, -45, 0], [-95, -45, 0]], ROOF);
  addFace([[-95, -20, -48], [-95, -20, 48], [-95, -45, 0]], WALL);
  addFace([[95, -20, -48], [95, -20, 48], [95, -45, 0]], WALL);
  box(95, 135, -8, 40, -25, 25, ANNEX);
  const silo = (cx, cz, r, yTop) => {
    const n = 12, ring = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ring.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
    for (let i = 0; i < n; i++) {
      const p = ring[i], q = ring[(i + 1) % n];
      addFace([[p[0], yTop, p[1]], [q[0], yTop, q[1]], [q[0], 40, q[1]], [p[0], 40, p[1]]], SILO);
    }
    addFace(ring.map(p => [p[0], yTop, p[1]]), SILO);
  };
  silo(-70, -80, 20, -55);
  silo(-25, -85, 14, -35);

  // Punktwolke: Flächen-gewichtet abgetastet, plus lockeres Gelände
  const tris = [];
  let totalArea = 0;
  faces.forEach((f, fi) => {
    for (let i = 1; i < f.v.length - 1; i++) {
      const a = f.v[0], b = f.v[i], d = f.v[i + 1];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      const cx = u[1] * w[2] - u[2] * w[1], cy = u[2] * w[0] - u[0] * w[2], cz = u[0] * w[1] - u[1] * w[0];
      const area = Math.hypot(cx, cy, cz) / 2;
      totalArea += area;
      tris.push({ a, b, d, area, fi });
    }
  });
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const cloud = [];
  const addPoint = (x, y, z, col, ground) => {
    cloud.push({
      x, y, z, col, ground,
      key: (Math.atan2(z, x) + Math.PI) / (Math.PI * 2),
      jx: rnd() * 2 - 1, jy: rnd() * 2 - 1, jz: rnd() * 2 - 1
    });
  };
  for (let i = 0; i < 2300; i++) {
    let r = rnd() * totalArea, tr = tris[0];
    for (const t of tris) { if ((r -= t.area) <= 0) { tr = t; break; } }
    let u = rnd(), v = rnd();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const x = tr.a[0] + u * (tr.b[0] - tr.a[0]) + v * (tr.d[0] - tr.a[0]);
    const y = tr.a[1] + u * (tr.b[1] - tr.a[1]) + v * (tr.d[1] - tr.a[1]);
    const z = tr.a[2] + u * (tr.b[2] - tr.a[2]) + v * (tr.d[2] - tr.a[2]);
    addPoint(x, y, z, faces[tr.fi].col, false);
  }
  for (let i = 0; i < 420; i++) {
    const x = (rnd() * 2 - 1) * 170, z = (rnd() * 2 - 1) * 150;
    if (Math.abs(x) < 100 && Math.abs(z) < 55) continue;
    addPoint(x, 40 + Math.sin(x * 0.04) * Math.cos(z * 0.05) * 3, z, [120, 124, 132], true);
  }

  let w = 0, h = 0, dpr = 1, t0 = performance.now(), raf = 0, visible = false;

  function resize() {
    const r = el.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(r.width, 10); h = Math.max(r.height, 10);
    el.width = Math.round(w * dpr); el.height = Math.round(h * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!raf) draw(performance.now());
  }

  function rr(x, y, rw, rh, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + rw, y, x + rw, y + rh, r);
    c.arcTo(x + rw, y + rh, x, y + rh, r);
    c.arcTo(x, y + rh, x, y, r);
    c.arcTo(x, y, x + rw, y, r);
    c.closePath();
  }

  // Projektion in ein Rechteck rect = {x, y, w, h}
  function makeProj(rect, yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
    const k = Math.min(rect.w / 225, rect.h / 140);
    const ox = rect.x + rect.w / 2, oy = rect.y + rect.h / 2;
    return (x, y, z) => {
      const x1 = x * cy - z * sy, z1 = z * cy + x * sy;
      const y2 = y * cx - z1 * sx, z2 = z1 * cx + y * sx;
      const s = 520 / (520 + z2 + 420) * k;
      return { px: ox + x1 * s, py: oy + y2 * s, z: z2, s };
    };
  }

  // o: { pts, wire, solid, grid, scan (0..1), jitter }
  function drawObject(rect, yaw, t, o) {
    const P = makeProj(rect, yaw, 0.42);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(0.42), sx = Math.sin(0.42);

    if (o.grid > 0.01) {
      c.strokeStyle = 'rgba(212,175,55,' + (0.16 * o.grid) + ')';
      c.lineWidth = 1;
      c.beginPath();
      for (let g = -160; g <= 160; g += 40) {
        let a = P(g, 40, -160), b = P(g, 40, 160);
        c.moveTo(a.px, a.py); c.lineTo(b.px, b.py);
        a = P(-160, 40, g); b = P(160, 40, g);
        c.moveTo(a.px, a.py); c.lineTo(b.px, b.py);
      }
      c.stroke();
    }

    if (o.solid > 0.01 || o.wire > 0.01) {
      const list = faces.map(f => {
        const pv = f.v.map(q => P(q[0], q[1], q[2]));
        const z = pv.reduce((s, q) => s + q.z, 0) / pv.length;
        const a = f.v[0], b = f.v[1], d = f.v[2];
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
        let nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0];
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        const x1 = nx * cy - nz * sy, z1 = nz * cy + nx * sy;
        const y2 = ny * cx - z1 * sx, z2 = z1 * cx + ny * sx;
        const lit = Math.abs(x1 * -0.4 + y2 * -0.75 + z2 * -0.5);
        return { f, pv, z, shade: 0.42 + 0.58 * clamp(lit) };
      }).sort((m, n) => n.z - m.z);

      c.lineJoin = 'round';
      list.forEach(it => {
        c.beginPath();
        it.pv.forEach((q, i) => (i ? c.lineTo(q.px, q.py) : c.moveTo(q.px, q.py)));
        c.closePath();
        if (o.solid > 0.01) {
          const col = it.f.col, s = it.shade;
          c.fillStyle = 'rgba(' + Math.round(col[0] * s) + ',' + Math.round(col[1] * s) + ',' + Math.round(col[2] * s) + ',' + o.solid + ')';
          c.fill();
        } else if (o.wire > 0.01) {
          c.fillStyle = 'rgba(17,17,19,' + (0.7 * o.wire) + ')';
          c.fill();
        }
        if (o.wire > 0.01) {
          c.strokeStyle = 'rgba(212,175,55,' + (0.85 * o.wire) + ')';
          c.lineWidth = 0.9;
          c.stroke();
          if (it.pv.length === 4) {
            c.beginPath();
            c.moveTo(it.pv[0].px, it.pv[0].py); c.lineTo(it.pv[2].px, it.pv[2].py);
            c.strokeStyle = 'rgba(212,175,55,' + (0.35 * o.wire) + ')';
            c.stroke();
          }
        }
      });
    }

    if (o.pts > 0.01) {
      const bright = [];
      cloud.forEach(p => {
        if (p.ground && o.pts2 !== undefined) { /* Gelände folgt pts2 */ }
        const vis = p.key <= o.scan;
        if (!vis) return;
        const alpha = (p.ground ? o.pts2 : o.pts);
        if (alpha < 0.02) return;
        const j = o.jitter * 4;
        const q = P(p.x + p.jx * j, p.y + p.jy * j, p.z + p.jz * j);
        const fresh = o.scan < 1 && o.scan - p.key < 0.05;
        const hn = clamp((40 - p.y) / 85);
        const r = Math.max(1.1, q.s * (fresh ? 2.6 : 1.7));
        c.globalAlpha = alpha * (0.45 + 0.55 * clamp(1 - (q.z + 150) / 400));
        if (fresh) { bright.push([q.px, q.py, r]); return; }
        c.fillStyle = p.ground ? 'rgb(120,124,132)' : (hn > 0.62 ? 'rgb(212,175,55)' : 'rgb(235,235,240)');
        c.fillRect(q.px - r / 2, q.py - r / 2, r, r);
      });
      c.globalAlpha = 1;
      c.fillStyle = '#F2D46A';
      bright.forEach(b => c.fillRect(b[0] - b[2] / 2, b[1] - b[2] / 2, b[2], b[2]));
    }
    return P;
  }

  function drawDrone(P, t, sp) {
    const a = -Math.PI + sp * Math.PI * 2;
    const lift = Math.max(0, t - 5) * 70;
    const alpha = 1 - clamp((t - 5) / 1.2);
    if (alpha <= 0) return;
    const d = P(Math.cos(a) * 150, -100 - lift, Math.sin(a) * 150);
    const tg = P(Math.cos(a) * 70, 20, Math.sin(a) * 70);
    c.globalAlpha = alpha;
    const g = c.createLinearGradient(d.px, d.py, tg.px, tg.py);
    g.addColorStop(0, 'rgba(212,175,55,0.7)');
    g.addColorStop(1, 'rgba(212,175,55,0.05)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(d.px, d.py); c.lineTo(tg.px - 26, tg.py); c.lineTo(tg.px + 26, tg.py);
    c.closePath(); c.fill();
    const k = 0.9 + d.s * 3;
    c.strokeStyle = '#D4AF37'; c.fillStyle = '#D4AF37'; c.lineWidth = 1.5;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(m => {
      c.beginPath(); c.moveTo(d.px, d.py); c.lineTo(d.px + m[0] * 9 * k, d.py + m[1] * 4 * k); c.stroke();
      c.beginPath(); c.ellipse(d.px + m[0] * 9 * k, d.py + m[1] * 4 * k, 5 * k, 1.8 * k, 0, 0, Math.PI * 2); c.stroke();
    });
    c.beginPath(); c.arc(d.px, d.py, 3 * k, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
  }

  function slots() {
    if (w >= 640) {
      const ph = h * 0.7;
      return {
        browser: { x: w * 0.02, y: h * 0.2, w: w * 0.33, h: h * 0.5 },
        hero: { x: w * 0.37, y: h * 0.04, w: w * 0.26, h: h * 0.82 },
        phone: { x: w * 0.98 - ph * 0.5, y: h * 0.14, w: ph * 0.5, h: ph }
      };
    }
    return {
      browser: { x: w * 0.05, y: h * 0.07, w: w * 0.9, h: h * 0.38 },
      hero: { x: w * 0.36, y: h * 0.5, w: w * 0.6, h: h * 0.46 },
      phone: { x: w * 0.06, y: h * 0.54, w: h * 0.4 * 0.5, h: h * 0.4 }
    };
  }

  function drawBrowser(r, e, yaw) {
    c.globalAlpha = e;
    rr(r.x, r.y, r.w, r.h, 10); c.fillStyle = '#1c1c1f'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 1; c.stroke();
    const bar = Math.min(22, r.h * 0.12);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
      c.fillStyle = col; c.beginPath(); c.arc(r.x + 12 + i * 12, r.y + bar / 2, 3, 0, Math.PI * 2); c.fill();
    });
    c.fillStyle = 'rgba(255,255,255,0.08)';
    rr(r.x + 52, r.y + bar / 2 - 5, r.w - 64, 10, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.font = '9px ui-monospace, monospace'; c.textAlign = 'left';
    c.fillText('ihre-website.de', r.x + 60, r.y + bar / 2 + 3);
    const bx = r.x + 14, by = r.y + bar + 14;
    c.fillStyle = '#D4AF37'; c.fillRect(bx, by, r.w * 0.2, 7);
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(bx, by + 16, r.w * 0.32, 8);
    c.fillStyle = 'rgba(255,255,255,0.22)';
    for (let i = 0; i < 3; i++) c.fillRect(bx, by + 34 + i * 10, r.w * (0.3 - i * 0.04), 4);
    rr(bx, by + 72, r.w * 0.16, 14, 7); c.fillStyle = '#D4AF37'; c.fill();
    c.save();
    rr(r.x, r.y + bar, r.w, r.h - bar, 10); c.clip();
    drawObject({ x: r.x + r.w * 0.42, y: r.y + bar, w: r.w * 0.58, h: r.h - bar }, yaw, 14, { solid: e, wire: 0, pts: 0, grid: 0, scan: 1, jitter: 0 });
    c.restore();
    c.globalAlpha = 1;
  }

  function drawPhone(r, e, yaw) {
    c.globalAlpha = e;
    rr(r.x, r.y, r.w, r.h, 16); c.fillStyle = '#1c1c1f'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.2)'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(r.x + 12, r.y + 14, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.font = '9px ui-monospace, monospace'; c.textAlign = 'left';
    c.fillText('Social Ad', r.x + 22, r.y + 17);
    c.save();
    rr(r.x, r.y + 26, r.w, r.h - 26, 4); c.clip();
    drawObject({ x: r.x, y: r.y + 26, w: r.w, h: (r.h - 26) * 0.7 }, yaw, 14, { solid: e, wire: 0, pts: 0, grid: 0, scan: 1, jitter: 0 });
    c.restore();
    rr(r.x + r.w * 0.15, r.y + r.h - 34, r.w * 0.7, 16, 8); c.fillStyle = '#D4AF37'; c.fill();
    c.globalAlpha = 1;
  }

  function draw(now) {
    const t = reduce ? 14 : ((now - t0) / 1000) % LOOP;
    c.fillStyle = '#111113';
    c.fillRect(0, 0, w, h);

    const yaw = reduce ? 0.6 : 0.5 + t * 0.32;
    const sp = clamp(t / 5);
    const e = ease((t - 12) / 1.6);
    const sl = slots();
    const full = { x: 0, y: 0, w, h };
    const L = (a, b) => a + (b - a) * e;
    const hero = { x: L(full.x, sl.hero.x), y: L(full.y, sl.hero.y), w: L(full.w, sl.hero.w), h: L(full.h, sl.hero.h) };

    if (e > 0.01) {
      drawBrowser(sl.browser, e, yaw + 0.5);
      drawPhone(sl.phone, e, yaw - 0.6);
    }

    const solid = ease((t - 9.5) / 1.5);
    const wire = ease((t - 6.5) / 1.5) * (1 - 0.65 * ease((t - 11) / 1.5));
    const pts = 1 - ease((t - 7.5) / 2);
    const pts2 = 1 - ease((t - 10) / 2);
    const P = drawObject(hero, yaw, t, {
      pts, pts2, wire, solid, grid: 1 - 0.5 * e, scan: sp, jitter: 1 - ease((t - 4.5) / 2.5)
    });
    if (t < 6.2) drawDrone(P, t, sp);

    // Beschriftung
    c.textAlign = 'left';
    c.font = '600 11px ui-monospace, monospace';
    let cur = STAGES[0];
    STAGES.forEach(s => { if (t >= s.t) cur = s; });
    c.fillStyle = '#D4AF37';
    c.fillText(cur.label, 18, 24);
    if (e > 0.5 && w >= 640) {
      c.fillStyle = 'rgba(255,255,255,' + (0.5 * e) + ')';
      c.font = '10px ui-monospace, monospace'; c.textAlign = 'center';
      c.fillText('Website-Hero', sl.browser.x + sl.browser.w / 2, sl.browser.y + sl.browser.h + 16);
      c.fillText('3D-Asset', sl.hero.x + sl.hero.w / 2, sl.hero.y + sl.hero.h + 8);
      c.fillText('Social-Media-Ad', sl.phone.x + sl.phone.w / 2, sl.phone.y + sl.phone.h + 16);
      c.textAlign = 'left';
    }
    // Fortschritt
    const bw = (w - 36) / STAGES.length;
    STAGES.forEach((s, i) => {
      const t1 = i + 1 < STAGES.length ? STAGES[i + 1].t : 18;
      c.fillStyle = 'rgba(255,255,255,0.12)';
      c.fillRect(18 + i * bw, h - 14, bw - 4, 3);
      c.fillStyle = '#D4AF37';
      c.fillRect(18 + i * bw, h - 14, (bw - 4) * clamp((t - s.t) / (t1 - s.t)), 3);
    });

    // Ein-/Ausblenden an der Schleifengrenze
    const fade = reduce ? 1 : Math.min(1, t / 0.6, (LOOP - t) / 0.8);
    if (fade < 1) { c.fillStyle = 'rgba(17,17,19,' + (1 - fade) + ')'; c.fillRect(0, 0, w, h); }
  }

  function loop(now) {
    draw(now);
    raf = (visible && !reduce) ? requestAnimationFrame(loop) : 0;
  }

  function start() {
    resize();
    el.addEventListener('click', () => { t0 = performance.now(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(en => {
        visible = en[0].isIntersecting;
        if (visible && !raf) { t0 = performance.now(); raf = requestAnimationFrame(loop); }
      }).observe(el);
    } else {
      visible = true; raf = requestAnimationFrame(loop);
    }
    window.addEventListener('resize', resize);
  }
  return { resize, start };
})();

// 8. Contact Form: Versand über Formspree
async function submitForm(e) {
  e.preventDefault();
  const form = e.target;
  const loader = document.getElementById('formLoader');
  const bar = document.getElementById('formBar');
  const pct = document.getElementById('formPct');
  const done = document.getElementById('formDone');
  const fail = document.getElementById('formError');
  const btn = document.getElementById('formBtn');

  if (!loader || !bar || !pct || !done || !fail || !btn) return;

  done.classList.add('hidden');
  fail.classList.add('hidden');
  loader.classList.remove('hidden');
  btn.disabled = true;
  btn.classList.add('opacity-50');
  bar.style.width = '50%';
  pct.textContent = '50%';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(res.status);
    bar.style.width = '100%';
    pct.textContent = '100%';
    done.classList.remove('hidden');
    form.reset();
  } catch (err) {
    fail.classList.remove('hidden');
  } finally {
    setTimeout(() => {
      loader.classList.add('hidden');
      bar.style.width = '0%';
      btn.disabled = false;
      btn.classList.remove('opacity-50');
    }, 300);
  }
}

// Touch-Geräte: Karte in der Bildschirmmitte aktiviert Hintergrund-Animation und Highlight
const focusCards = [];
let focusedCard = null;
let focusTicking = false;

function updateCardFocus() {
  focusTicking = false;
  const home = document.getElementById('view-home');
  const touchLayout = window.matchMedia('(hover: none), (max-width: 1023px)').matches;
  let best = null;
  if (touchLayout && home && home.classList.contains('active')) {
    const mid = window.innerHeight / 2;
    let bestDist = Infinity;
    focusCards.forEach(c => {
      const r = c.card.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const dist = Math.abs((r.top + r.bottom) / 2 - mid);
      if (dist < r.height * 0.6 && dist < bestDist) { best = c; bestDist = dist; }
    });
  }
  if (focusedCard && focusedCard !== best) {
    focusedCard.card.classList.remove('in-focus');
    if (!best) deactivateCardBgEffect();
  }
  if (best) {
    best.card.classList.add('in-focus');
    activateCardBgEffect(best.type, best.card);
  }
  focusedCard = best;
}

function requestCardFocusUpdate() {
  if (focusTicking) return;
  focusTicking = true;
  requestAnimationFrame(updateCardFocus);
}

function initCardFocus() {
  document.querySelectorAll('.pillar-card[onmouseenter]').forEach(card => {
    const m = /activateCardBgEffect\('(\w+)'/.exec(card.getAttribute('onmouseenter'));
    if (m) focusCards.push({ card, type: m[1] });
  });
  window.addEventListener('scroll', requestCardFocusUpdate, { passive: true });
  window.addEventListener('resize', requestCardFocusUpdate);
}

// 9. Initialize App on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  runIntro();
  initCardFocus();
  setAmgScope('rohbau');
  resizeBgCanvas();
  showView(viewFromHash());
  ScanFlow.start();
  requestAnimationFrame(renderAmbientBg);
});