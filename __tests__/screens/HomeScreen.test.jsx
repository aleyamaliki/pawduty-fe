import React from 'react';
import { render, act } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';
import { TaskProvider } from '../../context/TaskContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

test('renders greeting', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = await render(<TaskProvider><HomeScreen /></TaskProvider>));
  });
  expect(getByText(/Good/)).toBeTruthy();
});

test('renders all 3 segment buttons', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = await render(<TaskProvider><HomeScreen /></TaskProvider>));
  });
  expect(getByText('Daily')).toBeTruthy();
  expect(getByText('Weekly')).toBeTruthy();
  expect(getByText('Monthly')).toBeTruthy();
});
