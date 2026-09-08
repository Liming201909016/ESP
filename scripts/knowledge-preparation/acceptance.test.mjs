import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..', '..');
const inputPath = resolve(root, 'test-data', 'knowledge-preparation', 'v0.1.0', 'runtime-inputs.json');
const labelPath = resolve(root, 'test-data', 'knowledge-preparation', 'v0.1.0', 'acceptance-labels.json');
const exporterPath = resolve(import.meta.dirname, 'export-candidate.mjs');
const evaluatorPath = resolve(import.meta.dirname, 'evaluate-candidate.mjs');
const artifactDirectory = resolve(root, 'artifacts', 'knowledge-preparation', 'acceptance-latest');
const temporaryDirectory = resolve(tmpdir(), `esp-kpr-acceptance-${process.pid}`);
const reviewStorePath = resolve(root, '.esp-data', 'reviews.json');

const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async path => hashBytes(await readFile(path));
const hashIfPresent = async path => stat(path).then(() => hashFile(path), error => error.code === 'ENOENT' ? null : Promise.reject(error));

function run(command, args, options = {}) {
  return spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
}

function exportCandidate(runtimeInputPath, outputPath, probeLabelPath = labelPath) {
  const result = run(process.execPath, [
    '--permission',
    `--allow-fs-read=${import.meta.dirname}`,
    `--allow-fs-read=${resolve(root, 'apps', 'api', 'src', 'plugins.ts')}`,
    `--allow-fs-read=${runtimeInputPath}`,
    `--allow-fs-write=${dirname(outputPath)}`,
    exporterPath,
    runtimeInputPath,
    outputPath,
  ], { env: { ...process.env, KPR_LABEL_ACCESS_PROBE: probeLabelPath } });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /labels inaccessible/);
}

function evaluate(runtimeInputPath, acceptanceLabelPath, candidatePath, reportPath, reviewerManifestPath) {
  const args = [evaluatorPath, runtimeInputPath, acceptanceLabelPath, candidatePath, reportPath];
  if (reviewerManifestPath) args.push(reviewerManifestPath);
  const result = run(process.execPath, args);
  return { result, report: null };
}

async function evaluation(runtimeInputPath, acceptanceLabelPath, candidatePath, reportPath, reviewerManifestPath) {
  const { result } = evaluate(runtimeInputPath, acceptanceLabelPath, candidatePath, reportPath, reviewerManifestPath);
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  return { result, report };
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function failedNames(report) {
  return report.assertions.filter(item => !item.passed).map(item => item.name);
}

function normalizedVolatileIds(value) {
  const ids = new Map();
  const replace = item => {
    if (Array.isArray(item)) return item.map(replace);
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([key, child]) => [key, replace(child)]));
    if (typeof item !== 'string') return item;
    if (!/^(?:INV-|EV-|EVENT-|FACT-)[0-9a-f-]{8,}$|^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(item)) return item;
    if (!ids.has(item)) ids.set(item, `<VOLATILE-${ids.size + 1}>`);
    return ids.get(item);
  };
  return replace(value);
}

