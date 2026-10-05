import {
  defineKonitifTool,
  type KonitifToolCapabilities,
  type KonitifToolManifest
} from '@konitif/core';

export {
  mountKonitifToolSurface,
  type KonitifToolSurfaceContext,
  type KonitifToolSurfaceImplementation,
  type KonitifToolSurfaceInstance,
  type KonitifToolSurfaceMountResult
} from './surface.js';

export type KonitifToolScope = 'generic' | 'product-specialization';
export type KonitifToolContributionKind = 'command' | 'widget' | 'surface' | 'adapter';

export interface KonitifToolContribution {
  id: string;
  kind: KonitifToolContributionKind;
}

export interface KonitifToolModule<TDefinition = unknown> {
  id: string;
  capability: string;
  scope: KonitifToolScope;
  manifest: KonitifToolManifest;
  capabilities: KonitifToolCapabilities;
  implementationBindingKey: string;
  definition?: TDefinition;
  contributions: readonly KonitifToolContribution[];
}

export interface DefineKonitifToolModuleInput<TDefinition = unknown> {
  id: string;
  name: string;
  capability: string;
  scope?: KonitifToolScope;
  description?: string;
  version?: string;
  capabilities?: Partial<KonitifToolCapabilities>;
  implementationBindingKey?: string;
  definition?: TDefinition;
  contributions?: readonly KonitifToolContribution[];
}

export interface KonitifToolImplementationBinding<TDefinition = unknown, TComponent = unknown> {
  module: KonitifToolModule<TDefinition>;
  definition: TDefinition;
  loadComponent: () => Promise<TComponent>;
}

export function defineKonitifToolModule<TDefinition = unknown>(
  input: DefineKonitifToolModuleInput<TDefinition>
): KonitifToolModule<TDefinition> {
  const manifest = defineKonitifTool({
    id: input.id,
    name: input.name,
    description: input.description,
    version: input.version,
    capabilities: {
      provides: input.capabilities?.provides ?? [],
      consumes: input.capabilities?.consumes ?? []
    },
    tags: [input.capability, input.scope ?? 'generic']
  });

  return Object.freeze({
    id: manifest.id,
    capability: normalizeRequiredText(input.capability, 'capability'),
    scope: input.scope ?? 'generic',
    manifest,
    capabilities: manifest.capabilities ?? { provides: [], consumes: [] },
    implementationBindingKey: normalizeRequiredText(
      input.implementationBindingKey ?? manifest.id,
      'implementation binding key'
    ),
    definition: input.definition,
    contributions: Object.freeze((input.contributions ?? []).map(normalizeContribution))
  });
}

export function bindKonitifToolModule<TDefinition, TComponent>(input: {
  module: KonitifToolModule<TDefinition>;
  definition?: TDefinition;
  loadComponent: () => Promise<TComponent>;
}): KonitifToolImplementationBinding<TDefinition, TComponent> {
  const definition = input.definition ?? input.module.definition;

  if (definition === undefined) {
    throw new Error(`Tool module "${input.module.id}" has no implementation definition.`);
  }

  return Object.freeze({
    module: input.module,
    definition,
    loadComponent: input.loadComponent
  });
}

export class KonitifToolModuleRegistry {
  private readonly modules = new Map<string, KonitifToolModule>();

  register(module: KonitifToolModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Duplicate KONITIF tool module id: "${module.id}".`);
    }

    this.modules.set(module.id, module);
  }

  get(moduleId: string): KonitifToolModule | undefined {
    return this.modules.get(moduleId);
  }

  list(): KonitifToolModule[] {
    return [...this.modules.values()];
  }
}

function normalizeContribution(contribution: KonitifToolContribution): KonitifToolContribution {
  return Object.freeze({
    id: normalizeRequiredText(contribution.id, 'contribution id'),
    kind: contribution.kind
  });
}

function normalizeRequiredText(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`Missing KONITIF tool ${field}.`);
  }

  return normalized;
}
