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
