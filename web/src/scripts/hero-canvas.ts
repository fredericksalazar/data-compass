// Navbar scroll effect
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// Scroll hint fade-out
const hint = document.getElementById('scroll-hint');
if (hint) {
  window.addEventListener('scroll', () => {
    hint.classList.toggle('hidden-hint', window.scrollY > 80);
  }, { passive: true });
}

// 3D Dot Canvas Animation
(function () {
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const NUM_DOTS     = 260;
  const FOV          = 400;
  const SPEED        = 0.35;
  const Z_FAR        = 900;
  const Z_NEAR       = 60;
  const CONNECT_DIST = 140; // screen-space px threshold
  const MAX_LINKS    = 4;

  interface Dot { x: number; y: number; z: number; sx: number; sy: number; r: number; alpha: number; }

  const dots: Dot[] = [];

  function rnd(a: number, b: number) { return Math.random() * (b - a) + a; }

  function scatter(d: Dot) {
    d.x = rnd(-canvas.width * 1.5, canvas.width * 1.5);
    d.y = rnd(-canvas.height * 1.5, canvas.height * 1.5);
    d.z = rnd(Z_NEAR + 60, Z_FAR);
  }

  function init() {
    dots.length = 0;
    for (let i = 0; i < NUM_DOTS; i++) {
      const d: Dot = { x: 0, y: 0, z: 0, sx: 0, sy: 0, r: 0, alpha: 0 };
      scatter(d);
      d.z = rnd(Z_NEAR, Z_FAR); // stagger initial depth
      dots.push(d);
    }
  }

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function project(d: Dot) {
    const scale = FOV / (d.z + FOV);
    d.sx    = d.x * scale + canvas.width  / 2;
    d.sy    = d.y * scale + canvas.height / 2;
    d.r     = Math.max(0.5, 2.8 * scale);
    d.alpha = Math.min(1, scale * 1.3);
  }

  function dotColor(d: Dot): string {
    const t = 1 - d.z / Z_FAR;                  // 0 = far, 1 = near
    const r = Math.round(71  + (96  - 71)  * t); // slate-600 → blue-400
    const g = Math.round(85  + (165 - 85)  * t);
    const b = Math.round(105 + (250 - 105) * t);
    return `rgba(${r},${g},${b},${d.alpha})`;
  }

  let raf = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const d of dots) {
      d.z -= SPEED;
      if (d.z < Z_NEAR) scatter(d);
      project(d);
    }

    // Lines
    ctx.lineWidth = 0.5;
    for (let i = 0; i < dots.length; i++) {
      let links = 0;
      for (let j = i + 1; j < dots.length; j++) {
        if (links >= MAX_LINKS) break;
        const dx = dots[i].sx - dots[j].sx;
        const dy = dots[i].sy - dots[j].sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          const opacity = (1 - dist / CONNECT_DIST) * 0.18 * Math.min(dots[i].alpha, dots[j].alpha);
          ctx.strokeStyle = `rgba(96,165,250,${opacity})`;
          ctx.beginPath();
          ctx.moveTo(dots[i].sx, dots[i].sy);
          ctx.lineTo(dots[j].sx, dots[j].sy);
          ctx.stroke();
          links++;
        }
      }
    }

    // Dots
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.sx, d.sy, d.r, 0, Math.PI * 2);
      ctx.fillStyle = dotColor(d);
      ctx.fill();
    }

    raf = requestAnimationFrame(animate);
  }

  const ro = new ResizeObserver(() => { resize(); init(); });
  ro.observe(canvas);
  resize();
  init();
  animate();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      animate();
    }
  });
})();
