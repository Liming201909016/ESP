# ESP Hackathon MVP Backlog

**Target:** Microsoft Global Hackathon 2026  
**Priority rule:** Prove Knowledge Preparation through two working Consumers and independent acceptance before controlled publication. Do not build the full data model or a general-purpose platform first. Existing Hackathon submission operations continue in parallel.

## Definition of Done

The Hackathon MVP is done when a reviewer can clone or open the repository, run one setup/start command, complete the RG and APP demo paths, inspect Skill/Plugin trace and evidence, perform analyst disposition, generate a draft report, and run automated evaluation without a tenant or secret.

## Next Product Decision: Knowledge Preparation

**Direction confirmed:** 2026-09-08

**Delivery status:** KPR-001 draft artifacts are validated but contract review remains pending. KPR-002 and KPR-003 passed local development validation in the authoritative D-drive worktree. KPR-004 acceptance mechanics passed against visible development fixtures; Wenxian is confirmed independent of implementation, but formal acceptance remains incomplete because reviewer-owned held-out fixtures are absent. Historical HCK completion below does not establish completion of this slice.

The [contract and acceptance draft](knowledge-preparation-contract-draft.md) links the proposed Schema, seven runtime input cases, separately stored labels, response/Consumer examples, and repeatable validation command. Passing these authored-example checks is not runtime acceptance.

For execution in another VS Code environment, use the [ordered execution handoff](knowledge-preparation-execution-handoff.md). It records the uncommitted source handoff, approved execution prerequisites, two-Consumer and independent acceptance tasks, and separately gated Azure Demo deployment and Skill publication.

The next investment decision is whether one bounded Skill can prepare useful, evidence-grounded knowledge for two different Consumers with less duplicated implementation and maintenance work. Passing execution checks proves that it works; measured Consumer usefulness and reuse cost determine whether it is worth expanding.

### Bounded Skill

Knowledge Preparation accepts explicitly authorized, versioned synthetic document references and a requested preparation scope. It produces a structured knowledge package containing sourced facts, source version/hash and precise locator, retained evidence references, conflicts, missing information, processing outcomes, and pinned invocation context. Facts must remain separate from suggestions. Missing, denied, unreadable, and conflicting material must remain explicit; document instructions cannot change policy.

Start with the existing Document Source and Evidence Plugins and the existing contract envelope. Document Intake is a reusable starting implementation, not an already completed Knowledge Preparation Skill. Its current payload exposes material completeness, source IDs, and gaps; it does not yet deliver the knowledge package above. Do not silently change `LS-SEC-DOC-INTAKE` v1.0.0 or add an unreviewed canonical Skill identity. Record the bounded contract and compatibility decision through the existing architecture change process before runtime registration changes.

No customer data, tenant connection, vector database, generic ingestion framework, marketplace, full 42-table Dataverse implementation, or seven-Solution deployment is required. Use local structured artifacts and the existing application/test toolchain. Restoring the approved toolchain is an execution prerequisite, not a platform feature.

### Two Working Consumers

- Security Review Copilot consumes the knowledge package to produce evidence-linked review findings and explicit information requests, retaining analyst responsibility.
- Architecture Review Workflow consumes the same Skill contract and pinned implementation to produce an architecture evidence brief and unresolved architecture questions. It does not need a second chat interface or a full architecture-review product.
- Both Consumers must execute their own downstream transformation using the returned package. Different labels, Bindings, or invocation IDs alone are insufficient. They share preparation logic without copied extraction, evidence mapping, or private forks; Consumer-specific interpretation stays outside the Skill.
- Record distinct Consumer/Binding/Invocation identities, identical shared implementation and Plugin pins, and package-to-output citations. A preparation fix is made once, then regression-tested through both Consumers. Historical HCK-207 remains a narrower invocation-reuse proof.

### Independent Acceptance

The current evaluation exporter in `apps/api/src/evaluation.ts` populates `observedBehaviors` from `selectedCase.expected.requiredBehaviors` when execution is classified as expected. A separate Python process does not make those observations independent. Existing 84/84 synthetic checks remain useful regression evidence, but cannot be the acceptance proof for this new slice.

