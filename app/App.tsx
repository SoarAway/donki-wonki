import React from 'react';
import {StatusBar, StyleSheet, Text, useColorScheme, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {
  getFcmToken,
  onForegroundFcmMessage,
  requestNotificationPermission,
} from './src/services/firebase';
import {checkHealth, fetchIncidents} from './src/services/api/incidentsApi';
import {ApiButton} from './src/components/atoms/ApiButton';
import {Incident} from './src/services/api/types';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [permissionStatus, setPermissionStatus] = React.useState('Checking...');
  const [tokenPreview, setTokenPreview] = React.useState('Pending...');
  const [lastForegroundMessage, setLastForegroundMessage] = React.useState(
    'No message yet.',
  );
  const [apiStatus, setApiStatus] = React.useState('Checking API...');
  const [incidents, setIncidents] = React.useState<Incident[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    // Check API health
    checkHealth()
      .then(res => {
        if (isMounted) {
          setApiStatus(`Connected: ${res.status}`);
        }
      })
      .catch(err => {
        if (isMounted) {
          setApiStatus(`API Error: ${err.message}`);
        }
      });

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
          <Text style={styles.title}>Donki-Wonki App Base</Text>
          <Text style={styles.subtitle}>API Status: {apiStatus}</Text>

          <ApiButton
            title="Fetch Incidents"
            onPressApi={handleFetchIncidents}
            loading={loading}
            style={styles.buttonSpacing}
          />

          {incidents.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>Incidents:</Text>
              {incidents.map(inc => (
                <Text key={inc.id} style={styles.itemText}>
                  • {inc.line} ({inc.station}): {inc.description}
                </Text>
              ))}
            </View>
          )}

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
    gap: 16,
  },
  buttonSpacing: {
    marginVertical: 12,
  },
  listContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  itemText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
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
