import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AIScreen from '../../app/(tabs)/ai';

jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

test('renders scan button when permission granted', async () => {
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = await render(<AIScreen />));
  });
  expect(getByTestId('scan-button')).toBeTruthy();
});

test('shows loading indicator after pressing scan button', async () => {
  jest.useFakeTimers();
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = await render(<AIScreen />));
  });
  await act(async () => {
    fireEvent.press(getByTestId('scan-button'));
  });
  expect(getByTestId('scan-loading')).toBeTruthy();
  jest.useRealTimers();
});
