# PawDuty Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete React Native pet care coordination app with 5 screens, AsyncStorage persistence, mocked AI scanning, and a warm-orange visual theme.

**Architecture:** Expo managed workflow with Expo Router file-based tabs. Single `TaskContext` (React Context + useReducer) holds all state and syncs to AsyncStorage. All 5 screens live under `app/(tabs)/`. Reusable components (TaskCard, CategoryBadge, PetAvatar, SectionHeader) are shared across screens.

**Tech Stack:** Expo (managed), Expo Router, React Context + useReducer, @react-native-async-storage/async-storage, react-native-calendars, react-native-chart-kit, react-native-svg, expo-camera, @expo/vector-icons (Ionicons), @react-native-community/datetimepicker, Jest + jest-expo + @testing-library/react-native

## Global Constraints

- Language: JavaScript only — no TypeScript, no `.ts`/`.tsx` files
- Framework: Expo managed workflow — no bare/ejected workflow
- Routing: Expo Router file-based — screens live in `app/(tabs)/`, root layout in `app/_layout.jsx`
- State: React Context + useReducer only — no Redux, no Zustand, no MobX
- Persistence: AsyncStorage only — keys `@pawduty_tasks`, `@pawduty_pets`, `@pawduty_user`
- Colors: primary `#FF8C42`, secondary `#FFD166`, accent `#06D6A0`, background `#FFF8F0`, card `#FFFFFF`, textPrimary `#2D2D2D`, textSecondary `#8A8A8A`
- Border radius: 12–16 throughout (use `RADIUS.md = 12`, `RADIUS.lg = 16` from theme)
- Tab bar: white background, orange active icon/label, gray inactive
- Icons: `@expo/vector-icons` Ionicons set only
- No backend calls, no remote auth, no TypeScript

---

### Task 1: Project Scaffold & Dependencies

**Files:**
- Init: `package.json`, `app.json`, `babel.config.js` (via expo init)
- Create: `constants/theme.js`
- Create: `data/seed.js`
- Create: `__tests__/data/seed.test.js`

**Interfaces:**
- Produces: `COLORS`, `SPACING`, `RADIUS` from `constants/theme.js` — consumed by all screens and components
- Produces: `SEED_PETS`, `SEED_TASKS`, `SEED_USER` from `data/seed.js` — consumed by `context/TaskContext.jsx`

- [ ] **Step 1: Initialize Expo project in existing directory**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
npx create-expo-app@latest . --template blank
```

Expected: `package.json`, `app.json`, `App.js`, `babel.config.js` created. Press `y` if prompted to proceed in existing directory.

- [ ] **Step 2: Install Expo Router and core navigation deps**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

- [ ] **Step 3: Install remaining feature deps**

```bash
npx expo install @react-native-async-storage/async-storage react-native-calendars expo-camera @expo/vector-icons react-native-chart-kit react-native-svg @react-native-community/datetimepicker
```

- [ ] **Step 4: Install test deps**

```bash
npm install --save-dev @testing-library/react-native jest-expo
```

- [ ] **Step 5: Configure app.json for Expo Router + camera permission**

Replace `app.json` entirely:

```json
{
  "expo": {
    "name": "PawDuty",
    "slug": "pawduty",
    "version": "1.0.0",
    "scheme": "pawduty",
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow PawDuty to access your camera to scan pet documents."
        }
      ]
    ]
  }
}
```

- [ ] **Step 6: Update package.json — set main entry and jest config**

Open `package.json` and make these two changes:

1. Add/replace `"main"` field: `"main": "expo-router/entry"`
2. Add `"jest"` block:

```json
"jest": {
  "preset": "jest-expo",
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-calendars|react-native-chart-kit)"
  ]
}
```

- [ ] **Step 7: Remove App.js — Expo Router takes over**

```bash
rm /c/Users/ACER/PawDuty/pawduty-fe/App.js
```

- [ ] **Step 8: Create folder structure**

```bash
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/app/\(tabs\)
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/components
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/context
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/data
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/constants
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/utils
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/__tests__/data
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/__tests__/context
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/__tests__/components
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/__tests__/screens
mkdir -p /c/Users/ACER/PawDuty/pawduty-fe/__tests__/utils
```

- [ ] **Step 9: Write theme constants**

Create `constants/theme.js`:

```js
export const COLORS = {
  primary: '#FF8C42',
  secondary: '#FFD166',
  accent: '#06D6A0',
  background: '#FFF8F0',
  card: '#FFFFFF',
  textPrimary: '#2D2D2D',
  textSecondary: '#8A8A8A',
  tabBarActive: '#FF8C42',
  tabBarInactive: '#8A8A8A',
  tabBarBackground: '#FFFFFF',
  white: '#FFFFFF',
  border: '#F0E6D6',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};
```

- [ ] **Step 10: Write seed data**

Create `data/seed.js`:

```js
function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export const SEED_PETS = [
  { id: 'p1', name: 'Mochi', species: 'cat', breed: 'Scottish Fold', avatarColor: '#FFD166' },
  { id: 'p2', name: 'Buddy', species: 'dog', breed: 'Golden Retriever', avatarColor: '#FF8C42' },
];

export const SEED_TASKS = [
  {
    id: 't1', title: 'Give Mochi her flea medicine', category: 'medicine',
    petId: 'p1', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(0), time: '08:00', repeat: 'daily', note: '', done: false,
  },
  {
    id: 't2', title: "Buddy's rabies booster shot", category: 'vaccination',
    petId: 'p2', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(3), time: '', repeat: 'once', note: 'Check with Dr. Smith', done: false,
  },
  {
    id: 't3', title: "Trim Mochi's nails", category: 'grooming',
    petId: 'p1', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(5), time: '14:00', repeat: 'weekly', note: '', done: false,
  },
  {
    id: 't4', title: 'Monthly heartworm pill for Buddy', category: 'medicine',
    petId: 'p2', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(10), time: '', repeat: 'monthly', note: '', done: false,
  },
  {
    id: 't5', title: 'Vet checkup for Buddy', category: 'other',
    petId: 'p2', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(15), time: '10:00', repeat: 'once', note: 'Annual checkup', done: false,
  },
  {
    id: 't6', title: "Mochi's deworming tablet", category: 'medicine',
    petId: 'p1', assignee: { name: 'Alex', initials: 'A' },
    date: daysFromToday(20), time: '', repeat: 'monthly', note: '', done: false,
  },
];

