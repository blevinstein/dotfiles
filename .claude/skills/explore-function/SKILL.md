---
name: explore-function
description: Investigate a question across local repos, Notion, Linear, Slack, and (when relevant) Datadog, and write up findings as a new page in the user's private Notion "Explorations" page. Use when the user invokes /explore-function or asks to explore, investigate, or write up notes on a topic across those sources.
user_invocable: true
---

# explore-function

Investigate the user's question across the data sources below, then write the
findings to a new Notion page under the private "Explorations" page.

## Data sources

- **Local repos** (workspace `/Users/blevinstein/dev`): use file search, grep,
  read, and git. Read-only unless the user asks otherwise.
- **Notion** (`user-Notion` MCP): `notion-search`, `notion-fetch`,
  `notion-query-data-sources`. Read-only except for the output page.
- **Linear** (`Linear` MCP): issues, projects, documents, comments.
  Configured 2026-10-29 as a plain MCP server at user scope
  (`~/.config/devin/mcp_config.json`), pointing at
  `https://mcp.linear.app/mcp` and OAuth-authenticated via
  `devin mcp login Linear`. To re-auth: `devin mcp logout Linear` then
  `devin mcp login Linear`. (`devin mcp add` triggers the OAuth flow
  automatically on add.)
  - Tool param quirks: `get_issue` takes `id` (e.g. `"FBR-1710"`),
    `list_comments` takes `issueId`, and `list_issues` `fields` uses
    `status`/`statusType` (not `state`).
- **Slack** (`plugin-slack-slack` MCP): messages, channels, users, threads,
  and files via the Cursor Slack plugin (local MCP). Read-only for
  explorations — search and read only; do not send, schedule, react, or
  otherwise write unless the user explicitly asks.
  - Prefer `slack_search_public` for public-channel search (no consent
    needed). Use `slack_search_public_and_private` only when private
    channels / DMs are needed, and only after user consent.
  - Also useful: `slack_search_channels`, `slack_search_users`,
    `slack_read_channel`, `slack_read_thread`, `slack_read_user_profile`.
  - Search params: split into `keywords` (AND'd single words or
    `"quoted phrases"`), `filters` (Slack modifiers like
    `in:<#C…>` / `from:<@U…>` / `after:YYYY-MM-DD`), and
    `natural_language_query` for semantic reranking. Decompose complex
    questions into parallel searches; broaden if zero hits.
  - If the Slack MCP skill (`slack-search`) is available, follow it for
    search strategy.
- **Datadog** (`plugin-datadog-datadog` MCP): logs, spans/traces, metrics,
  monitors, incidents, dashboards, RUM, and events via the Cursor Datadog
  plugin (local MCP). Use **only when appropriate** — production/ops
  behavior, errors, latency, incidents, monitor state, deploys, or other
  telemetry evidence. Skip for pure product/docs/process questions with no
  runtime angle. Read-only for explorations — search and read only; do not
  create/edit notebooks or dashboards unless the user explicitly asks.
  - Before domain queries: `list_datadog_skills` (fuzzy topic) and
    `load_datadog_skill` (e.g. `datadog/logs`, `datadog/traces`,
    `datadog/metrics`, `datadog/monitors`); also load
    `datadog/visualizations` when charting.
  - Useful reads: `search_datadog_logs` / `analyze_datadog_logs`,
    `search_datadog_spans` / `aggregate_spans` / `get_datadog_trace`,
    `search_datadog_metrics` / `get_datadog_metric`,
    `search_datadog_monitors`, `search_datadog_incidents` /
    `get_datadog_incident`, `search_datadog_events` /
    `get_change_stories`, `search_datadog_dashboards`.
  - Prefer MCP over the REST `datadog-api` skill when this server is
    available; fall back to that skill only if MCP cannot answer.

Use `GetDynamicTools` to read a tool's schema before calling it as necessary.

## Output location

Create the page as a child of the private "Explorations" page:

- Page ID: `408b0b10-ae8c-8085-b897-c820565e59ab`
- URL: https://app.notion.com/p/408b0b10ae8c8085b897c820565e59ab

Search results for "Explorations" also return an unrelated item in the Tasks
database (ID `406b0b10-ae8c-80f7-a713-fabfd10a76b2`). Do not use it.

Create with `notion-create-pages` and `parent: {"type": "page_id", "page_id": "408b0b10-ae8c-8085-b897-c820565e59ab"}`.
Read `notion://docs/notion-flavored-markdown-spec` before writing non-trivial
content. Put the title in `properties`, not in the content.

## Workflow

1. Clarify the question only if it is genuinely ambiguous.
2. Gather evidence from each relevant source. Run independent lookups in parallel.
3. Create the Notion page with: the question, a short summary of findings, and
   supporting detail with links to the source Notion pages, Linear issues,
   Slack messages/channels, Datadog queries/incidents/monitors (when used),
   and repo paths. Mark clearly what is fact versus inference, and list open
   questions.
4. Reply with the page link and a brief summary of the findings.

## Maintenance

Document new data sources or process changes in this file under "Data sources".