Before implementing the Skill, define a versioned acceptance set and expected labels separately from runtime inputs. The runtime receives authorized documents and contract inputs only, never expected facts, behaviors, outcomes, or acceptance thresholds. Export actual package contents, source references, events, errors, and both Consumer outputs; the acceptance runner derives its checks from those artifacts rather than trusting self-reported success, coverage, or violation counters.

Required checks:

- Validate the package contract and resolve every material factual citation to the permitted source version and locator; check required facts, not just citation presence. Unsupported claims, fabricated citations, and access bypass each fail acceptance.
- Cover happy paths, missing material, unreadable sources, access denial, conflicting facts, prompt injection, and dependency failure. Both Consumers must preserve the applicable limitations and must not convert a stop into a successful conclusion.
- Change source content without changing labels and require the exported facts to change. Change only hidden expected labels and require runtime output to remain unchanged, excluding declared volatile identifiers/timestamps.
- Deliberately remove a required fact, fabricate a citation, suppress a governed stop, and change a pinned dependency; each corrupted candidate must be rejected. An always-pass or missing-case acceptance report is a failure.
- Exercise both Consumers end to end against the same held-out fixtures and pinned package contract. Acceptance must not create operational Reviews or grant publication approval.
- Retain the input/dataset hashes, source revision, contract/implementation/Plugin pins, evaluator version, per-case observations and failures, and both Consumer results. A reviewer other than the implementer signs the usefulness assessment; synthetic acceptance never establishes Pilot authorization.

### Delivery Order And Exit Gates

| Order | ID | Work item | Exit evidence | Status |
|---|---|---|---|---|
| 1 | KPR-001 | Freeze the bounded contract and acceptance fixtures | Reviewed input/output/error examples, source and evidence boundaries, compatibility decision, separate runtime inputs and acceptance labels, two Consumer task definitions | Partial: draft Schema, seven input/label cases, response/Consumer examples, and validator pass, including six schema-valid Consumer mutations rejected; architecture/domain/independent review and value thresholds pending |
| 2 | KPR-002 | Implement Knowledge Preparation locally | Actual content-derived package, reusable Document/Evidence adapters, explicit negative outcomes, contract and source-mutation tests passing | Passed development validation 2026-09-08: approved Node 24.19.0 ran 15/15 runtime tests; PowerShell 7.6.5 validated 7 authored requests and 14 actual preparation responses against the draft Schema; exit codes 0. This is not independent acceptance or contract approval. |
| 3 | KPR-003 | Connect Security Review and Architecture Review | Two distinct downstream outputs consume the same pinned Skill; output citations and shared-fix regression pass; no preparation copies | Passed development validation 2026-09-08: 22/22 runtime/Consumer tests and 14/14 actual Consumer outputs passed Schema and semantic checks. Both paths use identical implementation/Plugin pins with distinct Binding/Correlation/Invocation identities. |
| 4 | KPR-004 | Run independent technical acceptance | Held-out cases and corruption checks pass in a fresh process; raw artifacts retained; no expected-label leakage or operational Review writes | Partial development acceptance 2026-09-08: permission-isolated exporter and separate evaluator passed baseline 165/165; 14/14 acceptance-mechanics tests rejected required corruptions, cardinality/mutation failures, and invalid reviewer manifests. Seven implementation-authored reviewer seeds also produced a `SimulationAcceptancePass` at 165/165, explicitly `simulation=true`, `heldOut=false`. Wenxian-owned final inputs/labels and formal held-out verdict remain absent. |
| 5 | KPR-005 | Decide whether continued investment is justified | Independent reviewer accepts both task outputs; measured baseline, reuse cost, and Continue/Revise/Stop decision retained | Blocked after simulation: Wenxian is confirmed independent of implementation. A 28-row assumed-value simulation produced `SimulationContinue` with 63.3% lower integration-plus-maintenance effort, unchanged 100% acceptable-output rate, and zero simulated authorization/citation failures. Values are `measured=false`; no real Continue/Revise/Stop decision exists. |
| 6 | KPR-006 | Add controlled publication | Accepted immutable candidate, named approval, pinned activation, two-Consumer compatibility check, and tested rollback; no automatic Latest selection | Blocked after simulation: explicit-pin activation and rollback rehearsal passed for both Bindings and rejected `Latest`, but report is `SimulationPublicationRehearsalPass`; publication, Git, Azure deployment, health, and Hosted smoke were all Not Run. |

