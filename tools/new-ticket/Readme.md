## new-ticket

This tool uses a Terminal UI to input data, then creates a Jira ticket using the Atlassian CLI.

### Setup

First install acli:

https://developer.atlassian.com/cloud/acli/guides/install-macos/

Then create a CLASSIC API token, the tokens with scopes (even classic scopes) don't appear to work for `acli`.

Recommended bash setup, to be added locally (e.g. in `~/.bash_local`)

```bash
export ACLI_TOKEN="<my-classic-api-token>"
function acli-login {
  echo "$ACLI_TOKEN" | acli jira auth login --site "<my-site>.atlassian.net" --email "<my-email>" --token
}
function new-ticket {
  node ~/tools/new-ticket/index.js
}
```

### Usage

```bash
new-ticket
# OR
node ~/tools/new-ticket/index.js
```

