import { defineKonitifToolModule, bindKonitifToolModule, KonitifToolModuleRegistry } from '@konitif/tools';
const module = defineKonitifToolModule({ id: 'external', name: 'External', capability: 'inspect', definition: { ready: true } });
const binding = bindKonitifToolModule({ module, loadComponent: async () => 'component' });
const ready: boolean = binding.definition.ready;
const registry = new KonitifToolModuleRegistry();
registry.register(module);
void ready;
