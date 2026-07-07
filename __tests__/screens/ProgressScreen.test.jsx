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
    ({ getByText } = await render(<TaskProvider><ProgressScreen /></TaskProvider>));
  });
  expect(getByText('Daily')).toBeTruthy();
  expect(getByText('Weekly')).toBeTruthy();
  expect(getByText('Monthly')).toBeTruthy();
});

test('renders stats row with Total, Done, Pending labels', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = await render(<TaskProvider><ProgressScreen /></TaskProvider>));
  });
  expect(getByText('Total')).toBeTruthy();
  expect(getByText('Done')).toBeTruthy();
  expect(getByText('Pending')).toBeTruthy();
});
