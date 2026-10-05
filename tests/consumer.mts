import { defineKonitifToolModule, bindKonitifToolModule, KonitifToolModuleRegistry, mountKonitifToolSurface, type KonitifToolSurfaceImplementation } from '@konitif/tools';
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

// No DOM or framework types are required by the portable surface contract.
const surface: KonitifToolSurfaceImplementation<number, { zoom: number }, { projection: { read(): number } }> = {
  requiredServices: ['projection'],
  mount(context) {
    const target: number = context.target;
    const value: number = context.services.projection.read();
    void target; void value;
    return { dispose() {} };
  }
};
const mounted = await mountKonitifToolSurface(surface, {
  target: 1, state: { zoom: 1 }, services: { projection: { read: () => 2 } }
});
if (mounted.status === 'mounted') await mounted.instance.dispose();
// @ts-expect-error Undeclared service requirements must not type-check.
const invalidRequirement: typeof surface.requiredServices = ['missing'];
void invalidRequirement;
