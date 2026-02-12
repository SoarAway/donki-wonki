import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

export {auth, firestore, messaging};

export async function requestNotificationPermission(): Promise<boolean> {
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
    callback({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
    });
  });
}
