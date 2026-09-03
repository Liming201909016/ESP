# Enterprise Skill Platform Business Architecture

**Version:** V1.0  
**Status:** Freeze Candidate

## 1. Purpose

Define why capabilities enter ESP, who owns them, how reuse decisions are made, and how operational evidence informs business value decisions.

## 2. Business chain

```text
Business Objective
→ Use Case
→ Capability Assessment
→ Use Case Skill Requirement
→ Consumer
→ Outcome Metrics
→ Operational Evidence
→ Value Assessment Reference
```

## 3. Objects

### Business Objective
Records an authoritative external objective, owner, baseline, value metrics, constraints, and review period. ESP does not replace the business planning system.

### Use Case
Defines actor, current process, trigger, expected outcome, risk, data classification, candidate Consumers, and reuse hypothesis. A Use Case is not an Agent.

### Capability Assessment
Compares existing Logical Skills and implementations, records fit gaps, and decides Reuse, Extend Compatibly, Build, or Reject.

### Use Case Skill Requirement
Links a Use Case to a required Logical Skill Version, acceptance criteria, priority, evidence requirements, and oversight level.

### Value Assessment Reference
Links Operational Evidence to the authoritative business-owned decision. ESP does not own the final scale, maintain, reduce, or retire decision.

## 4. Accountabilities

- Business Owner: objective, scope, baseline, and value decision.
- Capability Owner: Logical Skill lifecycle and reuse.
- Domain SME: rules, expert truth, knowledge, and labelled samples.
- Implementation Owner: runtime realization and support.
- Asset Owner: Knowledge, Prompt, Template, Method, Tool, or Workflow asset.
- Governance Approver: gate and exception decisions.

## 5. Admission rules

No capability enters Pilot or Production without an approved Use Case, owner, stable contract, risk tier, human-oversight rule, implementation, evaluation evidence, release record, Deployment, and Consumer Binding.

## 6. Value discipline

Measure a comparable baseline before claiming improvement. Separate efficiency, quality, risk, reuse, adoption, maintainability, collaboration, and operating cost. Invocation count alone is not value.
