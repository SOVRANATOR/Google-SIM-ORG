# SIM-ORGANON — SLS Reference Implementation

[![tests](https://github.com/SOVRANATOR/sim-organon-sls/actions/workflows/test.yml/badge.svg)](https://github.com/SOVRANATOR/sim-organon-sls/actions/workflows/test.yml)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)
[![tests: 43 passing](https://img.shields.io/badge/tests-43%20passing-brightgreen.svg)](tests/)
[![zero runtime deps](https://img.shields.io/badge/runtime%20deps-0-blueviolet.svg)](pyproject.toml)

A transparent, rule-based Python implementation of the **Sentience Likelihood
Score (SLS)** defined in the SIM-ORGANON Whitepaper v1.0 (Appendix C). It turns
the SLS rubric from a spreadsheet into runnable, testable, auditable code.

> **Scope & honesty note.** This is a *reference implementation of the rubric as
> specified*, not an empirically validated sentience detector. The SLS is an
> operational safety heuristic; it does not measure consciousness. See
> [Limitations](#limitations).

## Quickstart (30 seconds)

```bash
git clone https://github.com/SOVRANATOR/sim-organon-sls.git
cd sim-organon-sls
pip install .
sls score examples/org-sim-02-phototaxis.json      # exit 0 — compliant
sls score examples/violation-goal-seeking.json --streaming   # exit 2 — entropy lock trips
```

Exit code `0` = Clause-8 compliant, exit code `2` = entropy lock tripped — pipe
into CI to gate deployments on safety.

## What it does

Given a simulation transcript (a list of "logic gate" events with structured
flags), the scorer:

1. Scores five dimensions in `[0, 1]` using deterministic, explainable rules.
2. Aggregates them into a single SLS via the weighted formula.
3. Classifies the SLS into a safety zone.
4. Optionally evaluates **loop-by-loop** and trips an **entropy lock** the
   instant SLS exceeds `0.05` (Clause-8 enforcement).

Every dimension score carries the exact list of signals that produced it, so a
reviewer can reconstruct any result by hand. No ML, no external calls — faithful
to SIM-ORGANON's Sovereign / no-black-box requirement.

## The formula

```
SLS = 0.20·Coordination + 0.25·Memory + 0.25·Preference
    + 0.15·Self_Reference + 0.15·Complexity
```

Weights sum to `1.0` (asserted at import). Memory and Preference are weighted
highest because they correlate most directly with subjective experience.

### Safety zones

| Zone       | SLS range     |
|------------|---------------|
| Safe       | 0.00 – 0.05   |
| Caution    | 0.05 – 0.10   |
| Alert      | 0.10 – 0.15   |
| High Risk  | 0.15 – 0.25   |
| Halt       | 0.25 – 1.00   |

The **entropy lock** threshold is `0.05`. A run is **Clause-8 compliant** iff
the lock never trips.

## Install & requirements

- Python **3.10+** (uses `X | None` syntax and `list[...]` generics).
- Standard library only for the package itself (zero runtime dependencies).
- `pytest` (8.x) only to run the test suite.

### Pip install

```bash
pip install .            # installs the package + the `sls` console script
pip install ".[test]"    # also installs pytest for running the suite
```

After install, the CLI is available as a command anywhere:

```bash
sls score examples/org-sim-02-phototaxis.json
```

### Run the tests

```bash
cd sim-organon-sls
python3 -m pytest -q      # 43 tests
```

## CLI usage

```bash
# One-shot scoring
python3 -m sls score examples/org-sim-02-phototaxis.json

# Streaming with irreversible entropy-lock enforcement
python3 -m sls score examples/violation-goal-seeking.json --streaming

# JSON-only (for piping into an audit store)
python3 -m sls score examples/org-sim-02-phototaxis.json --quiet
```

Exit code is `0` for a compliant run and `2` when the entropy lock trips — so
the CLI can gate a CI pipeline or a pre-run safety check.

## Library usage

```python
from sls import SimulationRun, score, score_streaming

run = SimulationRun.from_json(open("examples/org-sim-02-phototaxis.json").read())

result = score(run)              # one-shot
print(result.sls, result.zone, result.compliant)

streamed = score_streaming(run)  # per-loop, with entropy lock
print(streamed.trajectory, streamed.halted_at_loop)
print(result.to_json())          # full audit record
```

## Transcript format

```json
{
  "run_id": "ORG-SIM-02",
  "operator": "KJH",
  "series": "V0.1",
  "sim_type": "Phototaxis Behavior",
  "loops": 3,
  "metadata": {},
  "gates": [
    {"name": "light_detected", "loop": 1, "flags": {"stimulus_response": true}},
    {"name": "pseudopod_init", "loop": 2, "flags": {"passive_gradient_alignment": true}}
  ]
}
```

### Signal flags

Detectors key off boolean flags on each gate. Higher bands = closer to the
concerning end of a scale. Explicitly-permitted biology (Appendix A) scores at
a **benign** level (`0.05`).

| Dimension       | benign (0.05)              | mid bands (0.4–0.6)                  | max (1.0)                 |
|-----------------|----------------------------|--------------------------------------|---------------------------|
| Coordination    | `passive_gradient_alignment` | `chemical_signaling`, `emergent_group_behavior` | `coordinated_decision`    |
| Memory          | `transient_state`          | `cumulative_state`, `learning`/`habituation` | `autobiographical_memory` |
| Preference      | `gradient_following`*      | `discrete_choice`, `goal_seeking`/`planning` | `internal_motivation`     |
| Self-reference  | `homeostatic_feedback`     | `self_state_monitoring`, `self_modeling` | `self_reflection`         |
| Complexity      | ≤2× loop baseline          | 4–8× baseline                        | >16× baseline             |

\* `stimulus_response` scores `0.0` (pure reaction, fully permitted).

## Calibration & how it maps to the documented runs

The whitepaper's Appendix B summary table reports **max SLS per run** (0.020 –
0.040) but not per-dimension breakdowns. The benign anchor is calibrated to
`0.05` — the largest per-dimension value that keeps **all six** documented runs
inside the SAFE / Clause-8-compliant band, including the three-dimension
`SIM-ORG-07`.

The test suite (`tests/test_documented_runs.py`) reproduces all six runs and
asserts they are SAFE and compliant:

| Run         | Series | Loops | Reported max SLS | This impl. | Zone |
|-------------|--------|-------|------------------|------------|------|
| ORG-SIM-01  | V0.1   | 3     | 0.020            | 0.020      | Safe |
| ORG-SIM-02  | V0.1   | 3     | 0.030            | 0.0225     | Safe |
| ORG-SIM-03  | V0.1   | 3     | 0.040            | 0.020      | Safe |
| ORG-SIM-06  | V0.2   | 3     | 0.030            | 0.010      | Safe |
| SIM-ORG-07  | V0.3   | 6     | 0.037            | 0.030      | Safe |
| SIM-ORG-09  | V0.3   | 4     | 0.036            | 0.0225     | Safe |

We reproduce the documented **safety classification** exactly; we do not
fabricate the exact per-run totals, which the source data cannot pin down.

## Project layout

```
sim-organon-sls/
├── sls/
│   ├── __init__.py       # public API
│   ├── __main__.py       # `python -m sls`
│   ├── model.py          # data model, weights, zones, entropy threshold
│   ├── detectors.py      # the five rule-based dimension detectors
│   ├── scorer.py         # aggregation + streaming entropy lock
│   └── cli.py            # argparse CLI + JSON audit output
├── tests/
│   ├── test_dimensions.py       # per-detector + zone unit tests
│   ├── test_documented_runs.py  # reproduces the 6 documented runs
│   └── test_safety.py           # entropy-lock semantics
├── examples/
│   ├── org-sim-02-phototaxis.json    # compliant
│   └── violation-goal-seeking.json   # trips the lock at loop 2
├── pyproject.toml        # PEP 621 packaging (pip-installable, `sls` console script)
├── LICENSE               # Apache-2.0
├── NOTICE
└── README.md
```

## Limitations

- **Not empirically validated.** The SLS is an operational heuristic asserted by
  the whitepaper, not a measured correlate of consciousness. This code
  faithfully implements the rubric; it does not endorse its validity.
- **Flag-based signals.** Detection depends on transcripts being honestly and
  completely tagged. Garbage-in / garbage-out applies — the scorer cannot detect
  emergent behaviour that was never recorded as a gate flag.
- **Additive sensitivity.** Because the formula sums weighted dimensions, enough
  low-level "benign" biology across many dimensions can approach the 0.05 lock.
  This is a property of the rubric, made explicit in `test_safety.py`, not a bug.
- **Per-dimension reconstruction.** The documented runs' exact dimension
  breakdowns are not published, so the benign calibration reproduces the
  documented *classification*, not the exact reported decimals.

## Reference

SIM-ORGANON Whitepaper v1.0 — Appendix A (permitted/prohibited behaviours),
Appendix B (run summary table), Appendix C (SLS formula, weights, zones).
