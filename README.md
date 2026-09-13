# @konitif/tools

Product-neutral tool definitions, capability declarations and explicit
implementation bindings for KONITIF hosts.

## Installation

```sh
npm install @konitif/tools
```

## What it provides

- Portable tool module identity and capability contracts.
- Explicit bindings between a definition and its implementation.
- An instance-scoped module registry.
- Pure input-binding resolvers for keyboard, controller and soundboard signals.

## Authority boundary

This package owns tool definitions and their explicit bindings. It does not own
product profiles, UI components, application stores, device listeners or the
effects of resolved actions. Hosts admit modules and route emitted intents to
the appropriate product authority.

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