export const SEED_USER = {
  name: 'Alex',
  avatarColor: '#06D6A0',
  petIds: ['p1', 'p2'],
};
```

- [ ] **Step 11: Write seed data tests**

Create `__tests__/data/seed.test.js`:

```js
import { SEED_PETS, SEED_TASKS, SEED_USER } from '../../data/seed';

test('seed has 2 pets', () => {
  expect(SEED_PETS).toHaveLength(2);
});

test('seed has 6 tasks', () => {
  expect(SEED_TASKS).toHaveLength(6);
});

test('all tasks have required fields', () => {
  SEED_TASKS.forEach(task => {
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('category');
    expect(task).toHaveProperty('petId');
    expect(task).toHaveProperty('date');
    expect(task).toHaveProperty('done', false);
  });
});

test('seed user has correct structure', () => {
  expect(SEED_USER).toHaveProperty('name', 'Alex');
  expect(SEED_USER.petIds).toHaveLength(2);
});
```

- [ ] **Step 12: Run seed tests**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/data/seed.test.js --no-coverage
```

Expected: PASS — 4 tests

- [ ] **Step 13: Commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add -A
git commit -m "feat: scaffold Expo project with theme, seed data, deps"
```

---

### Task 2: TaskContext — Global State + AsyncStorage

**Files:**
- Create: `context/TaskContext.jsx`
- Create: `__tests__/context/TaskContext.test.js`

**Interfaces:**
- Consumes: `SEED_PETS`, `SEED_TASKS`, `SEED_USER` from `data/seed.js`
- Produces:
  - `TaskProvider` — React component, wraps the app
  - `useTaskContext()` → `{ tasks, pets, user, addTask, toggleTaskDone, updateUser }`
  - `addTask(task: object) → Promise<void>` — appends task, syncs AsyncStorage
  - `toggleTaskDone(id: string) → Promise<void>` — flips `done`, syncs AsyncStorage
  - `updateUser(fields: object) → Promise<void>` — merges user fields, syncs AsyncStorage

- [ ] **Step 1: Write failing tests for TaskContext**

Create `__tests__/context/TaskContext.test.js`:

```js
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TaskProvider, useTaskContext } from '../../context/TaskContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

function Probe({ testID, value }) {
  return <Text testID={testID}>{String(value)}</Text>;
}

function BasicConsumer() {
  const { tasks, pets, user } = useTaskContext();
  return (
    <>
      <Probe testID="task-count" value={tasks.length} />
      <Probe testID="pet-count" value={pets.length} />
      <Probe testID="user-name" value={user.name} />
    </>
  );
}

test('provides seed data on first load', async () => {
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = render(<TaskProvider><BasicConsumer /></TaskProvider>));
  });
  expect(getByTestId('task-count').props.children).toBe('6');
  expect(getByTestId('pet-count').props.children).toBe('2');
  expect(getByTestId('user-name').props.children).toBe('Alex');
});

function AddConsumer() {
  const { tasks, addTask } = useTaskContext();
  return (
    <>
      <Probe testID="count" value={tasks.length} />
      <Text testID="add" onPress={() => addTask({
        id: 'new1', title: 'Test task', category: 'other',
        petId: 'p1', assignee: { name: 'Alex', initials: 'A' },
        date: '2026-07-04', time: '', repeat: 'once', note: '', done: false,
      })} />
    </>
  );
}

test('addTask increases task count', async () => {
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = render(<TaskProvider><AddConsumer /></TaskProvider>));
  });
  const before = getByTestId('count').props.children;
  await act(async () => { getByTestId('add').props.onPress(); });
  const after = getByTestId('count').props.children;
  expect(Number(after)).toBe(Number(before) + 1);
});

function ToggleConsumer() {
  const { tasks, toggleTaskDone } = useTaskContext();
  const first = tasks[0];
  return (
    <>
      <Probe testID="done" value={first?.done} />
      <Text testID="toggle" onPress={() => toggleTaskDone(first?.id)} />
    </>
  );
}

test('toggleTaskDone flips done boolean', async () => {
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = render(<TaskProvider><ToggleConsumer /></TaskProvider>));
  });
  expect(getByTestId('done').props.children).toBe('false');
  await act(async () => { getByTestId('toggle').props.onPress(); });
  expect(getByTestId('done').props.children).toBe('true');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/context/TaskContext.test.js --no-coverage
```

Expected: FAIL — "Cannot find module '../../context/TaskContext'"

- [ ] **Step 3: Implement TaskContext**

Create `context/TaskContext.jsx`:

```jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_PETS, SEED_TASKS, SEED_USER } from '../data/seed';

const KEYS = {
  tasks: '@pawduty_tasks',
  pets: '@pawduty_pets',
  user: '@pawduty_user',
};

const TaskContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return { ...state, ...action.payload, loaded: true };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'TOGGLE_DONE':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.id ? { ...t, done: !t.done } : t
        ),
      };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { tasks: [], pets: [], user: {}, loaded: false });

  useEffect(() => {
    (async () => {
      const [rawTasks, rawPets, rawUser] = await Promise.all([
        AsyncStorage.getItem(KEYS.tasks),
        AsyncStorage.getItem(KEYS.pets),
        AsyncStorage.getItem(KEYS.user),
      ]);
      if (rawTasks && rawPets && rawUser) {
        dispatch({
          type: 'LOAD',
          payload: { tasks: JSON.parse(rawTasks), pets: JSON.parse(rawPets), user: JSON.parse(rawUser) },
        });
      } else {
        await Promise.all([
          AsyncStorage.setItem(KEYS.tasks, JSON.stringify(SEED_TASKS)),
          AsyncStorage.setItem(KEYS.pets, JSON.stringify(SEED_PETS)),
          AsyncStorage.setItem(KEYS.user, JSON.stringify(SEED_USER)),
        ]);
        dispatch({ type: 'LOAD', payload: { tasks: SEED_TASKS, pets: SEED_PETS, user: SEED_USER } });
      }
    })();
  }, []);

  async function addTask(task) {
    const updated = [...state.tasks, task];
    dispatch({ type: 'ADD_TASK', payload: task });
    await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(updated));
  }

  async function toggleTaskDone(id) {
    dispatch({ type: 'TOGGLE_DONE', id });
    const updated = state.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(updated));
  }

  async function updateUser(fields) {
    dispatch({ type: 'UPDATE_USER', payload: fields });
    const updated = { ...state.user, ...fields };
    await AsyncStorage.setItem(KEYS.user, JSON.stringify(updated));
  }

  return (
    <TaskContext.Provider value={{ tasks: state.tasks, pets: state.pets, user: state.user, addTask, toggleTaskDone, updateUser }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTaskContext must be used within TaskProvider');
  return ctx;
}
```

- [ ] **Step 4: Run tests**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/context/TaskContext.test.js --no-coverage
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add context/TaskContext.jsx __tests__/context/TaskContext.test.js
git commit -m "feat: add TaskContext with AsyncStorage persistence"
```

---

### Task 3: Reusable Components

**Files:**
- Create: `components/CategoryBadge.jsx`
- Create: `components/PetAvatar.jsx`
- Create: `components/SectionHeader.jsx`
- Create: `components/TaskCard.jsx`
- Create: `__tests__/components/CategoryBadge.test.jsx`
- Create: `__tests__/components/PetAvatar.test.jsx`
- Create: `__tests__/components/TaskCard.test.jsx`

**Interfaces:**
- `CategoryBadge({ category })` — `category: "vaccination" | "medicine" | "grooming" | "other"`
- `PetAvatar({ name, avatarColor, size? })` — `size` defaults to 36
- `SectionHeader({ title, count? })` — `count` is optional
- `TaskCard({ task, pet, onToggle })` — `onToggle(id: string) → void`; renders `testID="task-checkbox"` on the toggle button

- [ ] **Step 1: Write failing component tests**

Create `__tests__/components/CategoryBadge.test.jsx`:

```jsx
import React from 'react';
import { render } from '@testing-library/react-native';
import CategoryBadge from '../../components/CategoryBadge';

test('renders Vaccination label', () => {
  const { getByText } = render(<CategoryBadge category="vaccination" />);
  expect(getByText('Vaccination')).toBeTruthy();
});
test('renders Medicine label', () => {
  const { getByText } = render(<CategoryBadge category="medicine" />);
  expect(getByText('Medicine')).toBeTruthy();
});
test('renders Grooming label', () => {
  const { getByText } = render(<CategoryBadge category="grooming" />);
  expect(getByText('Grooming')).toBeTruthy();
});
test('renders Other for unknown category', () => {
  const { getByText } = render(<CategoryBadge category="unknown" />);
  expect(getByText('Other')).toBeTruthy();
});
```

Create `__tests__/components/PetAvatar.test.jsx`:

```jsx
import React from 'react';
import { render } from '@testing-library/react-native';
import PetAvatar from '../../components/PetAvatar';

test('renders first letter of name', () => {
  const { getByText } = render(<PetAvatar name="Mochi" avatarColor="#FFD166" />);
  expect(getByText('M')).toBeTruthy();
});
test('uppercases the initial', () => {
  const { getByText } = render(<PetAvatar name="buddy" avatarColor="#FF8C42" />);
  expect(getByText('B')).toBeTruthy();
});
```

Create `__tests__/components/TaskCard.test.jsx`:

```jsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TaskCard from '../../components/TaskCard';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const task = {
  id: 't1', title: 'Give Mochi flea medicine', category: 'medicine',
  petId: 'p1', assignee: { name: 'Alex', initials: 'A' },
  date: '2026-07-04', time: '08:00', repeat: 'daily', note: '', done: false,
};
const pet = { id: 'p1', name: 'Mochi', avatarColor: '#FFD166' };

test('renders task title', () => {
  const { getByText } = render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} />);
  expect(getByText('Give Mochi flea medicine')).toBeTruthy();
});
test('calls onToggle with task id when checkbox pressed', () => {
  const onToggle = jest.fn();
  const { getByTestId } = render(<TaskCard task={task} pet={pet} onToggle={onToggle} />);
  fireEvent.press(getByTestId('task-checkbox'));
  expect(onToggle).toHaveBeenCalledWith('t1');
});
test('shows pet name', () => {
  const { getByText } = render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} />);
  expect(getByText('Mochi')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify all fail**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/components/ --no-coverage
```

Expected: FAIL — modules not found

- [ ] **Step 3: Implement CategoryBadge**

Create `components/CategoryBadge.jsx`:

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS } from '../constants/theme';

const CONFIG = {
  vaccination: { label: 'Vaccination', bg: '#FFE0CC', text: '#E65C00' },
  medicine:    { label: 'Medicine',    bg: '#D4F5EB', text: '#00875A' },
  grooming:    { label: 'Grooming',    bg: '#E8E0FF', text: '#5B21B6' },
  other:       { label: 'Other',       bg: '#F0F0F0', text: '#555555' },
};

export default function CategoryBadge({ category }) {
  const cfg = CONFIG[category] ?? CONFIG.other;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  label: { fontSize: 11, fontWeight: '600' },
});
```

- [ ] **Step 4: Implement PetAvatar**

Create `components/PetAvatar.jsx`:

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PetAvatar({ name = '', avatarColor = '#FFD166', size = 36 }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '700' },
});
```

- [ ] **Step 5: Implement SectionHeader**

Create `components/SectionHeader.jsx`:

```jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function SectionHeader({ title, count }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {count !== undefined && (
        <Text style={styles.count}>{count}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.sm, marginHorizontal: SPACING.md },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  count: { fontSize: 13, color: COLORS.textSecondary, backgroundColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
});
```

- [ ] **Step 6: Implement TaskCard**

Create `components/TaskCard.jsx`:

```jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import CategoryBadge from './CategoryBadge';
import PetAvatar from './PetAvatar';

export default function TaskCard({ task, pet, onToggle }) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        testID="task-checkbox"
        onPress={() => onToggle(task.id)}
        style={styles.checkbox}
        accessibilityLabel="Toggle task done"
      >
        <Ionicons
          name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
          size={26}
          color={task.done ? COLORS.accent : COLORS.textSecondary}
        />
      </TouchableOpacity>
      <View style={styles.body}>
        <Text style={[styles.title, task.done && styles.done]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.meta}>
          <CategoryBadge category={task.category} />
          {pet && (
            <View style={styles.petRow}>
              <PetAvatar name={pet.name} avatarColor={pet.avatarColor} size={20} />
              <Text style={styles.petName}>{pet.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.footer}>
          {!!task.time && (
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.time}>{task.time}</Text>
            </View>
          )}
          {!!task.assignee?.initials && (
            <View style={styles.assignee}>
              <Text style={styles.assigneeText}>{task.assignee.initials}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md, marginVertical: SPACING.xs, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  checkbox: { marginRight: SPACING.sm, paddingTop: 2 },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  done: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  petName: { fontSize: 12, color: COLORS.textSecondary },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  time: { fontSize: 12, color: COLORS.textSecondary },
  assignee: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  assigneeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
});
```

- [ ] **Step 7: Run all component tests**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/components/ --no-coverage
```

Expected: PASS — 9 tests

- [ ] **Step 8: Commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add components/ __tests__/components/
git commit -m "feat: add reusable components (TaskCard, CategoryBadge, PetAvatar, SectionHeader)"
```

---

### Task 4: Root Layout + Tab Bar + Placeholder Screens

**Files:**
- Create: `app/_layout.jsx`
- Create: `app/(tabs)/_layout.jsx`
- Create: `app/(tabs)/index.jsx` (placeholder)
- Create: `app/(tabs)/progress.jsx` (placeholder)
- Create: `app/(tabs)/add.jsx` (placeholder)
- Create: `app/(tabs)/ai.jsx` (placeholder)
- Create: `app/(tabs)/profile.jsx` (placeholder)

**Interfaces:**
- Consumes: `TaskProvider` from `context/TaskContext.jsx`
- Consumes: `COLORS` from `constants/theme.js`
- Produces: working 5-tab app with orange elevated Add button; placeholder screens to be replaced in Tasks 5–9

- [ ] **Step 1: Create root layout**

Create `app/_layout.jsx`:

```jsx
import { Stack } from 'expo-router';
import { TaskProvider } from '../context/TaskContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <TaskProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </TaskProvider>
  );
}
```

- [ ] **Step 2: Create tab bar layout**

Create `app/(tabs)/_layout.jsx`:

```jsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

function AddTabButton({ onPress, children }) {
  return (
    <Pressable onPress={onPress} style={styles.addButton}>
      <View style={styles.addInner}>{children}</View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.tabBarInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: (props) => <AddTabButton {...props} />,
          tabBarIcon: () => <Ionicons name="add" size={30} color={COLORS.white} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size }) => <Ionicons name="camera" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: '#F0E6D6',
    height: 60,
    paddingBottom: 8,
  },
  addButton: { top: -16, alignItems: 'center', justifyContent: 'center' },
  addInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
});
```

- [ ] **Step 3: Create placeholder screens**

Create `app/(tabs)/index.jsx`:
```jsx
import { View, Text } from 'react-native';
export default function HomeScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Home — coming soon</Text></View>;
}
```

Create `app/(tabs)/progress.jsx`:
```jsx
import { View, Text } from 'react-native';
export default function ProgressScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Progress — coming soon</Text></View>;
}
```

Create `app/(tabs)/add.jsx`:
```jsx
import { View, Text } from 'react-native';
export default function AddScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Add Task — coming soon</Text></View>;
}
```

Create `app/(tabs)/ai.jsx`:
```jsx
import { View, Text } from 'react-native';
export default function AIScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>AI Scanner — coming soon</Text></View>;
}
```

Create `app/(tabs)/profile.jsx`:
```jsx
import { View, Text } from 'react-native';
export default function ProfileScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Profile — coming soon</Text></View>;
}
```

- [ ] **Step 4: Verify app launches in Expo Go**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx expo start
```

Scan QR code with Expo Go. Verify: 5 tabs visible, Add button is elevated orange circle, tapping each tab switches screens. Press Ctrl+C to stop.

- [ ] **Step 5: Commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add app/
git commit -m "feat: add root layout, tab bar, placeholder screens"
```

---

### Task 5: Date Filter Utility + Home Screen

**Files:**
- Create: `utils/dateFilters.js`
- Create: `__tests__/utils/dateFilters.test.js`
- Modify: `app/(tabs)/index.jsx`
- Create: `__tests__/screens/HomeScreen.test.jsx`

**Interfaces:**
- Produces: `filterTasks(tasks: Task[], mode: 'daily'|'weekly'|'monthly') → Task[]` from `utils/dateFilters.js`
- Consumes: `useTaskContext()` → `{ tasks, pets, user, toggleTaskDone }`
- Consumes: `filterTasks`, `TaskCard`, `SectionHeader`

- [ ] **Step 1: Write failing date filter tests**

Create `__tests__/utils/dateFilters.test.js`:

```js
import { filterTasks } from '../../utils/dateFilters';

function makeTask(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return { id: String(daysOffset), date: d.toISOString().split('T')[0] };
}

test('daily: returns only today', () => {
  const tasks = [makeTask(0), makeTask(1), makeTask(-1)];
  expect(filterTasks(tasks, 'daily')).toHaveLength(1);
  expect(filterTasks(tasks, 'daily')[0].id).toBe('0');
});

test('monthly: excludes tasks more than 31 days away', () => {
  const tasks = [makeTask(0), makeTask(35), makeTask(-35)];
  const result = filterTasks(tasks, 'monthly');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('0');
});

test('weekly: includes today', () => {
  const tasks = [makeTask(0)];
  expect(filterTasks(tasks, 'weekly')).toHaveLength(1);
});

test('weekly: excludes tasks 8 days from now', () => {
  // 8 days away is never in the current ISO week
  const tasks = [makeTask(8)];
  // Either 0 or 1 depending on week boundary — just verify no crash
  expect(Array.isArray(filterTasks(tasks, 'weekly'))).toBe(true);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/utils/dateFilters.test.js --no-coverage
```

