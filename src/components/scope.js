// "אוסצילוסקופ": ציור אות על canvas, עם רשת כמו בנייר אק"ג.
// createScope — רצועה סטטית (אפשר לסמן עליה נקודה בעכבר, במגע או במקלדת).
// createLiveScope — מוניטור שרץ בזמן אמת, עם "מחק" שעובר על המסך כמו במכשיר אמיתי.
// הזמן תמיד זורם משמאל לימין (כמו בכל מכשיר רפואי), גם באתר בעברית.
import { h, prefersReducedMotion } from '../lib/dom.js';

export const COLORS = {
  bg: '#04090a',
  gridMinor: 'rgba(94, 230, 168, 0.07)',
  gridMajor: 'rgba(94, 230, 168, 0.17)',
  trace: '#6ff2b4',
  heart: '#ff7088',
  spark: '#ffd166',
  brain: '#b9a3ff',
  text: 'rgba(232, 236, 241, 0.75)',
  cursor: 'rgba(255, 255, 255, 0.55)',
  mark: '#ffd166',
  hit: '#7fcf9b',
};

// רשת: grid = 'ecg' (0.04 שניות × 0.1 מ"ו, וקווים עבים כל 0.2 שניות × 0.5 מ"ו) או {x, y, major}
function gridSteps(grid) {
  if (grid === 'ecg') return { x: 0.04, y: 0.1, major: 5 };
  return { major: 5, ...grid };
}

function setupCanvas(canvas, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h: cssH };
}

function drawGrid(ctx, w, hgt, { t0, dur, yMin, yMax, grid, x0 = 0, x1 = w }) {
  const g = gridSteps(grid);
  const X = (t) => ((t - t0) / dur) * w;
  const Y = (v) => hgt - ((v - yMin) / (yMax - yMin)) * hgt;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, hgt); ctx.clip();
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(x0, 0, x1 - x0, hgt);
  if (g.x) {
    const start = Math.ceil(t0 / g.x - 1e-6);
    for (let i = start; i * g.x <= t0 + dur + 1e-9; i++) {
      const x = Math.round(X(i * g.x)) + 0.5;
      if (x < x0 - 1 || x > x1 + 1) continue;
      ctx.strokeStyle = i % g.major === 0 ? COLORS.gridMajor : COLORS.gridMinor;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, hgt); ctx.stroke();
    }
  }
  if (g.y) {
    const start = Math.ceil(yMin / g.y - 1e-6);
    for (let i = start; i * g.y <= yMax + 1e-9; i++) {
      const y = Math.round(Y(i * g.y)) + 0.5;
      ctx.strokeStyle = i % g.major === 0 ? COLORS.gridMajor : COLORS.gridMinor;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    }
  }
  ctx.restore();
}

function scaleBar(ctx, w, hgt, { dur, yMin, yMax, scale }) {
  if (!scale) return;
  const { t, v, tLabel, vLabel } = scale;
  const px = (t / dur) * w, py = (v / (yMax - yMin)) * hgt;
  const x = 10, y = hgt - 10;
  ctx.save();
  ctx.strokeStyle = COLORS.text; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, y - py); ctx.lineTo(x, y); ctx.lineTo(x + px, y); ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = '600 11px Heebo Variable, Heebo, system-ui, sans-serif';
  ctx.direction = 'rtl';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(tLabel, x + 4, y - 3);
  ctx.textBaseline = 'middle';
  ctx.fillText(vLabel, x + 5, y - py + 6);
  ctx.restore();
}

function traceSegment(ctx, fn, { t0, dur, yMin, yMax, w, hgt, from, to }) {
  const sub = Math.min(24, Math.max(2, Math.ceil(dur / w / 0.0005)));
  const n = Math.ceil((to - from) * sub);
  const Y = (v) => hgt - ((v - yMin) / (yMax - yMin)) * hgt;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const x = from + i / sub;
    const v = fn(t0 + (x / w) * dur);
    if (i === 0) ctx.moveTo(x, Y(v)); else ctx.lineTo(x, Y(v));
  }
  ctx.stroke();
}

function styleTrace(ctx, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
}

/**
 * רצועה סטטית.
 * @param {object} o
 * @param {(t:number)=>number} o.fn
 * @param {number} o.duration
 * @param {number} o.yMin
 * @param {number} o.yMax
 * @param {string} o.label   תיאור לקורא מסך
 * @param {'ecg'|{x:number,y:number,major?:number}} [o.grid]
 * @param {{t:number,v:number,tLabel:string,vLabel:string}} [o.scale]
 * @param {number} [o.height]
 * @param {string} [o.color]
 * @param {(t:number)=>void} [o.onMark]  אם קיים — אפשר לסמן נקודה על הרצועה
 */
