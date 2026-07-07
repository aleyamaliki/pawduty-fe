# PawDuty — Frontend Design Spec
**Date:** 2026-07-04
**Project:** `pawduty-fe`
**Scope:** Frontend only (no backend)

---

## 1. Overview

PawDuty is a React Native pet care coordination app that helps users organize pet care tasks including vaccination schedules, medicine reminders, and general pet chores. The app features 5 screens accessible via a bottom tab bar, AI-assisted scanning (mocked), and persistent local storage.

---

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Expo (managed workflow) |
| Routing | Expo Router (file-based, tab layout) |
| State | React Context + useReducer |
| Persistence | AsyncStorage |
| Language | JavaScript (no TypeScript) |
| Charts | `react-native-chart-kit` or `victory-native` |
| Calendar | `react-native-calendars` |
| Camera | `expo-camera` |

---

## 3. Project Structure

```
pawduty-fe/
├── app/
│   ├── _layout.jsx          ← root layout with Context providers
│   └── (tabs)/
│       ├── _layout.jsx      ← bottom tab bar config (icons, labels, colors)
│       ├── index.jsx        ← Home screen
│       ├── progress.jsx     ← Progress screen
│       ├── add.jsx          ← Add Task screen
│       ├── ai.jsx           ← AI Scanner screen
│       └── profile.jsx      ← Profile screen
├── components/
│   ├── TaskCard.jsx         ← reusable task list item
│   ├── CategoryBadge.jsx    ← colored label for task category
│   ├── PetAvatar.jsx        ← pet avatar with initials fallback
│   └── SectionHeader.jsx    ← section label with count
├── context/
│   └── TaskContext.jsx      ← global state + AsyncStorage sync
├── data/
│   └── seed.js              ← sample pets & tasks for first launch
├── constants/
│   └── theme.js             ← colors, fonts, spacing
└── assets/
    └── images/              ← app icon, splash, placeholders
```

---

## 4. Visual Theme

**Style:** Warm & playful
**Primary:** `#FF8C42` (warm orange)
**Secondary:** `#FFD166` (soft yellow)
**Accent:** `#06D6A0` (mint green — completed states)
**Background:** `#FFF8F0` (warm off-white)
**Card background:** `#FFFFFF`
**Text primary:** `#2D2D2D`
**Text secondary:** `#8A8A8A`
**Tab bar:** White background, orange active icon/label, gray inactive

Font: System default (SF Pro on iOS, Roboto on Android). Rounded corners throughout (borderRadius 12-16). Subtle shadows on cards.

---

## 5. Screen Designs

### 5.1 Home Screen (`index.jsx`)

**Purpose:** Shows the user's tasks for today (or this week / this month).

**Layout:**
- **Header:** Greeting ("Good morning, Alex 🐾"), today's date
- **Segmented control:** Daily / Weekly / Monthly
- **Task list:** Scrollable list of `TaskCard` components filtered by the selected period
- **Empty state:** Friendly illustration + "No tasks today — add one!" message

**TaskCard fields shown:** task title, category badge, pet name + color dot, assignee initials, due time, checkbox (tap to toggle done).

**Behavior:** Switching segment filters tasks by:
- Daily → `date` matches today
- Weekly → `date` within current ISO week
- Monthly → `date` within current calendar month

---

### 5.2 Progress Screen (`progress.jsx`)

**Purpose:** Visual summary of task completion history.

**Layout:**
- **Segmented control:** Daily / Weekly / Monthly
- **Calendar** (react-native-calendars): Month view. Days with tasks show dot markers. Tapping a day shows tasks for that day in a bottom sheet or inline list.
- **Pie chart** (react-native-chart-kit): Done vs. Pending for the selected period. Shows percentages.
- **Stats row:** Total tasks, Completed, Pending — for the selected period.

---

### 5.3 Add Task Screen (`add.jsx`)

**Purpose:** Create a new task and save it to AsyncStorage.

**Form fields:**
| Field | Type | Required |
|---|---|---|
| Task name | Text input | Yes |
| Category | Picker (Vaccination / Medicine / Grooming / Other) | Yes |
| Pet | Picker (from pets list) | Yes |
| Assignee name | Text input | No |
| Date | Date picker | Yes |
| Time | Time picker | No |
| Repeat | Picker (Once / Daily / Weekly / Monthly) | No |
| Notes | Multiline text input | No |

**Behavior:** "Save Task" validates required fields, calls `addTask()` from context, navigates back to Home tab. Shows inline validation errors on empty required fields.

---

### 5.4 AI Scanner Screen (`ai.jsx`)

