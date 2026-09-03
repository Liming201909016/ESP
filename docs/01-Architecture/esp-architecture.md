# Enterprise Skill Platform Architecture

**Version:** V1.0  
**Status:** Freeze Candidate

## 1. Position

ESP is the enterprise control plane for reusable capability assets and their governed delivery. ESP enhances existing Agent runtimes and business systems rather than rebuilding conversation, orchestration, knowledge retrieval, identity, DLP, or authorization engines.

## 2. Four architecture views

### Business demand
Business Objective, Use Case, Capability Assessment, capability requirement, Consumer, and value decision.

### ESP control plane
Catalogs Logical Skills and governed assets; registers implementations; manages dependencies, evaluations, approvals, packages, releases, deployments, bindings, evidence indexes, and value references.

### Technical realization
Dataverse, Model-driven Power Apps, Power Automate, Copilot Studio, SharePoint/repository, Power Platform Solutions and Pipelines, telemetry platform, Fabric, and Power BI.

### Runtime interaction
A Consumer uses a configured Consumer Binding to an approved Deployment. Runtime accesses snapshotted dependencies, enforces identity and policy, records correlation and evidence references, and invokes human oversight when required.

## 3. Domains

- Demand and Consumption
- Capability Assets
- Implementation and Delivery
- Quality and Governance
- Evidence and Value

## 3.1 Hackathon runtime slice

The runnable Hackathon profile selects a vertical slice across these domains rather than implementing every enterprise object:

```text
Copilot Entry
→ Skill Router
→ Consumer Binding
→ Logical Skill Version
→ Implementation Version
→ Plugin Version(s)
→ Invocation Trace
→ Evidence Items
→ Human Disposition
→ Evaluation Result
```

Demo Mode may persist this slice in local structured storage. Connected Mode may map it to selected Dataverse objects. Codes, contracts, and trace semantics remain compatible with the enterprise model.

## 4. Core chain

```text
Use Case
→ Logical Skill Version
→ Implementation Version
→ Package Version
→ Dependency Snapshot
→ Release Record
→ Deployment
→ Consumer Binding
→ Invocation Index
→ Evidence Package
→ Operational Evidence
```

## 5. Key decisions

Logical Skill is product-independent. Implementation Version is runtime-specific. MVP bindings are resolved at deployment/configuration time, not per invocation. Dependencies default to Version Pinned. Evidence distinguishes facts, rule results, tool results, model suggestions, and human decisions. Write/execute capabilities require separate contracts and controls.

A Plugin is a bounded runtime tool adapter used by one or more Skill implementations. Skill and Plugin are separate, versioned concepts with a many-to-many relationship through implementation dependencies. The Router invokes only Plugin Versions pinned by the active binding or package snapshot.

## 6. Boundaries

ESP does not store secrets, copy all raw telemetry, become an identity proxy, replace business authority, or promise unsupported cross-tenant dynamic reuse.
