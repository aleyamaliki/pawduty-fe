import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AIScreen from '../../app/(tabs)/ai';
import { scanThermal } from '../../utils/mlApi';

jest.mock('expo-camera', () => {
  const React = require('react');
  return {
    CameraView: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: async () => ({ uri: 'file:///tmp/shot.jpg' }),
      }));
      return null;
    }),
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
jest.mock('../../utils/mlApi', () => ({
  MlScanError: class MlScanError extends Error {
    constructor(status, detail) {
      super(detail);
      this.status = status;
      this.detail = detail;
    }
  },
  scanThermal: jest.fn(),
}));

beforeEach(() => {
  scanThermal.mockReset();
});

test('renders scan button when permission granted', async () => {
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = await render(<AIScreen />));
  });
  expect(getByTestId('scan-button')).toBeTruthy();
});

test('shows loading indicator while the scan is in flight', async () => {
  scanThermal.mockReturnValue(new Promise(() => {})); // never resolves
  let getByTestId;
  await act(async () => {
    ({ getByTestId } = await render(<AIScreen />));
  });
  await act(async () => {
    fireEvent.press(getByTestId('scan-button'));
  });
  expect(getByTestId('scan-loading')).toBeTruthy();
});

test('renders the health result returned by the scan service', async () => {
  scanThermal.mockResolvedValue({ tag: 'unhealthy', confidence: 0.62 });
  let getByTestId, queryByText;
  await act(async () => {
    ({ getByTestId, queryByText } = await render(<AIScreen />));
  });
  await act(async () => {
    fireEvent.press(getByTestId('scan-button'));
  });
  expect(getByTestId('scan-result')).toBeTruthy();
  expect(queryByText('NEEDS ATTENTION')).toBeTruthy();
  expect(queryByText(/Possible signs of illness/)).toBeTruthy();
});

test('shows an error message when the scan fails', async () => {
  const { MlScanError } = require('../../utils/mlApi');
  scanThermal.mockRejectedValue(new MlScanError(422, 'no body detected'));
  let getByTestId, queryByText;
  await act(async () => {
    ({ getByTestId, queryByText } = await render(<AIScreen />));
  });
  await act(async () => {
    fireEvent.press(getByTestId('scan-button'));
  });
  expect(getByTestId('scan-error')).toBeTruthy();
  expect(queryByText('no body detected')).toBeTruthy();
});
