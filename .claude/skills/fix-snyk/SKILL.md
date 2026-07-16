---
name: fix-snyk
description: >-
  Run Snyk Open Source scans and remediate findings via an in-repo .snyk
  policy file. Use when a Snyk PR check or `snyk test` is failing, when the
  user asks to fix, ignore, or triage Snyk dependency vulnerabilities or
  license issues, or mentions .snyk exceptions.
---

# Snyk remediation

## Running a local scan

Prefer an in-repo `.snyk` policy over Snyk UI ignores: it is reviewable in
the PR and applies in both CI and local scans.

This still reports findings and honors `.snyk`:

    # Python example
    snyk test --file=requirements.txt --package-manager=pip --command=python3 --skip-unresolved=true

Scan JSON for scripting:

    snyk test --file=<manifest> --package-manager=pip --skip-unresolved=true --json > /tmp/snyk.json

Exit codes: 0 = no issues, 1 = issues found, 2 = scan failed (e.g. deps not
resolved), 3 = no supported project detected.

## .snyk policy file placement

Snyk resolves each scanned manifest from its own directory and reads the
`.snyk` in that same directory. If you scan manifests in multiple
directories, create a `.snyk` next to each one (e.g. `./.snyk` and
`./airflow/.snyk`). A single root `.snyk` will not cover a manifest scanned
from a subdirectory.

## Writing exceptions

Edit `.snyk` directly. Chaining `snyk ignore --id=... --policy-path=...`
across several IDs has failed with `SNYK-CLI-0000`; hand-editing is reliable.

Format:

    version: v1.25.0
    ignore:
      SNYK-PYTHON-EXAMPLE-1234567:
        - '*':
            reason: "Why this is temporarily accepted, and what unblocks the real fix."
            expires: 2026-10-16T00:00:00.000Z

Always set an `expires` date so exceptions are revisited. Write a specific
reason that names the blocker (e.g. the framework/base-image upgrade required).

## Deciding: pin vs ignore

For each finding, check its "Fixed in" version and dependency path:

- Fixed by bumping a leaf/transitive library the repo can move freely ->
  pin the library in the manifest with a trailing comment, e.g.
  `urllib3>=2.6.3 # not directly required, pinned by Snyk to avoid a vulnerability`.
  Match any existing pin convention already in the repo.
- Fix only exists in a newer major framework / base image (Airflow, Django,
  a base Docker image, etc.) that the repo cannot upgrade yet -> add a timed
  `.snyk` ignore with a reason referencing that upgrade.
- License findings (IDs like `snyk:lic:...`) are policy decisions, not
  version fixes. Handle them via the org/group license policy or explicit
  approval, not a security exception.

Verify before finishing: re-run the scoped scan and confirm only the intended
findings remain.

