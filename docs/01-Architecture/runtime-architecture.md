# Enterprise Skill Platform Runtime Architecture

**Version:** V1.0  
**Status:** Freeze Candidate

## 1. Principle

ESP configures and governs runtime use. The MVP does not query ESP on every invocation to select the latest implementation. A Consumer uses an already approved Consumer Binding and Deployment.

For the Hackathon profile, the same rule applies to the local Skill Router: registrations are loaded at startup or binding activation, and each invocation records the exact Skill, implementation, and Plugin versions. Demo Mode never performs network discovery of a latest version.

## 2. Normal sequence

```text
Request
→ Consumer identifies intended capability
→ Local/configured Consumer Binding
→ Approved Deployment and Implementation Version
→ Version-pinned Knowledge/Prompt/Template/Method/Tool dependencies
→ Standard output/error
→ Human oversight when required
→ Invocation Index and Evidence Package references
```

Hackathon Demo Mode realizes `Consumer` as the local Copilot experience, `Deployment` as the selected demo package, and runtime dependencies as registered Plugin Versions. Connected Mode maps the same sequence to Copilot Studio Agent Actions and Power Automate flows.

## 3. Runtime identifiers

Every invocation carries Correlation ID, Consumer Binding, Deployment, Implementation Version, Use Case, classification, outcome, error category, telemetry reference, retention policy, and Evidence Package reference when required.

## 4. Runtime paths

- Normal: execute, validate output, return, index evidence.
- Input error: reject or request clarification.
- Dependency error: retry according to policy, degrade, hand off, or stop.
- Authorization/policy denial: do not infer or bypass.
- Human oversight: pause for review, approval, or disposition.
- Write action: confirm/approve, revalidate permission, enforce idempotency, execute, compensate if defined, audit.

## 5. Evidence

Material claims link to Evidence Items. Missing or unreadable evidence yields Cannot Assess. Model suggestions are not facts. Human changes become Human Decision evidence.

## 6. Fallback

Fallback is explicit in Consumer Binding or Workflow Step. Runtime never silently follows Latest. Outcomes include Retry, Clarify, Degrade, Human Handoff, and Stop.

## 7. Privacy

Dataverse retains minimum traceability metadata. Detailed prompts, responses, source content, and traces remain in systems approved for their classification and retention.
