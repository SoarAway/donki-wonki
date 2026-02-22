import React from 'react';
import { Alert, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  getFcmToken,
  onForegroundFcmMessage,
  requestNotificationPermission,
} from './src/services/firebase';
import { checkHealth, sendToken } from './src/services/api/apiEndpoints';
import { setErrorCallback, setLoadingCallback, wakeServer } from './src/services/api/apiClient';
import { Text } from './src/components/atoms/Text';
import { Button } from './src/components/atoms/Button';
import { Banner } from './src/components/atoms/Banner';
import { LoadingOverlay } from './src/components/molecules/LoadingOverlay';
import { colors, spacing, radius } from './src/components/config';
import { LoginScreen } from './src/screens/LoginScreen';

type AppScreen = 'home' | 'login';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [permissionStatus, setPermissionStatus] = React.useState('Checking...');
  const [tokenPreview, setTokenPreview] = React.useState('Pending...');
  const [lastForegroundMessage, setLastForegroundMessage] = React.useState(
    'No message yet.',
  );
  const [apiStatus, setApiStatus] = React.useState('Waking server...');
  const [loading, setLoading] = React.useState(false);
  const [globalLoading, setGlobalLoading] = React.useState(false);
  const [bannerVisible, setBannerVisible] = React.useState(false);
  const [bannerTitle, setBannerTitle] = React.useState('');
  const [bannerMessage, setBannerMessage] = React.useState('');
  const [currentScreen, setCurrentScreen] = React.useState<AppScreen>('home');

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
          setApiStatus(`Connected: ${JSON.stringify(healthResponse)}`);
        }
      } catch (err) {
        if (isMounted) {
          setApiStatus(`Server wake failed: ${(err as Error).message}`);
        }
      }
    };

    initializeApp();

    const setupFcm = async () => {
      console.log('[FCM Setup] Requesting notification permission...');
      const granted = await requestNotificationPermission();
      if (!isMounted) {
        return;
      }

      console.log(`[FCM Setup] Permission ${granted ? 'GRANTED' : 'DENIED'}`);
      setPermissionStatus(granted ? 'Granted' : 'Denied');

      if (!granted) {
        setTokenPreview('Unavailable (permission denied)');
        return;
      }

      console.log('[FCM Setup] Fetching FCM token...');
      const token = await getFcmToken();
      if (!isMounted) {
        return;
      }

      if (!token) {
        console.error('[FCM Setup] Failed to fetch token');
        setTokenPreview('Unavailable (failed to fetch token)');
        return;
      }

      console.log(`[FCM Setup] Token received: ${token.slice(0, 20)}...`);
      const preview = `${token.slice(0, 14)}...${token.slice(-8)}`;

      try {
        console.log('[FCM Setup] Sending token to server...');
        await sendToken(token);
        console.log('[FCM Setup] Token sent successfully');
      } catch (error) {
        console.error('[FCM Setup] Failed to send token:', error);
        if (isMounted) {
          setApiStatus('FCM token could not be sent to server.');
        }
      }

      setTokenPreview(preview);
    };

    setupFcm();

    const unsubscribeForeground = onForegroundFcmMessage(payload => {
      console.log('[App] Foreground FCM message received:', payload);
      const title = payload.title ?? 'Notification';
      const body = payload.body ?? 'You have a new message';
      setLastForegroundMessage(`${title}: ${body}`);
      
      setBannerTitle(title);
      setBannerMessage(body);
      setBannerVisible(true);
      console.log('[App] Banner displayed for foreground notification');
    });

    return () => {
      isMounted = false;
      unsubscribeForeground();
    };
  }, []);

  const handleFetchIncidents = async () => {
    setLoading(true);
    try {
      setApiStatus('Fetch incidents feature not yet implemented');
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
        <Banner
          visible={bannerVisible}
          title={bannerTitle}
          message={bannerMessage}
          variant="info"
          onDismiss={() => setBannerVisible(false)}
          autoDismiss={true}
          autoDismissDelay={5000}
        />
        {currentScreen === 'login' ? (
          <LoginScreen onBack={() => setCurrentScreen('home')} />
        ) : (
          <View style={styles.content}>
            <Text variant="2xl" weight="bold" color="text.primary" align="center">
              Donki-Wonki App Base
            </Text>
            <Text variant="sm" color="text.secondary" align="center">
              API Status: {apiStatus}
            </Text>

            <Button
              label="Go To Login"
              onPress={() => setCurrentScreen('login')}
              variant="secondary"
              style={styles.buttonSpacing}
            />

            <Button
              label="Fetch Incidents"
              onPress={handleFetchIncidents}
              loading={loading}
              style={styles.buttonSpacing}
            />

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
        )}
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
