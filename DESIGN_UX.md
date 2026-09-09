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

Keep the center open. Avoid new persistent panels without strong value. Show one clear travel action. Use sheets for details, guide, settings, and help. Keep status labels specific. Never imply exploration scale or curved travel is scientifically literal.

## Navigation behavior

Users must retain two travel modes:

- **Assisted travel:** select a body, press “Travel to,” watch a safe cinematic approach.
- **Free flight:** direct keyboard/mouse/touch control.

- Manual input cancels assisted travel.
- Space/Escape or brake stops travel.
- “Focus target” recovers local orientation.
- “System view” provides global context.
- Search and destination strip choose the same target model.
- Reduced-motion travel is immediate and understandable.

Planned improvement: smooth acceleration/deceleration, constrained distance-aware speed, and calmer steering without removing direct control.

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

- Use a right-side sheet so the scene remains visible.
- Adapt facts to object type; omit meaningless fields.
- Put description and essential facts before atmosphere/fact/distance/source.
- Distance comparison identifies endpoints, units, AU/light time, and limitations.
- Sources open safely in a new tab.
- State clearly when the guide is offline/curated rather than live AI.
- Scientific disclaimers may be quieter but remain readable.

## Interaction patterns

- Command search: `Cmd/Ctrl + K` plus visible search.
- Scene selection: click/tap visible body or label.
- Destination strip: persistent access to all V1.1 worlds.
- Sheets: details, guide, settings, controls.
- Switches: scientific distances, orbits, labels, reduced motion.
- Selects: comparison object and time speed.
- Touch: large controls, drag/pinch, on-screen movement cluster.
- Selected, visited, active, disabled, and error states do not rely only on color.

## Responsive behavior

- Desktop is the initial priority.
- At narrow widths, simplify the destination card, hide nonessential header text, horizontally scroll/snap the world strip, show touch flight controls, and respect safe areas.
- Avoid horizontal page scrolling and text overlap.
- Preserve travel, details, search, guide, settings/help, and time/scale meaning.

## Accessibility

- Preserve semantic labels, visible focus, and keyboard-operable controls.
- Respect `prefers-reduced-motion` and the explicit reduced-motion setting.
- Maintain high contrast and scalable text.
- Do not encode state only by hue.
- Future audio requires mute and captions/transcripts where relevant.

## Visual upgrade rules for V1.2

- Improve lighting, Sun, stars, materials, Earth atmosphere/night side, Saturn rings, orbit lines, shadows, and transitions incrementally.
- Inspect rendering after each material camera/lighting group of changes.
- Protect performance on modern consumer hardware.
- Keep effects scientifically honest and document illustrative behavior.
- Preserve the established HUD unless a verified conflict requires adjustment.

