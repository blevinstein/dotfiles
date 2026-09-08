---
name: search-jira
description: Search and read Jira issues via the REST API using existing Atlassian credentials. Use when the user asks to look up, fetch, or search a Jira ticket/issue (e.g. "look at CLCM-960", "find Jira tickets about X"), or references a Jira issue key or JQL. Also supports adding comments when explicitly requested.
---

# Search & Read Jira

## GUARDRAILS — Writing to Jira

**NEVER transition, comment on, edit, or create a Jira issue without explicit user instruction.**
- Do not add comments, change status/fields, or link issues proactively.
- Always show the resulting issue URL after any write so the user can verify.

## Prerequisites

Three environment variables must be set:

| Variable | Purpose |
|----------|---------|
| `ACLI_TOKEN` | Atlassian personal access token (PAT) |
| `ACLI_EMAIL` | Atlassian account email address |
| `ACLI_DOMAIN` | Atlassian site domain (e.g. `myorg.atlassian.net`) |

Verify before use:

```bash
echo "ACLI_TOKEN=${ACLI_TOKEN:+set}" "ACLI_EMAIL=$ACLI_EMAIL" "ACLI_DOMAIN=$ACLI_DOMAIN"
```

If missing, stop and tell the user which variables need to be configured. `jq` is used to parse responses; verify with `which jq`.

## Authentication

Same basic auth as Confluence, but against the Jira REST path instead of `/wiki/rest/api`:

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" "https://$ACLI_DOMAIN/rest/api/2/..."
```

If the `use-vet` skill/rule is active in this environment, prefix every curl with `vet` (e.g. `vet curl ...`). If you get `401 Unauthorized`, double check the env vars (there is no separate Jira login step — it uses the same PAT as Confluence).

## Fetching a Single Issue

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/rest/api/2/issue/ISSUE-KEY" \
  | jq '{
      key,
      summary: .fields.summary,
      description: .fields.description,
      status: .fields.status.name,
      issuetype: .fields.issuetype.name,
      labels: .fields.labels,
      assignee: .fields.assignee.displayName,
      priority: .fields.priority.name
    }'
```

Issue URL for the user: `https://$ACLI_DOMAIN/browse/ISSUE-KEY`

## Searching Issues (JQL)

```bash
curl -s -G -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/rest/api/2/search" \
  --data-urlencode 'jql=project = CLCM AND text ~ "unmerged" ORDER BY updated DESC' \
  --data-urlencode 'maxResults=25' \
  --data-urlencode 'fields=summary,status,issuetype,updated' \
  | jq -r '.issues[] | "\(.key)\t\(.fields.status.name)\t\(.fields.summary)"'
```

### Useful JQL examples

| Goal | JQL |
|------|-----|
| By project | `project = CLCM` |
| By key | `key = CLCM-960` |
| Text search | `text ~ "unmerged children"` |
| By status | `project = CLCM AND status = "Refinement"` |
| By assignee | `assignee = "user@example.com"` |
| Recently updated | `updated >= -7d` |
| By label | `labels = "sync"` |
| By type | `issuetype = "User Story"` |

## Fetching Comments

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/rest/api/2/issue/ISSUE-KEY/comment" \
  | jq -r '.comments[] | "\(.author.displayName) (\(.created)): \(.body)"'
```

## Pagination

`search` uses `startAt` / `maxResults`, and returns `total`:

```bash
...&startAt=0&maxResults=50   # first page
...&startAt=50&maxResults=50  # next page
```

## Adding a Comment (only when explicitly requested)

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  -X POST -H "Content-Type: application/json" \
  "https://$ACLI_DOMAIN/rest/api/2/issue/ISSUE-KEY/comment" \
  -d '{"body": "Comment text"}' \
  | jq '{id, created}'
```

Confirm the target issue key with the user first, and report the issue URL afterward.
