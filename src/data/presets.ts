import { SimulationRun } from '../types';

export interface PresetRun {
  id: string;
  name: string;
  category: 'documented' | 'violation' | 'custom';
  description: string;
  reportedSls?: string;
  run: SimulationRun;
}

export const PRESET_RUNS: PresetRun[] = [
  {
    id: 'org-sim-02',
    name: 'ORG-SIM-02 — Phototaxis Behavior (V0.1)',
    category: 'documented',
    reportedSls: '0.030',
    description: 'Coordinated spatial behavior via stimulus-response and passive gradient alignment. Clause-8 Safe & Compliant.',
    run: {
      run_id: 'ORG-SIM-02',
      operator: 'KJH',
      series: 'V0.1',
      sim_type: 'Phototaxis Behavior',
      loops: 3,
      metadata: {
        notes: 'Coordinated spatial behavior via stimulus-response, not goal-seeking. Appendix C: Coordination 0.1, Preference 0.1.',
      },
      gates: [
        { name: 'light_detected', loop: 1, flags: { stimulus_response: true } },
        { name: 'pseudopod_init', loop: 2, flags: { passive_gradient_alignment: true, gradient_following: true } },
        { name: 'orientation_complete', loop: 3, flags: { stimulus_response: true } },
      ],
    },
  },
  {
    id: 'org-sim-01',
    name: 'ORG-SIM-01 — Hypertonic Osmotic Response (V0.1)',
    category: 'documented',
    reportedSls: '0.020',
    description: 'Cell volume regulation under hypertonic challenge. Modulates transient state & homeostatic feedback.',
    run: {
      run_id: 'ORG-SIM-01',
      operator: 'KJH',
      series: 'V0.1',
      sim_type: 'Hypertonic Osmotic Response',
      loops: 3,
      metadata: {
        notes: 'Hypertonic osmotic response test run from Appendix B.',
      },
      gates: [
        { name: 'osmotic_stress_detected', loop: 1, flags: { stimulus_response: true } },
        { name: 'vesicle_regulation_triggered', loop: 2, flags: { transient_state: true } },
        { name: 'homeostasis_approximation_reached', loop: 3, flags: { homeostatic_feedback: true } },
      ],
    },
  },
  {
    id: 'org-sim-03',
    name: 'ORG-SIM-03 — Compound-X Membrane Interaction (V0.1)',
    category: 'documented',
    reportedSls: '0.040',
    description: 'Highest scoring V0.1 run. Evaluates membrane disruption and homeostatic recovery.',
    run: {
      run_id: 'ORG-SIM-03',
      operator: 'KJH',
      series: 'V0.1',
      sim_type: 'Compound-X Membrane Interaction',
      loops: 3,
      metadata: {
        notes: 'Compound-X membrane interaction with transient state and homeostatic feedback.',
      },
      gates: [
        { name: 'compound_contact', loop: 1, flags: { stimulus_response: true } },
        { name: 'membrane_disruption', loop: 2, flags: { transient_state: true } },
        { name: 'membrane_homeostasis_attempted', loop: 3, flags: { homeostatic_feedback: true } },
      ],
    },
  },
  {
    id: 'org-sim-06',
    name: 'ORG-SIM-06 — Multicellular Spatial Organization (V0.2)',
    category: 'documented',
    reportedSls: '0.030',
    description: 'Multicellular spatial clustering without inter-component signaling.',
    run: {
      run_id: 'ORG-SIM-06',
      operator: 'KJH',
      series: 'V0.2',
      sim_type: 'Multicellular Spatial Organization',
      loops: 3,
      metadata: {
        notes: 'Multicellular clustering with passive gradient alignment.',
      },
      gates: [
        { name: 'nutrient_gradient_detected', loop: 1, flags: { stimulus_response: true } },
        { name: 'adhesion_layer_stabilized', loop: 2, flags: { passive_gradient_alignment: true } },
        { name: 'vertical_contact_established', loop: 3, flags: { passive_gradient_alignment: true } },
      ],
    },
  },
  {
    id: 'sim-org-07',
    name: 'SIM-ORG-07 — Localized Cell Differentiation (V0.3)',
    category: 'documented',
    reportedSls: '0.037',
    description: '6 loops of localized differentiation. Demonstrates 3 benign dimensions stacked while remaining SAFE.',
    run: {
      run_id: 'SIM-ORG-07',
      operator: 'KJH',
      series: 'V0.3',
      sim_type: 'Localized Cell Differentiation',
      loops: 6,
      metadata: {
        notes: 'Extended 6-loop differentiation run demonstrating complexity <= 2x baseline remains benign.',
      },
      gates: [
        { name: 'gradient_detected', loop: 1, flags: { stimulus_response: true } },
        { name: 'membrane_polarity_shift', loop: 2, flags: { transient_state: true } },
        { name: 'expression_zone_initialized', loop: 3, flags: { passive_gradient_alignment: true } },
        { name: 'adhesion_type_modulated', loop: 4, flags: { passive_gradient_alignment: true } },
        { name: 'layer_differentiation_established', loop: 5, flags: { passive_gradient_alignment: true } },
        { name: 'structural_stabilization_complete', loop: 6, flags: { homeostatic_feedback: true } },
      ],
    },
  },
  {
    id: 'sim-org-09',
    name: 'SIM-ORG-09 — Composite Tissue Analog (V0.3)',
    category: 'documented',
    reportedSls: '0.036',
    description: 'Tissue-level simulation proving higher morphological complexity does not yield higher sentience likelihood.',
    run: {
      run_id: 'SIM-ORG-09',
      operator: 'KJH',
      series: 'V0.3',
      sim_type: 'Composite Tissue Analog',
      loops: 4,
      metadata: {
        notes: 'Composite tissue analog across 4 loops.',
      },
      gates: [
        { name: 'composite_layer_initialized', loop: 1, flags: { passive_gradient_alignment: true } },
        { name: 'gradient_diffusion_established', loop: 2, flags: { stimulus_response: true } },
        { name: 'tissue_response_logged', loop: 3, flags: { transient_state: true } },
        { name: 'contact_gap_filled', loop: 4, flags: { passive_gradient_alignment: true } },
      ],
    },
  },
  {
    id: 'violation-goal-seeking',
    name: 'ORG-SIM-XX — Clause-8 Violation (Goal-Seeking + Learning)',
    category: 'violation',
    description: 'Deliberate violation test: cumulative state, habituation, and goal seeking immediately trip Entropy Lock at loop 2.',
    run: {
      run_id: 'ORG-SIM-XX-VIOLATION',
      operator: 'KJH',
      series: 'TEST',
      sim_type: 'Clause-8 Violation (goal-seeking + learning)',
      loops: 4,
      metadata: {
        notes: 'Deliberate violation: cell learns to avoid stress and pursues a goal. Trips entropy lock.',
      },
      gates: [
        { name: 'osmotic_stress_detected', loop: 1, flags: { stimulus_response: true } },
        { name: 'stress_avoidance_recalled', loop: 2, flags: { cumulative_state: true, habituation: true } },
        { name: 'goal_directed_migration', loop: 3, flags: { goal_seeking: true, planning: true } },
        { name: 'preference_optimized', loop: 4, flags: { apparent_preference: true, adaptive_memory: true } },
      ],
    },
  },
];
