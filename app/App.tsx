import React from 'react';
import {StatusBar, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {
  getFcmToken,
  onForegroundFcmMessage,
  requestNotificationPermission,
} from './src/services/firebase';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [permissionStatus, setPermissionStatus] = React.useState('Checking...');
  const [tokenPreview, setTokenPreview] = React.useState('Pending...');
  const [lastForegroundMessage, setLastForegroundMessage] = React.useState(
    'No message yet.',
  );

  React.useEffect(() => {
    let isMounted = true;

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

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Donki-Wonki App Base</Text>
          <Text style={styles.subtitle}>FCM permission: {permissionStatus}</Text>
          <Text style={styles.subtitle}>FCM token: {tokenPreview}</Text>
          <Text style={styles.subtitle}>Last foreground message:</Text>
          <Text style={styles.message}>{lastForegroundMessage}</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F1C18',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#61584D',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: '#3A352F',
    textAlign: 'center',
  },
});

export default App;
