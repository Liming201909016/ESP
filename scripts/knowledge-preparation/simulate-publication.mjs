import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [candidatePath, acceptanceReportPath, valueReportPath, outputPath] = process.argv.slice(2);
if (!candidatePath || !acceptanceReportPath || !valueReportPath || !outputPath) {
  throw new Error('Usage: simulate-publication.mjs <candidate.json> <acceptance-report.json> <value-report.json> <output.json>');
}

const [candidateBytes, acceptanceBytes, valueBytes] = await Promise.all([
  readFile(candidatePath),
  readFile(acceptanceReportPath),
  readFile(valueReportPath),
]);
const candidate = JSON.parse(candidateBytes.toString('utf8'));
const acceptance = JSON.parse(acceptanceBytes.toString('utf8'));
const value = JSON.parse(valueBytes.toString('utf8'));

if (acceptance.status !== 'SimulationAcceptancePass' || acceptance.simulation !== true || acceptance.heldOut !== false) {
  throw new Error('Simulation acceptance gate is not satisfied');
}
if (value.status !== 'SimulationValuePass' || value.decision !== 'SimulationContinue' || value.simulation !== true || value.measured !== false) {
  throw new Error('Simulation value gate is not satisfied');
}
if (!Array.isArray(candidate.cases) || candidate.cases.length !== 7) {
  throw new Error('Simulation candidate must contain seven cases');
}

const responses = candidate.cases.flatMap(item => item.preparationResponses ?? []);
if (responses.length !== 14) throw new Error('Simulation candidate must contain two preparation responses per case');
const pins = responses.map(response => response.pins);
const canonicalPins = JSON.stringify(pins[0]);
if (pins.some(pin => JSON.stringify(pin) !== canonicalPins || JSON.stringify(pin).includes('Latest'))) {
  throw new Error('Simulation activation requires identical explicit pins and rejects Latest');
}
const bindings = [...new Set(responses.map(response => response.consumerBindingCode))].sort();
if (JSON.stringify(bindings) !== JSON.stringify(['CB-DRAFT-KP-ARCH', 'CB-DRAFT-KP-SEC'])) {
  throw new Error('Simulation activation requires both Consumer Bindings');
}

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  simulation: true,
  status: 'SimulationPublicationRehearsalPass',
  publicationPerformed: false,
  gitOperationsPerformed: false,
  azureDeploymentPerformed: false,
  candidateVersion: 'knowledge-preparation-simulation-0.1.0',
  approval: {
    status: 'SimulationOnly',
    approver: 'SIMULATED-Wenxian',
    formalApprovalRecorded: false,
  },
  explicitPins: pins[0],
  consumerBindings: bindings,
  lifecycle: [
    { state: 'SimulationCandidateValidated', externalEffect: false },
    { state: 'SimulationActivated', externalEffect: false },
    { state: 'SimulationRolledBack', rollbackTarget: 'Unregistered', externalEffect: false },
  ],
  azureDeliveryPlan: {
    target: 'app-esp-esp-demo-vw6mjjpc4xh64',
    operation: 'NotExecuted',
    healthCheck: 'NotRun',
    hostedSmoke: 'NotRun',
    rollback: 'NotExecuted',
  },
  hashes: {
    candidate: sha256(candidateBytes),
    acceptanceReport: sha256(acceptanceBytes),
    valueReport: sha256(valueBytes),
  },
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log('Knowledge Preparation publication simulation: SimulationPublicationRehearsalPass (activation and rollback, no external effects)');
