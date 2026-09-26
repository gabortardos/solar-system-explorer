# Solar System Explorer — Design and UX Language

## Visual direction

The visual thesis is **restrained scientific futurism**: dark, cinematic, premium, minimal, and immersive. It should feel informed by scientific visualization, modern planetariums, and space exploration games without copying any product.

The worlds and the depth of space are the stars of the interface. UI should support orientation and learning, then recede.

### Preserve

- Near-black space with cool, muted interface colors.
- Pale mint/blue accents used sparingly for active navigation and primary actions.
- Subtle borders, translucency, depth, and restrained glow.
- Realistic or scientifically plausible planetary materials.
- Clear light/dark separation on bodies, atmospheric edge effects, and readable silhouettes.
- Motion that communicates travel, scale, and focus.

### Avoid

- Cartoon planets or toy-like proportions presented as realism.
- Excessive neon, cheap cyberpunk, fake holograms, and decorative sci-fi clutter.
- Generic SaaS dashboards, large card grids, or marketing hero pages.
- Excessive glass panels and glow competing with planets.
- Huge text blocks over the 3D scene.
- Unmotivated motion, lens effects, or audio.

## Typography

- Current stack: Arial/Helvetica/system sans-serif.
- Use regular/light-feeling weights for large destination names and headings.
- Use uppercase, letter-spaced eyebrow labels for small system categories.
- Main explanatory copy should be at least 16 px where layout permits.
- Regular controls should normally be at least 14 px; reserve 12–13 px for metadata.
- Maintain strong line height and contrast; allow text enlargement without overlap.
- Avoid novelty sci-fi fonts that reduce readability.

## Interface principles

1. The application opens on the exploration surface.
2. The first meaningful choice is a destination, not a configuration screen.
3. Selecting a target and starting travel remain separate actions.
4. Essential flight status is always understandable in plain language.
5. Scientific qualifications are visible near affected values/settings.
6. Panels reveal depth without removing the sense of place.
7. A non-gamer has an obvious assisted path and a reliable recovery action.

## HUD rules

Current desktop composition:

- Brand and utilities at the top.
- Search centered near the top.
- Invitation and view tools on the left.
- Selected-destination card on the right.
- Flight status and control hints near the lower left.
- Destination strip, guide entry, scale note, and time controls along the bottom.

Keep the center open. Avoid new persistent panels without strong value. Show one clear travel action. Use sheets for details, guide, settings, and help. Keep status labels specific. Name the modes **Exploration Scale** and **Scientific Scale**. State that body sizes remain enlarged and that assisted travel is visual. Every numerical scientific value must come from the uncompressed astronomy model in both modes.

## Navigation behavior

Desktop now offers Hide interface / Show controls without browser fullscreen, plus a sticky Back to space action in sheets. Labels use opaque dark backplates without underlines. Orbit paths have higher baseline contrast while focus remains emphasized. Explicit 1 day/second and 30 days/second modes are educational timelapse; fast-satellite frame skipping is disclosed.

Users must retain two travel modes:

- **Assisted travel:** select a body, press “Travel to,” watch a safe cinematic approach.
- **Free flight:** direct keyboard/mouse/touch control.

- Manual input cancels assisted travel.
- Space/Escape or brake stops travel.
- “Focus target” recovers local orientation.
- “System view” provides global context.
- Search and the primary destination strip choose the same target model. The strip intentionally remains the ten-entry overview; major moons are found through search or their visible parent system so the HUD does not become a 29-item ribbon.
- Reduced-motion travel is immediate and understandable.

Current V1.2 implementation eases acceleration/deceleration and steering while retaining direct controls, distance-aware speed and the 8× boost. Combined movement axes are normalized so diagonal input is not faster. Brake remains immediate; physical-device feel and tuning still require validation.

## Small-body population regions

- Use sparse one-pixel statistical markers, never an opaque torus, haze, debris wall or glowing field.
- Keep Asteroid Belt, Kuiper Belt and Jupiter Trojan L4/L5 colors muted and subordinate to destinations.
- Whenever markers are visible, show an accessible legend stating that each marker is representative and that size and density are greatly enhanced.
- Population markers are noninteractive background context. They do not receive names, cards, travel actions or implied object identities.
- The Settings switch is independent of World labels and survives overview/scale changes. Hiding the mobile HUD also hides the legend.

## Camera behavior

