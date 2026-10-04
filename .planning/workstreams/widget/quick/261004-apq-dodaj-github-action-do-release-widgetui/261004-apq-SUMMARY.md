---
status: complete
quick_id: 261004-apq
date: 2026-10-04
commit: fb6900b
---

Added .github/workflows/release-widgetui.yml and release instructions in projects/widget/README.md on branch quick/widgetui-release-action.

- Pushing widgetui-vX.Y.Z or manually selecting an existing tag builds the Chrome extension on Node 22 with locked dependencies and the demo API.
- Validates tag format and agreement with package.json and manifest.json versions before building.
- Publishes a ZIP of dist contents through GitHub CLI using GITHUB_TOKEN; reruns replace the existing release asset.
- Verification passed: local npm build, YAML parsing, bash syntax checks for every run step, ZIP integrity and root manifest / compiled file layout (13 entries), git diff --check.
- No new automated tests or unrelated test runs, following widget workstream decisions. GitHub-hosted execution/publication has not been performed locally.
- Implemented inline under the skill adapter's spawn restriction. Separate branch remains available for manual review; no push or merge performed.

Implementation commit: fb6900b.
