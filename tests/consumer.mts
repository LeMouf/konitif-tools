import { defineKonitifToolModule, bindKonitifToolModule, KonitifToolModuleRegistry } from '@konitif/tools';
import { resolveInteractionInputActions, type InteractionInputSignal } from '@konitif/tools/input';
const module = defineKonitifToolModule({ id: 'external', name: 'External', capability: 'inspect', definition: { ready: true } });
const binding = bindKonitifToolModule({ module, loadComponent: async () => 'component' });
const ready: boolean = binding.definition.ready;
const registry = new KonitifToolModuleRegistry();
registry.register(module);
const signal: InteractionInputSignal = { source: 'keyboard', controlId: 'Space', phase: 'press' };
const actionId: string | undefined = resolveInteractionInputActions([
  { id: 'play', actionId: 'play', source: 'keyboard', controlId: 'Space', phase: 'press' }
], signal)[0]?.actionId;
void ready;
void actionId;
