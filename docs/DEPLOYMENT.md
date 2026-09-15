# Deployment

## Current production path

The application is hosted as a ChatGPT Site backed by Cloudflare Workers. `.openai/hosting.json` contains the existing opaque Sites project identifier and declares optional resource bindings. That identifier is project metadata, not an API credential, and should remain committed so future deployments update the same Site.

The current audience is public link access. Deployment must preserve that audience unless the product owner explicitly requests a permission change.

The production build is created with:

```bash
npm ci
npm test
```

`npm test` runs the verified production build and the automated tests. The Sites packaging flow then publishes the built application and static assets from the exact committed source revision. Production publication is intentionally performed through ChatGPT Work/Sites rather than from GitHub Actions, so no Sites credential needs to be stored in GitHub.

## GitHub automation

`.github/workflows/ci.yml` validates every pull request and every push to `main` with Node.js 22. It does not deploy, write to the repository, or require secrets.

Recommended release flow:

1. Create a short-lived branch from `main`.
2. Make one focused change and update tests or documentation where needed.
3. Open a pull request and wait for the `Build and test` check.
4. Review the rendered experience for visual or control changes.
5. Merge the pull request into `main`.
6. Publish the tested commit through the existing Sites project when a production update is intended.
7. Add a version tag for meaningful stable releases.

Merging to `main` does not automatically change the live Site. This separation makes accidental production deployments less likely.

## Environment variables and secrets

The current version needs no secrets. If a future server-side integration is added:

- store production values in the Sites environment settings;
- use GitHub Actions secrets only for workflows that genuinely require them;
- expose only deliberately public values to browser code;
- provide a redacted `.env.example` containing names and safe placeholders, never real values;
- rotate a credential immediately if it is committed or pasted into an issue.

Do not place tokens in Git remote URLs, `.openai/hosting.json`, source files, test fixtures, screenshots, or documentation.

## Rollback

Git tags identify stable source baselines. Sites also retains saved versions. If a release fails, redeploy the last known-good saved version, then fix the issue on a new branch. Avoid rewriting published `main` history.

## Step 14 verified release — 2026-09-14

Public version 12 successfully deployed source `e71ab9961a12e754e02ca6f201742b6dae623f4f`. Deployment `appgdep_6aa7f542ef948191ab439fbcb85ecd13` reports `succeeded`; public access is preserved. The resumed audit verified build, lint and 40/40 tests. The saved deployment already succeeded before resumption, so it was reused without duplicate publication.

The canonical continuity documents are current. The optional private GitHub document mirror remains behind following its earlier automatic approval rejection; it is not the production source.
