# ESP Solution Dependency Matrix

**Version:** V1.0  
**Status:** Foundation Baseline

## Principles

- Solution dependencies are directed and acyclic.
- DEV uses unmanaged authoring Solutions; TEST and PROD receive managed Solutions.
- ALM tooling, pipelines, authentication profiles, and deployment settings remain outside business-Solution dependencies.
- Connection References and environment variables are supplied at deployment; secret values are never stored in source control or Dataverse.
- A dependency is added only when a component contains an actual reference to a component in another Solution.

## Dependency matrix

| Solution | Depends on | Owned scope |
|---|---|---|
| ESPCore | None | Demand, capability contracts, Consumers, Implementations, Runtime Profiles |
| ESPSharedAssets | None | Knowledge, Prompt, Template, Method, Tool Contract, Workflow, External Reference |
| ESPSharedRuntime | ESPCore, ESPSharedAssets | Reusable connectors, flows, actions, and contract mappings |
| ESPGovernance | ESPCore, ESPSharedAssets | Dependencies, evaluation, packages, snapshots, releases, deployments, bindings, identity and policy governance |
| ESPEvidence | ESPCore, ESPGovernance | Invocation, evidence, operational measures, and value references |
| ESPSecurityReviewMVP | ESPCore, ESPSharedAssets, ESPSharedRuntime, ESPGovernance, ESPEvidence | Security Review Agent and scenario components |
| ESPReporting | ESPCore, ESPEvidence | Semantic reporting and reporting integration metadata |

The Dataverse workbook `Solution Dependencies` sheet is generated from physical Lookup relationships. It currently contains Governance-to-Core/SharedAssets and Evidence-to-Core/Governance dependencies. The manifest also records component-level dependencies required by runtime and scenario components.

## Initialization and import order

1. ESPCore and ESPSharedAssets.
2. ESPSharedRuntime and ESPGovernance.
3. ESPEvidence.
4. ESPSecurityReviewMVP and ESPReporting.

Items in the same step may be processed independently only when the exported package reports no additional dependency. Deployment validation must inspect missing dependencies before promotion.

## Change rule

Any new cross-Solution Lookup or component reference requires regeneration of the workbook, validation of `config/solution-manifest.json`, missing-dependency inspection, and Architecture Change Review when it changes an approved ownership boundary. Circular dependencies block packaging and release.
