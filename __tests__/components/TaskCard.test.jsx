import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import TaskCard from '../../components/TaskCard';

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

const task = {
  id: 't1', title: 'Give Mochi flea medicine', category: 'medicine',
  petId: 'p1', assignee: { name: 'Alex', initials: 'A' },
  date: '2026-07-04', time: '08:00', repeat: 'daily', note: '', done: false,
};
const pet = { id: 'p1', name: 'Mochi', avatarColor: '#FFD166' };

test('renders task title', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = await render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} />));
  });
  expect(getByText('Give Mochi flea medicine')).toBeTruthy();
});
test('calls onToggle with task id when checkbox pressed', async () => {
  const onToggle = jest.fn();
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = await render(<TaskCard task={task} pet={pet} onToggle={onToggle} />));
  });
  fireEvent.press(getByTestId('task-checkbox'));
  expect(onToggle).toHaveBeenCalledWith('t1');
});
test('shows pet name', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = await render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} />));
  });
  expect(getByText('Mochi')).toBeTruthy();
});
test('calls onDelete with task when trash pressed', async () => {
  const onDelete = jest.fn();
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = await render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} onDelete={onDelete} />));
  });
  fireEvent.press(getByTestId('task-delete'));
  expect(onDelete).toHaveBeenCalledWith(task);
});
test('calls onEdit with task when body pressed', async () => {
  const onEdit = jest.fn();
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = await render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} onEdit={onEdit} />));
  });
  fireEvent.press(getByTestId('task-edit'));
  expect(onEdit).toHaveBeenCalledWith(task);
});
test('does not render trash when onDelete absent', async () => {
  let queryByTestId;
  await act(async () => {
    ({ queryByTestId } = await render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} />));
  });
  expect(queryByTestId('task-delete')).toBeNull();
});
