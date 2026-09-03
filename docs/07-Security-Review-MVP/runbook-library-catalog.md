# Security Review Runbook Library Catalog

**Version:** V1.0

## Purpose

Define metadata required to register authoritative Runbooks without copying their full content into Dataverse.

## Catalog fields

Runbook code, title, request type, authority level, owner, source reference, source version, artifact hash, classification, effective/review dates, freshness rule, applicable environments, mandatory material checklist, superseding Runbook, lifecycle, and approval.

## Initial categories

- RG: Azure resource-group request review.
- APP: application registration and permission review.
- FW: firewall-rule review, future MVP extension.
- CR: approved-resource change review, future extension.
- AR: resource configuration review, future extension.

Exact titles, versions, owners, and source links must be confirmed by the customer/Domain SME before seed creation. This document does not invent them.

## Initial authority register

| Runbook code | Request type | Exact title | Source version | Owner | Source reference | Classification | Status |
|---|---|---|---|---|---|---|---|
| RB-RG-CUSTOMER-001 | RG | Pending customer confirmation | Pending | Pending | Pending | Pending | Pending Customer Input |
| RB-APP-CUSTOMER-001 | APP | Pending customer confirmation | Pending | Pending | Pending | Pending | Pending Customer Input |

The codes above reserve stable catalog identities only. They do not assert that a Runbook exists or is approved. The Domain SME replaces pending values with authoritative metadata and attaches approval evidence before changing status.

## Admission checklist

A Runbook record can become `Approved` only when all of the following are present and verified:

- exact customer-approved title and request type;
- accountable owner and approval authority;
- immutable source version and accessible authorized source reference;
- SHA-256 artifact hash calculated from the approved content;
- classification, authorized audiences, and repository authority;
- effective date, review date, freshness rule, and retention rule;
- applicable environments and mandatory material checklist;
- superseding Runbook reference where applicable;
- Domain SME approval evidence and decision date;
- successful access check using the TEST runtime identity.

## Runtime admission behavior

`Pending Customer Input`, `Expired`, `Unavailable`, `Hash Mismatch`, and `Retired without Replacement` block mandatory-control assessment for the affected request type. The Agent returns `Cannot Assess` or `Needs Information`, records the Runbook status and access outcome, and routes the case to the analyst. It must not replace a mandatory customer Runbook with advisory guidance.

## Authority

Customer-approved Runbooks are mandatory. Approved Microsoft guidance is advisory where the Runbook is silent. Approved industry guidance is advisory unless formally adopted.

## Freshness and retirement

Expired or unavailable mandatory Runbooks block automated mandatory-control assessment. Superseded records remain traceable. Retirement requires replacement mapping and Consumer impact analysis.
