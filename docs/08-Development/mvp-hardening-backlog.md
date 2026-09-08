# ESP MVP Hardening Backlog

**Assessment date:** 2026-09-04  
**Purpose:** Close the gap between a credible synthetic demonstration and the stated governed-capability behavior.

## Priority 0: Demo integrity

| ID | Gap | Required behavior | Acceptance | Status |
|---|---|---|---|---|
| HRD-001 | Natural-language request is ignored | API validates, stores, traces, and returns the user request; empty request is rejected | Request round-trip and missing-request rejection pass | Done |
| HRD-002 | Facts come from expected labels | Evidence Extraction derives facts from authorized synthetic document content | Content mutation changes extracted claims independently of labels | Done |
| HRD-003 | Prompt-injection detection is field-name based | Recursively inspect untrusted string content and apply explicit policy patterns independent of JSON key | Injection under arbitrary nested keys is detected, ignored, and evidenced | Done |
| HRD-004 | Prohibited behaviors are always empty | Runtime controls emit detected violations and evaluator consumes actual runtime results | Missing citation and unhandled injection produce violations; governed runs pass 84/84 | Done |
| HRD-005 | Review state is memory-only | Persist review, trace, evidence, and disposition using atomic local file replacement | A new App instance reloads the completed Review by Correlation ID | Done |

## Priority 1: Governance proof

| ID | Gap | Required behavior | Acceptance | Status |
|---|---|---|---|---|
| HRD-101 | Consumer Binding is a constant string | Register Consumers and version-pinned Bindings used by Router resolution | Unknown/inactive Binding is rejected; trace includes Consumer and Binding | Done |
| HRD-102 | Second Consumer is not executable | Add Architecture Review Consumer that reuses Document Intake or Evidence Extraction | Distinct Binding invokes the same Skill and Plugin versions without copies | Done |
| HRD-103 | Contract Schema is not enforced at Router boundary | Validate Router request and response against canonical schema or a documented workflow envelope | Malformed request/output is rejected before persistence | Done |
| HRD-104 | Citation preservation flag is assigned, not proven | Validate every report citation resolves to retained Evidence | Missing or unknown evidence ID blocks report completion | Done |

## Priority 2: Operational quality

| ID | Gap | Required behavior | Acceptance | Status |
|---|---|---|---|---|
| HRD-201 | UI fetch failures are silent | Expose loading, retry, and actionable error states | API unavailable and invalid response E2E paths pass | Done |
| HRD-202 | Local review store retains terminal records indefinitely | Apply local retention and deterministic cleanup | Expired records are removed without deleting active traces | Done |
| HRD-203 | Accessibility is only structurally checked | Add keyboard, focus, contrast, and accessible-name checks | Automated accessibility audit and keyboard journey pass | Done |
| HRD-204 | Performance is not measured | Capture startup and scenario duration against Hackathon targets | Startup under 10s and local workflow under 2s are reported | Done |
| HRD-205 | File-backed reviews do not recover from store corruption | Maintain a durable last-known-good backup and repair a missing or malformed primary store | A truncated primary store reloads the retained Review and is repaired automatically | Done |

## Priority 3: Publication operations

| ID | Gap | Required behavior | Acceptance | Status |
|---|---|---|---|---|
| HRD-301 | Production dependency audit was not enforced | Keep production high/critical advisories at zero and record upstream-only residuals | `npm run audit:production` passes and Dependabot reports zero open alerts | Done |
| HRD-302 | Repository validation is manual | Run build, tests, evaluation, and dependency audit on proposed changes | A GitHub Actions or approved enterprise CI workflow passes on `main` and pull requests | Done |
| HRD-303 | GitHub repository metadata is incomplete | Set description, topics, hosted Demo homepage, and approved branch policy | Anonymous repository metadata and branch rules match the submission package | Done |
| HRD-304 | Hosted Demo checks are manual | Automate health, four scenarios, security headers, and a browser smoke after deployment | A repeatable post-deployment check reports pass/fail without mutating production data beyond synthetic records | Done |
| HRD-305 | B1 lifecycle is not time-bounded | Record cost owner, review date, and teardown or continuation decision | Resource tags and runbook identify an accountable owner and expiry/review date | Done |

## Connected and enterprise work

Copilot Studio, Power Automate adapters, Dataverse persistence, Identity/Policy Bindings, DLP, customer Runbooks, approved thresholds, primary TEST Agent, and enterprise second Consumer remain governed Connected Mode work. They do not block the local synthetic demo but are required before enterprise Pilot claims.

## Next delivery todo: Microsoft-integrated capabilities

**Planning date:** 2026-09-08

**Status:** Planned; this checklist does not approve Connected Mode, business-system writes, or Pilot.

### Agreed direction and boundaries

- Integrate with Microsoft products, especially Copilot Studio, while keeping Skill contracts independent of the runtime.
- Govern reusable knowledge preparation and cleaning as well as online capability execution. A knowledge package is an asset; preparing it is a capability.
- Select Skill boundaries by independently testable outcomes, ownership, and genuine second-Consumer demand. Do not turn every processing step into a Skill.
- Start with one Security Review knowledge-preparation capability, reusing Document Intake and Evidence Extraction where their contracts fit. Parking remains an illustrative example, not an added MVP domain.
- Preserve the existing synthetic Demo and human accountability. Do not require the full 42-table model, seven-Solution topology, or a new Agent engine for the first proof.
- Treat shared knowledge assets and shared executable Skills as separate reuse claims. Two Consumers must invoke the same implementation to prove executable reuse.

