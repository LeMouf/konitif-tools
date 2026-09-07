# @konitif/tools

Public, product-neutral contracts for reusable KONITIF tools.

The package owns tool module identity, capability declarations, implementation bindings and module registration. It does not own product profiles, Svelte components, application stores or Maxtronics behavior policy.

Generic tools accept state through explicit ports and emit intents. Product packages bind those ports to their own authorities.

## Development

With Node.js 22 or newer and npm installed:

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run verify:package
```

The package provides ESM JavaScript and TypeScript declarations, and references
the published Core package rather than its source checkout.

## Licence

[PolyForm Noncommercial 1.0.0](LICENSE.md) during v0.x.
Source-available, not OSI open source. Commercial use requires a separate written licence.
