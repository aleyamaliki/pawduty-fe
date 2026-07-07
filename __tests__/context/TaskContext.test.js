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
