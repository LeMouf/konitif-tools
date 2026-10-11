# GitDiagram architecture — @konitif/tools

This architecture view was generated from the public repository by [GitDiagram](https://gitdiagram.com/lemouf/konitif-tools) on 2026-09-20 18:45:57 UTC.

It is a documentation projection of the repository tree, README, and source files sampled by GitDiagram. It does not replace the authored contracts in [catalog.json](catalog.json) and [diagrams.json](diagrams.json), nor does it establish runtime authority.

The Mermaid source keeps GitDiagram's groups, nodes, relationships, and source links. GitDiagram's forced color classes and HTML line breaks are omitted so the diagram remains readable in local previews and dark themes.

- Public repository: [konitif-tools](https://github.com/LeMouf/konitif-tools)
- Interactive diagram: [Open in GitDiagram](https://gitdiagram.com/lemouf/konitif-tools)

## Architecture diagram

```mermaid
flowchart TD

subgraph group_contracts["Tool Contracts"]
  node_tool_module["Tool Module — [index.ts]"]
  node_core_factory["Core Manifest Factory"]
end

subgraph group_lifecycle["Module Lifecycle"]
  node_implementation_binding["Implementation Binding — [index.ts]"]
  node_module_registry["Module Registry — [index.ts]"]
end

subgraph group_inputs["Input Resolution"]
  node_binding_resolver["Binding Resolver — [input.ts]"]
  node_action_resolver["Action Resolver — [input.ts]"]
  node_action_invocation["Action Invocation — [input.ts]"]
end

node_host(("KONITIF Host"))
node_input_adapters(("Input Adapters"))
node_domain_authority(("Domain Authority"))

node_host -->|"defines module"| node_tool_module
node_tool_module -->|"defines manifest"| node_core_factory
node_host -->|"binds implementation"| node_implementation_binding
node_host -->|"registers module"| node_module_registry
node_host -->|"queries modules"| node_module_registry
node_host -->|"loads component"| node_implementation_binding
node_implementation_binding -->|"returns component"| node_host
node_input_adapters -->|"reports signals"| node_host
node_host -->|"applies overrides"| node_binding_resolver
node_binding_resolver -->|"returns bindings"| node_host
node_host -->|"matches signal"| node_action_resolver
node_action_resolver -->|"creates invocation"| node_action_invocation
node_action_resolver -->|"returns invocation"| node_host
node_host -->|"routes intents"| node_domain_authority

click node_tool_module "https://github.com/lemouf/konitif-tools/blob/main/src/index.ts"
click node_implementation_binding "https://github.com/lemouf/konitif-tools/blob/main/src/index.ts"
click node_module_registry "https://github.com/lemouf/konitif-tools/blob/main/src/index.ts"
click node_binding_resolver "https://github.com/lemouf/konitif-tools/blob/main/src/input.ts"
click node_action_resolver "https://github.com/lemouf/konitif-tools/blob/main/src/input.ts"
click node_action_invocation "https://github.com/lemouf/konitif-tools/blob/main/src/input.ts"

```

## Generated analysis

@konitif/tools is a portable contract library for defining KONITIF tool modules, binding implementations, registering modules, and resolving input signals into action invocations. The principal workflow is host definition, explicit implementation binding, registry admission, then input override and signal resolution before the host routes resulting intents to domain authority. The package does not own UI, device listeners, host state, profiles, or effects. Wiring beyond the sampled TypeScript and README authority boundary is intentionally omitted.
