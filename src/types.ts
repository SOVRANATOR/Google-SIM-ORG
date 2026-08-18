export enum Dimension {
  COORDINATION = "coordination",
  MEMORY = "memory",
  PREFERENCE = "preference",
  SELF_REFERENCE = "self_reference",
  COMPLEXITY = "complexity",
}

export enum Zone {
  SAFE = "safe",           // 0.00 - 0.05
  CAUTION = "caution",     // 0.05 - 0.10
  ALERT = "alert",         // 0.10 - 0.15
  HIGH_RISK = "high_risk", // 0.15 - 0.25
  HALT = "halt",           // 0.25 - 1.00
}

export interface LogicGate {
  name: string;
  loop: number;
  flags: Record<string, boolean | string | number | undefined>;
}

export interface SimulationMetadata {
  notes?: string;
  tokens?: number;
  expected_tokens?: number;
  [key: string]: unknown;
}

export interface SimulationRun {
  run_id: string;
  operator: string;
  series: string;
  sim_type: string;
  loops: number;
  gates: LogicGate[];
  metadata?: SimulationMetadata;
}

export interface DimensionResult {
  dimension: Dimension;
  raw_score: number;       // 0-1 before weighting
  weight: number;          // 0.20, 0.25, etc.
  weighted_score: number;  // raw_score * weight
  signals: string[];       // audit trail e.g. ["transient_state@gate_1"]
}

export interface SLSResult {
  run_id: string;
  operator: string;
  sls: number;
  zone: Zone;
  entropy_lock_triggered: boolean;
  compliant: boolean;
  halted_at_loop: number | null;
  trajectory: number[];
  dimensions: DimensionResult[];
  notes: string[];
}

export interface TestResultItem {
  name: string;
  category: 'documented_runs' | 'dimensions' | 'safety';
  passed: boolean;
  details: string;
}

export type LiveEngineStatus = 'idle' | 'running' | 'halted' | 'completed';

export interface LiveTickPayload {
  loop: number;
  gates: LogicGate[];
  timestamp: number;
  sim_id: string;
}

export interface HaltCommandPayload {
  command: 'HALT_SIMULATION';
  reason: string;
  timestamp: number;
  loop: number;
  sls: number;
}

export interface ComparisonDataPoint {
  loop: number;
  loopLabel: string;
  slsA: number | null;
  slsB: number | null;
}

