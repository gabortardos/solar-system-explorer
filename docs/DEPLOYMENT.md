# Deployment

## Current production path

The application is hosted as a ChatGPT Site backed by Cloudflare Workers. `.openai/hosting.json` contains the existing opaque Sites project identifier and declares optional resource bindings. That identifier is project metadata, not an API credential, and should remain committed so future deployments update the same Site.

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
