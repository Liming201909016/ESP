# ESP Hackathon Technical Feasibility Assessment

**Assessment date:** 2026-09-03  
**Target:** Microsoft Global Hackathon 2026  
**Overall verdict:** Local Demo Go; Connected Mode Conditional Go

## 1. Decision

The proposed architecture is technically feasible, and the repository contains a runnable local Hackathon MVP using synthetic data. Connected Mode and enterprise promotion remain conditional on environment and governance prerequisites.

| Layer | Verdict | Verified evidence |
|---|---|---|
| Architecture and contracts | Go | Five Skill contracts, Plugin standard, version pinning, evidence rules, and local/connected boundaries are defined and validated |
| Local toolchain | Go | Node 24.19.0, npm 11.17.0, Python 3.12.10, Vite 8.2.2, Express 5.2.1, Ajv 8.20.0, and Ajv Formats 3.0.1 are available or resolvable |
| Synthetic data and evaluation | Go | Four synthetic RG/APP cases validate; Foundation evaluation passes 36/36 mandatory assertions while correctly setting Pilot eligibility to false |
| Power Platform ALM foundation | Go | PAC 2.11.2 is installed; seven Solution source projects and unmanaged packages validate locally |
| Runnable local application | Go | React/Vite and Express provide one-command Demo Mode with five Skills, four Plugins, evidence, analyst disposition, structured report, trace, and evaluation |
| Copilot Studio Connected Mode | Conditional Go | The platform supports Agent flows, connectors, REST APIs, MCP, and explicit topic calls; tenant connectivity, identity, DLP, and deployment remain gated |
| Production/Pilot | No-Go | Owners, Runbooks, approved labels/thresholds, data authority, TEST environment, and formal gates remain incomplete |

`Local Demo Go` means the synthetic vertical slice is runnable and suitable for Hackathon demonstration. It does not authorize Connected TEST, customer data, Pilot, or Production claims.

## 2. Local implementation decision

Use a TypeScript monorepo with a browser client and local API:

- React and Vite for the Copilot-style experience;
- Express for the local HTTP API;
- Ajv Draft 2020-12 plus Ajv Formats for runtime contract and URI validation;
- TypeScript shared types generated or maintained against the canonical JSON Schemas;
- file-backed JSON persistence for synthetic registrations, invocation traces, evidence, and analyst dispositions;
- Vitest for unit and contract tests;
- Playwright for desktop/mobile end-to-end and visual checks.

This stack is suitable because the local Node/npm toolchain and package registry access were verified. It supports one-command startup, a browser UI, shared contracts, deterministic Plugins, and later replacement of local adapters with connected adapters.

The implementation now passes 10 API integration tests and eight Playwright desktop/mobile journeys across all four governed scenarios. Four real Router runs export evaluator-compatible candidate results and pass the independent Python oracle at 36/36 mandatory assertions with `pilotEligible=false`.

Python remains the source of the existing workbook, dataset-manifest, documentation, and Foundation evaluation tooling. The application must emit candidate results compatible with `Run-SyntheticEvaluation.py`; it must not duplicate the evaluator in a divergent format.

## 3. Proposed module boundaries

```text
apps/web
  Copilot-style UI, case selection, analyst review, evidence and trace views

apps/api
  HTTP boundary, workflow state machine, Skill Router, local persistence

packages/contracts
  Canonical schema loading, Ajv validators, TypeScript contract types

packages/registry
  Five Skill and four Plugin registrations with pinned versions

packages/skills
  Document Intake, Evidence Extraction, Security Review, Risk Rating, Report Generation

packages/plugins
  Document Source, Runbook, Evidence, Report local adapters

packages/test-support
  Synthetic fixtures, candidate-result export, deterministic clocks/IDs
```

The API owns the authoritative workflow state. The browser never executes Plugins directly and never fabricates evidence or versions.

## 4. Deterministic workflow

The Security Review main path is a state machine, not unrestricted generative tool selection:

```text
Submitted
→ IntakeCompleted | NeedsInformation
→ EvidenceExtracted | CannotAssess
→ ReviewDrafted | CannotAssess | RejectedByPolicy
→ RiskProposed
→ AwaitingAnalystDisposition
→ ReportDrafted
→ Evaluated
```

