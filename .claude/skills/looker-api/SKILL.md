---
name: looker-api
description: Interact with a Looker instance via its REST API and author LookML objects in a LookML project repo. Use when the user asks to inspect or modify Looker content (dashboards, looks, folders, users, models/explores), run queries against a Looker explore, or author/edit a .lookml file.
---

# Looker API + LookML

Two related workflows live in this skill:

1. **Looker REST API (v4.0)** — for querying/creating User-Defined Dashboards (UDDs), running ad-hoc queries, listing models/explores/folders, etc. Base path: `/api/4.0/...`.
2. **LookML dashboards** — `.dashboard.lookml` files inside a LookML project repo. Edited as code, deployed via git.

## Official docs (prefer these over restating things here)

- API overview / getting started: https://cloud.google.com/looker/docs/api-getting-started
- Auth (SDK and non-SDK): https://cloud.google.com/looker/docs/api-auth
- Full method reference (v4.0): https://cloud.google.com/looker/docs/reference/looker-api/latest/methods
  - Auth: https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/ApiAuth
  - Dashboard: https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Dashboard
  - Query: https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Query
  - Folder: https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Folder
  - LookmlModel: https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/LookmlModel
  - Project (git branch mgmt): https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Project
- LookML dashboard reference: https://cloud.google.com/looker/docs/reference/param-lookml-dashboard
- LookML dashboard elements/tiles: https://cloud.google.com/looker/docs/reference/param-element
- Sparse fieldsets (`?fields=`): https://cloud.google.com/looker/docs/reference/looker-api/latest#sparse_fieldsets
- Rate limits & pagination: https://cloud.google.com/looker/docs/reference/looker-api/latest#rate_limits

When in doubt, fetch the relevant doc page — the API surface is large and changes.

## Credentials

Docs on generating an API key: https://cloud.google.com/looker/docs/api-auth#authentication_with_an_sdk (same "create API credentials" steps apply for non-SDK use).

Environment variables this skill assumes:

```bash
export LOOKER_BASE_URL="https://<instance>.cloud.looker.com"   # no trailing slash, no /api/4.0
export LOOKER_CLIENT_ID="..."
export LOOKER_CLIENT_SECRET="..."
```

If any are missing, point the user at the docs above. **DO NOT** touch the user's shell init files without permission.

### Login (get an access token)

`POST /api/4.0/login` — https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/ApiAuth/login

Pass `client_id` and `client_secret` as **form-body** params (not query params — the query-param form is being deprecated end of 2026).

```bash
export LOOKER_TOKEN=$(curl -sS --globoff -X POST \
  --data-urlencode "client_id=$LOOKER_CLIENT_ID" \
  --data-urlencode "client_secret=$LOOKER_CLIENT_SECRET" \
  "$LOOKER_BASE_URL/api/4.0/login" | jq -r '.access_token')
```

Response also includes `expires_in` (typically 3600s) and `token_type: Bearer`. There is usually no `refresh_token` — just call `/login` again when the token expires. `POST /logout` invalidates the token early.

### Auth header (Looker quirk)

Despite `token_type: Bearer`, Looker's HTTP header format is:

```
Authorization: token <access_token>
```

The literal word `token` is required. Do **not** use `Bearer <...>`.

```bash
curl -sS --globoff \
  -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/user" | jq '{id, display_name, email, role_ids}'
```

### Response shaping

Looker responses can be huge (a single dashboard easily runs to hundreds of KB with all elements + queries embedded). Use `?fields=` to project only what's needed:

```bash
# list dashboards, id/title/folder only
curl -sS --globoff \
  -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/dashboards?fields=id,title,folder(id,name)"
```

Docs: https://cloud.google.com/looker/docs/reference/looker-api/latest#sparse_fieldsets

Parse with `jq`. Fall back to `python3 -c "import sys,json; ..."` only if `jq` is unavailable.

### Common gotchas

- URL-encode paths carefully; use `--globoff` on `curl` so `[`/`]` in `?fields=…(nested)` aren't treated as globs.
- `POST`/`PATCH`/`PUT` bodies are JSON: `-H "Content-Type: application/json" -d '{...}'`.
- Errors: `422` (validation) responses include a per-field `errors` array — always read the body, don't just check the status.
- Rate limits: honor `X-RateLimit-*` response headers; back off on 429.

