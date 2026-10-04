---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 2
total_count: 3
last_updated: 2026-10-03T21:56:45.069Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | unrun-verify | web-app/scripts/smoke-api.mjs |  | 01-06 Task 2 C3 (local PERSIST OK after dev restart) and C4 (two parallel smoke runs, concurrent ok) not reported by the human; Heroku PERSIST OK was reported | open |  | 2026-10-03T18:59:22.505Z |  |
| 2 | 02 | stub | web-app/src/app/panel/page.tsx | 4 | /panel renders only the Zgłoszenia heading; plan 02-02 replaces the body with ReportListView (PAN-01) | fixed |  | 2026-10-03T21:40:33.745Z | 2026-10-03T21:47:40.369Z |
| 3 | 02 | stub | web-app/src/app/_panel/ReportListView.tsx | 63 | /panel list: empty account shows an empty card and only the first page loads; plan 02-03 adds empty states, skeletons, pagination, filter, refresh and the risk marker (PAN-01) | fixed |  | 2026-10-03T21:47:49.846Z | 2026-10-03T21:56:45.069Z |

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
  },
  {
    "id": 2,
    "kind": "stub",
    "phase": "02",
    "file": "web-app/src/app/panel/page.tsx",
    "line": 4,
    "description": "/panel renders only the Zgłoszenia heading; plan 02-02 replaces the body with ReportListView (PAN-01)",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-10-03T21:40:33.745Z",
    "resolved_at": "2026-10-03T21:47:40.369Z",
    "milestone": null
  },
  {
    "id": 3,
    "kind": "stub",
    "phase": "02",
    "file": "web-app/src/app/_panel/ReportListView.tsx",
    "line": 63,
    "description": "/panel list: empty account shows an empty card and only the first page loads; plan 02-03 adds empty states, skeletons, pagination, filter, refresh and the risk marker (PAN-01)",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-10-03T21:47:49.846Z",
    "resolved_at": "2026-10-03T21:56:45.069Z",
    "milestone": null
  }
]
````
