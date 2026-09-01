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
| Export a UDD as LookML | `GET /dashboards/lookml/{id}` — [dashboard_lookml](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Dashboard/dashboard_lookml) |
| LookML project + git branch mgmt | [Project](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Project) |

### Local reference: known folder IDs on this instance

Discovered via `GET /folders?fields=id,name,parent_id,is_shared_root,is_users_root`:

- `1` — **Shared** (root shared folder)
- `2` — **Users** (root of personal folders)
- `lookml` — virtual folder for LookML dashboards

Fetch the current tree fresh when placing a new dashboard.

## UDD gotchas learned the hard way

The REST API for User-Defined Dashboards has several sharp edges that produce no error but silently don't do what you'd expect. Symptoms and fixes below.

**Creating a tile**
- `POST /dashboard_elements` — NOT nested under `/dashboards/{id}/dashboard_elements` (that 404s). Put `dashboard_id` in the request body instead.
- `vis_config` must be set when creating the **query** (`POST /queries`), not when creating/patching the dashboard element. Setting it on the element silently no-ops. Symptom: tile shows "Element not found" in the dashboard UI, and "Visualization configuration not found" when you click for details.
- New `dashboard_layout_components` are created with `row`/`column`/`width`/`height` all `null` — the tile won't be positioned on the grid. You must explicitly `PATCH /dashboard_layout_components/{id}` with all four values.
- To swap a tile's data/vis after the fact: create a new query (`POST /queries`) with the fixed `fields`/`filters`/`vis_config`, then `PATCH /dashboard_elements/{id}` with `{"query_id": "<new id>"}`. This preserves the element's `result_maker`/`listen` filter wiring (see below) as long as you don't also touch `result_maker` in that PATCH.

**Dynamic fields (`dynamic_fields` on a query)**
- Custom dimensions must use Looker's Lexp functions, not raw SQL. Works: `extract_hours(${...})`, `diff_days(date(Y,M,D), ${...})`, `mod(a, b)`, `if(cond, a, b)` (chainable for a case-like expression). Fails with "Invalid expression: Unknown function" for raw SQL (`HOUR()`, `DAYNAME()`) and also for Lexp `list()`/`index()` (these don't compile to SQL in this context, even though they look valid as Lexp).
- Custom filtered measures: `"filters"` must be a **dict** (`{"view.field": "value"}`), not a list of `{field, value}` objects — the list form is silently ignored (no filter applied).
- **Table calculations silently evaluate to null with no error** if a field referenced via `${...}` in the expression isn't also present in the query's top-level `fields` array — even though the calc itself is a field. If you want a ratio like `${a}/${b}` but only want to chart the ratio, put `a`, `b`, and the calc all in `fields`, then hide `a`/`b` from the visual via `vis_config.hidden_fields`. (This bug caused 3 "silently blank" line-chart tiles in one session — always double check ${...} refs in a table_calc expression are all present in fields.)

