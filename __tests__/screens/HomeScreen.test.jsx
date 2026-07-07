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
  api.listTasks.mockResolvedValueOnce([]);
  api.listPets.mockResolvedValueOnce([]);
  await act(async () => { fireEvent.press(getByText('Retry')); });
  expect(api.listTasks).toHaveBeenCalledTimes(2);
});
