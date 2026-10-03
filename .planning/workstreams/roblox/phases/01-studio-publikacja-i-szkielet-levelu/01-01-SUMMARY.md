---
phase: 01-studio-publikacja-i-szkielet-levelu
plan: 01
subsystem: roblox
tags: [roblox, rojo, rokit, studio, backup, rbxm]

requires: []
provides:
  - Place1 pre-rojo backup (.rbxl)
  - ScamerinoAlertinio legacy model export (.rbxm)
  - MarketplaceLobby model export (.rbxm)
  - Rojo default build project and script-only live sync project
  - Toolchain pinning via Rokit (Rojo 7.7.1, Selene 0.32.0, StyLua 2.5.2)
  - Official publishing audit and NO-GO decision with Play Solo fallback (01-PUBLISHING.md)
affects: [01-02-PLAN, roblox]

actuals:
  tokens: 15000
  tasks: 3
  commits: 3

tech-stack:
  added: [rokit 1.2.0, rojo 7.7.1, selene 0.32.0, stylua 2.5.2]
  patterns: [offline place build with Workspace vs live-sync omitting Workspace]

key-files:
  created:
    - roblox/backups/Place1-pre-rojo.rbxl
    - roblox/assets/ScamerinoAlertinio-legacy.rbxm
    - roblox/assets/MarketplaceLobby.rbxm
    - roblox/default.project.json
    - roblox/sync.project.json
    - roblox/README.md
  modified:
    - .planning/workstreams/roblox/phases/01-studio-publikacja-i-szkielet-levelu/01-PUBLISHING.md

key-decisions:
  - "Declared publication NO-GO due to individual creator account status, youth safety requirements, and moderation latency; activated Studio Play Solo and demo recording fallback per D-10."
  - "Configured sync.project.json without Workspace node so Rojo live sync never overwrites manually authored Studio geometry."

requirements-completed:
  - RBX-01

coverage:
  - id: D1
    description: "Pre-Rojo recovery copy and legacy model export preserve initial scene"
    requirement: RBX-01
    verification:
      - kind: manual_procedural
        ref: "test -s roblox/backups/Place1-pre-rojo.rbxl && test -s roblox/assets/ScamerinoAlertinio-legacy.rbxm"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exported MarketplaceLobby model with ScammerNPC ProximityPrompt"
    requirement: MIS-01
    verification:
      - kind: integration
        ref: "test -s roblox/assets/MarketplaceLobby.rbxm"
        status: pass
    human_judgment: false
  - id: D3
    description: "Full place build from repository with Rojo"
    requirement: RBX-01
    verification:
      - kind: integration
        ref: "rojo build default.project.json -o build/Phase1.rbxlx"
        status: pass
    human_judgment: false

duration: 35min
completed: 2026-10-03
status: complete
---

# Plan 01-01 Summary: Studio, Publikacja i Bezpieczne Granice Rojo

Resolved publication risk (RBX-01) with documented NO-GO and Studio Play Solo fallback, safeguarded manual Place1 geometry, and established build-safe vs sync-safe Rojo boundaries.

## Accomplishments
- Pinned and verified development toolchain: Rokit 1.2.0, Rojo 7.7.1, Selene 0.32.0, StyLua 2.5.2.
- Created pre-Rojo Place1 recovery backup (`roblox/backups/Place1-pre-rojo.rbxl`, 180 KB) and exported legacy Scamerino asset (`roblox/assets/ScamerinoAlertinio-legacy.rbxm`, 88 KB).
- Built and exported `roblox/assets/MarketplaceLobby.rbxm` containing `ScammerNPC` with `HumanoidRootPart.ProximityPrompt` and `Humanoid.DisplayName = 'FreeRobux_Giver'`.
- Verified authoritative scene hierarchy in Studio: `Workspace.MarketplaceLobby.ScammerNPC.HumanoidRootPart.ProximityPrompt` and `Workspace.MissionStart`.
- Established `default.project.json` for full offline place build and `sync.project.json` for live-sync (omitting Workspace to protect manual scene edits per D-05).
- Recorded full publishing audit in `01-PUBLISHING.md` confirming NO-GO for public group experience and establishing the Studio Play Solo demo workflow per D-10.

## Task Commits
1. **Task 1: Pin tools and record official publishing rules** - `b8ad64c`
2. **Task 2: Safeguard Place1 backup and export MarketplaceLobby model** - `e632a13`
3. **Task 3: Configure Rojo build and live-sync graphs with Studio baseline** - `630ad51`
