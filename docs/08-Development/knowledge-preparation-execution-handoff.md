# Knowledge Preparation Execution Handoff

**Prepared:** 2026-09-08

**Audience:** The next VS Code coding session and its operator.

**Goal:** Make one Knowledge Preparation Skill work through two real Consumers, validate it independently, measure its usefulness, then add minimal controlled publication. Do not build the full data model or a general platform first.

## Start Here

Continue from the current local working tree, not just the remote repository. Read this handoff, the [contract draft](knowledge-preparation-contract-draft.md), and the [main backlog](hackathon-mvp-backlog.md). First establish an approved execution environment and run the existing experiment tests. Repair failures before expanding implementation. Do not restart the project or deploy the untested experiment over the current Hosted Demo.

## Current State And Permissions

| Area | Actual state |
|---|---|
| Source baseline | Last recorded local HEAD: `a08c65ea5e889a1fc3b98f97dcd32e20314eaaaa`, branch `main`; recheck on arrival |
| Working tree | Many modified and untracked files; KPR artifacts are not committed or pushed |
| Draft validation | Passed: 7 requests, 3 authored responses, 3 authored Consumer outputs, 7 schema-negative examples, and 6 schema-valid Consumer mutations rejected |
| Runtime | Experimental implementation and 13 development tests authored; tests have NEVER been executed in this work |
| CI | Local workflow changes include draft/runtime tests; these changes have NOT run remotely |
| Consumers | Only authored examples and existing narrow Document Intake reuse proof; no two real knowledge-package Consumers implemented yet |
| Independent acceptance | Not implemented or passed; visible development fixtures are not held-out evidence |
| Local authorization | User permits unregistered, synthetic, local experimentation before formal review; no canonical contract/registry changes or approval promotion |
| Git operations | User explicitly chose no commit, push, or PR. Preserve this unless separately reauthorized |
| Azure authorization | Deployment feasibility was discussed only. No new resource, paid tier change, upload, restart, or overwrite of the existing Demo has been authorized |

The current Windows account has no administrator rights. The official Node v24.20.0 executable matched its SHA-256 but was blocked by Windows group policy. Do not move/rename the binary, change policy, or use another execution route to evade that restriction. A different VS Code window on the same machine is not an approved runtime environment by itself. Use an administrator-approved Node environment or an explicitly authorized remote runner. Never request secrets through chat; authenticate interactively through approved tooling.

## Files To Carry Forward

| File | Purpose |
|---|---|
| [runtime.mjs](../../scripts/knowledge-preparation/runtime.mjs) | Unregistered preparation function; reuses existing Plugins, computes facts/hashes, gates reads, reports gaps/conflicts/stops |
| [runtime.test.mjs](../../scripts/knowledge-preparation/runtime.test.mjs) | 13 unexecuted development tests |
| [Test-KnowledgePreparationDraft.ps1](../../scripts/Test-KnowledgePreparationDraft.ps1) | Executable draft and Consumer-example consistency checks |
| [contract.schema.json](../../test-data/knowledge-preparation/v0.1.0/contract.schema.json) | Proposed experiment envelope, not canonical Skill registration |
| [runtime-inputs.json](../../test-data/knowledge-preparation/v0.1.0/runtime-inputs.json) | Seven synthetic runtime inputs with trusted test-harness configuration |
| [acceptance-labels.json](../../test-data/knowledge-preparation/v0.1.0/acceptance-labels.json) | Evaluator-only expected values; runtime must not read these |
| [contract-examples.json](../../test-data/knowledge-preparation/v0.1.0/contract-examples.json) | Authored examples, not runtime results |
| [package.json](../../package.json) | Adds `test:knowledge-preparation` |
| [validate.yml](../../.github/workflows/validate.yml) | Unexecuted local CI additions |
| [plugins.ts](../../apps/api/src/plugins.ts) | Existing Document Source/Evidence Plugin dependency required by the experiment |

