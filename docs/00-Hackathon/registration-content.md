# Microsoft Global Hackathon 2026 Registration Content

## Title

Enterprise Skill Platform (ESP): From Agents to Capabilities

## Tagline

Build trusted enterprise Skills once, govern them as products, and compose them into any Copilot.

## Executive Challenge

Select the available Executive Challenge most closely aligned with **Agentic AI, AI transformation, or secure and responsible enterprise AI**.

Do not invent a challenge name. Use this selection order against the choices shown in Innovation Studio:

1. Agentic AI or Copilot extensibility.
2. AI transformation or productivity.
3. Security, trust, or Responsible AI.
4. Developer platform or reusable engineering capabilities.

## Topic Challenges

Select up to five available topics in this order when equivalent choices exist:

1. AI Agents / Copilot.
2. Responsible AI / Trustworthy AI.
3. Security.
4. Developer Productivity / Platform Engineering.
5. Low Code / Power Platform.

## Code Location

https://github.com/Liming201909016/ESP

Repository visibility: Public  
Expected default branch: `main`

The public repository contains a runnable local vertical slice plus the validated architecture, Skill contracts, synthetic demo assets, evaluation tooling, and Power Platform Solution foundations. Final submission still requires a clean-clone setup, startup, and evaluation check.

## Description

### Executive summary

Enterprise Skill Platform (ESP) moves enterprise AI from agent-centric to capability-centric architecture. Instead of rebuilding prompts, tools, integrations, evidence rules, and evaluations inside every Agent, organizations define trusted business capabilities as governed, versioned Skills that can be composed into any Copilot.

Our Hackathon MVP proves this model through an evidence-grounded Security Review Copilot:

```text
One Copilot
→ Five governed Skills
→ Four reusable Plugins
→ Evidence and evaluation
→ Human accountability
```

The result is not simply another Agent. It is a reusable delivery and governance pattern for making enterprise AI scalable, explainable, maintainable, and trustworthy.

### The problem

Enterprises are rapidly building Copilots and AI agents, but valuable capabilities are repeatedly embedded inside individual agents. Document intake, evidence extraction, policy analysis, risk rating, and report generation are often recreated as private combinations of prompts, knowledge, tools, templates, and workflows.

This creates a scaling problem. The capability cannot be independently owned, versioned, evaluated, reused, or retired. Teams copy prompts and integrations between agents. A tool update can silently change behavior. Evidence and permissions become inconsistent. Invocation count is mistaken for value, while the business cannot reliably answer: Which capability ran? Which implementation and sources did it use? Why should we trust the result? Who made the final decision?

### Our idea: Enterprise Skill Platform

Enterprise Skill Platform, or ESP, treats an enterprise capability as a governed, reusable product rather than code hidden inside one agent.

ESP shifts enterprise AI architecture from **agent-centric** to **capability-centric**. Instead of asking every Agent team to recreate and govern its own implementation, the enterprise establishes trusted capability products that any authorized experience can consume.

ESP separates three concepts:

- **Skill:** a stable, product-independent business capability with a versioned input/output/error contract, evidence obligations, limitations, and human-oversight rules;
- **Plugin:** a bounded, replaceable runtime adapter that reads a document, resolves a Runbook, records evidence, renders a report, or connects to another enterprise service;
- **Copilot:** the user entry point that composes Skills to complete a business scenario.

The relationship is deliberately flexible: one Copilot can use many Skills, one Skill can use multiple Plugins, and the same Plugin can support multiple Skills. Skills remain stable while implementations and Plugins evolve behind their contracts.

### What makes ESP different

Most Agent platforms focus on conversation, reasoning, orchestration, or tool access. ESP focuses on the enterprise lifecycle of the capability itself.

ESP combines five properties that are usually fragmented across individual Agent projects:

1. **Stable capability identity:** the Skill exists independently of a Copilot, model, Plugin, or runtime.
2. **Contract-first reuse:** explicit input, output, error, evidence, and human-oversight contracts protect Consumers from implementation change.
3. **Version-pinned delivery:** an invocation records the exact Skill, implementation, Plugin, dependency, and policy context instead of silently following `Latest`.
4. **Evidence-native execution:** facts, rule results, tool results, model suggestions, and human decisions remain distinguishable and traceable.
5. **Lifecycle and value governance:** capabilities can be assessed, evaluated, approved, released, reused, measured, deprecated, and retired as enterprise products.

This creates a portable governance layer above individual Agent runtimes without rebuilding the runtimes themselves.

### Hackathon MVP: evidence-grounded security review

We are proving the ESP pattern through a Security Review Copilot. A user submits an included synthetic resource-group or application-registration package. A deterministic Skill Router runs five version-pinned Skills:

1. Document Intake normalizes the request and identifies missing material.
2. Evidence Extraction produces sourced facts, conflicts, and data gaps.
3. Security Review applies a pinned Runbook and drafts findings.
4. Risk Rating proposes a severity for analyst confirmation.
5. Report Generation creates a cited draft report from analyst dispositions.

Four reusable Plugins provide document access, Runbook resolution, evidence storage, and report rendering. The main workflow is an explicit state machine, so generative orchestration cannot skip evidence checks, reorder mandatory stages, or bypass human review.

The MVP makes failure behavior a first-class experience:

- missing material returns `NeedsInformation`;
- unreadable or insufficient evidence returns `CannotAssess`;
- authorization denial returns `RejectedByPolicy` and is never bypassed;
- instructions embedded in source documents cannot override governance;
- a model proposal is clearly distinguished from a fact or human decision;
- the final risk rating requires analyst confirmation.