async function sourceBaseCommit() {
  const gitDirectory = resolve(root, '.git');
  const head = (await readFile(resolve(gitDirectory, 'HEAD'), 'utf8')).trim();
  if (!head.startsWith('ref: ')) return head;
  const reference = head.slice(5);
  try {
    return (await readFile(resolve(gitDirectory, reference), 'utf8')).trim();
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const packedReferences = await readFile(resolve(gitDirectory, 'packed-refs'), 'utf8');
  const match = packedReferences.split(/\r?\n/).find(line => line.endsWith(` ${reference}`));
  if (!match) throw new Error(`Git reference is unavailable: ${reference}`);
  return match.split(' ', 1)[0];
}

await rm(temporaryDirectory, { recursive: true, force: true });
await mkdir(temporaryDirectory, { recursive: true });
const operationalReviewHashBefore = await hashIfPresent(reviewStorePath);
const baselineCandidatePath = resolve(temporaryDirectory, 'candidate-baseline.json');
const baselineReportPath = resolve(temporaryDirectory, 'report-baseline.json');
exportCandidate(inputPath, baselineCandidatePath);
const baseline = await evaluation(inputPath, labelPath, baselineCandidatePath, baselineReportPath);
const baselineCandidate = JSON.parse(await readFile(baselineCandidatePath, 'utf8'));

await test('Knowledge Preparation independent acceptance mechanics', async t => {
  await t.test('permission-isolated baseline passes in separate exporter and evaluator processes', async () => {
    assert.equal(baseline.result.status, 0, `${baseline.result.stdout}\n${baseline.result.stderr}`);
    assert.equal(baseline.report.status, 'DevelopmentAcceptancePass');
    assert.equal(baseline.report.summary.passedCount, baseline.report.summary.assertionCount);
    assert.equal(baselineCandidate.cases.length, 7);
    assert.equal(baselineCandidate.cases.every(item => item.preparationResponses.length === 2 && item.consumerOutputs.length === 2), true);
    const evaluatorSource = await readFile(evaluatorPath, 'utf8');
    assert.equal(evaluatorSource.includes("from './runtime.mjs'"), false);
    assert.equal(evaluatorSource.includes("from './consumers.mjs'"), false);
  });

  const corruptionCases = [
    ['DropRequiredFact', candidate => {
      candidate.cases.find(item => item.caseId === 'KP-001').preparationResponses[0].package.facts
        = candidate.cases.find(item => item.caseId === 'KP-001').preparationResponses[0].package.facts.filter(item => item.field !== 'permissions');
    }, 'KP-001 CON-SEC-REVIEW-AGENT facts'],
    ['FabricateLocator', candidate => {
      candidate.cases.find(item => item.caseId === 'KP-001').preparationResponses[0].evidence
        .find(item => item.type === 'Fact' && item.locator === '/region').locator = '/invented';
    }, 'KP-001 CON-SEC-REVIEW-AGENT evidence references'],
    ['SuppressGovernedStop', candidate => {
      const item = candidate.cases.find(entry => entry.caseId === 'KP-004');
      item.preparationResponses[0].outcome = 'Success';
      item.consumerOutputs[0].outcome = 'Success';
    }, 'KP-004 CON-SEC-REVIEW-AGENT outcome'],
    ['ChangePinnedDependency', candidate => {
      candidate.cases[0].preparationResponses[0].pins.plugins['PLG-DOC-SOURCE'] = 'Latest';
    }, 'KP-001 CON-SEC-REVIEW-AGENT pins'],
  ];
  for (const [name, mutate, expectedFailure] of corruptionCases) {
    await t.test(`rejects ${name}`, async () => {
      const candidate = structuredClone(baselineCandidate);
      mutate(candidate);
      const candidatePath = resolve(temporaryDirectory, `candidate-${name}.json`);
      const reportPath = resolve(temporaryDirectory, `report-${name}.json`);
      await writeJson(candidatePath, candidate);
      const verdict = await evaluation(inputPath, labelPath, candidatePath, reportPath);
      assert.notEqual(verdict.result.status, 0);
      assert.ok(failedNames(verdict.report).includes(expectedFailure));
    });
  }

  const cardinalityCases = [
    ['missing case', candidate => candidate.cases.pop(), 'candidate cases'],
    ['duplicate case', candidate => candidate.cases.push(structuredClone(candidate.cases[0])), 'candidate cases'],
    ['extra case', candidate => candidate.cases.push({ ...structuredClone(candidate.cases[0]), caseId: 'KP-EXTRA' }), 'candidate cases'],
    ['absent Consumer output', candidate => candidate.cases[0].consumerOutputs.pop(), 'KP-001 output cardinality'],
  ];
  for (const [name, mutate, expectedFailure] of cardinalityCases) {
    await t.test(`rejects ${name}`, async () => {
      const candidate = structuredClone(baselineCandidate);
      mutate(candidate);
      const slug = name.replaceAll(' ', '-');
      const candidatePath = resolve(temporaryDirectory, `candidate-${slug}.json`);
      const reportPath = resolve(temporaryDirectory, `report-${slug}.json`);
      await writeJson(candidatePath, candidate);
      const verdict = await evaluation(inputPath, labelPath, candidatePath, reportPath);
      assert.notEqual(verdict.result.status, 0);
      assert.ok(failedNames(verdict.report).includes(expectedFailure));
    });
  }

  await t.test('source-only mutation changes observations and fails unchanged labels', async () => {
    const inputs = JSON.parse(await readFile(inputPath, 'utf8'));
    inputs.cases[0].request.sources[0].body.region = 'eastus';
    const mutatedInputPath = resolve(temporaryDirectory, 'runtime-inputs-source-mutated.json');
    const candidatePath = resolve(temporaryDirectory, 'candidate-source-mutated.json');
    const reportPath = resolve(temporaryDirectory, 'report-source-mutated.json');
    await writeJson(mutatedInputPath, inputs);
    exportCandidate(mutatedInputPath, candidatePath);
    const candidate = JSON.parse(await readFile(candidatePath, 'utf8'));
    const regionFact = candidate.cases[0].preparationResponses[0].package.facts.find(item => item.field === 'region');
    assert.equal(regionFact.value, 'eastus');
    const verdict = await evaluation(mutatedInputPath, labelPath, candidatePath, reportPath);
    assert.notEqual(verdict.result.status, 0);
    assert.ok(failedNames(verdict.report).includes('KP-001 CON-SEC-REVIEW-AGENT facts'));
  });

  await t.test('label-only mutation changes verdict but not normalized runtime output', async () => {
    const labels = JSON.parse(await readFile(labelPath, 'utf8'));
    labels.cases[0].facts.find(item => item.field === 'region').value = 'eastus';
    const mutatedLabelPath = resolve(temporaryDirectory, 'acceptance-labels-mutated.json');
    const secondCandidatePath = resolve(temporaryDirectory, 'candidate-label-probe.json');
    const reportPath = resolve(temporaryDirectory, 'report-label-mutated.json');
    await writeJson(mutatedLabelPath, labels);
    exportCandidate(inputPath, secondCandidatePath, mutatedLabelPath);
    const secondCandidate = JSON.parse(await readFile(secondCandidatePath, 'utf8'));
    assert.deepEqual(normalizedVolatileIds(secondCandidate), normalizedVolatileIds(baselineCandidate));
    const verdict = await evaluation(inputPath, mutatedLabelPath, baselineCandidatePath, reportPath);
    assert.notEqual(verdict.result.status, 0);
    assert.ok(failedNames(verdict.report).includes('KP-001 CON-SEC-REVIEW-AGENT facts'));
  });

  await t.test('reviewer manifest requires independent held-out metadata and exact file hashes', async () => {
    const manifest = {
      protocolVersion: '0.1.0',
      reviewer: 'Wenxian',
      independentOfImplementation: true,
      heldOut: true,
      caseCount: 7,
      runtimeInputSha256: await hashFile(inputPath),
      acceptanceLabelSha256: await hashFile(labelPath),
    };
    const manifestPath = resolve(temporaryDirectory, 'reviewer-manifest-mechanics.json');
    const reportPath = resolve(temporaryDirectory, 'report-reviewer-manifest-mechanics.json');
    await writeJson(manifestPath, manifest);
    const verdict = await evaluation(inputPath, labelPath, baselineCandidatePath, reportPath, manifestPath);
    assert.equal(verdict.result.status, 0, `${verdict.result.stdout}\n${verdict.result.stderr}`);
    assert.equal(verdict.report.status, 'HeldOutAcceptancePass');
    assert.equal(verdict.report.heldOut, true);
    assert.equal(verdict.report.independentReviewer, 'Wenxian');
    const invalidManifestPath = resolve(temporaryDirectory, 'reviewer-manifest-invalid.json');
    await writeJson(invalidManifestPath, { ...manifest, runtimeInputSha256: '0'.repeat(64) });
    const invalid = evaluate(inputPath, labelPath, baselineCandidatePath, resolve(temporaryDirectory, 'report-invalid-manifest.json'), invalidManifestPath);
    assert.notEqual(invalid.result.status, 0);
    assert.match(invalid.result.stderr, /Invalid reviewer manifest or held-out file hashes/);

    const simulationManifestPath = resolve(temporaryDirectory, 'reviewer-manifest-simulation.json');
    const simulationReportPath = resolve(temporaryDirectory, 'report-simulation.json');
    await writeJson(simulationManifestPath, {
      ...manifest,
      reviewer: 'SIMULATED-Wenxian',
      simulation: true,
      heldOut: false,
      independentOfImplementation: false,
    });
    const simulated = await evaluation(inputPath, labelPath, baselineCandidatePath, simulationReportPath, simulationManifestPath);
    assert.equal(simulated.result.status, 0, `${simulated.result.stdout}\n${simulated.result.stderr}`);
    assert.equal(simulated.report.status, 'SimulationAcceptancePass');
    assert.equal(simulated.report.simulation, true);
    assert.equal(simulated.report.heldOut, false);
  });

  await t.test('acceptance execution does not modify operational Reviews', async () => {
    assert.equal(await hashIfPresent(reviewStorePath), operationalReviewHashBefore);
  });
});

await rm(artifactDirectory, { recursive: true, force: true });
await mkdir(artifactDirectory, { recursive: true });
await Promise.all([
  copyFile(inputPath, resolve(artifactDirectory, 'runtime-inputs.json')),
  copyFile(labelPath, resolve(artifactDirectory, 'acceptance-labels.json')),
  copyFile(baselineCandidatePath, resolve(artifactDirectory, 'candidate.json')),
  copyFile(baselineReportPath, resolve(artifactDirectory, 'report.json')),
]);
const sourceFiles = [
  'scripts/knowledge-preparation/runtime.mjs',
  'scripts/knowledge-preparation/consumers.mjs',
  'scripts/knowledge-preparation/export-candidate.mjs',
  'scripts/knowledge-preparation/evaluate-candidate.mjs',
  'scripts/knowledge-preparation/acceptance.test.mjs',
  'apps/api/src/plugins.ts',
  'test-data/knowledge-preparation/v0.1.0/contract.schema.json',
];
const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, await hashFile(resolve(root, path))])));
await writeJson(resolve(artifactDirectory, 'manifest.json'), {
  sourceBaseCommit: await sourceBaseCommit(),
  dirtyCandidate: true,
  nodeVersion: process.version,
  files: sourceHashes,
  runtimeInputSha256: await hashFile(inputPath),
  acceptanceLabelSha256: await hashFile(labelPath),
  candidateSha256: await hashFile(baselineCandidatePath),
  reportSha256: await hashFile(baselineReportPath),
  heldOut: false,
  independentReviewer: null,
});
console.log(`KPR development acceptance artifacts: ${artifactDirectory}`);