Preserve the complete source snapshot, package lock, tests, fixtures, and relevant documentation, including untracked files. A clean clone or `git diff` alone will omit the new untracked files. Record the base commit and hashes of the transferred candidate files; do not label a dirty snapshot as the exact remote commit. Exclude credentials, authentication caches, `.azure`, `.venv`, `node_modules`, generated artifacts, and private local configuration from transfer/deployment packages.

The pre-existing modification to [dataverse-build-workbook.xlsx](../02-Data-Design/dataverse-build-workbook.xlsx) is not KPR work. Do not revert it, overwrite it, or include it in an experiment commit/deployment. Other local submission-document changes must also be preserved without being silently bundled into an unrelated release.

## Ordered Checklist

### 1. Establish The Execution Route

- [ ] Inspect `git status`, HEAD, local diffs, and untracked files; confirm all handoff artifacts arrived.
- [ ] Check approved Node >=24 and npm. Use PowerShell 7 for the draft validator; Python 3.12 with dependencies and Playwright Chromium are needed for the broader regression suite.
- [ ] If using Azure, first verify identity, target tenant/subscription, RBAC, and an approved isolated build/test location. Authentication alone does not prove deployment or resource-creation permission.
- [ ] Ask the user to approve the exact remote execution location, operations, cost/retention, and cleanup scope before upload or resource changes. GitHub push/PR still requires separate approval.

Exit: a recorded authorized environment that can execute Node tests without bypassing endpoint policy. If no approved route is available, report this blocker and stop execution attempts.

### 2. Execute And Repair KPR-002

From the repository root in the approved environment:

```powershell
./scripts/Test-KnowledgePreparationDraft.ps1
node --test scripts/knowledge-preparation/runtime.test.mjs
```

The Node command is also available as `npm run test:knowledge-preparation`. It imports the existing TypeScript Plugin file and relies on Node 24 TypeScript support. Do not claim that successful App Service startup proves these tests ran.

- [ ] Record the actual test count, output, Node version, source snapshot identity, and exit code; fix failures locally in this slice and rerun.
- [ ] Validate actual preparation responses against the draft JSON Schema, not only authored examples. Exercise all seven fixture scenarios.
- [ ] Confirm exact source value/version/locator/hash reconciliation, deny-before-read, fail-closed access, adapter failures, missing fields, conflicts, injection handling, and source-content mutation.
- [ ] Cover invalid or malformed adapter returns and unsupported source values; ensure unexpected adapter content cannot leak into errors or evidence.
- [ ] Preserve the current five registered Skills and existing security-review tests. No endpoint, business write, or new runtime registration is required for this experiment.

Exit: observed passing runtime/schema tests with raw evidence. This is development validation, not independent acceptance.

### 3. Implement Two Real Consumers

- [ ] Implement Security Review consumption of the returned knowledge package: a draft permissions-review item plus evidence-linked gaps/questions, with human review retained. Do not invent policy findings without an approved Runbook.
- [ ] Implement Architecture Review consumption: a cited system/region evidence brief and unresolved questions. A separate chat UI or complete architecture product is unnecessary.
- [ ] Both Consumers receive packages, not raw documents or expected labels; keep preparation/extraction in one shared implementation.
- [ ] Verify distinct Consumer/Binding/Invocation identities and identical implementation/Plugin pins. Demonstrate different downstream outputs, not merely two calls to the same endpoint.
- [ ] Test limitations, conflict alternatives, unavailable facts, citation references, and stop outcomes through both Consumers. A single preparation fix must pass both regressions.

Exit: two executable end-to-end Consumer paths; authored examples or different UI labels do not qualify.

### 4. Build Independent Acceptance

- [ ] Separate runtime input and output export from the evaluator. The runtime must not load expected facts, outcomes, behavior labels, or thresholds.
- [ ] Run the evaluator in a fresh process against raw packages, source material, events, errors, and both Consumer outputs. Recompute hashes/citations rather than trusting reported success metrics.
- [ ] Enforce and test runtime denial of access to label files. Different folders or a separate process alone are insufficient proof of isolation.
- [ ] Reject missing/duplicate/extra cases and absent Consumer outputs; ensure the evaluator cannot pass vacuously.
- [ ] Run source-only and label-only mutations; source changes alter observations, label changes alter verdicts without changing runtime behavior beyond declared volatile IDs.
- [ ] Reject dropped required facts, fabricated locators, suppressed governed stops, and changed dependency pins; retain expected reasons for rejection.
- [ ] Have a reviewer other than the implementer supply held-out cases and review usefulness. Record reviewer identity and decisions; do not invent approvals.
- [ ] Confirm no operational Reviews are created by acceptance runs, and retain source/dataset/evaluator hashes and per-case results.