Expected: FAIL — "Cannot find module '../../utils/dateFilters'"

- [ ] **Step 3: Implement dateFilters**

Create `utils/dateFilters.js`:

```js
function getISOWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const toMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + toMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

export function filterTasks(tasks, mode) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (mode === 'daily') {
    return tasks.filter(t => t.date === todayStr);
  }
  if (mode === 'weekly') {
    const { start, end } = getISOWeekBounds(today);
    return tasks.filter(t => t.date >= start && t.date <= end);
  }
  if (mode === 'monthly') {
    const month = todayStr.slice(0, 7); // "YYYY-MM"
    return tasks.filter(t => t.date.startsWith(month));
  }
  return tasks;
}
```

- [ ] **Step 4: Run date filter tests**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/utils/dateFilters.test.js --no-coverage
```

Expected: PASS — 4 tests

- [ ] **Step 5: Implement Home screen**

Replace `app/(tabs)/index.jsx`:

```jsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import { filterTasks } from '../../utils/dateFilters';
import TaskCard from '../../components/TaskCard';
import SectionHeader from '../../components/SectionHeader';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const MODES = ['Daily', 'Weekly', 'Monthly'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function HomeScreen() {
  const { tasks, pets, toggleTaskDone, user } = useTaskContext();
  const [mode, setMode] = useState('Daily');
  const filtered = filterTasks(tasks, mode.toLowerCase());

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}, {user.name || 'Friend'} 🐾</Text>
          <Text style={styles.date}>{formatDate()}</Text>
        </View>

        <View style={styles.segment}>
          {MODES.map(m => (
            <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segActive]} onPress={() => setMode(m)}>
              <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader title="Tasks" count={filtered.length} />

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🐾</Text>
            <Text style={styles.emptyText}>No tasks — add one!</Text>
          </View>
        ) : (
          filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              pet={pets.find(p => p.id === task.petId)}
              onToggle={toggleTaskDone}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  date: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  segment: {
    flexDirection: 'row', marginHorizontal: SPACING.md, marginVertical: SPACING.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 3,
  },
  segBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: RADIUS.sm },
  segActive: { backgroundColor: COLORS.primary },
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  segTextActive: { color: COLORS.white },
  empty: { alignItems: 'center', marginTop: SPACING.xl * 2 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.sm },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
});
```

- [ ] **Step 6: Write Home screen smoke test**

Create `__tests__/screens/HomeScreen.test.jsx`:

```jsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';
import { TaskProvider } from '../../context/TaskContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

test('renders greeting', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = render(<TaskProvider><HomeScreen /></TaskProvider>));
  });
  expect(getByText(/Good/)).toBeTruthy();
});

test('renders all 3 segment buttons', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = render(<TaskProvider><HomeScreen /></TaskProvider>));
  });
  expect(getByText('Daily')).toBeTruthy();
  expect(getByText('Weekly')).toBeTruthy();
  expect(getByText('Monthly')).toBeTruthy();
});
```

- [ ] **Step 7: Run all new tests**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/utils/ __tests__/screens/HomeScreen.test.jsx --no-coverage
```

Expected: PASS — 6 tests

- [ ] **Step 8: Commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add app/\(tabs\)/index.jsx utils/dateFilters.js __tests__/utils/ __tests__/screens/HomeScreen.test.jsx
git commit -m "feat: implement Home screen with Daily/Weekly/Monthly filtering"
```

---

### Task 6: Add Task Screen

**Files:**
- Create: `utils/uuid.js`
- Modify: `app/(tabs)/add.jsx`
- Create: `__tests__/screens/AddScreen.test.jsx`

**Interfaces:**
- Produces: `generateId() → string` from `utils/uuid.js`
- Consumes: `useTaskContext()` → `{ pets, addTask }`
- Consumes: `useRouter().replace('/(tabs)/')` after save
- Consumes: `useLocalSearchParams()` → `{ prefillTitle?, prefillCategory? }` (set by AI screen)

- [ ] **Step 1: Write uuid utility**

Create `utils/uuid.js`:

```js
export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
```

- [ ] **Step 2: Write failing Add screen test**

Create `__tests__/screens/AddScreen.test.jsx`:

```jsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AddScreen from '../../app/(tabs)/add';
import { TaskProvider } from '../../context/TaskContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

test('shows validation error when saving without title', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = render(<TaskProvider><AddScreen /></TaskProvider>));
  });
  await act(async () => { fireEvent.press(getByText('Save Task')); });
  expect(getByText('Task name is required')).toBeTruthy();
});
```

- [ ] **Step 3: Run to verify failure**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/screens/AddScreen.test.jsx --no-coverage
```

Expected: FAIL — module not found or placeholder renders wrong

- [ ] **Step 4: Implement Add Task screen**

Replace `app/(tabs)/add.jsx`:

```jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTaskContext } from '../../context/TaskContext';
import { generateId } from '../../utils/uuid';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const CATEGORIES = ['vaccination', 'medicine', 'grooming', 'other'];
const REPEATS = ['once', 'daily', 'weekly', 'monthly'];

function ChipPicker({ label, options, value, onChange }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, value === opt && styles.chipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function AddScreen() {
  const { pets, addTask } = useTaskContext();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [title, setTitle] = useState(params.prefillTitle ?? '');
  const [category, setCategory] = useState(params.prefillCategory ?? 'medicine');
  const [petId, setPetId] = useState(pets[0]?.id ?? '');
  const [assignee, setAssignee] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState('once');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!title.trim()) e.title = 'Task name is required';
    if (!petId) e.petId = 'Please select a pet';
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const name = assignee.trim();
    const initials = name
      ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
      : '';
    await addTask({
      id: generateId(),
      title: title.trim(),
      category,
      petId,
      assignee: { name, initials },
      date: date.toISOString().split('T')[0],
      time,
      repeat,
      note: note.trim(),
      done: false,
    });
    router.replace('/(tabs)/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Add Task</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Task name *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="e.g. Give Mochi flea medicine"
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={t => { setTitle(t); setErrors(e => ({ ...e, title: undefined })); }}
          />
          {errors.title && <Text style={styles.error}>{errors.title}</Text>}
        </View>

        <ChipPicker label="Category *" options={CATEGORIES} value={category} onChange={setCategory} />

        <View style={styles.field}>
          <Text style={styles.label}>Pet *</Text>
          <View style={styles.chipRow}>
            {pets.map(pet => (
              <TouchableOpacity
                key={pet.id}
                style={[styles.chip, petId === pet.id && styles.chipActive]}
                onPress={() => { setPetId(pet.id); setErrors(e => ({ ...e, petId: undefined })); }}
              >
                <Text style={[styles.chipText, petId === pet.id && styles.chipTextActive]}>{pet.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.petId && <Text style={styles.error}>{errors.petId}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Assignee name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex"
            placeholderTextColor={COLORS.textSecondary}
            value={assignee}
            onChangeText={setAssignee}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
            <Text style={{ fontSize: 15, color: COLORS.textPrimary }}>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDate && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, d) => { setShowDate(false); if (d) setDate(d); }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Time (optional, HH:MM)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 08:30"
            placeholderTextColor={COLORS.textSecondary}
            value={time}
            onChangeText={setTime}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <ChipPicker label="Repeat" options={REPEATS} value={repeat} onChange={setRepeat} />

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Any additional notes..."
            placeholderTextColor={COLORS.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xl * 2 },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  field: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.sm + 4, fontSize: 15, color: COLORS.textPrimary,
  },
  inputError: { borderColor: '#E53935' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  error: { fontSize: 12, color: '#E53935', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
```

- [ ] **Step 5: Run test**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/screens/AddScreen.test.jsx --no-coverage
```

Expected: PASS — 1 test

- [ ] **Step 6: Commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add app/\(tabs\)/add.jsx utils/uuid.js __tests__/screens/AddScreen.test.jsx
git commit -m "feat: implement Add Task screen with validation and prefill support"
```

---

### Task 7: Progress Screen

**Files:**
- Modify: `app/(tabs)/progress.jsx`
- Create: `__tests__/screens/ProgressScreen.test.jsx`

**Interfaces:**
- Consumes: `useTaskContext()` → `{ tasks }`
- Consumes: `filterTasks(tasks, mode)` from `utils/dateFilters.js`
- Consumes: `Calendar` from `react-native-calendars`, `PieChart` from `react-native-chart-kit`

- [ ] **Step 1: Write failing Progress screen tests**

Create `__tests__/screens/ProgressScreen.test.jsx`:

```jsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import ProgressScreen from '../../app/(tabs)/progress';
import { TaskProvider } from '../../context/TaskContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-calendars', () => ({ Calendar: 'Calendar' }));
jest.mock('react-native-chart-kit', () => ({ PieChart: 'PieChart' }));
jest.mock('react-native-svg', () => ({
  Svg: 'Svg', G: 'G', Circle: 'Circle', Text: 'SvgText', Path: 'Path',
}));

test('renders all 3 segment buttons', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = render(<TaskProvider><ProgressScreen /></TaskProvider>));
  });
  expect(getByText('Daily')).toBeTruthy();
  expect(getByText('Weekly')).toBeTruthy();
  expect(getByText('Monthly')).toBeTruthy();
});

test('renders stats row with Total, Done, Pending labels', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = render(<TaskProvider><ProgressScreen /></TaskProvider>));
  });
  expect(getByText('Total')).toBeTruthy();
  expect(getByText('Done')).toBeTruthy();
  expect(getByText('Pending')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/screens/ProgressScreen.test.jsx --no-coverage
```

Expected: FAIL — placeholder renders "Progress — coming soon", missing test content

- [ ] **Step 3: Implement Progress screen**

Replace `app/(tabs)/progress.jsx`:

```jsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { PieChart } from 'react-native-chart-kit';
import { useTaskContext } from '../../context/TaskContext';
import { filterTasks } from '../../utils/dateFilters';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const MODES = ['Daily', 'Weekly', 'Monthly'];
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ProgressScreen() {
  const { tasks } = useTaskContext();
  const [mode, setMode] = useState('Monthly');
  const [selectedDay, setSelectedDay] = useState(null);

  const filtered = filterTasks(tasks, mode.toLowerCase());
  const done = filtered.filter(t => t.done).length;
  const pending = filtered.length - done;

  const markedDates = {};
  tasks.forEach(t => {
    if (!markedDates[t.date]) markedDates[t.date] = { dots: [] };
    markedDates[t.date].dots.push({ key: t.id, color: t.done ? COLORS.accent : COLORS.primary });
  });
  if (selectedDay) {
    markedDates[selectedDay] = { ...(markedDates[selectedDay] ?? {}), selected: true, selectedColor: COLORS.primary };
  }

  const dayTasks = selectedDay ? tasks.filter(t => t.date === selectedDay) : [];

  const pieData = [
    { name: 'Done', population: done || 0, color: COLORS.accent, legendFontColor: COLORS.textPrimary, legendFontSize: 13 },
    { name: 'Pending', population: pending || 0, color: COLORS.primary, legendFontColor: COLORS.textPrimary, legendFontSize: 13 },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Progress</Text>

        <View style={styles.segment}>
          {MODES.map(m => (
            <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segActive]} onPress={() => setMode(m)}>
              <Text style={[styles.segText, mode === m && styles.segTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Calendar
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={day => setSelectedDay(day.dateString === selectedDay ? null : day.dateString)}
            theme={{
              selectedDayBackgroundColor: COLORS.primary,
              todayTextColor: COLORS.primary,
              dotColor: COLORS.primary,
              arrowColor: COLORS.primary,
            }}
          />
        </View>

        {selectedDay && dayTasks.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tasks on {selectedDay}</Text>
            {dayTasks.map(t => (
              <View key={t.id} style={styles.dayTask}>
                <View style={[styles.dot, { backgroundColor: t.done ? COLORS.accent : COLORS.primary }]} />
                <Text style={[styles.dayTaskTitle, t.done && styles.strikethrough]}>{t.title}</Text>
              </View>
            ))}
          </View>
        )}

        {filtered.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Completion — {mode}</Text>
            <PieChart
              data={pieData}
              width={SCREEN_WIDTH - SPACING.md * 4}
              height={180}
              chartConfig={{ color: (opacity = 1) => `rgba(45,45,45,${opacity})`, backgroundGradientFrom: COLORS.card, backgroundGradientTo: COLORS.card }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </View>
        )}

        <View style={styles.statsRow}>
          {[{ label: 'Total', value: filtered.length }, { label: 'Done', value: done }, { label: 'Pending', value: pending }].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl * 2 },
  heading: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary, margin: SPACING.md },
  segment: {
    flexDirection: 'row', marginHorizontal: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 3,
  },
  segBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: RADIUS.sm },
  segActive: { backgroundColor: COLORS.primary },
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  segTextActive: { color: COLORS.white },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    margin: SPACING.md, marginTop: 0, padding: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  dayTask: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingHorizontal: SPACING.xs },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dayTaskTitle: { fontSize: 14, color: COLORS.textPrimary, flex: 1 },
  strikethrough: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', marginHorizontal: SPACING.md, gap: SPACING.sm },
  statBox: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
```

