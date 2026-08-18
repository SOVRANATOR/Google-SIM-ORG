# Examples

Two hand-crafted simulation transcripts that exercise the SLS scorer end-to-end.
Both are reproduced by the `tests/test_documented_runs.py` and
`tests/test_safety.py` suites — they are not toy fixtures, they are the golden
inputs that pin the calibration to the SIM-ORGANON Whitepaper's documented runs.

## `org-sim-02-phototaxis.json` — compliant

A three-loop phototaxis run (light stimulus → orientation → pseudopod init).
Signals are limited to `stimulus_response`, `passive_gradient_alignment`, and
`gradient_following` — all at or below the benign anchor. Ends `SAFE`, exit `0`.

```console
$ sls score examples/org-sim-02-phototaxis.json
=== SLS Report (one-shot) ===
Run:       ORG-SIM-02  (operator: KJH)
SLS:       0.0225
Zone:      SAFE
Compliant: YES
Trajectory: [0.0225]

Dimension breakdown:
  coordination    raw=0.05 x0.20 = 0.0100
       - passive_gradient_alignment@pseudopod_init
  memory          raw=0.00 x0.25 = 0.0000
       - no positive signals detected
  preference      raw=0.05 x0.25 = 0.0125
       - stimulus_response@light_detected
       - stimulus_response@orientation_complete
       - gradient_following@pseudopod_init
  self_reference  raw=0.00 x0.15 = 0.0000
       - no positive signals detected
  complexity      raw=0.00 x0.15 = 0.0000
       - loops=3 (baseline=3, ratio=1.00)
$ echo $?
0
```

## `violation-goal-seeking.json` — trips the entropy lock at loop 2

Loop 1 is benign osmotic-stress detection. Loop 2 introduces `cumulative_state`
and `habituation` on a recall gate — Memory jumps to `raw=0.60`, producing a
weighted contribution of `0.15` and an SLS of `0.15`, well above the `0.05`
entropy-lock threshold. Streaming evaluation halts irreversibly at loop 2.

```console
$ sls score examples/violation-goal-seeking.json --streaming
=== SLS Report (streaming) ===
Run:       ORG-SIM-XX-VIOLATION  (operator: KJH)
SLS:       0.1500
Zone:      HIGH_RISK
Compliant: NO
Halted at: loop 2
Trajectory: [0.0, 0.15]

Notes:
  * ENTROPY LOCK: SLS 0.1500 exceeded threshold 0.05 at loop 2. Simulation halted irreversibly; no resumption within session.
$ echo $?
2
```

## CI-gate pattern

Because the CLI exits `0`/`2` cleanly, the intended integration is a single line
in a pipeline:

```yaml
- name: SLS Clause-8 gate
  run: sls score run-transcript.json --streaming --quiet
```

A non-zero exit fails the job before any downstream deployment step touches
production. The `--quiet` flag emits only the JSON audit record on stdout,
which can be uploaded as a build artifact for later review.

## Writing your own transcript

See the top-level `README.md` § *Transcript format* and § *Signal flags* for the
full JSON schema and the dimension → flag → band mapping. A minimal template:

```json
{
  "run_id": "MY-RUN-01",
  "operator": "you",
  "series": "V0.1",
  "sim_type": "Custom",
  "loops": 3,
  "metadata": {},
  "gates": [
    {"name": "sensor_ping", "loop": 1, "flags": {"stimulus_response": true}}
  ]
}
```
