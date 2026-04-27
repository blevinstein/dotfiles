---
name: search-confluence
description: Search the organization's Confluence wiki for documentation, runbooks, specs, and meeting notes via the REST API. Use when the user asks to find, search, or look up information in Confluence, or references Confluence pages, wiki docs, or internal documentation.
---

# Search Confluence

## Prerequisites

Three environment variables must be set:

| Variable | Purpose |
|----------|---------|
| `ACLI_TOKEN` | Atlassian personal access token (PAT) |
| `ACLI_EMAIL` | Atlassian account email address |
| `ACLI_DOMAIN` | Atlassian site domain (e.g. `myorg.atlassian.net`) |

**Before making any API calls**, verify all three are present by running:

```bash
echo "ACLI_TOKEN=${ACLI_TOKEN:+set}" "ACLI_EMAIL=$ACLI_EMAIL" "ACLI_DOMAIN=$ACLI_DOMAIN"
```

If any are missing, stop and tell the user which variables need to be configured.

`jq` is also helpful for parsing JSON responses. Verify with `which jq`. If not found, you may parse using python3 or node.

## Login

The `acli` CLI must be authenticated before use. Log in to Confluence:

```bash
echo "$ACLI_TOKEN" | acli confluence auth login --site "$ACLI_DOMAIN" --email "$ACLI_EMAIL" --token
```

Run this if `acli` commands return `unauthorized`, or if curl API calls return `401`.

## Authentication

All REST API calls use basic auth with `$ACLI_EMAIL` and `$ACLI_TOKEN`:

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/wiki/rest/api/..."
```

If you get a `401 Unauthorized`, re-run the login commands above, then retry.

## Searching Pages

Use the v1 search endpoint with CQL (Confluence Query Language). Pipe through `jq` to extract just the fields you need rather than dumping the entire JSON blob:

```bash
curl -s -G -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/wiki/rest/api/search" \
  --data-urlencode 'cql=type=page AND text~"search terms"' \
  --data-urlencode 'limit=10' \
  | jq '.results[] | {title, id: .content.id, space: .resultGlobalContainer.title, url: ("https://'"$ACLI_DOMAIN"'/wiki" + .url), excerpt}'
```

### CQL Examples

| Goal | CQL |
|------|-----|
| Text search | `text~"search terms"` |
| Title search | `title~"search terms"` |
| Exact title | `title="Exact Page Title"` |
| In a space | `space=KEY AND text~"deploy"` |
| Pages only | `type=page AND text~"search terms"` |
| By label | `label="architecture"` |
| Recently modified | `lastModified>now("-7d")` |
| Combined | `type=page AND space=CET AND text~"CI/CD"` |

### Reading Search Results

Each result contains:
- `content.id` — page ID (use to fetch full body)
- `title` — page title
- `excerpt` — text snippet with matches
- `url` — relative web URL (prefix with `https://$ACLI_DOMAIN/wiki`)
- `resultGlobalContainer.title` — space name
- `lastModified` — last edit timestamp

### Useful jq Filters for Search

Just titles and IDs (compact list):

```bash
... | jq -r '.results[] | "\(.content.id)\t\(.title)"'
```

Filter to a specific space client-side:

```bash
... | jq '.results[] | select(.resultGlobalContainer.title == "Engineering") | {title, id: .content.id}'
```

Count results and show pagination state:

```bash
... | jq '{size, start, totalSize, hasNext: (._links.next != null)}'
```

## Fetching a Page's Full Content

Extract just the body text rather than printing the entire response:

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/wiki/rest/api/content/PAGE_ID?expand=body.storage" \
  | jq -r '.body.storage.value'
```

For metadata + body together:

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/wiki/rest/api/content/PAGE_ID?expand=body.storage,version,space" \
  | jq '{id, title, space: .space.name, version: .version.number, body: .body.storage.value}'
```

The body is Confluence storage format (HTML-like XML). For a rendered HTML view, use `expand=body.view` and read `.body.view.value` instead.

To strip HTML tags for a plain-text view:

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/wiki/rest/api/content/PAGE_ID?expand=body.view" \
  | jq -r '.body.view.value' \
  | sed 's/<[^>]*>//g'
```

## Pagination

Use `limit` and `start` parameters:

```bash
...?cql=text~"deploy"&limit=25&start=0   # First 25
...?cql=text~"deploy"&limit=25&start=25  # Next 25
```

The response includes `size`, `start`, `totalSize`, and `_links.next` if more results exist. Inspect with:

```bash
... | jq '{size, start, totalSize, next: ._links.next}'
```

## Listing Spaces

To discover available spaces (showing key + name only):

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/wiki/rest/api/space?limit=50" \
  | jq -r '.results[] | "\(.key)\t\(.name)"'
```

Or via the CLI: `acli confluence space list`

## Using acli

The `acli` CLI tool is also available for basic operations:

```bash
acli confluence space list          # List all spaces
acli confluence page view --id ID   # View a specific page
```

If acli reports `unauthorized`, re-run the login commands from the Login section above.

## Workflow

1. **Search** with CQL to find relevant pages
2. **Review** titles and excerpts using `jq` projections — don't dump full JSON
3. **Fetch** full page content for pages that look relevant
4. **Summarize** findings for the user, including links (`https://$ACLI_DOMAIN/wiki` + `url` from results)
