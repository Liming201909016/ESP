const consumerTasks = {
  'CON-SEC-REVIEW-AGENT': {
    bindingCode: 'CB-DRAFT-KP-SEC',
    kind: 'PermissionReview',
    fields: ['permissions'],
  },
  'CON-ARCH-REVIEW': {
    bindingCode: 'CB-DRAFT-KP-ARCH',
    kind: 'ArchitectureBrief',
    fields: ['system', 'region'],
  },
};

function questionsFor(preparation) {
  return [
    ...preparation.package.gaps.map(reference => ({ reason: 'Gap', reference })),
    ...preparation.package.conflicts.map(conflict => ({ reason: 'Conflict', reference: conflict.field })),
    ...preparation.package.limitations.map(reference => ({ reason: 'Limitation', reference })),
  ];
}

function consume(preparation, consumerCode) {
  const task = consumerTasks[consumerCode];
  if (!task || preparation?.consumerCode !== consumerCode || preparation.consumerBindingCode !== task.bindingCode) {
    throw new Error('Preparation package is not bound to this experimental Consumer');
  }
  const factIds = preparation.package.facts
    .filter(fact => task.fields.includes(fact.field))
    .map(fact => fact.factId);

  return {
    messageType: 'consumerOutput',
    experiment: 'knowledge-preparation',
    contractVersion: '0.1.0',
    caseId: preparation.caseId,
    consumerCode,
    consumerBindingCode: task.bindingCode,
    packageInvocationId: preparation.invocationId,
    outcome: preparation.outcome,
    status: 'Draft',
    humanReviewRequired: true,
    items: factIds.length ? [{ kind: task.kind, factIds }] : [],
    questions: questionsFor(preparation),
  };
}

export function consumeForSecurityReview(preparation) {
  return consume(preparation, 'CON-SEC-REVIEW-AGENT');
}

export function consumeForArchitectureReview(preparation) {
  return consume(preparation, 'CON-ARCH-REVIEW');
}
