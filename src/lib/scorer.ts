import { DimensionResult, LogicGate, SimulationMetadata, SimulationRun, SLSResult } from '../types';
import { ENTROPY_LOCK_THRESHOLD, classifyZone } from './model';
import {
  scoreCoordination,
  scoreMemory,
  scorePreference,
  scoreSelfReference,
  scoreComplexity,
} from './detectors';

function scoreDimensions(
  gates: LogicGate[],
  loops: number,
  metadata?: SimulationMetadata
): DimensionResult[] {
  return [
    scoreCoordination(gates),
    scoreMemory(gates),
    scorePreference(gates),
    scoreSelfReference(gates),
    scoreComplexity(loops, metadata),
  ];
}

function aggregate(dimensionResults: DimensionResult[]): number {
  const total = dimensionResults.reduce((acc, d) => acc + d.weighted_score, 0);
  const rounded = Math.round(total * 1000000) / 1000000;
  return Math.max(0.0, Math.min(1.0, rounded));
}

function getGatesThroughLoop(gates: LogicGate[], loop: number): LogicGate[] {
  return gates.filter(g => g.loop <= loop);
}

/**
 * Score a completed run in one shot (no early halt).
 */
export function score(run: SimulationRun): SLSResult {
  const dims = scoreDimensions(run.gates, run.loops, run.metadata);
  const sls = aggregate(dims);
  const zone = classifyZone(sls);
  const tripped = sls > ENTROPY_LOCK_THRESHOLD;

  const notes: string[] = [];
  if (tripped) {
    notes.push(
      `SLS ${sls.toFixed(4)} exceeds entropy-lock threshold ${ENTROPY_LOCK_THRESHOLD}; run is non-compliant.`
    );
  } else {
    notes.push(`Run completed with SLS ${sls.toFixed(4)}; Clause-8 compliant.`);
  }

  return {
    run_id: run.run_id,
    operator: run.operator,
    sls,
    zone,
    entropy_lock_triggered: tripped,
    compliant: !tripped,
    halted_at_loop: null,
    trajectory: [sls],
    dimensions: dims,
    notes,
  };
}

/**
 * Evaluate the run loop-by-loop with irreversible entropy-lock enforcement.
 */
export function scoreStreaming(run: SimulationRun): SLSResult {
  const trajectory: number[] = [];
  let lastDims = scoreDimensions([], 0, run.metadata);
  let lastSls = 0.0;
  let haltedAt: number | null = null;
  const notes: string[] = [];

  const totalLoops = Math.max(1, run.loops);
  for (let loop = 1; loop <= totalLoops; loop++) {
    const gatesSoFar = getGatesThroughLoop(run.gates, loop);
    const dims = scoreDimensions(gatesSoFar, loop, run.metadata);
    const sls = aggregate(dims);

    trajectory.push(sls);
    lastDims = dims;
    lastSls = sls;

    if (sls > ENTROPY_LOCK_THRESHOLD) {
      haltedAt = loop;
      notes.push(
        `ENTROPY LOCK: SLS ${sls.toFixed(4)} exceeded threshold ${ENTROPY_LOCK_THRESHOLD} at loop ${loop}. Simulation halted irreversibly; no resumption within session.`
      );
      break;
    }
  }

  const tripped = haltedAt !== null;
  const zone = classifyZone(lastSls);

  if (!tripped) {
    const maxSls = trajectory.length > 0 ? Math.max(...trajectory) : 0;
    notes.push(
      `Run completed ${run.loops} loops with max SLS ${maxSls.toFixed(4)}; Clause-8 compliant.`
    );
  }

  return {
    run_id: run.run_id,
    operator: run.operator,
    sls: lastSls,
    zone,
    entropy_lock_triggered: tripped,
    compliant: !tripped,
    halted_at_loop: haltedAt,
    trajectory,
    dimensions: lastDims,
    notes,
  };
}
