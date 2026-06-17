import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';

/**
 * Notifications Center Screen
 */
export default function NotificationsCenterScreen() {
  const router = useRouter();
  const colors = useColors();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      // TODO: Load from notifications service
      // Mock data for now
      setNotifications([
        {
          id: '1',
          type: 'appointment',
          title: 'Appointment Reminder',
          body: 'Your appointment with Dr. Sarah Johnson is tomorrow at 2:30 PM',
          timestamp: Date.now() - 3600000,
          read: false,
          icon: '📅',
        },
        {
          id: '2',
          type: 'alert',
          title: 'Lab Results Available',
          body: 'Your recent lab results are now available for review',
          timestamp: Date.now() - 7200000,
          read: false,
          icon: '🧪',
        },
        {
          id: '3',
          type: 'message',
          title: 'New Message',
          body: 'Dr. Michael Chen sent you a message',
          timestamp: Date.now() - 86400000,
          read: true,
          icon: '💬',
        },
      ]);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="py-6 px-6 gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-foreground">Notifications</Text>
              {unreadCount > 0 && (
                <View className="mt-1 px-2 py-1 bg-error rounded-full">
                  <Text className="text-xs font-semibold text-white">
                    {unreadCount} unread
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center"
            >
              <Text className="text-lg">✕</Text>
            </Pressable>
          </View>

          {/* Filter Tabs */}
          <View className="flex-row gap-2 bg-surface p-1 rounded-lg">
            {['all', 'unread'].map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setFilter(tab as any)}
                style={({ pressed }) => [
                  {
                    backgroundColor: filter === tab ? colors.primary : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                className="flex-1 py-2 px-3 rounded-md items-center"
              >
                <Text
                  className={`text-xs font-semibold ${
                    filter === tab ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <View className="py-12 items-center gap-2">
              <Text className="text-3xl">🔔</Text>
              <Text className="text-lg text-muted">No notifications</Text>
              <Text className="text-sm text-muted">
                {filter === 'unread' ? 'You\'re all caught up!' : 'Check back later'}
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  colors={colors}
                  onPress={() => handleMarkAsRead(notification.id)}
                />
              ))}
            </View>
          )}

          {/* Clear All Button */}
          {filteredNotifications.length > 0 && (
            <Pressable
              onPress={handleClearAll}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              className="py-3 px-4 rounded-lg items-center mt-4"
            >
              <Text className="text-foreground font-semibold">Clear All</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * Notification Item Component
 */
function NotificationItem({
  notification,
  colors,
  onPress,
}: {
  notification: any;
  colors: any;
  onPress: () => void;
}) {
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: notification.read ? colors.surface : colors.primary + '10',
          borderColor: notification.read ? colors.border : colors.primary,
          borderWidth: 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      className="p-4 rounded-lg flex-row gap-3"
    >
      <View className="w-12 h-12 rounded-lg bg-primary/20 items-center justify-center">
        <Text className="text-2xl">{notification.icon}</Text>
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-start gap-2">
          <Text className="text-base font-semibold text-foreground flex-1">
            {notification.title}
          </Text>
          {!notification.read && (
            <View className="w-2 h-2 rounded-full bg-primary mt-1" />
          )}
        </View>
        <Text className="text-sm text-muted mt-1">{notification.body}</Text>
        <Text className="text-xs text-muted mt-2">{formatTime(notification.timestamp)}</Text>
      </View>
    </Pressable>
  );
}