Earlier Done rows describe the historical Demo baseline. They do not establish real identity authorization, independent business-quality evaluation, or live Microsoft integration. In particular, the current evaluator derives some observed behaviors and Runbook values from expected labels; the reported 84/84 must not be treated as wholly independent evidence.

### Phase 1: Local, synthetic, independently verifiable

- [ ] CAP-001 - Define the minimum knowledge-preparation contract and capability ownership.
	Acceptance: identify the proposed Capability Owner and Domain SME; document authorized source references, preparation requirements, source versions, draft knowledge output, quality report, conflicts, evidence mapping, limitations, and two concrete Consumers. Record why the boundary is independently useful instead of duplicating a Plugin operation.
- [ ] CAP-002 - Remove expected-answer dependencies from runtime and candidate-result generation.
	Acceptance: choose Runbooks and derive findings from approved synthetic input and runtime configuration, not expected labels. Obtain observed behaviors, versions, and dependency hashes from actual execution. Independent mutation tests fail when required behavior, citations, Runbook selection, or authorization enforcement is deliberately broken.
- [ ] CAP-003 - Freeze an independent synthetic acceptance set before implementing the new capability.
	Acceptance: include complete, missing, duplicate, conflicting, stale, unreadable, and unauthorized sources plus untrusted instructions. Expected outcomes are separate from runtime input; distinguish observed facts, model suggestions, and human decisions. Do not claim Domain SME approval before it is recorded.
- [ ] CAP-004 - Implement knowledge preparation as a bounded, evidence-preserving workflow.
	Acceptance: normalization and extraction preserve original meaning, source references, versions, and permissions; unresolved conflicts produce an explicit quality failure or review requirement. Changed input changes output or its quality report. Output remains a local draft and cannot silently become authoritative policy.
- [ ] CAP-005 - Prove two independent local Consumers reuse the same implementation.
	Acceptance: an interactive caller and an independently triggered workflow invoke the same pinned Skill and Plugins without copying core logic. Records have distinct invocation identities; unauthorized scope is rejected before accessing a restricted Plugin. Local simulated identities are explicitly labelled and are not evidence of real authentication.
- [ ] CAP-006 - Make version and revocation rules affect execution.
	Acceptance: Skill, Plugin, and knowledge-package versions are separately identifiable; a Consumer cannot silently follow Latest. Suspending a Binding or revoking a dependency blocks the next affected invocation before restricted execution without breaking unaffected authorized Consumers.

### Phase 2: Microsoft integration, subject to environment authorization

- [ ] CAP-101 - Obtain and record authorized DEV access and named accountability.
	Acceptance: record the permitted environment, licensing or capacity availability, owners, non-secret connection references, runtime identities, DLP, approved synthetic repositories, retention, support, and rollback responsibilities. Follow the Development Readiness Gate; Foundation permission does not waive DG-001 through DG-008 for TEST integration.
- [ ] CAP-102 - Bind trusted identities to server-controlled Consumer authorization.
	Acceptance: validate the selected user, application, or connection identity at the trusted boundary; do not trust a client-supplied Binding as identity. Test allowed and denied source access, impersonation attempts, and the absence of permission elevation or identity switching after denial.
- [ ] CAP-103 - Integrate a Copilot Studio tool and an independent workflow Consumer.
	Acceptance: use approved Agent flows, Power Automate, or connectors to invoke the same implementation with typed inputs and structured results. Preserve contract and source references, actual dependency versions, evidence, failures, and human oversight. Run conformance checks through both real callers; mapping configuration alone is not integration evidence.

### Phase 3: Controlled publication and evidence-based Pilot

- [ ] CAP-201 - Approve the knowledge-publication write boundary before enabling it.
	Acceptance: complete Architecture Change Review and the DG-003 scope update, name the publisher and approver, and approve target repositories and least-privilege write permissions. Until approved, retain local draft outputs only; do not write to an enterprise knowledge source.
- [ ] CAP-202 - Implement and verify the approved publication lifecycle.
	Acceptance: require quality validation and accountable approval before publication. Retain immutable knowledge-package versions and source lineage, prevent permissions from widening during transformation, and test source changes, revalidation, revocation, rollback, and cache or index refresh behavior. Native knowledge search must not be presented as fixed-version execution unless that guarantee is verified.
- [ ] CAP-203 - Measure business value and update claims only after evidence exists.
	Acceptance: obtain approved SME labels and thresholds, compare second-Consumer onboarding and maintenance effort with a documented baseline, and measure output quality, human correction, authorization failures, latency, and recovery. Update the Demo, documentation, evaluation claims, and video to distinguish deterministic behavior, live integrations, and remaining limitations. Stop expansion if shared semantics or net reuse value cannot be demonstrated.

### Execution order and completion evidence

Start with CAP-001 and CAP-002, then freeze CAP-003 before implementing CAP-004 through CAP-006. CAP-101 gates real environment work; CAP-201 gates publication writes. No pending item is completed by this planning record.

For each completed item, retain the implementing commit, focused test command and result, evidence references, accountable owner, and any approval conditions. Leave blocked items unchecked and name their external prerequisite rather than substituting a Demo result for real integration evidence.
