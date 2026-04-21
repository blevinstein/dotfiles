---
name: datadog-api
description: Query Datadog logs, events, spans/traces, metrics, and monitors using the Datadog REST API. Use when the user asks to search logs, investigate errors, review traces or spans, check monitors, query metrics, or explore any Datadog telemetry.
---

# Datadog REST API

All Datadog telemetry is queried via the well-documented REST API using `curl`.

## Auth Setup

Docs explain how to set up API and Application Keys (as of April 2026): https://docs.datadoghq.com/account_management/api-app-keys/

Direct the user there if the environment variables are not configured. DO NOT touch the user's bash/zsh init scripts without permission.

## Credentials

```bash
export DD_API_KEY=<your-api-key>
export DD_APP_KEY=<your-app-key>
export DD_BASE_URL="https://api.datadoghq.com"   # US1 site; adjust for other sites
```

## Calling the API

Use `curl` with these headers for all calls. **Always include `--globoff`** — curl misinterprets `[` in query params/JSON bodies as a range expression without it.

```bash
curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -H "Content-Type: application/json" \
  "$DD_BASE_URL/..."
```

Parse responses with `jq` (preferred — minimal arbitrary-code-execution surface). Fall back to `python3 -c "import sys,json; ..."` ONLY if `jq` is not installed.

**Time formats:** Most v2 endpoints accept date math (`now-15m`, `now-1h`, `now-6h`, `now-1d`, `now-7d`), ISO-8601 strings, or Unix timestamps in **milliseconds**. v1 endpoints typically want Unix timestamps in **seconds**.

**Query syntax** (logs/events/spans): `service:api`, `status:error`, `env:production`, `"exact phrase"`, `service:api-*`, `-status:ok`

---

## Logs — `POST /api/v2/logs/events/search`

```bash
curl -s --globoff -X POST \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -H "Content-Type: application/json" \
  "$DD_BASE_URL/api/v2/logs/events/search" \
  -d '{
    "filter": {
      "query": "service:api status:error",
      "from": "now-1h",
      "to": "now"
    },
    "sort": "-timestamp",
    "page": { "limit": 100 }
  }'
```

Pagination: pass `meta.page.after` from the previous response as `page.cursor`.

Extract message + service:
```bash
... | jq -r '.data[] | "\(.attributes.service // "-") - \((.attributes.message // "")[0:200])"'
```

A `GET /api/v2/logs/events` form exists with `filter[query]`, `filter[from]`, `filter[to]`, `page[limit]` query params if a body-less call is preferred.

## Events — `POST /api/v2/events/search`

```bash
curl -s --globoff -X POST \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  -H "Content-Type: application/json" \
  "$DD_BASE_URL/api/v2/events/search" \
  -d '{
    "filter": {
      "query": "source:kubernetes \"OOMKilled\"",
      "from": "now-7d",
      "to": "now"
    },
    "sort": "-timestamp",
    "page": { "limit": 100 }
  }'
```

## Spans / Traces (APM) — `GET /api/v2/spans/events`

Same query syntax as logs.

```bash
curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  "$DD_BASE_URL/api/v2/spans/events?filter[query]=service:api%20status:error&filter[from]=now-1h&filter[to]=now&page[limit]=50"
```

Key response fields: `service`, `resource_name`, `operation_name`, `trace_id`, `span_id`, `parent_id`, `start_timestamp`, `end_timestamp`, `env`, `status`, `tags`, `type`.

```bash
... | jq -r '.data[] | "\(.attributes.operation_name) \(.attributes.resource_name) \(.attributes.status)"'
```

## Metrics — `GET /api/v1/query`

Unix timestamps in **seconds**.

```bash
FROM=$(date -v-1H +%s)   # macOS; on Linux use: date -d '1 hour ago' +%s
TO=$(date +%s)

curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  "$DD_BASE_URL/api/v1/query?from=$FROM&to=$TO&query=avg:system.cpu.user{*}"
```

## Monitors — `GET /api/v1/monitor`

```bash
# List
curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  "$DD_BASE_URL/api/v1/monitor"

# Single monitor
curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  "$DD_BASE_URL/api/v1/monitor/<ID>"
```

---

## Endpoint reference

| Data type      | Method | Endpoint                       |
|----------------|--------|--------------------------------|
| Logs           | POST   | `/api/v2/logs/events/search`   |
| Events         | POST   | `/api/v2/events/search`        |
| Spans / Traces | GET    | `/api/v2/spans/events`         |
| Metrics        | GET    | `/api/v1/query`                |
| Monitors       | GET    | `/api/v1/monitor[/<ID>]`       |

## Workflow

1. Build the request with `curl --globoff` and the auth headers.
2. For v2 search endpoints, prefer the `POST .../search` form with a JSON body — it sidesteps URL-encoding pitfalls with quoted phrases and brackets.
3. Pipe responses through `jq` to extract or count fields (fall back to `python3` only if `jq` is unavailable).
4. Paginate using `meta.page.after` → next request's `page.cursor` when results are truncated.
