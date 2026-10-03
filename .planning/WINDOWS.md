---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-10-03T18:59:22.505Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | unrun-verify | web-app/scripts/smoke-api.mjs |  | 01-06 Task 2 C3 (local PERSIST OK after dev restart) and C4 (two parallel smoke runs, concurrent ok) not reported by the human; Heroku PERSIST OK was reported | open |  | 2026-10-03T18:59:22.505Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "01",
    "file": "web-app/scripts/smoke-api.mjs",
    "line": null,
    "description": "01-06 Task 2 C3 (local PERSIST OK after dev restart) and C4 (two parallel smoke runs, concurrent ok) not reported by the human; Heroku PERSIST OK was reported",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-03T18:59:22.505Z",
    "resolved_at": null,
    "milestone": null
  }
]
````
