# PawDuty Frontend ↔ Task API Wiring — Design Spec

**Date:** 2026-07-08
**Project:** `pawduty-fe` (Expo/React Native app)
**Backend:** `task-api` (FastAPI + SQLite, sibling repo folder) — merged on `main`
**Scope:** Replace the frontend's local task/pet persistence with HTTP calls to the Task API, and add the missing Delete + Edit UI so all four CRUD verbs are reachable and testable.

---

## 1. Overview

Today `pawduty-fe` stores tasks/pets/user in AsyncStorage and seeds them on first
launch (`context/TaskContext.jsx` + `data/seed.js`). This change makes the **Task
API the source of truth for tasks and pets**, while the **user profile stays
local** (the backend intentionally has no user endpoint). The UI gains a Delete
affordance and an Edit mode so every CRUD operation is usable, not just wired.

**Success = all four CRUD verbs reachable from the UI, each covered by an
input/output test, the existing Jest suite kept green, and a live contract check
against the running backend.**

---

## 2. Backend contract (already built & tested)

| CRUD | Method | Path | Request | Response |
|---|---|---|---|---|
| Create | POST | `/tasks` | `TaskCreate` (no `id`; `assignee` may omit `initials`) | `201` Task (server `id`, derived `initials`) |
| Read (list) | GET | `/tasks` | — | `200` Task[] |
| Read (one) | GET | `/tasks/{id}` | — | `200` Task or `404` |
| Update | PATCH | `/tasks/{id}` | partial fields | `200` Task or `404` |
| Delete | DELETE | `/tasks/{id}` | — | `204` or `404` |
| Pets | GET | `/pets` | — | `200` Pet[] |
| Health | GET | `/health` | — | `200 {"status":"ok"}` |

Validation errors return `422` with `{"detail":[{"loc":[...],"msg":"..."}]}`.
Task JSON shape already matches the frontend's task object exactly (nested
`assignee`, camelCase `petId`, `avatarColor`).

---

## 3. New/changed files

| File | Change | Responsibility |
|---|---|---|
| `constants/api.js` | **new** | Derive `API_BASE` from the Expo host; `PORT`, `OVERRIDE` |
| `utils/api.js` | **new** | `fetch` wrapper + `ApiError`; CRUD methods (single network boundary) |
| `context/TaskContext.jsx` | **rewrite** | Fetch from API; `loading`/`error`/`reload`; `addTask`/`editTask`/`toggleTaskDone`/`deleteTask`; user stays in AsyncStorage |
| `components/TaskCard.jsx` | **modify** | Add optional delete (trash icon) + tap-to-edit affordances |
| `app/(tabs)/index.jsx` | **modify** | Loading spinner + error/retry banner; pass edit/delete handlers |
| `app/(tabs)/add.jsx` | **modify** | Edit mode (prefill from `editId`); PATCH on edit, POST on create; drop client `generateId`/initials |
| `data/seed.js` | **modify** | Keep `SEED_USER` only (used for local user default); `SEED_PETS`/`SEED_TASKS` no longer wired into context |
| `__tests__/**` | **modify/new** | Mock `utils/api`; per-operation input/output tests |

`utils/uuid.js` becomes unused by the Add flow (server assigns ids); leave the file in place (still exported) unless nothing references it, in which case remove it.

---

## 4. Base URL derivation (`constants/api.js`)

```js
import Constants from 'expo-constants';

export const PORT = 8001;          // matches task-api README run command
export const OVERRIDE = null;      // set e.g. 'http://192.168.1.42:8001' for tunnel/edge cases

function deriveHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost || '';
  const host = hostUri.split(':')[0];
  return host ? `http://${host}:${PORT}` : `http://localhost:${PORT}`;
}

