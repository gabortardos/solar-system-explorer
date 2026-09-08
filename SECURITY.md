# Security

## Reporting a problem

Do not open a public issue containing a credential, private user data, or an exploitable security detail. Report it privately to the repository owner through the private collaboration channel used for this project. Include the affected version, reproduction steps, impact, and any safe supporting evidence.

If a secret may have been exposed, revoke or rotate it first. Removing it from the latest commit is not enough because Git history, caches, logs, and forks may retain it.

## Current security posture

The current prototype has no login, database, paid API, analytics SDK, or application-managed secret. Progress is stored locally in the browser. External links open with `noreferrer` protection.

Dependencies and browser-facing code should still be reviewed regularly. Security fixes should receive a focused pull request, automated validation, and a deliberate production deployment.

## Supported versions

Until the project adopts a formal release policy, only the latest deployed version receives security fixes.