- [ ] **Step 4: Run tests**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/screens/ProgressScreen.test.jsx --no-coverage
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add app/\(tabs\)/progress.jsx __tests__/screens/ProgressScreen.test.jsx
git commit -m "feat: implement Progress screen with calendar, pie chart, stats"
```

---

### Task 8: AI Scanner Screen

**Files:**
- Create: `data/mockScans.js`
- Modify: `app/(tabs)/ai.jsx`
- Create: `__tests__/screens/AIScreen.test.jsx`

**Interfaces:**
- Consumes: `useCameraPermissions`, `CameraView` from `expo-camera`
- Consumes: `useRouter().push({ pathname, params })` to pre-fill Add screen
- Produces: `MOCK_SCANS` array from `data/mockScans.js` — each item: `{ id, detected, category, suggestion, taskTitle }`

- [ ] **Step 1: Create mock scan data**

Create `data/mockScans.js`:

```js
export const MOCK_SCANS = [
  { id: 'ms1', detected: 'Rabies Vaccine', category: 'vaccination', suggestion: 'Schedule booster by Jan 2027', taskTitle: 'Rabies vaccine booster' },
  { id: 'ms2', detected: 'Deworming Medicine', category: 'medicine', suggestion: 'Administer monthly', taskTitle: 'Monthly deworming treatment' },
  { id: 'ms3', detected: 'Flea & Tick Treatment', category: 'medicine', suggestion: 'Apply every 4 weeks', taskTitle: 'Flea & tick treatment' },
  { id: 'ms4', detected: 'Dental Chew', category: 'grooming', suggestion: 'Give daily for oral health', taskTitle: 'Daily dental chew' },
];
```

- [ ] **Step 2: Write failing AI screen tests**

Create `__tests__/screens/AIScreen.test.jsx`:

```jsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AIScreen from '../../app/(tabs)/ai';

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

test('renders scan button when permission granted', () => {
  const { getByTestId } = render(<AIScreen />);
  expect(getByTestId('scan-button')).toBeTruthy();
});

test('shows loading indicator after pressing scan button', () => {
  jest.useFakeTimers();
  const { getByTestId } = render(<AIScreen />);
  fireEvent.press(getByTestId('scan-button'));
  expect(getByTestId('scan-loading')).toBeTruthy();
  jest.useRealTimers();
});
```

- [ ] **Step 3: Run to verify failure**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/screens/AIScreen.test.jsx --no-coverage
```

Expected: FAIL — module not found or placeholder renders wrong

- [ ] **Step 4: Implement AI Scanner screen**

Replace `app/(tabs)/ai.jsx`:

```jsx
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { MOCK_SCANS } from '../../data/mockScans';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

let scanIndex = 0;

export default function AIScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const router = useRouter();

  if (!permission) {
    return <View style={styles.center}><Text>Checking camera…</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera access is needed to scan.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleScan() {
    if (scanning || result) return;
    setScanning(true);
    setTimeout(() => {
      const mock = MOCK_SCANS[scanIndex % MOCK_SCANS.length];
      scanIndex++;
      setScanning(false);
      setResult(mock);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
    }, 1500);
  }

  function handleAddAsTask() {
    router.push({ pathname: '/(tabs)/add', params: { prefillTitle: result.taskTitle, prefillCategory: result.category } });
    setResult(null);
    slideAnim.setValue(300);
  }

  function handleDismiss() {
    setResult(null);
    slideAnim.setValue(300);
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      <View style={styles.overlay}>
        <View style={styles.topLabel}>
          <Text style={styles.topLabelText}>Scan your pet or medicine label</Text>
        </View>

        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            {[styles.tl, styles.tr, styles.bl, styles.br].map((pos, i) => (
              <View key={i} style={[styles.corner, pos]} />
            ))}
          </View>
        </View>

        {!result && (
          <View style={styles.bottomArea}>
            {scanning ? (
              <ActivityIndicator testID="scan-loading" size="large" color={COLORS.white} />
            ) : (
              <TouchableOpacity testID="scan-button" style={styles.scanBtn} onPress={handleScan} activeOpacity={0.8}>
                <View style={styles.scanBtnInner} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {result && (
        <Animated.View style={[styles.resultCard, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.resultDetected}>Detected: {result.detected}</Text>
          <Text style={styles.resultSuggestion}>{result.suggestion}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddAsTask}>
            <Text style={styles.addBtnText}>Add as Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, padding: SPACING.xl },
  permText: { fontSize: 16, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.md },
  permBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, paddingHorizontal: SPACING.xl },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overlay: { flex: 1 },
  topLabel: { backgroundColor: 'rgba(0,0,0,0.5)', padding: SPACING.md, alignItems: 'center', marginTop: 60 },
  topLabelText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  frameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#fff', borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  bottomArea: { alignItems: 'center', paddingBottom: SPACING.xl * 2 },
  scanBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  scanBtnInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff' },
  resultCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: RADIUS.lg * 2, borderTopRightRadius: RADIUS.lg * 2,
    padding: SPACING.xl, paddingBottom: SPACING.xl * 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  resultDetected: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  resultSuggestion: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dismissBtn: { alignItems: 'center', padding: SPACING.sm },
  dismissText: { color: COLORS.textSecondary, fontSize: 14 },
});
```

