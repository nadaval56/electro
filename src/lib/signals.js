// מחוללי אותות סינתטיים: אק"ג, גלי מוח (EEG), שריר (EMG), פוטנציאלי פעולה ופריקות של דג חשמלי.
// כל האותות באתר הם הדמיה (לא הקלטות אמיתיות), אבל הצורות, הזמנים והגדלים מבוססים על ערכים מקובלים.
// מחזיר פונקציה v(t) — ערך ברגע t בשניות. אקראיות דטרמיניסטית (seed), כך שהרצועה נראית אותו דבר בכל טעינה.

export function rng(seed = 1) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (t, c, w) => Math.exp(-0.5 * ((t - c) / w) ** 2);

// רעש חלק (ערכים אקראיים בנקודות קבועות ואינטרפולציה ביניהן)
export function smoothNoise(seed, rate) {
  const r = rng(seed);
  const pts = [];
  return (t) => {
    const x = Math.max(0, t) * rate;
    const i = Math.floor(x);
    while (pts.length <= i + 1) pts.push(r() * 2 - 1);
    const f = x - i, s = f * f * (3 - 2 * f);
    return pts[i] * (1 - s) + pts[i + 1] * s;
  };
}

// ---------- אק"ג ----------

// פעימה אחת, ביחס לתחילת הפעימה. s מכווץ את כל הזמנים בלב מהיר מאוד (עכבר, ציפור).
// גדלים במיליוולט: P קטן (עליות), QRS גבוה וצר (חדרים), T מעוגל (התאוששות החדרים).
export function ecgBeat(t, rr = 0.8, amp = 1) {
  const s = Math.min(1, rr / 0.45);
  const qt = 0.27 * Math.sqrt(Math.min(rr, 1.6)) * s; // T מתקרב ל-R כשהלב מהיר
  const R = 0.205 * s;
  return amp * (
    0.15 * gauss(t, 0.09 * s, 0.022 * s)
    - 0.10 * gauss(t, R - 0.02 * s, 0.008 * s)
    + 1.15 * gauss(t, R, 0.0095 * s)
    - 0.28 * gauss(t, R + 0.021 * s, 0.009 * s)
    + 0.30 * gauss(t, R + qt, 0.045 * s * Math.sqrt(Math.min(rr, 1.6)))
    + 0.06 * gauss(t, R + qt + 0.07 * s, 0.03 * s)
  );
}

// פעימה מהחדרים (קוצב גיבוי): בלי גל P, QRS רחב
export function ventricularBeat(t, amp = 1) {
  return amp * (0.95 * gauss(t, 0.06, 0.03) - 0.45 * gauss(t, 0.12, 0.035) - 0.25 * gauss(t, 0.36, 0.07));
}

// מחזיר את רגעי תחילת הפעימות לפי פונקציית דופק bpm(t)
export function beatTimes(duration, bpm, start = 0.05, jitter = 0, seed = 3) {
  const r = rng(seed);
  const out = [];
  let t = start;
  while (t < duration + 2) {
    out.push(t);
    const b = typeof bpm === 'function' ? bpm(t) : bpm;
    t += (60 / b) * (1 + (r() * 2 - 1) * jitter);
  }
  return out;
}

/**
 * @param {{bpm:number|number[][], duration:number, noise?:number, wander?:number, seed?:number, amp?:number, breath?:number, jitter?:number}} o
 * bpm: מספר, או רשימת נקודות [[t, bpm], ...] (דופק שמשתנה באופן רציף)
 */
function ecgBeats(o) {
  const bpmFn = Array.isArray(o.bpm) ? piecewise(o.bpm) : (o.breath
    ? (t) => o.bpm + o.breath * Math.sin((2 * Math.PI * t) / (o.breathPeriod ?? 4))
    : () => o.bpm);
  return beatTimes(o.duration, bpmFn, o.start ?? 0.05, o.jitter ?? 0.01, o.seed ?? 3);
}

