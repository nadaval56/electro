// אק"ג "חי": פעימות שנוצרות תוך כדי ריצה, בקצב שאפשר לשנות בכל רגע (או פעימות ידניות — במשחק הקוצב).
import { ecgBeat, ventricularBeat, rng } from './signals.js';

/**
 * @param {{bpm?:number, auto?:boolean, jitter?:number, onBeat?:(beat)=>void, amp?:number}} o
 */
export function createLiveEcg(o = {}) {
  let bpm = o.bpm ?? 75;
  const auto = o.auto !== false;
  const r = rng(7);
  const beats = []; // {t, rr, kind}
  let next = 0.3;
  let noiseT = 0, noiseV = 0;

  function schedule(t) {
    while (auto && t >= next) {
      const rr = (60 / bpm) * (1 + (r() * 2 - 1) * (o.jitter ?? 0.015));
      const b = { t: next, rr, kind: 'sinus' };
      beats.push(b);
      next += rr;
      o.onBeat?.(b);
    }
    while (beats.length > 12) beats.shift();
  }

  function fn(t) {
    schedule(t);
    let v = 0;
    for (const b of beats) {
      const dt = t - b.t;
      if (dt < 0 || dt > 1.8) continue;
      v += b.kind === 'ventricular' ? ventricularBeat(dt, o.amp ?? 1) : ecgBeat(dt, Math.max(b.rr, 0.25), o.amp ?? 1);
    }
    // רעש קטן ואיטי, כדי שהקו לא ייראה מצויר בסרגל
    if (t - noiseT > 0.02) { noiseT = t; noiseV = noiseV * 0.7 + (r() * 2 - 1) * 0.012; }
    return v + noiseV;
  }

  return {
    fn,
    get bpm() { return bpm; },
    setBpm(b) {
      bpm = b;
      // אם הפעימה הבאה רחוקה מדי בגלל קצב קודם איטי — מקרבים אותה
      const last = beats[beats.length - 1];
      if (last && next - last.t > 60 / b) next = last.t + 60 / b;
    },
    addBeat(t, kind = 'sinus', rr = 0.8) {
      const b = { t, rr, kind };
      beats.push(b);
      o.onBeat?.(b);
      return b;
    },
    get beats() { return beats; },
  };
}
