# ESP MVP Hardening Backlog

**Assessment date:** 2026-09-04  
**Purpose:** Close the gap between a credible synthetic demonstration and the stated governed-capability behavior.

## Priority 0: Demo integrity

| ID | Gap | Required behavior | Acceptance | Status |
|---|---|---|---|---|
| HRD-001 | Natural-language request is ignored | API validates, stores, traces, and returns the user request; empty request is rejected | Request round-trip and missing-request rejection pass | Done |
| HRD-002 | Facts come from expected labels | Evidence Extraction derives facts from authorized synthetic document content | Content mutation changes extracted claims independently of labels | Done |
| HRD-003 | Prompt-injection detection is field-name based | Recursively inspect untrusted string content and apply explicit policy patterns independent of JSON key | Injection under arbitrary nested keys is detected, ignored, and evidenced | Done |
| HRD-004 | Prohibited behaviors are always empty | Runtime controls emit detected violations and evaluator consumes actual runtime results | Missing citation and unhandled injection produce violations; normal runs remain 36/36 | Done |
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

## Priority 3: Publication operations

| ID | Gap | Required behavior | Acceptance | Status |
|---|---|---|---|---|
| HRD-301 | Production dependency audit was not enforced | Keep production high/critical advisories at zero and record upstream-only residuals | `npm run audit:production` passes; two `qs` moderate advisories remain until 6.16.0 is available | Done |
| HRD-302 | Repository validation is manual | Run build, tests, evaluation, and dependency audit on proposed changes | A GitHub Actions or approved enterprise CI workflow passes on `main` and pull requests | In Progress |
| HRD-303 | GitHub repository metadata is incomplete | Set description, topics, hosted Demo homepage, and approved branch policy | Anonymous repository metadata and branch rules match the submission package | In Progress |
| HRD-304 | Hosted Demo checks are manual | Automate health, four scenarios, security headers, and a browser smoke after deployment | A repeatable post-deployment check reports pass/fail without mutating production data beyond synthetic records | Done |
| HRD-305 | B1 lifecycle is not time-bounded | Record cost owner, review date, and teardown or continuation decision | Resource tags and runbook identify an accountable owner and expiry/review date | Done |

## Connected and enterprise work

Copilot Studio, Power Automate adapters, Dataverse persistence, Identity/Policy Bindings, DLP, customer Runbooks, approved thresholds, primary TEST Agent, and enterprise second Consumer remain governed Connected Mode work. They do not block the local synthetic demo but are required before enterprise Pilot claims.
