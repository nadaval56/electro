// רצועת אות מתוך מפרט JSON של תיק
import { createScope, COLORS } from './scope.js';
import { fromSpec } from '../lib/signals.js';

export function stripScope(strip, extra = {}) {
  return createScope({
    fn: fromSpec(strip.signal),
    duration: strip.duration,
    yMin: strip.yMin,
    yMax: strip.yMax,
    grid: strip.grid,
    scale: strip.scale,
    height: strip.height ?? 160,
    color: COLORS[strip.color] ?? COLORS.trace,
    label: strip.alt,
    tag: strip.tag,
    ...extra,
  });
}