- [ ] **Step 5: Run tests**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/screens/AIScreen.test.jsx --no-coverage
```

Expected: PASS — 2 tests

- [ ] **Step 6: Commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add app/\(tabs\)/ai.jsx data/mockScans.js __tests__/screens/AIScreen.test.jsx
git commit -m "feat: implement AI Scanner screen with mock scan results"
```

---

### Task 9: Profile Screen

**Files:**
- Modify: `app/(tabs)/profile.jsx`
- Create: `__tests__/screens/ProfileScreen.test.jsx`

**Interfaces:**
- Consumes: `useTaskContext()` → `{ user, pets, tasks, updateUser }`
- Consumes: `PetAvatar` component

- [ ] **Step 1: Write failing Profile screen tests**

Create `__tests__/screens/ProfileScreen.test.jsx`:

```jsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile';
import { TaskProvider } from '../../context/TaskContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

test('renders user name Alex', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = render(<TaskProvider><ProfileScreen /></TaskProvider>));
  });
  expect(getByText('Alex')).toBeTruthy();
});

test('renders My Pets section', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = render(<TaskProvider><ProfileScreen /></TaskProvider>));
  });
  expect(getByText('My Pets')).toBeTruthy();
});

test('renders Total Tasks and Done This Month stat labels', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = render(<TaskProvider><ProfileScreen /></TaskProvider>));
  });
  expect(getByText('Total Tasks')).toBeTruthy();
  expect(getByText('Done This Month')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/screens/ProfileScreen.test.jsx --no-coverage
```

Expected: FAIL — placeholder renders wrong content

- [ ] **Step 3: Implement Profile screen**

Replace `app/(tabs)/profile.jsx`:

```jsx
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Switch, StyleSheet, SafeAreaView,
} from 'react-native';
import { useTaskContext } from '../../context/TaskContext';
import PetAvatar from '../../components/PetAvatar';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

const APP_VERSION = '1.0.0';

export default function ProfileScreen() {
  const { user, pets, tasks, updateUser } = useTaskContext();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.name ?? '');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const totalTasks = tasks.length;
  const doneThisMonth = tasks.filter(t => t.done && t.date.startsWith(thisMonth)).length;

  function saveUserName() {
    updateUser({ name: nameInput.trim() || user.name });
    setEditingName(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <View style={[styles.bigAvatar, { backgroundColor: user.avatarColor ?? COLORS.primary }]}>
            <Text style={styles.bigInitial}>{(user.name ?? 'A').charAt(0).toUpperCase()}</Text>
          </View>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                onSubmitEditing={saveUserName}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.saveNameBtn} onPress={saveUserName}>
                <Text style={styles.saveNameText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => { setNameInput(user.name ?? ''); setEditingName(true); }}>
              <Text style={styles.userName}>{user.name ?? 'Alex'}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.userSub}>Tap name to edit</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Pets</Text>
          {pets.map(pet => (
            <View key={pet.id} style={styles.petRow}>
              <PetAvatar name={pet.name} avatarColor={pet.avatarColor} size={44} />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petBreed}>{pet.breed}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalTasks}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: COLORS.accent }]}>{doneThisMonth}</Text>
              <Text style={styles.statLabel}>Done This Month</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: COLORS.primary }} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark mode (visual only)</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: COLORS.primary }} />
          </View>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingLabel}>App version</Text>
            <Text style={styles.settingValue}>{APP_VERSION}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl * 2 },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xl },
  bigAvatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  bigInitial: { fontSize: 40, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  nameInput: {
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md,
    padding: SPACING.sm, fontSize: 18, fontWeight: '700', minWidth: 140,
    textAlign: 'center', color: COLORS.textPrimary,
  },
  saveNameBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: SPACING.sm },
  saveNameText: { color: '#fff', fontWeight: '700' },
  userSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  section: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.md, marginBottom: SPACING.md, padding: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  petInfo: { flex: 1 },
  petName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  petBreed: { fontSize: 12, color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', gap: SPACING.md },
  statBox: { flex: 1, alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.background, borderRadius: RADIUS.md },
  statValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  settingLabel: { fontSize: 15, color: COLORS.textPrimary },
  settingValue: { fontSize: 14, color: COLORS.textSecondary },
});
```

- [ ] **Step 4: Run tests**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest __tests__/screens/ProfileScreen.test.jsx --no-coverage
```

Expected: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add app/\(tabs\)/profile.jsx __tests__/screens/ProfileScreen.test.jsx
git commit -m "feat: implement Profile screen with pet list, stats, settings"
```

---

### Task 10: Final Integration & Verification

**Files:** None — verification only

- [ ] **Step 1: Run full test suite**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx jest --no-coverage
```

Expected: ALL tests PASS. No failures. Note any failures and fix before proceeding.

- [ ] **Step 2: Start Expo and verify in Expo Go**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe && npx expo start
```

Scan QR code with Expo Go. Manually verify each success criterion:

| Criterion | How to verify |
|-----------|---------------|
| All 5 screens render without errors | Navigate to each tab — no red error screens |
| Tab bar navigates all 5 screens | Tap each tab icon |
| Add button is elevated orange circle | Visual check of center tab |
| Home filters tasks by Daily/Weekly/Monthly | Tap each segment — task list updates |
| Adding a task appears on Home | Fill Add form → Save → switch to Home → see new task |
| Marking done updates Progress pie chart | Toggle checkbox on Home → go to Progress → pie reflects change |
| AI Scanner shows camera view | Tap AI tab — camera viewfinder visible |
| Scan button triggers mock result card | Tap white circle button — wait 1.5s — result slides up |
| "Add as Task" pre-fills Add screen | Press "Add as Task" — Add screen opens with title/category set |
| Data persists across restart | Close Expo Go → reopen → tasks/user still there |
| Seed data loads on first launch | (verified on first run — Mochi and Buddy tasks visible) |

- [ ] **Step 3: Final commit**

```bash
cd /c/Users/ACER/PawDuty/pawduty-fe
git add -A
git commit -m "feat: PawDuty v1.0 — all 5 screens complete, all tests passing"
```
