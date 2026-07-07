# Frontend ↔ Task API Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Task API the source of truth for tasks and pets in `pawduty-fe`, and add Delete + Edit UI so all four CRUD verbs are reachable and covered by input/output tests.

**Architecture:** A single network boundary (`utils/api.js`) built on `fetch`, with the base URL auto-derived from the Expo host (`constants/api.js`). `TaskContext` fetches tasks+pets on mount (loading/error/retry) and exposes `addTask`/`editTask`/`toggleTaskDone`/`deleteTask`; the user profile stays in AsyncStorage. Screens gain loading/error states, a delete affordance, and an edit mode.

**Tech Stack:** Expo/React Native, expo-router, expo-constants (already installed, 57.0.3), React Context + hooks, `fetch`, Jest + @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-07-08-frontend-api-wiring-design.md`
**Backend:** `../task-api` (FastAPI, run with `.venv/bin/uvicorn app.main:app --port 8001`).

Run tests from the `pawduty-fe/` directory with `npm test -- <path>` (or `npx jest <path>`). Work from `/home/wanaqil/Documents/Code/python/hackathon/pawduty/pawduty-fe`.

---

## Testing note (mocking strategy)

`utils/api.js` is the only module that touches `fetch`/`expo-constants`. Every test that renders `TaskProvider` mocks it wholesale with a factory:
```js
jest.mock('../../utils/api', () => ({
  ApiError: class ApiError extends Error {},
  api: {
    listTasks: jest.fn(), listPets: jest.fn(), getTask: jest.fn(),
    createTask: jest.fn(), updateTask: jest.fn(), deleteTask: jest.fn(),
  },
}));
```
Only `__tests__/utils/api.test.js` loads the real client (mocking `global.fetch`).

---

## Task 1: API Config + Client

**Files:**
- Create: `constants/api.js`
- Create: `utils/api.js`
- Create: `__tests__/utils/api.test.js`

- [ ] **Step 1: Write `constants/api.js`**

```js
import Constants from 'expo-constants';

export const PORT = 8001; // matches task-api README run command
export const OVERRIDE = null; // e.g. 'http://192.168.1.42:8001' for tunnel/edge cases

function deriveHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    '';
  const host = hostUri.split(':')[0];
  return host ? `http://${host}:${PORT}` : `http://localhost:${PORT}`;
}

export const API_BASE = OVERRIDE || deriveHost();
```

- [ ] **Step 2: Write the failing test — `__tests__/utils/api.test.js`**

```js
import { api, ApiError } from '../../utils/api';
import { API_BASE } from '../../constants/api';

function mockResponse({ ok = true, status = 200, body = undefined }) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  global.fetch = jest.fn();
});

