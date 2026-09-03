# ESP Logical Skill Contract Standard

**Version:** V1.0  
**Status:** Freeze Candidate

## 1. Purpose

Define the product-independent contract required before a Logical Skill Version can be implemented, packaged, bound to an Agent, or evaluated. The machine-readable MVP envelope is `schemas/logical-skill-contract.schema.json`.

## 2. Required contract metadata

Every contract records immutable Skill code, SemVer, owner, purpose, supported Use Cases, input and output schema references, standard outcomes, error schema, evidence obligations, human-oversight rule, classification limits, compatibility policy, performance and reliability targets, limitations, and approval evidence.

Contract changes follow SemVer:

- patch: clarification or compatible constraint correction with no consumer change;
- minor: backward-compatible optional input or output capability;
- major: required-field, semantic, outcome, evidence, or authorization change that can break a Consumer.

## 3. Invocation envelope

Requests include message type, contract version, Correlation ID, Use Case code, Consumer Binding code, Skill code, classification, typed payload, and authorized source references. Responses echo correlation and Skill identity, pin Logical Skill and Implementation versions, and include outcome, typed payload, Evidence Items, oversight state, and standard errors.

Allowed outcomes are `Success`, `NeedsInformation`, `CannotAssess`, `HumanHandoff`, `RejectedByPolicy`, and `Failed`. Empty evidence cannot accompany a material factual claim. `CannotAssess` and `NeedsInformation` are valid governed outcomes, not implementation failures.

## 4. MVP Skill payloads

| Skill | Required request payload | Required successful response payload |
|---|---|---|
| LS-SEC-DOC-INTAKE | project description, authorized documents | normalized context, request types, completeness, source inventory, data gaps |
| LS-SEC-EVIDENCE-EXTRACT | normalized context, source inventory | sourced facts, conflicts, data gaps |
| LS-SEC-REVIEW | normalized context, Evidence Items, approved Runbook reference | findings, questions, required actions, Cannot Assess items |
| LS-SEC-RISK-RATING | findings, approved Method reference | proposed rating, rationale, supporting evidence, required human confirmation |
| LS-SEC-REPORT-GEN | analyst dispositions, approved Template reference | report artifact reference, Draft/Final status, preserved citations |

## 5. Agent implementation mapping

The runtime-specific Implementation Version maps Agent action, topic, connector, or flow inputs and outputs to this contract without changing its semantics. Mapping evidence includes component reference, schema validation result, identity and policy requirements, timeout and retry behavior, idempotency where relevant, and error translation.

The Consumer Binding pins the contract and implementation versions. An incompatible mapping blocks activation. The Agent must not infer required missing fields, bypass inaccessible sources, silently select another version, or convert model suggestions into facts.

## 6. Approval criteria

A Logical Skill Version cannot become Approved until its JSON Schema is valid, positive and negative examples pass validation, all required evidence and oversight behavior is testable, compatibility impact is reviewed, and Capability Owner and Domain SME approvals are recorded.
