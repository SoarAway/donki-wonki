/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/services/firebase', () => ({
  requestNotificationPermission: jest.fn().mockResolvedValue(true),
  getFcmToken: jest.fn().mockResolvedValue('test-fcm-token'),
  onForegroundFcmMessage: jest.fn().mockReturnValue(() => {}),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
    await Promise.resolve();
    await Promise.resolve();
  });
});
