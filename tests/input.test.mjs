import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInteractionInputBindings, resolveInteractionInputActions } from '../dist/input.js';

test('input interpretation preserves action identity, normalizes modifiers and never executes', () => {
  const authored = Object.freeze([{ id: 'launch-key', actionId: 'launch', source: 'keyboard',
    controlId: 'Space', phase: 'press', modifiers: Object.freeze(['shift', 'control', 'shift']) }]);
  const resolved = resolveInteractionInputBindings(authored, [
    { bindingId: 'launch-key', source: 'soundboard', controlId: 'pad', actionId: 'injected' }
  ]);
  assert.equal(resolved[0].actionId, 'launch');
  assert.deepEqual(resolved[0].modifiers, ['control', 'shift']);
  assert.equal(authored[0].source, 'keyboard');
  const signal = { source: 'soundboard', controlId: 'pad', phase: 'press', modifiers: ['shift', 'control'] };
  const actions = resolveInteractionInputActions(resolved, signal);
  assert.deepEqual(actions, [{ actionId: 'launch', bindingId: 'launch-key', signal }]);
  assert.equal(actions[0].signal, signal);
  assert.deepEqual(resolveInteractionInputActions(resolved, { ...signal, repeat: true }), []);
  assert.deepEqual(resolveInteractionInputActions(resolved, { ...signal, phase: 'release' }), []);
});

test('last override wins, disabled bindings disappear and repeat requires admission', () => {
  const authored = [{ id: 'a', actionId: 'act', source: 'controller', controlId: 'button', phase: 'release' }];
  assert.deepEqual(resolveInteractionInputBindings(authored, [{ bindingId: 'a', enabled: false }]), []);
  const resolved = resolveInteractionInputBindings(authored, [
    { bindingId: 'a', enabled: false }, { bindingId: 'a', allowRepeat: true }
  ]);
  assert.equal(resolveInteractionInputActions(resolved,
    { source: 'controller', controlId: 'button', phase: 'release', repeat: true }).length, 1);
});
