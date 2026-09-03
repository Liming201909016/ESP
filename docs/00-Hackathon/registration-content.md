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

The public repository contains the validated architecture, Skill contracts, synthetic demo assets, evaluation tooling, and Power Platform Solution foundations. The runnable local vertical slice is under active Hackathon development. Final submission requires a clean-clone setup, startup, and evaluation check.

## Description

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

In short:

```text
One Copilot
→ N governed Skills
→ N reusable Plugins
→ Evidence and evaluation
→ Human accountability
```

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

### Long-term vision

In the same way that APIs transformed software development, governed Skills can transform enterprise AI. Organizations should not repeatedly rebuild business intelligence, risk analysis, compliance validation, or evidence extraction inside every new Agent. These capabilities should exist as trusted enterprise products.

Our vision is simple:

> Enterprises do not need thousands of disconnected AI agents. They need trusted, governed, reusable Skills that can be composed into any Copilot, workflow, application, or AI system.

ESP is the governance and delivery layer that makes enterprise AI scalable, explainable, reusable, and trustworthy.

### Designed to run and designed to scale

The Hackathon deliverable has two modes:

- **Demo Mode:** a one-command local application using synthetic, non-sensitive data and visibly labelled local Plugins. It requires no tenant, secret, customer repository, or production connection.
- **Connected Mode:** an optional Microsoft Power Platform realization using Copilot Studio tools, Power Automate Agent flows, approved connectors, and selected Dataverse metadata.

Demo Mode ensures the project remains reproducible for reviewers even when cloud connectivity is unavailable. Connected Mode demonstrates how the same Skill and Plugin contracts can integrate with enterprise identity, DLP, ALM, telemetry, and governance.

The public project repository contains the canonical contracts, positive and negative fixtures, synthetic RG and APP cases, an evaluation runner, Power Platform Solution foundations, and architecture documentation. The local runnable vertical slice is the current Hackathon implementation focus. We explicitly do not claim customer validation, Pilot readiness, or production authorization from synthetic results.

### Success for the Hackathon

A reviewer should be able to start ESP locally, submit a synthetic review, watch the five Skills and four Plugins execute, inspect the evidence behind every material fact, make the required analyst decision, generate a cited draft report, and view the automated evaluation result.

The larger vision is simple: **build a trusted enterprise Skill once, plug it into any Copilot, and retain the evidence needed to understand, govern, and improve every outcome.**

## Keywords

Enterprise Skill Platform, ESP, Copilot Studio, AI Agents, Agentic AI, Reusable Skills, Plugins, Power Platform, Responsible AI, Security Review, Evidence Grounding, Human in the Loop, Governance, Versioning, Evaluation

## Short Description

ESP moves enterprise AI from agent-centric to capability-centric architecture. It turns reusable capabilities into governed, versioned Skills that any Copilot can compose. Our Security Review MVP demonstrates one Copilot, five Skills, and four reusable Plugins with evidence-grounded findings, human-confirmed risk, citations, and a complete execution trace.

## Submission Accuracy Notes

- Use present-progressive language for the runnable local application until Gate A passes.
- Do not claim customer validation, Pilot readiness, Production readiness, or approved quality thresholds.
- Label local Plugin implementations as Demo or Mock.
- Describe Copilot Studio and Dataverse as optional Connected Mode until a governed environment is available.
- Replace the challenge guidance above with the exact selected Innovation Studio challenge names before final submission.
- Before final submission, verify that `https://github.com/Liming201909016/ESP` contains the runnable source and that a clean clone passes setup, startup, and evaluation checks.
