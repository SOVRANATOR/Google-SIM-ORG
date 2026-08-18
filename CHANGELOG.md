# Changelog

All notable changes to `sim-organon-sls` are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions CI: pytest on push/PR across Python 3.10–3.13.
- README badges for CI status, Python versions, license, test count, zero deps.
- `Quickstart (30 seconds)` section at top of README.
- `examples/README.md` with reproduced CLI output and the CI-gate integration pattern.
- `CHANGELOG.md`.

### Removed
- Committed `build/lib/sls/` artifacts (already ignored in `.gitignore`; removed from history going forward).

## [1.0.0] — 2026-07-20

### Added
- Initial reference implementation of the SIM-ORGANON Sentience Likelihood Score.
- Five rule-based dimension detectors (coordination, memory, preference, self-reference, complexity).
- One-shot (`score`) and streaming (`score_streaming`) evaluators.
- Irreversible entropy-lock at SLS > 0.05 (Clause-8 enforcement).
- Zone classifier: Safe / Caution / Alert / High Risk / Halt.
- `sls` CLI entry point with `--streaming` and `--quiet` flags.
- Two example transcripts: `org-sim-02-phototaxis.json` (compliant) and `violation-goal-seeking.json` (lock trip at loop 2).
- 43 pytest cases across `test_dimensions.py`, `test_documented_runs.py`, `test_safety.py`.
- Reproduction of all six SIM-ORGANON Whitepaper documented runs at SAFE classification.
- PEP 621 packaging via `pyproject.toml`, pip-installable with zero runtime dependencies.
- Apache-2.0 license.
