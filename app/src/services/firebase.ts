import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';

export {auth, firestore, messaging};

/**
 * Create Android notification channel (required for Android 8.0+)
 * Without this, notifications will NOT be displayed on Android
 */
export async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  // Create notification channel first (Android 8.0+ requirement)
  await createNotificationChannel();

  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function getFcmToken(): Promise<string | null> {
  try {
    return await messaging().getToken();
  } catch {
    return null;
  }
}

export function onForegroundFcmMessage(
  callback: (payload: {title?: string; body?: string}) => void,
): () => void {
  return messaging().onMessage(async remoteMessage => {
    console.log('[FCM Foreground] Message received:', JSON.stringify(remoteMessage));

    const title = remoteMessage.notification?.title;
    const body = remoteMessage.notification?.body;

    callback({title, body});

    try {
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      await notifee.displayNotification({
        title: title || 'Notification',
        body: body || 'You have a new message',
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      });

      console.log('[FCM Foreground] Notification displayed in system tray');
    } catch (error) {
      console.error('[FCM Foreground] Failed to display notification:', error);
    }
  });
}
