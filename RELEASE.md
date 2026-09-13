# Release policy

`LeMouf/konitif-tools` is the sole release authority for `@konitif/tools`.

Publication requires a `v<package version>` tag contained in `main`, a green
validation workflow, the protected `npm-release` environment, npm Trusted
Publishing and `TOOLS_NPM_PUBLISH_ENABLED=true`.

The workflow must build, test and verify the exact archive before publishing it
with provenance. A merge, documentation edit or local archive is not evidence
of publication. Already published versions and tags are immutable; subsequent
changes require a new package version.
