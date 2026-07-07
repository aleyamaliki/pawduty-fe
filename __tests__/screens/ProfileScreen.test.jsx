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
