---
status: resolved
gap_id: G-01-2-drag
---

# Open panel does not follow avatar drag

User supersedes previous hide-on-form criterion: avatar may remain visible when the open window follows its movement.

## Evidence

- avatar.js moveTo mutates host left/top only; no movement callback.
- widget.css .panel uses position:fixed and panel.js place sets independent viewport left/top.
- main.js invokes place in render and resize only. render calls panel.render, which replaces children and focuses fields.
- setFormOpen hides and makes avatar-wrap inert during paste/preview, preventing drag there.

## Root cause

Avatar movement does not notify panel positioning. Reusing render for drag would unnecessarily recreate inputs and disturb caret/focus. Previous visibility requirement now conflicts with the user's revised criterion.

## Fix direction

Keep avatar visible and active. Notify main on position changes; call only panel.place for open panel. Preserve clamp and click suppression. Test real browser movement with open menu, howto, paste, preview and confirmation, including viewport edges and resize.

Diagnosis and planning performed inline per Codex skill adapter; no subagents dispatched. No product files changed.

## Resolution

01-06 executed; current automated suites pass. User confirmed `pass` for the revised drag checkpoint; all five phase UAT tests pass.
