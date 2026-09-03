# ESP Hackathon MVP Delivery Profile

**Version:** V0.1  
**Target:** Microsoft Global Hackathon 2026  
**Data boundary:** Synthetic, non-sensitive data only

## 1. Relationship to the enterprise baseline

The Hackathon MVP is a runnable delivery profile of the ESP V1.0 enterprise architecture. It does not replace or weaken the canonical model. The enterprise baseline defines the production destination; this profile selects the smallest vertical slice needed to demonstrate the core hypothesis.

The 42-table Dataverse model and seven-Solution topology are not prerequisites for the Hackathon demo. They remain validated enterprise-scale artifacts and a Connected Mode evolution path. Demo Mode uses a lightweight registry and evidence store that preserve the same identifiers, contracts, version pins, and trace semantics.

## 2. Hypothesis

An enterprise capability can be authored once as a stable Skill contract, implemented with replaceable Plugins, invoked from one Copilot, and reused without copying while retaining evidence and human accountability.

The demo falsifies this hypothesis if the end-to-end scenario requires private copies of a Skill or Plugin, silently changes version, emits unsupported material facts, bypasses a denied source, or cannot reconstruct which components produced the result.

## 3. Runtime architecture

```text
User
→ ESP Security Review Copilot
→ Skill Router
   → Logical Skill contract and pinned implementation
   → one or more registered Plugins
→ Evidence Store and Invocation Trace
→ Analyst Review
→ Draft Report and Evaluation Result
```

### Skill

A Skill is a product-independent business capability with stable identity, versioned input/output/error contract, evidence obligations, limitations, and oversight rules. A Skill does not contain runtime credentials or assume a specific Plugin technology.

### Plugin

A Plugin is a runtime tool adapter that performs a bounded operation for one or more Skills. It declares identity, version, input/output schema, permissions, timeout, retry behavior, evidence mapping, and health state. A Plugin is not the same as a Skill, and the relationship is many-to-many.

### Skill Router

The Skill Router resolves only the implementation and Plugins pinned by the active Consumer Binding. It validates request and response contracts, propagates Correlation ID, applies explicit fallback, and emits invocation and evidence records. It never selects `Latest` during an invocation.

## 4. MVP catalog

### Skills

| Skill | Purpose | MVP status |
|---|---|---|
| LS-SEC-DOC-INTAKE | Normalize request context and identify missing material | Required |
| LS-SEC-EVIDENCE-EXTRACT | Extract sourced facts, conflicts, and gaps | Required |
| LS-SEC-REVIEW | Apply Runbook authority and draft findings | Required |
| LS-SEC-RISK-RATING | Propose a rating for analyst confirmation | Required |
| LS-SEC-REPORT-GEN | Render analyst dispositions and citations | Required |

### Plugins

| Plugin | Bounded operation | Reused by |
|---|---|---|
| PLG-DOC-SOURCE | Read an authorized synthetic document reference | Document Intake, Evidence Extraction |
| PLG-RUNBOOK | Resolve a pinned synthetic Runbook and authority | Security Review, Risk Rating |
| PLG-EVIDENCE | Persist and query invocation/evidence references | All Skills |
| PLG-REPORT | Render a draft report from approved structured data | Report Generation |

Demo implementations may be deterministic or mocked, but must use the same Plugin contracts as Connected Mode. Mock behavior must be visibly labelled and must not be represented as a live enterprise integration or as evidence of Pilot quality.

## 5. Run modes

### Demo Mode, required

- starts locally with one documented command;
- uses included synthetic RG and APP datasets;
- requires no tenant, secret, customer repository, or production connection;
- exposes one browser-accessible Copilot-style experience;
- displays Skill/Plugin versions, execution trace, evidence, and human-review state;
- runs automated contract and evaluation checks.

### Connected Mode, optional for Hackathon

- hosts the entry experience in Copilot Studio;
- invokes Power Automate Agent Actions and approved connectors;
- stores selected metadata in Dataverse;
- uses Connection References, environment variables, identity and DLP policy;
- remains subject to the Development Readiness Gate.

The Hackathon submission must remain demonstrable when Connected Mode is unavailable.

## 6. Minimal persisted model

Demo Mode persists or emits only:

- Skill and Plugin registrations;
- Implementation and dependency versions;
- Consumer Binding;
- Invocation Index;
- Evidence Package and Evidence Items;
- analyst disposition;
- Evaluation Run summary.

These records may use local structured files or an embedded store. Their codes and schemas must remain compatible with the enterprise Dataverse model.

## 7. End-to-end demonstration

1. Select the synthetic RG or APP package.
2. Ask the Copilot to perform a security review.
3. Observe the Router invoke the five Skills and four Plugins.
4. Inspect facts, source references, conflicts, and missing information.
5. Confirm or change the proposed risk rating as the analyst.
6. Generate a draft report with preserved citations.
7. Inspect Correlation ID, pinned versions, execution trace, and Evaluation Run.
8. Show a second Consumer binding to Document Intake or Evidence Extraction without copying it.

## 8. Acceptance criteria

- a clean local setup supports one-command local startup of Demo Mode;
- RG happy path and missing-input path complete;
- APP happy path and prompt-injection path complete;
- every material factual claim has an Evidence Item;
- missing evidence produces `NeedsInformation` or `CannotAssess`;
- document instructions cannot override governance;
- final risk requires human confirmation;
- draft report preserves citations and Draft status;
- trace identifies Consumer, Binding, Skill, implementation, Plugin, and versions;
- automated Foundation evaluation passes all mandatory synthetic assertions;
- Connected Mode failure does not prevent the local demonstration.

## 9. Explicit exclusions

- production authorization or customer data;
- autonomous approval, rejection, remediation, consent, or business-system writes;
- full implementation of the 42-table control plane;
- full seven-Solution deployment to a tenant;
- cross-tenant marketplace or dynamic per-invocation `Latest` resolution;
- general-purpose Agent factory.

## 10. Optimization priorities

1. Build the complete local vertical slice before tenant integration.
2. Keep the Router and Plugin interfaces technology-neutral.
3. Reuse the existing JSON Skill contract, synthetic dataset, and evaluator.
4. Implement visible evidence and traceability before visual polish.
5. Make failure states first-class demo paths.
6. Add Connected Mode only after Demo Mode is reproducible.
7. Preserve enterprise identifiers so the MVP can migrate without redesign.
