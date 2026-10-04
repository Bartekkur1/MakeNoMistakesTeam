---
mode: quick
quick_id: 261004-apq
autonomous: true
files_modified:
  - .github/workflows/release-widgetui.yml
  - projects/widget/README.md
---

Add a GitHub Action to release WidgetUI as an installable Chrome extension ZIP.

1. Add tag-triggered and manual workflow for existing widgetui-vX.Y.Z tags. Validate package/manifest versions, install locked dependencies, build against demo API, zip dist contents, create GitHub Release or replace the asset on rerun.
2. Document tags, version updates, manual execution and ZIP installation in projects/widget/README.md.
3. Validate YAML, build and inspect archive layout. Record completion in widget STATE.md and commit scoped artifacts separately from implementation.

<threat_model>
Release write access is restricted to this workflow; no custom secrets. Tag input is validated before checkout and passed to shell through an environment variable. Manual checkout targets refs/tags explicitly. Do not include sources, credentials, or node_modules in ZIP. No automated browser test additions, respecting the widget workstream decision.
</threat_model>

Verification: npm --prefix projects/widget run build; parse .github/workflows/release-widgetui.yml; inspect ZIP for root manifest.json and compiled extension files. GitHub publication itself requires a pushed tag and is outside local verification.
