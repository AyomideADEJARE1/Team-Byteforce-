# SignalLoop API Documentation

**Version:** 1.0 (backend scaffold)  
**Stack:** Flask, PostgreSQL, SQLAlchemy, JWT Bearer authentication  
**Status:** Development API — not yet production-ready

This document describes the routes currently implemented in `backend/app/`. It is intended for the frontend developer integrating the existing HTML/CSS/JavaScript client.

## 1. Base URL

Local development:

```text
http://127.0.0.1:5000/api
```

Replace this with the deployed backend URL when the API is hosted. GitHub Pages can host the static frontend, but it cannot run this Flask API or PostgreSQL database.

## 2. Request and response conventions

- Send JSON bodies with `Content-Type: application/json`.
- Protected routes require `Authorization: Bearer <access_token>`.
- Responses are JSON.
- IDs in path parameters are integer IDs.
- Access tokens expire after 30 minutes by default. Sign in again when a token expires; refresh tokens are not implemented.
- Maximum request body size is 5 MB.
- Timestamps are ISO-8601 strings.

## 3. Authentication

### Register a student

`POST /auth/register`

Public. Registration always creates a `student` account. Any `role` supplied by the client is ignored.

Request:

```json
{
  "email": "student@example.edu",
  "display_name": "Demo Student",
  "password": "Use-a-long-password-123!"
}
```

Validation:
- `email`: valid email, maximum 254 characters.
- `display_name`: required, maximum 100 characters.
- `password`: 12–128 characters.

Success: `201 Created`

```json
{
  "user": {
    "id": 1,
    "email": "student@example.edu",
    "display_name": "Demo Student",
    "role": "student",
    "created_at": "2026-10-20T12:00:00+00:00"
  },
  "access_token": "<jwt>",
  "token_type": "Bearer"
}
```

### Sign in

`POST /auth/login`

Public.

Request:

```json
{
  "email": "student@example.edu",
  "password": "Use-a-long-password-123!"
}
```

Success: `200 OK`. Returns the same `user`, `access_token`, and `token_type` structure as registration.

Invalid credentials: `401 Unauthorized`, `error: "invalid_credentials"`.

### Get current user

`GET /auth/me`

Requires a valid Bearer token.

Success: `200 OK`

```json
{
  "user": {
    "id": 1,
    "email": "student@example.edu",
    "display_name": "Demo Student",
    "role": "student",
    "created_at": "2026-10-20T12:00:00+00:00"
  }
}
```

Use the returned `user.role` to determine which UI to display. The server—not the frontend—enforces permissions.

## 4. Health check

### Check API and database connectivity

`GET /health`

Public. This route checks the database connection as well as the API.

Healthy: `200 OK`

```json
{"status": "ok", "database": "connected"}
```

Database unavailable: `503 Service Unavailable`

```json
{"status": "error", "database": "unavailable"}
```

## 5. Incidents

Incident routes are under `/incidents`. All routes in this section require authentication unless stated otherwise.

### List incidents

`GET /incidents`

- Student: returns only incidents reported by that student.
- Admin: returns all incidents.

Success: `200 OK`

```json
{
  "items": [
    {
      "id": 1,
      "t": "Broken streetlight",
      "c": "Power & lighting",
      "l": "Library Road",
      "p": "high",
      "s": "sub",
      "m": 1,
      "reporter": {
        "id": 1,
        "email": "student@example.edu",
        "display_name": "Demo Student",
        "role": "student",
        "created_at": "2026-10-20T12:00:00+00:00"
      },
      "d": "The light has been off for three nights.",
      "dept": null,
      "due": null,
      "ph": false,
      "photo_filename": null,
      "created_at": "2026-10-20T12:00:00+00:00",
      "updated_at": "2026-10-20T12:00:00+00:00",
      "resolved_at": null
    }
  ],
  "count": 1
}
```

The incident object uses short keys to align with the current prototype:
- `t`: title
- `c`: category
- `l`: location
- `p`: priority
- `s`: status
- `m`: reporter user ID
- `d`: description
- `dept`: assigned department
- `due`: due date/time
- `ph`: whether photo metadata exists (photo upload is not implemented)

### Create an incident

`POST /incidents`

Authenticated student or admin. The incident reporter is taken from the authenticated user; do not send a reporter ID.

Request:

```json
{
  "t": "Broken streetlight",
  "c": "Power & lighting",
  "l": "Library Road",
  "p": "high",
  "d": "The light has been off for three nights."
}
```

Long-form aliases are also accepted: `title`, `category`, `location`, `priority`, `description`.

Allowed categories:
- `Power & lighting`
- `Water & plumbing`
- `Road / walkway`
- `Waste / sanitation`
- `Facilities`
- `Safety & security`

Allowed locations:
- `Library Road`
- `Hostel Block C`
- `Science Complex`
- `Student Centre`
- `North Gate`
- `Main Hall`

Allowed priorities: `low`, `med`, `high`, `urg`. Priority defaults to `med`.

Validation: title required (maximum 160 characters); description required (maximum 5,000 characters); category and location must match the allowed values.

Success: `201 Created`

```json
{"incident": { "id": 1, "t": "Broken streetlight", "c": "Power & lighting", "l": "Library Road", "p": "high", "s": "sub" }}
```

The example above is abbreviated; the actual incident object includes the full fields described in the List Incidents section.

### Get incident details

`GET /incidents/{incident_id}`

