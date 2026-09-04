# ESP Hackathon MVP Backlog

**Target:** Microsoft Global Hackathon 2026  
**Priority rule:** Complete the runnable local vertical slice before Connected Mode or full enterprise control-plane implementation.

## Definition of Done

The Hackathon MVP is done when a reviewer can clone or open the repository, run one setup/start command, complete the RG and APP demo paths, inspect Skill/Plugin trace and evidence, perform analyst disposition, generate a draft report, and run automated evaluation without a tenant or secret.

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
| HCK-201 | Copilot-style entry | User selects a synthetic package and submits a natural-language review request | Done |
| HCK-202 | Review workflow | Four synthetic scenarios execute through ordered Skills with governed outcomes and visible trace | Done |
| HCK-203 | Evidence experience | Evidence type, claim, source, Runbook authority, and versioned execution context are inspectable | Done |
| HCK-204 | Analyst disposition | Analyst accepts, modifies, rejects, escalates, or marks Cannot Assess; HumanDecision evidence is retained | Done |
| HCK-205 | Draft report | Report preserves citations, analyst decisions, and Draft status | Ready |
| HCK-206 | Trace view | Correlation, Consumer, Binding, Skills, Plugins, versions, outcomes, and timings are visible | Blocked by HCK-202 |

## H3 Quality and demo readiness

| ID | Work item | Acceptance | Status |
|---|---|---|---|
| HCK-301 | End-to-end tests | RG happy/missing-input and APP happy/prompt-injection paths pass | Blocked by H2 |
| HCK-302 | Evaluation integration | Existing synthetic evaluator runs against application results | Blocked by HCK-202 |
| HCK-303 | Responsive UX verification | Desktop and mobile screenshots show no clipping or overlap | Blocked by H2 |
| HCK-304 | Recorded fallback | Demo recording is generated from the same committed synthetic version | Blocked by HCK-301 |
| HCK-305 | Submission completion | Challenge choices, team, repository, screenshots, and video links are entered | Organizer/team input |

## H4 Connected Mode, stretch

| ID | Work item | Acceptance | Status |
|---|---|---|---|
| HCK-401 | Copilot Studio entry | Agent invokes the same Skill contracts through Agent Actions | Environment and gate blocked |
| HCK-402 | Power Automate adapters | Connected Plugin adapters preserve Demo contract behavior | Environment and gate blocked |
| HCK-403 | Dataverse metadata | Selected registry, binding, invocation, and evidence records persist | Environment and gate blocked |
| HCK-404 | Second Consumer | Architecture Review binds to an existing Skill without copying it | Blocked by HCK-401/403 |

## Immediate sequence

1. Scaffold the local application.
2. Implement registries, Router, and four deterministic Plugins.
3. Implement the complete RG path, including analyst review and report.
4. Add APP and failure paths.
5. Integrate evaluation, screenshots, and recorded fallback.
6. Treat Connected Mode as stretch work only after the local Definition of Done passes.