Each transition validates input/output, pins Skill and Plugin versions, records Correlation ID and timing, and appends Evidence Items. A failed transition cannot be skipped by the UI or by a model-generated response.

Generative behavior may help interpret a user request or draft text, but deterministic code controls authority, evidence requirements, state transitions, final risk confirmation, and report status.

## 5. Skill and Plugin feasibility

Five Skills and four Plugins are well within Copilot Studio tool limits. Current Microsoft guidance supports up to 128 tools per agent and recommends approximately 25-30 or fewer for performance, so the MVP catalog has ample headroom.

The logical many-to-many model is implementable:

- Document Intake and Evidence Extraction reuse Document Source;
- Security Review and Risk Rating reuse Runbook;
- all Skills reuse Evidence;
- Report Generation uses Report.

The registry must reject missing versions, duplicate codes, `Latest`, unavailable dependencies, schema mismatch, and Plugin health failure before workflow execution.

## 6. Copilot Studio Connected Mode

Connected Mode is feasible with the following mapping:

- one Copilot Studio agent is the entry point;
- one explicit Security Review topic or orchestrating Agent flow controls the five-step end-to-end workflow;
- five Skill tools expose business-capability boundaries;
- each Skill tool calls the same Router service or equivalent governed flow with a fixed Skill code;
- Plugin adapters remain behind the Router and may use Agent flows, connectors, REST APIs, or MCP tools;
- user-facing tool inputs are typed and minimal; the full internal envelope is assembled after entry validation;
- critical evidence, risk, and report outputs use specific structured responses or Adaptive Cards rather than unrestricted generated rewriting.

Generative orchestration may select the top-level review capability for conversational discovery, but it must not independently reorder or omit the five mandatory workflow stages.

Authentication must explicitly choose end-user or maker-provided credentials per tool. Denial is returned as `RejectedByPolicy`; another identity is not silently attempted.

## 7. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Documentation is ahead of implementation | Demo cannot run | Implement HCK-101 through HCK-104 before adding enterprise features |
| Full JSON envelope exposed as one Copilot string | Weak validation and poor orchestration | Expose typed minimal inputs/outputs; assemble and validate the envelope inside the Router |
| Generative orchestration reorders Skills | Evidence or authority path is skipped | Use an explicit topic/Agent flow state machine for the end-to-end review |
| Generated answer rewrites citations or status | Trace no longer matches response | Use structured result rendering and Adaptive Cards for governed outputs |
| Mock Plugin appears production-ready | Misleading submission | Display Demo/Mock badges and block Pilot eligibility |
| File-backed store loses concurrent writes | Corrupted demo trace | Single-process API, atomic replace writes, and serialized mutation queue for the MVP |
| Local and connected adapters diverge | Demo cannot migrate | Run shared Plugin contract tests against both adapters |
| Tenant/network unavailable | Connected demo fails | Keep local Demo Mode mandatory and recorded fallback current |
| Prompt injection in source material | Governance bypass | Treat documents as untrusted data; deterministic state and policy rules outrank content |

## 8. Performance and operational targets

For the deterministic local MVP:

- application startup under 10 seconds on the verified development machine;
- non-model local workflow under 2 seconds for included cases;
- UI acknowledges user action within 200 milliseconds;
- every workflow has one Correlation ID and complete ordered trace;
- contract validation and mandatory evidence checks have zero tolerated failures;
- no network call, customer data, or secret in Demo Mode.

These are Hackathon engineering targets, not enterprise service-level commitments.

## 9. Implementation gates

### Gate A: walking skeleton - Passed

Pass when one command starts web/API, the registry loads 5/4 pinned entries, health is visible, and one request returns a traced response.

### Gate B: RG vertical slice - Passed

Pass when RG happy and missing-input cases complete through analyst disposition and draft report with evidence.

### Gate C: complete demo - Passed

Pass when APP happy and prompt-injection cases pass, candidate results feed the existing evaluator, and desktop/mobile E2E checks pass.

### Gate D: Connected Mode

Pass only after Demo Mode is green and the Power Platform environment, identity, DLP, Connection References, and governance approvals are available.

## 10. Conclusion

The local MVP is runnable and demo-ready under the synthetic-data boundary. Continue with recorded fallback media and optional Connected Mode. Do not interpret Gate C as customer validation, Pilot approval, or Production authorization.
