import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { consumeForArchitectureReview, consumeForSecurityReview } from './consumers.mjs';
import { canonicalJson, prepareKnowledge, sourceHash } from './runtime.mjs';

const fixtures = JSON.parse(await readFile(new URL('../../test-data/knowledge-preparation/v0.1.0/runtime-inputs.json', import.meta.url), 'utf8'));
const labels = JSON.parse(await readFile(new URL('../../test-data/knowledge-preparation/v0.1.0/acceptance-labels.json', import.meta.url), 'utf8'));
const execute = (fixture, overrides = {}) => prepareKnowledge(fixture.request, { consumerCode: 'CON-SEC-REVIEW-AGENT', adapterHarness: fixture.adapterHarness, ...overrides });

for (const fixture of fixtures.cases) {
  test(`content-derived preparation ${fixture.request.caseId}`, async () => {
    const expected = labels.cases.find(label => label.caseId === fixture.request.caseId);
    const actual = await execute(fixture);
    assert.equal(actual.outcome, expected.outcome);
    assert.deepEqual(actual.package.gaps, expected.gaps);
    assert.deepEqual(actual.package.conflicts.map(conflict => conflict.field), expected.conflictFields);
    assert.deepEqual(actual.package.limitations, expected.limitations);
    assert.equal(actual.errors[0]?.category ?? null, expected.errorCategory);
    assert.deepEqual(actual.package.facts.map(fact => {
      const evidence = actual.evidence.find(item => item.evidenceId === fact.evidenceIds[0]);
      const source = fixture.request.sources.find(item => item.sourceId === evidence.sourceId);
      assert.equal(evidence.contentHash, sourceHash(source.body));
      assert.equal(evidence.sourceVersion, source.sourceVersion);
      return { field: fact.field, value: fact.value, sourceId: evidence.sourceId, locator: evidence.locator };
    }), expected.facts);
    assert.equal(actual.events.some(event => event.operation === 'IgnoreUntrustedInstruction'), expected.injectionIgnored);
    for (const sourceId of expected.forbiddenReadSourceIds) assert.equal(actual.events.some(event => event.operation === 'Read' && event.outcome === 'Success' && event.sourceId === sourceId), false);
  });

  test(`two real Consumers use the shared package ${fixture.request.caseId}`, async () => {
    const securityPreparation = await prepareKnowledge(fixture.request, {
      consumerCode: 'CON-SEC-REVIEW-AGENT',
      adapterHarness: fixture.adapterHarness,
    });
    const architecturePreparation = await prepareKnowledge(fixture.request, {
      consumerCode: 'CON-ARCH-REVIEW',
      adapterHarness: fixture.adapterHarness,
    });
    const securityOutput = consumeForSecurityReview(securityPreparation);
    const architectureOutput = consumeForArchitectureReview(architecturePreparation);

    assert.notEqual(securityPreparation.correlationId, architecturePreparation.correlationId);
    assert.notEqual(securityPreparation.invocationId, architecturePreparation.invocationId);
    assert.notEqual(securityOutput.consumerBindingCode, architectureOutput.consumerBindingCode);
    assert.deepEqual(securityPreparation.pins, architecturePreparation.pins);
    assert.equal(securityOutput.packageInvocationId, securityPreparation.invocationId);
    assert.equal(architectureOutput.packageInvocationId, architecturePreparation.invocationId);
    assert.equal(securityOutput.outcome, securityPreparation.outcome);
    assert.equal(architectureOutput.outcome, architecturePreparation.outcome);
    assert.equal(securityOutput.humanReviewRequired, true);
    assert.equal(architectureOutput.humanReviewRequired, true);

    const assertConsumerReferences = (output, preparation, expectedKind, fields) => {
      const facts = new Map(preparation.package.facts.map(fact => [fact.factId, fact]));
      const evidenceIds = new Set(preparation.evidence.map(item => item.evidenceId));
      for (const item of output.items) {
        assert.equal(item.kind, expectedKind);
        for (const factId of item.factIds) {
          const fact = facts.get(factId);
          assert.ok(fact);
          assert.ok(fields.includes(fact.field));
          assert.ok(fact.evidenceIds.every(evidenceId => evidenceIds.has(evidenceId)));
        }
      }
      const expectedQuestions = [
        ...preparation.package.gaps.map(reference => `Gap:${reference}`),
        ...preparation.package.conflicts.map(conflict => `Conflict:${conflict.field}`),
        ...preparation.package.limitations.map(reference => `Limitation:${reference}`),
      ];
      assert.deepEqual(output.questions.map(question => `${question.reason}:${question.reference}`), expectedQuestions);
      if (preparation.outcome !== 'Success') assert.notEqual(output.outcome, 'Success');
    };

    assertConsumerReferences(securityOutput, securityPreparation, 'PermissionReview', ['permissions']);
    assertConsumerReferences(architectureOutput, architecturePreparation, 'ArchitectureBrief', ['system', 'region']);
    if (fixture.request.caseId === 'KP-001') {
      assert.deepEqual(securityOutput.items.map(item => item.kind), ['PermissionReview']);
      assert.deepEqual(architectureOutput.items.map(item => item.kind), ['ArchitectureBrief']);
      assert.notDeepEqual(securityOutput.items[0].factIds, architectureOutput.items[0].factIds);
    }
  });
}

