# Copilot Studio Skill Mapping

**Version:** V1.0  
**Status:** Connected Mode Foundation Baseline; formal Runtime Owner sign-off pending

## Runtime pattern

The Security Review MVP uses a Copilot Studio Agent as the primary Consumer. Each Logical Skill is exposed as an Agent Action backed by a solution-aware Power Automate flow. The flow validates the product-independent contract, resolves only the version-pinned dependencies in the active Consumer Binding, invokes the implementation, records correlation and evidence references, and returns the governed response contract.

This document defines optional Hackathon Connected Mode and the enterprise Power Platform realization. The mandatory Hackathon Demo Mode uses the local Router and Plugin contracts in `00-Hackathon/mvp-delivery-profile.md`; it does not depend on Copilot Studio, Power Automate, Dataverse, or tenant connectivity.

The Router's internal request and response envelopes conform to `logical-skill-contract.schema.json`. Copilot-facing tools expose typed, minimal business inputs and structured outputs; the flow or Router assembles the full envelope after entry validation. Source documents and report binaries are passed by approved references, not embedded in Agent variables, flow definitions, Dataverse, or source control.

The end-to-end Security Review uses an explicit topic or orchestrating Agent flow to enforce the five mandatory Skill stages. Generative orchestration may select the top-level review capability, but it must not independently reorder, omit, or replace mandatory stages. Critical evidence, risk, and report outputs use specific structured responses or Adaptive Cards so generative response writing cannot alter citations, authority, or Draft status.

## MVP mappings

| Logical Skill | Agent Action | Flow | Oversight | Business-system writes |
|---|---|---|---|---|
| LS-SEC-DOC-INTAKE | esp_document_intake | ESP - Document Intake - v1 | Required review | Prohibited |
| LS-SEC-EVIDENCE-EXTRACT | esp_evidence_extract | ESP - Evidence Extraction - v1 | Required review | Prohibited |
| LS-SEC-REVIEW | esp_security_review | ESP - Security Review - v1 | Required review | Prohibited |
| LS-SEC-RISK-RATING | esp_risk_rating | ESP - Risk Rating - v1 | Explicit analyst approval | Prohibited |
| LS-SEC-REPORT-GEN | esp_report_generation | ESP - Report Generation - v1 | Required review | Prohibited |

The machine-readable mapping is `config/agent-skill-mapping.json`.

## Action sequence

1. The Agent creates a Correlation ID and reads its configured Consumer Binding.
2. The Agent constructs the request envelope without secret values or document bodies.
3. The action flow validates the request schema, Binding status, versions, classification, identity, policy, and dependency snapshot.
4. The flow invokes the pinned Implementation Version and validates the response schema.
5. The flow writes the minimum Invocation Index and Evidence Package references.
6. The Agent presents the result for the required analyst review or approval.

## Failure mapping

| Runtime condition | Contract outcome | Agent behavior |
|---|---|---|
| Missing mandatory material | NeedsInformation | Ask for the missing authorized input |
| Unreadable or insufficient evidence | CannotAssess | Preserve scope and route to analyst |
| Authorization or DLP denial | RejectedByPolicy | Do not bypass; display controlled handoff |
| Dependency timeout or transient failure | Failed | Apply only the Binding retry policy, then hand off or stop |
| Analyst confirmation required | HumanHandoff | Pause before final rating or disposition |

Retries, timeout duration, and maximum payload/reference counts are stored in the Runtime Profile and approved per Use Case. They are not hardcoded in Agent topics or flows.

## Identity and data controls

The selected Identity Binding determines User Delegated, Agent, Application, or Connection identity. The action never elevates permissions or changes identity after denial. Dataverse stores contract and traceability metadata only. Detailed prompts, responses, source content, and traces remain in approved external systems under their classification and retention policies.

## Review decisions required

The requester confirmed Power Automate Agent Actions as the Foundation exposure mechanism on 2026-09-03. The named Runtime Owner must still approve flow ownership and support, select Identity Bindings, and approve Runtime Profile limits before TEST integration. Any switch to a connector or custom runtime updates the Implementation mapping but does not change the Logical Skill contract.
