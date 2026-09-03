# ESP Architecture Baseline V1.0

**Status:** Freeze Candidate  
**Baseline date:** 2026-09-03

## Scope

This baseline consists of Architecture, Data Design, Solution Design, Governance, Asset Standards, Reference Models, and Security Review MVP companion specifications.

## Frozen decisions

- ESP is a capability control and delivery-governance plane.
- Logical Skill and Implementation are separate.
- Reusable assets use stable identity plus immutable versions.
- Prompt Asset is a first-class governed asset.
- MVP dependencies are version pinned and snapshotted.
- Deployment and Consumer Binding govern runtime use.
- Existing Agent runtimes host Skill capability validation through governed packaging, deployment, binding, evaluation, and rollback.
- Evidence and human accountability are mandatory for material conclusions.
- Value decisions remain business-owned.

## Change control

The following require Architecture Change Review: new canonical object, changed object responsibility, changed relationship/cardinality, new Solution dependency, breaking contract, changed identity or policy boundary, new write/execute behavior, changed evidence boundary, or changed storage authority.

## Change classes

- P0: correctness, security, or implementation blocker.
- P1: material cross-document or governance change.
- P2: planned extension without current baseline impact.

## Approval record

`architecture-approval-record.md` documents named owners, approvers, decisions, conditions, evidence, and effective date. `development-readiness-gate.md` defines which work is permitted at each gate. Until both records are effective, the package remains Freeze Candidate and only Foundation development is authorized.

## Terminology Standard

The canonical object name is `Business Objective`.

Deprecated aliases:

- `BusinessObjective`
- `Business Objective Reference`

All V1.0 documents, Dataverse tables, integrations, reports, and future APIs must use `Business Objective`. The Dataverse logical table name is `esp_businessobjective`.
