import { useState, useEffect, useCallback } from "react";
import { Text, View, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import {
  getNotificationHistory,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotificationHistory,
  MediVacNotification,
  NotificationCategory,
} from "@/lib/notifications";

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [notifications, setNotifications] = useState<MediVacNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const history = await getNotificationHistory();
      setNotifications(history);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = async () => {
    await clearNotificationHistory();
    setNotifications([]);
  };

  const getCategoryColor = (category: NotificationCategory): string => {
    switch (category) {
      case 'critical': return colors.error;
      case 'warning': return colors.warning;
      case 'info': return colors.primary;
      case 'message': return colors.success;
      case 'task': return '#8B5CF6';
      case 'appointment': return '#06B6D4';
      default: return colors.muted;
    }
  };

  const getCategoryIcon = (category: NotificationCategory): any => {
    switch (category) {
      case 'critical': return 'xmark.circle.fill';
      case 'warning': return 'exclamationmark.triangle.fill';
      case 'info': return 'info.circle.fill';
      case 'message': return 'message.fill';
      case 'task': return 'checklist';
      case 'appointment': return 'calendar';
      default: return 'bell.fill';
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.category === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotification = ({ item }: { item: MediVacNotification }) => {
    const categoryColor = getCategoryColor(item.category);
    const categoryIcon = getCategoryIcon(item.category);

    return (
      <TouchableOpacity
        className="bg-surface rounded-xl p-4 mb-3"
        style={{
          borderLeftWidth: 4,
          borderLeftColor: categoryColor,
          opacity: item.read ? 0.7 : 1,
        }}
        onPress={() => handleMarkAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-start gap-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: categoryColor + '20' }}
          >
            <IconSymbol name={categoryIcon} size={20} color={categoryColor} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="text-foreground font-semibold flex-1" numberOfLines={1}>
                {item.title}
              </Text>
              {!item.read && (
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
              )}
            </View>
            <Text className="text-muted text-sm" numberOfLines={2}>
              {item.body}
            </Text>
            <Text className="text-muted text-xs mt-2">
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterChip = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: NotificationCategory | 'all';
    color?: string;
  }) => (
    <TouchableOpacity
      className="px-4 py-2 rounded-full mr-2"
      style={{
        backgroundColor: filter === value ? (color || colors.primary) : colors.surface,
        borderWidth: filter === value ? 0 : 1,
        borderColor: colors.border,
      }}
      onPress={() => setFilter(value)}
      activeOpacity={0.7}
    >
      <Text
        style={{
          color: filter === value ? '#FFFFFF' : colors.foreground,
          fontSize: 13,
          fontWeight: filter === value ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <View className="flex-row items-center gap-3 mb-4">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">Notifications</Text>
            <Text className="text-muted text-sm">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.surface }}
            onPress={() => router.push('/notification-settings' as any)}
            activeOpacity={0.7}
          >
            <IconSymbol name="gear" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <FlatList
          horizontal
          data={[
            { label: 'All', value: 'all' as const },
            { label: 'Critical', value: 'critical' as const, color: colors.error },
            { label: 'Warnings', value: 'warning' as const, color: colors.warning },
            { label: 'Messages', value: 'message' as const, color: colors.success },
            { label: 'Tasks', value: 'task' as const, color: '#8B5CF6' },
            { label: 'Appointments', value: 'appointment' as const, color: '#06B6D4' },
          ]}
          renderItem={({ item }) => (
            <FilterChip label={item.label} value={item.value} color={item.color} />
          )}
          keyExtractor={item => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        />
      </View>

      {/* Actions */}
      {notifications.length > 0 && (
        <View className="px-5 flex-row justify-between mb-3">
          <TouchableOpacity onPress={handleMarkAllAsRead} activeOpacity={0.7}>
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
              Mark All Read
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
            <Text style={{ color: colors.error, fontSize: 14, fontWeight: '600' }}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.surface }}
            >
              <IconSymbol name="bell.fill" size={40} color={colors.muted} />
            </View>
            <Text className="text-foreground font-semibold text-lg mb-2">
              No Notifications
            </Text>
            <Text className="text-muted text-center">
              {filter === 'all'
                ? "You're all caught up!"
                : `No ${filter} notifications`}
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
