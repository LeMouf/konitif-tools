import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bindKonitifToolModule, defineKonitifToolModule, mountKonitifToolSurface } from '../dist/index.js';

const context = () => ({ target: { slot: 'panel' }, state: { zoom: 1 }, services: { projection: {} } });

test('surface contract has no framework, host or product imports', () => {
  const source = readFileSync(new URL('../src/surface.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /^import\s/m);
  assert.doesNotMatch(source, /HTMLElement|Svelte|Workbench|window\.|document\./);
});

test('binding a portable surface does not load or mount it', async () => {
  let loads = 0; let mounts = 0;
  const surface = { requiredServices: ['projection'], mount: () => { mounts++; return { dispose() {} }; } };
  const module = defineKonitifToolModule({ id: 'example.surface', name: 'Surface', capability: 'projection', definition: {} });
  const binding = bindKonitifToolModule({ module, loadComponent: async () => { loads++; return surface; } });
  assert.equal(loads, 0); assert.equal(mounts, 0);
  const result = await mountKonitifToolSurface(await binding.loadComponent(), context());
  assert.equal(result.status, 'mounted'); assert.equal(loads, 1); assert.equal(mounts, 1);
  await result.instance.dispose();
});

test('missing services are refused before mount, without inferring providers', async () => {
  let calls = 0;
  const surface = { requiredServices: ['projection'], mount: () => { calls++; return { dispose() {} }; } };
  for (const services of [{}, { projection: undefined }, { projection: null }, Object.create({ projection: {} })]) {
    const result = await mountKonitifToolSurface(surface, { ...context(), services });
    assert.deepEqual(result, { status: 'refused', reason: 'missing-services', missingServices: ['projection'] });
  }
  assert.equal(calls, 0);
});

test('target, state and caller-owned services reach the implementation unchanged', async () => {
  const input = context(); let actual;
  const result = await mountKonitifToolSurface({ requiredServices: ['projection'], mount: received => {
    actual = received; return { dispose() {} };
  } }, input);
  assert.equal(result.status, 'mounted'); assert.equal(actual, input);
  await result.instance.dispose();
  assert.equal(input.services.projection !== undefined, true);
});

test('mount errors are explicit for synchronous and asynchronous implementations', async () => {
  const cause = new Error('renderer unavailable');
  for (const mount of [() => { throw cause; }, async () => { throw cause; }]) {
    const result = await mountKonitifToolSurface({ requiredServices: [], mount }, context());
    assert.equal(result.status, 'failed'); assert.equal(result.reason, 'mount-failed'); assert.equal(result.cause, cause);
  }
});

test('a mounted surface must supply its cleanup contract', async () => {
  const result = await mountKonitifToolSurface({ requiredServices: [], mount: () => ({}) }, context());
  assert.equal(result.status, 'failed'); assert.equal(result.reason, 'mount-failed');
});

test('concurrent and repeated disposal share one cleanup operation', async () => {
  let cleanups = 0; let release;
  const waiting = new Promise(resolve => { release = resolve; });
  const result = await mountKonitifToolSurface({ requiredServices: [], mount: () => ({
    async dispose() { cleanups++; await waiting; }
  }) }, context());
  const first = result.instance.dispose(); const second = result.instance.dispose();
  assert.equal(first, second); release(); await first; await result.instance.dispose();
  assert.equal(cleanups, 1);
});

test('cleanup failures are observable and are not silently retried', async () => {
  let cleanups = 0; const cause = new Error('cleanup failed');
  const result = await mountKonitifToolSurface({ requiredServices: [], mount: () => ({
    dispose() { cleanups++; throw cause; }
  }) }, context());
  await assert.rejects(result.instance.dispose(), error => error === cause);
  await assert.rejects(result.instance.dispose(), error => error === cause);
  assert.equal(cleanups, 1);
});

test('occurrences own independent cleanup even when they share an implementation', async () => {
  let cleanups = 0;
  const surface = { requiredServices: [], mount: async () => ({ dispose() { cleanups++; } }) };
  const first = await mountKonitifToolSurface(surface, context());
  const second = await mountKonitifToolSurface(surface, context());
  assert.notEqual(first.instance, second.instance);
  await first.instance.dispose(); assert.equal(cleanups, 1);
  await second.instance.dispose(); assert.equal(cleanups, 2);
});
