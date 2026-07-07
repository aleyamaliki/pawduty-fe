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
    ({ getByTestId } = await render(<TaskProvider><BasicConsumer /></TaskProvider>));
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
    ({ getByTestId } = await render(<TaskProvider><AddConsumer /></TaskProvider>));
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
    ({ getByTestId } = await render(<TaskProvider><ToggleConsumer /></TaskProvider>));
  });
  expect(getByTestId('done').props.children).toBe('false');
  await act(async () => { getByTestId('toggle').props.onPress(); });
  expect(getByTestId('done').props.children).toBe('true');
});