**`looker_grid` (table) `vis_config` — params that are valid per LookML dashboard docs but are silently ignored via the JSON API:**
- `show_view_names: false` — no effect, repeated view-name header stays.
- `column_order` — does not reorder pivot *value* columns; pivoted columns are always sorted alphabetically by value with no API-level override.
- `series_labels` / `series_column_widths` keyed by a bare pivot value (e.g. `"0"`, `"Mon"`) — ignored.
- `html` on a dynamic dimension — does not affect pivot column header rendering (only affects cell body rendering, and even that wasn't confirmed).
- `color_application.{collection_id,palette_id}` inside a `conditional_formatting` rule — silently falls back to Looker's default blue scale.

What **does** work, confirmed via render_tasks (see below):
- `series_cell_visualizations.<view.field>.is_active: false` — removes the default in-cell bar/sparkline.
- `series_labels` / `series_column_widths` keyed by the **real field name** (`view_name.field_name`) — e.g. renaming a measure's column header.
- `size_to_fit: true` combined with resizing the tile's actual `dashboard_layout_component.width` — the only reliable way to control how many pivot columns fit without horizontal scroll. Explicit small `series_column_widths` values are ignored/floored.
- Workaround for custom pivot column order (e.g. weekday Mon→Sun instead of alphabetical): make the pivoted dimension's *value* itself sort correctly, e.g. `"1 Mon"`, `"2 Tue"`, ... `"7 Sun"` — alphabetical string sort of these equals the desired order, and the leading digit is a minor readability cost.

**Dashboard filters**
- `POST /dashboard_filters`: `type` must be one of `date_filter`, `number_filter`, `string_filter`, `field_filter` — not `date`/`number`/`string` (the object-model docs are misleading here; trust the 422 validation error, which lists the exact accepted values).
- To wire a tile to a dashboard filter: `PATCH /dashboard_elements/{id}` with:
  ```json
  {"result_maker": {"filterables": [{"model": "...", "view": "...", "listen": [
    {"dashboard_filter_name": "date_filter", "field": "view_name.date_field"}
  ]}]}}
  ```
  The same dashboard filter name can drive tiles across different explores by mapping to a different `field` per tile. Fetch the element first (`GET .../dashboard_elements/{id}?fields=result_maker`) if it already has other filters/listens you need to preserve — this PATCH replaces the whole `filterables` array.

## Visually verify vis_config changes (render_tasks)

Don't guess at `vis_config` behavior and ask the user to check the live dashboard each iteration — render the tile yourself and look at it. This was the single biggest time-saver once discovered.

```bash
# 1. Kick off a render (also works for /render_tasks/dashboards/{id}/png and /render_tasks/looks/{id}/png)
TASK_ID=$(curl -sS --globoff -X POST -H "Authorization: token $LOOKER_TOKEN" \
  -H "Content-Type: application/json" -d '{}' \
  "$LOOKER_BASE_URL/api/4.0/render_tasks/queries/$QUERY_ID/png?width=650&height=800" | jq -r '.id')

# 2. Poll until status is success/failure (typically enqueued_for_render -> querying -> success, ~10-30s)
curl -sS --globoff -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/render_tasks/$TASK_ID" | jq -r '.status'

# 3. Download the image once successful
curl -sS --globoff -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/render_tasks/$TASK_ID/results" -o /tmp/preview.png
```

Then view `/tmp/preview.png` with an image-capable tool. This is how the `vis_config` quirks above were actually confirmed, instead of guessed at.

- Rendering a `query_id` directly was reliable; rendering a `dashboard_element_id` directly failed once for no clear reason — prefer rendering the element's underlying `query_id`.
- Use a `width`/`height` close to the tile's real on-dashboard pixel size when checking things like column fit/wrapping.

## LookML dashboards (this repo)

If the user wants a dashboard that lives in the LookML project (as opposed to a UDD), edit `.dashboard.lookml` files instead of calling the API.

- Reference for the file format: https://cloud.google.com/looker/docs/reference/param-lookml-dashboard
- Element (tile) params: https://cloud.google.com/looker/docs/reference/param-element

Deployment path (Looker-side): commit + push on a Looker dev branch, then use Looker's **Validate LookML** + **Deploy to Production** flow (either via the Looker UI or the [Project](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Project) endpoints). No REST `POST` creates the dashboard — LookML dashboards are code-defined.

### Converting a UDD prototype into a permanent LookML dashboard

If a UDD was built via the API (e.g. as a fast prototype) and now needs to become
a checked-in `.dashboard.lookml` file, don't hand-translate every tile — export it:

    GET /dashboards/lookml/{dashboard_id}

Returns `{"dashboard_id": ..., "lookml": "<full yaml text>"}`. This round-trips
exactly with what the Looker UI's own "Get LookML" UDD export produces, including
`dynamic_fields`, `listen` filter wiring, layout `row`/`col`/`width`/`height`, and
the dashboard-level `filters:` block — no manual reconstruction needed.

```bash
curl -sS --globoff -H "Authorization: token $LOOKER_TOKEN" \
  "$LOOKER_BASE_URL/api/4.0/dashboards/lookml/$DASHBOARD_ID" | jq -r '.lookml' > new_dashboard.lookml
```

Before checking in:
- Rename the `dashboard:` id and `title:` if the new permanent dashboard should
  have a different name than the source UDD (e.g. prototyped inside an existing
  dashboard, promoted under its own name).
- Drop the `preferred_slug:` line — it's the old UDD's slug; let Looker mint a
  fresh one for the new LookML dashboard on first deploy.
- Save as `dashboards/<name>.dashboard.lookml`. Check the relevant
  `models/*.model.lkml` for an `include: "/dashboards/*.dashboard*"` (or similar
  glob) — if present, the file is picked up automatically with no other wiring.

Known limitation (per Looker's public forum): this call can fail with "dashboard
contains query or look elements with more than one filterables_listen" if a tile
listens to more than one dashboard filter. Didn't hit this here (each tile had
exactly one `listen`), but worth knowing if it 400s.

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
4. For UDDs: build up with `POST /dashboards`, then `POST /queries` (with `vis_config`) for each tile's data, then `POST /dashboard_elements` (body includes `dashboard_id` and `query_id` — not a nested path), then `PATCH /dashboard_layout_components/{id}` to position it, then `.../dashboard_filters` + `listen` wiring if needed. See "UDD gotchas learned the hard way" below for the traps in this flow.
5. For LookML dashboards: write/edit the `.dashboard.lookml` file, referencing existing views/explores in the repo; open a PR; deploy via Looker.
6. Prefer sparse fieldsets (`?fields=...`) on all reads to keep responses reviewable.
7. Read `422` error bodies fully — they tell you exactly which field failed validation.
