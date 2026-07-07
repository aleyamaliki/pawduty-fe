import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AIScreen from '../../app/(tabs)/ai';
import * as ImagePicker from 'expo-image-picker';
import { scanThermal } from '../../utils/mlApi';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../../utils/mlApi', () => ({
  MlScanError: class MlScanError extends Error {
    constructor(status, detail) {
      super(detail);
      this.status = status;
      this.detail = typeof detail === 'string' ? detail : undefined;
    }
  },
  scanThermal: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders the image-picker button', async () => {
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = await render(<AIScreen />));
  });
  expect(getByTestId('pick-button')).toBeTruthy();
});

test('picking an image scans it and shows the result', async () => {
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:img' }] });
  scanThermal.mockResolvedValue({ tag: 'unhealthy', confidence: 0.62 });
  let getByTestId, queryByText;
  await act(async () => {
    ({ getByTestId, queryByText } = await render(<AIScreen />));
  });
  await act(async () => {
    fireEvent.press(getByTestId('pick-button'));
  });
  expect(scanThermal).toHaveBeenCalledWith('blob:img');
  expect(getByTestId('scan-result')).toBeTruthy();
  expect(queryByText('NEEDS ATTENTION')).toBeTruthy();
  expect(queryByText(/Possible signs of illness/)).toBeTruthy();
});

test('shows the service error message when the scan fails', async () => {
  const { MlScanError } = require('../../utils/mlApi');
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'blob:x' }] });
  scanThermal.mockRejectedValue(new MlScanError(422, 'Use a thermal (INFERNO) frame.'));
  let getByTestId, queryByText;
  await act(async () => {
    ({ getByTestId, queryByText } = await render(<AIScreen />));
  });
  await act(async () => {
    fireEvent.press(getByTestId('pick-button'));
  });
  expect(getByTestId('scan-error')).toBeTruthy();
  expect(queryByText('Use a thermal (INFERNO) frame.')).toBeTruthy();
});

test('canceling the picker does not scan', async () => {
  ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = await render(<AIScreen />));
  });
  await act(async () => {
    fireEvent.press(getByTestId('pick-button'));
  });
  expect(scanThermal).not.toHaveBeenCalled();
  expect(getByTestId('pick-button')).toBeTruthy();
});
