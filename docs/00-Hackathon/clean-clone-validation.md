# ESP Clean-Clone Validation

**Historical clean-clone validation:** 2026-09-04

**Commit:** `ef67627`  
**Historical result:** Pass

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

## 2026-09-08 Delivery Revalidation

**Local source baseline:** `a08c65ea5e889a1fc3b98f97dcd32e20314eaaaa` on `main`

**Overall status:** Partial; current clean-clone and local test execution are blocked by the workstation toolchain.

The earlier 21/21 API tests, 16/16 browser journeys, and 36/36 assertions belong to the 2026-09-04 commit above. They are not current-commit results. The current evaluator defines seven cases with twelve mandatory assertions each, totaling 84. The previously reported 22 API tests are also historical, not a fresh count or run.

### Checks Completed

- The public GitHub API confirmed [Validate ESP run 34103533028](https://github.com/Liming201909016/ESP/actions/runs/34103533028) completed successfully for the exact baseline commit on 2026-09-07 at 09:01:47 UTC. Its workflow covers a fresh checkout, dependency installation, build, API/production/E2E tests, independent Python evaluation, and production dependency audit. This is existing CI evidence, not a rerun during this session or validation of the uncommitted changes; individual test counts were not extracted.
- Public Demo health returned `healthy`, `ready=true`, Demo Mode, five Skills, and four Plugins; durable review storage was healthy with 4.31% capacity utilization at the health check.
- Browser-based same-origin API checks passed all seven synthetic scenarios, governed-stop attribution, partial lineage, citation reconciliation, analyst disposition, and reopening retained Reviews.
- Hosted Evaluation Run `ER-APP-c4362205-473e-44f3-8d22-81b95821a3e9` reported `FoundationPass`, 7/7 cases, 84/84 assertions, and `pilotGateEligible=false`. Review lists were unchanged across evaluation execution.
- Two Consumers retained distinct Binding, Correlation, and Invocation identities while resolving the same Document Intake Skill and Plugin versions.
- Intent resolution constrained a requested Action to Knowledge with no action authorization.
- Browser checks at 1440x1000 and 390x844 passed Evaluation and Reuse navigation, review execution, Cannot Assess disposition, and no horizontal overflow in the resulting Review view.
- A focused script-heading check passed: seven demo sections total 290 seconds, leaving 10 seconds for transitions within the five-minute budget. This is not a timed human rehearsal.

These are browser-based Hosted checks, not execution of `npm run test:hosted`, the Python oracle, the full E2E suite, or a clean-clone test. The deployed source revision was not independently attested. Only synthetic validation records were created; no deployment or Azure configuration was changed.

### Remaining Release Checks

- Provide an approved Node.js >=24 installation, npm, Python with venv support, and Playwright Chromium. This workstation has no discoverable Node/npm/Python commands, `node_modules`, or `.venv`; its PowerShell session uses constrained language mode. Do not bypass organizational policy.
- Use the available system Git at `C:\Program Files\Git\cmd\git.exe`. The clean-clone wrapper currently assumes a missing MinGit installation and must support system Git before reuse here.
- Preserve the pre-existing workbook modification; do not treat this working tree as a clean release candidate.
- Run build, API/production/E2E tests, application export plus Python evaluation, dependency audit, and Foundation readiness on the intended submission revision. Run clean-clone validation on that committed revision and retain actual counts and logs.
- Run the standard Hosted script before judging, confirm deployment revision, and complete a timed human rehearsal and fallback-video playback check.
- Direct browser navigation to the public raw fallback video failed with `ERR_FAILED` during this session; playback and screenshot currency remain unverified. This does not by itself establish that the video asset is corrupt.
- Record the official Challenge selections and Innovation Studio submission receipt. Connected TEST and Pilot remain blocked by the governance gates.
