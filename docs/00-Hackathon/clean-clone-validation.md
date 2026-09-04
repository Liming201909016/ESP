# ESP Clean-Clone Validation

**Validated:** 2026-09-04  
**Commit:** `ef67627`  
**Result:** Pass

## Environment

- Windows ARM64
- Node.js 24.19.0
- npm 11.17.0
- Python 3.12.10
- Playwright Chromium

## Procedure

`scripts/Test-CleanClone.ps1` cloned the committed repository into a new temporary directory and performed:

1. `npm ci` from `package-lock.json`;
2. Playwright Chromium setup;
3. creation of a new Python virtual environment;
4. installation from `requirements-dev.txt`;
5. TypeScript/API and Vite production builds;
6. 21 API integration tests;
7. 16 desktop/mobile Playwright journeys;
8. application candidate-result export;
9. independent Python evaluation.

## Results

- Node package paths resolved: 227
- API tests: 21/21
- browser journeys: 16/16
- synthetic scenarios: 4/4
- mandatory evaluation assertions: 36/36
- Foundation status: `FoundationPass`
- Pilot eligibility: `false`

The first clean-clone attempt exposed a line-ending-dependent dataset hash. The manifest and evaluator now hash canonical JSON, making verification stable across Git line-ending normalization.

The final wrapper exceeded the automation wait window after producing candidate results. The independent Python oracle was completed directly in the same clean workspace and passed 36/36; the Playwright result file reported `passed` with no failed tests.

This validation establishes reproducibility of the local synthetic Demo Mode. It does not establish customer validation, Connected Mode readiness, Pilot approval, or Production authorization.
