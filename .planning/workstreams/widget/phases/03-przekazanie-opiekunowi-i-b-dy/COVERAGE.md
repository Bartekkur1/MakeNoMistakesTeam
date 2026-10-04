# API Coverage — BezpiecznaAura frozen report API

> Full coverage by default. Opt-outs are explicit, reasoned decisions. Baseline enumerates the frozen CONTRACT.md endpoint surface and the additional tracked API routes visible in this checkout; this extension implements only operations authorized for its purpose and extension scope. Opt-outs follow locked D-00/D-04/D-14, not silent omissions.

| capability | decision | reason |
|---|---|---|
| POST /api/auth/login (scope extension) | INTEGRATE | Parent options login and bounded silent renewal, 03-01; teachers show 403. |
| POST /api/reports | INTEGRATE | Four-field reviewed send and validated saved receipt, 03-01 transport + 03-02 child path. |
| GET /api/reports?limit=10 | INTEGRATE | On-demand latest ten status rows, 03-03, including reports created by the panel. |
| GET /api/auth/me | OPT-OUT | D-11 requires local-only session reads; expiry/401 renewal happens only during an explicit operation, without this extra API call. |
| POST /api/auth/login (scope panel) | OPT-OUT | D-08 fixes extension scope; panel authentication belongs to web-app and would grant forbidden child capabilities. |
| GET /api/reports cursor pagination | OPT-OUT | D-14 fixes latest ten with no more-page control; the list does not follow next_cursor. |
| GET /api/reports state filtering | OPT-OUT | D-14 asks for all visible latest reports; no state filter UI is authorized. |
| GET /api/reports/{id} | OPT-OUT | Frozen extension scope forbids details/history/comments; child receives status only under D-14. |
| POST /api/reports/{id}/transitions | OPT-OUT | Parent/teacher panel operation; extension cannot transition reports. |
| POST /api/reports/{id}/comments | OPT-OUT | Parent/teacher discussion is not visible to the child and is forbidden for extension scope. |
| DELETE /api/reports/{id}/comments/{commentId} | OPT-OUT | Author-only panel comment deletion is outside child extension capabilities. |
| GET /api/health | OPT-OUT | D-04 explicitly forbids a health request before sending; transport outcomes classify errors directly. |
| OPTIONS preflight | OPT-OUT | Backend CORS/browser infrastructure owns preflight; no client-authored preflight call or new backend route is needed. |
| GET /api/roblox-accounts | OPT-OUT | Additional tracked web-app integration route; Roblox account linking is outside this extension phase and its token scope. |
| POST /api/roblox-accounts | OPT-OUT | Parent panel links Roblox nicknames; D-00 forbids extending this widget's report/login contract. |
| POST /api/reports/ingest | OPT-OUT | Roblox game-server ingestion uses a server secret; never an extension capability or a client secret. |

No logout endpoint exists. Local logout is integrated via trusted credential deletion (D-12), not represented as an invented API capability. The API detector was run over the real Phase 03 roadmap section plus the three plan bodies and returned detected:true. The existing backend/schema remains read-only; no API or storage migration is planned.

Orchestrator decision record: endorse the above opt-outs as the locked extension-scope/full-surface subtraction record. No extra integration or new automated tests are proposed.