The old [evaluation exporter](../../apps/api/src/evaluation.ts) copies expected behaviors into observations. Its historical 84/84 is not proof of KPR independence. Do not reuse that mechanism for the new acceptance path.

### 5. Decide Whether To Continue

- [ ] Ask the Business Owner and independent reviewer to agree sample size, task baseline, acceptance rubric, and minimum useful improvement before measurement.
- [ ] Compare the same tasks with and without shared preparation: integration effort, shared-change maintenance effort, analyst time, corrections, and acceptable-output rate. Include adapter and governance overhead.
- [ ] Retain measurements and a Continue/Revise/Stop decision. Synthetic execution success alone is not evidence of business value.

### 6. Prepare Azure Demo Delivery, Only After Approval

Known target, to be reverified:

| Setting | Value |
|---|---|
| Tenant | `fdpo.onmicrosoft.com` / `16b3c013-d300-468d-ac64-7eda0820b6d3` |
| Subscription | `1a55f4f7-6677-4773-8ba8-2cc1c46cb083` |
| Resource group | `ESP` |
| App Service | `app-esp-esp-demo-vw6mjjpc4xh64` |
| Public Demo | https://app-esp-esp-demo-vw6mjjpc4xh64.azurewebsites.net/ |
| Portal | https://ms.portal.azure.com/#@fdpo.onmicrosoft.com/resource/subscriptions/1a55f4f7-6677-4773-8ba8-2cc1c46cb083/resourceGroups/ESP/overview |
| Recorded plan | Linux B1, one instance, Southeast Asia; recheck before acting |
| Review storage | `/home/data/esp`; do not overwrite during code deployment |
| Lifecycle owner/review | Liming / 2026-09-18 |

- [ ] Recheck current resources, plan, deployment ID/source version, health, and RBAC. Old IDs and pre-provisioning statements in [Azure deployment notes](../00-Hackathon/azure-deployment.md) are historical, not current state.
- [ ] Do not assume B1 supports deployment slots; verify SKU capability. Ask before creating a separate validation app or changing a tier/cost. Do not use the live web process as an ad hoc test runner.
- [ ] Use an approved build/test location with the exact local candidate snapshot. Azure remote build/Oryx is not independent test evidence unless the required checks actually execute and their results are retained.
- [ ] On Linux runners, adapt the existing Windows-specific Python invocation to that environment; do not claim `npm run evaluate` is portable unchanged. Run all applicable build/API/production/E2E/Python evaluation/audit checks and the KPR checks.
- [ ] If a browser demonstration is desired, implement and test a clearly labeled experimental entry point first. Uploading the current script-only experiment will NOT add a Knowledge Preparation UI or two working Consumers.
- [ ] Before replacing the Demo, obtain explicit approval for the exact candidate, deployment method, target and impact window. Preserve a verified last-known-good deployable artifact, required non-secret configuration references, review-data backup/recovery plan, and a tested rollback method. A historical deployment ID alone is not a rollback package.
- [ ] After approval, deploy only the validated artifact. No customer data, secrets, identity-policy changes, basic-auth enablement, or infrastructure recreation. Do not blindly run `azd up` from a different workstation against stale local state.
- [ ] Keep one instance while the file-backed review store uses a process-local write queue. Preserve security headers and existing storage/recovery behavior.
- [ ] Run `npm run test:hosted` from an authorized runner for the existing Demo, plus new KPR journeys; the current Hosted script alone does not cover the new feature. Verify desktop/mobile views, retained evidence, Analyst decisions, and reopen behavior. These checks create synthetic records, which must be handled as documented.
- [ ] Roll back if health, existing workflows, or new acceptance checks fail; retain deployment and rollback evidence. Do not update success statuses until checks pass.

