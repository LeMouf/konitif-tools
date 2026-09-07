# Independent Tools baseline

This first commit establishes @konitif/tools 0.284.1 from the existing KONITIF workspace on 2026-09-07, preserving its module declaration, binding and registry contracts. No mixed-workspace history or company package source is imported.

Core is referenced as npm 0.284.2, not copied into source. TypeScript 5.9.3 is the sole development dependency. CI validates build, tests and archive consumption; it does not publish.

Existing workspace consumers and editing authority have not migrated. This baseline is not an official ecosystem release or a commercial licence grant.
