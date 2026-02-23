import React from 'react';
import { Alert, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  getFcmToken,
  onForegroundFcmMessage,
  requestNotificationPermission,
} from './src/services/firebase';
import { checkHealth, fetchIncidents, sendToken } from './src/services/api/incidentsApi';
import { setErrorCallback, setLoadingCallback, wakeServer } from './src/services/api/apiClient';
import { Incident } from './src/services/api/types';
import { Text } from './src/components/atoms/Text';
import { Button } from './src/components/atoms/Button';
import { LoadingOverlay } from './src/components/molecules/LoadingOverlay';
import { colors, spacing, radius } from './src/components/config';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [permissionStatus, setPermissionStatus] = React.useState('Checking...');
  const [tokenPreview, setTokenPreview] = React.useState('Pending...');
  const [lastForegroundMessage, setLastForegroundMessage] = React.useState(
    'No message yet.',
  );
  const [apiStatus, setApiStatus] = React.useState('Waking server...');
  const [incidents, setIncidents] = React.useState<Incident[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [globalLoading, setGlobalLoading] = React.useState(false);

  React.useEffect(() => {
    setLoadingCallback(setGlobalLoading);
    setErrorCallback(message => {
      Alert.alert('API Error', message);
    });

    return () => {
      setLoadingCallback(null);
      setErrorCallback(null);
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        setApiStatus('Waking server (may take up to 60s)...');
        await wakeServer();
        if (!isMounted) {
          return;
        }
        setApiStatus('Server awake. Checking health...');

        const healthResponse = await checkHealth();
        if (isMounted) {
          setApiStatus(`Connected: ${healthResponse.status}`);
        }
      } catch (err) {
        if (isMounted) {
          setApiStatus(`Server wake failed: ${(err as Error).message}`);
        }
      }
    };

    initializeApp();

    const setupFcm = async () => {
      const granted = await requestNotificationPermission();
      if (!isMounted) {
        return;
      }

      setPermissionStatus(granted ? 'Granted' : 'Denied');

      if (!granted) {
        setTokenPreview('Unavailable (permission denied)');
        return;
      }

      const token = await getFcmToken();
      if (!isMounted) {
        return;
      }

      if (!token) {
        setTokenPreview('Unavailable (failed to fetch token)');
        return;
      }

      const preview = `${token.slice(0, 14)}...${token.slice(-8)}`;

      try {
        await sendToken(token);
      } catch {
        if (isMounted) {
          setApiStatus('FCM token could not be sent to server.');
        }
      }

      setTokenPreview(preview);
    };

    setupFcm();

    const unsubscribeForeground = onForegroundFcmMessage(payload => {
      const title = payload.title ?? 'Untitled message';
      const body = payload.body ?? 'No body';
      setLastForegroundMessage(`${title}: ${body}`);
    });

    return () => {
      isMounted = false;
      unsubscribeForeground();
    };
  }, []);

  const handleFetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await fetchIncidents();
      setIncidents(data);
      setApiStatus(`Fetched ${data.length} incident(s)`);
    } catch (err) {
      setApiStatus(`Fetch error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text variant="2xl" weight="bold" color="text.primary" align="center">
            Donki-Wonki App Base
          </Text>
          <Text variant="sm" color="text.secondary" align="center">
            API Status: {apiStatus}
          </Text>

          <Button
            label="Fetch Incidents"
            onPress={handleFetchIncidents}
            loading={loading}
            style={styles.buttonSpacing}
          />

          {incidents.length > 0 && (
            <View style={styles.listContainer}>
              <Text variant="base" weight="bold" style={styles.listTitle}>
                Incidents:
              </Text>
              {incidents.map(inc => (
                <Text key={inc.id} variant="sm" style={styles.itemText}>
                  • {inc.line} ({inc.station}): {inc.description}
                </Text>
              ))}
            </View>
          )}

          <Text variant="sm" color="text.secondary" align="center">
            FCM permission: {permissionStatus}
          </Text>

          <Text variant="sm" color="text.secondary" align="center">
            FCM token: {tokenPreview}
          </Text>
          <Text variant="sm" color="text.secondary" align="center">
            Last foreground message:
          </Text>
          <Text variant="xs" color="text.primary" align="center">
            {lastForegroundMessage}
          </Text>
        </View>
      </SafeAreaView>
      <LoadingOverlay visible={globalLoading} message="Loading..." />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
  },
  buttonSpacing: {
    marginVertical: spacing[3],
  },
  listContainer: {
    alignSelf: 'stretch',
    backgroundColor: colors.background.paper,
    padding: spacing[3],
    borderRadius: radius.md,
    marginVertical: spacing[2],
  },
  listTitle: {
    marginBottom: spacing[2],
    color: colors.text.primary,
  },
  itemText: {
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
});

export default App;
