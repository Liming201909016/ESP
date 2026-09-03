# ESP Agent Skill Validation Architecture

**Version:** V1.0  
**Status:** Freeze Candidate

## 1. Purpose

Define how an approved Logical Skill Version is packaged, deployed, bound to an existing Agent runtime, invoked, evaluated, promoted, upgraded, and rolled back. ESP does not implement the Agent runtime; it governs and validates Skill use in that runtime.

## 2. Validation host

The Security Review MVP uses a Copilot Studio Agent as the primary validation Consumer. A separate Architecture Review Agent or Workflow is the secondary Consumer used to prove governed reuse. Each Consumer has its own Consumer Binding to the same approved Deployment; shared assets are referenced, not copied.

For Microsoft Global Hackathon 2026, the mandatory validation host is the local Copilot-style Demo Mode defined in `00-Hackathon/mvp-delivery-profile.md`. It uses the same contracts, bindings, version pins, evidence, and evaluation semantics. Copilot Studio is the optional Connected Mode validation host and remains required for the later enterprise Pilot path.

## 3. Skill package

Each testable Skill release contains or references:

- Logical Skill Version and its product-independent contract;
- runtime-specific Implementation Version;
- Power Platform Solution component references;
- version-pinned Prompt, Knowledge, Template, Method, Tool Contract, and Workflow Definition dependencies;
- environment-variable and connection-reference requirements without secret values;
- input, output, error, evidence, and telemetry schemas;
- Dependency Snapshot, artifact hashes, release notes, and rollback target.

For Copilot Studio, an Implementation may be exposed through an Agent action, topic, connector, or governed Power Automate flow. The selected mechanism is recorded in the Runtime Profile and does not change the Logical Skill contract.

## 4. Binding and configuration

A Consumer Binding identifies exactly one Consumer, Deployment, Logical Skill Version, and Implementation Version. It records environment, runtime configuration reference, identity and policy bindings, effective period, fallback behavior, classification, retention policy, and status.

Bindings are resolved during deployment or configuration. An invocation never selects `Latest`. Activation requires a succeeded Deployment, approved versions, resolved mandatory dependencies, valid hashes, active identity and policy bindings, and a completed post-deployment smoke test.

## 5. Invocation contract

Every Skill contract defines:

- input schema, required fields, size limits, classification, and validation rules;
- output schema, evidence requirements, confidence semantics, and human-oversight state;
- standard errors for invalid input, missing evidence, dependency failure, policy denial, timeout, and internal failure;
- supported outcomes: Success, Needs Information, Cannot Assess, Human Handoff, Rejected by Policy, and Failed;
- compatibility policy and SemVer rules.

Every invocation records Correlation ID, Consumer Binding, Deployment, Logical Skill Version, Implementation Version, Use Case, timestamps, outcome, error category, telemetry reference, Evidence Package reference, and evaluated test-case reference where applicable.

## 6. Validation sequence

```text
Approved Logical Skill Version
→ Validated Implementation Version
→ Package Version and Dependency Snapshot
→ TEST Release and Deployment
→ Consumer Binding activation
→ Copilot Studio Agent invocation
→ Contract and policy assertions
→ Evidence and telemetry capture
→ Evaluation Run
→ SME review and Gate Decision
```

Validation includes contract, happy-path, missing-input, inaccessible-source, grounding, source-conflict, prompt-injection, secret-exposure, regression, report-rendering, failure-path, and second-Consumer reuse tests.

## 7. Evaluation and promotion

An Evaluation Run pins the test-set version, target Logical Skill Version, Implementation Version, Deployment, Consumer Binding, dependency snapshot, evaluator versions, and thresholds. It stores per-case assertions and aggregate measures.

Promotion is blocked when a mandatory test fails, a material claim lacks evidence, a permission is bypassed, a secret is distributed, a required Runbook is unresolved, or a required threshold is not met. A Governance Approver records Approved, Conditionally Approved, Rejected, or Requires Remediation. Conditional approval includes an owner, condition, and expiry date.

## 8. Upgrade and rollback

A new Skill or Implementation Version requires a new Package Version, Dependency Snapshot, Evaluation Run, Release Record, and Deployment. Consumers do not silently inherit it. Upgrade occurs by activating a reviewed Consumer Binding change after compatibility and regression checks.

Rollback points the Consumer to the last approved succeeded Deployment through a controlled binding change. The failed binding, invocation evidence, and deployment records remain retained for audit.

## 9. MVP completion criteria

The Agent validation requirement is complete when:

- the primary Security Review Agent passes all mandatory approved tests;
- every material result is traceable to evidence and analyst disposition;
- the secondary Consumer invokes the same approved Document Intake or Evidence Extraction Logical Skill Version through a distinct binding;
- no shared governed asset is privately copied;
- evaluation evidence, Gate Decision, rollback test, and post-deployment checks are retained.

### Hackathon completion interpretation

For the local Hackathon MVP, a Foundation Evaluation Result replaces the enterprise Gate Decision, and a local package/health check replaces deployment and rollback evidence. The result must explicitly set Pilot eligibility to false. Enterprise completion criteria above remain unchanged for Connected TEST, Pilot, and Production.
