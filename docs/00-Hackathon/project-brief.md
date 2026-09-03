# Microsoft Global Hackathon 2026 Project Brief

**Project:** Enterprise Skill Platform (ESP)  
**Delivery profile:** Hackathon MVP  
**Status:** Build Candidate

**Code location:** https://github.com/Liming201909016/ESP

## Title

Enterprise Skill Platform (ESP)

## Tagline

Build governed, reusable AI skills once and safely plug them into any enterprise Copilot.

## Problem

Enterprise Agents repeatedly embed prompts, knowledge, tools, templates, and workflows inside individual solutions. The resulting capabilities are difficult to reuse, version, evaluate, trace, or retire. Teams copy behavior between Agents, and evidence, permissions, and human accountability become inconsistent.

## Solution

ESP separates a stable business capability, called a Logical Skill, from the runtime-specific implementation and Plugins that perform work. One Copilot entry point routes a user request through versioned Skills and reusable Plugins, validates contracts, preserves source evidence, and pauses for human review when required.

The Hackathon scenario is an evidence-grounded Security Review Copilot. It accepts a synthetic review package, extracts sourced facts, applies an approved Runbook, proposes findings and risk, and produces a draft report. Missing or inaccessible evidence returns `NeedsInformation` or `CannotAssess`; the Copilot never grants final approval.

## What is innovative

- one Copilot can compose multiple independently governed Skills;
- Skills remain stable while Plugins and runtime implementations can change;
- Plugins can be reused by more than one Skill without copying assets;
- every material factual claim links to evidence;
- evaluation, version pinning, and human oversight are part of delivery rather than afterthoughts;
- the same contract supports a local Demo Mode and a connected Microsoft Power Platform mode.

## Hackathon deliverable

```text
1 Copilot entry
→ Skill Router
→ 5 registered Skills
→ 4 reusable Plugins
→ Evidence and Evaluation
→ Human review
```

The project is considered runnable when a reviewer can start Demo Mode with one command, submit the included synthetic RG or APP package, observe the Skill and Plugin execution trace, inspect citations, complete the analyst disposition, and receive a draft report plus Evaluation Run result.

## Users

- security analysts reviewing resource-group and application-registration requests;
- enterprise Agent builders who need reusable capability contracts;
- capability owners and governance reviewers who need traceability and controlled promotion.

## Impact

ESP reduces duplicated Agent logic, makes capability reuse measurable, and improves confidence in AI-assisted decisions without removing human accountability. The Security Review scenario demonstrates the pattern; the platform can later support architecture review, compliance, procurement, operations, and other enterprise workflows.

## Suggested keywords

`Copilot Studio`, `AI Agents`, `Power Platform`, `Reusable Skills`, `Plugins`, `Responsible AI`, `Security Review`, `Evidence`, `Governance`

## Submission fields requiring organizer input

The Executive Challenge and optional Topic Challenges must be selected from the Innovation Studio choices. The project team should choose the closest available challenge related to AI transformation, Agentic AI, developer productivity, security, or responsible AI; this package does not invent a challenge name that is not present in the form.