export const API_BASE = OVERRIDE || deriveHost();
```

Rationale: in Expo Go, `hostUri` is the Metro server on the dev machine (e.g.
`192.168.1.42:8081`); reusing that host with the API port reaches the backend
from a physical device with no manual configuration.

---

## 5. API client (`utils/api.js`)

- `class ApiError extends Error { status; detail }`.
- Private `request(path, options)`: `fetch(API_BASE+path, {headers:{'Content-Type':'application/json'}, ...options})`; on `!res.ok` throw `ApiError(res.status, parsedDetail)`; on `204` return `null`; else `res.json()`.
- Methods:
  - `listTasks()` → `GET /tasks`
  - `getTask(id)` → `GET /tasks/${id}`
  - `createTask(body)` → `POST /tasks` (body has no `id`)
  - `updateTask(id, fields)` → `PATCH /tasks/${id}`
  - `deleteTask(id)` → `DELETE /tasks/${id}`
  - `listPets()` → `GET /pets`

This module is the only place that references `fetch`/`API_BASE`, so tests mock it wholesale.

---

## 6. TaskContext behavior

State: `tasks`, `pets`, `user`, `loading`, `error`. Context value adds
`reload`, `addTask`, `editTask`, `toggleTaskDone`, `deleteTask`, keeps `updateUser`.

- **Load (Read):** on mount, `setLoading(true)`, `Promise.all([api.listTasks(), api.listPets()])`, set state; on failure set `error`; always clear `loading`. `reload()` repeats it (used by the retry banner).
- **User:** loaded from/saved to AsyncStorage (`@pawduty_user`), defaulting to `SEED_USER`. `updateUser` unchanged.
- **addTask(input) (Create):** strip any `id` from `input`, `const created = await api.createTask(body)`, `setTasks(prev => [...prev, created])`, return `created`. Throws on failure (caller handles).
- **editTask(id, fields) (Update):** `const updated = await api.updateTask(id, fields)`, replace in state, return it. Throws on failure.
- **toggleTaskDone(id) (Update, optimistic):** flip `done` in state immediately; `await api.updateTask(id,{done:next})`; reconcile with response; on error revert the flip and set `error`.
- **deleteTask(id) (Delete, optimistic):** remove from state immediately; `await api.deleteTask(id)`; on error re-insert and set `error`.

---

## 7. UI changes

- **TaskCard** gains optional `onEdit(task)` and `onDelete(task)` props. Tapping the card body calls `onEdit`; a trash icon (right side) calls `onDelete`. When props are absent, those affordances don't render (keeps the component reusable and existing tests valid).
- **Home** (`index.jsx`): if `loading` → centered spinner; if `error` → a banner with the message + a "Retry" button calling `reload()`. TaskCards receive `onEdit` (→ `router.push('/(tabs)/add?editId='+id)`) and `onDelete` (→ confirm `Alert` → `deleteTask(id)`).
- **Add** (`add.jsx`): reads `editId` param. If present, prefill all fields from the task in context and title the screen "Edit Task"; Save calls `editTask(editId, {...fields})` then navigates back. If absent, behaves as today but Save calls `addTask({...fields})` (no `id`, `assignee:{name}` — server derives initials). Existing `prefillTitle`/`prefillCategory` (from the AI screen) still work for the create path. `handleSave` wraps the call in try/catch: on `ApiError`, show an `Alert` and stay on the form.

---

## 8. Testing

**API client (`__tests__/utils/api.test.js`)** — mock `global.fetch`:
- each method issues the correct method + URL (+ JSON body where applicable), returns parsed data
- `createTask` body carries no `id`
- non-2xx → `ApiError` with `.status` and `.detail`
- `204` (delete) resolves to `null`

**Context (`__tests__/context/TaskContext.test.js`)** — `jest.mock('../../utils/api')`:
- initial load populates tasks/pets from the mocked api
- `addTask` appends the server-returned task
- `editTask` replaces fields
- `toggleTaskDone` flips optimistically and reconciles; on rejection, reverts
- `deleteTask` removes; on rejection, re-inserts

**Screens** — `jest.mock('../../utils/api')` in Home/Add/Profile/Progress tests (replaces the old AsyncStorage-seed mock, and sidesteps `expo-constants`). Add a Home test for the error/retry banner and an Add test for edit-mode prefill.

**Live contract re-check** — with `uvicorn app.main:app --port 8001` running, replay each frontend request shape (via curl/node) and confirm status codes/bodies match what the client expects. This proves the wiring against the real backend, not just mocks.

---

## 9. Out of scope

- User CRUD over HTTP (backend has no user endpoint by design).
- Offline cache/fallback (chosen: API is source of truth; offline shows error/retry).
- Auth, pagination, real-time sync.

---

## 10. Success Criteria

- [ ] `constants/api.js` derives a device-reachable base URL from the Expo host
- [ ] `utils/api.js` exposes all six CRUD/read methods with `ApiError` handling
- [ ] TaskContext loads tasks+pets from the API with loading/error/retry; user stays local
- [ ] Create, Read, Update (toggle + edit), and Delete are all reachable from the UI
- [ ] Every wired operation has an input/output test; full Jest suite passes
- [ ] Live contract check against the running backend passes for all endpoints