test('canonical source hash matches the independently computed vector', () => {
  assert.equal(sourceHash(fixtures.cases[0].request.sources[0].body), 'bb33bf8a650b6a29203a02cdb81d7597b6f112d6624bbdc286dcca809cd2b046');
  assert.equal(canonicalJson({ nested: { region: 'x', permissions: ['Reader'] }, system: 'app' }), '{"nested":{"permissions":["Reader"],"region":"x"},"system":"app"}');
  assert.throws(() => canonicalJson({ value: Infinity }));
});

test('source changes affect facts without consulting expected labels or case identity', async () => {
  const changed = structuredClone(fixtures.cases[0]);
  changed.request.caseId = 'not-an-outcome-selector';
  changed.request.sources[0].body.region = 'eastus';
  const result = await execute(changed);
  assert.equal(result.outcome, 'Success');
  assert.equal(result.package.facts.find(fact => fact.field === 'region').value, 'eastus');
  assert.notEqual(result.package.sources[0].sha256, sourceHash(fixtures.cases[0].request.sources[0].body));
});

test('denial prevents adapter execution and denies unknown access by default', async () => {
  const fixture = structuredClone(fixtures.cases[3]);
  delete fixture.adapterHarness.access.restricted;
  let calls = 0;
  const response = await execute(fixture, { documentAdapter: { read() { calls += 1; throw new Error('must not run'); } } });
  assert.equal(response.outcome, 'RejectedByPolicy');
  assert.equal(calls, 0);
  assert.equal(JSON.stringify(response).includes('DENIED-CONTENT-MUST-NOT-LEAK'), false);
  assert.deepEqual(response.package.sources, []);
});

test('adapter exceptions produce bounded failures without exception content', async () => {
  const response = await execute(fixtures.cases[0], { documentAdapter: { read() { throw new Error('sensitive-adapter-detail'); } } });
  assert.equal(response.outcome, 'Failed');
  assert.equal(JSON.stringify(response).includes('sensitive-adapter-detail'), false);
});

test('malformed adapter returns fail closed without leaking unexpected content', async () => {
  const response = await execute(fixtures.cases[0], {
    documentAdapter: { read() { return { documents: [{ unexpected: 'adapter-content-must-not-leak' }] }; } },
  });
  assert.equal(response.outcome, 'Failed');
  assert.equal(response.errors[0].category, 'DependencyFailure');
  assert.deepEqual(response.package.sources, []);
  assert.deepEqual(response.package.facts, []);
  assert.equal(JSON.stringify(response).includes('adapter-content-must-not-leak'), false);
});

test('unsupported requested field values become gaps without becoming facts', async () => {
  const fixture = structuredClone(fixtures.cases[0]);
  fixture.request.sources[0].body.system = { nested: 'unsupported' };
  fixture.request.sources[0].body.permissions = ['Reader', 7];
  const response = await execute(fixture);
  assert.equal(response.outcome, 'NeedsInformation');
  assert.deepEqual(response.package.gaps, ['system', 'permissions']);
  assert.deepEqual(response.package.facts.map(fact => fact.field), ['region']);
  assert.equal(response.errors[0].category, 'MissingEvidence');
});

test('conflicts take precedence over gaps while preserving both', async () => {
  const fixture = structuredClone(fixtures.cases[4]);
  delete fixture.request.sources[0].body.permissions;
  const response = await execute(fixture);
  assert.equal(response.outcome, 'CannotAssess');
  assert.deepEqual(response.package.gaps, ['permissions']);
  assert.deepEqual(response.package.limitations, ['MissingMaterial', 'ConflictingFacts']);
});

test('request rejects expected labels and duplicate source identities', async () => {
  const extra = structuredClone(fixtures.cases[0]);
  extra.request.expected = { outcome: 'Success' };
  await assert.rejects(() => execute(extra), /Invalid draft request shape/);
  const duplicate = structuredClone(fixtures.cases[0]);
  duplicate.request.sources.push(structuredClone(duplicate.request.sources[0]));
  await assert.rejects(() => execute(duplicate), /Duplicate source identity/);
});