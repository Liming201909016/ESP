import { readFile, writeFile } from 'node:fs/promises';

const [measurementPath, reportPath] = process.argv.slice(2);
if (!measurementPath || !reportPath) {
  throw new Error('Usage: evaluate-value-measurements.mjs <measurements.json> <report.json>');
}

const measurements = JSON.parse(await readFile(measurementPath, 'utf8'));
const caseIds = ['WKP-001', 'WKP-002', 'WKP-003', 'WKP-004', 'WKP-005', 'WKP-006', 'WKP-007'];
const consumers = ['CON-SEC-REVIEW-AGENT', 'CON-ARCH-REVIEW'];
const modes = ['PerConsumerBaseline', 'SharedPreparation'];
const expectedKeys = caseIds.flatMap(caseId => consumers.flatMap(consumerCode => modes.map(mode => `${caseId}|${consumerCode}|${mode}`)));
const rows = Array.isArray(measurements.rows) ? measurements.rows : [];
const observedKeys = rows.map(row => `${row.caseId}|${row.consumerCode}|${row.mode}`);
const unique = new Set(observedKeys);
const assertions = [];
const check = (name, passed, detail) => assertions.push({ name, passed: Boolean(passed), detail });

check('simulation declaration', measurements.simulation === true && measurements.measured === false, 'Measurements must remain explicitly simulated and unmeasured');
check('row cardinality', rows.length === expectedKeys.length && unique.size === expectedKeys.length, 'Exactly 28 unique paired rows are required');
check('row identities', expectedKeys.every(key => unique.has(key)) && observedKeys.every(key => expectedKeys.includes(key)), 'Every case, Consumer, and mode combination must occur exactly once');
check('row values', rows.every(row => ['integrationMinutes', 'maintenanceMinutes', 'analystMinutes', 'correctionCount', 'authorizationFailures', 'citationFailures'].every(field => Number.isFinite(row[field]) && row[field] >= 0)
  && typeof row.acceptableOutput === 'boolean'), 'All metric values must be non-negative and acceptableOutput must be boolean');

const forMode = mode => rows.filter(row => row.mode === mode);
const baseline = forMode('PerConsumerBaseline');
const shared = forMode('SharedPreparation');
const effort = selected => selected.reduce((total, row) => total + row.integrationMinutes + row.maintenanceMinutes, 0);
const acceptableRate = selected => selected.length ? selected.filter(row => row.acceptableOutput).length / selected.length : 0;
const baselineEffort = effort(baseline);
const sharedEffort = effort(shared);
const maintenanceReduction = baselineEffort > 0 ? (baselineEffort - sharedEffort) / baselineEffort : 0;
const baselineAcceptableRate = acceptableRate(baseline);
const sharedAcceptableRate = acceptableRate(shared);
const authorizationFailures = rows.reduce((total, row) => total + row.authorizationFailures, 0);
const citationFailures = rows.reduce((total, row) => total + row.citationFailures, 0);

check('authorization failures', authorizationFailures === 0, 'Authorization failures must be zero');
check('citation failures', citationFailures === 0, 'Citation failures must be zero');
check('acceptable output rate', sharedAcceptableRate >= baselineAcceptableRate, 'Shared preparation must not reduce acceptable-output rate');
check('effort reduction', maintenanceReduction >= 0.3, 'Combined integration and maintenance effort must decrease by at least 30%');

const passed = assertions.every(item => item.passed);
const report = {
  simulation: true,
  measured: false,
  status: passed ? 'SimulationValuePass' : 'SimulationValueFail',
  decision: passed ? 'SimulationContinue' : 'SimulationRevise',
  metrics: {
    rowCount: rows.length,
    baselineEffortMinutes: baselineEffort,
    sharedEffortMinutes: sharedEffort,
    effortReduction: maintenanceReduction,
    baselineAcceptableOutputRate: baselineAcceptableRate,
    sharedAcceptableOutputRate: sharedAcceptableRate,
    authorizationFailures,
    citationFailures,
  },
  thresholds: {
    minimumEffortReduction: 0.3,
    acceptableOutputRateRegressionAllowed: false,
    maximumAuthorizationFailures: 0,
    maximumCitationFailures: 0,
  },
  assertions,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Knowledge Preparation value simulation: ${report.status} (${report.decision}, ${(maintenanceReduction * 100).toFixed(1)}% effort reduction)`);
if (!passed) process.exitCode = 1;
