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

test('renders task title', async () => {
  const { getByText } = await render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} />);
  expect(getByText('Give Mochi flea medicine')).toBeTruthy();
});
test('calls onToggle with task id when checkbox pressed', async () => {
  const onToggle = jest.fn();
  const { getByTestId } = await render(<TaskCard task={task} pet={pet} onToggle={onToggle} />);
  fireEvent.press(getByTestId('task-checkbox'));
  expect(onToggle).toHaveBeenCalledWith('t1');
});
test('shows pet name', async () => {
  const { getByText } = await render(<TaskCard task={task} pet={pet} onToggle={jest.fn()} />);
  expect(getByText('Mochi')).toBeTruthy();
});