- Start near Earth with a legible full-body view.
- Avoid spawning inside or clipping through an enlarged body.
- Assisted travel shows departure, scale, and destination reveal, then settles into useful framing.
- Arrival distance may vary by body/rings but must not obscure the object or enter geometry.
- Use eased motion, not abrupt teleportation, except reduced-motion mode.
- Keep the focused object stable as its model position changes.
- User orbit/manual flight interrupts automation safely.
- System overview frames the system consistently in both renderers.

## Information panels

The Step 16 guide shows selected-object meaning, captured UTC time, explanation and separate sourced evidence. Old answers retain their captured subject rather than changing when a new world is selected. Clearly label free local mode and legacy-curated content; never imply selection equals arrival.

- Use a right-side sheet so the scene remains visible.
- Adapt facts to object type; omit meaningless fields.
- Keep the current desktop sheet at a compact maximum width of 440 px and scroll internally; on mobile it may occupy the viewport width but must remain dismissible over the full-bleed scene.
- Lead with name, type and parent when applicable. Put the short description and a dense two-column quantitative grid before qualitative sections, distance and source details.
- Show qualitative sections only when authored content exists. Use short scan-friendly headings and reserve the tinted emphasis treatment for one interesting fact.
- Distance comparison identifies endpoints, units, AU/light time, and limitations.
- The distance calculator remains inside the details sheet. Its target selector prioritizes Earth, Sun, the applicable parent and spacecraft before other active destinations, without duplicate choices.
- Mark the result as **Simulated position** or **Spacecraft estimate** and show its UTC timestamp. Use km below one million km, million km for larger values, and add AU only at Solar-System-scale distances.
- Show “Average orbital distance” only as a secondary semimajor-axis reference for a direct parent–child pair. Never let it visually replace the current simulated separation.
- Sources open safely in a new tab.
- State clearly when the guide is offline/curated rather than live AI.
- Scientific disclaimers may be quieter but remain readable.

## Interaction patterns

- Command search: `Cmd/Ctrl + K` plus visible search. Match exact names and aliases first, then prefixes and type/parent context.
- Search results show name, object type, and concise location context (“Solar System center” or “Orbits …”), with compact Show, Travel to, and Information actions.
- If an object lacks validated scene position/assets, keep Show and Travel visible but disabled with an honest explanation; Information remains available. Do not pretend a catalogue record is a rendered destination.
- Show moon labels and paths only for the focused parent system. This preserves visual hierarchy and performance; search remains the reliable global access path.
- Keep search results bounded and scrollable. On phones, the search dialog is anchored below the safe area with a bounded internal list, including while the keyboard is open; use one compact three-action row per result rather than covering the scene with permanent controls. Phone text inputs must compute to at least 16px so iOS does not magnify the page and strand the sheet exit offscreen.
- Scene selection: click/tap visible body or label.
- Destination strip: persistent access to all V1.1 worlds.
- Sheets: details, guide, settings, controls.
- Switches: scientific distances, orbits, labels, reduced motion.
- Selects: comparison object and time speed.
- Touch: large controls, drag/pinch, on-screen movement cluster.
- Selected, visited, active, disabled, and error states do not rely only on color.

## Responsive behavior

- Preserve the established desktop HUD.
- At widths up to 760 px, default to a slim brand/search/menu/hide header, two icon-only recovery/view controls, and one compact selected-world dock.
- Remove the large invitation, full destination card, permanent destination strip, time footer, and permanent arrow cluster from the mobile scene. Their capabilities remain available through search, the menu, settings, or the optional flight mode.
- The mobile menu is one bottom sheet, not several floating cards. It groups travel, details, flight, system view, focus, guide, settings, and the Exploration/Scientific scale choice.
- Touch flight controls appear only after the user selects Fly/Flight controls and collapse after assisted travel begins. Flight status appears with them.
- A hide-interface action removes all mobile HUD layers except a clear Show controls restore button.
- Respect safe areas and keep the scene full-bleed behind the compact HUD.
- Avoid horizontal page scrolling and text overlap.
- Preserve travel, details, search, guide, settings/help, and time/scale meaning.
- Keep the full UTC clock in the desktop footer and the mobile bottom sheet, not as another permanent phone overlay. Use tabular numerals so accelerated seconds do not shift nearby controls.
- Clock labels are plain language: Paused, Real time, 10×, 100×, 1,000×, 1 day / second and 30 days / second. The adjacent play/pause action resumes at real time. Use a stable native selector so accelerated clock rerenders cannot collapse the open choice list.

