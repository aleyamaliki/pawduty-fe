import React from 'react';
import { render, act } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile';
import { TaskProvider } from '../../context/TaskContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

test('renders user name Alex', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = await render(<TaskProvider><ProfileScreen /></TaskProvider>));
  });
  expect(getByText('Alex')).toBeTruthy();
});

test('renders My Pets section', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = await render(<TaskProvider><ProfileScreen /></TaskProvider>));
  });
  expect(getByText('My Pets')).toBeTruthy();
});

test('renders Total Tasks and Done This Month stat labels', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = await render(<TaskProvider><ProfileScreen /></TaskProvider>));
  });
  expect(getByText('Total Tasks')).toBeTruthy();
  expect(getByText('Done This Month')).toBeTruthy();
});
