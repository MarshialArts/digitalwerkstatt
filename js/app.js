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

// 4. SPA Router & Direct Project Inquiry Helper
// Routing: jede Ansicht hat eine URL (#beratung etc.), Zurück-Button bleibt auf der Seite
const ROUTES = {
  home: '',
  consulting: 'beratung',
  projektleitung: 'projektleitung',
  digitalisierung: 'digitalisierung',
  founder: 'ueber-mich',
  impressum: 'impressum',
  datenschutz: 'datenschutz'
};
const VIEW_TITLES = {
  consulting: 'KI-Beratung',
  projektleitung: 'Projektleitung',
  digitalisierung: 'Digitalisierung',
  founder: 'Über mich & Kontakt',
  impressum: 'Impressum',
  datenschutz: 'Datenschutz'
};
const BASE_TITLE = document.title;

function viewFromHash() {
  const slug = decodeURIComponent(location.hash.replace(/^#\/?/, '')).toLowerCase();
  if (!slug) return 'home';
  const hit = Object.keys(ROUTES).find(k => ROUTES[k] === slug || k === slug);
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
  document.title = VIEW_TITLES[viewId] ? VIEW_TITLES[viewId] + ' | digitalwerkstatt' : BASE_TITLE;
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
    if (viewId === 'digitalisierung') resizeCanvas();
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

// 5. Subpage 01: Beratung (KI-Consulting) Sandbox
const aiMods = [
  {
    title: 'SCHWERPUNKT 01 // BEDARFSANALYSE & WORKFLOW',
    badge: 'Gratis-Call + Live-Setup',
    desc: 'Nach einem kurzen Gratis-Call zum Abstecken Ihres Bedarfs entwickeln wir per Video-Call oder vor Ort wiederverwendbare Prompt-Architekturen und Vorlagen.'
  },
  {
    title: 'SCHWERPUNKT 02 // LOKALE KI & MEDIEN',
    badge: 'Auf Ihrem System',
    desc: 'Gemeinsame Einrichtung lokaler KI-Modelle (ComfyUI, Flux, Ollama/LM Studio) für datenschutzkonforme Text-, Bild- und Videogenerierung ohne Abo-Zwang.'
  },
  {
    title: 'SCHWERPUNKT 03 // AUTOMATISIERUNG',
    badge: 'Video-Call oder Vor Ort',
    desc: 'Wir lösen technische Blockaden und verbinden Ihre bestehenden Tools direkt vor Ort oder remote mit maßgeschneiderten KI-Assistenten.'
  }
];
let curAi = 0;

function selectAiMod(idx) {
  curAi = idx;
  document.querySelectorAll('.aimod-btn').forEach((b, i) => {
    b.style.borderColor = (i === idx) ? '#D4AF37' : '';
  });
  runAiDemo();
}

function runAiDemo() {
  const loader = document.getElementById('aiLoader');
  if (!loader) return;
  loader.classList.remove('hidden');
  setTimeout(() => {
    const m = aiMods[curAi];
    const titleEl = document.getElementById('aiTitle');
    const badgeEl = document.getElementById('aiBadge');
    const descEl = document.getElementById('aiDesc');
    if (titleEl) titleEl.textContent = m.title;
    if (badgeEl) badgeEl.textContent = m.badge;
    if (descEl) descEl.textContent = m.desc;
    loader.classList.add('hidden');
  }, 420);
}

// 6. Subpage 02: Projektleitung (Rohbau inkl. Großguss, Gesamtfahrzeug inkl. DMU & Schnittstellen, Drohnen inkl. C-UAS)
const amgData = {
  rohbau: {
    tag: 'SCHWERPUNKT // KAROSSERIEROHBAU',
    heading: 'Rohbau & Spezialität Großguss',
    copy: 'Technische Projektleitung im Karosserierohbau (Body-in-White) mit ausgewiesener Spezialität im Bereich Großguss (Mega-/Giga-Casting) sowie komplexer Unterboden- und Heckwagenstrukturen – von der Konzeptphase über die internationale Lieferantensteuerung bis zur Serienreife.',
    s1: 'Rohbau & Großguss',
    s2: 'Audi, VW, Rivian u.a.',
    img: 'img/amg_heckwagen.jpg',
    cap: 'Mercedes-AMG GT 4-Türer Coupé',
    sub: 'Referenzbeispiel: Mercedes-AMG GT 4-Türer',
    showOverlay: false
  },
  overall: {
    tag: 'SCHWERPUNKT // GESAMTFAHRZEUG',
    heading: 'Schnittstellenmanagement & Digital Mockup (DMU)',
    copy: 'Baugruppenübergreifende Steuerung im Gesamtfahrzeug: Technisches Schnittstellenmanagement, Digital Mockup (DMU) und geometrische Absicherung, Reifegradmanagement sowie internationale Erprobungs- und Anlaufkoordination.',
    s1: 'Schnittstellen & DMU',
    s2: 'OEM-Reifegradsteuerung',
    img: 'img/saleen_gesamt.jpg',
    cap: 'Gesamtfahrzeug-Entwicklung · Saleen S1',
    sub: 'Referenzbeispiel: Saleen Gesamtfahrzeug',
    showOverlay: false
  },
  uav: {
    tag: 'SCHWERPUNKT // DROHNEN & C-UAS',
    heading: 'UAV-Projekte & C-UAS (Counter-UAS)',
    copy: 'Projektsteuerung und Produktmanagement für kommerzielle Drohnen-Befliegungen sowie C-UAS-Systeme (Counter-UAS / Drohnenabwehr und Luftraumsicherheit) – von der technischen Konzeption über die Systemintegration bis zur operativen Durchführung.',
    s1: 'UAV & C-UAS Erfahrung',
    s2: '7+ Jahre Flugpraxis',
    img: 'img/cuas.jpg',
    cap: 'C-UAS · Drohnenabwehr',
    sub: 'Drohnen- & C-UAS-Projekte',
    showOverlay: false
  }
};

function setAmgScope(key) {
  ['rohbau', 'overall', 'uav'].forEach(k => {
    const btn = document.getElementById('amg-btn-' + k);
    if (btn) {
      btn.className = (k === key)
        ? 'px-4 py-1.5 rounded-full text-xs font-medium btn-gold'
        : 'px-4 py-1.5 rounded-full text-xs font-medium text-sec';
    }
  });
  const d = amgData[key];
  if (!d) return;

  const tagEl = document.getElementById('amgScopeTag');
  const headEl = document.getElementById('amgScopeHeading');
  const copyEl = document.getElementById('amgScopeCopy');
  const s1El = document.getElementById('amgStat1');
  const s2El = document.getElementById('amgStat2');
  const svgEl = document.getElementById('amgOverlaySvg');

  if (tagEl) tagEl.textContent = d.tag;
  if (headEl) headEl.textContent = d.heading;
  if (copyEl) copyEl.textContent = d.copy;
  if (s1El) s1El.textContent = d.s1;
  if (s2El) s2El.textContent = d.s2;
  if (svgEl) svgEl.style.opacity = d.showOverlay ? '1' : '0';

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

// 7. Subpage 03: Interactive 3D Point Cloud Scanner
const canvas = document.getElementById('pointCloudCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let pcMode = 'cloud';
let rotY = 0.6, rotX = 0.42;
let dragging = false, lx = 0, ly = 0, scanT = 0;

const N = 22;
const pts = [];
for (let i = 0; i < N; i++) {
  for (let j = 0; j < N; j++) {
    const nx = (i / (N - 1)) * 2 - 1;
    const nz = (j / (N - 1)) * 2 - 1;
    let ny = Math.sin(nx * 2.4) * Math.cos(nz * 2.4) * 0.17;
    if (Math.abs(nx) < 0.42 && Math.abs(nz) < 0.32) {
      ny = -0.42 - (0.15 * (1 - Math.abs(nx) * 1.7));
    }
    pts.push({ x: nx * 155, y: ny * 140, z: nz * 155, elev: ny });
  }
}

function resizeCanvas() {
  if (!canvas || !canvas.parentElement) return;
  const r = canvas.parentElement.getBoundingClientRect();
  canvas.width = r.width || 640;
  canvas.height = r.height || 400;
}
window.addEventListener('resize', resizeCanvas);

function setPcMode(m) {
  pcMode = m;
  ['cloud', 'mesh', 'elev'].forEach(k => {
    const b = document.getElementById('pc-' + k);
    if (b) {
      b.className = (k === m)
        ? 'px-3.5 py-1.5 rounded-full text-xs font-medium btn-gold'
        : 'px-3.5 py-1.5 rounded-full text-xs font-medium text-sec';
    }
  });
}

if (canvas) {
  canvas.addEventListener('mousedown', e => { dragging = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    rotY += (e.clientX - lx) * 0.008;
    rotX = Math.max(0.12, Math.min(1.18, rotX + (e.clientY - ly) * 0.006));
    lx = e.clientX; ly = e.clientY;
  });

  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { dragging = true; lx = e.touches[0].clientX; ly = e.touches[0].clientY; }
  }, { passive: true });
  window.addEventListener('touchend', () => { dragging = false; });
  window.addEventListener('touchmove', e => {
    if (!dragging || e.touches.length !== 1) return;
    rotY += (e.touches[0].clientX - lx) * 0.008;
    rotX = Math.max(0.12, Math.min(1.18, rotX + (e.touches[0].clientY - ly) * 0.006));
    lx = e.touches[0].clientX; ly = e.touches[0].clientY;
  }, { passive: true });
}

function project3D(x, y, z, w, h) {
  const cy = Math.cos(rotY), sy = Math.sin(rotY);
  const x1 = x * cy - z * sy, z1 = z * cy + x * sy;
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  const y2 = y * cx - z1 * sx, z2 = z1 * cx + y * sx;
  const fov = 430;
  const s = fov / (fov + z2 + 285);
  return { px: w / 2 + x1 * s, py: h / 2 + y2 * s + 22, s, z: z2 };
}

function renderScanner() {
  if (!canvas || !ctx) return;
  if (canvas.width === 0) resizeCanvas();
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (!dragging) rotY += 0.003;
  scanT += 0.028;
  const waveZ = Math.sin(scanT) * 150;

  const proj = pts.map(p => ({ ...p, ...project3D(p.x, p.y, p.z, w, h) }));

  if (pcMode === 'mesh') {
    ctx.lineWidth = 0.8;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const idx = i * N + j;
        const p1 = proj[idx];
        ctx.strokeStyle = Math.abs(p1.z - waveZ) < 24 ? 'rgba(212, 175, 55, 0.8)' : 'rgba(212, 175, 55, 0.28)';
        if (j + 1 < N) {
          const p2 = proj[idx + 1];
          ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();
        }
        if (i + 1 < N) {
          const p3 = proj[(i + 1) * N + j];
          ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p3.px, p3.py); ctx.stroke();
        }
      }
    }
  }

  for (let i = 0; i < proj.length; i++) {
    const p = proj[i];
    const hit = Math.abs(p.z - waveZ) < 20;
    const r = Math.max(1.3, p.s * (hit ? 3.2 : 2.2));
    ctx.beginPath();
    ctx.arc(p.px, p.py, r, 0, Math.PI * 2);

    if (hit) {
      ctx.fillStyle = '#E6C65A';
    } else if (pcMode === 'elev') {
      ctx.fillStyle = p.elev < -0.25 ? '#D4AF37' : (p.elev < 0 ? '#A1A1AA' : '#52525B');
    } else {
      ctx.fillStyle = p.elev < -0.25 ? '#D4AF37' : 'rgba(245, 245, 247, 0.72)';
    }
    ctx.fill();
  }

  // Orbiting Drone Node
  const da = scanT * 0.75;
  const d3 = project3D(Math.cos(da) * 85, -140, Math.sin(da) * 85, w, h);
  const t3 = project3D(0, -25, waveZ * 0.5, w, h);

  const g = ctx.createLinearGradient(d3.px, d3.py, t3.px, t3.py);
  g.addColorStop(0, 'rgba(212, 175, 55, 0.65)');
  g.addColorStop(1, 'rgba(212, 175, 55, 0.02)');
  ctx.strokeStyle = g;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(d3.px, d3.py); ctx.lineTo(t3.px - 42, t3.py);
  ctx.moveTo(d3.px, d3.py); ctx.lineTo(t3.px + 42, t3.py);
  ctx.stroke();

  ctx.fillStyle = '#D4AF37';
  ctx.beginPath();
  ctx.arc(d3.px, d3.py, 4.5, 0, Math.PI * 2);
  ctx.fill();

  requestAnimationFrame(renderScanner);
}

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
  initCardFocus();
  resizeBgCanvas();
  showView(viewFromHash());
  resizeCanvas();
  requestAnimationFrame(renderScanner);
  requestAnimationFrame(renderAmbientBg);
});