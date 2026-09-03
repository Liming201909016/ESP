# ESP Data Authority Register

**Version:** V1.0  
**Status:** Pending Owner Approval

## Purpose

Record the authoritative system, accountable owner, permitted classification, retention authority, and access evidence for each ESP data category. References are stored in ESP; content remains in the approved system of record unless explicitly stated.

## Authority register

| Data category | Intended authority | ESP storage | Required owner | Classification | Retention authority | Current status |
|---|---|---|---|---|---|---|
| Business objectives and value decisions | Customer business planning system | Dataverse reference and status only | Business Owner | Pending | Customer business policy | Pending Owner Input |
| Security review source documents | Customer-approved SharePoint repository | Dataverse metadata and source reference only | Data Owner | Pending | Customer records policy | Pending Owner Input |
| RG and APP Runbooks | Customer-approved SharePoint or governed repository | Dataverse catalog metadata, version, and hash | Domain SME | Pending | Customer Runbook policy | Pending Customer Input |
| Prompt, Method, Template, and Workflow artifacts | Approved SharePoint or Git repository | Dataverse metadata, version, URI, and hash | Asset Owner | Pending | Asset governance policy | Pending Owner Input |
| Power Platform Solution source | Approved Git or Azure DevOps repository | Not copied to Dataverse | Implementation Owner | Internal | Source-control policy | Pending Repository Decision |
| ESP control-plane metadata | Dataverse | Canonical metadata and relationships | Platform Owner | Internal or Confidential | Dataverse retention policy | Pending Owner Approval |
| Detailed prompts, responses, and traces | Application Insights, Log Analytics, or approved telemetry store | Dataverse correlation and telemetry reference only | Telemetry Owner | Pending | Telemetry retention policy | Pending Owner Input |
| Evidence files and generated reports | Customer-approved SharePoint repository | Dataverse Evidence Package and artifact reference | Evidence Owner | Pending | Evidence retention policy | Pending Owner Input |
| Semantic measures | Fabric | Dataverse periodic measure reference where required | Analytics Owner | Pending | Analytics retention policy | Pending Owner Input |
| Reports and dashboards | Power BI and approved report repository | Dataverse report reference only | Reporting Owner | Pending | Reporting policy | Pending Owner Input |
| Identities and authorization | Entra ID, Copilot Studio, connectors, and business systems | Identity Profile and non-secret binding references | Identity Owner | Restricted metadata | Identity governance policy | Pending Owner Input |
| Secrets and credentials | Approved connection or secret-management service | Prohibited | Identity Owner | Secret | Secret-management policy | Storage Prohibited in ESP |

## Approval evidence

Each row must record a named owner, authoritative URI or system identifier, approved classification, retention policy reference, permitted environments, runtime identity access-test result, approver, decision date, and review date before its status becomes `Approved`.

DEV permits synthetic, non-sensitive data only. TEST and PROD remain blocked for a category until that row is Approved and its identity, DLP, retention, and repository controls are verified.

## Prohibited storage

Dataverse must not contain credentials, secret values, full source documents, full Prompt bodies, generated report binaries, or unrestricted raw telemetry. Configuration files in source control contain identifiers and references only; authentication material remains in the approved identity or connection service.