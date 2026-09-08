import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [inputPath, labelPath, candidatePath, reportPath, reviewerManifestPath] = process.argv.slice(2);
if (!inputPath || !labelPath || !candidatePath || !reportPath) {
  throw new Error('Usage: evaluate-candidate.mjs <runtime-inputs.json> <acceptance-labels.json> <candidate.json> <report.json> [reviewer-manifest.json]');
}

const [inputBytes, labelBytes, candidateBytes] = await Promise.all([
  readFile(inputPath),
  readFile(labelPath),
  readFile(candidatePath),
]);
const inputs = JSON.parse(inputBytes.toString('utf8'));
const labels = JSON.parse(labelBytes.toString('utf8'));
const candidate = JSON.parse(candidateBytes.toString('utf8'));
const assertions = [];
const check = (name, passed, detail) => assertions.push({ name, passed: Boolean(passed), detail });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function canonicalJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isSafeInteger(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  throw new Error('Unsupported evaluator JSON value');
}

const sourceHash = body => createHash('sha256').update(canonicalJson(body), 'utf8').digest('hex');
let reviewerManifest = null;
let reviewerManifestBytes = null;
if (reviewerManifestPath) {
  reviewerManifestBytes = await readFile(reviewerManifestPath);
  reviewerManifest = JSON.parse(reviewerManifestBytes.toString('utf8'));
  const simulation = reviewerManifest.simulation === true;
  if (reviewerManifest.protocolVersion !== '0.1.0'
    || (simulation ? reviewerManifest.heldOut !== false : reviewerManifest.heldOut !== true)
    || (simulation ? reviewerManifest.independentOfImplementation !== false : reviewerManifest.independentOfImplementation !== true)
    || typeof reviewerManifest.reviewer !== 'string'
    || reviewerManifest.reviewer.trim().length === 0
    || reviewerManifest.caseCount !== 7
    || reviewerManifest.runtimeInputSha256 !== sha256(inputBytes)
    || reviewerManifest.acceptanceLabelSha256 !== sha256(labelBytes)) {
    throw new Error('Invalid reviewer manifest or held-out file hashes');
  }
}
const expectedCaseIds = inputs.cases.map(item => item.request.caseId).sort();
const labelCaseIds = labels.cases.map(item => item.caseId).sort();
const candidateCaseIds = candidate.cases?.map(item => item.caseId).sort() ?? [];
check('input hash', candidate.runtimeInputSha256 === createHash('sha256').update(inputBytes).digest('hex'), 'Candidate must bind to exact runtime inputs');
check('input/label cases', new Set(expectedCaseIds).size === expectedCaseIds.length && canonicalJson(expectedCaseIds) === canonicalJson(labelCaseIds), 'Inputs and labels must contain the same unique cases');
check('candidate cases', new Set(candidateCaseIds).size === candidateCaseIds.length && canonicalJson(expectedCaseIds) === canonicalJson(candidateCaseIds), 'Candidate must contain every case exactly once and no extras');
check('candidate envelope', candidate.experiment === 'knowledge-preparation' && candidate.contractVersion === '0.1.0' && candidate.exporterVersion === '0.1.0', 'Candidate envelope and exporter version must be pinned');

