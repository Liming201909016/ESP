# ESP Development Readiness Gate

**Version:** V1.0  
**Gate status:** Pending Sign-off  
**Assessment date:** 2026-09-03

## 1. Purpose

Define the evidence required to start foundational development, TEST integration, Pilot, and Production. A later gate never waives an earlier gate.

This gate governs enterprise and Connected Mode delivery. It does not block the local Microsoft Global Hackathon 2026 Demo Mode when that mode uses only committed synthetic, non-sensitive data, local Mock Plugins, and no tenant or production connection. Demo Mode cannot claim TEST, Pilot, Production, customer validation, or enterprise approval.

## 2. Work classes

### Foundation development

Permitted before final sign-off using synthetic, non-sensitive data:

- repository and Power Platform Solution structure;
- Dataverse schema generation in an isolated development environment;
- Logical Skill contract and JSON Schema authoring;
- local or isolated Agent integration spikes;
- evaluation harness and synthetic test-data preparation.

Foundation work must not be represented as an approved release and must not use customer production content, production identities, or production connections.

### TEST integration

Requires all Development Gate controls below to be Approved and named owners to be recorded. TEST deployment also requires approved source classifications, authorized repositories, connection references, identity and policy bindings, Skill contracts, dependency hashes, and a rollback target.

### Pilot and Production

Pilot and Production require the additional conditions in `DELIVERY-NOTES.md`, completed Evaluation Runs, approved Gate Decisions, and retained release evidence.

## 3. Development Gate controls

| ID | Control | Required evidence | Accountable role | Current status |
|---|---|---|---|---|
| DG-001 | Architecture baseline | Signed Architecture Approval Record | Architecture Owner and Governance Approver | Pending Sign-off |
| DG-002 | Named accountability | Business, Capability, Domain SME, Implementation, Asset, and Governance owners | Business Owner | Pending Assignment |
| DG-003 | MVP scope | Signed confirmation of read-only Security Review scope | Business Owner and Domain SME | Pending Sign-off |
| DG-004 | Canonical model | Reviewed workbook with semantic validation marker | Architecture Owner and Dataverse Lead | Ready for Review |
| DG-005 | Agent validation | Approved Agent Skill Validation Architecture | Capability Owner and Implementation Owner | Ready for Review |
| DG-006 | Data authority | Approved classifications, repositories, retention, and telemetry authorities | Security and Data Owners | Pending Assignment |
| DG-007 | Runbook authority | Confirmed RG and APP Runbook records | Domain SME | Pending Customer Input |
| DG-008 | Evaluation readiness | Versioned test set, labels, metrics, and thresholds | Domain SME and Governance Approver | Pending Baseline |

## 4. Decision rule

The Development Gate becomes `Approved` only when DG-001 through DG-008 are Approved, with approver, decision date, evidence reference, and conditions recorded. `Ready for Review` is not approval. Expired conditional approvals revert the affected control to Pending.

Until then, only Foundation development is authorized. TEST integration, Pilot, Production, release approval, and customer-data processing remain blocked.

## 5. Review procedure

1. The control owner attaches or references the required evidence.
2. The Governance Approver records Approved, Conditionally Approved, Rejected, or Requires Remediation.
3. Conditional approval records a condition owner and expiry date.
4. Any changed canonical object, contract, identity boundary, evidence boundary, storage authority, or write behavior triggers Architecture Change Review.
5. The gate status and effective date are updated only after all controls pass the decision rule.
