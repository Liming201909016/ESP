# ESP Plugin Contract Standard

**Version:** V0.1  
**Applies to:** Hackathon Demo Mode and Connected Mode

## 1. Purpose

Define the runtime-neutral contract for bounded tools used by Skill implementations. A Plugin performs an operation; a Skill expresses a business capability. They are separate, versioned objects and have a many-to-many relationship.

## 2. Required metadata

Every Plugin Version declares:

- stable Plugin code and SemVer;
- display name, purpose, owner, and implementation type;
- input, output, and error schema references;
- required identity and least-privilege permissions;
- supported classifications and data residency constraints;
- timeout, retry, idempotency, and fallback behavior;
- evidence mapping and telemetry fields;
- health-check behavior and limitations;
- mock/connected mode and approval status;
- artifact reference and SHA-256 hash.

## 3. Invocation envelope

A Plugin request carries Correlation ID, Invocation ID, calling Skill code/version, Plugin code/version, classification, typed payload, and authorized source references. A response echoes these identifiers and returns outcome, typed payload, Evidence Items or references, duration, retry state, and standard errors.

Plugins never receive a mutable `Latest` selector. The Skill Router resolves the pinned Plugin Version before invocation.

## 4. Standard outcomes

- `Success`: operation completed and output contract is valid;
- `NeedsInformation`: required caller input is missing;
- `CannotAssess`: authorized evidence is insufficient or unreadable;
- `RejectedByPolicy`: identity, authorization, DLP, or classification denied execution;
- `Failed`: bounded dependency or implementation failure.

A Plugin cannot convert policy denial into missing data, silently downgrade authority, or return an unsupported material claim as a Fact.

## 5. Hackathon Plugins

| Plugin code | Input | Output | Required evidence behavior |
|---|---|---|---|
| PLG-DOC-SOURCE | authorized synthetic document reference | normalized readable content and source metadata | preserve source ID, version, hash, and classification |
| PLG-RUNBOOK | Runbook code and pinned version | authority, controls, and artifact reference | preserve Runbook code, version, hash, and authority level |
| PLG-EVIDENCE | invocation/evidence record | retained reference and query result | distinguish Fact, RuleResult, ToolResult, ModelSuggestion, HumanDecision |
| PLG-REPORT | approved structured report payload and template version | draft report artifact reference | preserve citations, template version, and Draft status |

## 6. Demo and Connected implementations

Demo Mode implementations are deterministic local adapters over included synthetic assets. They must be visibly labelled `Mock` or `Demo`, perform no network access, and use the same contract expected of Connected implementations.

Connected Mode implementations may use Power Automate, approved connectors, APIs, repositories, and Dataverse. They require Identity and Policy Bindings and remain blocked until their environment gate is approved.

## 7. Compatibility

Patch and minor changes must remain backward compatible with calling Skill implementations. A breaking input, output, error, permission, evidence, or authority change requires a major Plugin Version and new dependency snapshot. Existing Consumer Bindings do not silently follow it.

## 8. Validation

Plugin validation includes positive contract tests, missing input, timeout, inaccessible source, policy denial, malformed output, evidence omission, prompt injection in untrusted content, and health-check failure. Mock and Connected implementations must pass the same behavior assertions where the operation is equivalent.