for (const fixture of inputs.cases) {
  const caseId = fixture.request.caseId;
  const label = labels.cases.find(item => item.caseId === caseId);
  const observed = candidate.cases?.filter(item => item.caseId === caseId) ?? [];
  check(`${caseId} candidate cardinality`, observed.length === 1, 'Each case must occur exactly once');
  if (!label || observed.length !== 1) continue;
  const candidateCase = observed[0];
  const responses = candidateCase.preparationResponses ?? [];
  const outputs = candidateCase.consumerOutputs ?? [];
  check(`${caseId} response cardinality`, responses.length === 2 && new Set(responses.map(item => item.consumerCode)).size === 2, 'Both preparation Consumers are required');
  check(`${caseId} output cardinality`, outputs.length === 2 && new Set(outputs.map(item => item.consumerCode)).size === 2, 'Both downstream Consumer outputs are required');

  for (const response of responses) {
    const prefix = `${caseId} ${response.consumerCode ?? 'unknown'}`;
    check(`${prefix} identity`, response.caseId === caseId && response.contractVersion === '0.1.0' && response.experiment === 'knowledge-preparation', 'Response identity must match the case and contract');
    check(`${prefix} outcome`, response.outcome === label.outcome, `Expected ${label.outcome}, observed ${response.outcome}`);
    check(`${prefix} pins`, response.pins?.implementationVersion === 'knowledge-preparation-draft-0.1.0'
      && response.pins?.plugins?.['PLG-DOC-SOURCE'] === '1.0.0'
      && response.pins?.plugins?.['PLG-EVIDENCE'] === '1.0.0', 'Implementation and Plugin versions must match the frozen draft');
    check(`${prefix} package controls`, canonicalJson(response.package?.gaps ?? []) === canonicalJson(label.gaps)
      && canonicalJson((response.package?.conflicts ?? []).map(item => item.field)) === canonicalJson(label.conflictFields)
      && canonicalJson(response.package?.limitations ?? []) === canonicalJson(label.limitations)
      && (response.errors?.[0]?.category ?? null) === label.errorCategory, 'Gaps, conflicts, limitations, and errors must match the acceptance labels');

    const actualFacts = [];
    let referencesValid = true;
    for (const fact of response.package?.facts ?? []) {
      const evidence = response.evidence?.filter(item => item.evidenceId === fact.evidenceIds?.[0]) ?? [];
      const source = fixture.request.sources.find(item => item.sourceId === evidence[0]?.sourceId);
      const locator = evidence[0]?.locator;
      const field = typeof locator === 'string' && locator.startsWith('/') ? locator.slice(1) : '';
      const allowed = fixture.adapterHarness.access[source?.sourceId] === 'Allowed'
        && !fixture.adapterHarness.unreadableSourceIds.includes(source?.sourceId);
      referencesValid &&= evidence.length === 1 && evidence[0].type === 'Fact' && source
        && evidence[0].sourceVersion === source.sourceVersion
        && evidence[0].contentHash === sourceHash(source.body)
        && locator === `/${fact.field}` && field === fact.field
        && canonicalJson(fact.value) === canonicalJson(source.body[field]) && allowed;
      actualFacts.push({ field: fact.field, value: fact.value, sourceId: evidence[0]?.sourceId, locator });
    }
    check(`${prefix} evidence references`, referencesValid, 'Every fact must resolve to the exact authorized source version, locator, value, and recomputed hash');
    check(`${prefix} facts`, canonicalJson(actualFacts) === canonicalJson(label.facts), 'Observed facts must match required typed facts');
    check(`${prefix} injection`, response.events?.some(item => item.operation === 'IgnoreUntrustedInstruction') === label.injectionIgnored, 'Injection handling must match the source case');
    check(`${prefix} forbidden reads`, label.forbiddenReadSourceIds.every(sourceId => !response.events?.some(item => item.operation === 'Read' && item.outcome === 'Success' && item.sourceId === sourceId)), 'Denied or unavailable sources must not be read successfully');

    const output = outputs.filter(item => item.consumerCode === response.consumerCode && item.packageInvocationId === response.invocationId);
    check(`${prefix} output link`, output.length === 1, 'Consumer output must resolve to exactly one preparation invocation');
    if (output.length !== 1) continue;
    const consumerOutput = output[0];
    const task = labels.consumerTasks[response.consumerCode];
    const expectedFactIds = response.package.facts.filter(fact => task.requiredFieldsWhenAvailable.includes(fact.field)).map(fact => fact.factId);
    const actualFactIds = consumerOutput.items.flatMap(item => item.factIds);
    const expectedQuestions = [
      ...response.package.gaps.map(reference => `Gap:${reference}`),
      ...response.package.conflicts.map(conflict => `Conflict:${conflict.field}`),
      ...response.package.limitations.map(reference => `Limitation:${reference}`),
    ];
    check(`${prefix} task output`, consumerOutput.status === 'Draft' && consumerOutput.humanReviewRequired === true
      && consumerOutput.outcome === response.outcome
      && consumerOutput.items.every(item => item.kind === task.kind)
      && canonicalJson(actualFactIds) === canonicalJson(expectedFactIds)
      && canonicalJson(consumerOutput.questions.map(item => `${item.reason}:${item.reference}`)) === canonicalJson(expectedQuestions), 'Consumer output must preserve task facts, limitations, stops, and human review');
  }
}

const passed = assertions.every(item => item.passed);
const simulation = reviewerManifest?.simulation === true;
const report = {
  evaluatorVersion: '0.1.0',
  status: passed
    ? simulation ? 'SimulationAcceptancePass' : reviewerManifest ? 'HeldOutAcceptancePass' : 'DevelopmentAcceptancePass'
    : simulation ? 'SimulationAcceptanceFail' : reviewerManifest ? 'HeldOutAcceptanceFail' : 'DevelopmentAcceptanceFail',
  simulation,
  heldOut: Boolean(reviewerManifest) && !simulation,
  independentReviewer: reviewerManifest?.reviewer ?? null,
  hashes: {
    runtimeInputs: sha256(inputBytes),
    acceptanceLabels: sha256(labelBytes),
    candidate: sha256(candidateBytes),
    reviewerManifest: reviewerManifestBytes ? sha256(reviewerManifestBytes) : null,
  },
  summary: { assertionCount: assertions.length, passedCount: assertions.filter(item => item.passed).length },
  assertions,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Knowledge Preparation evaluator: ${report.status} (${report.summary.passedCount}/${report.summary.assertionCount})`);
if (!passed) process.exitCode = 1;