## Task-oriented endpoint map

For each task, follow the linked doc for exact request/response schemas.

| Task | Endpoint / doc |
|---|---|
| Log in / out | `POST /login`, `POST /logout` — [ApiAuth](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/ApiAuth) |
| Who am I | `GET /user` — [User.me](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/User/me) |
| List models & explores | `GET /lookml_models`, `GET /lookml_models/{model}/explores/{explore}` — [LookmlModel](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/LookmlModel) |
| List / search folders | `GET /folders`, `GET /folders/search` — [Folder](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Folder) |
| List / search dashboards | `GET /dashboards`, `POST /dashboards/search` — [Dashboard](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Dashboard) |
| Get / update / delete UDD | `GET|PATCH|DELETE /dashboards/{id}` |
| Create UDD | `POST /dashboards` (`title` + `folder_id` required) — [create_dashboard](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Dashboard/create_dashboard) |
| Copy UDD | `POST /dashboards/{id}/copy` |
| Manage tiles | `.../dashboard_elements` — [DashboardElement](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Dashboard#DashboardElement) endpoints |
| Manage filters | `.../dashboard_filters` |
| Manage layout | `.../dashboard_layouts`, `.../dashboard_layout_components` |
| Create/get query (data behind a tile) | `POST /queries`, `GET /queries/{id}`, `POST /queries/{id}/run/{format}` — [Query](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Query) |
| Import a LookML dashboard → UDD | `POST /import_lookml_dashboard/{lookml_dashboard_id}/{space_id}` |
| Sync UDDs from LookML changes | `POST /sync_lookml_dashboard/{lookml_dashboard_id}` |
| LookML project + git branch mgmt | [Project](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Project) |

### Local reference: known folder IDs on this instance

Discovered via `GET /folders?fields=id,name,parent_id,is_shared_root,is_users_root`:

- `1` — **Shared** (root shared folder)
- `2` — **Users** (root of personal folders)
- `lookml` — virtual folder for LookML dashboards

Fetch the current tree fresh when placing a new dashboard.

## LookML dashboards (this repo)

If the user wants a dashboard that lives in the LookML project (as opposed to a UDD), edit `.dashboard.lookml` files instead of calling the API.

- Reference for the file format: https://cloud.google.com/looker/docs/reference/param-lookml-dashboard
- Element (tile) params: https://cloud.google.com/looker/docs/reference/param-element

Deployment path (Looker-side): commit + push on a Looker dev branch, then use Looker's **Validate LookML** + **Deploy to Production** flow (either via the Looker UI or the [Project](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Project) endpoints). No REST `POST` creates the dashboard — LookML dashboards are code-defined.

### Introspection helpers when authoring

Before writing a new tile, discover valid fields for the model/explore:

```bash
# List explores for a model
curl -sS --globoff \
  -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/lookml_models/my_database?fields=explores(name,label,group_label)" | jq

# Full field list for an explore (dimensions, measures, filters)
curl -sS --globoff \
  -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/lookml_models/my_database/explores/study?fields=fields(dimensions(name,type,label),measures(name,type,label))" | jq
```

This is faster than grepping `views/**/*.view.lkml` and matches what Looker actually exposes at query time.

## Workflow

1. Ensure `LOOKER_BASE_URL` / `LOOKER_CLIENT_ID` / `LOOKER_CLIENT_SECRET` are set. Login and cache `LOOKER_TOKEN`.
2. Confirm intent: **LookML dashboard** (edit files in this repo, git-based) or **UDD** (REST API against the instance).
3. Discover context via API: relevant model → explore → available fields; target folder ID; existing dashboards to reference.
4. For UDDs: build up with `POST /dashboards`, then `POST /dashboards/{id}/dashboard_elements` (each element usually references a `query_id` from `POST /queries`), then `.../dashboard_filters` and layout components.
5. For LookML dashboards: write/edit the `.dashboard.lookml` file, referencing existing views/explores in the repo; open a PR; deploy via Looker.
6. Prefer sparse fieldsets (`?fields=...`) on all reads to keep responses reviewable.
7. Read `422` error bodies fully — they tell you exactly which field failed validation.
