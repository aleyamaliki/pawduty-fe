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
