# PawDuty 🐾

A pet-care coordination system: track vaccinations, medicine, grooming, and everyday
chores across your pets, visualise progress, and run an **AI thermal health scan** that
classifies a cat as healthy or unhealthy from a thermal photo. The mobile app is backed
by two FastAPI services.

Project Report link: https://docs.google.com/document/d/11zZB2eenNUePbnqTZdvYQKI4fR33s5LdiiwukgThjZI/edit?usp=sharing

> This README documents the **whole system** (mobile app + both backends). The app lives
> in `pawduty-fe/`; the two services live in the sibling repo `ml-pawduty` as `task-api/`
> and `service/`.

---

## Table of contents

- [System architecture](#system-architecture)
- [Features](#features)
- [Technology used](#technology-used)
- [Repository layout](#repository-layout)
- [Running the full system](#running-the-full-system)
- [Deployment (Railway)](#deployment-railway)
- [Testing](#testing)
- [Testing matrix](#testing-matrix)
- [Acknowledgements](#acknowledgements)

---

## System architecture

Three components. The mobile app is the client; the two FastAPI services are independent
backends it talks to over HTTP.

```
                          ┌───────────────────────────────────────┐
                          │           pawduty-fe (Expo)           │
                          │   React Native app · expo-router      │
                          │   TaskContext (global state)          │
                          │                                       │
                          │  utils/api.js  ─────┐  utils/mlApi.js │
                          └──────────┬──────────┼─────────┬───────┘
                        HTTP (JSON)  │          │         │ HTTP (multipart image)
                                     ▼          │         ▼
                     ┌───────────────────────┐  │  ┌────────────────────────────┐
                     │  task-api  (:8001)    │  │  │  service / ml-heat (:8000) │
                     │  FastAPI + SQLite     │  │  │  FastAPI + scikit-learn    │
                     │                       │  │  │                            │
                     │  /health              │  │  │  POST /scan                │
                     │  GET/POST  /tasks     │  │  │   (thermal image →         │
                     │  GET/PATCH/DELETE     │  │  │    {tag, confidence})      │
                     │            /tasks/{id}│  │  │                            │
                     │  GET  /pets           │  │  │  StandardScaler +          │
                     │                       │  │  │  LogisticRegression over   │
                     │  pawduty_tasks.db     │  │  │  4 body-temperature feats  │
                     └───────────────────────┘  │  └────────────────────────────┘
                                                 │
                                     AsyncStorage │ (user profile only, on device)
                                                 ▼
```

**Data flow**

- **Tasks & pets** — the source of truth is `task-api` (FastAPI + SQLite). `TaskContext`
  loads tasks and pets on mount, and every create/edit/toggle/delete is an HTTP call to
  `task-api`. On first run the service seeds 6 demo tasks + 2 pets.
- **User profile** — stored **on-device** in AsyncStorage (there is no user endpoint).
- **AI thermal scan** — the AI tab captures a photo with `expo-camera` and POSTs it to
  the `ml-heat` service `/scan`, which returns `{ tag: "healthy" | "unhealthy",
  confidence }`. The result can be turned into a follow-up task.
- **Host discovery** — both API base URLs are derived from the Expo dev host at runtime
  (`expo-constants`), so a phone on the same Wi-Fi reaches the services with no manual IP.
  Each has an `OVERRIDE` constant for tunnel/production use.

**Ports:** Metro `8081` · `task-api` `8001` · `ml-heat service` `8000`.

---

## Features

**Task management (CRUD, backed by task-api)**
- Create tasks with category (Vaccination / Medicine / Grooming / Other), pet, assignee,
  date, optional time, repeat (Once / Daily / Weekly / Monthly), and notes.
- Edit any task (tap a card → prefilled form → save = `PATCH`).
- Delete a task (trash icon → confirm).
- Toggle done from the list — optimistic UI with revert on failure.
- Server generates task ids and derives assignee initials from the name.

**Home**
- Greeting + Daily / Weekly / Monthly segmented filter.
- Loading spinner while tasks load; an error banner with **Retry** if a service is
  unreachable (API is the source of truth — no stale cache).

**Progress**
- Month calendar with per-day multi-dot markers (done vs pending).
- Completion pie chart (Done vs Pending) for the selected period.
- Total / Done / Pending stat tiles.

**AI thermal health scan**
- Full-screen camera viewfinder with a scan frame; capture → classify.
- Result card shows **HEALTHY** / **NEEDS ATTENTION**, a plain-language explanation, and
  the model's confidence.
- "Add as Task" prefills a follow-up (e.g. a vet check-up) on the Add screen.
- Graceful errors: unreachable service or "no cat body detected" (422) surface a message.

**Profile**
- Editable display name (persisted to AsyncStorage).
- Pets list (name, breed, colour) from the backend.
- Total-tasks / done-this-month stats; notification & dark-mode setting placeholders.

---

## Technology used

| Layer | Technology |
|---|---|
| **Mobile app** | React Native `0.86`, React `19`, Expo SDK `57` (managed), Expo Router (file-based tabs) |
| App state | React Context + hooks; `@react-native-async-storage/async-storage` (user profile only) |
| Networking | `fetch` (single `utils/api.js` + `utils/mlApi.js` boundaries), base URL auto-derived via `expo-constants` |
| UI / device | `@expo/vector-icons` (Ionicons), `expo-camera`, `@react-native-community/datetimepicker`, `react-native-calendars`, `react-native-chart-kit`, `react-native-svg` |
| **task-api** | Python 3, FastAPI, Pydantic v2, stdlib `sqlite3` (no ORM), Uvicorn |
| **ml-heat service** | Python 3, FastAPI, scikit-learn (`StandardScaler` + `LogisticRegression`), OpenCV (`opencv-python-headless`), NumPy, `pytesseract` + system **Tesseract OCR**, `joblib` |
| **Testing** | Jest + `jest-expo` + `@testing-library/react-native` (app); `pytest` + `httpx` TestClient (both services) |

---

## Repository layout

```
pawduty/  (repo: ml-pawduty)
├── pawduty-fe/                 # THIS repo — the Expo React Native app
│   ├── app/(tabs)/             # Home, Progress, Add, AI, Profile screens
│   ├── components/             # TaskCard, CategoryBadge, PetAvatar, SectionHeader
│   ├── context/TaskContext.jsx # global state, talks to task-api
│   ├── utils/                  # api.js (task-api), mlApi.js (thermal), dateFilters.js
│   ├── constants/              # api.js / mlApi.js (base URLs), theme.js
│   └── __tests__/              # Jest suites
├── task-api/                   # FastAPI + SQLite task-CRUD service (:8001)
│   ├── app/                    # schema.py, db.py, repository.py, main.py
│   └── tests/                  # pytest
└── service/                    # ml-heat cat-thermal-health service (:8000)
    ├── api/                    # FastAPI /scan
    ├── pawduty_ml/             # preprocessing, model, dataset walker, training
    └── tests/                  # pytest (+ fixtures)
```

---

## Running the full system

You need three processes: the two backends and the Metro dev server. Start the backends
first so the app has something to talk to.

### 1. task-api (tasks & pets) — port 8001

```bash
cd task-api
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001
```
First run creates and seeds `pawduty_tasks.db` (2 pets, 6 tasks). Docs at
`http://localhost:8001/docs`.

### 2. ml-heat service (AI thermal scan) — port 8000

```bash
cd service
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
# REQUIRED: the system Tesseract OCR binary (temperature-badge calibration)
#   Arch:   sudo pacman -S tesseract tesseract-data-eng
#   Debian: sudo apt install tesseract-ocr
.venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000
```
> Without Tesseract the OCR calibration falls back to uncalibrated values and accuracy
> drops to ~chance (52%). With it, the model runs at its 76.5% baseline.

### 3. The app (Metro) — port 8081

```bash
cd pawduty-fe
npm install
npm start          # then scan the QR with Expo Go, or press a / i / w
```

| Command | What it does |
|---|---|
| `npm start` | Start Metro; scan the QR with Expo Go |
| `npm run android` | Launch on a connected Android device / emulator |
| `npm run ios` | Launch on the iOS simulator (macOS only) |
| `npm run web` | Run in the browser via Metro |
| `npm test` | Run the Jest test suite |

**Prerequisites:** Node.js 18+, npm; Python 3.10+; Tesseract OCR (for the scan service);
the Expo Go app ([iOS](https://apps.apple.com/app/expo-go/id982107779) /
[Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) for a real device.

**Networking note:** on a physical device, the app auto-detects your machine's LAN IP from
the Metro host. If that fails (VPN, tunnel), set `OVERRIDE` in `constants/api.js` (task-api)
and/or `constants/mlApi.js` (scan service) to `http://<your-ip>:8001` / `:8000`.

---

## Deployment (Railway)

Both backends run in production on [Railway](https://railway.com/), each as its own project
built straight from its directory in the `ml-pawduty` repo. The Expo app runs from Metro
(Expo Go / dev build) and reaches them via the `OVERRIDE` constants below.

> **The live endpoint URLs are intentionally kept out of this repo.** Get them from the
> Railway dashboard (or `railway domain`) and keep them in an untracked local config — see
> "Point the app at production". Placeholders below stand in for the real hostnames.

| Service | URL | Build |
|---|---|---|
| **ml-heat** (`service/`) | `https://<ml-heat-host>` | `Dockerfile` — `python:3.12-slim` + system **Tesseract OCR**, `scikit-learn==1.9.0` pinned to the shipped `.joblib` model |
| **task-api** (`task-api/`) | `https://<task-api-host>` | Railpack (FastAPI auto-detected) + `Procfile` start command |

> **task-api persistence:** SQLite lives on the container's ephemeral filesystem, so the DB
> re-seeds (2 pets, 6 tasks) on every redeploy. Attach a Railway volume for durable data.

**Smoke-test the live services** (substitute your real hosts):

```bash
# ml-heat — interactive docs, a real scan, and a no-body case (422)
curl -s -o /dev/null -w "%{http_code}\n" https://<ml-heat-host>/docs   # → 200
curl -F "image=@service/tests/fixtures/sick_indoor_caged.jpg" \
     https://<ml-heat-host>/scan     # → {"tag":"unhealthy","confidence":0.69}

# task-api — health + seeded data
curl https://<task-api-host>/health   # → {"status":"ok"}
curl https://<task-api-host>/tasks     # → 6 seeded tasks
```

**Point the app at production** — set the `OVERRIDE` constants to your real hosts (each
falls back to the Expo-host-derived localhost URL when `null`). Keep the real URLs out of
version control — leave the committed defaults as `null` and override locally:

```js
// constants/mlApi.js
export const ML_OVERRIDE = 'https://<ml-heat-host>';
// constants/api.js
export const OVERRIDE = 'https://<task-api-host>';
```

**Redeploy** — from either service directory (each is linked to its Railway project):

```bash
cd service   && railway up      # ml-heat  — rebuilds the Dockerfile
cd task-api  && railway up      # task-api
```

---

## Testing

```bash
cd pawduty-fe && npm test          # app: Jest + jest-expo
cd task-api   && .venv/bin/pytest  # task-api: pytest
cd service    && .venv/bin/pytest  # ml-heat: pytest (needs Tesseract)
```

**Latest run — all green (106 tests total):**

| Suite | Command | Result |
|---|---|---|
| App (pawduty-fe) | `npm test` | **13 suites, 54 tests passed** |
| task-api | `pytest` | **39 passed** |
| ml-heat service | `pytest` | **13 passed** |

---

## Testing matrix

Feature-level acceptance results. "Real output" is from the runs above plus a live
end-to-end pass against both services (task-api on `:8001`, ml-heat on `:8000`).

| # | Feature | Steps | Expected output | Real output | Pass/Fail |
|---|---|---|---|---|---|
| 1 | First-run seed | Fresh DB → `GET /tasks`, `GET /pets` | 6 tasks, 2 pets | `count=6`, `count=2` | ✅ Pass |
| 2 | Create task | `POST /tasks` with no `id`, `assignee:{name:"Al Bee"}` | `201`, server `id`, initials derived, `done:false` | `HTTP 201`, `id=dda46846…`, `initials=AB` | ✅ Pass |
| 3 | Read + Daily/Weekly/Monthly filter | Select each segment on Home | Only tasks in today / ISO week / month | `dateFilters` 4/4 tests pass; daily = today only | ✅ Pass |
| 4 | Toggle done (optimistic) | Tap checkbox → `PATCH {done:true}` | Flips immediately, reconciles with server; reverts on failure | `PATCH → done:true`; `TaskContext` revert test passes | ✅ Pass |
| 5 | Edit task | Tap card → change fields → save → `PATCH` | Only changed fields updated; initials re-derived | `title="Renamed via edit"`, `initials=CD` | ✅ Pass |
| 6 | Delete task (optimistic) | Trash → confirm → `DELETE`, then `GET` | `204`, task gone (`404`); count restored | `204 → 404`; count `6→7→6` | ✅ Pass |
| 7 | Input validation | `POST` blank title / bad category | `422` both | `422`, `422` | ✅ Pass |
| 8 | Offline error + retry (Home) | task-api down → open Home → tap Retry | Error banner + "Retry" re-calls API | Banner shown; `listTasks` called ×2 on retry (`HomeScreen` test) | ✅ Pass |
| 9 | AI scan — API contract | `POST /scan` with a thermal JPEG; and a blank frame | `200 {tag, confidence}`; `422` when no body | sick fixture → `{"unhealthy",0.68}`; blank → `422`; service 13/13 | ✅ Pass |
| 10 | AI scan — UI (result / error) | Mock scan resolve/reject in app | Result card (HEALTHY/NEEDS ATTENTION) / error text | `AIScreen` 4/4 tests pass | ✅ Pass |
| 11 | AI scan — model accuracy | Classify labelled fixtures with the real model | ~76.5% (research baseline; imperfect) | sick→unhealthy ✅; 2 healthy fixtures → unhealthy ✗ — consistent with 76.5% CV | ⚠️ Baseline (76.5% ± 4.5%) |
| 12 | Progress view | Open Progress | Segments + Total/Done/Pending + calendar + chart | `ProgressScreen` 2/2 tests pass | ✅ Pass |
| 13 | Profile edit persists | Edit name → save | Name updates + written to AsyncStorage | `TaskContext` `updateUser` test passes | ✅ Pass |
| 14 | Full regression | Run all three suites | 0 failures | FE 54 + task-api 39 + ml-heat 13 = **106 passed** | ✅ Pass |

> **On row 11:** the thermal classifier is a reproduced research baseline at **76.5% ± 4.5%**
> (5-fold GroupKFold CV, grouped by cat — it beats the source paper's 73.42%). It is *not*
> a diagnostic tool and misclassifies individual images; the two healthy sample fixtures
> above were flagged "unhealthy" in this live run. The app treats every result as a
> non-authoritative suggestion ("a vet check-up is recommended").

---

## Acknowledgements

**Dataset**
- **"Thermal Image Dataset of cats for their health monitoring and classification."** The
  `ml-heat` thermal-health model is trained and evaluated on this dataset (indoor/outdoor,
  healthy/sick, grouped by individual cat). All credit for the imagery belongs to the
  dataset's authors. The dataset is used here for research/educational purposes only.
- The classifier reproduces (and slightly beats, 76.5% vs 73.42%) the segmentation →
  temperature-histogram → logistic-regression baseline from the **cited `ml-heat` paper**
  that accompanies the dataset.

**Open-source software**
- **App:** [React Native](https://reactnative.dev/), [React](https://react.dev/),
  [Expo](https://expo.dev/) & [Expo Router](https://docs.expo.dev/router/introduction/),
  `expo-camera`, `expo-constants`, `@react-native-async-storage/async-storage`,
  `@react-native-community/datetimepicker`,
  [react-native-calendars](https://github.com/wix/react-native-calendars),
  [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit),
  [react-native-svg](https://github.com/software-mansion/react-native-svg),
  `@expo/vector-icons` (Ionicons).
- **Backends:** [FastAPI](https://fastapi.tiangolo.com/),
  [Uvicorn](https://www.uvicorn.org/), [Pydantic](https://docs.pydantic.dev/),
  [scikit-learn](https://scikit-learn.org/), [OpenCV](https://opencv.org/),
  [NumPy](https://numpy.org/), [pytesseract](https://github.com/madmaze/pytesseract) +
  [Tesseract OCR](https://github.com/tesseract-ocr/tesseract),
  [joblib](https://joblib.readthedocs.io/), `python-multipart`.
- **Testing:** [Jest](https://jestjs.io/), `jest-expo`,
  [@testing-library/react-native](https://callstack.github.io/react-native-testing-library/),
  [pytest](https://pytest.org/), [httpx](https://www.python-httpx.org/).

**APIs / services**
- No third-party/paid external APIs. Both backends (`task-api`, `ml-heat`) are self-hosted
  in this repo. Expo's developer tooling (Metro, Expo Go) is used for local development.

---

*PawDuty is a hackathon project. The thermal health scan is an experimental,
non-diagnostic aid — always consult a veterinarian for real health concerns.*
