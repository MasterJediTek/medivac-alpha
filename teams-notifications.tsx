/**
 * Teams Notifications Screen
 * Microsoft Teams integration for CI/CD build notifications
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import cicdTeamsNotificationService, {
  type TeamsChannel,
  type TeamsNotification,
  type TeamsAnalytics,
  type BuildStatus,
} from '@/lib/services/cicd-teams-notification-service';

type TabType = 'channels' | 'history' | 'analytics';

export default function TeamsNotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('channels');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [channels, setChannels] = useState<TeamsChannel[]>([]);
  const [notifications, setNotifications] = useState<TeamsNotification[]>([]);
  const [analytics, setAnalytics] = useState<TeamsAnalytics | null>(null);

  const loadData = useCallback(async () => {
    try {
      await cicdTeamsNotificationService.initialize();
      const [channelsData, notificationsData, analyticsData] = await Promise.all([
        cicdTeamsNotificationService.getChannels(),
        cicdTeamsNotificationService.getNotifications(),
        cicdTeamsNotificationService.getAnalytics(),
      ]);

      setChannels(channelsData);
      setNotifications(notificationsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load Teams notification data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleTestChannel = async (channelId: string) => {
    const result = await cicdTeamsNotificationService.testChannel(channelId);
    if (result.success) {
      Alert.alert('Success', 'Test notification sent successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to send test notification');
    }
  };

  const handleToggleChannel = async (channelId: string, isActive: boolean) => {
    await cicdTeamsNotificationService.updateChannel(channelId, { isActive: !isActive });
    loadData();
  };

  const handleRetryFailed = async () => {
    const result = await cicdTeamsNotificationService.retryFailedNotifications();
    Alert.alert(
      'Retry Complete',
      `Retried: ${result.retried}\nSucceeded: ${result.succeeded}\nFailed: ${result.failed}`
    );
    loadData();
  };

  const handleSendTestBuild = async () => {
    const notifications = await cicdTeamsNotificationService.sendBuildNotification(
      `build_test_${Date.now()}`,
      'ready',
      {
        version: '1.0.0',
        buildNumber: 42,
        platform: 'ios',
        environment: 'staging',
        branch: 'main',
        commitMessage: 'Test build notification',
        duration: 180,
        testResults: { passed: 150, failed: 0, total: 150 },
      }
    );
    Alert.alert('Success', `Sent ${notifications.length} notifications`);
    loadData();
  };

  const getStatusIcon = (status: BuildStatus): string => {
    const icons: Record<BuildStatus, string> = {
      queued: '⏳',
      building: '🔨',
      testing: '🧪',
      uploading: '📤',
      ready: '✅',
      failed: '❌',
      cancelled: '⚠️',
    };
    return icons[status] || '📋';
  };

  const getStatusColor = (status: BuildStatus): string => {
    switch (status) {
      case 'ready':
        return colors.success;
      case 'failed':
        return colors.error;
      case 'cancelled':
        return colors.warning;
      case 'building':
      case 'testing':
      case 'uploading':
        return colors.primary;
      default:
        return colors.muted;
    }
  };

  const getDeliveryStatusColor = (status: string): string => {
    switch (status) {
      case 'sent':
        return colors.success;
      case 'failed':
        return colors.error;
      case 'retrying':
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  const renderTabs = () => (
    <View className="flex-row gap-2 mb-4">
      {(['channels', 'history', 'analytics'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-3 rounded-xl items-center ${activeTab === tab ? 'bg-primary' : 'bg-surface'}`}
        >
          <Text className={`font-medium capitalize ${activeTab === tab ? 'text-white' : 'text-foreground'}`}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChannels = () => (
    <View className="gap-4">
      {/* Quick Actions */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={handleSendTestBuild}
          className="flex-1 bg-primary py-3 rounded-xl items-center"
        >
          <Text className="text-white font-medium">Send Test Build</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRetryFailed}
          className="flex-1 bg-surface py-3 rounded-xl items-center border border-border"
        >
          <Text className="text-foreground font-medium">Retry Failed</Text>
        </TouchableOpacity>
      </View>

      {/* Channels List */}
      {channels.map((channel) => (
        <View key={channel.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-semibold text-foreground">{channel.name}</Text>
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: channel.isActive ? colors.success : colors.muted }}
                />
              </View>
              <Text className="text-sm text-muted">{channel.teamName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleToggleChannel(channel.id, channel.isActive)}
              className={`px-3 py-1 rounded-full ${channel.isActive ? 'bg-success/20' : 'bg-muted/20'}`}
            >
              <Text className={channel.isActive ? 'text-success' : 'text-muted'}>
                {channel.isActive ? 'Active' : 'Inactive'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notify On */}
          <View className="mb-3">
            <Text className="text-sm text-muted mb-2">Notify on:</Text>
            <View className="flex-row flex-wrap gap-2">
              {channel.notifyOn.map((status) => (
                <View
                  key={status}
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: getStatusColor(status) + '20' }}
                >
                  <Text className="text-xs capitalize" style={{ color: getStatusColor(status) }}>
                    {getStatusIcon(status)} {status}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Mention Users */}
          {channel.mentionOnFailure && channel.mentionUsers.length > 0 && (
            <View className="mb-3">
              <Text className="text-sm text-muted mb-2">Mention on failure:</Text>
              <View className="flex-row flex-wrap gap-2">
                {channel.mentionUsers.map((user) => (
                  <View key={user} className="px-2 py-1 bg-error/10 rounded">
                    <Text className="text-xs text-error">@{user.split('@')[0]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          <View className="flex-row gap-2 pt-3 border-t border-border">
            <TouchableOpacity
              onPress={() => handleTestChannel(channel.id)}
              className="flex-1 py-2 bg-primary/10 rounded-lg items-center"
            >
              <Text className="text-primary font-medium">Test</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-2 bg-surface border border-border rounded-lg items-center"
            >
              <Text className="text-foreground">Configure</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderHistory = () => (
    <View className="gap-4">
      {notifications.length > 0 ? (
        notifications.slice(0, 20).map((notification) => (
          <View key={notification.id} className="bg-surface rounded-xl p-4">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-row items-center gap-2 flex-1">
                <Text className="text-xl">{getStatusIcon(notification.status)}</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-medium" numberOfLines={1}>
                    {notification.title}
                  </Text>
                  <Text className="text-sm text-muted" numberOfLines={1}>
                    {notification.message}
                  </Text>
                </View>
              </View>
              <View
                className="px-2 py-1 rounded"
                style={{ backgroundColor: getDeliveryStatusColor(notification.deliveryStatus) + '20' }}
              >
                <Text
                  className="text-xs capitalize"
                  style={{ color: getDeliveryStatusColor(notification.deliveryStatus) }}
                >
                  {notification.deliveryStatus}
                </Text>
              </View>
            </View>

            {/* Facts */}
            <View className="flex-row flex-wrap gap-2 mb-2">
              {notification.facts.slice(0, 4).map((fact, index) => (
                <View key={index} className="px-2 py-1 bg-background rounded">
                  <Text className="text-xs text-muted">
                    {fact.name}: <Text className="text-foreground">{fact.value}</Text>
                  </Text>
                </View>
              ))}
            </View>

            {/* Mentions */}
            {notification.mentions.length > 0 && (
              <View className="flex-row flex-wrap gap-1 mb-2">
                {notification.mentions.map((mention) => (
                  <Text key={mention} className="text-xs text-primary">@{mention.split('@')[0]}</Text>
                ))}
              </View>
            )}

            {/* Timestamp */}
            <Text className="text-xs text-muted">
              {new Date(notification.sentAt).toLocaleString()}
              {notification.retryCount > 0 && ` • ${notification.retryCount} retries`}
            </Text>

            {notification.errorMessage && (
              <Text className="text-xs text-error mt-1">{notification.errorMessage}</Text>
            )}
          </View>
        ))
      ) : (
        <View className="bg-surface rounded-xl p-8 items-center">
          <Text className="text-4xl mb-3">📭</Text>
          <Text className="text-lg font-semibold text-foreground">No Notifications</Text>
          <Text className="text-muted text-center">No notifications have been sent yet</Text>
        </View>
      )}
    </View>
  );

  const renderAnalytics = () => (
    <View className="gap-4">
      {analytics && (
        <>
          {/* Summary Stats */}
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-foreground">{analytics.totalNotifications}</Text>
              <Text className="text-sm text-muted">Total Sent</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-success">{analytics.successfulDeliveries}</Text>
              <Text className="text-sm text-muted">Delivered</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-error">{analytics.failedDeliveries}</Text>
              <Text className="text-sm text-muted">Failed</Text>
            </View>
            <View className="flex-1 min-w-[140px] bg-surface rounded-xl p-4">
              <Text className="text-3xl font-bold text-primary">{analytics.deliveryRate.toFixed(1)}%</Text>
              <Text className="text-sm text-muted">Success Rate</Text>
            </View>
          </View>

          {/* By Status */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">By Build Status</Text>
            <View className="gap-3">
              {Object.entries(analytics.byStatus)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <View
                    key={status}
                    className="flex-row items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-lg">{getStatusIcon(status as BuildStatus)}</Text>
                      <Text className="text-foreground capitalize">{status}</Text>
                    </View>
                    <Text className="text-primary font-medium">{count}</Text>
                  </View>
                ))}
            </View>
          </View>

          {/* Most Active Channels */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Most Active Channels</Text>
            {analytics.mostActiveChannels.length > 0 ? (
              <View className="gap-3">
                {analytics.mostActiveChannels.map((channel, index) => (
                  <View
                    key={channel.channelId}
                    className="flex-row items-center justify-between p-3 bg-background rounded-lg"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center">
                        <Text className="text-primary font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-foreground font-medium">{channel.name}</Text>
                    </View>
                    <Text className="text-muted">{channel.count} notifications</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-muted text-center py-4">No channel activity yet</Text>
            )}
          </View>

          {/* Performance */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Performance</Text>
            <View className="flex-row items-center justify-between p-3 bg-background rounded-lg">
              <Text className="text-foreground">Average Delivery Time</Text>
              <Text className="text-primary font-medium">{analytics.averageDeliveryTime}ms</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading Teams notifications...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-bold text-foreground">Teams Notifications</Text>
              <Text className="text-muted">CI/CD Build Alerts</Text>
            </View>
          </View>
          <View className="bg-[#6264A7] px-3 py-1 rounded-lg">
            <Text className="text-white text-sm font-medium">Teams</Text>
          </View>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View className="pb-8">
          {activeTab === 'channels' && renderChannels()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'analytics' && renderAnalytics()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