export function createScope(o) {
  const height = o.height ?? 170;
  const t0 = o.t0 ?? 0;
  const canvas = h('canvas', { class: 'scope-canvas', style: `height:${height}px` });
  const markable = typeof o.onMark === 'function';
  const el = h('div', {
    class: `scope${markable ? ' is-markable' : ''}`,
    dir: 'ltr',
    role: markable ? 'slider' : 'img',
    'aria-label': o.label,
    tabindex: markable ? '0' : null,
    'aria-valuemin': markable ? '0' : null,
    'aria-valuemax': markable ? String(o.duration) : null,
  }, canvas);
  if (o.tag) el.append(h('span', { class: 'scope-tag', text: o.tag }));

  let cursor = null, marker = null, locked = false;
  const highlights = [];
  let geom = null;

  function draw() {
    geom = setupCanvas(canvas, height);
    const { ctx, w } = geom;
    const box = { t0, dur: o.duration, yMin: o.yMin, yMax: o.yMax, grid: o.grid ?? 'ecg' };
    drawGrid(ctx, w, height, box);
    const X = (t) => ((t - t0) / o.duration) * w;
    for (const hl of highlights) {
      ctx.fillStyle = hl.fill ?? 'rgba(255, 209, 102, 0.16)';
      ctx.fillRect(X(hl.from), 0, X(hl.to) - X(hl.from), height);
      ctx.strokeStyle = hl.stroke ?? 'rgba(255, 209, 102, 0.7)';
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(X(hl.from) + 0.5, 0.5, X(hl.to) - X(hl.from) - 1, height - 1);
      ctx.setLineDash([]);
      if (hl.label) {
        ctx.font = '700 12px Heebo Variable, Heebo, system-ui, sans-serif';
        ctx.fillStyle = hl.stroke ?? COLORS.mark;
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        const cx = Math.min(w - 40, Math.max(40, (X(hl.from) + X(hl.to)) / 2));
        ctx.fillText(hl.label, cx, hl.labelBottom ? height - 6 : 15);
        ctx.textAlign = 'start'; ctx.direction = 'ltr';
      }
    }
    for (const tr of o.traces ?? []) {
      ctx.save();
      styleTrace(ctx, tr.color);
      if (tr.dash) ctx.setLineDash(tr.dash);
      traceSegment(ctx, tr.fn, { ...box, yMin: tr.yMin ?? o.yMin, yMax: tr.yMax ?? o.yMax, w, hgt: height, from: 0, to: w });
      ctx.restore();
    }
    if (o.fn) {
      ctx.save();
      styleTrace(ctx, o.color ?? COLORS.trace);
      traceSegment(ctx, o.fn, { ...box, w, hgt: height, from: 0, to: w });
      ctx.restore();
    }
    for (const ln of o.hlines ?? []) {
      const y = Math.round(height - ((ln.v - o.yMin) / (o.yMax - o.yMin)) * height) + 0.5;
      ctx.save(); ctx.strokeStyle = ln.color ?? COLORS.cursor; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      if (ln.label) { ctx.setLineDash([]); ctx.fillStyle = ln.color ?? COLORS.text; ctx.font = '600 11px Heebo Variable, Heebo, system-ui, sans-serif'; ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.fillText(ln.label, w - 8, y - 4); }
      ctx.restore();
    }
    scaleBar(ctx, w, height, { dur: o.duration, yMin: o.yMin, yMax: o.yMax, scale: o.scale });
    const line = (t, color, width, dash) => {
      const x = Math.round(X(t)) + 0.5;
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); ctx.restore();
    };
    if (cursor != null && !locked) line(cursor, COLORS.cursor, 1, [3, 3]);
    if (marker != null) {
      line(marker.t, marker.color ?? COLORS.mark, 2.5);
      ctx.fillStyle = marker.color ?? COLORS.mark;
      ctx.beginPath(); ctx.arc(X(marker.t), 8, 5, 0, 6.283); ctx.fill();
    }
  }

  const tAt = (clientX) => {
    const r = canvas.getBoundingClientRect();
    return t0 + Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * o.duration;
  };

  if (markable) {
    el.addEventListener('pointermove', (e) => { if (!locked && e.pointerType === 'mouse') { cursor = tAt(e.clientX); draw(); } });
    el.addEventListener('pointerleave', () => { cursor = null; draw(); });
    el.addEventListener('click', (e) => { if (!locked) mark(tAt(e.clientX)); });
    el.addEventListener('keydown', (e) => {
      if (locked) return;
      const step = o.duration / 60;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        cursor = Math.min(t0 + o.duration, Math.max(t0, (cursor ?? t0 + o.duration / 2) + (e.key === 'ArrowRight' ? step : -step)));
        el.setAttribute('aria-valuenow', cursor.toFixed(2));
        el.setAttribute('aria-valuetext', `${cursor.toFixed(1)} שניות`);
        draw();
      } else if ((e.key === 'Enter' || e.key === ' ') && cursor != null) {
        e.preventDefault();
        mark(cursor);
      }
    });
  }

  function mark(t) {
    marker = { t };
    draw();
    o.onMark(t);
  }

  new ResizeObserver(() => draw()).observe(el);

  return {
    el,
    redraw: draw,
    set(next) { Object.assign(o, next); draw(); },
    setMarker(t, color) { marker = t == null ? null : { t, color }; draw(); },
    highlight(hl) { highlights.push(hl); draw(); },
    clearHighlights() { highlights.length = 0; draw(); },
    lock() { locked = true; cursor = null; el.classList.add('is-locked'); el.removeAttribute('tabindex'); draw(); },
  };
}