test('listTasks GETs /tasks and returns parsed array', async () => {
  const tasks = [{ id: 't1' }];
  global.fetch.mockResolvedValue(mockResponse({ body: tasks }));
  const result = await api.listTasks();
  expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/tasks`, expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }));
  expect(result).toEqual(tasks);
});

test('listPets GETs /pets', async () => {
  global.fetch.mockResolvedValue(mockResponse({ body: [{ id: 'p1' }] }));
  await api.listPets();
  expect(global.fetch).toHaveBeenCalledWith(`${API_BASE}/pets`, expect.any(Object));
});

test('getTask GETs /tasks/{id}', async () => {
  global.fetch.mockResolvedValue(mockResponse({ body: { id: 't1' } }));
  await api.getTask('t1');
  expect(global.fetch.mock.calls[0][0]).toBe(`${API_BASE}/tasks/t1`);
});

test('createTask POSTs JSON body with no id and returns created task', async () => {
  const created = { id: 'srv1', title: 'x' };
  global.fetch.mockResolvedValue(mockResponse({ status: 201, body: created }));
  const result = await api.createTask({ title: 'x', category: 'other', petId: 'p1', date: '2026-07-08', assignee: { name: 'Al' } });
  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toBe(`${API_BASE}/tasks`);
  expect(opts.method).toBe('POST');
  expect(JSON.parse(opts.body)).not.toHaveProperty('id');
  expect(result).toEqual(created);
});

test('updateTask PATCHes /tasks/{id} with fields', async () => {
  global.fetch.mockResolvedValue(mockResponse({ body: { id: 't1', done: true } }));
  await api.updateTask('t1', { done: true });
  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toBe(`${API_BASE}/tasks/t1`);
  expect(opts.method).toBe('PATCH');
  expect(JSON.parse(opts.body)).toEqual({ done: true });
});

test('deleteTask DELETEs and resolves null on 204', async () => {
  global.fetch.mockResolvedValue(mockResponse({ status: 204, body: undefined }));
  const result = await api.deleteTask('t1');
  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toBe(`${API_BASE}/tasks/t1`);
  expect(opts.method).toBe('DELETE');
  expect(result).toBeNull();
});

test('non-2xx throws ApiError with status and detail', async () => {
  global.fetch.mockResolvedValue(mockResponse({ ok: false, status: 404, body: { detail: 'Task not found' } }));
  await expect(api.getTask('nope')).rejects.toMatchObject({ status: 404, detail: 'Task not found' });
  await expect(api.getTask('nope')).rejects.toBeInstanceOf(ApiError);
});
```

- [ ] **Step 3: Run to verify failure**

```bash
npx jest __tests__/utils/api.test.js
```
Expected: FAIL — cannot find module `../../utils/api`.

- [ ] **Step 4: Implement `utils/api.js`**

```js
import { API_BASE } from '../constants/api';

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let detail;
    try {
      const body = await res.json();
      detail = body?.detail;
    } catch (e) {
      detail = undefined;
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listTasks: () => request('/tasks'),
  listPets: () => request('/pets'),
  getTask: (id) => request(`/tasks/${id}`),
  createTask: (body) => request('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, fields) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx jest __tests__/utils/api.test.js
```
Expected: PASS — 7 tests.

- [ ] **Step 6: Commit**

```bash
git add constants/api.js utils/api.js __tests__/utils/api.test.js
git commit -m "feat: add Task API client with auto-derived base URL"
```

---

## Task 2: TaskContext Rewrite (API-backed)

**Files:**
- Modify: `context/TaskContext.jsx` (full rewrite)
- Modify: `__tests__/context/TaskContext.test.js` (rewrite to mock `utils/api`)

Note: `data/seed.js` is NOT changed — it keeps exporting `SEED_USER` (used for the local user default) plus the now-unused `SEED_PETS`/`SEED_TASKS` (keeps `__tests__/data/seed.test.js` green).

- [ ] **Step 1: Rewrite the test — `__tests__/context/TaskContext.test.js`**

```js
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TaskProvider, useTaskContext } from '../../context/TaskContext';
import { api } from '../../utils/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../../utils/api', () => ({
  ApiError: class ApiError extends Error {},
  api: {
    listTasks: jest.fn(), listPets: jest.fn(), getTask: jest.fn(),
    createTask: jest.fn(), updateTask: jest.fn(), deleteTask: jest.fn(),
  },
}));

const TASK = {
  id: 't1', title: 'Seed task', category: 'other', petId: 'p1',
  assignee: { name: 'Alex', initials: 'A' },
  date: '2026-07-08', time: '', repeat: 'once', note: '', done: false,
};
const PET = { id: 'p1', name: 'Mochi', species: 'cat', breed: 'x', avatarColor: '#FFD166' };

beforeEach(() => {
  jest.clearAllMocks();
  api.listTasks.mockResolvedValue([TASK]);
  api.listPets.mockResolvedValue([PET]);
  api.createTask.mockImplementation(async (body) => ({ ...body, id: 'srv1', assignee: { name: 'Al', initials: 'A' } }));
  api.updateTask.mockImplementation(async (id, fields) => ({ ...TASK, ...fields, id }));
  api.deleteTask.mockResolvedValue(null);
});

function Probe({ testID, value }) {
  return <Text testID={testID}>{String(value)}</Text>;
}

async function renderHook(Consumer) {
  let utils;
  await act(async () => { utils = render(<TaskProvider><Consumer /></TaskProvider>); });
  return utils;
}

test('loads tasks and pets from the API', async () => {
  function C() {
    const { tasks, pets, loading } = useTaskContext();
    return (<><Probe testID="tc" value={tasks.length} /><Probe testID="pc" value={pets.length} /><Probe testID="ld" value={loading} /></>);
  }
  const { getByTestId } = await renderHook(C);
  expect(getByTestId('tc').props.children).toBe('1');
  expect(getByTestId('pc').props.children).toBe('1');
  expect(getByTestId('ld').props.children).toBe('false');
});

test('addTask posts and appends the server task', async () => {
  let ctx;
  function C() { ctx = useTaskContext(); return <Probe testID="tc" value={ctx.tasks.length} />; }
  const { getByTestId } = await renderHook(C);
  await act(async () => { await ctx.addTask({ id: 'client-should-be-dropped', title: 'New' }); });
  expect(api.createTask).toHaveBeenCalledWith(expect.not.objectContaining({ id: expect.anything() }));
  expect(getByTestId('tc').props.children).toBe('2');
});

test('editTask patches and replaces the task', async () => {
  let ctx;
  function C() { ctx = useTaskContext(); const t = ctx.tasks[0]; return <Probe testID="title" value={t?.title} />; }
  const { getByTestId } = await renderHook(C);
  await act(async () => { await ctx.editTask('t1', { title: 'Renamed' }); });
  expect(api.updateTask).toHaveBeenCalledWith('t1', { title: 'Renamed' });
  expect(getByTestId('title').props.children).toBe('Renamed');
});

test('toggleTaskDone flips optimistically and reconciles', async () => {
  let ctx;
  function C() { ctx = useTaskContext(); return <Probe testID="done" value={ctx.tasks[0]?.done} />; }
  const { getByTestId } = await renderHook(C);
  expect(getByTestId('done').props.children).toBe('false');
  await act(async () => { await ctx.toggleTaskDone('t1'); });
  expect(api.updateTask).toHaveBeenCalledWith('t1', { done: true });
  expect(getByTestId('done').props.children).toBe('true');
});

test('toggleTaskDone reverts on API failure', async () => {
  api.updateTask.mockRejectedValueOnce(new Error('network'));
  let ctx;
  function C() { ctx = useTaskContext(); return <Probe testID="done" value={ctx.tasks[0]?.done} />; }
  const { getByTestId } = await renderHook(C);
  await act(async () => { await ctx.toggleTaskDone('t1'); });
  expect(getByTestId('done').props.children).toBe('false'); // reverted
});

test('deleteTask removes the task', async () => {
  let ctx;
  function C() { ctx = useTaskContext(); return <Probe testID="tc" value={ctx.tasks.length} />; }
  const { getByTestId } = await renderHook(C);
  await act(async () => { await ctx.deleteTask('t1'); });
  expect(api.deleteTask).toHaveBeenCalledWith('t1');
  expect(getByTestId('tc').props.children).toBe('0');
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/context/TaskContext.test.js
```
Expected: FAIL — the current AsyncStorage-based context doesn't call `api.*` / lacks `editTask`/`deleteTask`.

- [ ] **Step 3: Rewrite `context/TaskContext.jsx`**

```jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_USER } from '../data/seed';
import { api } from '../utils/api';

const USER_KEY = '@pawduty_user';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [pets, setPets] = useState([]);
  const [user, setUser] = useState(SEED_USER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, p] = await Promise.all([api.listTasks(), api.listPets()]);
      setTasks(t);
      setPets(p);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw));
    })();
  }, []);

  async function addTask(input) {
    const { id, ...body } = input;
    const created = await api.createTask(body);
    setTasks(prev => [...prev, created]);
    return created;
  }

  async function editTask(id, fields) {
    const updated = await api.updateTask(id, fields);
    setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
    return updated;
  }

  async function toggleTaskDone(id) {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const next = !target.done;
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: next } : t)));
    try {
      const updated = await api.updateTask(id, { done: next });
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (e) {
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !next } : t)));
      setError(e);
    }
  }

  async function deleteTask(id) {
    const snapshot = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await api.deleteTask(id);
    } catch (e) {
      setTasks(snapshot);
      setError(e);
    }
  }

  async function updateUser(fields) {
    setUser(prev => ({ ...prev, ...fields }));
    const updated = { ...user, ...fields };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  }

  return (
    <TaskContext.Provider value={{
      tasks, pets, user, loading, error, reload,
      addTask, editTask, toggleTaskDone, deleteTask, updateUser,
    }}>
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

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/context/TaskContext.test.js
```
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add context/TaskContext.jsx __tests__/context/TaskContext.test.js
git commit -m "feat: back TaskContext with the Task API (add/edit/toggle/delete)"
```

---

## Task 3: TaskCard Edit + Delete Affordances

**Files:**
- Modify: `components/TaskCard.jsx` (add optional `onEdit`, `onDelete`)
- Modify: `__tests__/components/TaskCard.test.jsx` (add coverage for the new props)

- [ ] **Step 1: Add tests to `__tests__/components/TaskCard.test.jsx`**

Replace the file with:
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
test('calls onDelete with task when trash pressed', () => {
  const onDelete = jest.fn();
  const { getByTestId } = render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} onDelete={onDelete} />);
  fireEvent.press(getByTestId('task-delete'));
  expect(onDelete).toHaveBeenCalledWith(task);
});
test('calls onEdit with task when body pressed', () => {
  const onEdit = jest.fn();
  const { getByTestId } = render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} onEdit={onEdit} />);
  fireEvent.press(getByTestId('task-edit'));
  expect(onEdit).toHaveBeenCalledWith(task);
});
test('does not render trash when onDelete absent', () => {
  const { queryByTestId } = render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} />);
  expect(queryByTestId('task-delete')).toBeNull();
});
```

- [ ] **Step 2: Run to verify the new tests fail**

```bash
npx jest __tests__/components/TaskCard.test.jsx
```
Expected: FAIL — `task-delete` / `task-edit` testIDs not found.

- [ ] **Step 3: Modify `components/TaskCard.jsx`**

Replace the component's render (keep imports/styles, add `onEdit`/`onDelete` params and the two affordances). Full file:
```jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import CategoryBadge from './CategoryBadge';
import PetAvatar from './PetAvatar';

export default function TaskCard({ task, pet, onToggle, onEdit, onDelete }) {
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
      <TouchableOpacity
        testID="task-edit"
        style={styles.body}
        activeOpacity={onEdit ? 0.6 : 1}
        onPress={() => onEdit && onEdit(task)}
        disabled={!onEdit}
      >
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
      </TouchableOpacity>
      {onDelete && (
        <TouchableOpacity
          testID="task-delete"
          onPress={() => onDelete(task)}
          style={styles.delete}
          accessibilityLabel="Delete task"
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
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
  delete: { paddingLeft: SPACING.sm, justifyContent: 'center' },
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/TaskCard.test.jsx
```
Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add components/TaskCard.jsx __tests__/components/TaskCard.test.jsx
git commit -m "feat: add edit (tap) and delete (trash) affordances to TaskCard"
```

---

## Task 4: Home Screen — Loading/Error/Retry + Edit/Delete Wiring

**Files:**
- Modify: `app/(tabs)/index.jsx`
- Modify: `__tests__/screens/HomeScreen.test.jsx`

- [ ] **Step 1: Rewrite `__tests__/screens/HomeScreen.test.jsx`**

```jsx
import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';
import { TaskProvider } from '../../context/TaskContext';
import { api } from '../../utils/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('../../utils/api', () => ({
  ApiError: class ApiError extends Error {},
  api: {
    listTasks: jest.fn(), listPets: jest.fn(), getTask: jest.fn(),
    createTask: jest.fn(), updateTask: jest.fn(), deleteTask: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.listTasks.mockResolvedValue([]);
  api.listPets.mockResolvedValue([]);
});

async function renderHome() {
  let utils;
  await act(async () => { utils = render(<TaskProvider><HomeScreen /></TaskProvider>); });
  return utils;
}

test('renders greeting', async () => {
  const { getByText } = await renderHome();
  expect(getByText(/Good/)).toBeTruthy();
});

test('renders all 3 segment buttons', async () => {
  const { getByText } = await renderHome();
  expect(getByText('Daily')).toBeTruthy();
  expect(getByText('Weekly')).toBeTruthy();
  expect(getByText('Monthly')).toBeTruthy();
});

test('shows an error banner with retry when loading fails', async () => {
  api.listTasks.mockRejectedValueOnce(new Error('offline'));
  const { getByText } = await renderHome();
  expect(getByText(/Couldn't reach/i)).toBeTruthy();
  // retry re-calls the API
  api.listTasks.mockResolvedValueOnce([]);
  api.listPets.mockResolvedValueOnce([]);
  await act(async () => { fireEvent.press(getByText('Retry')); });
  expect(api.listTasks).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run to verify the error-banner test fails**

```bash
npx jest __tests__/screens/HomeScreen.test.jsx
```
Expected: FAIL — no "Couldn't reach" banner / "Retry" yet (greeting/segment tests may pass).

- [ ] **Step 3: Rewrite `app/(tabs)/index.jsx`**

```jsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
  const { tasks, pets, toggleTaskDone, deleteTask, user, loading, error, reload } = useTaskContext();
  const [mode, setMode] = useState('Daily');
  const router = useRouter();
  const filtered = filterTasks(tasks, mode.toLowerCase());

  function handleEdit(task) {
    router.push({ pathname: '/(tabs)/add', params: { editId: task.id } });
  }

  function handleDelete(task) {
    Alert.alert('Delete task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
    ]);
  }

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

        {loading ? (
          <ActivityIndicator testID="home-loading" size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl * 2 }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>📡</Text>
            <Text style={styles.errorText}>Couldn't reach the server.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={reload}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </>
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
  errorBox: { alignItems: 'center', marginTop: SPACING.xl * 2, paddingHorizontal: SPACING.lg },
  errorIcon: { fontSize: 40, marginBottom: SPACING.sm },
  errorText: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.md, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg },
  retryText: { color: COLORS.white, fontWeight: '700' },
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/HomeScreen.test.jsx
```
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/index.jsx" __tests__/screens/HomeScreen.test.jsx
git commit -m "feat: Home loading/error/retry states and edit/delete wiring"
```

---

## Task 5: Add Screen — Edit Mode

**Files:**
- Modify: `app/(tabs)/add.jsx`
- Modify: `__tests__/screens/AddScreen.test.jsx`

- [ ] **Step 1: Rewrite `__tests__/screens/AddScreen.test.jsx`**

```jsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AddScreen from '../../app/(tabs)/add';
import { TaskProvider } from '../../context/TaskContext';
import { api } from '../../utils/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('../../utils/api', () => ({
  ApiError: class ApiError extends Error {},
  api: {
    listTasks: jest.fn(), listPets: jest.fn(), getTask: jest.fn(),
    createTask: jest.fn(), updateTask: jest.fn(), deleteTask: jest.fn(),
  },
}));

let mockParams = {};
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

const TASK = {
  id: 't1', title: 'Existing task', category: 'grooming', petId: 'p1',
  assignee: { name: 'Alex', initials: 'A' }, date: '2026-07-08', time: '', repeat: 'once', note: '', done: false,
};
const PET = { id: 'p1', name: 'Mochi', species: 'cat', breed: 'x', avatarColor: '#FFD166' };

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  api.listTasks.mockResolvedValue([TASK]);
  api.listPets.mockResolvedValue([PET]);
  api.createTask.mockResolvedValue({ ...TASK, id: 'srv1' });
  api.updateTask.mockResolvedValue({ ...TASK, title: 'Updated' });
});