### 7. Add Minimal Controlled Skill Publication

- [ ] Only after technical/value acceptance and applicable approvals: define an immutable candidate manifest, named approval record, explicit version activation for both Consumers, compatibility checks, and rollback to the previous approved pin.
- [ ] No automatic `Latest` selection or full control-plane build. An Azure Demo deployment is NOT this Skill-publication gate.
- [ ] Leave Connected TEST, Pilot, and Production blocked until the existing [development gate](../04-Governance/development-readiness-gate.md) and additional release gates are actually approved.

## Required Handoff Result

The executing session must return: changed files and source identity; actual checks and per-case results; unresolved defects and authorization blockers; two-Consumer execution evidence; independent reviewer/value decision status; and, only if deployment was authorized, the deployed artifact hash, deployment ID, health/Hosted results and rollback evidence. Update the main backlog with Passed, Failed, Blocked, or Not Run accurately. Never convert authored tests, historical CI success, or this checklist into a claim that current runtime acceptance has passed.

## Execution Record - 2026-09-08

**Authoritative worktree:** `D:\Ai-Code\ESP`, branch `feature/hackathon-video-package`, HEAD `194c92a31dd60ad3e99523cf1307780ed391d4cd`. The KPR snapshot was recovered from local-only source commit `63f3a9c26910218cec0fa4e6c87d85d8dcf75e40`, which shares base `a08c65ea5e889a1fc3b98f97dcd32e20314eaaaa`, then relocated without committing. KPR-exclusive source bytes were verified by SHA-256 after relocation. The candidate is dirty and must not be described as the exact HEAD. The source worktree's pre-existing `docs/02-Data-Design/dataverse-build-workbook.xlsx` modification was not transferred; the D-drive workbook remains unchanged.

**Approved local route:** signed OpenJS Node 24.19.0 (`3958e4bb3f2d4ef37c938215dfc65a9d3c9d839b5060fec103bd2345fa78e951`), npm 11.17.0, Microsoft Store PowerShell 7.6.5, and Python 3.12.10. The user approved local Node execution and user-level PowerShell installation. No Git or Azure operation was authorized.

| Order | Observed result | Status |
|---|---|---|
| 1 | Complete KPR snapshot relocated to the authoritative D-drive worktree, exclusive-file hashes verified, and approved local Node/PowerShell route established | Passed |
| 2 | Draft validator exit 0; 15/15 focused runtime tests passed; all seven actual preparation responses passed the draft JSON Schema | Passed development validation |
| 3 | 22/22 runtime/Consumer tests passed; 14 actual preparation responses and 14 actual Consumer outputs passed Schema and semantic task checks | Passed development validation |
| 4 | Permission-isolated exporter and separate evaluator baseline passed 165/165; 14/14 acceptance-mechanics tests passed, including four required corruptions, case/output cardinality, source/label mutation, denied label read, invalid reviewer manifest rejection, and unchanged operational Review hash. The first D-drive acceptance run failed after its original 13 subtests because source identity assumed a loose Git ref; packed-ref support was added and the expanded suite then passed with exit 0 | Partial: visible fixtures only; reviewer-owned held-out data absent |
| 5 | Seven-case paired shared-preparation versus per-Consumer baseline protocol approved. Required threshold: zero authorization/citation failures, no acceptable-output-rate regression, and at least 30% lower combined integration plus shared-change maintenance effort. Wenxian is confirmed independent of implementation and may act as both Business Owner and reviewer; no held-out files or measurements were supplied | Blocked |
| 6 | No Azure upload, restart, resource change, or Hosted Demo overwrite was performed | Blocked pending explicit deployment approval and KPR-004/005 |
| 7 | No Skill registration, approval promotion, activation, publication, commit, push, or PR was performed | Not Run |

