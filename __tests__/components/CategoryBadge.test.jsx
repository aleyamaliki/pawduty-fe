import React from 'react';
import { render } from '@testing-library/react-native';
import CategoryBadge from '../../components/CategoryBadge';

test('renders Vaccination label', async () => {
  const { getByText } = await render(<CategoryBadge category="vaccination" />);
  expect(getByText('Vaccination')).toBeTruthy();
});
test('renders Medicine label', async () => {
  const { getByText } = await render(<CategoryBadge category="medicine" />);
  expect(getByText('Medicine')).toBeTruthy();
});
test('renders Grooming label', async () => {
  const { getByText } = await render(<CategoryBadge category="grooming" />);
  expect(getByText('Grooming')).toBeTruthy();
});
test('renders Other for unknown category', async () => {
  const { getByText } = await render(<CategoryBadge category="unknown" />);
  expect(getByText('Other')).toBeTruthy();
});
