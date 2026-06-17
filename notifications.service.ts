import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Notifications Service
 * Manages push notifications and in-app alerts
 */

export interface NotificationPayload {
  type: 'appointment' | 'alert' | 'message' | 'reminder' | 'result';
  title: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

export class NotificationsService {
  private static instance: NotificationsService;
  private expoPushToken: string | null = null;
  private notificationListeners: Set<(notification: LocalNotification) => void> = new Set();
  private localNotifications: LocalNotification[] = [];

  private constructor() {
    this.initializeNotifications();
  }

  static getInstance(): NotificationsService {
    if (!NotificationsService.instance) {
      NotificationsService.instance = new NotificationsService();
    }
    return NotificationsService.instance;
  }

  /**
   * Initialize notifications
   */
  private async initializeNotifications(): Promise<void> {
    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          };
        },
      });

      // Register for push notifications
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Failed to get push notification permissions');
          return;
        }

        // Get Expo push token
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });

        this.expoPushToken = token.data;

        // Register token with backend
        await this.registerPushToken(token.data);
      }

      // Listen for notifications
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      this.handleNotificationReceived(notification);
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener((response) => {
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification received
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const payload = notification.request.content.data as NotificationPayload;

    const localNotification: LocalNotification = {
      id: notification.request.identifier,
      title: notification.request.content.title || '',
      body: notification.request.content.body || '',
      type: payload.type || 'alert',
      timestamp: Date.now(),
      read: false,
      actionUrl: payload.actionUrl,
    };

    this.localNotifications.push(localNotification);
    this.notifyListeners(localNotification);
  }

  /**
   * Handle notification response (tap)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const payload = response.notification.request.content.data as NotificationPayload;

    if (payload.actionUrl) {
      // Navigate to action URL
      // TODO: Implement navigation
    }

    this.markNotificationAsRead(response.notification.request.identifier);
  }

  /**
   * Register push token with backend
   */
  private async registerPushToken(token: string): Promise<void> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ expoPushToken: token }),
      });

      if (!response.ok) {
        throw new Error('Failed to register push token');
      }
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(payload: NotificationPayload): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          sound: 'default',
          badge: 1,
        },
        trigger: {
          seconds: 1,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      throw error;
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(
    payload: NotificationPayload,
    delaySeconds: number
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          sound: 'default',
          badge: 1,
        },
        trigger: {
          seconds: delaySeconds,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Cancel notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Get all notifications
   */
  getNotifications(): LocalNotification[] {
    return this.localNotifications;
  }

  /**
   * Get unread notifications count
   */
  getUnreadCount(): number {
    return this.localNotifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    const notification = this.localNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): void {
    this.localNotifications = [];
  }

  /**
   * Subscribe to notifications
   */
  subscribe(listener: (notification: LocalNotification) => void): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(notification: LocalNotification): void {
    this.notificationListeners.forEach(listener => listener(notification));
  }

  /**
   * Get access token
   */
  private getAccessToken(): string {
    // TODO: Get from auth service
    return '';
  }

  /**
   * Get Expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}
