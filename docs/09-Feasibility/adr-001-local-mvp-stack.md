# ADR-001: Local Hackathon MVP Stack

**Status:** Accepted for implementation  
**Date:** 2026-09-03

## Context

ESP needs a browser-accessible, one-command Demo Mode that runs without a tenant, uses existing JSON contracts and synthetic data, shows execution/evidence traces, and can later replace local Plugin adapters with Power Platform adapters.

The workstation has Node 24.19.0, npm 11.17.0, and Python 3.12.10. npm registry resolution was verified for Vite 8.2.2, Express 5.2.1, and Ajv 8.20.0. Only .NET runtimes are installed; no .NET SDK is available.

## Decision

Implement the local MVP as a TypeScript workspace using React/Vite, Express, Ajv with Ajv Formats, Vitest, and Playwright. Retain Python for the existing design/build/evaluation scripts.

Use a single local API process and file-backed JSON store for the Hackathon. Enforce atomic writes and serialize mutations. Keep persistence behind an interface so a Dataverse adapter can replace it in Connected Mode.

Use an explicit workflow state machine for the five Security Review Skills. Do not use an LLM or generative tool selection to control mandatory stage order, evidence checks, authority, or human approval.

## Consequences

- Demo Mode has no cloud, secret, or tenant dependency.
- Frontend and API share TypeScript contract types and Ajv validation.
- Existing Python evaluation remains the independent acceptance oracle.
- Local storage is appropriate for one-process demo use, not concurrent enterprise operation.
- Connected Mode requires separate adapters and Power Platform governance but no change to Skill or Plugin identity.

## Rejected alternatives

- Full Dataverse-first build: too much scope and environment risk for the Hackathon critical path.
- .NET local service: the required SDK is not installed and offers no current advantage for the demo.
- Browser-only implementation: would expose orchestration and allow the UI to fabricate trace/evidence state.
- Unrestricted generative orchestration: cannot guarantee mandatory ordering, evidence coverage, or human approval.
