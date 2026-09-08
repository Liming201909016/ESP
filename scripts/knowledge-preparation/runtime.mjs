import { createHash, randomUUID } from 'node:crypto';
import { containsPromptInjection, documentSourcePlugin, evidencePlugin } from '../../apps/api/src/plugins.ts';

const fields = ['system', 'region', 'permissions'];
const bindings = {
  'CON-SEC-REVIEW-AGENT': 'CB-DRAFT-KP-SEC',
  'CON-ARCH-REVIEW': 'CB-DRAFT-KP-ARCH',
};

export function canonicalJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isSafeInteger(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  throw new Error('Unsupported draft JSON value');
}

export function sourceHash(body) {
  return createHash('sha256').update(canonicalJson(body), 'utf8').digest('hex');
}

function closedObject(value, required, optional = []) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype
    || required.some(key => !Object.hasOwn(value, key))
    || Object.keys(value).some(key => !required.includes(key) && !optional.includes(key))) {
    throw new Error('Invalid draft request shape');
  }
}

function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateRequest(request) {
  closedObject(request, ['messageType', 'experiment', 'contractVersion', 'caseId', 'requestedFields', 'sources']);
  if (request.messageType !== 'request' || request.experiment !== 'knowledge-preparation' || request.contractVersion !== '0.1.0'
    || !nonempty(request.caseId) || !Array.isArray(request.requestedFields) || !request.requestedFields.length
    || request.requestedFields.some(field => !fields.includes(field))
    || new Set(request.requestedFields).size !== request.requestedFields.length
    || !Array.isArray(request.sources) || !request.sources.length) throw new Error('Invalid draft request');
  for (const source of request.sources) {
    closedObject(source, ['sourceId', 'sourceVersion'], ['body']);
    if (!nonempty(source.sourceId) || !nonempty(source.sourceVersion)) throw new Error('Invalid source identity');
  }
  if (new Set(request.sources.map(source => source.sourceId)).size !== request.sources.length) throw new Error('Duplicate source identity');
}

function usableValue(field, value) {
  if (field !== 'permissions') return nonempty(value);
  return Array.isArray(value) && value.length > 0 && value.every(nonempty) && new Set(value).size === value.length;
}

export async function prepareKnowledge(request, context) {
  validateRequest(request);
  if (!Object.hasOwn(bindings, context?.consumerCode)) throw new Error('Unknown experimental Consumer');
  const harness = context.adapterHarness;
  if (!harness || !['Available', 'Unavailable'].includes(harness.dependency)
    || !Array.isArray(harness.unreadableSourceIds)) throw new Error('Invalid trusted adapter configuration');
  const response = {
    messageType: 'response', experiment: 'knowledge-preparation', contractVersion: '0.1.0', caseId: request.caseId,
    correlationId: randomUUID(), invocationId: `INV-${randomUUID()}`, consumerCode: context.consumerCode,
    consumerBindingCode: bindings[context.consumerCode],
    pins: { implementationVersion: 'knowledge-preparation-draft-0.1.0', plugins: { [documentSourcePlugin.code]: documentSourcePlugin.version, [evidencePlugin.code]: evidencePlugin.version } },
    outcome: 'Success', package: { facts: [], sources: [], conflicts: [], gaps: [], limitations: [] }, evidence: [], events: [], errors: [],
  };
  const record = (operation, outcome, sourceId, pluginCode = documentSourcePlugin.code) => {
    const event = { eventId: `EVENT-${randomUUID()}`, pluginCode, operation, outcome, ...(sourceId ? { sourceId } : {}) };
    response.events.push(event);
    const retained = evidencePlugin.create('ToolResult', sourceId ?? response.invocationId, event.eventId);
    response.evidence.push({ evidenceId: retained.evidenceId, type: 'ToolResult', eventId: event.eventId });
  };
  const stop = (outcome, limitation, category, retryable) => {
    response.outcome = outcome;
    response.package.limitations.push(limitation);
    response.errors.push({ category, message: limitation, retryable });
    return response;
  };
  let denied = false;
  for (const source of request.sources) {
    const allowed = Object.hasOwn(harness.access ?? {}, source.sourceId) && harness.access[source.sourceId] === 'Allowed';
    record('Authorize', allowed ? 'Success' : 'RejectedByPolicy', source.sourceId);
    denied ||= !allowed;
  }
  if (denied) return stop('RejectedByPolicy', 'AccessDenied', 'PolicyDenial', false);
  if (harness.dependency === 'Unavailable') {
    record('Read', 'Failed');
    return stop('Failed', 'DependencyFailure', 'DependencyFailure', true);
  }
  const unreadable = request.sources.find(source => harness.unreadableSourceIds.includes(source.sourceId)
    || !source.body || Object.getPrototypeOf(source.body) !== Object.prototype);
  if (unreadable) {
    record('Read', 'CannotAssess', unreadable.sourceId);
    return stop('CannotAssess', 'UnreadableSource', 'MissingEvidence', true);
  }
  const documents = request.sources.map(source => ({ documentId: source.sourceId, documentType: 'SyntheticKnowledge', content: source.body }));
  const adapter = context.documentAdapter ?? documentSourcePlugin;
  let result;
  try {
    result = await adapter.read({ input: { documents } });
  } catch {
    record('Read', 'Failed');
    return stop('Failed', 'DependencyFailure', 'DependencyFailure', true);
  }
  if (!result || canonicalJson(result.documents) !== canonicalJson(documents)) {
    record('Read', 'Failed');
    return stop('Failed', 'DependencyFailure', 'DependencyFailure', false);
  }
  for (const source of request.sources) {
    const hash = sourceHash(source.body);
    record('Read', 'Success', source.sourceId);
    response.package.sources.push({ sourceId: source.sourceId, sourceVersion: source.sourceVersion, sha256: hash });
    if (containsPromptInjection(source.body)) record('IgnoreUntrustedInstruction', 'Success', source.sourceId);
    for (const field of request.requestedFields) {
      if (!Object.hasOwn(source.body, field) || !usableValue(field, source.body[field])) continue;
      const retained = evidencePlugin.create('Fact', source.sourceId, `/${field}`);
      const fact = { factId: `FACT-${randomUUID()}`, field, value: structuredClone(source.body[field]), evidenceIds: [retained.evidenceId] };
      response.package.facts.push(fact);
      response.evidence.push({ evidenceId: retained.evidenceId, type: 'Fact', sourceId: source.sourceId, sourceVersion: source.sourceVersion, locator: `/${field}`, contentHash: hash });
    }
  }
  for (const field of request.requestedFields) {
    const facts = response.package.facts.filter(fact => fact.field === field);
    if (!facts.length) response.package.gaps.push(field);
    if (new Set(facts.map(fact => canonicalJson(fact.value))).size > 1) response.package.conflicts.push({ field, factIds: facts.map(fact => fact.factId) });
  }
  if (response.package.gaps.length) stop('NeedsInformation', 'MissingMaterial', 'MissingEvidence', true);
  if (response.package.conflicts.length) stop('CannotAssess', 'ConflictingFacts', 'MissingEvidence', false);
  record('RetainEvidence', 'Success', undefined, evidencePlugin.code);
  return response;
}