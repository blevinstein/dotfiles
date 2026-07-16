---
name: gcloud-api
description: Inspect and manage Google Cloud (GCP) resources via the gcloud CLI and the Google Cloud REST APIs. Use when the user asks to check GCP projects, credentials, IAM, enabled services, quotas, API usage/metrics, logs, BigQuery, Cloud Storage, or any other GCP resource.
---

# Google Cloud (gcloud CLI + REST API)

Two complementary interfaces to GCP:

- **`gcloud` CLI** — best for auth, config, project/IAM/service management, and anything with a first-class command. Structured output via `--format`.
- **REST API** — best for data the CLI doesn't expose (e.g. Monitoring `timeSeries`, arbitrary service methods). Auth with a bearer token minted by the CLI.

There are thousands of API methods. This skill covers the mechanics and points at docs; look up specific methods there rather than memorizing them.

## Auth & setup

```bash
gcloud auth login                       # user creds for the CLI (interactive, needs browser)
gcloud auth application-default login    # ADC, for client libraries / some tools (interactive)
gcloud config set project PROJECT_ID
```

These interactive logins need a browser — you cannot run them for the user. If `gcloud auth list` shows no account, direct the user to run them. Do NOT edit the user's shell init scripts without permission.

Inspect current state (all non-interactive, safe):

```bash
gcloud auth list                 # active/credentialed accounts
gcloud config list               # active account, project, region/zone
gcloud projects list             # projects the account can see
gcloud auth print-access-token   # short-lived OAuth token for REST calls
```

## CLI usage

Prefer `--format` for machine-readable output, then pipe to `jq` when JSON:

```bash
gcloud services list --enabled --project PROJECT_ID --format=json | jq -r '.[].config.name'
gcloud iam service-accounts list --project PROJECT_ID --format='value(email)'
```

- `--format=json` / `--format='value(...)'` / `--format='table(...)'` control output.
- `--project`, `--account`, `--impersonate-service-account` scope a single command.
- `--dry-run` / `--log-http` help debug; `gcloud <group> <cmd> --help` for any command.
- **Read-only vs mutating:** `list`/`describe`/`get-*` are safe; `create`/`delete`/`update`/`set-*`/`add-*` mutate. Confirm with the user before mutating anything.

