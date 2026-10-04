# Phase 3 reward desktop Play evidence

Tester: Codex using Roblox Studio MCP desktop Play
Timestamp (UTC): 2026-10-04T02:26:57Z (tracer observation)
Target: approved merged placeId 74400324861465; current Studio ID ca0f265b-7094-4d55-9dbc-4441e4d21ef5.
Scope: desktop Studio Play only; mobile deferred.

| Check | Status | Runtime evidence |
|---|---|---|
| safe_refusal_reward | OBSERVED | Actual approach and client RequestAction refuse/refuse_final reached ending_good. One blue/dark-blue shield with gold rim attached to back; live screenshot Phase3-shield-fixed-back shows exact D-39 beside chat and the city visible. Clicked ResultSummaryFrame.ReplayButton through desktop mouse tool. |
| assisted_quiz_parity | PENDING | Help plus wrong quiz answers followed by safe refusal |
| failed_replay_pass | PENDING | Same reward after previous failed attempt |
| pass_replay_fail | PENDING | Reward survives replay and later failure; exact D-40 |
| respawn_restoration | PENDING | Reward returns after CharacterAdded |
| no_duplicate | PENDING | Exactly one named accessory after repeated passing and restore |
| first_burst_only | PENDING | Gold emission for two seconds at first grant only |

Build checks are recorded separately and never substitute for runtime observations.

Tracer static checks: Selene 0 errors/warnings, StyLua exit 0, offline Rojo build /private/tmp/Phase3-reward-tracer.rbxlx.
Runtime fix: WeldConstraint left decorative pieces at their previous positions when AddAccessory attached the Handle. Replaced with explicit Weld.C0 offsets; live part distances (0.028–0.680 studs from Handle) and screenshot confirm assembled shield. Modern avatar attachment creates AccessoryRigidConstraint, rather than AccessoryWeld.
