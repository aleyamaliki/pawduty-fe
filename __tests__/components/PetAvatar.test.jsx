import React from 'react';
import { render } from '@testing-library/react-native';
import PetAvatar from '../../components/PetAvatar';

test('renders first letter of name', async () => {
  const { getByText } = await render(<PetAvatar name="Mochi" avatarColor="#FFD166" />);
  expect(getByText('M')).toBeTruthy();
});
test('uppercases the initial', async () => {
  const { getByText } = await render(<PetAvatar name="buddy" avatarColor="#FF8C42" />);
  expect(getByText('B')).toBeTruthy();
});