// רגעי הגלים בכל פעימה (לבדיקת סימון בתיקים): P, R (שיא ה-QRS), T
export function ecgFeatures(o) {
  const beats = ecgBeats(o);
  const out = { P: [], R: [], T: [] };
  for (let i = 0; i < beats.length - 1; i++) {
    const rr = beats[i + 1] - beats[i], s = Math.min(1, rr / 0.45);
    const R = beats[i] + 0.205 * s;
    if (beats[i] > o.duration) break;
    out.P.push(beats[i] + 0.09 * s);
    out.R.push(R);
    out.T.push(R + 0.27 * Math.sqrt(Math.min(rr, 1.6)) * s);
  }
  return out;
}

export function ecg(o) {
  const beats = ecgBeats(o);
  const noise = smoothNoise((o.seed ?? 3) + 11, 60);
  const wander = smoothNoise((o.seed ?? 3) + 7, 0.4);
  const amp = o.amp ?? 1;
  return (t) => {
    let v = 0;
    // חיפוש בינארי לפעימה האחרונה שהתחילה לפני t
    let lo = 0, hi = beats.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (beats[m] <= t) lo = m; else hi = m - 1; }
    for (let i = Math.max(0, lo - 2); i <= Math.min(beats.length - 2, lo + 1); i++) {
      const dt = t - beats[i];
      if (dt < -0.05 || dt > 1.6) continue;
      v += ecgBeat(dt, beats[i + 1] - beats[i], amp);
    }
    return v + (o.noise ?? 0.015) * noise(t) + (o.wander ?? 0.04) * wander(t);
  };
}

export function piecewise(points) {
  return (t) => {
    if (t <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
      const [t1, v1] = points[i];
      if (t <= t1) {
        const [t0, v0] = points[i - 1];
        return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
      }
    }
    return points[points.length - 1][1];
  };
}

// ---------- גלי מוח ----------

// רצועות התדר: דלתא, תטא, אלפא, בטא. אמפליטודות במיקרו-וולט (פי אלף פחות מאק"ג!)
export const BANDS = {
  delta: { f: [0.8, 1.6, 2.5, 3.3], label: 'דלתא', range: '0.5–4' },
  theta: { f: [4.5, 5.5, 6.5, 7.4], label: 'תטא', range: '4–8' },
  alpha: { f: [9, 10, 10.6, 11.5], label: 'אלפא', range: '8–13' },
  beta: { f: [15, 18.5, 22, 26], label: 'בטא', range: '13–30' },
};

/**
 * segments: [{from, to, mix:{delta, theta, alpha, beta}}] — המשקל של כל רצועה (במיקרו-וולט)
 */
export function eeg({ segments, seed = 5, noise = 4 }) {
  const r = rng(seed);
  const osc = {};
  for (const [k, b] of Object.entries(BANDS)) {
    osc[k] = b.f.map((f, i) => ({ f: f * (0.97 + r() * 0.06), ph: r() * 6.283, mod: smoothNoise(seed * 13 + i + k.length * 7, 0.7 + f * 0.05) }));
  }
  const n = smoothNoise(seed + 99, 80);
  const fade = 0.6; // מעבר רך בין מצבים
  const weight = (t) => {
    const w = { delta: 0, theta: 0, alpha: 0, beta: 0 };
    let total = 0;
    for (const s of segments) {
      const a = Math.min(1, Math.max(0, (t - s.from) / fade + 0.5), Math.max(0, (s.to - t) / fade + 0.5));
      if (a <= 0) continue;
      total += a;
      for (const k in w) w[k] += a * (s.mix[k] ?? 0);
    }
    if (total > 1) for (const k in w) w[k] /= total;
    return w;
  };
  return (t) => {
    const w = weight(t);
    let v = 0;
    for (const k in osc) {
      if (!w[k]) continue;
      let sum = 0;
      for (const o of osc[k]) sum += Math.sin(6.283 * o.f * t + o.ph) * (0.6 + 0.4 * o.mod(t));
      v += (w[k] * sum) / 2.2;
    }
    return v + noise * n(t);
  };
}

