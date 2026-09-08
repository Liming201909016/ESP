import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { consumeForArchitectureReview, consumeForSecurityReview } from './consumers.mjs';
import { prepareKnowledge } from './runtime.mjs';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: export-candidate.mjs <runtime-inputs.json> <candidate.json>');

if (process.env.KPR_LABEL_ACCESS_PROBE) {
  try {
    await readFile(process.env.KPR_LABEL_ACCESS_PROBE, 'utf8');
    throw new Error('Runtime label access was unexpectedly allowed');
  } catch (error) {
    if (error?.code !== 'ERR_ACCESS_DENIED') throw error;
  }
}

const inputBytes = await readFile(inputPath);
const fixtures = JSON.parse(inputBytes.toString('utf8'));
const cases = [];

for (const fixture of fixtures.cases) {
  const securityPreparation = await prepareKnowledge(fixture.request, {
    consumerCode: 'CON-SEC-REVIEW-AGENT',
    adapterHarness: fixture.adapterHarness,
  });
  const architecturePreparation = await prepareKnowledge(fixture.request, {
    consumerCode: 'CON-ARCH-REVIEW',
    adapterHarness: fixture.adapterHarness,
  });
  cases.push({
    caseId: fixture.request.caseId,
    preparationResponses: [securityPreparation, architecturePreparation],
    consumerOutputs: [
      consumeForSecurityReview(securityPreparation),
      consumeForArchitectureReview(architecturePreparation),
    ],
  });
}

const candidate = {
  experiment: 'knowledge-preparation',
  contractVersion: '0.1.0',
  exporterVersion: '0.1.0',
  runtimeInputSha256: createHash('sha256').update(inputBytes).digest('hex'),
  cases,
};
await writeFile(outputPath, `${JSON.stringify(candidate, null, 2)}\n`, 'utf8');
console.log(`Knowledge Preparation candidate export: ${cases.length} cases, labels inaccessible`);