async function renderAdd() {
  let utils;
  await act(async () => { utils = render(<TaskProvider><AddScreen /></TaskProvider>); });
  return utils;
}

test('shows validation error when saving without title (create mode)', async () => {
  const { getByText } = await renderAdd();
  await act(async () => { fireEvent.press(getByText('Save Task')); });
  expect(getByText('Task name is required')).toBeTruthy();
  expect(api.createTask).not.toHaveBeenCalled();
});

test('create mode posts a new task without an id', async () => {
  const { getByText, getByPlaceholderText } = await renderAdd();
  await act(async () => { fireEvent.changeText(getByPlaceholderText(/Give Mochi flea medicine/), 'Brush teeth'); });
  await act(async () => { fireEvent.press(getByText('Save Task')); });
  expect(api.createTask).toHaveBeenCalledWith(expect.not.objectContaining({ id: expect.anything() }));
});

test('edit mode prefills the title and PATCHes on save', async () => {
  mockParams = { editId: 't1' };
  const { getByDisplayValue, getByText } = await renderAdd();
  expect(getByDisplayValue('Existing task')).toBeTruthy();
  await act(async () => { fireEvent.press(getByText('Save Changes')); });
  expect(api.updateTask).toHaveBeenCalledWith('t1', expect.objectContaining({ title: 'Existing task' }));
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx jest __tests__/screens/AddScreen.test.jsx
```
Expected: FAIL — edit mode not implemented (no "Save Changes", no prefill from `editId`).

- [ ] **Step 3: Rewrite `app/(tabs)/add.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Platform, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTaskContext } from '../../context/TaskContext';
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

function parseDate(str) {
  const d = str ? new Date(str + 'T00:00:00') : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function AddScreen() {
  const { pets, addTask, editTask, tasks } = useTaskContext();
  const router = useRouter();
  const params = useLocalSearchParams();

  const editing = !!params.editId;
  const existing = editing ? tasks.find(t => t.id === params.editId) : null;

  const [title, setTitle] = useState(existing?.title ?? params.prefillTitle ?? '');
  const [category, setCategory] = useState(existing?.category ?? params.prefillCategory ?? 'medicine');
  const [petId, setPetId] = useState(existing?.petId ?? pets[0]?.id ?? '');
  const [assignee, setAssignee] = useState(existing?.assignee?.name ?? '');
  const [date, setDate] = useState(parseDate(existing?.date));
  const [showDate, setShowDate] = useState(false);
  const [time, setTime] = useState(existing?.time ?? '');
  const [repeat, setRepeat] = useState(existing?.repeat ?? 'once');
  const [note, setNote] = useState(existing?.note ?? '');
  const [errors, setErrors] = useState({});
  // "hydrated" is true when the edit form has been populated. In create mode
  // there's nothing to hydrate. In edit mode the provider may still be loading
  // tasks at mount (useState initializers ran with existing===undefined), so we
  // hydrate from `existing` once it becomes available.
  const [hydrated, setHydrated] = useState(editing ? !!existing : true);

  useEffect(() => {
    if (editing && existing && !hydrated) {
      setTitle(existing.title);
      setCategory(existing.category);
      setPetId(existing.petId);
      setAssignee(existing.assignee?.name ?? '');
      setDate(parseDate(existing.date));
      setTime(existing.time ?? '');
      setRepeat(existing.repeat ?? 'once');
      setNote(existing.note ?? '');
      setHydrated(true);
    }
  }, [editing, existing, hydrated]);

  // Default the pet selection once pets load (create mode / none chosen yet).
  useEffect(() => {
    if (!petId && pets.length) setPetId(pets[0].id);
  }, [pets, petId]);

  function validate() {
    const e = {};
    if (!title.trim()) e.title = 'Task name is required';
    if (!petId) e.petId = 'Please select a pet';
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const dateStr = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const fields = {
      title: title.trim(),
      category,
      petId,
      assignee: { name: assignee.trim() },
      date: dateStr,
      time,
      repeat,
      note: note.trim(),
    };
    try {
      if (editing) {
        await editTask(params.editId, fields);
      } else {
        await addTask({ ...fields, done: false });
      }
      router.replace('/(tabs)/');
    } catch (err) {
      Alert.alert('Save failed', err?.detail || 'Could not reach the server. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>{editing ? 'Edit Task' : 'Add Task'}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Task name *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="e.g. Give Mochi flea medicine"
            placeholderTextColor={COLORS.textSecondary}
            value={title}
            onChangeText={t => { setTitle(t); setErrors(er => ({ ...er, title: undefined })); }}
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
                onPress={() => { setPetId(pet.id); setErrors(er => ({ ...er, petId: undefined })); }}
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
          <Text style={styles.saveBtnText}>{editing ? 'Save Changes' : 'Save Task'}</Text>
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

Note: `utils/uuid.js` is no longer imported anywhere (the server assigns ids). Leave the file — the AI screen and others don't use it, and removing it is out of scope. If a lint check flags it as unused, that's acceptable.

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/screens/AddScreen.test.jsx
```
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/add.jsx" __tests__/screens/AddScreen.test.jsx
git commit -m "feat: Add screen edit mode (PATCH) and API-backed create"
```

---

## Task 6: Migrate Remaining Screen Tests + Full Green

**Files:**
- Modify: `__tests__/screens/ProfileScreen.test.jsx`
- Modify: `__tests__/screens/ProgressScreen.test.jsx`

These render `TaskProvider` and must mock `utils/api` (otherwise the real client loads `fetch`/`expo-constants`). Their assertions are unchanged.

- [ ] **Step 1: Rewrite `__tests__/screens/ProfileScreen.test.jsx`**

```jsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile';
import { TaskProvider } from '../../context/TaskContext';
import { api } from '../../utils/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../../utils/api', () => ({
  ApiError: class ApiError extends Error {},
  api: {
    listTasks: jest.fn(), listPets: jest.fn(), getTask: jest.fn(),
    createTask: jest.fn(), updateTask: jest.fn(), deleteTask: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.listTasks.mockResolvedValue([]);
  api.listPets.mockResolvedValue([{ id: 'p1', name: 'Mochi', species: 'cat', breed: 'Scottish Fold', avatarColor: '#FFD166' }]);
});

async function renderProfile() {
  let utils;
  await act(async () => { utils = render(<TaskProvider><ProfileScreen /></TaskProvider>); });
  return utils;
}

test('renders user name Alex', async () => {
  const { getByText } = await renderProfile();
  expect(getByText('Alex')).toBeTruthy();
});

test('renders My Pets section', async () => {
  const { getByText } = await renderProfile();
  expect(getByText('My Pets')).toBeTruthy();
});

test('renders Total Tasks and Done This Month stat labels', async () => {
  const { getByText } = await renderProfile();
  expect(getByText('Total Tasks')).toBeTruthy();
  expect(getByText('Done This Month')).toBeTruthy();
});
```

- [ ] **Step 2: Rewrite `__tests__/screens/ProgressScreen.test.jsx`**

```jsx
import React from 'react';
import { render, act } from '@testing-library/react-native';
import ProgressScreen from '../../app/(tabs)/progress';
import { TaskProvider } from '../../context/TaskContext';
import { api } from '../../utils/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('react-native-calendars', () => ({ Calendar: 'Calendar' }));
jest.mock('react-native-chart-kit', () => ({ PieChart: 'PieChart' }));
jest.mock('react-native-svg', () => ({
  Svg: 'Svg', G: 'G', Circle: 'Circle', Text: 'SvgText', Path: 'Path',
}));
jest.mock('../../utils/api', () => ({
  ApiError: class ApiError extends Error {},
  api: {
    listTasks: jest.fn(), listPets: jest.fn(), getTask: jest.fn(),
    createTask: jest.fn(), updateTask: jest.fn(), deleteTask: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  api.listTasks.mockResolvedValue([]);
  api.listPets.mockResolvedValue([]);
});

async function renderProgress() {
  let utils;
  await act(async () => { utils = render(<TaskProvider><ProgressScreen /></TaskProvider>); });
  return utils;
}

test('renders all 3 segment buttons', async () => {
  const { getByText } = await renderProgress();
  expect(getByText('Daily')).toBeTruthy();
  expect(getByText('Weekly')).toBeTruthy();
  expect(getByText('Monthly')).toBeTruthy();
});

test('renders stats row with Total, Done, Pending labels', async () => {
  const { getByText } = await renderProgress();
  expect(getByText('Total')).toBeTruthy();
  expect(getByText('Done')).toBeTruthy();
  expect(getByText('Pending')).toBeTruthy();
});
```

- [ ] **Step 3: Run the FULL suite**

```bash
npm test
```
Expected: PASS — all suites green. Test files & counts: api (7), TaskContext (6), TaskCard (6), HomeScreen (3), AddScreen (3), ProfileScreen (3), ProgressScreen (2), AIScreen (2, unchanged), CategoryBadge (4), PetAvatar (2), seed (4), dateFilters (4). Confirm 0 failures.

- [ ] **Step 4: Commit**

```bash
git add __tests__/screens/ProfileScreen.test.jsx __tests__/screens/ProgressScreen.test.jsx
git commit -m "test: mock Task API in Profile/Progress screen tests"
```

---

## Task 7: Live Contract Verification (against the running backend)

No source changes. Proves the client's request shapes match the real backend.

- [ ] **Step 1: Start the backend on a throwaway DB**

```bash
cd /home/wanaqil/Documents/Code/python/hackathon/pawduty/task-api
TASK_DB_PATH=/tmp/pawduty_fe_contract.db .venv/bin/uvicorn app.main:app --port 8001 &
for i in $(seq 1 20); do curl -s http://localhost:8001/health >/dev/null 2>&1 && break; sleep 0.5; done
curl -s http://localhost:8001/health; echo
```

- [ ] **Step 2: Replay each frontend request shape and check status/body**

```bash
B=http://localhost:8001
echo "listPets:   $(curl -s -o /dev/null -w '%{http_code}' $B/pets) (expect 200)"
echo "listTasks:  $(curl -s -o /dev/null -w '%{http_code}' $B/tasks) (expect 200)"
# createTask — body shape the client sends (no id, assignee has name only)
NEW=$(curl -s -X POST $B/tasks -H 'Content-Type: application/json' \
  -d '{"title":"Contract check","category":"medicine","petId":"p1","assignee":{"name":"Al Bee"},"date":"2026-07-10","time":"","repeat":"once","note":"","done":false}')
echo "createTask: $(printf '%s' "$NEW" | python3 -c 'import sys,json; t=json.load(sys.stdin); print("id+initials ->", bool(t["id"]), t["assignee"]["initials"])') (expect True BA)"
ID=$(printf '%s' "$NEW" | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
echo "getTask:    $(curl -s -o /dev/null -w '%{http_code}' $B/tasks/$ID) (expect 200)"
echo "updateTask(toggle): $(curl -s -X PATCH $B/tasks/$ID -H 'Content-Type: application/json' -d '{"done":true}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["done"])') (expect True)"
echo "updateTask(edit):   $(curl -s -X PATCH $B/tasks/$ID -H 'Content-Type: application/json' -d '{"title":"Renamed"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["title"])') (expect Renamed)"
echo "deleteTask: $(curl -s -o /dev/null -w '%{http_code}' -X DELETE $B/tasks/$ID) (expect 204)"
echo "get deleted: $(curl -s -o /dev/null -w '%{http_code}' $B/tasks/$ID) (expect 404)"
```

Expected: 200/200, id present + initials "BA", 200, True, Renamed, 204, 404.

- [ ] **Step 3: Stop the backend and clean up**

```bash
pkill -f "uvicorn app.main:app" || true
rm -f /tmp/pawduty_fe_contract.db
```

- [ ] **Step 4: Final verification**

```bash
cd /home/wanaqil/Documents/Code/python/hackathon/pawduty/pawduty-fe
npm test 2>&1 | tail -5
git status --short
```
Expected: full Jest suite green; only expected changes present.

---

## Verification Checklist

- [ ] `constants/api.js` + `utils/api.js` implement all six methods with `ApiError` handling
- [ ] TaskContext loads tasks+pets from the API with loading/error/retry; user stays in AsyncStorage
- [ ] Create (Add), Read (list + load), Update (toggle + edit), Delete (trash) all reachable from the UI
- [ ] Each wired operation has an input/output test; full Jest suite passes
- [ ] Live contract check passes for all endpoints against the running backend
```