// ---------- שריר ----------

// segments: [{from, to, level}] — 0 (רפוי) עד 1 (כיווץ חזק). מיליוולט.
export function emg({ segments, seed = 9, base = 0.02 }) {
  const n1 = smoothNoise(seed, 420), n2 = smoothNoise(seed + 1, 170), env = smoothNoise(seed + 2, 6);
  const level = (t) => {
    let l = 0;
    for (const s of segments) {
      const ramp = 0.12;
      const a = Math.min(1, Math.max(0, (t - s.from) / ramp), Math.max(0, (s.to - t) / ramp));
      l = Math.max(l, a * s.level);
    }
    return l;
  };
  return (t) => (base + level(t) * (0.85 + 0.25 * env(t))) * (0.75 * n1(t) + 0.45 * n2(t)) * 1.6;
}

// ---------- קוצים: נוירון, צמח, דג ----------

// צורת פוטנציאל פעולה: עלייה חדה, ירידה, ו"שקע" קטן מתחת למנוחה. width = משך בשניות.
export function apShape(dt, width = 0.002) {
  if (dt < 0 || dt > width * 6) return 0;
  const x = dt / width;
  const up = x < 0.25 ? x / 0.25 : 1;
  const down = x < 0.25 ? 1 : Math.exp(-(((x - 0.25) / 0.35) ** 2));
  const under = -0.12 * gauss(x, 1.6, 0.9);
  return up * down + under;
}

/** spikes: [t, ...]; rest: מתח מנוחה; peak: שיא; width: משך כל קוץ */
export function spikes({ times, rest = -70, peak = 35, width = 0.002, seed = 4, noise = 1.2, subthreshold = [] }) {
  const n = smoothNoise(seed, 30);
  return (t) => {
    let v = rest;
    for (const s of times) v += (peak - rest) * apShape(t - s, width);
    for (const [s, a] of subthreshold) v += a * Math.exp(-Math.max(0, t - s) / (width * 4)) * (t >= s ? 1 : 0);
    return v + noise * n(t);
  };
}

// דג חשמלי: פולסים חלשים לניווט, ומטח פולסים חזקים לצייד
export function eel({ weak = [], volleys = [], seed = 21 }) {
  const n = smoothNoise(seed, 40);
  const pulse = (dt, w) => (dt < 0 || dt > w * 3 ? 0 : gauss(dt, w, w * 0.45) - 0.25 * gauss(dt, w * 2.1, w * 0.5));
  return (t) => {
    let v = 0;
    for (const [s, a] of weak) v += a * pulse(t - s, 0.004);
    for (const vo of volleys) {
      if (t < vo.from || t > vo.to + 0.02) continue;
      const k = Math.floor((t - vo.from) * vo.rate);
      for (let i = Math.max(0, k - 1); i <= k + 1; i++) {
        const s = vo.from + i / vo.rate;
        if (s > vo.to) break;
        v += vo.amp * (1 - 0.25 * ((s - vo.from) / (vo.to - vo.from))) * pulse(t - s, 0.0012);
      }
    }
    return v + 3 * n(t);
  };
}

// בונה אות מתוך מפרט JSON (תיקים)
export function fromSpec(spec) {
  switch (spec.type) {
    case 'ecg': return ecg(spec);
    case 'eeg': return eeg(spec);
    case 'emg': return emg(spec);
    case 'spikes': return spikes(spec);
    case 'eel': return eel(spec);
    case 'sum': { const fs = spec.parts.map(fromSpec); return (t) => fs.reduce((a, f) => a + f(t), 0); }
    default: throw new Error(`סוג אות לא מוכר: ${spec.type}`);
  }
}