/**
 * מוניטור חי.
 * @param {object} o
 * @param {(t:number)=>number} o.fn       ערך האות ברגע t (שניות מאז ההפעלה)
 * @param {number} o.window              כמה שניות רואים על המסך
 * @param {number} o.yMin
 * @param {number} o.yMax
 * @param {string} o.label
 * @param {(t:number)=>void} [o.onTick]  נקרא בכל פריים עם הזמן הנוכחי
 */
export function createLiveScope(o) {
  const height = o.height ?? 180;
  const bgCanvas = h('canvas', { class: 'scope-canvas', style: `height:${height}px` });
  const fgCanvas = h('canvas', { class: 'scope-canvas scope-fg', style: `height:${height}px` });
  const playBtn = h('button', { type: 'button', class: 'scope-play', text: '▶ הפעלה' });
  const el = h('div', { class: 'scope is-live', dir: 'ltr', role: 'img', 'aria-label': o.label }, bgCanvas, fgCanvas, playBtn);
  if (o.tag) el.append(h('span', { class: 'scope-tag', text: o.tag }));

  let bg, fg, raf = 0, running = false, t = 0, lastWall = 0, lastX = 0;
  const box = () => ({ t0: 0, dur: o.window, yMin: o.yMin, yMax: o.yMax, grid: o.grid ?? 'ecg' });

  function resize() {
    bg = setupCanvas(bgCanvas, height);
    fg = setupCanvas(fgCanvas, height);
    drawGrid(bg.ctx, bg.w, height, box());
    scaleBar(bg.ctx, bg.w, height, { dur: o.window, yMin: o.yMin, yMax: o.yMax, scale: o.scale });
    fg.ctx.clearRect(0, 0, fg.w, height);
    styleTrace(fg.ctx, o.color ?? COLORS.trace);
    lastX = ((t % o.window) / o.window) * fg.w;
  }

  function frame(now) {
    if (!running) return;
    const dtWall = Math.min(0.1, (now - lastWall) / 1000);
    lastWall = now;
    const tNew = t + dtWall * (o.speed ?? 1);
    const w = fg.w, ctx = fg.ctx;
    const xNew = ((tNew % o.window) / o.window) * w;
    const gap = 18;
    const segs = xNew >= lastX ? [[lastX, xNew, t]] : [[lastX, w, t], [0, xNew, tNew - (xNew / w) * o.window]];
    for (const [a, b, tStart] of segs) {
      // מוחקים קצת לפני המחוג, כמו במוניטור אמיתי
      ctx.clearRect(a + 1, 0, Math.min(gap + (b - a), w - a), height);
      if (b + gap > w) ctx.clearRect(0, 0, b + gap - w, height);
      const t0 = tStart - (a / w) * o.window;
      traceSegment(ctx, o.fn, { t0, dur: o.window, yMin: o.yMin, yMax: o.yMax, w, hgt: height, from: a, to: b });
    }
    // נקודה זוהרת בראש המחוג
    t = tNew; lastX = xNew;
    o.onTick?.(t);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    playBtn.hidden = true;
    lastWall = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    playBtn.hidden = false;
    playBtn.textContent = '▶ המשך';
  }
  playBtn.addEventListener('click', start);
  el.addEventListener('click', (e) => { if (e.target !== playBtn && o.pauseOnClick !== false && running) stop(); });

  new ResizeObserver(() => resize()).observe(el);
  queueMicrotask(resize);

  const reduced = prefersReducedMotion() || document.documentElement.classList.contains('a11y-still');
  if (o.autoplay !== false && !reduced) queueMicrotask(start);

  // לא מבזבזים סוללה כשהלשונית מוסתרת
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) { running = false; cancelAnimationFrame(raf); el.dataset.resume = '1'; }
    else if (!document.hidden && el.dataset.resume) { delete el.dataset.resume; running = false; start(); }
  });

  return {
    el,
    start, stop,
    get time() { return t; },
    get running() { return running; },
    reset() { t = 0; resize(); },
  };
}
