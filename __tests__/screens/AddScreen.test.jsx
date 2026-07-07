import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AddScreen from '../../app/(tabs)/add';
import { TaskProvider } from '../../context/TaskContext';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

test('shows validation error when saving without title', async () => {
  let getByText;
  await act(async () => {
    ({ getByText } = await render(<TaskProvider><AddScreen /></TaskProvider>));
  });
  await act(async () => { fireEvent.press(getByText('Save Task')); });
  expect(getByText('Task name is required')).toBeTruthy();
});
