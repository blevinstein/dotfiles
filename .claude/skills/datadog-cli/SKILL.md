---
name: datadog-cli
description: Query Datadog logs, spans/traces, events, metrics, and monitors using the datadog-cli tool and the Datadog REST API. Use when the user asks to search logs, investigate errors, review traces or spans, check monitors, query metrics, or explore any Datadog telemetry. Prefer the CLI for logs/events; use the REST API for spans/traces, metrics, and monitors.
---

# Datadog

Two complementary tools — use whichever covers the data type needed.

## Auth Setup

Docs here explain how to setup API and Application Keys (as of April 2026): https://docs.datadoghq.com/account_management/api-app-keys/

Direct the user there if the environment variables are not configured. DO NOT touch the user's bash/zsh init scripts without permission.

## Credentials

Both tools use the same environment variables:

```bash
export DD_API_KEY=<your-api-key>
export DD_APP_KEY=<your-app-key>
```

REST API base URL (US): `https://api.datadoghq.com`

---

## CLI — Logs & Events

Binary at `~/.cargo/bin/datadog`. Covers **logs** and **events** only.

```bash
# Logs
datadog logs '<query>' [--from now-1h] [--to now] [--limit 100] [-o json]

# Events
datadog events '<query>' [--from now-1h] [--to now] [--limit 100] [-o json]

# Paste a Datadog browser URL directly
datadog 'https://app.datadoghq.com/logs?query=...'
```

**Common examples:**
```bash
datadog logs 'service:api status:error' --from now-1h
datadog logs '"connection timeout"' --from now-6h --limit 50 -o json
datadog events 'source:kubernetes "OOMKilled"' --from now-7d
```

**Time formats:** `now-15m`, `now-1h`, `now-6h`, `now-1d`, `now-7d`, `now-30d`

**Query syntax:** `service:api`, `status:error`, `env:production`, `"exact phrase"`, `service:api-*`, `-status:ok`

---

## REST API — Spans, Metrics, Monitors, and more

Use `curl` with these headers for all REST calls. **Always include `--globoff`** — curl misinterprets `[` in query params as a range expression without it.

```bash
curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  "$DD_BASE_URL/..."
```

Set a convenience variable:
```bash
export DD_BASE_URL="https://api.datadoghq.com"
```

### Spans / Traces (APM)

Search spans with `GET /api/v2/spans/events`. Same query syntax as logs.

```bash
curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  "$DD_BASE_URL/api/v2/spans/events?filter[query]=service:api%20status:error&filter[from]=now-1h&filter[to]=now&page[limit]=50"
```

Key response fields: `service`, `resource_name`, `operation_name`, `trace_id`, `span_id`, `parent_id`, `start_timestamp`, `end_timestamp`, `env`, `status`, `tags`, `type`

Parse with python3 (jq may not be available):
```bash
... | python3 -c "import sys,json; [print(d['attributes']['operation_name'], d['attributes']['resource_name'], d['attributes']['status']) for d in json.load(sys.stdin)['data']]"
```

### Metrics — Query timeseries

```bash
# Query a metric over a time range (Unix timestamps)
FROM=$(date -v-1H +%s)
TO=$(date +%s)

curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  "$DD_BASE_URL/api/v1/query?from=$FROM&to=$TO&query=avg:system.cpu.user{*}"
```

### Monitors

```bash
# List all monitors
curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  "$DD_BASE_URL/api/v1/monitor"

# Get a specific monitor
curl -s --globoff \
  -H "DD-API-KEY: $DD_API_KEY" \
  -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
  "$DD_BASE_URL/api/v1/monitor/<ID>"
```

---

## What uses what

| Data type | Tool | Endpoint |
|-----------|------|----------|
| Logs | CLI | `datadog logs` |
| Events | CLI | `datadog events` |
| Spans / Traces | REST | `GET /api/v2/spans/events` |
| Metrics | REST | `GET /api/v1/query` |
| Monitors | REST | `GET /api/v1/monitor` |

---

## Workflow

1. **Start with the CLI** for logs/events — fast, readable output
2. **Fall back to REST API** for spans, metrics, monitors, or anything else
3. Pipe REST responses through `jq` to extract relevant fields
4. Use `-o json` (CLI) or `jq` (REST) when you need to count, filter, or correlate results
