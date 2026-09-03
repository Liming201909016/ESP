# Enterprise Skill Platform Technical Architecture

**Version:** V1.0  
**Status:** Freeze Candidate

## 1. Purpose

Map canonical ESP responsibilities to implementable Microsoft platform components without turning product components into canonical business objects.

## 2. Product mapping

| Responsibility | Primary technology |
|---|---|
| Catalog, relationships, lifecycle, approvals, evidence index | Dataverse |
| Governance and review UX | Model-driven Power App |
| Deterministic workflows and approval integration | Power Automate |
| Agent interaction and orchestration | Copilot Studio |
| Documents, Runbooks, prompt/template/method artifacts | SharePoint or approved repository |
| Source and solution version control | Git/Azure DevOps or approved repository |
| Detailed traces | Application Insights/Log Analytics or approved telemetry store |
| Semantic analytics | Fabric |
| Reporting | Power BI |
| ALM | Power Platform Solutions, Pipelines, environment variables, connection references |

## 3. Solution boundaries

ESPCore owns canonical metadata. ESPGovernance owns evaluation, approval and delivery governance. ESPEvidence owns traceability facts. ESPSharedAssets owns governed artifacts. ESPSharedRuntime owns reusable connectors and flows. ESPSecurityReviewMVP owns scenario components. ESPReporting owns semantic reporting. ALM assets remain outside business-solution dependencies.

These seven boundaries are the enterprise target topology. They are already represented as separate source projects, but a full tenant deployment is not a Hackathon prerequisite.

### Hackathon deployment units

The runnable MVP uses two logical deployment units:

- `ESPMVPCore`: Skill/Plugin registry, Router, Binding, invocation trace, evidence, and evaluation adapters;
- `ESPMVPExperience`: Copilot-style UI, Security Review workflow, analyst disposition, and report experience.

Demo Mode may implement both units in one local application while preserving their module boundary. Connected Mode maps the experience to Copilot Studio and the runtime adapters to Power Automate/Dataverse components. The two logical units do not replace or rename the seven enterprise Solutions.

## 4. Storage boundaries

Dataverse stores metadata, relationships, statuses, keys, approvals, hashes, bindings, evidence indexes, and periodic measures. Full prompt bodies, source documents, generated report files, binaries, raw traces, and secrets remain in approved external stores.

In Hackathon Demo Mode, local structured files or an embedded database may store synthetic registrations, traces, and evidence. No customer content or secret is permitted. The local schema must retain enterprise-compatible codes and exportable records.

## 5. Identity and trust

Identity Profiles describe User Delegated, Agent, Application, or Connection identities. Actual authentication and authorization remain distributed across Entra, Copilot Studio, connectors, flows, DLP, and business systems. ESP stores requirements, bindings, and evidence, not credentials.

## 6. ALM

Use separate development, test, and production environments. Development uses unmanaged authoring solutions; downstream environments use managed solutions. Each release captures artifact hash, dependency snapshot, environment configuration reference, approvals, deployment results, post-deployment checks, and rollback target.

Hackathon Demo Mode additionally requires a one-command local startup, deterministic seed data, automated contract/evaluation checks, and a recorded fallback demonstration. Connected Mode follows the Power Platform ALM rules above.

## 7. Nonfunctional design

Required qualities include traceability, least privilege, recoverability, accessibility, data minimization, contract validation, correlation, supportability, and cost observability. Reliability and performance targets are approved per Use Case rather than assumed globally.
