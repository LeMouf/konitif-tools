# @konitif/tools

Portable tool definitions, capability declarations and explicit implementation
bindings for KONITIF hosts.

## Installation

```sh
npm install @konitif/tools
```

## What it provides

- Portable tool module identity and capability contracts.
- Explicit bindings between a definition and its implementation.
- Framework-neutral surface mounting contracts with explicit service requirements
  and occurrence-scoped cleanup.
- An instance-scoped module registry.
- Pure input-binding resolvers for keyboard, controller and soundboard signals.

## Authority boundary

This package owns tool definitions and their explicit bindings. It does not own
domain profiles, UI components, host state, device listeners or the effects of
resolved actions. Hosts admit modules and route emitted intents to the relevant
domain authority.

The host owns surface placement and when to mount or dispose. A surface borrows
host services; it releases only resources it creates for its occurrence. Service
presence checks do not establish compatibility, permissions or trust. This
contract does not acquire packages or replace extension admission.

## Quick start

```ts
import {
  KonitifToolModuleRegistry,
  bindKonitifToolModule,
  defineKonitifToolModule,
} from '@konitif/tools';

const module = defineKonitifToolModule({
  id: 'example.inspector',
  name: 'Inspector',
  capability: 'inspection',
  definition: { kind: 'inspector' },
});
const binding = bindKonitifToolModule({
  module,
  loadComponent: async () => ({ mount: () => undefined }),
});
const registry = new KonitifToolModuleRegistry();
registry.register(module);
```

### Mount an explicitly loaded surface

An implementation can satisfy `KonitifToolSurfaceImplementation` without
depending on a UI framework or a particular host. Use the existing binding to
load it, then explicitly request mounting:

```ts
import { mountKonitifToolSurface } from '@konitif/tools';

const surface = {
  requiredServices: ['projection'] as const,
  mount(context: {
    target: { slot: string };
    state: { zoom: number };
    services: { projection: { read(): number } };
  }) {
    // A platform-specific implementation renders into context.target here.
    return { dispose() { /* Release occurrence-owned resources. */ } };
  },
};
const result = await mountKonitifToolSurface(surface, {
  target: { slot: 'main' },
  state: { zoom: 1 },
  services: { projection: { read: () => 42 } },
});
if (result.status === 'mounted') await result.instance.dispose();
```

Results distinguish missing services (`refused`), mounting errors (`failed`)
and a mounted occurrence. Repeated disposal shares one cleanup operation;
cleanup failures reject that operation rather than being silently ignored.
If mounting fails partway through, the implementation must clean up its partial
setup before throwing. If an asynchronous mount completes after its host has
closed, the host must dispose the returned instance instead of attaching it.
This helper neither restores host state nor starts an execution sandbox.

## Public entry points

| Entry | Purpose |
| --- | --- |
| `@konitif/tools` | Tool definitions, bindings and registry. |
| `@konitif/tools/input` | Pure input contracts and action-resolution helpers. |

## Reference

See [`reference/`](reference/) for the machine-readable capability catalog and
authority diagrams.

## License

Source-available under [PolyForm Noncommercial 1.0.0](LICENSE.md), not OSI open
source. Commercial use requires separate written authorization.