**Purpose:** Mocked AI scanning experience — simulates scanning a pet or medicine label.

**Layout:**
- Full-screen camera viewfinder (expo-camera)
- Scan frame overlay (animated corner brackets)
- Top label: "Scan your pet or medicine label"
- Bottom: large circular scan button

**Flow:**
1. User taps scan button
2. Camera "captures" (no real processing)
3. Animated loading spinner for ~1.5 seconds
4. Result card slides up from bottom: detected item name, category, suggested action, "Add as Task" button
5. "Add as Task" pre-fills the Add screen with the suggested task data

**Mock results:** Rotate through 3-4 hardcoded mock scan results (e.g., "Rabies Vaccine detected → Schedule booster by Jan 2027", "Deworming medicine → Administer monthly").

---

### 5.5 Profile Screen (`profile.jsx`)

**Purpose:** Shows user info and app-level stats.

**Layout:**
- Avatar (large circle, initials + background color)
- User name (tappable to edit inline)
- Assigned pets list: each pet shows name, breed, colored avatar
- Stats row: Total tasks created, Completed this month
- Settings section (non-functional placeholders):
  - Notifications toggle
  - Dark mode toggle (visual only)
  - App version label

---

## 6. Data Model

All data stored in AsyncStorage under keys `@pawduty_tasks`, `@pawduty_pets`, `@pawduty_user`.

### Pet
```js
{
  id: string,           // uuid
  name: string,         // "Mochi"
  species: string,      // "cat" | "dog" | "rabbit" | "other"
  breed: string,        // "Scottish Fold"
  avatarColor: string,  // hex color for avatar background
}
```

### Task
```js
{
  id: string,
  title: string,
  category: "vaccination" | "medicine" | "grooming" | "other",
  petId: string,
  assignee: {
    name: string,
    initials: string,   // derived: "A" or "AJ"
  },
  date: string,         // ISO date "YYYY-MM-DD"
  time: string,         // "HH:mm" (optional, "" if not set)
  repeat: "once" | "daily" | "weekly" | "monthly",
  note: string,
  done: boolean,
}
```

### User
```js
{
  name: string,
  avatarColor: string,
  petIds: string[],     // references pet ids
}
```

---

## 7. Context API

`TaskContext` provides:

```js
const { tasks, pets, user, addTask, toggleTaskDone, updateUser } = useTaskContext();
```

- `addTask(task)` — appends new task, syncs to AsyncStorage
- `toggleTaskDone(id)` — flips `done` boolean, syncs to AsyncStorage
- `updateUser(fields)` — merges user fields, syncs to AsyncStorage

On app mount, context reads from AsyncStorage. If empty (first launch), loads seed data and writes it.

---

## 8. Seed Data

```js
// 2 pets
{ id: "p1", name: "Mochi", species: "cat", breed: "Scottish Fold", avatarColor: "#FFD166" }
{ id: "p2", name: "Buddy", species: "dog", breed: "Golden Retriever", avatarColor: "#FF8C42" }

// 6 tasks (spread across daily/weekly/monthly for demo)
- "Give Mochi her flea medicine" — medicine, daily, Mochi, today
- "Buddy's rabies booster shot" — vaccination, once, Buddy, this week
- "Trim Mochi's nails" — grooming, weekly, Mochi, this week
- "Monthly heartworm pill for Buddy" — medicine, monthly, Buddy, this month
- "Vet checkup for Buddy" — other, once, Buddy, this month
- "Mochi's deworming tablet" — medicine, monthly, Mochi, this month

// User
{ name: "Alex", avatarColor: "#06D6A0", petIds: ["p1", "p2"] }
```

---

## 9. Bottom Tab Bar

| Tab | Label | Icon | Position |
|---|---|---|---|
| 1 | Home | house | left |
| 2 | Progress | bar-chart | second |
| 3 | Add | plus-circle | center (larger, orange) |
| 4 | AI | camera | fourth |
| 5 | Profile | person | right |

Icons from `@expo/vector-icons` (Ionicons set). The Add tab icon is visually elevated (larger, orange filled circle) to draw attention.

---

## 10. Success Criteria

- [ ] All 5 screens render without errors
- [ ] Tab bar navigates between all 5 screens
- [ ] Home screen filters tasks by Daily/Weekly/Monthly correctly
- [ ] Tasks added on Add screen appear on Home screen
- [ ] Marking a task done updates Progress screen charts
- [ ] AI Scanner shows camera view and mock result card
- [ ] Data persists across app restarts (AsyncStorage)
- [ ] Seed data appears on first launch
- [ ] App runs on Expo Go (iOS and Android)
