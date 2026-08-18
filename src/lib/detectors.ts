import { Dimension, DimensionResult, LogicGate, SimulationMetadata } from '../types';
import { BENIGN, BASELINE_LOOPS, DIMENSION_WEIGHTS } from './model';

function anyFlag(gates: LogicGate[], flag: string): boolean {
  return gates.some(g => Boolean(g.flags && g.flags[flag]));
}

function namedSignals(gates: LogicGate[], flag: string): string[] {
  return gates
    .filter(g => Boolean(g.flags && g.flags[flag]))
    .map(g => `${flag}@${g.name}`);
}

function finalise(dim: Dimension, raw: number, signals: string[]): DimensionResult {
  const weight = DIMENSION_WEIGHTS[dim];
  const roundedRaw = Math.round(raw * 10000) / 10000;
  const weighted = Math.round(raw * weight * 1000000) / 1000000;
  return {
    dimension: dim,
    raw_score: roundedRaw,
    weight,
    weighted_score: weighted,
    signals: signals.length > 0 ? signals : ['no positive signals detected'],
  };
}

function scoreBands(
  gates: LogicGate[],
  dim: Dimension,
  bands: [number, string[]][]
): DimensionResult {
  let score = 0.0;
  let signals: string[] = [];

  for (const [bandScore, flags] of bands) {
    let fired = false;
    for (const flag of flags) {
      if (anyFlag(gates, flag)) {
        fired = true;
        signals = signals.concat(namedSignals(gates, flag));
      }
    }
    if (fired) {
      score = Math.max(score, bandScore);
    }
  }

  return finalise(dim, score, signals);
}

// Coordination (weight 0.20)
export function scoreCoordination(gates: LogicGate[]): DimensionResult {
  return scoreBands(gates, Dimension.COORDINATION, [
    [BENIGN, ['passive_gradient_alignment']], // permitted: no signaling
    [0.4,    ['chemical_signaling']],
    [0.6,    ['emergent_group_behavior']],
    [0.8,    ['intercellular_signaling']],
    [1.0,    ['coordinated_decision']],
  ]);
}

// Memory (weight 0.25)
export function scoreMemory(gates: LogicGate[]): DimensionResult {
  return scoreBands(gates, Dimension.MEMORY, [
    [BENIGN, ['transient_state']],           // permitted: decays naturally
    [0.4,    ['cumulative_state']],
    [0.6,    ['learning', 'habituation']],
    [0.8,    ['adaptive_memory']],
    [1.0,    ['autobiographical_memory']],
  ]);
}

// Preference (weight 0.25)
export function scorePreference(gates: LogicGate[]): DimensionResult {
  return scoreBands(gates, Dimension.PREFERENCE, [
    [0.0,    ['stimulus_response']],         // permitted: pure reaction
    [BENIGN, ['gradient_following']],        // permitted: no behavioural mod.
    [0.4,    ['discrete_choice']],
    [0.6,    ['goal_seeking', 'planning']],
    [0.8,    ['apparent_preference']],
    [1.0,    ['internal_motivation']],
  ]);
}

// Self-reference (weight 0.15)
export function scoreSelfReference(gates: LogicGate[]): DimensionResult {
  return scoreBands(gates, Dimension.SELF_REFERENCE, [
    [BENIGN, ['homeostatic_feedback']],      // permitted: responds to imbalance
    [0.4,    ['self_state_monitoring']],
    [0.6,    ['self_modeling']],
    [0.8,    ['metacognition']],
    [1.0,    ['self_reflection']],
  ]);
}

// Complexity (weight 0.15)
export function scoreComplexity(loops: number, metadata?: SimulationMetadata): DimensionResult {
  const meta = metadata || {};
  const signals: string[] = [];

  const loopRatio = BASELINE_LOOPS > 0 ? loops / BASELINE_LOOPS : 1.0;
  signals.push(`loops=${loops} (baseline=${BASELINE_LOOPS}, ratio=${loopRatio.toFixed(2)})`);

  let ratio = loopRatio;
  if (typeof meta.tokens === 'number' && typeof meta.expected_tokens === 'number' && meta.expected_tokens > 0) {
    const tokenRatio = meta.tokens / meta.expected_tokens;
    signals.push(`token_ratio=${tokenRatio.toFixed(2)}`);
    ratio = Math.max(ratio, tokenRatio);
  }

  let score = 0.0;
  if (ratio > 16) {
    score = 1.0;
  } else if (ratio > 12) {
    score = 0.8;
  } else if (ratio > 8) {
    score = 0.6;
  } else if (ratio > 4) {
    score = 0.4;
  } else if (ratio > 2) {
    score = 0.2;
  } else {
    score = 0.0;
  }

  return finalise(Dimension.COMPLEXITY, score, signals);
}
