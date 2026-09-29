# Pre-Step-20 UX + Local Guide Cleanup

Status: **complete and published as production Site version 40 on 2026-09-29.** This is an unnumbered cleanup pass; Step 20 has not started.

## Navigation and Guide entry

- The dedicated **Small-body regions** shortcut was removed from the main view controls because it substantially duplicated **System View**. The statistical population renderer, Settings toggle and internal fitted overview capability remain intact.
- The accessible scale/exaggeration disclosure now sits beside **System View** and explains both enlarged/compressed world presentation and representative small-body markers.
- **Astronomy guide** now appears directly after **Explore this world** in the selected-world desktop actions and directly beside it in the mobile action grid. The existing Guide panel and Live AI architecture are unchanged.

## Deterministic Local guide

- Presets are generated for the selected object. Reviewed temperature and mission prompts appear only where curated topic packs exist; water/ice appears where the reviewed text supports it; day/rotation/orbit and Earth-distance prompts appear only where meaningful.
- Weak location presets such as **Where am I?** and **What objects are nearest to me?** are no longer promoted as buttons. Their typed-question support remains available.
- Simulation time, rotation/orbit and modeled-distance answers now lead with the requested information in natural language. Snapshot semantics, data quality and technical notes remain under **Sources & data**.
- Preset buttons still call `answerContextGuide()` directly in the browser. They do not call `/api/guide`, reserve D1 quota, retrieve external sources or consume Live AI allowance.

## Verification

- Targeted Guide/UI regressions pass.
- Production build, lint and all 113 automated tests pass.
- The managed visual-preview controller was unavailable; this targeted structural/content pass is covered by component contracts and does not claim new WebGL visual acceptance.
