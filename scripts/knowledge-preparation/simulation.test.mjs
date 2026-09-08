import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const directory = resolve(tmpdir(), `esp-kpr-simulation-${process.pid}`);
const valueEvaluator = new URL('./evaluate-value-measurements.mjs', import.meta.url);
const publicationSimulator = new URL('./simulate-publication.mjs', import.meta.url);
const handoffSimulator = new URL('./simulate-handoff.mjs', import.meta.url);
const writeJson = (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const run = (script, args) => spawnSync(process.execPath, [fileURLToPath(script), ...args], { encoding: 'utf8' });
const caseIds = ['WKP-001', 'WKP-002', 'WKP-003', 'WKP-004', 'WKP-005', 'WKP-006', 'WKP-007'];
const consumers = ['CON-SEC-REVIEW-AGENT', 'CON-ARCH-REVIEW'];

await rm(directory, { recursive: true, force: true });
await mkdir(directory, { recursive: true });

function simulatedMeasurements() {
  return {
    simulation: true,
    measured: false,
    rows: caseIds.flatMap(caseId => consumers.flatMap(consumerCode => [
      { caseId, consumerCode, mode: 'PerConsumerBaseline', integrationMinutes: 20, maintenanceMinutes: 10, analystMinutes: 9, correctionCount: 1, acceptableOutput: true, authorizationFailures: 0, citationFailures: 0 },
      { caseId, consumerCode, mode: 'SharedPreparation', integrationMinutes: 8, maintenanceMinutes: 4, analystMinutes: 7, correctionCount: 1, acceptableOutput: true, authorizationFailures: 0, citationFailures: 0 },
    ])),
  };
}

function simulatedCandidate() {
  const pins = { implementationVersion: 'knowledge-preparation-draft-0.1.0', plugins: { 'PLG-DOC-SOURCE': '1.0.0', 'PLG-EVIDENCE': '1.0.0' } };
  return {
    cases: caseIds.map(caseId => ({
      caseId,
      preparationResponses: [
        { consumerBindingCode: 'CB-DRAFT-KP-SEC', pins },
        { consumerBindingCode: 'CB-DRAFT-KP-ARCH', pins },
      ],
    })),
  };
}

await test('Knowledge Preparation full handoff simulation mechanics', async t => {
  const measurementPath = resolve(directory, 'measurements.json');
  const valueReportPath = resolve(directory, 'value-report.json');
  await writeJson(measurementPath, simulatedMeasurements());

  await t.test('simulated value protocol passes only explicit threshold checks', async () => {
    const result = run(valueEvaluator, [measurementPath, valueReportPath]);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const report = JSON.parse(await readFile(valueReportPath, 'utf8'));
    assert.equal(report.status, 'SimulationValuePass');
    assert.equal(report.decision, 'SimulationContinue');
    assert.equal(report.measured, false);
    const failedMeasurements = simulatedMeasurements();
    failedMeasurements.rows[0].authorizationFailures = 1;
    const failedPath = resolve(directory, 'measurements-failed.json');
    await writeJson(failedPath, failedMeasurements);
    const failed = run(valueEvaluator, [failedPath, resolve(directory, 'value-report-failed.json')]);
    assert.notEqual(failed.status, 0);
  });

  await t.test('publication rehearsal activates and rolls back only in simulation', async () => {
    const candidatePath = resolve(directory, 'candidate.json');
    const acceptancePath = resolve(directory, 'acceptance.json');
    const outputPath = resolve(directory, 'publication.json');
    await writeJson(candidatePath, simulatedCandidate());
    await writeJson(acceptancePath, { status: 'SimulationAcceptancePass', simulation: true, heldOut: false });
    const result = run(publicationSimulator, [candidatePath, acceptancePath, valueReportPath, outputPath]);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const report = JSON.parse(await readFile(outputPath, 'utf8'));
    assert.equal(report.status, 'SimulationPublicationRehearsalPass');
    assert.equal(report.publicationPerformed, false);
    assert.equal(report.azureDeploymentPerformed, false);
    assert.equal(report.lifecycle.at(-1).state, 'SimulationRolledBack');
    const invalidCandidate = simulatedCandidate();
    invalidCandidate.cases[0].preparationResponses[0].pins.plugins['PLG-DOC-SOURCE'] = 'Latest';
    const invalidPath = resolve(directory, 'candidate-invalid.json');
    await writeJson(invalidPath, invalidCandidate);
    const invalid = run(publicationSimulator, [invalidPath, acceptancePath, valueReportPath, resolve(directory, 'publication-invalid.json')]);
    assert.notEqual(invalid.status, 0);
  });

  await t.test('one-command handoff simulation preserves every real-world boundary', async () => {
    const externalDirectory = resolve(directory, 'one-command');
    await mkdir(externalDirectory, { recursive: true });
    const runtimeInputBytes = await readFile(resolve(import.meta.dirname, '..', '..', 'test-data', 'knowledge-preparation', 'v0.1.0', 'runtime-inputs.json'));
    const labelBytes = await readFile(resolve(import.meta.dirname, '..', '..', 'test-data', 'knowledge-preparation', 'v0.1.0', 'acceptance-labels.json'));
    await writeFile(resolve(externalDirectory, 'runtime-inputs.reviewer-seed.json'), runtimeInputBytes);
    await writeFile(resolve(externalDirectory, 'acceptance-labels.simulated.json'), labelBytes);
    await writeJson(resolve(externalDirectory, 'reviewer-manifest.simulated.json'), {
      protocolVersion: '0.1.0',
      reviewer: 'SIMULATED-Wenxian',
      simulation: true,
      independentOfImplementation: false,
      heldOut: false,
      caseCount: 7,
      runtimeInputSha256: createHash('sha256').update(runtimeInputBytes).digest('hex'),
      acceptanceLabelSha256: createHash('sha256').update(labelBytes).digest('hex'),
    });
    await writeJson(resolve(externalDirectory, 'value-measurements.simulated.json'), simulatedMeasurements());

    const result = run(handoffSimulator, [externalDirectory]);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const summary = JSON.parse(await readFile(resolve(externalDirectory, 'simulation-summary.json'), 'utf8'));
    assert.equal(summary.status, 'SimulationHandoffPass');
    assert.equal(summary.formalAcceptanceCompleted, false);
    assert.equal(summary.measuredValueCompleted, false);
    assert.equal(summary.publicationPerformed, false);
    assert.equal(summary.gitOperationsPerformed, false);
    assert.equal(summary.azureDeploymentPerformed, false);
    assert.equal(summary.operationalReviewStoreChanged, false);
    assert.equal(summary.steps.acceptance.status, 'SimulationAcceptancePass');
    assert.equal(summary.steps.value.decision, 'SimulationContinue');
    assert.equal(summary.steps.publication.lifecycle.at(-1).state, 'SimulationRolledBack');
    assert.equal(summary.steps.azure.operation, 'NotExecuted');
    assert.equal(summary.steps.azure.hostedSmoke, 'NotRun');
  });
});
