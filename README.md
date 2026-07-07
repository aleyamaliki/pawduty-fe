# PawDuty 🐾

A React Native pet-care coordination app. Track vaccinations, medicine, grooming, and everyday chores across your pets — with a mocked AI scanner, progress charts, and local persistence.

Built with **Expo** (managed workflow), **Expo Router**, React Context + AsyncStorage. JavaScript only, no backend.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** (ships with Node) — a `package-lock.json` is committed, so `npm` is the canonical package manager here
- **Expo Go** app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) — for running on a real device
- Optional: Android Studio (emulator) or Xcode (iOS simulator, macOS only)

No global Expo CLI install is needed — the project uses the local `expo` binary via `npx`.

---

## Setup

```bash
cd pawduty-fe
npm install
```

---

## Running the app

Start the Metro dev server:

```bash
npm start
```

This prints a QR code. Then either:

- **On your phone:** open **Expo Go** and scan the QR code (Android: scan in-app; iOS: scan with the Camera app). Phone and computer must be on the same Wi-Fi.
- **Android emulator:** press `a` in the terminal, or run `npm run android`
- **iOS simulator** (macOS): press `i`, or run `npm run ios`
- **Web browser:** press `w`, or run `npm run web`

| Command | What it does |
|---|---|
| `npm start` | Start Metro; scan the QR with Expo Go |
| `npm run android` | Launch on a connected Android device / emulator |
| `npm run ios` | Launch on the iOS simulator (macOS only) |
| `npm run web` | Run in the browser via Metro |
| `npm test` | Run the Jest test suite |

### First launch

On first run the app seeds local data (2 pets, 6 sample tasks, user "Alex") into AsyncStorage, so every screen has content immediately. Data persists across restarts on that device/simulator.

> **Camera:** the **AI** tab needs camera permission and is a *mocked* scanner — it simulates a scan and returns a canned suggestion you can turn into a task. On a physical device you'll be prompted for camera access; on web/simulators the viewfinder may not be available.

---

## Testing

```bash
npm test
```

Runs the Jest (`jest-expo`) suite covering seed data, context, components, screens, and date-filter utilities.

---

## Project structure

```
pawduty-fe/
├── app/
│   ├── _layout.jsx          root layout — wraps the app in TaskProvider
│   └── (tabs)/
│       ├── _layout.jsx      bottom tab bar (Home, Progress, Add, AI, Profile)
│       ├── index.jsx        Home — task list + Daily/Weekly/Monthly filter
│       ├── progress.jsx     Progress — calendar + completion pie chart + stats
│       ├── add.jsx          Add Task — validated form
│       ├── ai.jsx           AI Scanner — mocked camera scan
│       └── profile.jsx      Profile — user, pets, stats, settings
├── components/              TaskCard, CategoryBadge, PetAvatar, SectionHeader
├── context/TaskContext.jsx  global state + AsyncStorage sync
├── data/                    seed.js (first-launch data), mockScans.js
├── utils/                   dateFilters.js, uuid.js
├── constants/theme.js       colors, spacing, radius
└── __tests__/               Jest tests
```

---

## Troubleshooting

- **Metro cache issues / stale bundle:** `npx expo start -c` to clear the cache.
- **Phone can't connect / stuck loading:** ensure phone and computer share the same network; try tunnel mode with `npx expo start --tunnel`.
- **Reset seeded data:** uninstall/reinstall the app in Expo Go (or clear its storage) to re-trigger the first-launch seed.
- **Dependency version mismatches:** run `npx expo install --check` to align packages with the installed Expo SDK.
