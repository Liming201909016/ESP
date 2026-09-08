import { createHash } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const [externalDirectory] = process.argv.slice(2);
if (!externalDirectory) {
  throw new Error('Usage: simulate-handoff.mjs <external-simulation-directory>');
}

const root = resolve(import.meta.dirname, '..', '..');
const directory = resolve(externalDirectory);
const paths = {
  runtimeInputs: resolve(directory, 'runtime-inputs.reviewer-seed.json'),
  acceptanceLabels: resolve(directory, 'acceptance-labels.simulated.json'),
  reviewerManifest: resolve(directory, 'reviewer-manifest.simulated.json'),
  valueMeasurements: resolve(directory, 'value-measurements.simulated.json'),
  candidate: resolve(directory, 'candidate.simulated.json'),
  acceptanceReport: resolve(directory, 'acceptance-report.simulated.json'),
  valueReport: resolve(directory, 'value-report.simulated.json'),
  publicationReport: resolve(directory, 'publication-report.simulated.json'),
  summary: resolve(directory, 'simulation-summary.json'),
};
const scripts = {
  exporter: resolve(import.meta.dirname, 'export-candidate.mjs'),
  evaluator: resolve(import.meta.dirname, 'evaluate-candidate.mjs'),
  value: resolve(import.meta.dirname, 'evaluate-value-measurements.mjs'),
  publication: resolve(import.meta.dirname, 'simulate-publication.mjs'),
};
const reviewStore = resolve(root, '.esp-data', 'reviews.json');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async path => sha256(await readFile(path));
const hashIfPresent = async path => stat(path).then(() => hashFile(path), error => error.code === 'ENOENT' ? null : Promise.reject(error));
const run = (args, options = {}) => {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`.trim());
  return result.stdout.trim();
};

for (const path of [paths.runtimeInputs, paths.acceptanceLabels, paths.reviewerManifest, paths.valueMeasurements]) {
  await stat(path);
}
const reviewHashBefore = await hashIfPresent(reviewStore);

const exportOutput = run([
  '--permission',
  `--allow-fs-read=${import.meta.dirname}`,
  `--allow-fs-read=${resolve(root, 'apps', 'api', 'src', 'plugins.ts')}`,
  `--allow-fs-read=${paths.runtimeInputs}`,
  `--allow-fs-write=${directory}`,
  scripts.exporter,
  paths.runtimeInputs,
  paths.candidate,
], { env: { ...process.env, KPR_LABEL_ACCESS_PROBE: paths.acceptanceLabels } });
if (!exportOutput.includes('labels inaccessible')) throw new Error('Simulation export did not prove label denial');

run([
  scripts.evaluator,
  paths.runtimeInputs,
  paths.acceptanceLabels,
  paths.candidate,
  paths.acceptanceReport,
  paths.reviewerManifest,
]);
const acceptance = JSON.parse(await readFile(paths.acceptanceReport, 'utf8'));
if (acceptance.status !== 'SimulationAcceptancePass'
  || acceptance.simulation !== true
  || acceptance.heldOut !== false
  || acceptance.independentReviewer !== 'SIMULATED-Wenxian') {
  throw new Error('Simulation acceptance report crossed a real acceptance boundary');
}

run([scripts.value, paths.valueMeasurements, paths.valueReport]);
const value = JSON.parse(await readFile(paths.valueReport, 'utf8'));
if (value.status !== 'SimulationValuePass'
  || value.decision !== 'SimulationContinue'
  || value.simulation !== true
  || value.measured !== false) {
  throw new Error('Simulation value report crossed a measured-value boundary');
}

run([scripts.publication, paths.candidate, paths.acceptanceReport, paths.valueReport, paths.publicationReport]);
const publication = JSON.parse(await readFile(paths.publicationReport, 'utf8'));
if (publication.status !== 'SimulationPublicationRehearsalPass'
  || publication.simulation !== true
  || publication.publicationPerformed !== false
  || publication.gitOperationsPerformed !== false
  || publication.azureDeploymentPerformed !== false
  || publication.azureDeliveryPlan.operation !== 'NotExecuted'
  || publication.azureDeliveryPlan.hostedSmoke !== 'NotRun') {
  throw new Error('Simulation publication report crossed an external-effect boundary');
}

const reviewHashAfter = await hashIfPresent(reviewStore);
if (reviewHashAfter !== reviewHashBefore) throw new Error('Simulation modified the operational Review store');

const files = Object.fromEntries(await Promise.all(Object.entries(paths)
  .filter(([name]) => name !== 'summary')
  .map(async ([name, path]) => [name, { path, sha256: await hashFile(path) }])));
const summary = {
  simulation: true,
  status: 'SimulationHandoffPass',
  formalAcceptanceCompleted: false,
  measuredValueCompleted: false,
  publicationPerformed: false,
  gitOperationsPerformed: false,
  azureDeploymentPerformed: false,
  operationalReviewStoreChanged: false,
  steps: {
    preparationAndConsumers: { caseCount: 7, responseCount: 14, consumerOutputCount: 14 },
    acceptance: { status: acceptance.status, assertions: acceptance.summary },
    value: { status: value.status, decision: value.decision, metrics: value.metrics },
    publication: { status: publication.status, lifecycle: publication.lifecycle },
    azure: publication.azureDeliveryPlan,
  },
  files,
};
await writeFile(paths.summary, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`Knowledge Preparation full handoff simulation: ${summary.status}`);
console.log(`Summary: ${paths.summary}`);
