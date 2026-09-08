# Contributing

## Workflow

Keep `main` deployable. Create a short-lived branch for each change, open a pull request, and merge only after automated checks and any relevant browser or device review pass.

Use focused commits with an imperative summary, such as `Improve Saturn travel framing`. Do not commit generated build output, dependency folders, editor state, credentials, or unrelated changes.

## Before requesting review

Run:

```bash
npm test
npm run lint
```

For changes to rendering or interaction, also check:

- world selection from the scene, search, and destination strip;
- assisted travel, cancellation, and focus/system views;
- keyboard, mouse, touch, and reduced-motion behavior as applicable;
- details, comparison, settings, help, and guide panels;
- narrow mobile and wide desktop layouts;
- both WebGL and Canvas compatibility paths when renderer behavior changes.

## Project conventions

- Keep scientific calculations in `app/astronomy.ts` and cover new calculations with tests.
- Keep renderer and camera behavior in the scene layer rather than DOM components.
- Label illustrative or simplified behavior clearly in the interface and documentation.
- Cite primary astronomy sources for new factual content.
- Preserve the existing Sites project identifier and hosting bindings.
- Treat deployment as a separate, deliberate step after merge.

## Security and privacy

Never commit API keys, tokens, passwords, private keys, personal data, or environment files. Browser-delivered code cannot safely contain a secret. New paid or external services require a server-side boundary, rate limiting, a cost limit, and an explicit product decision before integration.

See [SECURITY.md](SECURITY.md) for reporting and response guidance.
