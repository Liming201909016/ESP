# Security Review MVP Use Cases

**Version:** V1.0

## UC-SR-001 Submit review package

Actor: security analyst. Input: project description and authorized documents. Outcome: normalized context, request classification, material completeness, and source inventory.

## UC-SR-002 Extract evidence

Extract systems, resources, identities, data/network flows, integrations, permissions, changes, conflicts, and data gaps. Every fact carries a source.

## UC-SR-003 Produce draft findings

Apply the approved customer Runbook first, then approved Microsoft and industry guidance as advisory sources. Produce findings, questions, required actions, and Cannot Assess items.

## UC-SR-004 Propose risk rating

Apply approved method to propose Blocker, High, Medium, Low, Info, or Unrated. Human confirms final severity.

## UC-SR-005 Generate report

Render approved findings and analyst dispositions using the approved report template. Draft does not equal approval of the underlying architecture or change.

## UC-SR-006 Analyst disposition

Analyst accepts, modifies, rejects, escalates, or marks Cannot Assess. Every change becomes Human Decision evidence.

## UC-SR-007 Reuse capability

A separate Architecture Review Workflow registers as another Consumer and binds to the same approved Document Intake or Evidence Extraction Logical Skill Version without copying assets.