- Reporter or admin can access the incident.
- A student requesting another user's incident receives `404 Not Found`.
- Admin response includes an additional `audit` array.

Success: `200 OK`

```json
{
  "incident": { "...": "incident object" },
  "audit": [
    {
      "id": 1,
      "actor": { "...": "user object" },
      "incident_id": 1,
      "action": "incident.created",
      "details": {"status": "sub"},
      "created_at": "2026-10-20T12:00:00+00:00"
    }
  ]
}
```

The `audit` field is returned for admins only.

### Update an incident (admin only)

`PATCH /incidents/{incident_id}`

Requires an admin token. Send one or more supported fields.

Request example:

```json
{
  "s": "asg",
  "dept": "Electrical Services",
  "due": "2026-10-21T14:00:00Z",
  "p": "high"
}
```

Long-form aliases accepted:
- `status` for `s`
- `priority` for `p`
- `assigned_department` for `dept`
- `due_date` for `due`

Allowed statuses:
- `sub` — submitted
- `rev` — under review
- `asg` — assigned
- `prg` — in progress
- `res` — resolved
- `rej` — rejected

Allowed priorities: `low`, `med`, `high`, `urg`.

Allowed departments:
- `Facilities & Maintenance`
- `Electrical Services`
- `Water & Plumbing`
- `Sanitation`
- `Campus Security`

The due date must be an ISO-8601 datetime. Send an empty string to clear it. Supplying a status of `res` records a resolution timestamp; changing to a non-resolved status clears it.

Success: `200 OK` with `{"incident": ...}`.

### Get incident audit history (admin only)

`GET /incidents/{incident_id}/audit`

Success: `200 OK`

```json
{"items": [{"id": 1, "incident_id": 1, "action": "incident.created", "details": {"status": "sub"}, "created_at": "2026-10-20T12:00:00+00:00"}]}
```

### Record a duplicate review (admin only)

`POST /incidents/{incident_id}/duplicate-reviews`

Request:

```json
{
  "possible_duplicate_id": 2,
  "decision": "duplicate",
  "note": "Same location and issue."
}
```

- `possible_duplicate_id`: integer ID of another existing incident, different from the path ID.
- `decision`: `duplicate` or `different`.
- `note`: optional; stored up to 500 characters.

Success: `201 Created`

```json
{
  "id": 1,
  "incident_id": 1,
  "possible_duplicate_id": 2,
  "decision": "duplicate",
  "note": "Same location and issue.",
  "created_at": "2026-10-20T12:00:00+00:00"
}
```

## 6. Admin overview

### Get dashboard summary (admin only)

`GET /admin/overview`

Requires an admin token.

Success: `200 OK`

```json
{
  "total_incidents": 12,
  "total_students": 80,
  "by_status": {
    "sub": 3,
    "rev": 2,
    "asg": 1,
    "prg": 2,
    "res": 3,
    "rej": 1
  },
  "recent_audit_events": []
}
```

The counts above are illustrative; actual values depend on the database.

## 7. Error responses

Common status codes:

| HTTP status | Meaning |
|---|---|
| `200` | Request succeeded |
| `201` | Resource created |
| `400` | Invalid input or validation error |
| `401` | Missing, invalid, or expired token; invalid credentials |
| `403` | Authenticated user lacks admin permissions |
| `404` | Resource not found or not visible to this user |
| `409` | Email already registered |
| `413` | Request body exceeds 5 MB |
| `500` | Unexpected server error |
| `503` | Database health check failed |

Most errors use this structure:

```json
{
  "error": "validation_error",
  "message": "Choose a supported incident category."
}
```

Important error codes include `authentication_required`, `invalid_token`, `token_expired`, `invalid_credentials`, `email_exists`, `account_unavailable`, `forbidden`, `not_found`, `validation_error`, `payload_too_large`, and `internal_server_error`. Some unavailable-account or not-found paths return only an `error` field.

Frontend guidance:
- On `401`, clear the stored token and return the user to sign-in.
- On `403`, show a permission error; do not treat the client-side role as authority.
- On `400`, display the returned validation message.
- Do not expose server stack traces or database details to users.

## 8. JavaScript integration example

```js
const API_BASE = "http://127.0.0.1:5000/api";

async function apiRequest(path, { token, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || "API request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

// Example:
// const result = await apiRequest("/auth/login", {
//   method: "POST",
//   body: { email, password },
// });
// const token = result.access_token;
```

Change `API_BASE` to the deployed API URL for production. Do not commit credentials, JWT secrets, or a production `.env` file.

## 9. Current limitations and integration notes

The current backend scaffold does **not** yet implement:
- Photo upload or photo storage (the `ph` flag is metadata only).
- Email verification, password reset, or refresh tokens.
- Rate limiting or token revocation/versioning.
- Pagination.
- A public campus-wide incident exploration endpoint.
- AI categorisation or notifications.
- Production hosting/configuration.

CORS origins are configured using the `CORS_ORIGINS` environment variable. Add the exact deployed frontend origin before the frontend calls the API from a browser. For production, use HTTPS, strong unique `SECRET_KEY` and `JWT_SECRET_KEY` values, a managed PostgreSQL database, and a production WSGI server. Review the deployment configuration before exposing the API publicly.

## 10. Local API smoke test

With PostgreSQL configured and the Flask server running:

```bash
curl -i http://127.0.0.1:5000/api/health
```

Expected when the database is reachable:

```json
{"status": "ok", "database": "connected"}
```

See `backend/README.md` for local setup and migration instructions.