Existing application regression was also observed: build passed; 41/41 API tests passed; one-process production smoke passed; 26/26 Playwright tests passed; Python Demo evaluation passed 84/84 with `pilotEligible=false`; production audit found zero vulnerabilities. These results protect the existing five-Skill Demo but are not KPR held-out acceptance.

The first standalone D-drive E2E attempt failed before running tests because an overlapping earlier validation still held port 5173. After that process completed and released the port, the standalone suite was rerun and passed 26/26 with exit 0. The failed attempt is not counted as a test pass.

Development acceptance artifacts are retained under ignored `artifacts/knowledge-preparation/acceptance-latest`. The report is `DevelopmentAcceptancePass`, `heldOut=false`, and `independentReviewer=null`. The latest authoritative D-drive candidate hash is `106d1e5e477d9e3d40c0f511663c62d61bed2e4db75515211e58df0e6ececd8a`; report hash is `1282e7fda15f3e1d60359168037019a3ae2865ebbadb8c97026be6fdf04f9a23`.

The supplied SharePoint library and synchronized OneDrive roots were searched for reviewer-provided held-out files. Only the visible `v0.1.0` development fixtures and generated development acceptance artifacts were found. Wenxian is confirmed independent of implementation. Formal KPR-004/KPR-005 resume requires seven Wenxian-owned held-out runtime-input/label cases.

The [independent reviewer intake](knowledge-preparation-reviewer-intake.md) now defines the required seven-case coverage, file separation, reviewer manifest, paired value protocol, and thresholds. Empty manifest and measurement templates were placed in external `D:\ai-code\esp-temp`; they are not held-out evidence.

At the user's request, seven implementation-authored reviewer seed inputs and an intentionally incomplete label worksheet were also placed in that external directory. Permission-isolated runtime smoke executed all seven seeds through both Consumers with the required outcome coverage. They remain explicitly `ReviewerSeedNotHeldOut` / `heldOut=false`; no acceptance verdict was run against them.

## Full Local Simulation Record - 2026-09-08

The user requested simulation of all remaining operations. This authorized local synthetic rehearsal only, not real held-out review, measured value, approval, Git, Azure, publication, or Hosted Demo changes.

| Simulated gate | Observed result | Real status unchanged |
|---|---|---|
| KPR-004 acceptance | Permission-isolated export plus separate evaluator passed 165/165 as `SimulationAcceptancePass`; manifest and report state `simulation=true`, `heldOut=false`, reviewer `SIMULATED-Wenxian` | Partial; Wenxian-owned held-out files absent |
| KPR-005 value | 28 assumed rows covered seven cases, two Consumers, and two modes; `SimulationContinue`, 420 baseline versus 154 shared effort minutes, 63.3% reduction, 100% acceptable rate, zero simulated authorization/citation failures | Blocked; `measured=false` and no real decision |
| KPR-006/007 publication | Simulation candidate validation, two-Binding explicit-pin activation, and rollback to `Unregistered` passed; `Latest` corruption was rejected | Blocked/Not Run; no approval, activation, publication, Git, or Azure effect |
| Azure delivery | Target recorded only as a plan; operation, health check, Hosted smoke, and rollback all `NotRun`/`NotExecuted` | No Azure authorization or change |

The simulation-mechanics suite first failed before its assertions because Windows URL pathnames produced `D:\D:\...`; it was corrected to use `fileURLToPath`. The suite now passes 4/4, including one-command orchestrator boundary coverage. This failed attempt is retained and is not counted as a pass.

All simulation files are external under `D:\ai-code\esp-temp`. Reproduce the no-side-effect rehearsal with `npm run simulate:knowledge-preparation -- D:\ai-code\esp-temp`. The latest `simulation-summary.json` is SHA-256 `2982ff7925a5663fe86ce9fec024b16c7c1e0237b8f9f507b5cb15fee25677f2` and contains the exact hashes of every input and generated sub-report for that run. Stable source hashes include runtime seed `b0098f9a9ee4fc466e130e91917e887e241d5fbc91a7a1d79a4e7a5f0304b036` and simulated labels `027fe9fde64d5231256ac570597aea7867a328c9a85a5373b83c31013c81711e`.