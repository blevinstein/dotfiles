---
name: notion-api
description: Read and write Notion pages, databases, and blocks. Use when the user asks to look up, search, create, or edit Notion content. Prefers the Notion MCP server when it's enabled; falls back to the Notion REST API via curl with NOTION_TOKEN otherwise.
---

# Notion

Two ways to reach Notion are available. Prefer the first if it's live.

## 1. MCP server (preferred)

If a `notion` MCP server is connected (tools named like `mcp__notion__*` show up in your tool list), use those tools directly instead of raw HTTP — they handle pagination, block-tree walking, and markdown conversion for you.

The server may be disabled in some clients (e.g. it's kept in `~/.cursor/mcp.json`'s `disabledMcpServers` to save context). If you don't see `mcp__notion__*` tools, fall back to the REST API below rather than asking the user to enable it — enabling it costs a lot of context for the rest of the session.

## 2. REST API fallback

Used when the MCP server isn't enabled. Requires `NOTION_TOKEN` (an internal integration secret) to be set in the environment.

```bash
export NOTION_TOKEN=<your-integration-secret>
```

If unset, point the user to https://www.notion.so/profile/integrations to create an internal integration and copy its secret. **DO NOT** touch the user's shell init files without permission.

## Official docs (prefer these over restating things here)

- API reference (all endpoints, request/response schemas): https://developers.notion.com/reference/intro
- Auth: https://developers.notion.com/docs/authorization
- Search: https://developers.notion.com/reference/post-search
- Pages: https://developers.notion.com/reference/page — retrieve/create/update at `/v1/pages[/<id>]`
- Databases: https://developers.notion.com/reference/database — schema at `GET /v1/databases/<id>`, rows via `POST /v1/databases/<id>/query`
- Blocks: https://developers.notion.com/reference/block — page body content, separate from page properties
- Pagination: https://developers.notion.com/reference/intro#pagination
- Rich text / property value objects (needed to build request bodies): https://developers.notion.com/reference/rich-text, https://developers.notion.com/reference/page-property-values

When in doubt, fetch the relevant doc page — request bodies for creating pages/blocks are verbose and easy to get subtly wrong from memory.

## Calling the API

```bash
export NOTION_VERSION="2022-06-28"   # current stable version as of 2026

curl -sS --globoff \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: $NOTION_VERSION" \
  -H "Content-Type: application/json" \
  "https://api.notion.com/v1/..."
```

Parse responses with `jq`. Fall back to `python3 -c "import sys,json; ..."` only if `jq` is unavailable.

Note: `search` and `.../query` are `POST` (body-based filters), not `GET`.

## Gotchas not obvious from the docs

- **Sharing is required.** A page/database is only visible to the API once it's explicitly shared with the integration in Notion's UI ("..." menu → "Connect to" → the integration). A 404 on a known-good ID almost always means this step was skipped, not that the ID is wrong.
- **Properties vs. body are separate APIs.** `PATCH /v1/pages/<id>` edits page *properties* (the database-row metadata) only. Editing the visible body content (paragraphs, headings, etc.) means calling the `/v1/blocks/<id>/children` endpoints instead — updating one never touches the other.
- **Block children aren't inlined recursively.** `GET /v1/blocks/<id>/children` only returns direct children; a block with `"has_children": true` needs its own follow-up call to see what's nested inside (toggles, nested lists, synced blocks).
- Read error bodies fully — the `code`/`message` fields distinguish "integration lacks access" from "malformed property value," which look identical from the status code alone.

## Workflow

1. Check for `mcp__notion__*` tools first; use them if present.
2. Otherwise confirm `NOTION_TOKEN` is set and the target page/database has been shared with the integration.
3. Use `POST /v1/search` to resolve a title to an ID if the user didn't give one directly.
4. Fetch the relevant reference doc before building a request body for creating/updating a page or block — the property-value and rich-text shapes are easy to get wrong from memory.
5. Paginate with `start_cursor`/`has_more` on search, database query, and block-children calls.
