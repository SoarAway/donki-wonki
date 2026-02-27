import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../components/atoms/Button';
import { Text } from '../components/atoms/Text';
import {colorTokens, radius, spacing} from '../components/config';
import { BaseScreen } from '../models/BaseScreen';

interface HomeScreenProps {
  apiStatus: string;
  permissionStatus: string;
  tokenPreview: string;
  lastForegroundMessage: string;
  onGoToRoutes: () => void;
  onGoToCommunity: () => void;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  apiStatus,
  permissionStatus,
  tokenPreview,
  lastForegroundMessage,
  onGoToRoutes,
  onGoToCommunity,
  onLogout,
}) => {
  return (
    <BaseScreen style={styles.container}>
      <Text variant="2xl" weight="bold" color="text.primary">
        Donki-Wonki
      </Text>
      <Text variant="sm" color="text.secondary">
        Predictive rail disruption alerts for Klang Valley commuters.
      </Text>

      <View style={styles.card}>
        <Text variant="sm" weight="semibold" color="text.primary">
          System Status
        </Text>
        <Text variant="xs" color="text.secondary">
          API: {apiStatus}
        </Text>
        <Text variant="xs" color="text.secondary">
          Notification permission: {permissionStatus}
        </Text>
        <Text variant="xs" color="text.secondary">
          Token: {tokenPreview}
        </Text>
      </View>

      <View style={styles.card}>
        <Text variant="sm" weight="semibold" color="text.primary">
          Latest Foreground Alert
        </Text>
        <Text variant="xs" color="text.secondary">
          {lastForegroundMessage}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Manage Routes" onPress={onGoToRoutes} fullWidth />
        <Button
          label="Open Community"
          onPress={onGoToCommunity}
          variant="outline"
          fullWidth
        />
        <Button label="Logout" onPress={onLogout} variant="ghost" fullWidth />
      </View>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[5],
    gap: spacing[3],
  },
  card: {
    backgroundColor: colorTokens.background_default,
    borderRadius: radius.md,
    padding: spacing[4],
    gap: spacing[2],
  },
  actions: {
    marginTop: spacing[2],
    gap: spacing[2],
  },
});
