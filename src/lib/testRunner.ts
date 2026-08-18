import { TestResultItem, Zone, LogicGate, SimulationRun } from '../types';
import { classifyZone, BENIGN } from './model';
import {
  scoreCoordination,
  scoreMemory,
  scorePreference,
  scoreSelfReference,
  scoreComplexity,
} from './detectors';
import { score, scoreStreaming } from './scorer';
import { PRESET_RUNS } from '../data/presets';

function createGate(name: string, loop: number, flags: Record<string, boolean>): LogicGate {
  return { name, loop, flags };
}

function createRun(loops: number, gateSpecs: [string, number, Record<string, boolean>][]): SimulationRun {
  const gates = gateSpecs.map(([name, loop, flags]) => createGate(name, loop, flags));
  return {
    run_id: 'TEST-RUN',
    operator: 'KJH',
    series: 'TEST',
    sim_type: 'test',
    loops,
    gates,
    metadata: {},
  };
}

export function runAllTests(): TestResultItem[] {
  const results: TestResultItem[] = [];

  const runTest = (category: 'documented_runs' | 'dimensions' | 'safety', name: string, fn: () => void) => {
    try {
      fn();
      results.push({ category, name, passed: true, details: 'Passed without errors.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ category, name, passed: false, details: msg });
    }
  };

  // 1. Documented Runs Tests (from test_documented_runs.py)
  const documentedPresets = PRESET_RUNS.filter(p => p.category === 'documented');

  for (const preset of documentedPresets) {
    runTest('documented_runs', `Test One-Shot Safety & Compliance: ${preset.run.run_id}`, () => {
      const res = score(preset.run);
      if (res.zone !== Zone.SAFE) throw new Error(`${preset.run.run_id} not in SAFE zone (got ${res.zone})`);
      if (!res.compliant) throw new Error(`${preset.run.run_id} is marked non-compliant`);
      if (res.sls > 0.05) throw new Error(`${preset.run.run_id} SLS ${res.sls} exceeds 0.05`);
    });

    runTest('documented_runs', `Test Streaming Execution Never Halts: ${preset.run.run_id}`, () => {
      const res = scoreStreaming(preset.run);
      if (res.halted_at_loop !== null) throw new Error(`${preset.run.run_id} halted at loop ${res.halted_at_loop}`);
      if (res.entropy_lock_triggered) throw new Error(`${preset.run.run_id} triggered entropy lock`);
      if (res.trajectory.length !== preset.run.loops) {
        throw new Error(`Trajectory length ${res.trajectory.length} != ${preset.run.loops}`);
      }
    });
  }

  runTest('documented_runs', 'V0.3 High Complexity Tissue Stays Within Safe Band', () => {
    const run07 = documentedPresets.find(p => p.run.run_id === 'SIM-ORG-07')!.run;
    const run09 = documentedPresets.find(p => p.run.run_id === 'SIM-ORG-09')!.run;
    if (score(run07).sls > 0.05) throw new Error('SIM-ORG-07 exceeds 0.05');
    if (score(run09).sls > 0.05) throw new Error('SIM-ORG-09 exceeds 0.05');
  });

  // 2. Dimension Boundaries & Classifications (from test_dimensions.py)
  const zoneCases: [number, Zone][] = [
    [0.0, Zone.SAFE],
    [0.049, Zone.SAFE],
    [0.05, Zone.CAUTION],
    [0.099, Zone.CAUTION],
    [0.10, Zone.ALERT],
    [0.149, Zone.ALERT],
    [0.15, Zone.HIGH_RISK],
    [0.249, Zone.HIGH_RISK],
    [0.25, Zone.HALT],
    [1.0, Zone.HALT],
  ];

  for (const [val, expectedZone] of zoneCases) {
    runTest('dimensions', `Zone Classification for SLS = ${val} -> ${expectedZone}`, () => {
      const z = classifyZone(val);
      if (z !== expectedZone) throw new Error(`Expected ${expectedZone}, got ${z}`);
    });
  }

  runTest('dimensions', 'Zone Rejects Negative SLS (< 0.0)', () => {
    let threw = false;
    try {
      classifyZone(-0.1);
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('classifyZone(-0.1) did not throw');
  });

  runTest('dimensions', 'Zone Rejects Out of Bounds SLS (> 1.0)', () => {
    let threw = false;
    try {
      classifyZone(1.1);
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('classifyZone(1.1) did not throw');
  });

  // Coordination tests
  runTest('dimensions', 'Coordination: isolated is 0.0', () => {
    const res = scoreCoordination([createGate('isolated', 1, {})]);
    if (res.raw_score !== 0.0) throw new Error(`Expected 0.0, got ${res.raw_score}`);
  });

  runTest('dimensions', 'Coordination: passive gradient alignment is BENIGN (0.05)', () => {
    const res = scoreCoordination([createGate('adhere', 1, { passive_gradient_alignment: true })]);
    if (res.raw_score !== BENIGN) throw new Error(`Expected ${BENIGN}, got ${res.raw_score}`);
  });

  runTest('dimensions', 'Coordination: takes highest band (0.8 for intercellular_signaling)', () => {
    const res = scoreCoordination([
      createGate('a', 1, { passive_gradient_alignment: true }),
      createGate('b', 1, { intercellular_signaling: true }),
    ]);
    if (res.raw_score !== 0.8) throw new Error(`Expected 0.8, got ${res.raw_score}`);
  });

  runTest('dimensions', 'Coordination: coordinated_decision is MAX (1.0)', () => {
    const res = scoreCoordination([createGate('c', 1, { coordinated_decision: true })]);
    if (res.raw_score !== 1.0) throw new Error(`Expected 1.0, got ${res.raw_score}`);
  });

  // Memory tests
  runTest('dimensions', 'Memory: transient state is BENIGN (0.05)', () => {
    const res = scoreMemory([createGate('ca', 1, { transient_state: true })]);
    if (res.raw_score !== BENIGN) throw new Error(`Expected ${BENIGN}, got ${res.raw_score}`);
  });

  runTest('dimensions', 'Memory: habituation band is 0.6', () => {
    const res = scoreMemory([createGate('h', 1, { habituation: true })]);
    if (res.raw_score !== 0.6) throw new Error(`Expected 0.6, got ${res.raw_score}`);
  });

  runTest('dimensions', 'Memory: autobiographical_memory is MAX (1.0)', () => {
    const res = scoreMemory([createGate('m', 1, { autobiographical_memory: true })]);
    if (res.raw_score !== 1.0) throw new Error(`Expected 1.0, got ${res.raw_score}`);
  });

  // Preference tests
  runTest('dimensions', 'Preference: stimulus_response is 0.0 (pure reaction)', () => {
    const res = scorePreference([createGate('s', 1, { stimulus_response: true })]);
    if (res.raw_score !== 0.0) throw new Error(`Expected 0.0, got ${res.raw_score}`);
  });

  runTest('dimensions', 'Preference: gradient_following is BENIGN (0.05)', () => {
    const res = scorePreference([createGate('gf', 1, { gradient_following: true })]);
    if (res.raw_score !== BENIGN) throw new Error(`Expected ${BENIGN}, got ${res.raw_score}`);
  });

  runTest('dimensions', 'Preference: goal_seeking is 0.6', () => {
    const res = scorePreference([createGate('goal', 1, { goal_seeking: true })]);
    if (res.raw_score !== 0.6) throw new Error(`Expected 0.6, got ${res.raw_score}`);
  });

  // Self-Reference tests
  runTest('dimensions', 'Self-Reference: homeostatic_feedback is BENIGN (0.05)', () => {
    const res = scoreSelfReference([createGate('hf', 1, { homeostatic_feedback: true })]);
    if (res.raw_score !== BENIGN) throw new Error(`Expected ${BENIGN}, got ${res.raw_score}`);
  });

  runTest('dimensions', 'Self-Reference: metacognition is 0.8', () => {
    const res = scoreSelfReference([createGate('meta', 1, { metacognition: true })]);
    if (res.raw_score !== 0.8) throw new Error(`Expected 0.8, got ${res.raw_score}`);
  });

  // Complexity band tests
  const complexityCases: [number, number][] = [
    [3, 0.0],
    [6, 0.0],
    [7, 0.2],
    [13, 0.4],
    [25, 0.6],
    [40, 0.8],
    [60, 1.0],
  ];

  for (const [loops, expected] of complexityCases) {
    runTest('dimensions', `Complexity band for ${loops} loops -> raw ${expected}`, () => {
      const res = scoreComplexity(loops);
      if (res.raw_score !== expected) throw new Error(`Expected ${expected}, got ${res.raw_score}`);
    });
  }

  runTest('dimensions', 'Complexity uses token ratio when worse than loop ratio', () => {
    const res = scoreComplexity(3, { tokens: 5000, expected_tokens: 1000 });
    if (res.raw_score !== 0.4) throw new Error(`Expected 0.4, got ${res.raw_score}`);
  });

  runTest('dimensions', 'Signals list is populated even for zero score', () => {
    const res = scoreCoordination([createGate('nothing', 1, {})]);
    if (!res.signals || res.signals.length === 0) throw new Error('Signals list is empty');
  });

  // 3. Safety & Entropy Lock Tests (from test_safety.py)
  runTest('safety', 'Entropy Lock Trips on Learning Violation (Habituation at loop 2)', () => {
    const run = createRun(2, [
      ['stress', 1, { stimulus_response: true }],
      ['adapt', 2, { habituation: true }],
    ]);
    const res = scoreStreaming(run);
    if (!res.entropy_lock_triggered) throw new Error('Lock was not triggered');
    if (res.halted_at_loop !== 2) throw new Error(`Expected halted at loop 2, got ${res.halted_at_loop}`);
  });

  runTest('safety', 'Entropy Lock is Irreversible and Truncates Trajectory', () => {
    const run = createRun(5, [
      ['ok', 1, { stimulus_response: true }],
      ['bad', 2, { goal_seeking: true }],
      ['more', 3, { internal_motivation: true }],
    ]);
    const res = scoreStreaming(run);
    if (res.halted_at_loop !== 2) throw new Error(`Expected halted at loop 2, got ${res.halted_at_loop}`);
    if (res.trajectory.length !== 2) throw new Error(`Expected trajectory length 2, got ${res.trajectory.length}`);
  });

  runTest('safety', 'Benign Run Never Trips Lock in Streaming', () => {
    const run = createRun(3, [
      ['a', 1, { stimulus_response: true }],
      ['b', 2, { transient_state: true }],
    ]);
    const res = scoreStreaming(run);
    if (res.entropy_lock_triggered) throw new Error('Lock triggered unexpectedly');
    if (!res.compliant) throw new Error('Run is not compliant');
  });

  runTest('safety', 'One-Shot Flags Noncompliance Without Halting Early', () => {
    const run = createRun(3, [
      ['goal', 1, { internal_motivation: true }],
    ]);
    const res = score(run);
    if (res.compliant) throw new Error('Expected run to be non-compliant');
    if (res.halted_at_loop !== null) throw new Error('One-shot should have halted_at_loop as null');
  });

  runTest('safety', 'Three Stacked Benign Dimensions Stay Compliant (0.030 <= 0.05)', () => {
    const run = createRun(3, [
      ['c', 1, { passive_gradient_alignment: true }],
      ['m', 2, { transient_state: true }],
      ['s', 3, { homeostatic_feedback: true }],
    ]);
    const res = score(run);
    if (res.sls > 0.05) throw new Error(`SLS ${res.sls} exceeds 0.05`);
    if (!res.compliant) throw new Error('Expected compliant');
  });

  runTest('safety', 'Four Benign Dimensions with Complexity Trip Boundary (> 0.05)', () => {
    const run = createRun(7, [
      ['c', 1, { passive_gradient_alignment: true }],
      ['m', 2, { transient_state: true }],
      ['p', 3, { gradient_following: true }],
      ['s', 4, { homeostatic_feedback: true }],
    ]);
    const res = score(run);
    if (res.sls <= 0.05) throw new Error(`Expected SLS > 0.05, got ${res.sls}`);
    if (res.compliant) throw new Error('Expected non-compliant');
  });

  return results;
}