Every run carries a Correlation ID and records the Consumer Binding, Skill and Plugin versions, ordered execution trace, evidence references, outcomes, and analyst disposition. A second Consumer demonstrates that the same Skill can be reused without copying its assets.

### Why it matters

ESP changes the unit of enterprise AI reuse from "an entire agent" to "a governed business capability."

This enables organizations to:

- build once and reuse capabilities across Copilots, workflows, applications, and APIs;
- replace a Plugin or runtime implementation without breaking the Skill contract;
- test and promote capabilities independently using version-pinned datasets and thresholds;
- perform impact analysis before changing or retiring a shared capability;
- preserve evidence from source to model suggestion to human decision;
- enforce least privilege and explicit failure behavior;
- measure reuse, quality, adoption, maintainability, risk, and value separately;
- accelerate AI delivery without sacrificing accountability.

The Security Review scenario is the first proof point. The same architecture can support architecture review, compliance, procurement, operations, finance, and other evidence-sensitive enterprise workflows.

### Relationship to MCP and Agent platforms

ESP complements rather than replaces MCP, Copilot Studio, or other Agent platforms. MCP standardizes how an Agent accesses tools and resources. ESP addresses the enterprise layer above interoperability: how a business capability is identified, owned, contracted, versioned, evaluated, approved, released, evidenced, reused, and measured.

MCP can be one Plugin integration mechanism inside ESP, while Copilot Studio can be one runtime consumer. The distinction is concise:

```text
MCP: Agent → Tool or Resource
ESP: Copilot → Skill → Plugin → Evidence → Evaluation → Governance
```

This separation allows enterprises to adopt new Agent runtimes and integration standards without losing stable capability identity or governance history.

### Designed to run and designed to scale

The Hackathon deliverable has two modes:

- **Demo Mode:** a one-command local application using synthetic, non-sensitive data and visibly labelled local Plugins. It requires no tenant, secret, customer repository, or production connection.
- **Connected Mode:** an optional Microsoft Power Platform realization using Copilot Studio tools, Power Automate Agent flows, approved connectors, and selected Dataverse metadata.

Demo Mode ensures the project remains reproducible for reviewers even when cloud connectivity is unavailable. Connected Mode demonstrates how the same Skill and Plugin contracts can integrate with enterprise identity, DLP, ALM, telemetry, and governance.

The public project repository contains the canonical contracts, positive and negative fixtures, synthetic RG and APP cases, an evaluation runner, Power Platform Solution foundations, and architecture documentation. The local runnable vertical slice is the current Hackathon implementation focus. We explicitly do not claim customer validation, Pilot readiness, or production authorization from synthetic results.

### Measured progress

The project has executable validation rather than architecture slides alone:

- 15 valid and 10 invalid Skill contract fixtures pass automated validation;
- four versioned synthetic RG and APP scenarios cover happy path, missing input, and prompt injection;
- 36 of 36 mandatory Foundation evaluation assertions pass;
- the evaluator explicitly reports `pilotEligible=false` for synthetic data;
- seven Power Platform Solution foundations package successfully for the enterprise scale-out path;
- the local Node/Express/Ajv foundation has compiled the canonical JSON Schema and passed an HTTP runtime smoke test.
- 10 API integration tests and eight desktop/mobile browser journeys pass across all four scenarios.

The local browser experience, Skill Router, Plugin runtime, analyst workflow, report path, execution trace, and evaluator integration are runnable. Recorded fallback media and optional Connected Mode remain active Hackathon work.

### What the judges will see

In the final demonstration, a reviewer will:

1. submit a synthetic resource-group or application-registration package through one Copilot-style entry point;
2. watch five pinned Skills execute through four reusable Plugins;
3. inspect the evidence, Runbook authority, versions, policy outcomes, and ordered trace;
4. confirm or modify the proposed risk as the accountable analyst;
5. generate a cited draft report and view the automated evaluation result;
6. see a second Consumer reuse an existing Skill without copying its assets.

The local Demo Mode remains the required judging path, so the demonstration does not depend on tenant availability, customer data, or production credentials.

### Long-term vision

In the same way that APIs transformed software development, governed Skills can transform enterprise AI. Organizations should not repeatedly rebuild business intelligence, risk analysis, compliance validation, or evidence extraction inside every new Agent. These capabilities should exist as trusted enterprise products.

> Enterprises do not need thousands of disconnected AI agents. They need trusted, governed, reusable Skills that can be composed into any Copilot, workflow, application, or AI system.

ESP is the governance and delivery layer that makes enterprise AI scalable, explainable, reusable, and trustworthy.

## Keywords

Enterprise Skill Platform, ESP, Copilot Studio, AI Agents, Agentic AI, Reusable Skills, Plugins, Power Platform, Responsible AI, Security Review, Evidence Grounding, Human in the Loop, Governance, Versioning, Evaluation

## Short Description

ESP moves enterprise AI from agent-centric to capability-centric architecture. Our Security Review MVP composes five governed Skills and four reusable Plugins through one Copilot, producing evidence-grounded findings, human-confirmed risk, citations, and a complete trace.

## Submission Accuracy Notes

- Use present-progressive language for the runnable local application until Gate A passes.
- Do not claim customer validation, Pilot readiness, Production readiness, or approved quality thresholds.
- Label local Plugin implementations as Demo or Mock.
- Describe Copilot Studio and Dataverse as optional Connected Mode until a governed environment is available.
- Replace the challenge guidance above with the exact selected Innovation Studio challenge names before final submission.
- Before final submission, verify that `https://github.com/Liming201909016/ESP` contains the runnable source and that a clean clone passes setup, startup, and evaluation checks.