For KPR-005, record the same tasks with and without shared preparation: Consumer integration effort, one shared-change maintenance effort, analyst completion time, correction count, and acceptable-output rate. Retain the sample size and raw measurements; include adapter and governance overhead. The Business Owner and independent reviewer must agree the comparison method and minimum useful improvement before measurement. Do not claim productivity gains from two successful API calls or synthetic assertion counts. Missing comparative evidence means the value decision remains pending.

For KPR-006, start with a minimal versioned release manifest and approval evidence rather than a general control plane. Bind both Consumers to an explicitly approved candidate; prove that an incompatible version cannot replace it and that the previous approved pin can be restored. Local synthetic release rehearsal is not Connected TEST authorization. Existing environment, identity, data-authority, and DG-001 through DG-008 gates still apply before Connected TEST; Pilot and Production require their additional gates.

The user authorized an exception to the experiment sequence on 2026-09-08: KPR-002 may be explored locally with synthetic data before KPR-001 formal review, provided nothing is registered or published and no approval/acceptance status is promoted. This does not waive the exit gates for accepted delivery. On 2026-09-08 the user approved the existing signed OpenJS Node 24.19.0 executable and the Microsoft Store PowerShell 7.6.5 package for local KPR execution; this approval does not authorize Git or Azure operations.

## H0 Documentation and contracts

| ID | Work item | Acceptance | Status |
|---|---|---|---|
| HCK-001 | Project brief | Title, tagline, problem, solution, innovation, users, impact, and keywords are submission-ready | Done |
| HCK-002 | Delivery profile | Demo/Connected modes, scope, architecture, catalog, exclusions, and acceptance are explicit | Done |
| HCK-003 | Skill contracts | Five Skill request/response contracts and fixtures validate | Done |
| HCK-004 | Plugin standard | Four Plugin responsibilities and common contract rules are defined | Done |
| HCK-005 | Demo script | Five-minute story, fallback, and safeguards are documented | Done |

## H1 Runnable core

| ID | Work item | Acceptance | Status |
|---|---|---|---|
| HCK-101 | Local application scaffold | One command starts a browser-accessible React/Vite application and Express health API | Done |
| HCK-102 | Skill and Plugin registry | Five Skills and four Plugins load with pinned versions and health status in API and UI | Done |
| HCK-103 | Skill Router | Deterministic five-stage Router executes pinned dependencies, propagates correlation, and records ordered trace | Done |
| HCK-104 | Demo Plugins | Document, Runbook, Evidence, and Report Plugins run locally without network access | Done |

## H2 Security Review experience

| ID | Work item | Acceptance | Status |
|---|---|---|---|
| HCK-201 | Copilot-style entry | User selects a synthetic package and submits a validated natural-language review request | Done |
| HCK-202 | Review workflow | Seven synthetic scenarios execute through content-derived evidence and runtime governance controls, including three standard governed stops | Done |
| HCK-203 | Evidence experience | Evidence type, claim, source, Runbook authority, and versioned execution context are inspectable | Done |
| HCK-204 | Analyst disposition | Analyst accepts, modifies, rejects, escalates, or marks Cannot Assess; HumanDecision evidence is retained | Done |
| HCK-205 | Draft report | Structured report preserves scope, Runbook, template, citations, analyst decisions, and governed Draft/Final status | Done |
| HCK-206 | Trace view | Correlation, Skills, implementation versions, Plugins, outcomes, and ordered execution are visible | Done |
| HCK-207 | Local governed reuse proof | Security Review Copilot and Architecture Review Workflow invoke the same pinned Document Intake Skill and Plugin versions through distinct Bindings and invocation identities | Done |

## H3 Quality and demo readiness

| ID | Work item | Acceptance | Status |
|---|---|---|---|
| HCK-301 | End-to-end tests | Governed scenarios, error recovery, accessibility, and keyboard operation pass 16 desktop/mobile Chromium journeys | Done |
| HCK-302 | Evaluation integration | Seven real Router runs export candidate results and pass the Python oracle at 84/84 with Pilot blocked | Done |
| HCK-303 | Responsive UX verification | Desktop and mobile E2E assert no horizontal clipping across all four scenarios | Done |
| HCK-304 | Recorded fallback | Desktop/mobile screenshots and an automated local walkthrough recording use the committed synthetic scenario | Done |
| HCK-305 | Submission completion | Challenge choices, team, repository, screenshots, and video links are entered | Partial; exact Challenge choices and Innovation Studio form entry require organizer input |
| HCK-306 | Inspectable isolated Evaluation Run | UI exposes Run ID, version pins, seven cases, and 84 assertions; evaluation execution does not create operational Reviews | Done; Hosted browser rechecked 2026-09-08 |

