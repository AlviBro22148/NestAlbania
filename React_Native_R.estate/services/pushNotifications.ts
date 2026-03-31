import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '@/lib/axios-config';
import Constants from 'expo-constants';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
}

// Register for push notifications and get token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Must be a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = pushToken.data;
    console.log('Expo Push Token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  // Configure Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0061FF',
    });

    // Property alerts channel
    await Notifications.setNotificationChannelAsync('property-alerts', {
      name: 'Property Alerts',
      description: 'Notifications about property updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0061FF',
    });
  }

  return token;
}

// Send push token to backend for storage
export async function savePushTokenToServer(token: string): Promise<boolean> {
  try {
    await api.post('/api/notifications/push-token', {
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName || 'Unknown Device',
    });
    console.log('Push token saved to server');
    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
}

// Remove push token from backend (on logout)
export async function removePushTokenFromServer(token: string): Promise<boolean> {
  try {
    await api.delete('/api/notifications/push-token', {
      data: { token },
    });
    console.log('Push token removed from server');
    return true;
  } catch (error) {
    console.error('Error removing push token:', error);
    return false;
  }
}

// Schedule a local notification (for testing)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediate
  });
  return id;
}

// Get notification that launched the app
export async function getLastNotificationResponse() {
  return await Notifications.getLastNotificationResponseAsync();
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Set badge count
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}
