const fs = require('node:fs');
const path = require('node:path');

const moduleRoot = process.argv[2];

function loadPackage(packagePath) {
  if (moduleRoot) {
    return require(path.join(moduleRoot, packagePath));
  }
  return require(packagePath);
}

const Ajv2020 = loadPackage('ajv/dist/2020');
const addFormats = loadPackage('ajv-formats');
const express = loadPackage('express');

async function main() {
  const root = path.resolve(__dirname, '..');
  const schema = JSON.parse(
    fs.readFileSync(
      path.join(root, 'docs', '05-Asset-Standards', 'schemas', 'logical-skill-contract.schema.json'),
      'utf8',
    ),
  );
  const examples = JSON.parse(
    fs.readFileSync(
      path.join(root, 'docs', '05-Asset-Standards', 'examples', 'logical-skill-contract-examples.json'),
      'utf8',
    ),
  );

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (!validate(examples.valid[0])) {
    throw new Error(`Ajv rejected a canonical valid request: ${ajv.errorsText(validate.errors)}`);
  }
  if (validate(examples.invalid[0])) {
    throw new Error('Ajv accepted a canonical invalid request');
  }

  const app = express();
  app.get('/health', (_request, response) => {
    response.json({ status: 'healthy', schemaCompiled: true });
  });
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = await response.json();
    if (!response.ok || body.status !== 'healthy' || body.schemaCompiled !== true) {
      throw new Error(`Unexpected health response: ${JSON.stringify(body)}`);
    }
    console.log(`Technical feasibility smoke: PASS (Node ${process.version}, port ${address.port})`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});