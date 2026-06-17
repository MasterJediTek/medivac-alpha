 * MediVac One - Push Notifications Service
 * Real-time notification system for critical alerts, warnings, and information
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification Categories
export type NotificationCategory = 'critical' | 'warning' | 'info' | 'message' | 'task' | 'appointment';

export interface MediVacNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  critical: boolean;
  warning: boolean;
  info: boolean;
  message: boolean;
  task: boolean;
  appointment: boolean;
  sound: boolean;
  vibration: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

const STORAGE_KEYS = {
  PUSH_TOKEN: 'medivac_push_token',
  PREFERENCES: 'medivac_notification_preferences',
  HISTORY: 'medivac_notification_history',
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  critical: true,
  warning: true,
  info: true,
  message: true,
  task: true,
  appointment: true,
  sound: true,
  vibration: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const category = notification.request.content.data?.category as NotificationCategory;
    const preferences = await getNotificationPreferences();
    
    // Always show critical notifications
    if (category === 'critical') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    }
    
    // Check quiet hours
    if (preferences.quietHoursEnabled && isQuietHours(preferences)) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
        shouldShowBanner: false,
        shouldShowList: true,
      };
    }
    
    const shouldShow = preferences.enabled && preferences[category];
    return {
      shouldShowAlert: shouldShow,
      shouldPlaySound: preferences.sound && shouldShow,
      shouldSetBadge: true,
      shouldShowBanner: shouldShow,
      shouldShowList: true,
    };
  },
});

function isQuietHours(preferences: NotificationPreferences): boolean {