## Accessibility

- Preserve semantic labels, visible focus, and keyboard-operable controls.
- Respect `prefers-reduced-motion` and the explicit reduced-motion setting.
- Maintain high contrast and scalable text.
- Do not encode state only by hue.
- Future audio requires mute and captions/transcripts where relevant.

## VISUAL PASS #1 implementation

- Use a warm Sun point light, very restrained cool ambient fill, ACES Filmic tone mapping, and soft WebGL shadows. Night hemispheres must remain visibly dark.
- Use physically based materials for planets while keeping the Sun self-lit. Material roughness may vary by broad body type; do not imply measured surface BRDFs.
- Render the Sun as a textured emissive-looking sphere with a restrained layered corona. Do not add global bloom, lens flares, or pulsing effects.
- Earth night lights appear only on the unlit hemisphere. The atmosphere is strongest on the day-facing limb and remains subtle on the night limb. Clouds sit above the surface without flattening the terminator.
- Stars are deterministic decorative context, not a real star catalogue. Vary brightness and warm/cool tint subtly; avoid dense glitter or oversized points.
- Saturn rings use the existing alpha texture, physically based response, and shadow participation in WebGL. Compatibility rings prioritize smooth silhouettes and band structure over physical parity.
- Orbit lines stay thin, muted, and optional. The focused orbit may be clearer; nonfocused paths should recede. System overview must keep all ten bodies inside the useful scene area and away from the details panel.
- Assisted travel and system overview use quintic easing plus a small temporary field-of-view expansion. This is cinematic framing, not physical acceleration or an orbital trajectory.
- The Canvas compatibility renderer shares the same visual hierarchy through approximations: graded near-black space, strong terminators, restrained glows, night-light blending, smooth rings, and quiet orbits.
- Preserve the established HUD. Visual effects must not compete with worlds, reduce text contrast, or add decorative interface chrome.

## MOBILE HUD PASS implementation

- Mobile uses progressive disclosure because permanent controls were covering the Solar System on physical phones.
- The default state keeps most of the viewport unobstructed; the selected destination and primary Travel action remain one tap away.
- The open state uses a single translucent bottom sheet and gently lets the scene recede behind it.
- Phone-sized QA must check closed, menu-open, flight-open, hidden, and restored states. Desktop layout must be checked after every mobile HUD change.

## Future visual QA rules

- Protect performance on modern consumer hardware, especially when WebGL shadows are enabled.
- Verify Earth, Sun, Saturn, overview, assisted arrival, scientific scale, and reduced motion in both rendering paths before release.
- Perform physical-device mobile checks before treating responsive visual QA as complete.
- Keep effects scientifically honest and document illustrative behavior.

## Scientific data presentation (Step 8)

- Keep provenance secondary in a collapsible “Data sources and reliability” section within the existing details sheet; preserve the compact mobile HUD.
- Label solar radius/diameter as nominal and solar rotation as an approximate equatorial period; never imply rigid solar rotation.
- Distinguish reference gravity from a derived spherical estimate and disclose approximation limits next to distance comparisons.
- Unavailable scientific values render as unavailable/—, never zero, an invented default, or a loading value that resembles a measurement.
- Educational summaries, calculated positions and live observations must remain visibly distinct. Current lunar positions are illustrative; existing descriptions are curated educational copy.

## Minor-body exploration

- Reach the dedicated small-body catalogue from search; keep the existing compact sheet and mobile HUD. Lists scroll independently and details omit absent data.
- Keep the statistical-region exaggeration disclosure behind the labelled info control beside Small-body regions. It must remain keyboard and touch operable and close on a second activation.
- Show/Travel closes the sheet to reveal the scene. Only requested markers appear; one selected label states “illustrative orbit”. Neutral stone/ice marker colors are symbolic; no fabricated shape textures or comet tails.
- Keep NEO/PHA labels factual and understated. Nearby Earth shows its sampled simulation timestamp and whether the bounded sample is complete.


## Step 19 close-approach presentation

Existing selection, travel and scroll/pinch controls reveal progressively finer maps. Detail follows apparent size, with focus priority and hysteresis; textures fade through a small base during tier replacement. Technical renderer diagnostics stay out of the HUD. Saturn rings load naturally when exploring its moons. Titan stays an opaque hazy world. No landing controls or UI redesign. Compatibility views were inspected for all eight priority bodies; GPU/mobile sign-off remains open in `docs/STEP_19_CHECKPOINT.md`.
