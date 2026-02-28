import React from 'react';
import { Alert, StatusBar, useColorScheme } from 'react-native';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  getFcmToken,
  onForegroundFcmMessage,
  requestNotificationPermission,
} from './src/services/firebase';
import { checkHealth, sendToken } from './src/services/api/apiEndpoints';
import { setErrorCallback, setLoadingCallback, wakeServer } from './src/services/api/apiClient';
import { Banner } from './src/components/atoms/Banner';
import { LoadingOverlay } from './src/components/molecules/LoadingOverlay';
import LoginScreen from './src/screens/LoginScreen';
import Register from './src/screens/Register';
import { HomeScreen } from './src/screens/HomeScreen';
import Community from './src/screens/Community';
import RouteManagement from './src/screens/RouteManagement';
import Reporting from './src/screens/CommunityReport';
import Feedback from './src/screens/Feedback';
import AddRoute from './src/screens/AddRoute';
import AddRoute_2 from './src/screens/AddRoute2';
import EditRoute from './src/screens/EditRoute';
import RouteStatus from './src/screens/RouteStatus';
import { clearUserId, getUserId, saveUserId } from './src/services/authStorage';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type MainTabParamList = {
  Home: undefined;
  RouteManagement: undefined;
  Community: undefined;
  Reporting: undefined;
  Feedback: undefined;
};

type AppStackParamList = {
  MainTabs: undefined;
  AddRoute: undefined;
  AddRoute2 : undefined; 
  EditRoute: {routeId: string};
  NotificationDetail: undefined; 
  RouteManagement: undefined;
  RouteStatus: undefined;
};

type RootParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  AddRoute: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const linking: LinkingOptions<RootParamList> = {
  prefixes: ['donkiwonki://', 'https://prod-on-the-way.onrender.com'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      MainTabs: {
        screens: {
          Home: 'home',
          RouteManagement: 'routes',
          Community: 'community',
          Reporting: 'report',
          Feedback: 'feedback',
        },
      },
      AddRoute: 'add-route',
    },
  },
};

interface MainTabsNavigatorProps {
  userEmail: string;
  onLogout: () => void;
}

const MainTabsNavigator: React.FC<MainTabsNavigatorProps> = ({
  userEmail,
  onLogout,
}) => (
  <MainTabs.Navigator
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true,
      tabBarStyle: { display: 'none' }
    }}
  >
    <MainTabs.Screen name="Home" options={{ title: 'Home' }}>
      {({ navigation }) => (
        <HomeScreen
          userEmail={userEmail}
          onGoToRouteStatus={() => navigation.navigate('RouteStatus')}
          onGoToRoutes={() => navigation.navigate('RouteManagement')}
          onGoToCommunity={() => navigation.navigate('Community')}
          onLogout={onLogout}
        />
      )}
    </MainTabs.Screen>
    <MainTabs.Screen
      name="RouteManagement"
      component={RouteManagement}
      options={{ title: 'Routes' }}
    />
    <MainTabs.Screen name="Community" component={Community} options={{ title: 'Community' }} />
    <MainTabs.Screen name="Reporting" component={Reporting} options={{ title: 'Report' }} />
    <MainTabs.Screen name="Feedback" component={Feedback} options={{ title: 'Feedback' }} />
  </MainTabs.Navigator>
);

interface AppStackNavigatorProps extends MainTabsNavigatorProps {}

const AppStackNavigator: React.FC<AppStackNavigatorProps> = props => (
  <AppStack.Navigator screenOptions={{ headerShown: false }}>
    <AppStack.Screen name="MainTabs">
      {() => <MainTabsNavigator {...props} />}
    </AppStack.Screen>
    <AppStack.Screen name="AddRoute" component={AddRoute} />
    <AppStack.Screen name="AddRoute2" component={AddRoute_2} />
    <AppStack.Screen name="EditRoute" component={EditRoute} />
    <AppStack.Screen name="RouteStatus" component={RouteStatus} />
  </AppStack.Navigator>
);

interface AuthStackNavigatorProps {
  onLoginSuccess: (userId: string) => void;
}

const AuthStackNavigator: React.FC<AuthStackNavigatorProps> = ({ onLoginSuccess }) => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login">
      {({ navigation }) => (
        <LoginScreen
          onLoginSuccess={onLoginSuccess}
          onGoToRegister={() => navigation.navigate('Register')}
        />
      )}
    </AuthStack.Screen>
    <AuthStack.Screen name="Register">
      {({ navigation }) => (
        <Register
          onRegisterSuccess={onLoginSuccess}
          onBackToLogin={() => navigation.navigate('Login')}
        />
      )}
    </AuthStack.Screen>
  </AuthStack.Navigator>
);

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [, setPermissionStatus] = React.useState('Checking...');
  const [, setTokenPreview] = React.useState('Pending...');
  const [, setLastForegroundMessage] = React.useState('No message yet.');
  const [, setApiStatus] = React.useState('Waking server...');
  const [globalLoading, setGlobalLoading] = React.useState(false);
  const [bannerVisible, setBannerVisible] = React.useState(false);
  const [bannerTitle, setBannerTitle] = React.useState('');
  const [bannerMessage, setBannerMessage] = React.useState('');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [authReady, setAuthReady] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

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

    const restoreAuthState = async () => {
      try {
        const storedUserId = await getUserId();
        if (!isMounted) {
          return;
        }
        if (storedUserId) {
          setUserId(storedUserId);
          setIsAuthenticated(true);
        }
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    };

    const initializeApp = async () => {
      try {
        setApiStatus('Waking server (may take up to 60s)...');
        await wakeServer();
        if (!isMounted) return;

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

    const setupFcm = async () => {
      const granted = await requestNotificationPermission();
      if (!isMounted) return;

      setPermissionStatus(granted ? 'Granted' : 'Denied');
      if (!granted) {
        setTokenPreview('Unavailable (permission denied)');
        return;
      }

      const token = await getFcmToken();
      if (!isMounted) return;

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

    restoreAuthState();
    initializeApp();
    setupFcm();

    const unsubscribeForeground = onForegroundFcmMessage(payload => {
      const title = payload.title ?? 'Notification';
      const body = payload.body ?? 'You have a new message';
      setLastForegroundMessage(`${title}: ${body}`);
      setBannerTitle(title);
      setBannerMessage(body);
      setBannerVisible(false);
    });

    return () => {
      isMounted = false;
      unsubscribeForeground();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer linking={linking}>
        {!authReady ? null : isAuthenticated ? (
          <AppStackNavigator
            userEmail={userId ?? ''}
            onLogout={async () => {
              await clearUserId();
              setUserId(null);
              setIsAuthenticated(false);
            }}
          />
        ) : (
          <AuthStackNavigator
            onLoginSuccess={async nextUserId => {
              await saveUserId(nextUserId);
              setUserId(nextUserId);
              setIsAuthenticated(true);
            }}
          />
        )}
      </NavigationContainer>

      <Banner
        visible={bannerVisible}
        title={bannerTitle}
        message={bannerMessage}
        variant="info"
        onDismiss={() => setBannerVisible(false)}
        autoDismiss={true}
        autoDismissDelay={5000}
      />
      <LoadingOverlay
        visible={globalLoading || !authReady}
        message={!authReady ? 'Restoring session...' : `Loading${userId ? ` (${userId})` : ''}...`}
      />
    </>
  );
}

export default App;
