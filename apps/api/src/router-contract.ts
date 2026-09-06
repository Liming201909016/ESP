import AjvModule, { type ErrorObject } from "ajv";
import addFormatsModule from "ajv-formats";

const Ajv = AjvModule.default;
const addFormats = addFormatsModule.default;
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const routerRequestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["caseId", "request", "consumerBindingCode"],
  properties: {
    caseId: { type: "string", minLength: 1 },
    request: { type: "string", minLength: 1 },
    consumerBindingCode: { type: "string", minLength: 1 },
  },
} as const;

const intentResolutionRequestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["employeeIntent", "evidencePackageId", "consumerBindingCode"],
  properties: {
    employeeIntent: { type: "string", minLength: 1, maxLength: 4000 },
    evidencePackageId: { type: "string", minLength: 1 },
    consumerBindingCode: { type: "string", minLength: 1 },
  },
} as const;

const reviewEnvelopeSchema = {
  type: "object",
  additionalProperties: true,
  required: ["correlationId", "caseId", "request", "consumer", "consumerBinding", "state", "outcome", "evidence", "trace", "violations", "metrics", "analystReviewRequired"],
  properties: {
    correlationId: { type: "string", minLength: 1 },
    caseId: { type: "string", minLength: 1 },
    request: { type: "object", additionalProperties: false, required: ["text"], properties: { text: { type: "string", minLength: 1 } } },
    consumer: { type: "object", additionalProperties: false, required: ["code", "name"], properties: { code: { type: "string", minLength: 1 }, name: { type: "string", minLength: 1 } } },
    consumerBinding: { type: "object", additionalProperties: false, required: ["code", "status"], properties: { code: { type: "string", minLength: 1 }, status: { const: "Active" } } },
    state: { type: "string", minLength: 1 },
    outcome: { enum: ["Success", "NeedsInformation", "CannotAssess", "HumanHandoff", "RejectedByPolicy", "Failed"] },
    evidence: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["evidenceId", "type", "sourceId", "claimReference"],
        properties: {
          evidenceId: { type: "string", minLength: 1 },
          type: { enum: ["Fact", "RuleResult", "ToolResult", "ModelSuggestion", "HumanDecision"] },
          sourceId: { type: "string", minLength: 1 },
          claimReference: { type: "string", minLength: 1 },
        },
      },
    },
    trace: {
      type: "array", minItems: 1,
      items: {
        type: "object", additionalProperties: false, required: ["sequence", "skillCode", "skillVersion", "implementationVersion", "pluginCodes", "outcome"],
        properties: {
          sequence: { type: "integer", minimum: 1 },
          skillCode: { type: "string", minLength: 1 },
          skillVersion: { type: "string", minLength: 1 },
          implementationVersion: { type: "string", minLength: 1 },
          pluginCodes: { type: "array", items: { type: "string", minLength: 1 } },
          outcome: { type: "string", minLength: 1 },
        },
      },
    },
    violations: { type: "array", items: { type: "string" } },
    metrics: {
      type: "object", additionalProperties: false, required: ["materialClaimCitationCoverage", "unsupportedMaterialClaims", "authorizationBypassCount", "secretDistributionCount"],
      properties: {
        materialClaimCitationCoverage: { type: "number", minimum: 0, maximum: 1 },
        unsupportedMaterialClaims: { type: "integer", minimum: 0 },
        authorizationBypassCount: { type: "integer", minimum: 0 },
        secretDistributionCount: { type: "integer", minimum: 0 },
      },
    },
    analystReviewRequired: { type: "boolean" },
    report: {
      type: "object", additionalProperties: true, required: ["status", "findings"],
      properties: {
        status: { enum: ["Draft", "Final"] },
        findings: {
          type: "array",
          items: {
            type: "object", additionalProperties: true, required: ["findingId", "citations"],
            properties: {
              findingId: { type: "string", minLength: 1 },
              citations: {
                type: "array",
                items: {
                  type: "object", additionalProperties: true, required: ["evidenceId", "sourceId", "claimReference"],
                  properties: {
                    evidenceId: { type: "string", minLength: 1 }, sourceId: { type: "string", minLength: 1 }, claimReference: { type: "string", minLength: 1 },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  allOf: [{ if: { properties: { state: { const: "NeedsInformation" } } }, else: { required: ["report"] } }],
} as const;

const validateRouterRequest = ajv.compile(routerRequestSchema);
const validateIntentResolutionRequest = ajv.compile(intentResolutionRequestSchema);
const validateReviewEnvelope = ajv.compile(reviewEnvelopeSchema);

function validationMessage(errors: ErrorObject[] | null | undefined) {
  return errors?.map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ") ?? "unknown validation error";
}

export function assertRouterRequest(value: unknown): asserts value is { caseId: string; request: string; consumerBindingCode: string } {
  if (!validateRouterRequest(value)) throw new Error(`Router request contract violation: ${validationMessage(validateRouterRequest.errors)}`);
}

export function assertIntentResolutionRequest(value: unknown): asserts value is { employeeIntent: string; evidencePackageId: string; consumerBindingCode: string } {
  if (!validateIntentResolutionRequest(value)) {
    throw new Error(`Intent resolution request contract violation: ${validationMessage(validateIntentResolutionRequest.errors)}`);
  }
}

export function assertReviewEnvelope(value: unknown): asserts value is { correlationId: string } {
  if (!validateReviewEnvelope(value)) throw new Error(`Router response contract violation: ${validationMessage(validateReviewEnvelope.errors)}`);
}