Docs: [gcloud reference](https://cloud.google.com/sdk/gcloud/reference) · [cheat sheet](https://cloud.google.com/sdk/docs/cheatsheet)

## REST API usage

Every Google API lives at `https://<service>.googleapis.com`. Authenticate with a bearer token from the CLI. Parse with `jq` (preferred — minimal code-execution surface); fall back to `python3 -c "import sys,json; ..."` ONLY if `jq` is unavailable.

> This environment enforces the `use-vet` policy: prefix every `curl` with `vet` (e.g. `vet curl ...`). Omit `vet` only if it is not installed.

```bash
TOKEN=$(gcloud auth print-access-token)
PROJECT=ccm-gsheets-dev

# GET example — list enabled services via Service Usage API
vet curl -sG "https://serviceusage.googleapis.com/v1/projects/$PROJECT/services" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode 'filter=state:ENABLED' \
  | jq -r '.services[].config.name'
```

```bash
# POST example — JSON body
vet curl -s -X POST "https://<service>.googleapis.com/v1/..." \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "key": "value" }' | jq .
```

Tips:
- Use `curl -G --data-urlencode 'k=v'` for GET query params — it URL-encodes quoted filters/brackets safely (avoids the `--globoff` bracket pitfalls).
- Some APIs require a quota project header: `-H "X-Goog-User-Project: $PROJECT"`.
- Timestamps are RFC 3339 (`2026-07-16T17:30:24Z`); generate with `date -u +%Y-%m-%dT%H:%M:%SZ` (macOS offset: `date -u -v-7d ...`; Linux: `date -u -d '7 days ago' ...`).

Docs: [Auth for REST](https://cloud.google.com/docs/authentication/rest) · [APIs Explorer](https://developers.google.com/apis-explorer) (interactive method browser + generated curl) · [API list](https://cloud.google.com/apis/docs/overview)

## API usage graphs / metrics (Monitoring)

The Console's "APIs & Services → Metrics" graphs are backed by the `serviceruntime.googleapis.com/api/request_count` metric. The CLI can't render charts, but the Monitoring `timeSeries.list` API returns the underlying data:

```bash
TOKEN=$(gcloud auth print-access-token)
PROJECT=ccm-gsheets-dev
START=$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ); END=$(date -u +%Y-%m-%dT%H:%M:%SZ)

vet curl -sG "https://monitoring.googleapis.com/v3/projects/$PROJECT/timeSeries" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode 'filter=metric.type="serviceruntime.googleapis.com/api/request_count"' \
  --data-urlencode "interval.startTime=$START" \
  --data-urlencode "interval.endTime=$END" \
  --data-urlencode 'aggregation.alignmentPeriod=86400s' \
  --data-urlencode 'aggregation.perSeriesAligner=ALIGN_SUM' \
  --data-urlencode 'aggregation.crossSeriesReducer=REDUCE_SUM' \
  --data-urlencode 'aggregation.groupByFields=resource.label."service"' \
  --data-urlencode 'aggregation.groupByFields=metric.label."response_code_class"' \
  | jq -r '.timeSeries[] | [.resource.labels.service, .metric.labels.response_code_class, ([.points[].value.int64Value|tonumber]|add)] | @tsv' | sort
```

Other useful metric labels: `response_code`, `method`, `credential_id`, `protocol`, `grpc_status_code`.

Docs: [Monitoring API v3](https://cloud.google.com/monitoring/api/ref_v3/rest) · [`timeSeries.list`](https://cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.timeSeries/list) · [metric filters](https://cloud.google.com/monitoring/api/v3/filters) · [serviceruntime metrics](https://cloud.google.com/monitoring/api/metrics_gcp#gcp-serviceruntime)

## Common tasks → where to look

| Task | CLI starting point | REST / docs |
|---|---|---|
| Projects & config | `gcloud projects list`, `gcloud config list` | [Resource Manager](https://cloud.google.com/resource-manager/reference/rest) |
| Enabled APIs / quotas | `gcloud services list --enabled` | [Service Usage](https://cloud.google.com/service-usage/docs/reference/rest) |
| IAM & policies | `gcloud iam service-accounts list`, `gcloud projects get-iam-policy` | [IAM](https://cloud.google.com/iam/docs/reference/rest) |
| API usage / metrics | (none) | Monitoring `timeSeries` (above) |
| Logs | `gcloud logging read '<filter>' --limit=N --format=json` | [Logging](https://cloud.google.com/logging/docs/reference/v2/rest) · [query syntax](https://cloud.google.com/logging/docs/view/logging-query-language) |
| BigQuery | `bq query --use_legacy_sql=false '<SQL>'`, `bq ls`, `bq show` | [BigQuery](https://cloud.google.com/bigquery/docs/reference/rest) |
| Cloud Storage | `gcloud storage ls`, `gcloud storage cp` (or `gsutil`) | [Storage JSON](https://cloud.google.com/storage/docs/json_api) |
| Compute | `gcloud compute instances list` | [Compute](https://cloud.google.com/compute/docs/reference/rest/v1) |
| Any other service | `gcloud <service> --help` | [APIs Explorer](https://developers.google.com/apis-explorer) |

## Workflow

1. Confirm auth/context first: `gcloud auth list` + `gcloud config list`. If no account, ask the user to `gcloud auth login`.
2. Prefer the CLI when a command exists; drop to REST for data the CLI can't reach.
3. For REST, mint a token with `gcloud auth print-access-token` and use `vet curl -G --data-urlencode` for GETs.
4. Pipe through `jq` to extract/aggregate; fall back to `python3` only if `jq` is missing.
5. Treat `create`/`update`/`delete`/`set` operations as mutating — confirm scope and project with the user before running.
