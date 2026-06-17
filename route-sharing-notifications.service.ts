/**
 * Route Sharing Notifications Service
 * Handles push notifications when routes are shared with users
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { livePushService } from './live-push.service';

export interface SharedRoute {
  id: string;
  routeId: string;
  routeName: string;
  sharedBy: string;
  sharedByUserId: string;
  sharedAt: string;
  distance: number;
  estimatedTime: number;
  startLocation: string;
  endLocation: string;
  importedAt?: string;
  isRead: boolean;
}

export interface RouteShareNotification {
  id: string;
  sharedRoute: SharedRoute;
  notificationSentAt: string;
  deviceToken: string;
  status: 'pending' | 'sent' | 'failed';
}

class RouteSharingNotificationsService {
  private readonly STORAGE_KEY = 'route_share_notifications';
  private readonly SHARED_ROUTES_KEY = 'shared_routes';
  private notifications: RouteShareNotification[] = [];
  private sharedRoutes: SharedRoute[] = [];

  async initialize(): Promise<void> {
    await this.loadNotifications();
    await this.loadSharedRoutes();
  }

  /**
   * Send notification when a route is shared with the user
   */
  async notifyRouteShared(sharedRoute: SharedRoute): Promise<void> {
    const notification: RouteShareNotification = {
      id: 'notif_' + Date.now(),
      sharedRoute,
      notificationSentAt: new Date().toISOString(),
      deviceToken: 'device_' + Math.random().toString(36).substr(2, 9),
      status: 'pending',
    };

    try {
      // Send push notification
      await livePushService.sendNotification({
        title: 'Route Shared',
        body: sharedRoute.sharedBy + ' shared "' + sharedRoute.routeName + '" with you',
        data: {
          type: 'route_shared',
          routeId: sharedRoute.routeId,
          sharedRouteId: sharedRoute.id,
        },
      });

      notification.status = 'sent';
    } catch (error) {
      console.error('[Route Share] Failed to send notification:', error);
      notification.status = 'failed';
    }

    this.notifications.push(notification);
    await this.saveNotifications();
  }

  /**
   * Record a shared route
   */
  async recordSharedRoute(sharedRoute: SharedRoute): Promise<void> {
    this.sharedRoutes.push(sharedRoute);
    await this.saveSharedRoutes();
    
    // Send notification
    await this.notifyRouteShared(sharedRoute);
  }

  /**
   * Import a shared route (one-tap import)
   */
  async importSharedRoute(sharedRouteId: string): Promise<SharedRoute | null> {
    const sharedRoute = this.sharedRoutes.find(r => r.id === sharedRouteId);
    
    if (!sharedRoute) {
      console.warn('[Route Share] Shared route not found:', sharedRouteId);
      return null;
    }

    // Mark as imported
    sharedRoute.importedAt = new Date().toISOString();
    
    // Mark notification as read
    const notification = this.notifications.find(n => n.sharedRoute.id === sharedRouteId);
    if (notification) {
      notification.sharedRoute.isRead = true;
    }

    await this.saveSharedRoutes();
    await this.saveNotifications();

    return sharedRoute;
  }

  /**
   * Get all shared routes
   */
  getSharedRoutes(): SharedRoute[] {
    return this.sharedRoutes;
  }

  /**
   * Get unread shared routes
   */
  getUnreadSharedRoutes(): SharedRoute[] {
    return this.sharedRoutes.filter(r => !r.isRead);
  }

  /**
   * Get all notifications
   */
  getNotifications(): RouteShareNotification[] {
    return this.notifications;
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): number {
    return this.sharedRoutes.filter(r => !r.isRead).length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(sharedRouteId: string): Promise<void> {
    const sharedRoute = this.sharedRoutes.find(r => r.id === sharedRouteId);
    if (sharedRoute) {
      sharedRoute.isRead = true;
      await this.saveSharedRoutes();
    }
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<void> {
    this.sharedRoutes.forEach(r => {
      r.isRead = true;
    });
    await this.saveSharedRoutes();
  }

  /**
   * Delete a shared route
   */
  async deleteSharedRoute(sharedRouteId: string): Promise<void> {
    this.sharedRoutes = this.sharedRoutes.filter(r => r.id !== sharedRouteId);
    this.notifications = this.notifications.filter(n => n.sharedRoute.id !== sharedRouteId);
    await this.saveSharedRoutes();
    await this.saveNotifications();
  }

  /**
   * Clear all shared routes and notifications
   */
  async clearAll(): Promise<void> {
    this.sharedRoutes = [];
    this.notifications = [];
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    await AsyncStorage.removeItem(this.SHARED_ROUTES_KEY);
  }

  private async loadNotifications(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.notifications = JSON.parse(data);
      }
    } catch (error) {
      console.error('[Route Share] Failed to load notifications:', error);
    }
  }

  private async saveNotifications(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('[Route Share] Failed to save notifications:', error);
    }
  }

  private async loadSharedRoutes(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.SHARED_ROUTES_KEY);
      if (data) {
        this.sharedRoutes = JSON.parse(data);
      }
    } catch (error) {
      console.error('[Route Share] Failed to load shared routes:', error);
    }
  }

  private async saveSharedRoutes(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SHARED_ROUTES_KEY, JSON.stringify(this.sharedRoutes));
    } catch (error) {
      console.error('[Route Share] Failed to save shared routes:', error);
    }
  }
}

export const routeSharingNotificationsService = new RouteSharingNotificationsService();
