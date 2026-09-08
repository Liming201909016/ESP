import { readFile } from 'node:fs/promises';
import { consumeForArchitectureReview, consumeForSecurityReview } from './consumers.mjs';
import { prepareKnowledge } from './runtime.mjs';

const fixtures = JSON.parse(await readFile(new URL('../../test-data/knowledge-preparation/v0.1.0/runtime-inputs.json', import.meta.url), 'utf8'));
const responses = [];
const consumerOutputs = [];

for (const fixture of fixtures.cases) {
  const securityResponse = await prepareKnowledge(fixture.request, {
    consumerCode: 'CON-SEC-REVIEW-AGENT',
    adapterHarness: fixture.adapterHarness,
  });
  const architectureResponse = await prepareKnowledge(fixture.request, {
    consumerCode: 'CON-ARCH-REVIEW',
    adapterHarness: fixture.adapterHarness,
  });
  responses.push(securityResponse, architectureResponse);
  consumerOutputs.push(consumeForSecurityReview(securityResponse), consumeForArchitectureReview(architectureResponse));
}

process.stdout.write(JSON.stringify({ responses, consumerOutputs }));
