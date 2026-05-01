---
name: search-confluence
description: Search the organization's Confluence wiki for documentation, runbooks, specs, and meeting notes via the REST API. Use when the user asks to find, search, or look up information in Confluence, or references Confluence pages, wiki docs, or internal documentation. Also supports creating and updating pages when the user explicitly requests it.
---

# Search & Write Confluence

## GUARDRAILS — Writing to Confluence

**NEVER create, update, or delete Confluence pages without explicit user instruction.** Specifically:

- Do **not** proactively create pages even if you think documentation would be useful.
- Do **not** create a page without first confirming the intended parent location with the user.
- Do **not** update or overwrite an existing page without explicit user confirmation.
- Always show the user the target URL after a write operation so they can verify the result.
- Treat Confluence writes as irreversible — think before you POST.

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

## Creating a Page

Use `POST /wiki/rest/api/content`. Write the body to a temp file first (avoids shell quoting issues with large payloads):

```bash
cat << 'PAYLOAD' > /tmp/confluence-page.json
{
  "type": "page",
  "title": "Page Title",
  "ancestors": [{"id": "PARENT_PAGE_ID"}],
  "space": {"key": "SPACE_KEY"},
  "body": {
    "storage": {
      "representation": "storage",
      "value": "<p>Page body in Confluence storage format (HTML-like XML).</p>"
    }
  }
}
PAYLOAD

curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  -X POST \
  -H "Content-Type: application/json" \
  "https://$ACLI_DOMAIN/wiki/rest/api/content" \
  -d @/tmp/confluence-page.json \
  | jq '{id, title, webui: ._links.webui}'
```

The response `._links.webui` gives the relative path; prefix with `https://$ACLI_DOMAIN/wiki` for the full URL.

### Getting the Space Key

You need the space key (`CET`, `~username`, etc.) to create a page. Fetch it from any existing page in that space:

```bash
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/wiki/rest/api/content/PAGE_ID?expand=space" \
  | jq '{spaceKey: .space.key}'
```

### Confluence Storage Format

Page bodies use Confluence storage format — HTML-like XML. Key conversions from Markdown:

| Markdown | Storage format |
|---|---|
| `# Heading` | `<h1>Heading</h1>` |
| `**bold**` | `<strong>bold</strong>` |
| `` `code` `` | `<code>code</code>` |
| `[text](url)` | `<a href="url">text</a>` |
| `- item` | `<ul><li>item</li></ul>` |
| `1. item` | `<ol><li>item</li></ol>` |
| Table | `<table><tbody><tr><th>...</th></tr><tr><td>...</td></tr></tbody></table>` |
| `<` / `>` in text | `&lt;` / `&gt;` |
| `'` in text | `&apos;` |

### Checking for Duplicate Titles

Confluence rejects pages with a duplicate title in the same space (HTTP 400 with `"A page already exists with the same TITLE"`). Before creating, search for the title first:

```bash
curl -s -G -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/wiki/rest/api/search" \
  --data-urlencode 'cql=type=page AND title="Exact Title" AND space=KEY' \
  | jq -r '.results[] | "\(.content.id)\t\(.title)"'
```

If a page already exists with that title, decide with the user whether to update it or use a different title.

## Updating an Existing Page

Updating requires the current version number (Confluence increments it on each save):

```bash
# Get current version
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  "https://$ACLI_DOMAIN/wiki/rest/api/content/PAGE_ID?expand=version" \
  | jq '.version.number'

# Then PUT with version + 1
curl -s -u "$ACLI_EMAIL:$ACLI_TOKEN" \
  -X PUT \
  -H "Content-Type: application/json" \
  "https://$ACLI_DOMAIN/wiki/rest/api/content/PAGE_ID" \
  -d '{
    "type": "page",
    "title": "Page Title",
    "version": {"number": CURRENT_VERSION_PLUS_ONE},
    "body": {
      "storage": {
        "representation": "storage",
        "value": "<p>Updated content.</p>"
      }
    }
  }' | jq '{id, title, webui: ._links.webui}'
```

## Workflow

### Read-only (searching)
1. **Search** with CQL to find relevant pages
2. **Review** titles and excerpts using `jq` projections — don't dump full JSON
3. **Fetch** full page content for pages that look relevant
4. **Summarize** findings for the user, including links (`https://$ACLI_DOMAIN/wiki` + `url` from results)

### Write workflow (only when explicitly instructed)
1. **Confirm** the target space and parent page with the user before writing
2. **Check** for duplicate title in the target space
3. **Get the space key** from an existing page if not already known
4. **Write payload to a temp file** to avoid shell quoting issues
5. **POST** to create (or PUT to update) the page
6. **Report** the full page URL to the user so they can verify
