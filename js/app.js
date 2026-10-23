// ============================================================================
// digitalwerkstatt — Main Application Logic (js/app.js)
// ============================================================================

// 1. Auto Day/Night Theme (Day: Bright Milky iOS, Night: Thick Graphite Gray)
let isDark = false;

function initTheme() {
  const h = new Date().getHours();
  isDark = (h < 7 || h >= 19);
  const tp = /[?&]theme=(dark|light)/.exec(location.search);        // Vorschau-Rahmen bekommt das Theme der Elternseite
  if (tp) isDark = tp[1] === 'dark';
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
  if (typeof syncPreviewTheme === 'function') syncPreviewTheme();
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

    // Crisp Black & Gold Quadcopter SVG (16x16px)
    drone.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
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
let activeEffect = null; // 'neural' | 'media' | 'scan' | null
let effectOrigin = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let spreadRadius = 0;
let effectAlpha = 0;
let isHoveringCard = false;
let bgTime = 0;

// Pre-generate nodes for smooth animations
const neuralNodes = Array.from({ length: 44 }, () => ({
  bx: 0.06 + Math.random() * 0.88,
  by: 0.08 + Math.random() * 0.84,
  ax: 0.01 + Math.random() * 0.03, ay: 0.01 + Math.random() * 0.03,
  fx: 0.15 + Math.random() * 0.25, fy: 0.15 + Math.random() * 0.25,
  ph: Math.random() * Math.PI * 2,
  r: 2 + Math.random() * 2.5
}));

// Kleine feste Zufallsfolge (stabile Punktwolke für den Scan-Effekt)
const scanPts = Array.from({ length: 110 }, (_, i) => {
  const h = k => { const v = Math.sin((i + 1) * k) * 43758.5453; return v - Math.floor(v); };
  return { x: h(12.9898), y: h(78.233), z: h(37.719) };
});

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

// Effekt-Zeichner: gleiche Optik als Seitenhintergrund (ganze Fläche) und als leiser Hintergrund in der Kachel
function drawNeural(c, ax, ay, aw, ah, A, t, o, col) {
  const P = [];
  for (let i = 0; i < o.n; i++) {
    const n = neuralNodes[i];
    P.push([ax + (n.bx + Math.sin(t * n.fx + n.ph) * n.ax) * aw, ay + (n.by + Math.sin(t * n.fy + n.ph * 1.7) * n.ay) * ah]);
  }
  for (let i = 0; i < o.n; i++) {
    for (let j = i + 1; j < o.n; j++) {
      const d = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
      if (d >= o.link) continue;
      c.strokeStyle = `rgba(${col.gold}, ${(1 - d / o.link) * 0.26 * A})`;
      c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(P[i][0], P[i][1]); c.lineTo(P[j][0], P[j][1]); c.stroke();
      if ((i + j) % 5 === 0) {                                   // Synapsen-Puls
        const k = (t * 0.45 + i * 0.17) % 1;
        c.fillStyle = `rgba(${col.gold}, ${0.65 * A})`;
        c.beginPath(); c.arc(P[i][0] + (P[j][0] - P[i][0]) * k, P[i][1] + (P[j][1] - P[i][1]) * k, 2.2 * o.rs, 0, Math.PI * 2); c.fill();
      }
    }
    c.fillStyle = `rgba(${col.gold}, ${0.45 * A})`;
    c.beginPath(); c.arc(P[i][0], P[i][1], neuralNodes[i].r * o.rs, 0, Math.PI * 2); c.fill();
  }
}

function drawMedia(c, ax, ay, aw, ah, A, t, o, col) {
  const s = o.s, G = col.gold;
  c.lineWidth = 1.1;
  // Ein Filmstreifen läuft unten durch das Bild
  [[0.73, -1]].forEach(([fy, dir]) => {
    const y = ay + ah * fy, sh = 46 * s, fw = 62 * s, gap = 10 * s, step = fw + gap;
    const off = ((t * 28 * s * dir) % step + step) % step;
    c.strokeStyle = `rgba(${G}, ${0.22 * A})`;
    c.beginPath(); c.moveTo(ax, y - sh / 2 - 5 * s); c.lineTo(ax + aw, y - sh / 2 - 5 * s); c.moveTo(ax, y + sh / 2 + 5 * s); c.lineTo(ax + aw, y + sh / 2 + 5 * s); c.stroke();
    for (let x = ax - step + off; x < ax + aw; x += step) {
      c.fillStyle = `rgba(${G}, ${0.07 * A})`;
      c.strokeStyle = `rgba(${G}, ${0.4 * A})`;
      c.fillRect(x, y - sh / 2, fw, sh); c.strokeRect(x, y - sh / 2, fw, sh);
      c.fillStyle = `rgba(${G}, ${0.3 * A})`;
      c.fillRect(x + 6 * s, y - sh / 2 - 4 * s, 5 * s, 3 * s); c.fillRect(x + fw - 11 * s, y - sh / 2 - 4 * s, 5 * s, 3 * s);
    }
  });
  // Play-Symbol in der Mitte, pulsiert
  const pc = [ax + aw / 2, ay + ah / 2], pr = (24 + Math.sin(t * 2) * 2.5) * s;
  c.strokeStyle = `rgba(${G}, ${0.5 * A})`; c.lineWidth = 1.6;
  c.beginPath(); c.arc(pc[0], pc[1], pr, 0, Math.PI * 2); c.stroke();
  c.fillStyle = `rgba(${G}, ${0.55 * A})`;
  c.beginPath(); c.moveTo(pc[0] - pr * 0.28, pc[1] - pr * 0.42); c.lineTo(pc[0] + pr * 0.5, pc[1]); c.lineTo(pc[0] - pr * 0.28, pc[1] + pr * 0.42); c.closePath(); c.fill();
  // Sucher-Ecken und REC
  const m = Math.min(aw, ah) * 0.06 + 8, L = 26 * s, top = ay + ah * 0.17;      // obere Sucherecken und REC weiter unten
  c.strokeStyle = `rgba(${G}, ${0.5 * A})`; c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(ax + m, top + L); c.lineTo(ax + m, top); c.lineTo(ax + m + L, top);
  c.moveTo(ax + aw - m - L, top); c.lineTo(ax + aw - m, top); c.lineTo(ax + aw - m, top + L);
  c.moveTo(ax + m, ay + ah - m - L); c.lineTo(ax + m, ay + ah - m); c.lineTo(ax + m + L, ay + ah - m);
  c.moveTo(ax + aw - m - L, ay + ah - m); c.lineTo(ax + aw - m, ay + ah - m); c.lineTo(ax + aw - m, ay + ah - m - L);
  c.stroke();
  if (Math.sin(t * 4) > -0.2) { c.fillStyle = `rgba(220, 70, 60, ${0.75 * A})`; c.beginPath(); c.arc(ax + m + 8 * s, top + 14 * s + L, 3.5 * s, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = `rgba(${col.sec}, ${0.45 * A})`; c.font = `600 ${Math.round(10 * s + 1)}px monospace`;
  c.fillText('REC', ax + m + 16 * s, top + 18 * s + L);
  // Zeitleiste mit Clips und Abspielkopf
  const ty = ay + ah - m - 14 * s - L * 0.2 - 8, tx0 = ax + m + L + 6, tx1 = ax + aw - m - L - 6;
  if (tx1 > tx0 + 40) {
    c.strokeStyle = `rgba(${G}, ${0.25 * A})`; c.lineWidth = 1;
    c.beginPath(); c.moveTo(tx0, ty); c.lineTo(tx1, ty); c.stroke();
    [[0.0, 0.3], [0.34, 0.31], [0.69, 0.31]].forEach(([a0, a1], k) => {
      c.fillStyle = `rgba(${G}, ${(k === 1 ? 0.22 : 0.12) * A})`;
      c.fillRect(tx0 + (tx1 - tx0) * a0, ty - 5 * s, (tx1 - tx0) * a1, 10 * s);
    });
    const hx = tx0 + (tx1 - tx0) * ((t * 0.12) % 1);
    c.fillStyle = `rgba(${G}, ${0.8 * A})`; c.fillRect(hx - 1, ty - 11 * s, 2, 22 * s);
  }
}

function drawScan(c, ax, ay, aw, ah, A, t, o, col) {
  const s = o.s, G = col.gold;
  const beamY = ay + ah * ((t * 0.2) % 1);
  // Punktwolke, leuchtet auf, wo der Scanstrahl vorbeiläuft
  scanPts.forEach(p => {
    const x = ax + p.x * aw, y = ay + p.y * ah + Math.sin(t * 0.8 + p.z * 6) * 2 * s;
    const near = Math.max(0, 1 - Math.abs(y - beamY) / (ah * 0.12));
    c.fillStyle = `rgba(${G}, ${(0.16 + 0.7 * near) * A})`;
    c.beginPath(); c.arc(x, y, (1.1 + p.z * 0.9 + near * 1.2) * s, 0, Math.PI * 2); c.fill();
  });
  // Scanstrahl
  const g = c.createLinearGradient(ax, 0, ax + aw, 0);
  g.addColorStop(0, `rgba(${G}, 0)`); g.addColorStop(0.5, `rgba(${G}, ${0.6 * A})`); g.addColorStop(1, `rgba(${G}, 0)`);
  c.strokeStyle = g; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(ax, beamY); c.lineTo(ax + aw, beamY); c.stroke();
  // Drehende Drahtgitter-Würfel (3D-Modelle)
  const spots = [[0.2, 0.3], [0.78, 0.62], [0.45, 0.8], [0.85, 0.2], [0.12, 0.72], [0.55, 0.45]];
  for (let k = 0; k < o.cubes; k++) {
    const cx = ax + spots[k][0] * aw, cy = ay + spots[k][1] * ah + Math.sin(t * 0.7 + k) * 6 * s, a = t * 0.6 + k * 1.3, sz = (16 + (k % 3) * 5) * s;
    const pts = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map(([x, y, z]) => {
      const rx = x * Math.cos(a) - z * Math.sin(a), rz = z * Math.cos(a) + x * Math.sin(a), ry = y * Math.cos(0.5) - rz * Math.sin(0.5);
      return [cx + rx * sz, cy + ry * sz];
    });
    c.strokeStyle = `rgba(${G}, ${0.38 * A})`; c.lineWidth = 1.1;
    c.beginPath();
    [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([i, j]) => { c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[j][0], pts[j][1]); });
    c.stroke();
  }
  // Drohne fliegt über das Gelände
  const dx = ax + aw * (0.5 + 0.38 * Math.sin(t * 0.45)), dy = ay + ah * (0.14 + 0.04 * Math.sin(t * 1.3)), L = 11 * s;
  c.strokeStyle = `rgba(${G}, ${0.7 * A})`; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(dx - L, dy - L * 0.6); c.lineTo(dx + L, dy + L * 0.6); c.moveTo(dx - L, dy + L * 0.6); c.lineTo(dx + L, dy - L * 0.6); c.stroke();
  [[-1, -0.6], [1, 0.6], [-1, 0.6], [1, -0.6]].forEach(([ux, uy], k) => {
    const rr = L * 0.5 * (0.8 + 0.2 * Math.sin(t * 30 + k));
    c.beginPath(); c.ellipse(dx + ux * L, dy + uy * L, rr, rr * 0.35, 0, 0, Math.PI * 2); c.stroke();
  });
  c.fillStyle = `rgba(${G}, ${0.8 * A})`; c.beginPath(); c.arc(dx, dy, 2.2 * s, 0, Math.PI * 2); c.fill();
}

// Leise Variante der Effekte direkt im Hintergrund jeder Kachel
function drawTileFx() {
  const home = document.getElementById('view-home');
  if (!home || !home.classList.contains('active')) return;
  const col = { gold: isDark ? '212, 175, 55' : '182, 141, 64', sec: isDark ? '245, 245, 247' : '40, 40, 45' };
  const t = performance.now() / 1000, dpr = Math.min(window.devicePixelRatio || 1, 2);
  document.querySelectorAll('.tile-fx').forEach(cv => {
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    const card = cv.parentElement, hot = card.matches(':hover') || card.classList.contains('in-focus');
    cv._a = (cv._a === undefined ? 0 : cv._a) + ((hot ? 0.75 : 0.4) - (cv._a || 0)) * 0.08;
    const type = cv.dataset.fx;
    if (type === 'neural') drawNeural(c, 0, 0, w, h, cv._a, t, { n: 20, link: 120, rs: 0.8 }, col);
    if (type === 'media') drawMedia(c, 0, 0, w, h, cv._a, t, { s: 0.7 }, col);
    if (type === 'scan') drawScan(c, 0, 0, w, h, cv._a, t, { s: 0.75, cubes: 3 }, col);
  });
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

    const fxCol = { gold: goldRGB, sec: secRGB };
    if (activeEffect === 'neural') drawNeural(bgCtx, 0, 0, w, h, effectAlpha, bgTime, { n: 44, link: 210, rs: 1 }, fxCol);
    if (activeEffect === 'media') drawMedia(bgCtx, 0, 0, w, h, effectAlpha, bgTime, { s: 1 }, fxCol);
    if (activeEffect === 'scan') drawScan(bgCtx, 0, 0, w, h, effectAlpha, bgTime, { s: 1, cubes: 6 }, fxCol);

    bgCtx.restore();
  }

  drawTileFx();
  requestAnimationFrame(renderAmbientBg);
}

// 3b. Intro: neuronales Netz liegt hinter den Kacheln auf dem Seitenhintergrund, ein Signal feuert von der Mitte aus von Neuron zu Neuron und öffnet dabei die Seite (Einstellung: INTRO_MS)
const INTRO_MS = 1600;
const EMBED = /[?&]embed=1/.test(location.search);               // Seite läuft als Vorschau in einem Rahmen
function runIntro() {
  const cv = document.getElementById('introNet');
  if (!cv) return;
  if (EMBED) { cv.remove(); return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { cv.remove(); return; }
  const g = cv.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  let bgc = '#1C1C1E';

  const cl = v => Math.max(0, Math.min(1, v));
  const ease = v => { v = cl(v); return v * v * (3 - 2 * v); };
  let seed = 23;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  // Neuronen: verjittertes Gitter über den Rand hinaus, Mitte = (0,0)
  const cell = W < 640 ? 70 : 96;
  const cols = Math.ceil(W / cell) + 4, rows = Math.ceil(H / cell) + 4;
  const nodes = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    nodes.push({ x: (i - (cols - 1) / 2) * cell + (rnd() - 0.5) * cell * 0.9, y: (j - (rows - 1) / 2) * cell + (rnd() - 0.5) * cell * 0.9, r: 1.6 + rnd() * rnd() * 3.4, ph: rnd() * 6.28, T: Infinity, adj: [] });
  }
  // Synapsen: je Neuron die nächsten Nachbarn, leicht gebogen
  const seen = new Set(), edges = [];
  nodes.forEach((n, i) => {
    nodes.map((m, j) => [j, Math.hypot(n.x - m.x, n.y - m.y)])
      .filter(([j, d]) => j !== i && d < cell * 1.9)
      .sort((p, q) => p[1] - q[1]).slice(0, 4).forEach(([j, d]) => {
        const k = i < j ? i + '_' + j : j + '_' + i;
        if (seen.has(k)) return; seen.add(k);
        const m = nodes[j], nx = -(m.y - n.y) / d, ny = (m.x - n.x) / d, b = (rnd() - 0.5) * d * 0.35;
        const e = { a: i, b: j, d, cx: (n.x + m.x) / 2 + nx * b, cy: (n.y + m.y) / 2 + ny * b };
        edges.push(e); n.adj.push(e); m.adj.push(e);
      });
  });
  // Feuerzeit: Signal läuft von der Mitte entlang der Synapsen (kürzeste Wege)
  let c0 = 0, best = 1e9;
  nodes.forEach((n, i) => { const d = Math.hypot(n.x, n.y); if (d < best) { best = d; c0 = i; } });
  nodes[c0].T = 0;
  const open = [c0];
  while (open.length) {
    open.sort((p, q) => nodes[q].T - nodes[p].T);
    const i = open.pop();
    nodes[i].adj.forEach(e => {
      const j = e.a === i ? e.b : e.a, t = nodes[i].T + e.d * (0.8 + rnd() * 0.5);
      if (t < nodes[j].T) { nodes[j].T = t; if (!open.includes(j)) open.push(j); }
    });
  }
  const TM = Math.max.apply(null, nodes.map(n => n.T));
  nodes.forEach(n => { n.T = 0.02 + 0.6 * n.T / TM; });
  edges.forEach(e => {
    const A = nodes[e.a], B = nodes[e.b];
    e.from = A.T <= B.T ? A : B; e.to = e.from === A ? B : A;      // Signalrichtung
    e.t0 = e.from.T; e.t1 = Math.max(e.to.T, e.t0 + 0.02);
  });
  const FADE = 0.26, BLOB = cell * 1.75;

  const spr = document.createElement('canvas'); spr.width = spr.height = 64;
  const sg = spr.getContext('2d');
  const gr = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,248,215,1)'); gr.addColorStop(0.25, 'rgba(240,200,80,0.7)'); gr.addColorStop(1, 'rgba(212,175,55,0)');
  sg.fillStyle = gr; sg.fillRect(0, 0, 64, 64);
  const msk = document.createElement('canvas'); msk.width = msk.height = 128;     // weicher Ausschnitt für die Öffnung
  const mg = msk.getContext('2d');
  const mr = mg.createRadialGradient(64, 64, 0, 64, 64, 64);
  mr.addColorStop(0, 'rgba(0,0,0,1)'); mr.addColorStop(0.55, 'rgba(0,0,0,1)'); mr.addColorStop(1, 'rgba(0,0,0,0)');
  mg.fillStyle = mr; mg.fillRect(0, 0, 128, 128);

  const t0 = performance.now();
  let done = false;
  function finish() {
    if (done) return; done = true;
    cv.remove();
  }

  function frame(now) {
    if (done) return;
    const u = window.__u !== undefined ? window.__u : (now - t0) / INTRO_MS;
    const tm = (now - t0) / 1000;
    bgc = getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || bgc;   // folgt Hell/Dunkel-Modus
    // Zwei Versionen: Tag (dunkles Gold auf hell) und Nacht (helles Gold auf dunkel)
    const pal = isDark ? { base: '212,175,55', hot: '255,236,170' } : { base: '150,112,40', hot: '110,78,16' };
    const boot = cl(u / 0.05);

    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.fillStyle = bgc; g.fillRect(0, 0, W, H);
    g.translate(W / 2, H / 2);
    g.globalCompositeOperation = 'destination-out';              // Öffnung um jedes gefeuerte Neuron
    nodes.forEach(n => {
      const p = ease((u - n.T) / 0.2);
      if (p <= 0) return;
      const R = BLOB * (0.35 + 0.65 * p);
      g.globalAlpha = p;
      g.drawImage(msk, n.x - R, n.y - R, R * 2, R * 2);
    });
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    // Synapsen
    g.lineCap = 'round';
    edges.forEach(e => {
      const A = nodes[e.a], B = nodes[e.b];
      const life = 1 - ease((u - Math.max(A.T, B.T)) / FADE);
      if (life <= 0.01) return;
      const act = cl(1 - Math.abs(u - (e.t0 + e.t1) / 2) / 0.06);         // aufleuchten, wenn das Signal darüber läuft
      g.strokeStyle = 'rgba(' + (act > 0.05 ? pal.hot : pal.base) + ',' + (0.14 + 0.2 * (1 - Math.abs(A.ph - B.ph) / 6.28) + 0.6 * act) * boot * life + ')';
      g.lineWidth = 0.8 + act * 1.2;
      g.beginPath(); g.moveTo(A.x, A.y); g.quadraticCurveTo(e.cx, e.cy, B.x, B.y); g.stroke();
      // Signalpuls entlang der Synapse
      const f = (u - e.t0) / (e.t1 - e.t0);
      if (f > 0 && f < 1) {
        const F = e.from, T = e.to, q = 1 - f;
        const x = q * q * F.x + 2 * q * f * e.cx + f * f * T.x, y = q * q * F.y + 2 * q * f * e.cy + f * f * T.y;
        g.globalCompositeOperation = isDark ? 'lighter' : 'source-over';
        g.drawImage(spr, x - 9, y - 9, 18, 18);
        g.globalCompositeOperation = 'source-over';
      }
    });
    // Neuronen
    nodes.forEach(n => {
      const life = 1 - ease((u - n.T) / FADE);
      if (life <= 0.01) return;
      const fire = cl(1 - Math.abs(u - n.T) / 0.07);
      const tw = 0.7 + 0.3 * Math.sin(tm * 3 + n.ph);
      const sz = (n.r * 3.2 + fire * 16) * life + 3;
      g.globalAlpha = Math.min(1, (0.55 * tw + 0.6 * fire) * boot * life);
      g.drawImage(spr, n.x - sz, n.y - sz, sz * 2, sz * 2);
      g.globalAlpha = Math.min(1, 0.9 * boot * life);
      g.fillStyle = 'rgba(' + (fire > 0.1 ? pal.hot : pal.base) + ',1)';
      g.beginPath(); g.arc(n.x, n.y, n.r * life + 0.6, 0, 6.283); g.fill();
    });
    g.globalAlpha = 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (u < 1 || window.__u !== undefined) requestAnimationFrame(frame); else finish();
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

// 6. Subpage 02: Projektleitung (Rohbau inkl. Großguss, Gesamtfahrzeug inkl. DMU & Schnittstellen)
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
  }
};