## H4 Connected Mode, stretch

| ID | Work item | Acceptance | Status |
|---|---|---|---|
| HCK-401 | Copilot Studio entry | Agent invokes the same Skill contracts through Agent Actions | Environment and gate blocked |
| HCK-402 | Power Automate adapters | Connected Plugin adapters preserve Demo contract behavior | Environment and gate blocked |
| HCK-403 | Dataverse metadata | Selected registry, binding, invocation, and evidence records persist | Environment and gate blocked |
| HCK-404 | Connected second Consumer | Architecture Review binds to an existing Connected Mode Deployment without copying it | Blocked by HCK-401/403 |

## Submission Closeout, 2026-09-08

Historical Done entries above are implementation records, not a claim that the current workstation has rerun every release check. Current evidence and limitations are recorded in [delivery revalidation](../00-Hackathon/clean-clone-validation.md#2026-09-08-delivery-revalidation).

| Order | Work item | Acceptance | Owner | Status |
|---|---|---|---|---|
| 1 | Revalidate the submission baseline | Build, API/production/E2E tests, Python evaluation, audit, Foundation checks, and clean clone pass for the recorded submission commit | Implementation Owner, assignment pending | Partial: successful CI run 34103533028 verified for `a08c65e`; browser-based Hosted checks passed seven scenarios and 84/84 assertions; local rerun blocked by missing toolchain |
| 2 | Calibrate delivery evidence | Separate historical counts from current results and align current evaluation coverage to seven cases / 84 assertions | Implementation and submission owners, assignment pending | Documentation updated; final local counts pending item 1 |
| 3 | Complete HCK-305 | Official Executive/Topic Challenge choices, final links, and Innovation Studio submission receipt are retained | Project Manager: Liming | Waiting for official choices and authenticated form entry |
| 4 | Rehearse and verify fallback | Live presentation <=300 seconds; local fallback starts; video and screenshots match the chosen submission version | Presenter, assignment pending | Script budget checked at 290+10 seconds; timed rehearsal and media playback pending |
| 5 | Maintain Hosted Demo | Standard Hosted checks pass before judging; continue-or-teardown decision recorded on 2026-09-18 | Liming | Browser checks passed 2026-09-08; lifecycle decision pending |
| 6 | Prepare Connected admission evidence | Named owners, SME labels, Runbook/data authority, environment authorization, and DG-001 through DG-008 decisions retained | Business, Architecture, Domain SME, and Governance owners, assignment pending | Blocked pending accountable-owner inputs; no tenant work started |

## Immediate sequence

1. Review the KPR-001 draft artifacts and record the contract compatibility decision. Assign a Business Owner and independent acceptance reviewer; supply held-out fixtures and agree the value comparison before measurement. Do not treat the checked-in development examples as held-out evidence.
2. Obtain seven Wenxian-owned held-out cases, then rerun KPR-004 with retained raw evidence. Wenxian is confirmed independent of implementation. Keep runtime inputs separate from hidden acceptance labels and preserve the existing Hackathon contracts.
3. Execute the approved paired value protocol and complete KPR-005 with a recorded Continue/Revise/Stop decision. Do not begin controlled publication merely because development acceptance or the old Demo reports pass.
4. Only after acceptance and value evidence, implement the minimum KPR-006 controlled publication path under the applicable authorization; defer the full data model and general platform.
5. In parallel, finish submission baseline checks, official Challenge/form entry, timed rehearsal, and fallback playback. Keep the Hosted Demo healthy through the 2026-09-18 lifecycle review; these operations do not reorder the product validation gates.
6. Keep Connected TEST blocked until all applicable approvals are recorded. Use the existing [DEV authorization intake](../04-Governance/development-readiness-gate.md#6-dataverse-dev-authorization-intake); do not create tenant resources without explicit authorization.
