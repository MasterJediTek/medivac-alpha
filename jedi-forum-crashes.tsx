/**
 * JEDI Forum Crash Reports Screen
 * View and manage crash reports posted to JEDI Masters Forum and High Council
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
import jediForumCrashService, {
  type ForumPost,
  type ForumConfig,
  type ForumAnalytics,
  type ForumType,
  type PostStatus,
  type CrashSeverity,
} from '@/lib/services/jedi-forum-crash-service';

type TabType = 'posts' | 'forums' | 'analytics';

export default function JEDIForumCrashesScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [configs, setConfigs] = useState<ForumConfig[]>([]);
  const [analytics, setAnalytics] = useState<ForumAnalytics | null>(null);
  const [selectedForum, setSelectedForum] = useState<ForumType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | 'all'>('all');

  const loadData = useCallback(async () => {
    try {
      const filter: { forumType?: ForumType; status?: PostStatus } = {};
      if (selectedForum !== 'all') filter.forumType = selectedForum;
      if (selectedStatus !== 'all') filter.status = selectedStatus;

      const [postsData, configsData, analyticsData] = await Promise.all([
        jediForumCrashService.getPosts(filter),
        jediForumCrashService.getConfigs(),
        jediForumCrashService.getAnalytics(),
      ]);

      setPosts(postsData);
      setConfigs(configsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load forum data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedForum, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleAcknowledge = async (postId: string) => {
    const post = await jediForumCrashService.acknowledgePost(postId, 'admin@medivac.one');
    if (post) {
      Alert.alert('Acknowledged', 'Post has been acknowledged.');
      loadData();
    }
  };

  const handleResolve = async (postId: string) => {
    Alert.prompt(
      'Resolve Issue',
      'Enter resolution notes:',
      async (resolution) => {
        if (resolution) {
          const post = await jediForumCrashService.resolvePost(postId, 'admin@medivac.one', resolution);
          if (post) {
            Alert.alert('Resolved', 'Issue has been marked as resolved.');
            loadData();
          }
        }
      },
      'plain-text'
    );
  };

  const getForumIcon = (forumType: ForumType): string => {
    switch (forumType) {
      case 'high_council':
        return '👑';
      case 'jedi_masters':
        return '⚔️';
      case 'engineering':
        return '⚙️';
      case 'clinical':
        return '🏥';
      case 'security':
        return '🔒';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status: PostStatus): string => {
    switch (status) {
      case 'resolved':
        return colors.success;
      case 'acknowledged':
      case 'investigating':
        return colors.warning;
      case 'pending':
      case 'posted':
        return colors.primary;
      case 'failed':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return colors.error;
      case 'high':
        return '#F97316';
      case 'normal':
        return colors.primary;
      case 'low':
        return colors.muted;
      default:
        return colors.foreground;
    }
  };

  const renderTabs = () => (
    <View className="flex-row gap-2 mb-4">
      {(['posts', 'forums', 'analytics'] as TabType[]).map((tab) => (
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

  const renderFilters = () => (
    <View className="gap-2 mb-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {(['all', 'high_council', 'jedi_masters', 'engineering', 'clinical', 'security'] as const).map((forum) => (
            <TouchableOpacity
              key={forum}
              onPress={() => setSelectedForum(forum)}
              className={`px-3 py-1.5 rounded-lg ${selectedForum === forum ? 'bg-primary/20' : 'bg-surface'}`}
              style={selectedForum === forum ? { borderColor: colors.primary, borderWidth: 1 } : {}}
            >
              <Text className={`text-sm ${selectedForum === forum ? 'text-primary' : 'text-muted'}`}>
                {forum === 'all' ? 'All Forums' : `${getForumIcon(forum)} ${forum.replace(/_/g, ' ')}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {(['all', 'pending', 'posted', 'acknowledged', 'investigating', 'resolved'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg ${selectedStatus === status ? 'bg-primary/20' : 'bg-surface'}`}
              style={selectedStatus === status ? { borderColor: colors.primary, borderWidth: 1 } : {}}
            >
              <Text className={`text-sm capitalize ${selectedStatus === status ? 'text-primary' : 'text-muted'}`}>
                {status === 'all' ? 'All Status' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderPosts = () => (
    <View className="gap-4">
      {renderFilters()}
      
      {posts.length === 0 ? (
        <View className="bg-surface rounded-xl p-6 items-center">
          <Text className="text-4xl mb-4">📭</Text>
          <Text className="text-lg font-semibold text-foreground mb-2">No Posts Found</Text>
          <Text className="text-muted text-center">
            No crash reports match your current filters.
          </Text>
        </View>
      ) : (
        posts.map((post) => (
          <View key={post.id} className="bg-surface rounded-xl p-4">
            <View className="flex-row items-start justify-between mb-3">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-xl">{getForumIcon(post.forumType)}</Text>
                  <Text className="text-lg font-semibold text-foreground flex-1" numberOfLines={1}>
                    {post.title}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View
                    className="px-2 py-0.5 rounded"
                    style={{ backgroundColor: getStatusColor(post.status) + '20' }}
                  >
                    <Text className="text-xs font-medium capitalize" style={{ color: getStatusColor(post.status) }}>
                      {post.status}
                    </Text>
                  </View>
                  <View
                    className="px-2 py-0.5 rounded"
                    style={{ backgroundColor: getPriorityColor(post.priority) + '20' }}
                  >
                    <Text className="text-xs font-medium capitalize" style={{ color: getPriorityColor(post.priority) }}>
                      {post.priority}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <Text className="text-muted text-sm mb-3" numberOfLines={3}>
              {post.content.substring(0, 200)}...
            </Text>

            {/* Screenshots */}
            {post.screenshots.length > 0 && (
              <View className="flex-row gap-2 mb-3">
                <View className="px-2 py-1 bg-background rounded">
                  <Text className="text-xs text-muted">📸 {post.screenshots.length} screenshots</Text>
                </View>
              </View>
            )}

            {/* Meta */}
            <View className="flex-row flex-wrap gap-4 mb-3">
              <View>
                <Text className="text-foreground font-medium">{post.author}</Text>
                <Text className="text-xs text-muted">Author</Text>
              </View>
              <View>
                <Text className="text-foreground font-medium">{post.comments.length}</Text>
                <Text className="text-xs text-muted">Comments</Text>
              </View>
              <View>
                <Text className="text-foreground font-medium">{post.views}</Text>
                <Text className="text-xs text-muted">Views</Text>
              </View>
              {post.postedAt && (
                <View>
                  <Text className="text-foreground font-medium">
                    {new Date(post.postedAt).toLocaleDateString()}
                  </Text>
                  <Text className="text-xs text-muted">Posted</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View className="flex-row gap-2">
              {post.status === 'posted' && (
                <TouchableOpacity
                  onPress={() => handleAcknowledge(post.id)}
                  className="flex-1 bg-warning/20 py-2 rounded-lg items-center"
                >
                  <Text className="text-warning font-medium">Acknowledge</Text>
                </TouchableOpacity>
              )}
              {(post.status === 'acknowledged' || post.status === 'investigating') && (
                <TouchableOpacity
                  onPress={() => handleResolve(post.id)}
                  className="flex-1 bg-success/20 py-2 rounded-lg items-center"
                >
                  <Text className="text-success font-medium">Resolve</Text>
                </TouchableOpacity>
              )}
              {post.threadUrl && (
                <TouchableOpacity
                  onPress={() => Alert.alert('Thread URL', post.threadUrl)}
                  className="flex-1 bg-primary/20 py-2 rounded-lg items-center"
                >
                  <Text className="text-primary font-medium">View Thread</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderForums = () => (
    <View className="gap-4">
      {configs.map((config) => (
        <View key={config.forumType} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">{getForumIcon(config.forumType)}</Text>
              <View>
                <Text className="text-lg font-semibold text-foreground">{config.name}</Text>
                <Text className="text-sm text-muted">{config.description}</Text>
              </View>
            </View>
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.isActive ? colors.success : colors.error }}
            />
          </View>

          <View className="flex-row flex-wrap gap-2 mb-3">
            {config.autoPost && (
              <View className="px-2 py-1 bg-success/20 rounded">
                <Text className="text-xs text-success">Auto Post</Text>
              </View>
            )}
            {config.notifyOnPost && (
              <View className="px-2 py-1 bg-primary/20 rounded">
                <Text className="text-xs text-primary">Notify on Post</Text>
              </View>
            )}
            {config.notifyOnResolve && (
              <View className="px-2 py-1 bg-warning/20 rounded">
                <Text className="text-xs text-warning">Notify on Resolve</Text>
              </View>
            )}
          </View>

          <View className="bg-background rounded-lg p-3">
            <Text className="text-sm text-muted mb-1">Severity Threshold</Text>
            <Text className="text-foreground font-medium capitalize">{config.severityThreshold}</Text>
          </View>

          {config.moderators.length > 0 && (
            <View className="mt-3">
              <Text className="text-sm text-muted mb-2">Moderators</Text>
              <View className="flex-row flex-wrap gap-2">
                {config.moderators.map((mod) => (
                  <View key={mod} className="px-2 py-1 bg-background rounded">
                    <Text className="text-xs text-foreground">{mod}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderAnalytics = () => (
    <View className="gap-4">
      {analytics && (
        <>
          {/* Overview */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">Overview</Text>
            <View className="flex-row flex-wrap gap-4">
              <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
                <Text className="text-2xl font-bold text-foreground">{analytics.totalPosts}</Text>
                <Text className="text-sm text-muted">Total Posts</Text>
              </View>
              <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
                <Text className="text-2xl font-bold text-warning">{analytics.pendingPosts}</Text>
                <Text className="text-sm text-muted">Pending</Text>
              </View>
              <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
                <Text className="text-2xl font-bold text-primary">{analytics.acknowledgedPosts}</Text>
                <Text className="text-sm text-muted">In Progress</Text>
              </View>
              <View className="flex-1 min-w-[140px] bg-background rounded-lg p-3">
                <Text className="text-2xl font-bold text-success">{analytics.resolvedPosts}</Text>
                <Text className="text-sm text-muted">Resolved</Text>
              </View>
            </View>
          </View>

          {/* MTTR */}
          <View className="bg-surface rounded-xl p-6 items-center">
            <Text className="text-muted mb-2">Mean Time to Resolution</Text>
            <Text className="text-4xl font-bold text-foreground">{analytics.averageResolutionTime.toFixed(1)}h</Text>
          </View>

          {/* By Forum */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">By Forum</Text>
            <View className="gap-3">
              {Object.entries(analytics.byForum).map(([forum, data]) => (
                <View key={forum} className="flex-row items-center justify-between p-3 bg-background rounded-lg">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xl">{getForumIcon(forum as ForumType)}</Text>
                    <Text className="text-foreground font-medium capitalize">{forum.replace(/_/g, ' ')}</Text>
                  </View>
                  <View className="flex-row items-center gap-4">
                    <View className="items-end">
                      <Text className="text-foreground font-medium">{data.posts}</Text>
                      <Text className="text-xs text-muted">Posts</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-success font-medium">{data.resolved}</Text>
                      <Text className="text-xs text-muted">Resolved</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* By Severity */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-4">By Severity</Text>
            <View className="gap-3">
              {Object.entries(analytics.bySeverity).map(([severity, data]) => {
                const severityColor = 
                  severity === 'critical' ? colors.error :
                  severity === 'high' ? '#F97316' :
                  severity === 'medium' ? colors.warning :
                  colors.muted;
                
                return (
                  <View key={severity} className="flex-row items-center justify-between p-3 bg-background rounded-lg">
                    <View className="flex-row items-center gap-2">
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColor }} />
                      <Text className="text-foreground font-medium capitalize">{severity}</Text>
                    </View>
                    <View className="flex-row items-center gap-4">
                      <View className="items-end">
                        <Text className="text-foreground font-medium">{data.posts}</Text>
                        <Text className="text-xs text-muted">Posts</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-success font-medium">{data.resolved}</Text>
                        <Text className="text-xs text-muted">Resolved</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
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
        <Text className="text-muted mt-4">Loading forum data...</Text>
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
              <Text className="text-2xl font-bold text-foreground">JEDI Forum</Text>
              <Text className="text-muted">Crash Reports</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content */}
        <View className="pb-8">
          {activeTab === 'posts' && renderPosts()}
          {activeTab === 'forums' && renderForums()}
          {activeTab === 'analytics' && renderAnalytics()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