function setAmgScope(key) {
  ['rohbau', 'overall'].forEach(k => {
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
  initMediaVideos();
  setAmgScope('rohbau');
  resizeBgCanvas();
  showView(viewFromHash());
  ScanFlow.start();
  requestAnimationFrame(renderAmbientBg);
});

// 8. Digitale Medien: Videos laufen nur sichtbar; Website-Vorschau (diese Seite) lädt erst bei Bedarf, folgt Tag/Nacht und blättert durch die Ansichten
const TOUR_VIEWS = ['home', 'consulting', 'projektleitung', 'founder'];
function previewFrame() { return document.querySelector('.site-preview iframe'); }
function syncPreviewTheme() {
  const fr = previewFrame();
  if (fr && fr.contentWindow) fr.contentWindow.postMessage({ type: 'dw-theme', dark: isDark }, '*');
}
function initMediaVideos() {
  const vids = document.querySelectorAll('.media-vid video');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => (en.isIntersecting ? en.target.play().catch(() => {}) : en.target.pause())), { threshold: 0.25 });
    vids.forEach(v => io.observe(v));
  }

  const box = document.querySelector('.site-preview');
  const fr = box && box.querySelector('iframe');
  if (!fr || EMBED) { if (box) box.remove(); return; }       // in der Vorschau selbst keine Vorschau (sonst Endlosschleife)
  const fit = () => {
    const sc = box.clientWidth / 1280;
    fr.style.height = Math.ceil(box.clientHeight / sc) + 'px';
    fr.style.transform = 'scale(' + sc + ')';
  };
  new ResizeObserver(fit).observe(box);
  let tour = null, idx = 0;
  const stop = () => { clearInterval(tour); tour = null; };
  const start = () => {
    if (tour) return;
    const step = () => { if (fr.contentWindow) fr.contentWindow.postMessage({ type: 'dw-view', view: TOUR_VIEWS[idx++ % TOUR_VIEWS.length] }, '*'); };
    step(); tour = setInterval(step, 5200);
  };
  fr.addEventListener('load', () => { syncPreviewTheme(); start(); });
  new IntersectionObserver(en => {
    const on = en.some(x => x.isIntersecting);
    if (on && !fr.src) { fr.src = fr.dataset.src + '&theme=' + (isDark ? 'dark' : 'light'); fit(); }
    else if (on) start(); else stop();
  }, { threshold: 0.1 }).observe(box);
}

// Als Vorschau eingebettet: Tag/Nacht und Ansicht kommen von der Elternseite, Ansicht wird langsam durchgescrollt
if (EMBED) {
  window.addEventListener('message', e => {
    const d = e.data || {};
    if (d.type === 'dw-theme') { isDark = !!d.dark; applyTheme(); }
    if (d.type === 'dw-view' && d.view in ROUTES) {
      showView(d.view);
      setTimeout(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        const from = 0, to = Math.min(max, 700), t0 = performance.now(), dur = 3600;
        (function go(now) {
          const k = Math.min(1, (now - t0) / dur), v = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          window.scrollTo(0, from + (to - from) * v);
          if (k < 1) requestAnimationFrame(go);
        })(t0);
      }, 700);
    }
  });
}
