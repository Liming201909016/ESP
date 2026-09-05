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
| HCK-201 | Copilot-style entry | User selects a synthetic package and submits a validated natural-language review request | Done |
| HCK-202 | Review workflow | Four synthetic scenarios execute through content-derived evidence and runtime governance controls | Done |
| HCK-203 | Evidence experience | Evidence type, claim, source, Runbook authority, and versioned execution context are inspectable | Done |
| HCK-204 | Analyst disposition | Analyst accepts, modifies, rejects, escalates, or marks Cannot Assess; HumanDecision evidence is retained | Done |
| HCK-205 | Draft report | Structured report preserves scope, Runbook, template, citations, analyst decisions, and governed Draft/Final status | Done |
| HCK-206 | Trace view | Correlation, Skills, implementation versions, Plugins, outcomes, and ordered execution are visible | Done |

## H3 Quality and demo readiness

| ID | Work item | Acceptance | Status |
|---|---|---|---|
| HCK-301 | End-to-end tests | Governed scenarios, error recovery, accessibility, and keyboard operation pass 16 desktop/mobile Chromium journeys | Done |
| HCK-302 | Evaluation integration | Four real Router runs export candidate results and pass the Python oracle at 36/36 with Pilot blocked | Done |
| HCK-303 | Responsive UX verification | Desktop and mobile E2E assert no horizontal clipping across all four scenarios | Done |
| HCK-304 | Recorded fallback | Desktop/mobile screenshots and an automated local walkthrough recording use the committed synthetic scenario | Done |
| HCK-305 | Submission completion | Challenge choices, team, repository, screenshots, and video links are entered | Partial; exact Challenge choices and Innovation Studio form entry require organizer input |

## H4 Connected Mode, stretch

| ID | Work item | Acceptance | Status |
|---|---|---|---|
| HCK-401 | Copilot Studio entry | Agent invokes the same Skill contracts through Agent Actions | Environment and gate blocked |
| HCK-402 | Power Automate adapters | Connected Plugin adapters preserve Demo contract behavior | Environment and gate blocked |
| HCK-403 | Dataverse metadata | Selected registry, binding, invocation, and evidence records persist | Environment and gate blocked |
| HCK-404 | Second Consumer | Architecture Review binds to an existing Skill without copying it | Blocked by HCK-401/403 |

## Immediate sequence

1. Select the exact Innovation Studio Executive and Topic Challenges from the organizer-provided list.
2. Enter the prepared team, repository, Hosted Demo, screenshots, and fallback-video links in Innovation Studio.
3. Keep the Hosted Demo healthy through the 2026-09-18 lifecycle review and rerun `npm run test:hosted` before judging.
4. Obtain named owners, Domain SME review, and DG-001 through DG-008 decisions before Connected TEST work.
5. Start optional Copilot Studio, Power Automate, and Dataverse work only in an explicitly authorized environment.
