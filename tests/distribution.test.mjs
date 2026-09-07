import test from 'node:test';
import assert from 'node:assert/strict';
import { defineKonitifToolModule, bindKonitifToolModule, KonitifToolModuleRegistry } from '../dist/index.js';

const make = () => defineKonitifToolModule({
  id: 'sample.tool', name: 'Sample tool', capability: ' inspection ',
  definition: { kind: 'sample' }, contributions: [{ id: ' sample.command ', kind: 'command' }]
});

test('declares a product-neutral module without requiring a visual runtime', () => {
  const module = make();
  assert.equal(module.capability, 'inspection');
  assert.equal(module.scope, 'generic');
  assert.equal(module.implementationBindingKey, module.id);
  assert.deepEqual(module.contributions, [{ id: 'sample.command', kind: 'command' }]);
  assert.ok(Object.isFrozen(module));
  assert.ok(Object.isFrozen(module.contributions[0]));
});

test('binding and registration do not execute the component loader', async () => {
  let calls = 0;
  const module = make();
  const binding = bindKonitifToolModule({ module, loadComponent: async () => { calls++; return 'component'; } });
  const registry = new KonitifToolModuleRegistry();
  registry.register(module);
  assert.equal(calls, 0);
  assert.equal(binding.definition, module.definition);
  assert.equal(await binding.loadComponent(), 'component');
  assert.equal(calls, 1);
});

test('duplicate admission fails without replacing the registered module', () => {
  const registry = new KonitifToolModuleRegistry();
  const module = make();
  registry.register(module);
  assert.throws(() => registry.register(make()), /Duplicate/);
  assert.equal(registry.get(module.id), module);
  const list = registry.list(); list.length = 0;
  assert.equal(registry.list().length, 1);
  assert.equal(registry.get('missing'), undefined);
});

test('missing capability or implementation definition is refused', () => {
  assert.throws(() => defineKonitifToolModule({ id: 'sample', name: 'Sample', capability: ' ' }), /capability/);
  const module = defineKonitifToolModule({ id: 'sample', name: 'Sample', capability: 'inspect' });
  assert.throws(() => bindKonitifToolModule({ module, loadComponent: async () => null }), /no implementation definition/);
});
