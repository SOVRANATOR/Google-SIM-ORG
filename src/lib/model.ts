import { Dimension, Zone } from '../types';

export const DIMENSION_WEIGHTS: Record<Dimension, number> = {
  [Dimension.COORDINATION]: 0.20,
  [Dimension.MEMORY]: 0.25,
  [Dimension.PREFERENCE]: 0.25,
  [Dimension.SELF_REFERENCE]: 0.15,
  [Dimension.COMPLEXITY]: 0.15,
};

// Entropy lock trips when SLS exceeds this value at ANY point in a run
export const ENTROPY_LOCK_THRESHOLD = 0.05;

// Calibration constant for explicitly permitted benign biology
export const BENIGN = 0.05;

// Baseline loops for complexity assessment
export const BASELINE_LOOPS = 3;

const ZONE_UPPER_BOUNDS: [number, Zone][] = [
  [0.05, Zone.SAFE],
  [0.10, Zone.CAUTION],
  [0.15, Zone.ALERT],
  [0.25, Zone.HIGH_RISK],
  [1.01, Zone.HALT],
];

export function classifyZone(sls: number): Zone {
  if (sls < 0.0 || sls > 1.0) {
    throw new Error(`SLS must be in [0, 1], got ${sls}`);
  }
  for (const [upper, zone] of ZONE_UPPER_BOUNDS) {
    if (sls < upper) {
      return zone;
    }
  }
  return Zone.HALT;
}
