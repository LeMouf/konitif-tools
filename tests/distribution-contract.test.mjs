import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('distribution locks only Core and the approved compiler', () => {
  const manifest = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  assert.equal(manifest.name, '@konitif/tools');
  assert.equal(manifest.version, lock.version);
  assert.equal(manifest.version, lock.packages[''].version);
  assert.deepEqual(manifest.dependencies, { '@konitif/core': '0.284.2' });
  assert.deepEqual(manifest.devDependencies, { typescript: '5.9.3' });
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies);
  assert.deepEqual(Object.keys(lock.packages).sort(), ['', 'node_modules/@konitif/core', 'node_modules/typescript']);
  assert.equal(lock.packages['node_modules/@konitif/core'].integrity, 'sha512-OcvBwJXrSWiRPU+pDBmeGsUikyhFqk1f0OlCpVWJfYbRC8xWICJTBBHh3vkIf/xSfR5lt3YZT0UTq1NoIdMSNQ==');
  assert.equal(lock.packages['node_modules/typescript'].integrity, 'sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==');
});

test('configuration has no monorepo inheritance or implicit publication', () => {
  const config = JSON.parse(read('tsconfig.json'));
  assert.equal(config.extends, undefined);
  assert.equal(config.compilerOptions.module, 'NodeNext');
  assert.deepEqual(config.compilerOptions.paths, {});
  const ci = read('.github/workflows/ci.yml');
  assert.match(ci, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/);
  assert.match(ci, /persist-credentials: false/);
  assert.match(ci, /npm ci --ignore-scripts/);
  assert.match(ci, /npm run verify:package/);
  assert.doesNotMatch(ci, /npm publish|id-token: write|setup-node/);
});
